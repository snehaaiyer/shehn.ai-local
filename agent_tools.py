"""
Named tool registry for the agent executor.

Each tool is a pure function: `(params: dict, state: dict) -> dict`.
- `params` — input from the current plan step.
- `state` — shared mutable dict the executor threads through each step so
  later tools can read what earlier tools produced (e.g. `compare_quotes`
  reads the `quotes` that accumulated during `wait_for_responses`).

Returning `{"status": "waiting", ...}` tells the executor to pause the run.
The webhook handler resumes it by calling `executor.resume(request_id)`.
"""
from __future__ import annotations

from datetime import datetime
from typing import Any, Callable, Dict, List, Optional


# ── Tool dispatch registry ──────────────────────────────────────────────────
ToolFn = Callable[[Dict[str, Any], Dict[str, Any]], Dict[str, Any]]
_TOOLS: Dict[str, ToolFn] = {}


def register_tool(name: str) -> Callable[[ToolFn], ToolFn]:
    def _wrap(fn: ToolFn) -> ToolFn:
        _TOOLS[name] = fn
        return fn
    return _wrap


def get_tool(name: str) -> Optional[ToolFn]:
    return _TOOLS.get(name)


def list_tools() -> List[str]:
    return sorted(_TOOLS.keys())


# ── Late-bound store injection ──────────────────────────────────────────────
# The tools operate on the same in-memory dicts the server uses. To avoid a
# circular import with simple_unified_server.py, stores are injected once at
# startup via `bind_stores(...)`.

_stores: Dict[str, Any] = {
    "vendor_profiles": None,
    "blueprints": None,
    "quotes": None,
    "conversations": None,
    "messages": None,
    "vendor_interactions": None,
    "id_factory": None,
}


def bind_stores(
    vendor_profiles: Dict[int, dict],
    blueprints: Dict[int, dict],
    quotes: Dict[int, dict],
    conversations: Dict[int, dict],
    messages: Dict[int, dict],
    vendor_interactions: Dict[str, dict],
    id_factory: Callable[[str], int],
) -> None:
    _stores["vendor_profiles"] = vendor_profiles
    _stores["blueprints"] = blueprints
    _stores["quotes"] = quotes
    _stores["conversations"] = conversations
    _stores["messages"] = messages
    _stores["vendor_interactions"] = vendor_interactions
    _stores["id_factory"] = id_factory


def _require(name: str) -> Any:
    v = _stores.get(name)
    if v is None:
        raise RuntimeError(f"agent_tools store '{name}' not bound — call bind_stores() at startup")
    return v


# ── Tools (match spec §4.4 + §3.2 wait step) ────────────────────────────────

@register_tool("search_vendors")
def search_vendors(params: Dict[str, Any], state: Dict[str, Any]) -> Dict[str, Any]:
    """Find vendors matching category + location, ordered by rating.

    Spec: search_vendors(location, category, budget) → {vendors[]}
    """
    category = (params.get("category") or "").lower()
    location = (params.get("location") or "").lower()
    budget = int(params.get("budget") or 0)
    limit = int(params.get("limit") or 10)

    profiles = _require("vendor_profiles").values()

    def _match(vp: dict) -> bool:
        if vp.get("approval_status") != "approved":
            return False
        if category and (vp.get("category") or "").lower() != category:
            return False
        if location:
            vp_city = (vp.get("city") or "").lower()
            if location not in vp_city and vp_city not in location:
                return False
        return True

    hits = [vp for vp in profiles if _match(vp)]
    # Soft budget filter: if vendor lists a starting price, keep ones within 2x budget
    if budget > 0:
        def _in_range(vp: dict) -> bool:
            start = int(vp.get("starting_price") or 0)
            return start == 0 or start <= budget * 2
        hits = [vp for vp in hits if _in_range(vp)]

    hits.sort(key=lambda vp: (vp.get("rating") or 0, vp.get("years_experience") or 0), reverse=True)
    vendors = [
        {
            "vendor_id": vp.get("id"),
            "name": vp.get("name"),
            "category": vp.get("category"),
            "city": vp.get("city"),
            "rating": vp.get("rating"),
            "years_experience": vp.get("years_experience"),
            "starting_price": vp.get("starting_price"),
        }
        for vp in hits[:limit]
    ]
    state["vendors"] = vendors
    return {"status": "ok", "vendors": vendors, "count": len(vendors)}


@register_tool("rank_vendors")
def rank_vendors(params: Dict[str, Any], state: Dict[str, Any]) -> Dict[str, Any]:
    """Rank vendors by a simple multi-factor score. Falls back to `state.vendors`.

    Spec: rank_vendors(vendors[]) → {ranked_vendors[]}
    Score: budget_fit 40 + rating 30 + experience 20 + recency 10.
    """
    vendors = params.get("vendors") or state.get("vendors") or []
    budget = int(params.get("budget") or state.get("budget") or 0)

    def _score(v: dict) -> int:
        rating = float(v.get("rating") or 0)  # 0-5
        years = int(v.get("years_experience") or 0)
        start = int(v.get("starting_price") or 0)

        # Budget fit: full marks if starting_price known AND <= budget
        if budget > 0 and start > 0:
            if start <= budget:
                budget_score = 40
            elif start <= budget * 1.25:
                budget_score = 25
            else:
                budget_score = 10
        else:
            budget_score = 20  # unknown — neutral

        rating_score = int((rating / 5.0) * 30)
        exp_score = min(years, 20)
        recency_score = 10
        return budget_score + rating_score + exp_score + recency_score

    ranked = sorted(
        [{**v, "match_score": _score(v)} for v in vendors],
        key=lambda v: v["match_score"],
        reverse=True,
    )
    state["ranked_vendors"] = ranked
    return {"status": "ok", "ranked_vendors": ranked}


@register_tool("contact_vendor")
def contact_vendor(params: Dict[str, Any], state: Dict[str, Any]) -> Dict[str, Any]:
    """Open a conversation with each vendor and record a vendor_interaction row.

    Spec: contact_vendor(vendor_ids[], message) → {contacted}
    Accepts `top_k` to take the first N from `state.ranked_vendors`.
    """
    vendor_ids: List[int] = list(params.get("vendor_ids") or [])
    top_k = int(params.get("top_k") or 0)
    message = params.get("message") or "Hi, we'd like a quote for our wedding. Could you share availability and pricing?"
    request_id = state.get("request_id")
    blueprint_id = state.get("blueprint_id")
    couple_id = state.get("couple_id", 1)

    if top_k and not vendor_ids:
        ranked = state.get("ranked_vendors") or []
        vendor_ids = [v["vendor_id"] for v in ranked[:top_k] if v.get("vendor_id")]

    conversations = _require("conversations")
    messages = _require("messages")
    vendor_interactions = _require("vendor_interactions")
    vendor_profiles = _require("vendor_profiles")
    _id = _require("id_factory")

    contacted: List[dict] = []
    now = datetime.now().isoformat()
    for vid in vendor_ids:
        vp = vendor_profiles.get(vid, {})
        conv_id = _id("conv")
        conversations[conv_id] = {
            "id": conv_id, "couple_id": couple_id, "vendor_id": vid,
            "blueprint_id": blueprint_id,
            "subject": f"Inquiry (request {request_id})",
            "status": "active", "other_party_name": vp.get("name", f"Vendor {vid}"),
            "other_party_category": vp.get("category", ""),
            "unread_count": 0, "created_at": now,
            "last_message": message[:60], "last_message_at": now,
        }
        msg_id = _id("msg")
        messages[msg_id] = {
            "id": msg_id, "conversation_id": conv_id,
            "sender_role": "couple", "sender_id": couple_id,
            "content": message, "message_type": "text",
            "read_at": None, "created_at": now,
        }
        interaction_key = f"{request_id}:{vid}"
        vendor_interactions[interaction_key] = {
            "request_id": request_id,
            "vendor_id": vid,
            "vendor_name": vp.get("name", f"Vendor {vid}"),
            "conversation_id": conv_id,
            "status": "contacted",
            "quote": None,
            "contacted_at": now,
            "responded_at": None,
        }
        contacted.append({"vendor_id": vid, "conversation_id": conv_id})

    state["contacted"] = contacted
    return {"status": "ok", "contacted": contacted, "count": len(contacted)}


@register_tool("wait_for_responses")
def wait_for_responses(params: Dict[str, Any], state: Dict[str, Any]) -> Dict[str, Any]:
    """Pause the run until vendor responses arrive.

    Spec: §3.2 Wait step. The executor sees `status: waiting` and suspends.
    `/webhook/events` writes into `vendor_interactions` and calls `executor.resume(request_id)`.
    """
    request_id = state.get("request_id")
    vendor_interactions = _require("vendor_interactions")
    responded = [vi for vi in vendor_interactions.values()
                 if vi.get("request_id") == request_id and vi.get("status") == "responded"]
    min_responses = int(params.get("min_responses") or 1)
    timeout_hours = int(params.get("timeout_hours") or 72)

    if len(responded) >= min_responses:
        return {"status": "ok", "responded_count": len(responded), "reason": "threshold met"}

    return {
        "status": "waiting",
        "reason": f"need {min_responses} response(s), have {len(responded)}",
        "timeout_hours": timeout_hours,
        "resume_on": "vendor.response.received",
    }


@register_tool("compare_quotes")
def compare_quotes(params: Dict[str, Any], state: Dict[str, Any]) -> Dict[str, Any]:
    """Aggregate responses for this request_id into a comparison table.

    Spec: compare_quotes(request_id) → {comparison}
    """
    request_id = state.get("request_id") or params.get("request_id")
    vendor_interactions = _require("vendor_interactions")

    rows: List[dict] = []
    for vi in vendor_interactions.values():
        if vi.get("request_id") != request_id:
            continue
        if vi.get("status") != "responded" or not vi.get("quote"):
            continue
        q = vi["quote"]
        rows.append({
            "vendor_id": vi.get("vendor_id"),
            "vendor_name": vi.get("vendor_name"),
            "total": int(q.get("total") or 0),
            "message": q.get("message", ""),
            "inclusions": q.get("inclusions", ""),
            "responded_at": vi.get("responded_at"),
        })

    rows.sort(key=lambda r: r["total"] if r["total"] > 0 else 10**9)
    summary = {
        "count": len(rows),
        "min_total": rows[0]["total"] if rows else 0,
        "max_total": rows[-1]["total"] if rows else 0,
        "avg_total": int(sum(r["total"] for r in rows) / len(rows)) if rows else 0,
    }
    comparison = {"rows": rows, "summary": summary}
    state["comparison"] = comparison
    return {"status": "ok", "comparison": comparison}


@register_tool("recommend_best")
def recommend_best(params: Dict[str, Any], state: Dict[str, Any]) -> Dict[str, Any]:
    """Pick the best row from the comparison (lowest total within budget, else lowest overall).

    Spec: recommend_best(comparison) → {recommendation}
    Does NOT book — only recommends. Spec §8 requires user approval before booking.
    """
    comparison = params.get("comparison") or state.get("comparison") or {}
    rows: List[dict] = comparison.get("rows") or []
    budget = int(state.get("budget") or 0)

    if not rows:
        rec = {"vendor_id": None, "reason": "No vendor responses to rank."}
    else:
        within_budget = [r for r in rows if budget == 0 or r["total"] <= budget]
        pick = within_budget[0] if within_budget else rows[0]
        reason = (
            f"Lowest quote within budget (₹{pick['total']:,})."
            if budget and pick["total"] <= budget
            else f"Lowest quote overall (₹{pick['total']:,}); above or no budget set."
        )
        rec = {
            "vendor_id": pick["vendor_id"],
            "vendor_name": pick["vendor_name"],
            "total": pick["total"],
            "reason": reason,
            "requires_approval": True,
        }

    state["recommendation"] = rec
    return {"status": "ok", "recommendation": rec}
