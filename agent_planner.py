"""
Planner: blueprint → execution plan JSON.

Per spec §4.2, the planner takes a blueprint and emits a structured plan:
    {request_id, steps: [{tool, params}, ...]}

This is deliberately deterministic (no LLM). The CrewAI planner from
`couple_agents.py` is still used for qualitative tasks (style, timeline,
messaging) — those are distinct from the execution graph.

A single blueprint with N categories fans out into N sub-plans that can run
independently; this module returns a flat plan that the executor walks in
order. Parallelism is a future enhancement.
"""
from __future__ import annotations

import uuid
from typing import Any, Dict, List, Optional


def new_request_id() -> str:
    return f"req_{uuid.uuid4().hex[:12]}"


def plan_for_category(category: str, location: str, budget: int, top_k: int = 3) -> List[Dict[str, Any]]:
    """The six canonical steps from spec §4.2 for a single vendor category."""
    return [
        {"tool": "search_vendors",
         "params": {"category": category, "location": location, "budget": budget, "limit": 10}},
        {"tool": "rank_vendors",
         "params": {"budget": budget}},
        {"tool": "contact_vendor",
         "params": {"top_k": top_k,
                    "message": _default_outreach(category, location, budget)}},
        {"tool": "wait_for_responses",
         "params": {"min_responses": 1, "timeout_hours": 72}},
        {"tool": "compare_quotes", "params": {}},
        {"tool": "recommend_best", "params": {}},
    ]


def _default_outreach(category: str, location: str, budget: int) -> str:
    loc = location.title() if location else "our city"
    cat = category or "services"
    if budget > 0:
        return (f"Hi, we're planning a wedding in {loc} and are shortlisting {cat} "
                f"vendors in the ₹{budget:,} range. Could you share availability, "
                f"pricing, and a portfolio link?")
    return (f"Hi, we're planning a wedding in {loc} and are shortlisting {cat} "
            f"vendors. Could you share availability, pricing, and a portfolio link?")


def generate_plan(
    blueprint: Dict[str, Any],
    categories: Optional[List[str]] = None,
    request_id: Optional[str] = None,
    top_k: int = 3,
) -> Dict[str, Any]:
    """Convert a blueprint (spec §4.1) into an execution plan (spec §4.2).

    `categories` — override which categories to work on. Defaults to all
    categories present in the blueprint's `category_specs`.
    """
    ws = blueprint.get("wedding_summary", {}) or {}
    location = ws.get("city", "")
    budget_breakdown = blueprint.get("budget_breakdown", {}) or {}
    category_specs = blueprint.get("category_specs", {}) or {}

    if not categories:
        categories = list(category_specs.keys()) or list(budget_breakdown.keys())

    steps: List[Dict[str, Any]] = []
    for category in categories:
        cat_budget = int(budget_breakdown.get(category) or 0)
        steps.extend(plan_for_category(category, location, cat_budget, top_k=top_k))

    return {
        "request_id": request_id or new_request_id(),
        "blueprint_id": blueprint.get("id"),
        "couple_id": blueprint.get("couple_id"),
        "categories": categories,
        "context": {
            "location": location,
            "guest_count": ws.get("guest_count", 0),
            "budget": ws.get("budget", 0),
            "events": ws.get("events", []),
        },
        "steps": steps,
    }


def plan_from_query(query: str, user_id: int) -> Dict[str, Any]:
    """Lightweight plan for a free-form query (spec §6 `/agent/query`).

    Best-effort extraction: category, city, budget from the query string.
    Falls back to generic defaults. Kept simple on purpose — the LLM-driven
    intent detection already lives in `/api/ai/plan-wedding`.
    """
    q = (query or "").lower()

    CATEGORY_KEYWORDS = {
        "photography": ["photographer", "photograph", "photo", "photography"],
        "catering": ["caterer", "catering", "food", "banquet"],
        "venue": ["venue", "hall", "palace", "resort", "hotel"],
        "decoration": ["decor", "decoration", "florist"],
        "makeup": ["makeup", "mua"],
        "entertainment": ["dj", "band", "entertainment", "music"],
    }
    category = next(
        (cat for cat, keys in CATEGORY_KEYWORDS.items() if any(k in q for k in keys)),
        "venue",  # sensible default
    )

    CITY_KEYWORDS = ["mumbai", "delhi", "bangalore", "bengaluru", "hyderabad",
                     "chennai", "kolkata", "pune", "jaipur", "goa", "ahmedabad"]
    city = next((c for c in CITY_KEYWORDS if c in q), "")

    budget = 0
    import re
    # Match "1.5L", "150000", "₹1.5 lakh", "2 crore"
    lakh_match = re.search(r"(\d+(?:\.\d+)?)\s*(l|lakh|lac)", q)
    crore_match = re.search(r"(\d+(?:\.\d+)?)\s*(cr|crore|crores)", q)
    inr_match = re.search(r"(?:₹|rs\.?\s?)?\s*(\d{5,})", q)
    if crore_match:
        budget = int(float(crore_match.group(1)) * 10_000_000)
    elif lakh_match:
        budget = int(float(lakh_match.group(1)) * 100_000)
    elif inr_match:
        budget = int(inr_match.group(1))

    request_id = new_request_id()
    return {
        "request_id": request_id,
        "blueprint_id": None,
        "couple_id": user_id,
        "categories": [category],
        "context": {"location": city, "guest_count": 0, "budget": budget, "events": []},
        "steps": plan_for_category(category, city, budget, top_k=3),
        "query": query,
    }
