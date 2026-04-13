"""
Shehn.AI — Couple-Facing AI Agents
5 specialized CrewAI agents that help couples plan their wedding.

Agents:
  1. Budget Optimizer    — allocate budget, find savings, rebalance categories
  2. Vendor Matcher      — score & rank vendor quotes against blueprint
  3. Style Consultant    — theme recommendations, decor, cultural suggestions
  4. Timeline Planner    — multi-day scheduling, event coordination
  5. Communication Coach — draft messages to vendors (inquiry, negotiation, booking)
"""

import os
import json
import logging
import re
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

# ── Try to import CrewAI (graceful fallback if not installed) ──
try:
    from crewai import Agent, Task, Crew, LLM, Process
    CREWAI_INSTALLED = True
except ImportError:
    CREWAI_INSTALLED = False
    logger.warning("CrewAI not installed — couple agents will use direct LLM fallback")


class CoupleAgents:
    """5 specialized AI agents for the couple's wedding planning journey."""

    def __init__(self):
        self.llm = None
        self.agents_ready = False

        if not CREWAI_INSTALLED:
            return

        # Try Ollama LLM (local, free)
        try:
            self.llm = LLM(
                model="ollama/glm4",
                base_url=os.getenv("OLLAMA_URL", "http://localhost:11434").replace("/api/generate", ""),
                temperature=0.7,
                max_tokens=2000,
            )
            self._init_agents()
            self.agents_ready = True
            logger.info("Couple agents initialized (Ollama/GLM4)")
        except Exception as e:
            logger.warning(f"Couple agents LLM init failed: {e}")

    # ────────────────────────────────────────────
    # Agent Definitions
    # ────────────────────────────────────────────

    def _init_agents(self):
        self.budget_agent = Agent(
            role="Wedding Budget Optimizer",
            goal="Create optimal budget allocations for Indian weddings using real market benchmarks",
            backstory=(
                "You are a senior Indian wedding financial planner with 15 years of experience. "
                "You know exact per-plate rates, venue costs by city tier, photographer day rates, "
                "and decoration budgets for Mumbai, Delhi, Bangalore, Hyderabad, Chennai, Kolkata, "
                "Jaipur, and Pune. You think in lakhs and crores. You optimize for maximum value "
                "while respecting cultural requirements (mandap, mehendi, sangeet, etc)."
            ),
            llm=self.llm,
            verbose=False,
            max_iter=1,
        )

        self.vendor_agent = Agent(
            role="Wedding Vendor Matching Specialist",
            goal="Score and rank vendors against couple requirements using multi-factor analysis",
            backstory=(
                "You are an expert at evaluating Indian wedding vendors. You compare quotes on "
                "7 factors: budget alignment (25pts), style compatibility (20pts), location (15pts), "
                "quality rating (15pts), experience (10pts), availability (10pts), special factors (5pts). "
                "You know that a 4.5-star caterer charging per-plate in Mumbai is different from one in "
                "Jaipur. You always explain WHY a vendor ranks high or low."
            ),
            llm=self.llm,
            verbose=False,
            max_iter=1,
        )

        self.style_agent = Agent(
            role="Wedding Style & Culture Consultant",
            goal="Recommend cohesive wedding themes blending modern aesthetics with Indian traditions",
            backstory=(
                "You are a creative director who has styled 500+ Indian weddings. You understand "
                "the difference between a Royal Rajasthani theme and a Minimalist South Indian one. "
                "You know trending palettes (sage + rose, dusty blue + gold), mandap styles, "
                "lighting setups, and how to make Instagram-worthy decor within budget. You respect "
                "religious and cultural requirements across Hindu, Muslim, Sikh, Christian ceremonies."
            ),
            llm=self.llm,
            verbose=False,
            max_iter=1,
        )

        self.timeline_agent = Agent(
            role="Wedding Timeline Architect",
            goal="Create detailed multi-day event schedules for Indian weddings",
            backstory=(
                "You are a wedding coordinator who has planned 300+ Indian weddings. You know that "
                "a typical North Indian wedding spans 3-5 days (mehendi, sangeet, haldi, ceremony, reception) "
                "while a South Indian wedding might be 2-3 days. You schedule vendor arrivals, "
                "makeup timings, baraat processions, phera timings, and reception performances. "
                "You always build in buffer time because Indian weddings NEVER start on time."
            ),
            llm=self.llm,
            verbose=False,
            max_iter=1,
        )

        self.comms_agent = Agent(
            role="Wedding Communication Coach",
            goal="Draft professional vendor communications for couples",
            backstory=(
                "You help couples write perfect messages to vendors — inquiries that get responses, "
                "negotiations that are firm but polite, and booking confirmations that protect the couple. "
                "You know Indian wedding vendor etiquette: when to ask for a tasting, how to negotiate "
                "per-plate rates, when to request a site visit, and how to politely decline. "
                "You always keep messages concise (2-3 sentences) and warm."
            ),
            llm=self.llm,
            verbose=False,
            max_iter=1,
        )

    # ────────────────────────────────────────────
    # Agent Methods (called from server endpoints)
    # ────────────────────────────────────────────

    def analyze_quote(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Budget agent analyzes a vendor quote against allocated budget."""
        if not self.agents_ready:
            return {"success": False, "error": "Agents not ready"}

        quote = data.get("quote", {})
        budget_allocated = data.get("budget_allocated", 0)
        category = data.get("category", "")
        wedding_summary = data.get("wedding_summary", {})

        task = Task(
            description=f"""Analyze this {category} vendor quote for an Indian wedding in {wedding_summary.get('city', 'India')}.
Quote total: ₹{quote.get('total_estimated_price', 0):,}
Budget allocated: ₹{budget_allocated:,}
Guests: {wedding_summary.get('guest_count', 200)}
Pricing: {json.dumps(quote.get('category_pricing', {}))}
Inclusions: {quote.get('inclusions', 'N/A')}

Provide: value_rating (good/fair/expensive), market_comparison, strengths, concerns, negotiation_tip, budget_impact.
Respond ONLY with valid JSON.""",
            expected_output="JSON with value_rating, market_comparison, strengths, concerns, negotiation_tip, budget_impact",
            agent=self.budget_agent,
        )
        return self._run_single(task, "analysis")

    def match_vendors(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Vendor agent scores and ranks quotes using 7-factor algorithm."""
        if not self.agents_ready:
            return {"success": False, "error": "Agents not ready"}

        quotes = data.get("quotes", [])[:8]
        category_spec = data.get("category_spec", {})
        budget_allocated = data.get("budget_allocated", 0)

        vendors_summary = "\n".join([
            f"- {q.get('vendor_name','?')}: ₹{q.get('total_estimated_price',0):,}, "
            f"rating {q.get('vendor_rating',0)}, {q.get('vendor_experience',0)} yrs. "
            f"Inclusions: {q.get('inclusions','N/A')[:80]}"
            for q in quotes
        ])

        task = Task(
            description=f"""Rank these vendors for budget ₹{budget_allocated:,}.
Requirements: {json.dumps(category_spec.get('requirements', {}))}

Score each on: Budget Alignment (25), Style (20), Location (15), Quality (15), Experience (10), Availability (10), Specials (5). Total out of 100.

Vendors:
{vendors_summary}

Return JSON array sorted best-first: [{{"vendor_name": "...", "match_score": 85, "reason": "1 sentence"}}]""",
            expected_output="JSON array of vendor rankings with match_score and reason",
            agent=self.vendor_agent,
        )
        return self._run_single(task, "rankings")

    def optimize_budget(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Budget agent suggests reallocations across categories."""
        if not self.agents_ready:
            return {"success": False, "error": "Agents not ready"}

        budget_breakdown = data.get("budget_breakdown", {})
        wedding_summary = data.get("wedding_summary", {})
        quotes_by_category = data.get("quotes_by_category", {})

        lowest_quotes = {cat: f"₹{min(q.get('total_estimated_price', 0) for q in qs):,}"
                         for cat, qs in quotes_by_category.items() if qs}

        task = Task(
            description=f"""Indian wedding in {wedding_summary.get('city', 'India')}, {wedding_summary.get('guest_count', 200)} guests, total ₹{wedding_summary.get('budget', 0):,}.

Current allocation: {json.dumps(budget_breakdown)}
Lowest quotes received: {json.dumps(lowest_quotes)}

Suggest budget reallocations. Return JSON:
{{"suggestions": ["..."], "recommended_reallocation": {{"category": amount}}, "potential_savings": "₹X", "priority_spend": "1 sentence"}}""",
            expected_output="JSON with suggestions, recommended_reallocation, potential_savings, priority_spend",
            agent=self.budget_agent,
        )
        return self._run_single(task, "optimization")

    def suggest_style(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Style agent recommends themes and decor."""
        if not self.agents_ready:
            return {"success": False, "error": "Agents not ready"}

        preferences = data.get("preferences", {})

        task = Task(
            description=f"""Based on these wedding preferences, suggest a cohesive style direction:
City: {preferences.get('city', 'Mumbai')}
Budget: ₹{preferences.get('budget', 2000000):,}
Theme preference: {preferences.get('theme', 'not specified')}
Season: {preferences.get('season', 'winter')}
Wedding type: {preferences.get('wedding_type', 'Hindu')}

Provide: theme_name, color_palette (3-4 colors), decor_direction, mandap_style, lighting, floral_notes, estimated_decor_budget.
Respond ONLY with valid JSON.""",
            expected_output="JSON with theme details and budget estimate",
            agent=self.style_agent,
        )
        return self._run_single(task, "style")

    def generate_timeline(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Timeline agent creates multi-day event schedule."""
        if not self.agents_ready:
            return {"success": False, "error": "Agents not ready"}

        task = Task(
            description=f"""Create a detailed wedding timeline:
Date: {data.get('wedding_date', 'TBD')}
City: {data.get('city', 'Mumbai')}
Events: {json.dumps(data.get('events', ['mehendi', 'sangeet', 'ceremony', 'reception']))}
Guest count: {data.get('guest_count', 200)}
Wedding type: {data.get('wedding_type', 'Hindu')}

For each event, provide: event name, date, start_time, end_time, key activities, vendor requirements.
Respond ONLY with valid JSON array.""",
            expected_output="JSON array of timeline events with details",
            agent=self.timeline_agent,
        )
        return self._run_single(task, "timeline")

    def suggest_message(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Communication coach drafts vendor messages for the couple."""
        if not self.agents_ready:
            return {"success": False, "error": "Agents not ready"}

        role = "couple"
        context = data.get("context", "general inquiry")
        quote_info = data.get("quote_info", {})
        history = data.get("conversation_history", [])

        history_text = "\n".join([
            f"[{m.get('sender_role', '?')}]: {m.get('content', '')[:100]}"
            for m in history[-5:]
        ])

        task = Task(
            description=f"""Draft a message FROM a couple TO a wedding vendor.
Context: {context}
Quote: ₹{quote_info.get('total_estimated_price', 0):,}, Category: {quote_info.get('category', 'N/A')}
Recent conversation:
{history_text}

Write ONE short, polite message (2-3 sentences). Return JSON: {{"message": "...", "tone": "professional/friendly/negotiating"}}""",
            expected_output="JSON with message and tone",
            agent=self.comms_agent,
        )
        return self._run_single(task, "message")

    # ────────────────────────────────────────────
    # Internal: Run a single task crew
    # ────────────────────────────────────────────

    def _run_single(self, task: Task, result_key: str) -> Dict[str, Any]:
        """Run a single-agent crew and return parsed result."""
        try:
            crew = Crew(
                agents=[task.agent],
                tasks=[task],
                process=Process.sequential,
                verbose=False,
            )
            result = crew.kickoff()
            raw = str(result).strip()

            # Try to parse JSON from the response
            parsed = self._extract_json(raw)
            if parsed is not None:
                return {"success": True, result_key: parsed, "raw": raw}
            return {"success": True, result_key: raw}

        except Exception as e:
            logger.error(f"Couple agent error ({result_key}): {e}")
            return {"success": False, "error": str(e)}

    @staticmethod
    def _extract_json(text: str) -> Optional[Any]:
        """Extract JSON object or array from text."""
        if not text:
            return None
        # Strip markdown code fences
        text = re.sub(r'```(?:json)?\s*', '', text)
        text = re.sub(r'```', '', text).strip()

        # Try full text first
        try:
            return json.loads(text)
        except (json.JSONDecodeError, ValueError):
            pass

        # Try to find JSON object
        match = re.search(r'\{[\s\S]*\}', text)
        if match:
            try:
                return json.loads(match.group())
            except (json.JSONDecodeError, ValueError):
                pass

        # Try to find JSON array
        match = re.search(r'\[[\s\S]*\]', text)
        if match:
            try:
                return json.loads(match.group())
            except (json.JSONDecodeError, ValueError):
                pass

        return None
