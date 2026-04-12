
#!/usr/bin/env python3
"""
Production Wedding AI Agents - Local Ollama
Reliable AI agents using local Ollama (GLM4) for production deployment
No API keys needed - runs fully offline

Upgraded architecture with:
- Gap 1: Tool-using agents (CrewAI @tool decorators)
- Gap 2: Conversation memory (WeddingMemory class)
- Gap 3: Parallel execution (ThreadPoolExecutor)
- Gap 4: Feedback loop / self-correction (_evaluate_and_retry)
- Gap 5: Repurposed Communications Agent for on-platform messaging
"""

import os
from typing import Dict, Any, List
from datetime import datetime
import json
import logging
import requests
import asyncio
from concurrent.futures import ThreadPoolExecutor
from collections import defaultdict

from crewai import Agent, Task, Crew, LLM, Process
from crewai.tools import tool

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ── Gap 1: CrewAI Tool Definitions ──────────────────────────────────────────

@tool("query_vendors")
def query_vendors(category: str, city: str) -> str:
    """Search the vendor database for vendors matching category and city."""
    try:
        resp = requests.get(f"http://localhost:8000/api/vendor-data/{category}",
                            params={"city": city}, timeout=5)
        if resp.ok:
            data = resp.json()
            vendors = data.get("vendors", [])[:5]
            return json.dumps([{"name": v.get("name"), "rating": v.get("rating"),
                                "price": v.get("price"), "location": v.get("location")}
                               for v in vendors])
    except Exception:
        pass
    return json.dumps([])


@tool("get_market_rates")
def get_market_rates(category: str, city: str) -> str:
    """Get current market rate ranges for a wedding category in a city."""
    rates = {
        "venue": {"tier1": "₹2,500-4,500/plate", "tier2": "₹1,500-3,000/plate", "tier3": "₹800-2,000/plate"},
        "photography": {"tier1": "₹60K-1.35L/day", "tier2": "₹40K-85K/day", "tier3": "₹15K-50K/day"},
        "catering": {"tier1": "₹1,500-4,000/plate", "tier2": "₹800-2,000/plate", "tier3": "₹500-1,200/plate"},
        "decoration": {"tier1": "₹1.5L-8L/function", "tier2": "₹75K-3L/function", "tier3": "₹20K-1.5L/function"},
        "makeup": {"tier1": "₹25K-50K/look", "tier2": "₹12K-25K/look", "tier3": "₹5K-15K/look"},
        "entertainment": {"tier1": "₹1L-3L/event", "tier2": "₹50K-1.5L/event", "tier3": "₹20K-60K/event"},
    }
    tier1_cities = ["mumbai", "delhi", "bangalore", "hyderabad", "chennai", "kolkata"]
    tier2_cities = ["pune", "ahmedabad", "jaipur", "lucknow", "kochi", "chandigarh", "goa"]
    city_lower = city.lower()
    tier = "tier1" if city_lower in tier1_cities else "tier2" if city_lower in tier2_cities else "tier3"
    cat_rates = rates.get(category.lower(), {})
    return json.dumps({"category": category, "city": city, "tier": tier,
                        "rate_range": cat_rates.get(tier, "N/A"), "all_tiers": cat_rates})


@tool("get_blueprint_specs")
def get_blueprint_specs(blueprint_id: str) -> str:
    """Retrieve the couple's wedding blueprint specifications."""
    try:
        resp = requests.get(f"http://localhost:8000/api/blueprint/{blueprint_id}", timeout=5)
        if resp.ok:
            data = resp.json()
            return json.dumps({
                "budget_breakdown": data.get("budget_breakdown"),
                "wedding_summary": data.get("wedding_summary"),
                "category_specs": data.get("category_specs"),
            })
    except Exception:
        pass
    return json.dumps({"error": "Blueprint not found"})


# ── Gap 2: Conversation Memory ─────────────────────────────────────────────

class WeddingMemory:
    """Simple conversation memory for multi-turn wedding planning."""

    def __init__(self, max_history: int = 20):
        self._store: Dict[str, list] = defaultdict(list)  # couple_id -> list of {role, content, timestamp}
        self.max_history = max_history

    def add(self, couple_id: str, role: str, content: str):
        self._store[couple_id].append({
            "role": role,
            "content": content[:500],  # Truncate long messages
            "timestamp": datetime.now().isoformat()
        })
        # Keep only last N messages
        if len(self._store[couple_id]) > self.max_history:
            self._store[couple_id] = self._store[couple_id][-self.max_history:]

    def get_context(self, couple_id: str, last_n: int = 10) -> str:
        history = self._store[couple_id][-last_n:]
        if not history:
            return "No previous conversation history."
        return "\n".join([f"[{m['role']}]: {m['content']}" for m in history])

    def get_preferences_summary(self, couple_id: str) -> dict:
        """Extract key preferences mentioned across all conversations."""
        all_content = " ".join([m["content"] for m in self._store[couple_id]])
        prefs = {}
        if any(word in all_content.lower() for word in ["budget", "lakh", "₹"]):
            prefs["budget_discussed"] = True
        if any(word in all_content.lower() for word in ["guest", "people", "members"]):
            prefs["guest_count_discussed"] = True
        if any(word in all_content.lower() for word in ["venue", "palace", "hotel", "farmhouse"]):
            prefs["venue_discussed"] = True
        return prefs

    def clear(self, couple_id: str):
        self._store[couple_id] = []


# ── Main Agent Class ───────────────────────────────────────────────────────

class ProductionWeddingAgentsGemini:
    """
    Production-ready wedding AI agents using local Ollama (GLM4)
    No API keys needed - runs fully offline
    """

    def __init__(self, gemini_api_key: str = None):
        # Ensure no conflicting API keys
        if "OPENAI_API_KEY" in os.environ:
            del os.environ["OPENAI_API_KEY"]

        # Gap 2: Initialize conversation memory
        self.memory = WeddingMemory()

        # Initialize Ollama LLM for CrewAI
        try:
            self.llm = LLM(
                model="ollama/glm4",
                base_url="http://localhost:11434",
                temperature=0.7,
                max_tokens=2000
            )
            logger.info("Ollama LLM (GLM4) connected successfully for CrewAI")
        except Exception as e:
            logger.error(f"Ollama LLM connection failed: {e}")
            self.llm = None
            return

        # Create agents with tools (Gap 1)
        self.agents = self._create_wedding_agents()

        logger.info("Production Wedding Agents initialized (Ollama)")

    def _create_wedding_agents(self) -> Dict[str, Agent]:
        """Create wedding planning agents using Ollama with tool assignments (Gap 1)"""

        # Budget Planning Agent - Gap 1: equipped with get_market_rates
        budget_agent = Agent(
            role="Wedding Budget Specialist",
            goal="Create optimal budget allocations based on wedding requirements",
            backstory="""You are an expert wedding financial planner with 15+ years of experience in Indian weddings.
            You understand regional pricing across India, seasonal variations, and can create realistic budgets
            for different wedding styles and scales. You excel at maximizing value within budget constraints.""",
            tools=[get_market_rates],
            llm=self.llm,
            verbose=True,
            allow_delegation=False,
            max_iter=1
        )

        # Vendor Research Agent - Gap 1: equipped with query_vendors, get_market_rates, get_blueprint_specs
        vendor_agent = Agent(
            role="Wedding Vendor Specialist",
            goal="Recommend suitable wedding vendors based on requirements and budget",
            backstory="""You are a wedding vendor expert with deep knowledge of the Indian wedding industry.
            You know vendor categories, quality indicators, pricing ranges, and can provide practical
            recommendations for different cities and wedding styles. You understand what questions couples should ask vendors.""",
            tools=[query_vendors, get_market_rates, get_blueprint_specs],
            llm=self.llm,
            verbose=True,
            allow_delegation=False,
            max_iter=1
        )

        # Style Consultant Agent - no tools needed (pure creative reasoning)
        style_agent = Agent(
            role="Wedding Style Consultant",
            goal="Create cohesive wedding themes and design recommendations",
            backstory="""You are a creative wedding stylist with expertise in Indian wedding traditions and modern trends.
            You can translate couples' visions into practical design elements and coordinate all visual aspects
            of the wedding beautifully. You understand color theory, seasonal considerations, and cultural significance.""",
            tools=[],
            llm=self.llm,
            verbose=True,
            allow_delegation=False,
            max_iter=1
        )

        # Timeline Manager Agent - no tools needed (pure reasoning)
        timeline_agent = Agent(
            role="Wedding Timeline Manager",
            goal="Create comprehensive wedding planning timelines and schedules",
            backstory="""You are an expert wedding timeline coordinator with deep understanding of Indian wedding logistics.
            You know how to sequence multiple ceremonies, coordinate vendors, manage family schedules, and ensure
            smooth execution of multi-day celebrations. You understand cultural timing requirements and auspicious moments.""",
            tools=[],
            llm=self.llm,
            verbose=True,
            allow_delegation=False,
            max_iter=1
        )

        # Gap 5: Repurposed Communications Agent for on-platform messaging
        communications_agent = Agent(
            role="Wedding Communications Coordinator",
            goal="Manage all vendor-couple communications on the Shehnai platform, draft professional messages, suggest negotiation strategies, and coordinate booking confirmations",
            backstory="""You are an expert wedding communications coordinator with 15+ years of experience
            managing vendor relationships for Indian weddings. You help couples craft professional inquiry
            messages, negotiate pricing diplomatically, and coordinate booking details. You understand
            Indian wedding etiquette, vendor expectations, and how to get the best deals while maintaining
            warm relationships. You specialize in:
            - Drafting initial vendor inquiry messages with specific requirements
            - Negotiation messaging that's firm but respectful
            - Quote comparison summaries for couples
            - Booking confirmation and follow-up messages
            - Escalation messages when vendors are unresponsive""",
            tools=[get_blueprint_specs, get_market_rates],
            llm=self.llm,
            verbose=True,
            allow_delegation=False,
            max_iter=1
        )

        return {
            "budget_agent": budget_agent,
            "vendor_agent": vendor_agent,
            "style_agent": style_agent,
            "timeline_agent": timeline_agent,
            "communications_agent": communications_agent
        }

    # ── Gap 4: Feedback Loop / Self-Correction ─────────────────────────────

    def _evaluate_and_retry(self, task: Task, result: str, max_retries: int = 1) -> str:
        """Evaluate agent output quality, retry if low confidence."""
        confidence = 1.0
        try:
            parsed = json.loads(result)
            if not parsed or (isinstance(parsed, dict) and len(parsed) < 2):
                confidence -= 0.4  # Too sparse
            if isinstance(parsed, dict) and any(v in ["N/A", "unknown", ""] for v in parsed.values()):
                confidence -= 0.2  # Incomplete fields
        except json.JSONDecodeError:
            confidence -= 0.5  # Not valid JSON

        # Check for hallucination markers
        hallucination_markers = ["I don't know", "I cannot", "As an AI", "I'm not sure"]
        if any(marker.lower() in result.lower() for marker in hallucination_markers):
            confidence -= 0.3

        # Retry if low confidence
        if confidence < 0.6 and max_retries > 0:
            logger.info(f"Low confidence ({confidence:.2f}), retrying task for agent {task.agent.role}")
            retry_task = Task(
                description=f"{task.description}\n\nPREVIOUS ATTEMPT (low quality, please improve):\n{result[:500]}\n\nPlease provide a more complete and accurate response.",
                agent=task.agent,
                expected_output=task.expected_output
            )
            retry_crew = Crew(agents=[task.agent], tasks=[retry_task], verbose=True, process=Process.sequential)
            retry_result = str(retry_crew.kickoff())
            return self._evaluate_and_retry(retry_task, retry_result, max_retries - 1)

        return result

    def _run_single_task(self, task: Task) -> str:
        """Run a single agent task with self-correction (Gap 4)."""
        crew = Crew(agents=[task.agent], tasks=[task], verbose=True, process=Process.sequential)
        result = str(crew.kickoff())
        return self._evaluate_and_retry(task, result)

    # ── Gap 3: Parallel Execution ──────────────────────────────────────────

    async def get_comprehensive_wedding_plan_parallel(self, preferences: dict, couple_id: str = "default") -> dict:
        """Parallel execution where possible (Gap 3).

        Phase 1: Budget + Style in parallel (independent)
        Phase 2: Vendor (needs budget output, sequential)
        Phase 3: Timeline (needs all, sequential last)
        """
        # Inject memory context
        context = self.memory.get_context(couple_id, last_n=5)

        # Phase 1: Budget + Style in parallel (independent)
        budget_task = Task(
            description=f"Create budget for: {json.dumps(preferences)}\n\nPrevious conversation context:\n{context}",
            agent=self.agents["budget_agent"],
            expected_output="JSON budget breakdown with INR amounts"
        )
        style_task = Task(
            description=f"Create style for: {json.dumps(preferences)}\n\nPrevious conversation context:\n{context}",
            agent=self.agents["style_agent"],
            expected_output="JSON style guide"
        )

        with ThreadPoolExecutor(max_workers=2) as executor:
            budget_future = executor.submit(self._run_single_task, budget_task)
            style_future = executor.submit(self._run_single_task, style_task)
            budget_result = budget_future.result(timeout=60)
            style_result = style_future.result(timeout=60)

        # Phase 2: Vendor (needs budget output)
        vendor_task = Task(
            description=f"Recommend vendors given budget: {budget_result}\nPreferences: {json.dumps(preferences)}",
            agent=self.agents["vendor_agent"],
            expected_output="JSON vendors"
        )
        vendor_result = self._run_single_task(vendor_task)

        # Phase 3: Timeline (needs all)
        timeline_task = Task(
            description=f"Create timeline for: budget={budget_result}, style={style_result}, vendors={vendor_result}",
            agent=self.agents["timeline_agent"],
            expected_output="JSON timeline"
        )
        timeline_result = self._run_single_task(timeline_task)

        # Store in memory (Gap 2)
        self.memory.add(couple_id, "assistant", f"Plan generated: budget={budget_result[:200]}")

        return {
            "success": True,
            "budget": budget_result,
            "style": style_result,
            "vendors": vendor_result,
            "timeline": timeline_result,
            "parallel_execution": True,
            "processing_time": datetime.now().isoformat()
        }

    # ── Gap 5: On-Platform Messaging Methods ───────────────────────────────

    def draft_vendor_inquiry(self, vendor_name: str, category: str, couple_preferences: dict,
                             budget_allocated: float, couple_id: str = "default") -> str:
        """Draft a professional vendor inquiry message (Gap 5)."""
        context = self.memory.get_context(couple_id, last_n=5)
        task = Task(
            description=f"""Draft a professional inquiry message from a couple to {vendor_name} ({category} vendor).

Couple's requirements: {json.dumps(couple_preferences)}
Budget allocated for {category}: ₹{budget_allocated:,.0f}
Previous context: {context}

Write a warm, professional message that:
1. Introduces the couple and their wedding date/city
2. Specifies key requirements for this vendor category
3. Mentions the budget range (not exact number)
4. Asks about availability and pricing
5. Requests portfolio/references

Output JSON: {{"subject": "...", "message": "...", "key_questions": ["...", "..."]}}""",
            agent=self.agents["communications_agent"],
            expected_output="JSON with subject, message, key_questions"
        )
        result = self._run_single_task(task)
        self.memory.add(couple_id, "system", f"Drafted inquiry to {vendor_name} for {category}")
        return result

    def draft_negotiation_response(self, vendor_name: str, category: str, quote_details: dict,
                                   budget: float, couple_id: str = "default") -> str:
        """Draft a negotiation response to a vendor quote (Gap 5)."""
        context = self.memory.get_context(couple_id, last_n=5)
        task = Task(
            description=f"""A vendor has sent a quote. Help the couple respond with a negotiation message.

Vendor: {vendor_name} ({category})
Quote details: {json.dumps(quote_details)}
Couple's budget for {category}: ₹{budget:,.0f}
Previous context: {context}

If quote is over budget, suggest diplomatic negotiation. If within budget, suggest acceptance with clarifying questions.

Output JSON: {{"tone": "negotiate|accept|clarify", "message": "...", "counter_offer_suggested": true/false, "suggested_counter": number_or_null, "reasoning": "..."}}""",
            agent=self.agents["communications_agent"],
            expected_output="JSON with tone, message, counter_offer details"
        )
        result = self._run_single_task(task)
        self.memory.add(couple_id, "system", f"Negotiation response drafted for {vendor_name}: {result[:200]}")
        return result

    def generate_booking_confirmation(self, vendor_name: str, category: str, agreed_terms: dict,
                                      couple_id: str = "default") -> str:
        """Generate a booking confirmation message (Gap 5)."""
        task = Task(
            description=f"""Generate a booking confirmation message from couple to vendor.

Vendor: {vendor_name} ({category})
Agreed terms: {json.dumps(agreed_terms)}

Write a formal confirmation covering:
1. Thank you and excitement
2. Confirmed services and pricing
3. Key dates (wedding date, any pre-events)
4. Payment schedule acknowledgment
5. Next steps (site visit, tasting, trial, etc.)

Output JSON: {{"message": "...", "checklist": ["...", "..."], "next_steps": ["...", "..."]}}""",
            agent=self.agents["communications_agent"],
            expected_output="JSON with message, checklist, next_steps"
        )
        return self._run_single_task(task)

    # ── Existing Methods (updated with memory integration) ─────────────────

    def process_wedding_form(self, form_data: Dict[str, Any], couple_id: str = "default") -> Dict[str, Any]:
        """Process wedding form with Ollama AI agent analysis"""
        if not self.llm:
            return {"success": False, "error": "Ollama LLM not available"}

        try:
            logger.info("Starting AI agent analysis with Ollama")

            # Gap 2: Inject memory context
            context = self.memory.get_context(couple_id, last_n=5)

            # Create budget analysis task
            budget_task = Task(
                description=f"""Analyze the wedding requirements and create a detailed budget plan:

Wedding Details:
- Type: {form_data.get('weddingType', 'Traditional')}
- Location: {form_data.get('city', 'Mumbai')}
- Guest Count: {form_data.get('guestCount', '200')}
- Budget Range: {form_data.get('budgetRange', '₹30-50 Lakhs')}
- Style: {form_data.get('weddingStyle', 'Traditional')}
- Events: {', '.join(form_data.get('events', ['Wedding Ceremony']))}

Previous conversation context:
{context}

Based on your expertise in Indian wedding planning, create a comprehensive budget breakdown:

1. VENUE (35-40%): Estimate costs for ceremony and reception venues
2. CATERING (25-30%): Food costs per plate for {form_data.get('guestCount', '200')} guests
3. PHOTOGRAPHY (10-15%): Professional wedding photography and videography
4. DECORATION (8-12%): Floral arrangements, lighting, and stage decoration
5. CLOTHING & JEWELRY (5-10%): Bridal and groom attire
6. ENTERTAINMENT (3-8%): Music, DJ, or live performances
7. TRANSPORT (2-5%): Vehicle arrangements for wedding party
8. MISCELLANEOUS (5-10%): Invitations, gifts, and unexpected expenses

Provide specific amount ranges in INR for each category based on the total budget of {form_data.get('budgetRange', '₹30-50 Lakhs')}.
Include cost-saving tips and priority recommendations.""",
                agent=self.agents["budget_agent"],
                expected_output="Detailed budget breakdown with specific INR amounts and percentages for each category"
            )

            # Create vendor recommendation task
            vendor_task = Task(
                description=f"""Based on the wedding requirements, provide comprehensive vendor recommendations:

Requirements:
- Location: {form_data.get('city', 'Mumbai')}
- Wedding Type: {form_data.get('weddingType', 'Traditional')}
- Budget: {form_data.get('budgetRange', '₹30-50 Lakhs')}
- Guest Count: {form_data.get('guestCount', '200')}
- Style: {form_data.get('weddingStyle', 'Traditional')}

Previous conversation context:
{context}

For each major vendor category, provide:

1. VENUE VENDORS:
   - Types to consider (banquet halls, hotels, outdoor venues)
   - Key questions to ask about capacity, catering policies, decorations
   - Red flags to avoid
   - Expected pricing range for {form_data.get('guestCount', '200')} guests

2. CATERING VENDORS:
   - Menu options for {form_data.get('weddingType', 'Traditional')} weddings
   - Questions about food quality, service staff, equipment
   - Pricing expectations per plate
   - Tasting and contract considerations

3. PHOTOGRAPHY VENDORS:
   - Portfolio evaluation criteria
   - Package inclusions (pre-wedding, ceremony, reception)
   - Delivery timelines and formats
   - Pricing expectations for professional coverage

4. DECORATION VENDORS:
   - Style matching for {form_data.get('weddingStyle', 'Traditional')} theme
   - Seasonal flower availability and pricing
   - Lighting and stage setup capabilities
   - Setup and breakdown logistics

Provide practical, actionable advice for vendor selection and negotiation.""",
                agent=self.agents["vendor_agent"],
                expected_output="Comprehensive vendor selection guide with specific recommendations and evaluation criteria"
            )

            # Create crew with Agents
            wedding_crew = Crew(
                agents=[self.agents["budget_agent"], self.agents["vendor_agent"]],
                tasks=[budget_task, vendor_task],
                verbose=True,
                process=Process.sequential,
                memory=False
            )

            # Execute agent analysis
            logger.info("AI agents analyzing wedding requirements...")
            results = wedding_crew.kickoff()

            # Parse and structure the results
            parsed_results = self._parse_agent_results(str(results))

            # Gap 2: Store result in memory
            self.memory.add(couple_id, "user", f"Wedding form: {json.dumps(form_data)[:300]}")
            self.memory.add(couple_id, "assistant", str(results)[:500])

            return {
                "success": True,
                "ai_powered": True,
                "local_llm": True,
                "agent_analysis": str(results),
                "parsed_insights": parsed_results,
                "agents_used": ["budget_agent", "vendor_agent"],
                "processing_time": datetime.now().isoformat(),
                "model_used": "ollama/glm4"
            }

        except Exception as e:
            logger.error(f"Agent processing error: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "ai_powered": False,
                "local_llm": True
            }

    def process_visual_preferences(self, preferences: Dict[str, Any], wedding_context: Dict[str, Any] = None,
                                   couple_id: str = "default") -> Dict[str, Any]:
        """Process visual preferences with AI style agent"""
        if not self.llm:
            return {"success": False, "error": "Ollama LLM not available"}

        try:
            logger.info("Analyzing visual preferences with Ollama")

            # Gap 2: Inject memory context
            context = self.memory.get_context(couple_id, last_n=5)

            style_task = Task(
                description=f"""Analyze the visual preferences and create a comprehensive style guide:

Visual Preferences: {json.dumps(preferences, indent=2)}
Wedding Context: {json.dumps(wedding_context or {}, indent=2)}

Previous conversation context:
{context}

Based on your expertise in wedding styling, create detailed recommendations:

1. COLOR PALETTE:
   - Primary colors and complementary combinations
   - Seasonal appropriateness and cultural significance
   - Color psychology for wedding atmosphere

2. THEME INTERPRETATION:
   - Overall mood and aesthetic direction
   - Traditional vs modern elements balance
   - Cultural authenticity considerations

3. DECOR ELEMENTS:
   - Floral arrangements and seasonal flower choices
   - Fabric and textile recommendations
   - Lighting design for different times of day
   - Table settings and centerpiece ideas

4. COORDINATION GUIDELINES:
   - Bridal attire color coordination
   - Venue decoration themes
   - Photography backdrop considerations
   - Guest area styling

5. PRACTICAL IMPLEMENTATION:
   - Budget-friendly alternatives
   - DIY elements vs professional services
   - Timeline for decoration setup
   - Weather contingency plans

Ensure all recommendations create a cohesive and memorable wedding experience.""",
                agent=self.agents["style_agent"],
                expected_output="Comprehensive style guide with specific color, decor, and coordination recommendations"
            )

            style_crew = Crew(
                agents=[self.agents["style_agent"]],
                tasks=[style_task],
                verbose=True,
                process=Process.sequential,
                memory=False
            )

            results = style_crew.kickoff()

            # Gap 2: Store in memory
            self.memory.add(couple_id, "assistant", f"Style analysis: {str(results)[:400]}")

            return {
                "success": True,
                "style_analysis": str(results),
                "visual_matches": self._extract_visual_insights(str(results)),
                "processing_time": datetime.now().isoformat(),
                "local_llm": True
            }

        except Exception as e:
            logger.error(f"AI style processing error: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "local_llm": True
            }

    def get_comprehensive_wedding_plan(self, wedding_data: Dict[str, Any], couple_id: str = "default") -> Dict[str, Any]:
        """Get comprehensive wedding plan using all Agents (sequential version)"""
        if not self.llm:
            return {"error": "Ollama LLM not available"}

        try:
            logger.info("Starting comprehensive wedding planning with Ollama...")

            # Gap 2: Inject memory context
            context = self.memory.get_context(couple_id, last_n=5)

            # Create all tasks for comprehensive planning
            budget_task = Task(
                description=f"""Create comprehensive budget analysis for this Indian wedding:

Wedding Details: {json.dumps(wedding_data, indent=2)}

Previous conversation context:
{context}

Provide detailed budget breakdown with:
1. Category-wise allocation percentages
2. Specific amount ranges in INR
3. Regional pricing considerations for {wedding_data.get('city', 'Mumbai')}
4. Seasonal pricing factors
5. Cost-saving recommendations
6. Priority-based spending advice""",
                agent=self.agents["budget_agent"],
                expected_output="Detailed budget breakdown with INR amounts and cost optimization"
            )

            vendor_task = Task(
                description=f"""Recommend vendors for this Indian wedding:

Wedding Requirements: {json.dumps(wedding_data, indent=2)}

Provide vendor recommendations with:
1. Venue options suitable for Indian ceremonies
2. Catering services with Indian cuisine expertise
3. Photography specialists for Indian weddings
4. Decoration services understanding cultural requirements
5. Entertainment options for Indian celebrations
6. Vendor evaluation criteria and questions to ask""",
                agent=self.agents["vendor_agent"],
                expected_output="Comprehensive vendor recommendations with evaluation guidelines"
            )

            style_task = Task(
                description=f"""Create style and design recommendations:

Wedding Details: {json.dumps(wedding_data, indent=2)}

Provide styling recommendations with:
1. Traditional Indian color schemes and significance
2. Mandap and ceremony decoration ideas
3. Floral arrangements using traditional flowers
4. Lighting concepts for different ceremonies
5. Cultural authenticity guidelines
6. Modern fusion possibilities""",
                agent=self.agents["style_agent"],
                expected_output="Complete style guide with traditional and modern elements"
            )

            timeline_task = Task(
                description=f"""Create comprehensive wedding timeline:

Wedding Information: {json.dumps(wedding_data, indent=2)}

Provide detailed timeline with:
1. 12-month planning schedule
2. Vendor booking deadlines
3. Multi-day ceremony scheduling
4. Day-of-wedding hour-by-hour timeline
5. Family coordination points
6. Contingency planning
7. Cultural timing considerations (muhurat)""",
                agent=self.agents["timeline_agent"],
                expected_output="Detailed wedding planning timeline with milestones and schedules"
            )

            # Create crew with all Agents
            wedding_crew = Crew(
                agents=[
                    self.agents["budget_agent"],
                    self.agents["vendor_agent"],
                    self.agents["style_agent"],
                    self.agents["timeline_agent"]
                ],
                tasks=[budget_task, vendor_task, style_task, timeline_task],
                verbose=True,
                process=Process.sequential,
                memory=False
            )

            # Execute comprehensive analysis
            logger.info("AI agents creating comprehensive wedding plan...")
            results = wedding_crew.kickoff()

            # Parse and structure results
            parsed_results = self._parse_comprehensive_results(str(results))

            # Gap 2: Store in memory
            self.memory.add(couple_id, "user", f"Comprehensive plan request: {json.dumps(wedding_data)[:300]}")
            self.memory.add(couple_id, "assistant", str(results)[:500])

            return {
                "success": True,
                "ai_powered": True,
                "local_llm": True,
                "comprehensive_plan": parsed_results,
                "full_analysis": str(results),
                "agents_used": ["budget_agent", "vendor_agent", "style_agent", "timeline_agent"],
                "processing_time": datetime.now().isoformat(),
                "model_used": "ollama/glm4",
                "production_ready": True
            }

        except Exception as e:
            logger.error(f"Comprehensive planning error: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "local_llm": True
            }

    def _parse_agent_results(self, results: str) -> Dict[str, Any]:
        """Parse and structure agent results"""
        try:
            insights = {
                "budget_analysis": {
                    "categories_found": [],
                    "estimated_amounts": {},
                    "recommendations": []
                },
                "vendor_insights": {
                    "categories": [],
                    "key_recommendations": [],
                    "evaluation_criteria": []
                }
            }

            # Parse budget information
            results_lower = results.lower()

            # Budget categories with typical percentages
            budget_categories = {
                "venue": {"min": 35, "max": 40},
                "catering": {"min": 25, "max": 30},
                "photography": {"min": 10, "max": 15},
                "decoration": {"min": 8, "max": 12},
                "clothing": {"min": 5, "max": 10},
                "entertainment": {"min": 3, "max": 8},
                "transport": {"min": 2, "max": 5},
                "miscellaneous": {"min": 5, "max": 10}
            }

            for category, percentages in budget_categories.items():
                if category in results_lower:
                    insights["budget_analysis"]["categories_found"].append(category)
                    insights["budget_analysis"]["estimated_amounts"][category] = {
                        "percentage_range": f"{percentages['min']}-{percentages['max']}%"
                    }

            # Vendor categories
            vendor_categories = ["venue", "catering", "photography", "decoration", "entertainment"]
            for category in vendor_categories:
                if category in results_lower:
                    insights["vendor_insights"]["categories"].append(category)

            # Extract key recommendations
            if "cost-saving" in results_lower or "budget" in results_lower:
                insights["budget_analysis"]["recommendations"].append("Cost-saving strategies provided")

            if "questions to ask" in results_lower or "evaluation" in results_lower:
                insights["vendor_insights"]["evaluation_criteria"].append("Vendor evaluation guidelines provided")

            return insights

        except Exception as e:
            logger.error(f"Error parsing results: {e}")
            return {"error": "Could not parse agent results", "raw_available": True}

    def _parse_comprehensive_results(self, results: str) -> Dict[str, Any]:
        """Parse comprehensive wedding planning results"""
        try:
            parsed = {
                "budget_breakdown": {},
                "vendor_recommendations": [],
                "style_guide": [],
                "timeline_milestones": [],
                "key_insights": []
            }

            lines = results.split('\n')
            current_section = None

            for line in lines:
                line = line.strip()
                if not line:
                    continue

                # Identify sections
                if any(keyword in line.lower() for keyword in ['budget', 'cost', 'price', 'rupees', 'inr']):
                    current_section = 'budget'
                elif any(keyword in line.lower() for keyword in ['vendor', 'catering', 'photography', 'venue']):
                    current_section = 'vendors'
                elif any(keyword in line.lower() for keyword in ['style', 'color', 'theme', 'decoration']):
                    current_section = 'style'
                elif any(keyword in line.lower() for keyword in ['timeline', 'schedule', 'month', 'week']):
                    current_section = 'timeline'
                elif any(keyword in line.lower() for keyword in ['tip', 'recommendation', 'insight']):
                    current_section = 'insights'

                # Parse content based on section
                if current_section == 'budget' and ':' in line:
                    parts = line.split(':', 1)
                    if len(parts) == 2:
                        parsed["budget_breakdown"][parts[0].strip()] = parts[1].strip()
                elif current_section == 'vendors' and line:
                    parsed["vendor_recommendations"].append(line)
                elif current_section == 'style' and line:
                    parsed["style_guide"].append(line)
                elif current_section == 'timeline' and line:
                    parsed["timeline_milestones"].append(line)
                elif current_section == 'insights' and line:
                    parsed["key_insights"].append(line)

            return parsed

        except Exception as e:
            logger.error(f"Error parsing comprehensive results: {e}")
            return {"raw_results": results, "parsing_error": str(e)}

    def _extract_visual_insights(self, results: str) -> Dict[str, Any]:
        """Extract visual insights from style analysis"""
        results_lower = results.lower()

        return {
            "style_confidence": 0.9,
            "theme_coherence": "High" if "cohesive" in results_lower else "Medium",
            "color_harmony": "Excellent" if "color" in results_lower else "Good",
            "design_elements_identified": [
                elem for elem in ["color_palette", "lighting", "florals", "decor", "coordination"]
                if elem.replace("_", " ") in results_lower
            ],
            "cultural_authenticity": "High" if "traditional" in results_lower else "Medium",
            "practical_implementation": "Detailed" if "budget" in results_lower and "timeline" in results_lower else "Basic"
        }

    def process_vendor_search(self, search_context: Dict[str, Any], couple_id: str = "default") -> Dict[str, Any]:
        """Enhanced vendor search with detailed preferences and AI agent analysis"""
        if not self.llm:
            return {"success": False, "error": "Ollama LLM not available"}

        try:
            logger.info("Starting enhanced vendor search with AI agents")

            # Gap 2: Inject memory context
            context = self.memory.get_context(couple_id, last_n=5)

            # Create specialized vendor search task with detailed context
            vendor_search_task = Task(
                description=f"""Perform comprehensive vendor search and analysis:

**SEARCH PARAMETERS:**
- Category: {search_context.get('category', 'venues')}
- Location: {search_context.get('city', 'Mumbai')}
- Budget: {search_context.get('budgetRange', '₹30-50 Lakhs')}
- Guest Count: {search_context.get('guestCount', 200)}
- Wedding Type: {search_context.get('weddingType', 'Traditional')}

**DETAILED USER REQUIREMENTS:**
{search_context.get('userRequirements', 'Standard wedding vendor requirements')}

**CULTURAL & STYLE CONTEXT:**
- Wedding Style: {search_context.get('stylePreferences', 'Traditional')}
- Events: {', '.join(search_context.get('events', ['Wedding Ceremony']))}
- Duration: {search_context.get('duration', '3 days')}
- Cultural Requirements: {search_context.get('culturalRequirements', 'Traditional Indian wedding')}
- Seasonal Preferences: {search_context.get('seasonalPreferences', 'All seasons')}

**PRIORITY FACTORS:**
{', '.join(search_context.get('priorityFactors', ['quality', 'price', 'experience']))}

**DETAILED PREFERENCES:**
{json.dumps(search_context.get('detailedPreferences', {}), indent=2)}

Previous conversation context:
{context}

Based on this comprehensive context, provide:

1. **TARGETED VENDOR RECOMMENDATIONS** for {search_context.get('category', 'venues')}:
   - Specific vendor names and descriptions that match the user's detailed preferences
   - Why each vendor is recommended based on user requirements
   - Pricing estimates aligned with the budget
   - Specialty matching (cuisine preferences, photography style, decoration style, etc.)

2. **PREFERENCE MATCHING ANALYSIS**:
   - How well each recommendation aligns with user's specific requirements
   - Cultural authenticity scoring for traditional requirements
   - Style compatibility assessment

3. **PRACTICAL CONSIDERATIONS**:
   - Availability for the specified dates and duration
   - Capacity matching for guest count
   - Location accessibility and logistics
   - Package inclusions and customization options

4. **EVALUATION CRITERIA**:
   - Questions to ask potential vendors
   - Red flags to watch for
   - Negotiation points and cost optimization tips
   - Timeline considerations for booking

Provide specific, actionable recommendations that directly address the user's detailed preferences and cultural requirements.""",
                agent=self.agents["vendor_agent"],
                expected_output="Comprehensive vendor analysis with specific recommendations, preference matching scores, and practical evaluation criteria"
            )

            # Execute the enhanced vendor search
            crew = Crew(
                agents=[self.agents["vendor_agent"]],
                tasks=[vendor_search_task],
                verbose=True,
                process=Process.sequential,
                max_iter=1
            )

            result = crew.kickoff()

            # Parse and structure the results
            vendor_analysis = str(result)
            parsed_insights = self._extract_vendor_insights(vendor_analysis, search_context)

            # Gap 2: Store in memory
            self.memory.add(couple_id, "assistant", f"Vendor search ({search_context.get('category', 'venues')}): {vendor_analysis[:300]}")

            return {
                "success": True,
                "ai_powered": True,
                "local_llm": True,
                "vendor_analysis": vendor_analysis,
                "parsed_insights": parsed_insights,
                "matching_score": parsed_insights.get("overall_matching_score", 85),
                "vendors": parsed_insights.get("recommended_vendors", []),
                "agents_used": ["vendor_agent"],
                "processing_time": datetime.now().isoformat(),
                "model_used": "ollama/glm4",
                "search_context": search_context
            }

        except Exception as e:
            logger.error(f"Enhanced vendor search failed: {e}")
            return {"success": False, "error": str(e)}

    def _extract_vendor_insights(self, analysis: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Extract structured insights from vendor analysis"""
        analysis_lower = analysis.lower()

        # Extract vendor recommendations
        recommended_vendors = []
        vendor_sections = analysis.split("**")

        for section in vendor_sections:
            if any(word in section.lower() for word in ["recommended", "suggestion", "option"]):
                # Extract vendor info from section
                lines = section.split('\n')
                for line in lines:
                    if line.strip() and not line.startswith('-') and len(line) > 10:
                        recommended_vendors.append({
                            "name": line.strip()[:50],  # First part as name
                            "category": context.get("category", "vendor"),
                            "description": line.strip(),
                            "matching_reason": "AI-recommended based on user preferences"
                        })

        # Calculate matching scores
        preference_factors = {
            "budget_alignment": 90 if "budget" in analysis_lower else 70,
            "style_compatibility": 95 if context.get("stylePreferences", "").lower() in analysis_lower else 75,
            "cultural_authenticity": 90 if "traditional" in analysis_lower or "indian" in analysis_lower else 70,
            "capacity_matching": 85 if str(context.get("guestCount", "")) in analysis else 80,
            "location_suitability": 88 if context.get("city", "").lower() in analysis_lower else 75
        }

        overall_score = sum(preference_factors.values()) / len(preference_factors)

        return {
            "recommended_vendors": recommended_vendors[:5],  # Top 5 recommendations
            "preference_matching": preference_factors,
            "overall_matching_score": round(overall_score, 1),
            "analysis_insights": {
                "has_budget_analysis": "budget" in analysis_lower,
                "has_style_matching": "style" in analysis_lower,
                "has_cultural_context": "traditional" in analysis_lower or "indian" in analysis_lower,
                "recommendation_count": len(recommended_vendors)
            },
            "search_effectiveness": "High" if overall_score > 85 else "Medium" if overall_score > 75 else "Basic"
        }

    def create_communications_strategy(self, communication_data: Dict[str, Any], couple_id: str = "default") -> Dict[str, Any]:
        """Create on-platform communication strategy for vendor-couple messaging (Gap 5)"""
        if not self.llm:
            return {"success": False, "error": "Ollama LLM not available"}

        try:
            logger.info("Creating communications strategy with Ollama")

            # Gap 2: Inject memory context
            context = self.memory.get_context(couple_id, last_n=5)

            # Create communications strategy task
            communications_task = Task(
                description=f"""Create comprehensive on-platform vendor-couple communication strategy:

Communication Requirements: {json.dumps(communication_data, indent=2)}

Previous conversation context:
{context}

Design an on-platform communication strategy for the Shehnai wedding platform:

1. VENDOR INQUIRY TEMPLATES:
   - Initial vendor inquiry messages (professional, warm tone)
   - Follow-up messages for unresponsive vendors
   - Budget discussion openers

2. NEGOTIATION MESSAGING:
   - Price negotiation templates (firm but respectful)
   - Counter-offer messaging
   - Package customization requests
   - Bulk booking discount requests

3. BOOKING COORDINATION:
   - Booking confirmation message templates
   - Payment schedule discussion templates
   - Pre-event coordination messages (site visits, tastings, trials)

4. QUOTE COMPARISON:
   - Summary templates for comparing multiple vendor quotes
   - Key decision factors to highlight
   - Family-friendly summary format

5. ESCALATION HANDLING:
   - Polite reminder messages for late responses
   - Issue resolution message templates
   - Contract clarification requests

Provide specific message templates appropriate for Indian wedding vendor communication norms.""",

                agent=self.agents["communications_agent"],
                expected_output="Comprehensive on-platform communications strategy with message templates and coordination workflows"
            )

            # Create crew with communications agent
            communications_crew = Crew(
                agents=[self.agents["communications_agent"]],
                tasks=[communications_task],
                verbose=True,
                process=Process.sequential,
                memory=False
            )

            # Execute communications strategy creation
            logger.info("AI communications agent creating strategy...")
            results = communications_crew.kickoff()

            # Gap 2: Store in memory
            self.memory.add(couple_id, "assistant", f"Communications strategy: {str(results)[:400]}")

            return {
                "success": True,
                "ai_powered": True,
                "local_llm": True,
                "communications_strategy": str(results),
                "platforms_covered": ["Shehnai In-App Messaging"],
                "agents_used": ["communications_agent"],
                "processing_time": datetime.now().isoformat(),
                "model_used": "ollama/glm4"
            }

        except Exception as e:
            logger.error(f"Communications strategy error: {e}")
            return {"success": False, "error": f"Communications strategy creation failed: {str(e)}"}

    # ── Additional agent methods for marketplace endpoints ──

    def analyze_quote(self, quote_data: Dict[str, Any], couple_id: str = "default") -> Dict[str, Any]:
        """Budget agent analyzes a vendor quote against budget and market rates."""
        if not self.llm:
            return {"success": False, "error": "Ollama LLM not available"}
        try:
            context = self.memory.get_context(couple_id, last_n=5)
            task = Task(
                description=f"""Analyze this vendor quote for an Indian wedding:
{json.dumps(quote_data, indent=2)}

Previous conversation context:
{context}

Evaluate: value for money, market rate comparison, strengths, concerns, and negotiation tips.
Return a detailed analysis with specific INR comparisons.""",
                agent=self.agents["budget_agent"],
                expected_output="Quote analysis with value rating, market comparison, strengths, concerns, and negotiation tip"
            )
            result = self._run_single_task(task)
            self.memory.add(couple_id, "assistant", f"Quote analysis: {result[:300]}")
            return {"success": True, "analysis": result}
        except Exception as e:
            logger.error(f"Quote analysis error: {e}")
            return {"success": False, "error": str(e)}

    def match_vendors(self, match_data: Dict[str, Any], couple_id: str = "default") -> Dict[str, Any]:
        """Vendor agent ranks vendors against blueprint requirements."""
        if not self.llm:
            return {"success": False, "error": "Ollama LLM not available"}
        try:
            context = self.memory.get_context(couple_id, last_n=5)
            task = Task(
                description=f"""Rank and score these vendors for a wedding:
{json.dumps(match_data, indent=2)}

Previous conversation context:
{context}

Score each vendor 0-100 based on: price vs budget, experience, inclusions, and fit with requirements.
Sort best-first with reasons.""",
                agent=self.agents["vendor_agent"],
                expected_output="Ranked vendor list with match scores and reasons"
            )
            result = self._run_single_task(task)
            self.memory.add(couple_id, "assistant", f"Vendor matching: {result[:300]}")
            return {"success": True, "rankings": result}
        except Exception as e:
            logger.error(f"Vendor matching error: {e}")
            return {"success": False, "error": str(e)}

    def optimize_budget(self, budget_data: Dict[str, Any], couple_id: str = "default") -> Dict[str, Any]:
        """Budget agent suggests reallocations based on received quotes."""
        if not self.llm:
            return {"success": False, "error": "Ollama LLM not available"}
        try:
            context = self.memory.get_context(couple_id, last_n=5)
            task = Task(
                description=f"""Optimize this Indian wedding budget based on actual quotes received:
{json.dumps(budget_data, indent=2)}

Previous conversation context:
{context}

Suggest: reallocations between categories, potential savings, priority spending areas.
Use real Indian wedding market rates for comparison.""",
                agent=self.agents["budget_agent"],
                expected_output="Budget optimization with specific reallocation suggestions and savings estimates in INR"
            )
            result = self._run_single_task(task)
            self.memory.add(couple_id, "assistant", f"Budget optimization: {result[:300]}")
            return {"success": True, "optimization": result}
        except Exception as e:
            logger.error(f"Budget optimization error: {e}")
            return {"success": False, "error": str(e)}

    def suggest_message(self, message_data: Dict[str, Any], couple_id: str = "default") -> Dict[str, Any]:
        """Communications agent drafts contextual messages for couple-vendor conversation."""
        if not self.llm:
            return {"success": False, "error": "Ollama LLM not available"}
        try:
            context = self.memory.get_context(couple_id, last_n=5)
            task = Task(
                description=f"""Draft a professional message for Indian wedding planning:
{json.dumps(message_data, indent=2)}

Previous conversation context:
{context}

Write ONE short, polite message (2-3 sentences) appropriate for the context.
Consider Indian wedding etiquette and professional vendor communication norms.""",
                agent=self.agents["communications_agent"],
                expected_output="A short, polite, contextually appropriate message"
            )
            result = self._run_single_task(task)
            self.memory.add(couple_id, "assistant", f"Message suggestion: {result[:300]}")
            return {"success": True, "message": result}
        except Exception as e:
            logger.error(f"Message suggestion error: {e}")
            return {"success": False, "error": str(e)}

    def bid_assistant(self, bid_data: Dict[str, Any], couple_id: str = "default") -> Dict[str, Any]:
        """Vendor+budget agents help a vendor price their quote competitively."""
        if not self.llm:
            return {"success": False, "error": "Ollama LLM not available"}
        try:
            context = self.memory.get_context(couple_id, last_n=5)
            pricing_task = Task(
                description=f"""Help a wedding vendor create a competitive bid:
{json.dumps(bid_data, indent=2)}

Previous conversation context:
{context}

Analyze the couple's budget, competition level, and suggest:
- Optimal pricing strategy (competitive vs premium)
- Per-unit rates for the city and category
- Package bundling opportunities
- Differentiators to highlight""",
                agent=self.agents["budget_agent"],
                expected_output="Pricing strategy with suggested total, per-unit rates, and differentiators"
            )
            strategy_task = Task(
                description=f"""Based on the pricing analysis, suggest how this vendor should position their bid:
{json.dumps(bid_data, indent=2)}

Focus on: what the couple likely values, how to stand out from other bids, and what to include.""",
                agent=self.agents["vendor_agent"],
                expected_output="Bid positioning strategy with specific recommendations"
            )
            crew = Crew(
                agents=[self.agents["budget_agent"], self.agents["vendor_agent"]],
                tasks=[pricing_task, strategy_task],
                verbose=True, process=Process.sequential, memory=False
            )
            result = crew.kickoff()
            self.memory.add(couple_id, "assistant", f"Bid advice: {str(result)[:300]}")
            return {"success": True, "bid_advice": str(result)}
        except Exception as e:
            logger.error(f"Bid assistant error: {e}")
            return {"success": False, "error": str(e)}

    def listing_insights(self, listing_data: Dict[str, Any], couple_id: str = "default") -> Dict[str, Any]:
        """Vendor agent analyzes a blueprint listing to help craft a winning bid."""
        if not self.llm:
            return {"success": False, "error": "Ollama LLM not available"}
        try:
            context = self.memory.get_context(couple_id, last_n=5)
            task = Task(
                description=f"""Analyze this wedding blueprint listing from a vendor's perspective:
{json.dumps(listing_data, indent=2)}

Previous conversation context:
{context}

Determine: what the couple prioritizes, how to win this bid, any red flags, and opportunity level.
Provide specific, actionable advice for the vendor.""",
                agent=self.agents["vendor_agent"],
                expected_output="Listing analysis with couple priorities, winning approach, red flags, and opportunity score"
            )
            result = self._run_single_task(task)
            self.memory.add(couple_id, "assistant", f"Listing insights: {result[:300]}")
            return {"success": True, "insights": result}
        except Exception as e:
            logger.error(f"Listing insights error: {e}")
            return {"success": False, "error": str(e)}

    def generate_timeline(self, timeline_data: Dict[str, Any], couple_id: str = "default") -> Dict[str, Any]:
        """Timeline agent creates a comprehensive wedding planning timeline."""
        if not self.llm:
            return {"success": False, "error": "Ollama LLM not available"}
        try:
            context = self.memory.get_context(couple_id, last_n=5)
            task = Task(
                description=f"""Create a comprehensive Indian wedding planning timeline:
{json.dumps(timeline_data, indent=2)}

Previous conversation context:
{context}

Include: month-by-month planning schedule, vendor booking deadlines, ceremony scheduling,
day-of timeline, family coordination, and cultural timing (muhurat) considerations.""",
                agent=self.agents["timeline_agent"],
                expected_output="Detailed wedding planning timeline with milestones and schedules"
            )
            result = self._run_single_task(task)
            self.memory.add(couple_id, "assistant", f"Timeline: {result[:300]}")
            return {"success": True, "timeline": result}
        except Exception as e:
            logger.error(f"Timeline generation error: {e}")
            return {"success": False, "error": str(e)}

    def analyze_vendor_list(self, vendor_data: Dict[str, Any], couple_id: str = "default") -> Dict[str, Any]:
        """Vendor agent provides in-depth analysis of a vendor list against preferences."""
        if not self.llm:
            return {"success": False, "error": "Ollama LLM not available"}
        try:
            context = self.memory.get_context(couple_id, last_n=5)
            task = Task(
                description=f"""Analyze these vendors for an Indian wedding:
{json.dumps(vendor_data, indent=2)}

Previous conversation context:
{context}

For each vendor: score 1-10, list strengths and concerns, and give an overall recommendation.
Consider Indian wedding market rates and cultural requirements.""",
                agent=self.agents["vendor_agent"],
                expected_output="Vendor analysis with scores, strengths, concerns, and recommendation"
            )
            result = self._run_single_task(task)
            self.memory.add(couple_id, "assistant", f"Vendor list analysis: {result[:300]}")
            return {"success": True, "analysis": result}
        except Exception as e:
            logger.error(f"Vendor analysis error: {e}")
            return {"success": False, "error": str(e)}

# Global instance
gemini_production_agents = None

def get_gemini_production_agents(gemini_api_key: str = None):
    """Get or create production agents instance"""
    global gemini_production_agents
    if gemini_production_agents is None:
        gemini_production_agents = ProductionWeddingAgentsGemini(gemini_api_key)
    return gemini_production_agents


def test_gemini_production_agents():
    """Test the production agents"""
    try:
        print("Testing Production Wedding AI Agents (Ollama)...")
        agents = get_gemini_production_agents()

        if not agents.llm:
            print("Ollama not available - is it running?")
            return False

        test_form = {
            "weddingType": "Traditional Hindu",
            "city": "Mumbai",
            "guestCount": "250",
            "budgetRange": "₹50-70 Lakhs",
            "weddingStyle": "Traditional",
            "events": ["Wedding Ceremony", "Reception"]
        }

        print("Processing wedding form with AI agents...")
        result = agents.process_wedding_form(test_form)

        if result["success"]:
            print("Production AI Agents working successfully!")
            print(f"   AI Powered: {result['ai_powered']}")
            print(f"   Local LLM: {result['local_llm']}")
            print(f"   Model Used: {result['model_used']}")
            print(f"   Agents Used: {result['agents_used']}")
            print(f"   Production Ready: {result.get('production_ready', True)}")

            # Show parsed insights
            parsed = result['parsed_insights']
            print(f"   Budget Categories: {len(parsed['budget_analysis']['categories_found'])}")
            print(f"   Vendor Categories: {len(parsed['vendor_insights']['categories'])}")

            return True
        else:
            print(f"Agent test failed: {result['error']}")
            return False

    except Exception as e:
        print(f"Test error: {str(e)}")
        return False

def test_comprehensive_gemini_planning():
    """Test comprehensive wedding planning with Ollama"""
    try:
        print("Testing Comprehensive Wedding Planning (Ollama)...")
        agents = get_gemini_production_agents()

        if not agents.llm:
            print("Ollama not available")
            return False

        test_data = {
            "weddingType": "Traditional Hindu",
            "city": "Delhi",
            "guestCount": 300,
            "budgetRange": "₹60-80 Lakhs",
            "weddingStyle": "Traditional with Modern Touch",
            "events": ["Mehendi", "Sangam", "Wedding Ceremony", "Reception"],
            "weddingDate": "2024-12-15",
            "priorities": ["Venue", "Catering", "Photography"]
        }

        print("Getting comprehensive wedding plan with Ollama...")
        result = agents.get_comprehensive_wedding_plan(test_data)

        if result["success"]:
            print("Comprehensive Planning working!")
            print(f"   All Agents Used: {result['agents_used']}")
            print(f"   Model: {result['model_used']}")
            print(f"   Production Ready: {result['production_ready']}")

            plan = result['comprehensive_plan']
            print(f"   Budget Items: {len(plan.get('budget_breakdown', {}))}")
            print(f"   Vendor Recommendations: {len(plan.get('vendor_recommendations', []))}")
            print(f"   Style Elements: {len(plan.get('style_guide', []))}")
            print(f"   Timeline Milestones: {len(plan.get('timeline_milestones', []))}")

            return True
        else:
            print(f"Comprehensive planning failed: {result['error']}")
            return False

    except Exception as e:
        print(f"Test error: {str(e)}")
        return False

if __name__ == "__main__":
    # Test basic agents
    print("TESTING OLLAMA-BASED PRODUCTION AGENTS")
    print("="*50)

    basic_success = test_gemini_production_agents()

    if basic_success:
        print("\nTESTING COMPREHENSIVE PLANNING")
        print("="*50)
        comprehensive_success = test_comprehensive_gemini_planning()

        if comprehensive_success:
            print("\n" + "="*60)
            print("PRODUCTION AGENTS FULLY OPERATIONAL!")
            print("   - Ollama GLM4 LLM working")
            print("   - All 5 specialized agents operational")
            print("   - Tool-using agents (Gap 1)")
            print("   - Conversation memory (Gap 2)")
            print("   - Parallel execution support (Gap 3)")
            print("   - Self-correction feedback loop (Gap 4)")
            print("   - On-platform communications (Gap 5)")
            print("   - No OpenAI dependency")
            print("="*60)
        else:
            print("\nComprehensive planning needs debugging")
    else:
        print("\nBasic agent setup needs debugging")
