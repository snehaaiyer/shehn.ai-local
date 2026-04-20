"""
Sequential executor with wait/resume (spec §4.3).

Responsibilities:
- Walk a plan's steps in order.
- Dispatch each step to the named tool in `agent_tools`.
- Persist per-step logs to `agent_runs` state.
- If a tool returns `status="waiting"`, suspend the run. The webhook handler
  writes into `_vendor_interactions` and then calls `resume(request_id)`.

Deliberately NOT OpenClaw. OpenClaw is a negotiation/draft-approval runtime;
the source was deleted from this repo and only compiled .pyc stubs exist.
This executor does the job the spec asks for (plan → execute → wait →
resume) without depending on recovered OpenClaw code. OpenClaw can plug in
later as a tool (`draft_negotiation_message`) or replace this executor when
the real source is recovered.
"""
from __future__ import annotations

import logging
from datetime import datetime
from typing import Any, Callable, Dict, List, Optional

from agent_tools import get_tool

logger = logging.getLogger(__name__)


# Run states
PENDING = "pending"
RUNNING = "running"
WAITING = "waiting"
COMPLETED = "completed"
FAILED = "failed"


class AgentExecutor:
    """
    Simple, synchronous-by-default executor with explicit wait/resume.

    `runs_store` is a dict keyed by request_id containing the full run
    record. Using dict matches the existing in-memory pattern in
    simple_unified_server.py. Swap for SQL when state migration lands.
    """

    def __init__(self, runs_store: Dict[str, dict], on_event: Optional[Callable[[dict], None]] = None):
        self.runs = runs_store
        self.on_event = on_event or (lambda evt: None)

    # ── Public API ──────────────────────────────────────────────────────────

    def start(self, plan: Dict[str, Any]) -> Dict[str, Any]:
        """Create an agent_run record and execute until completion or wait."""
        request_id = plan["request_id"]
        run = {
            "request_id": request_id,
            "blueprint_id": plan.get("blueprint_id"),
            "couple_id": plan.get("couple_id"),
            "status": PENDING,
            "current_step": 0,
            "plan": plan,
            "state": {
                "request_id": request_id,
                "blueprint_id": plan.get("blueprint_id"),
                "couple_id": plan.get("couple_id"),
                "budget": (plan.get("context") or {}).get("budget", 0),
            },
            "logs": [],
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
            "completed_at": None,
        }
        self.runs[request_id] = run
        self._emit("agent_run.started", {"request_id": request_id})
        return self._execute(run)

    def resume(self, request_id: str) -> Dict[str, Any]:
        """Resume a waiting run. Called from webhook handler after new data arrives."""
        run = self.runs.get(request_id)
        if not run:
            raise KeyError(f"Unknown request_id {request_id!r}")
        if run["status"] not in (WAITING, PENDING):
            logger.info(f"resume({request_id}): status is {run['status']}, nothing to do")
            return run
        self._emit("agent_run.resumed", {"request_id": request_id, "at_step": run["current_step"]})
        return self._execute(run)

    def get(self, request_id: str) -> Optional[Dict[str, Any]]:
        return self.runs.get(request_id)

    def list_runs(self, couple_id: Optional[int] = None) -> List[Dict[str, Any]]:
        rows = list(self.runs.values())
        if couple_id is not None:
            rows = [r for r in rows if r.get("couple_id") == couple_id]
        rows.sort(key=lambda r: r["created_at"], reverse=True)
        return rows

    # ── Execution loop ──────────────────────────────────────────────────────

    def _execute(self, run: Dict[str, Any]) -> Dict[str, Any]:
        run["status"] = RUNNING
        plan = run["plan"]
        steps: List[dict] = plan["steps"]
        state = run["state"]

        while run["current_step"] < len(steps):
            step_idx = run["current_step"]
            step = steps[step_idx]
            tool_name = step.get("tool")
            params = step.get("params", {}) or {}

            tool = get_tool(tool_name)
            if not tool:
                self._log(run, step_idx, tool_name, params, None,
                          error=f"Unknown tool {tool_name!r}")
                run["status"] = FAILED
                run["updated_at"] = datetime.now().isoformat()
                self._emit("agent_run.failed", {"request_id": run["request_id"],
                                                "reason": f"unknown tool {tool_name}"})
                return run

            try:
                resolved_params = self._resolve_refs(params, state)
                result = tool(resolved_params, state)
            except Exception as e:  # noqa: BLE001 — surface any tool failure to the run record
                logger.exception(f"Tool {tool_name} raised at step {step_idx}")
                self._log(run, step_idx, tool_name, params, None, error=str(e))
                run["status"] = FAILED
                run["updated_at"] = datetime.now().isoformat()
                self._emit("agent_run.failed", {"request_id": run["request_id"],
                                                "reason": str(e)})
                return run

            self._log(run, step_idx, tool_name, params, result)

            if result.get("status") == "waiting":
                run["status"] = WAITING
                run["updated_at"] = datetime.now().isoformat()
                self._emit("agent_run.waiting", {
                    "request_id": run["request_id"],
                    "at_step": step_idx,
                    "reason": result.get("reason", ""),
                })
                return run

            run["current_step"] = step_idx + 1
            run["updated_at"] = datetime.now().isoformat()

        run["status"] = COMPLETED
        run["completed_at"] = datetime.now().isoformat()
        run["updated_at"] = run["completed_at"]
        self._emit("agent_run.completed", {
            "request_id": run["request_id"],
            "recommendation": state.get("recommendation"),
        })
        return run

    # ── Helpers ─────────────────────────────────────────────────────────────

    def _log(self, run: dict, idx: int, tool: str, params: dict, result: Optional[dict],
             error: Optional[str] = None) -> None:
        entry = {
            "step": idx,
            "tool": tool,
            "params": params,
            "result": result,
            "error": error,
            "at": datetime.now().isoformat(),
        }
        run["logs"].append(entry)

    def _resolve_refs(self, params: dict, state: dict) -> dict:
        """Allow plan params to reference state values via `{"$state": "key"}`."""
        out: Dict[str, Any] = {}
        for k, v in params.items():
            if isinstance(v, dict) and "$state" in v and len(v) == 1:
                out[k] = state.get(v["$state"])
            else:
                out[k] = v
        return out

    def _emit(self, event_type: str, data: dict) -> None:
        try:
            self.on_event({"event": event_type, "data": data, "at": datetime.now().isoformat()})
        except Exception:  # noqa: BLE001
            logger.exception("on_event handler raised; ignoring")
