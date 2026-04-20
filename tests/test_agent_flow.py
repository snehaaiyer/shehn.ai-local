"""
End-to-end test of the agent orchestration layer.

Exercises the full spec §3.2 loop: Input → Plan → Execute → Wait → Resume → Decide → Output.

Run in isolation (no HTTP server needed):
    python tests/test_agent_flow.py
"""
from __future__ import annotations

import os
import sys

# Repo root on path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import datetime

import agent_tools
from agent_executor import AgentExecutor
from agent_planner import generate_plan, plan_from_query


# ── Fixtures: mimic the server's in-memory stores ───────────────────────────
_id_counters = {"conv": 1, "msg": 1}

def make_id(kind: str) -> int:
    v = _id_counters[kind]
    _id_counters[kind] += 1
    return v


def seed_vendors() -> dict:
    """5 Bangalore photographers with varying ratings/prices."""
    base = {"category": "photography", "city": "Bangalore", "approval_status": "approved"}
    return {
        101: {**base, "id": 101, "name": "Frames of Love",    "rating": 4.9, "years_experience": 8, "starting_price": 120000},
        102: {**base, "id": 102, "name": "Candid Stories",     "rating": 4.7, "years_experience": 5, "starting_price": 90000},
        103: {**base, "id": 103, "name": "Moments Studio",     "rating": 4.5, "years_experience": 10, "starting_price": 150000},
        104: {**base, "id": 104, "name": "Lens & Light",       "rating": 4.3, "years_experience": 3, "starting_price": 70000},
        105: {**base, "id": 105, "name": "Eternal Captures",   "rating": 4.8, "years_experience": 6, "starting_price": 110000},
        # An unapproved vendor that should be filtered out
        106: {"id": 106, "category": "photography", "city": "Bangalore", "approval_status": "pending",
              "name": "Rogue Studio", "rating": 4.9, "years_experience": 2, "starting_price": 50000},
        # Wrong category
        201: {"id": 201, "category": "venue", "city": "Bangalore", "approval_status": "approved",
              "name": "Grand Hall", "rating": 4.6, "years_experience": 10, "starting_price": 400000},
    }


def bind_fresh_stores():
    stores = {
        "vendor_profiles": seed_vendors(),
        "blueprints": {},
        "quotes": {},
        "conversations": {},
        "messages": {},
        "vendor_interactions": {},
        "agent_runs": {},
    }
    agent_tools.bind_stores(
        vendor_profiles=stores["vendor_profiles"],
        blueprints=stores["blueprints"],
        quotes=stores["quotes"],
        conversations=stores["conversations"],
        messages=stores["messages"],
        vendor_interactions=stores["vendor_interactions"],
        id_factory=make_id,
    )
    return stores


# ── Tests ───────────────────────────────────────────────────────────────────

def assert_eq(actual, expected, msg: str) -> None:
    assert actual == expected, f"FAIL: {msg}\n  expected: {expected!r}\n  actual:   {actual!r}"


def test_plan_shape():
    print("▶ test_plan_shape")
    blueprint = {
        "id": 42, "couple_id": 7,
        "wedding_summary": {"city": "Bangalore", "guest_count": 200, "budget": 2500000, "events": ["ceremony"]},
        "budget_breakdown": {"photography": 250000, "venue": 800000},
        "category_specs": {"photography": {}, "venue": {}},
    }
    plan = generate_plan(blueprint)
    assert plan["request_id"].startswith("req_"), "request_id malformed"
    assert_eq(plan["blueprint_id"], 42, "blueprint_id threaded")
    assert_eq(plan["couple_id"], 7, "couple_id threaded")
    assert_eq(len(plan["steps"]), 12, "2 categories × 6 steps per category")
    tools_in_plan = [s["tool"] for s in plan["steps"]]
    expected = ["search_vendors", "rank_vendors", "contact_vendor",
                "wait_for_responses", "compare_quotes", "recommend_best"] * 2
    assert_eq(tools_in_plan, expected, "step order matches spec")
    print("  ✓ plan shape correct (12 steps, 2 categories)")


def test_plan_from_query():
    print("▶ test_plan_from_query")
    plan = plan_from_query("Find photographer under 1.5L in Bangalore", user_id=7)
    assert_eq(plan["categories"], ["photography"], "category extraction")
    assert_eq(plan["context"]["location"], "bangalore", "city extraction")
    assert_eq(plan["context"]["budget"], 150000, "₹1.5L parsing")
    assert_eq(len(plan["steps"]), 6, "single-category plan")
    print("  ✓ query → plan extraction works")


def test_search_filters_by_approval_and_category():
    print("▶ test_search_filters_by_approval_and_category")
    stores = bind_fresh_stores()
    state = {}
    result = agent_tools.get_tool("search_vendors")(
        {"category": "photography", "location": "Bangalore", "budget": 150000, "limit": 10},
        state,
    )
    names = [v["name"] for v in result["vendors"]]
    assert "Rogue Studio" not in names, "unapproved vendor leaked"
    assert "Grand Hall" not in names, "wrong category leaked"
    assert_eq(result["count"], 5, "5 approved photography vendors")
    # Sorted by rating desc
    ratings = [v["rating"] for v in result["vendors"]]
    assert ratings == sorted(ratings, reverse=True), f"not rating-sorted: {ratings}"
    print(f"  ✓ filtered correctly: {names}")


def test_full_flow_waits_then_resumes():
    print("▶ test_full_flow_waits_then_resumes")
    stores = bind_fresh_stores()
    executor = AgentExecutor(runs_store=stores["agent_runs"])

    blueprint = {
        "id": 1, "couple_id": 99,
        "wedding_summary": {"city": "Bangalore", "guest_count": 200, "budget": 2000000, "events": ["ceremony"]},
        "budget_breakdown": {"photography": 150000},
        "category_specs": {"photography": {}},
    }
    plan = generate_plan(blueprint, top_k=3)
    run = executor.start(plan)

    assert_eq(run["status"], "waiting", "should pause at wait_for_responses")
    # Walked through search + rank + contact before waiting
    assert_eq(run["current_step"], 3, "paused at step index 3 (wait_for_responses)")

    # 3 vendors were contacted — check interactions
    interactions = [vi for vi in stores["vendor_interactions"].values()
                    if vi["request_id"] == plan["request_id"]]
    assert_eq(len(interactions), 3, "top_k=3 vendors contacted")
    assert all(vi["status"] == "contacted" for vi in interactions), "all marked contacted"
    conv_ids = [vi["conversation_id"] for vi in interactions]
    assert len(set(conv_ids)) == 3, "each contact created distinct conversation"
    assert_eq(len(stores["messages"]), 3, "each contact wrote 1 outreach message")

    # Simulate vendor responses via webhook payload shape.
    # Respond FROM the actually-contacted vendors (ranked top 3), not hardcoded IDs —
    # that way changes to ranking weights don't break this test.
    request_id = plan["request_id"]
    contacted_vids = [vi["vendor_id"] for vi in interactions]
    # Prices chosen so the cheapest is the FIRST contacted vendor (top-ranked).
    prices = [110000, 125000, 140000]
    for vid, price in zip(contacted_vids, prices):
        key = f"{request_id}:{vid}"
        stores["vendor_interactions"][key]["status"] = "responded"
        stores["vendor_interactions"][key]["responded_at"] = datetime.now().isoformat()
        stores["vendor_interactions"][key]["quote"] = {
            "total": price,
            "message": f"Interested! Our package is ₹{price:,}",
            "inclusions": "Full day + 2 photographers + album",
        }

    resumed = executor.resume(request_id)
    assert_eq(resumed["status"], "completed", "completes after responses arrive")

    rec = resumed["state"]["recommendation"]
    assert rec is not None, "recommendation produced"
    # Cheapest within 150k budget is the first contacted vendor at ₹110,000
    assert_eq(rec["vendor_id"], contacted_vids[0], "picked cheapest within budget")
    assert_eq(rec["total"], 110000, "recommendation total matches cheapest quote")
    assert rec["requires_approval"] is True, "flagged for user approval (spec §8)"
    print(f"  ✓ flow completed: rec={rec['vendor_name']} at ₹{rec['total']:,}")


def test_executor_logs_every_step():
    print("▶ test_executor_logs_every_step")
    stores = bind_fresh_stores()
    executor = AgentExecutor(runs_store=stores["agent_runs"])
    plan = plan_from_query("Find photographer under 1.5L in Bangalore", user_id=1)
    run = executor.start(plan)
    # 4 steps log before wait: search, rank, contact, wait (the wait step logs too)
    assert_eq(len(run["logs"]), 4, "logged search+rank+contact+wait")
    for entry in run["logs"]:
        assert "at" in entry and "tool" in entry, "log entry shape"
    print(f"  ✓ logged {len(run['logs'])} steps")


def test_unknown_tool_fails_gracefully():
    print("▶ test_unknown_tool_fails_gracefully")
    stores = bind_fresh_stores()
    executor = AgentExecutor(runs_store=stores["agent_runs"])
    plan = {
        "request_id": "req_test_bad",
        "blueprint_id": None, "couple_id": 1, "categories": [],
        "context": {}, "steps": [{"tool": "nonexistent_tool", "params": {}}],
    }
    run = executor.start(plan)
    assert_eq(run["status"], "failed", "marked failed on unknown tool")
    assert run["logs"][-1]["error"], "error recorded"
    print("  ✓ unknown tool handled gracefully")


def test_empty_vendor_pool_still_completes():
    print("▶ test_empty_vendor_pool_still_completes")
    stores = bind_fresh_stores()
    # Wipe vendors
    stores["vendor_profiles"].clear()
    agent_tools.bind_stores(
        vendor_profiles=stores["vendor_profiles"],
        blueprints=stores["blueprints"], quotes=stores["quotes"],
        conversations=stores["conversations"], messages=stores["messages"],
        vendor_interactions=stores["vendor_interactions"],
        id_factory=make_id,
    )
    executor = AgentExecutor(runs_store=stores["agent_runs"])
    plan = plan_from_query("Find photographer in Bangalore", user_id=1)
    run = executor.start(plan)
    # No vendors → no contact → waiting forever with 0 responses, but min_responses=1
    assert_eq(run["status"], "waiting", "correctly waits even with no vendors")
    print("  ✓ no vendor pool handled (waits, doesn't crash)")


if __name__ == "__main__":
    print("━" * 60)
    print("Shehn.AI agent orchestration — end-to-end test")
    print("━" * 60)
    tests = [
        test_plan_shape,
        test_plan_from_query,
        test_search_filters_by_approval_and_category,
        test_full_flow_waits_then_resumes,
        test_executor_logs_every_step,
        test_unknown_tool_fails_gracefully,
        test_empty_vendor_pool_still_completes,
    ]
    failed = 0
    for t in tests:
        try:
            t()
        except AssertionError as e:
            print(f"  ✗ {e}")
            failed += 1
        except Exception as e:
            print(f"  ✗ UNEXPECTED: {type(e).__name__}: {e}")
            failed += 1
    print("━" * 60)
    if failed:
        print(f"❌ {failed}/{len(tests)} tests failed")
        sys.exit(1)
    print(f"✅ All {len(tests)} tests passed")
