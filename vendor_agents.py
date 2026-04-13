"""
Shehn.AI — Vendor-Facing AI Agents
5 specialized CrewAI agents that help vendors grow their wedding business.

Agents:
  1. Profile Optimizer    — improve descriptions, SEO, portfolio advice
  2. Quote Strategist     — craft competitive pricing, package suggestions
  3. Blueprint Analyzer   — analyze published blueprints, spot best opportunities
  4. Competitive Insights — market positioning, how vendor stacks up
  5. Communication Drafter— respond to couple inquiries, follow-ups, negotiations
"""

import os
import json
import logging
import re
from typing import Dict, Any, Optional, List

logger = logging.getLogger(__name__)

# ── Try to import CrewAI ──
try:
    from crewai import Agent, Task, Crew, LLM, Process
    CREWAI_INSTALLED = True
except ImportError:
    CREWAI_INSTALLED = False
    logger.warning("CrewAI not installed — vendor agents will use direct LLM fallback")


class VendorAgents:
    """5 specialized AI agents for the vendor's marketplace journey."""

    def __init__(self):
        self.llm = None
        self.agents_ready = False

        if not CREWAI_INSTALLED:
            return

        try:
            self.llm = LLM(
                model="ollama/glm4",
                base_url=os.getenv("OLLAMA_URL", "http://localhost:11434").replace("/api/generate", ""),
                temperature=0.7,
                max_tokens=2000,
            )
            self._init_agents()
            self.agents_ready = True
            logger.info("Vendor agents initialized (Ollama/GLM4)")
        except Exception as e:
            logger.warning(f"Vendor agents LLM init failed: {e}")

    # ────────────────────────────────────────────
    # Agent Definitions
    # ────────────────────────────────────────────

    def _init_agents(self):
        self.profile_agent = Agent(
            role="Vendor Profile Optimizer",
            goal="Help Indian wedding vendors create compelling business profiles that win more bookings",
            backstory=(
                "You are a digital marketing specialist for India's wedding industry. You've helped "
                "500+ vendors improve their profiles. You know that a caterer's profile should highlight "
                "cuisine specialties and per-plate pricing, while a photographer should showcase their "
                "editing style and equipment. You write SEO-friendly descriptions that rank on Google "
                "and convert browsers into inquiries. You always suggest portfolio improvements."
            ),
            llm=self.llm,
            verbose=False,
            max_iter=1,
        )

        self.quote_agent = Agent(
            role="Vendor Quote Strategist",
            goal="Help vendors craft winning quotes with competitive pricing and smart packaging",
            backstory=(
                "You are a pricing consultant for Indian wedding vendors. You know exact market rates: "
                "Mumbai caterers charge ₹2,500-6,000/plate, Bangalore photographers ₹50K-4L/day, "
                "Delhi decorators ₹1-8L/function. You help vendors price competitively — not cheapest, "
                "but best value. You know which inclusions to add (complimentary tasting, extra hour of "
                "coverage, mehendi lighting) that cost vendors little but win deals. You structure quotes "
                "to highlight value, not just price."
            ),
            llm=self.llm,
            verbose=False,
            max_iter=1,
        )

        self.blueprint_agent = Agent(
            role="Blueprint Opportunity Analyzer",
            goal="Help vendors identify the best blueprint opportunities to bid on",
            backstory=(
                "You analyze published wedding blueprints to find the best matches for a vendor. "
                "You look at budget allocation, guest count, city, theme, and specific category requirements "
                "to determine if a blueprint is a strong opportunity. You calculate estimated revenue, "
                "competition level (based on bid count), and likelihood of winning. You help vendors "
                "prioritize which blueprints to spend time quoting on."
            ),
            llm=self.llm,
            verbose=False,
            max_iter=1,
        )

        self.competitive_agent = Agent(
            role="Vendor Competitive Intelligence Analyst",
            goal="Help vendors understand their market position and improve competitiveness",
            backstory=(
                "You are a market analyst for India's wedding industry. You know that a 4.5-star "
                "photographer in Mumbai with 8 years experience should charge ₹1.5-2.5L/day — anything "
                "less leaves money on the table, anything more needs justification. You analyze "
                "competitor pricing, review sentiment, booking patterns, and seasonal demand to help "
                "vendors position themselves. You give honest, data-backed advice."
            ),
            llm=self.llm,
            verbose=False,
            max_iter=1,
        )

        self.comms_agent = Agent(
            role="Vendor Communication Specialist",
            goal="Draft professional responses from vendors to couple inquiries",
            backstory=(
                "You help wedding vendors write messages that build trust and close deals. You know "
                "that a vendor's first response within 2 hours gets 3x more bookings. You write messages "
                "that are professional yet warm — showcasing expertise without being pushy. You know when "
                "to offer a tasting, when to suggest a site visit, when to share a portfolio link, "
                "and how to follow up after a quote without being annoying. You always keep messages "
                "concise (2-3 sentences) and action-oriented."
            ),
            llm=self.llm,
            verbose=False,
            max_iter=1,
        )

    # ────────────────────────────────────────────
    # Agent Methods
    # ────────────────────────────────────────────

    def optimize_profile(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Profile agent improves vendor business description and suggests portfolio improvements."""
        if not self.agents_ready:
            return {"success": False, "error": "Agents not ready"}

        business_name = data.get("business_name", "")
        category = data.get("category", "")
        current_description = data.get("description", "")
        services = data.get("services", [])
        cities = data.get("cities", [])
        rating = data.get("rating", 0)
        experience_years = data.get("experience_years", 0)

        task = Task(
            description=f"""Optimize this Indian wedding vendor's profile:
Business: {business_name} ({category})
Current description: {current_description or 'None yet'}
Services offered: {json.dumps(services) if services else 'Not specified'}
Operating cities: {', '.join(cities) if cities else 'Not specified'}
Rating: {rating}/5, Experience: {experience_years} years

Provide:
1. enhanced_description — SEO-friendly, compelling (150-200 words)
2. suggested_services — 5 service packages with pricing in INR (if missing)
3. portfolio_tips — 4 specific tips to improve their portfolio for {category}
4. profile_completeness — score out of 100 with specific missing items

Return ONLY valid JSON: {{"enhanced_description": "...", "suggested_services": [{{"name": "...", "base_price": 0, "unit": "per event"}}], "portfolio_tips": ["..."], "profile_completeness": {{"score": 0, "missing": ["..."]}}}}""",
            expected_output="JSON with enhanced_description, suggested_services, portfolio_tips, profile_completeness",
            agent=self.profile_agent,
        )
        return self._run_single(task, "profile")

    def suggest_quote(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Quote agent helps vendors craft competitive pricing for a blueprint."""
        if not self.agents_ready:
            return {"success": False, "error": "Agents not ready"}

        category = data.get("category", "")
        blueprint = data.get("blueprint", {})
        vendor_profile = data.get("vendor_profile", {})
        existing_bids = data.get("bid_count", 0)

        ws = blueprint.get("wedding_summary", {})
        budget_allocated = blueprint.get("budget_breakdown", {}).get(category, 0)
        specs = blueprint.get("category_specs", {}).get(category, {})

        task = Task(
            description=f"""Help this {category} vendor craft a winning quote for an Indian wedding:

Blueprint details:
- City: {ws.get('city', 'Mumbai')}, Guests: {ws.get('guest_count', 200)}, Theme: {ws.get('theme', 'not specified')}
- Budget allocated for {category}: ₹{budget_allocated:,}
- Specific requirements: {json.dumps(specs.get('requirements', {}))}
- Notes from couple: {specs.get('notes', 'None')}
- Current bids on this blueprint: {existing_bids}

Vendor profile:
- Rating: {vendor_profile.get('rating', 0)}/5, Experience: {vendor_profile.get('experience_years', 0)} yrs
- Specialties: {json.dumps(vendor_profile.get('specialties', []))}

Provide:
1. recommended_price — what to quote (considering budget and competition)
2. pricing_breakdown — unit pricing that adds up to recommended total
3. value_adds — 3 inclusions to add that cost little but win deals
4. positioning_tip — 1 sentence on how to stand out from other bidders
5. win_probability — estimated % chance of winning (honest assessment)

Return ONLY valid JSON.""",
            expected_output="JSON with recommended_price, pricing_breakdown, value_adds, positioning_tip, win_probability",
            agent=self.quote_agent,
        )
        return self._run_single(task, "quote_strategy")

    def analyze_blueprint(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Blueprint agent evaluates a published blueprint as a business opportunity."""
        if not self.agents_ready:
            return {"success": False, "error": "Agents not ready"}

        blueprint = data.get("blueprint", {})
        vendor_profile = data.get("vendor_profile", {})
        category = data.get("category", "")

        ws = blueprint.get("wedding_summary", {})
        budget = blueprint.get("budget_breakdown", {}).get(category, 0)
        specs = blueprint.get("category_specs", {}).get(category, {})
        bid_count = blueprint.get("bid_count", 0)

        task = Task(
            description=f"""Evaluate this blueprint as a business opportunity for a {category} vendor:

Blueprint:
- Wedding in {ws.get('city', '?')}, {ws.get('guest_count', 0)} guests, theme: {ws.get('theme', '?')}
- Budget for {category}: ₹{budget:,}
- Requirements: {json.dumps(specs.get('requirements', {}))}
- Current bids: {bid_count}

Vendor:
- Rating: {vendor_profile.get('rating', 0)}/5, Experience: {vendor_profile.get('experience_years', 0)} yrs
- Cities: {json.dumps(vendor_profile.get('operating_cities', []))}
- Price tier: {vendor_profile.get('price_tier', 'mid')}

Assess:
1. opportunity_score — 1-100 (how good a fit is this)
2. estimated_revenue — realistic quote range in ₹
3. competition_level — low/medium/high (based on bid count and budget)
4. match_factors — what makes this good/bad for this vendor
5. recommendation — "bid" / "skip" / "bid if no better options" with 1 sentence reason

Return ONLY valid JSON.""",
            expected_output="JSON with opportunity_score, estimated_revenue, competition_level, match_factors, recommendation",
            agent=self.blueprint_agent,
        )
        return self._run_single(task, "opportunity")

    def competitive_analysis(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Competitive agent analyzes vendor's market position."""
        if not self.agents_ready:
            return {"success": False, "error": "Agents not ready"}

        vendor = data.get("vendor_profile", {})
        category = data.get("category", "")
        city = data.get("city", "")
        competitors = data.get("competitors", [])

        comp_summary = "\n".join([
            f"- {c.get('business_name', '?')}: ₹{c.get('avg_price', 0):,}, "
            f"rating {c.get('rating', 0)}/5, {c.get('experience_years', 0)} yrs"
            for c in competitors[:8]
        ])

        task = Task(
            description=f"""Analyze market position for this {category} vendor in {city}:

This vendor:
- Business: {vendor.get('business_name', '?')}
- Rating: {vendor.get('rating', 0)}/5, Experience: {vendor.get('experience_years', 0)} yrs
- Price tier: {vendor.get('price_tier', 'mid')}
- Specialties: {json.dumps(vendor.get('specialties', []))}

Competitors in {city}:
{comp_summary or 'No competitor data available'}

Provide:
1. market_position — "premium" / "mid-range" / "budget" / "underpriced"
2. pricing_advice — should they raise, lower, or maintain prices? 1 sentence
3. strengths — 3 competitive advantages to highlight
4. gaps — 2-3 areas to improve
5. growth_tips — 3 actionable tips to win more bookings this season

Return ONLY valid JSON.""",
            expected_output="JSON with market_position, pricing_advice, strengths, gaps, growth_tips",
            agent=self.competitive_agent,
        )
        return self._run_single(task, "competitive")

    def draft_response(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Communication agent drafts a response from vendor to couple."""
        if not self.agents_ready:
            return {"success": False, "error": "Agents not ready"}

        context = data.get("context", "respond to inquiry")
        quote_info = data.get("quote_info", {})
        history = data.get("conversation_history", [])
        vendor_profile = data.get("vendor_profile", {})

        history_text = "\n".join([
            f"[{m.get('sender_role', '?')}]: {m.get('content', '')[:100]}"
            for m in history[-5:]
        ])

        task = Task(
            description=f"""Draft a message FROM a vendor TO a couple:
Context: {context}
Vendor: {vendor_profile.get('business_name', 'Wedding vendor')} ({vendor_profile.get('category', '')})
Quote: ₹{quote_info.get('total_estimated_price', 0):,}
Recent conversation:
{history_text}

Write ONE short, professional message (2-3 sentences) that builds trust and moves toward booking.
Return JSON: {{"message": "...", "tone": "professional/friendly/persuasive"}}""",
            expected_output="JSON with message and tone",
            agent=self.comms_agent,
        )
        return self._run_single(task, "message")

    def onboard_assist(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Profile agent generates complete onboarding suggestions for a new vendor."""
        if not self.agents_ready:
            return {"success": False, "error": "Agents not ready"}

        business_name = data.get("business_name", "")
        category = data.get("category", "")

        task = Task(
            description=f"""Generate onboarding suggestions for a new Indian wedding {category} vendor named "{business_name}":

1. Professional business description (2-3 sentences, SEO-friendly, mentions Indian weddings)
2. 5 service packages with realistic pricing in INR (use correct unit: per plate, per day, per event, per look)
3. 5 major Indian cities they likely operate in
4. 4 tips for completing their profile

Return ONLY valid JSON: {{"description": "...", "services": [{{"name": "...", "base_price": 0, "unit": "per event"}}], "cities": ["..."], "profile_tips": ["..."]}}""",
            expected_output="JSON with description, services, cities, profile_tips",
            agent=self.profile_agent,
        )
        return self._run_single(task, "suggestions")

    def get_business_tips(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Competitive agent generates category-specific business growth tips."""
        if not self.agents_ready:
            return {"success": False, "error": "Agents not ready"}

        category = data.get("category", "")
        vendor = data.get("vendor_profile", {})

        task = Task(
            description=f"""Generate 6 actionable business tips for a {category} vendor in the Indian wedding industry.

Vendor: {vendor.get('business_name', 'N/A')}, Rating: {vendor.get('rating', 'N/A')}/5
Experience: {vendor.get('experience_years', 'N/A')} years
City: {vendor.get('city', 'N/A')}

Tips should be specific to {category}, include real numbers (pricing, conversion rates, timelines), and be actionable this wedding season.

Return JSON: {{"tips": ["tip1", "tip2", ...], "season_alert": "1 sentence about current booking season"}}""",
            expected_output="JSON with tips array and season_alert",
            agent=self.competitive_agent,
        )
        return self._run_single(task, "business_tips")

    # ────────────────────────────────────────────
    # Internal
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

            parsed = self._extract_json(raw)
            if parsed is not None:
                return {"success": True, result_key: parsed, "raw": raw}
            return {"success": True, result_key: raw}

        except Exception as e:
            logger.error(f"Vendor agent error ({result_key}): {e}")
            return {"success": False, "error": str(e)}

    @staticmethod
    def _extract_json(text: str) -> Optional[Any]:
        """Extract JSON from text."""
        if not text:
            return None
        text = re.sub(r'```(?:json)?\s*', '', text)
        text = re.sub(r'```', '', text).strip()
        try:
            return json.loads(text)
        except (json.JSONDecodeError, ValueError):
            pass
        match = re.search(r'\{[\s\S]*\}', text)
        if match:
            try:
                return json.loads(match.group())
            except (json.JSONDecodeError, ValueError):
                pass
        match = re.search(r'\[[\s\S]*\]', text)
        if match:
            try:
                return json.loads(match.group())
            except (json.JSONDecodeError, ValueError):
                pass
        return None
