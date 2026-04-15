
#!/usr/bin/env python3
"""
Intelligent Vendor Selection CrewAI System
Advanced vendor matching with business logic and AI agents
"""

import os
from typing import Dict, Any, List
from datetime import datetime
import json
import logging

from crewai import Agent, Task, Crew, LLM
from crewai_tools import SerperDevTool

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class IntelligentVendorSelectionCrew:
    """
    Advanced vendor selection system using CrewAI agents
    """
    
    def __init__(self, serper_api_key: str = None):
        # Ensure no OpenAI interference
        if "OPENAI_API_KEY" in os.environ:
            del os.environ["OPENAI_API_KEY"]
        
        # Initialize Ollama LLM
        try:
            self.llm = LLM(
                model="ollama/crewai-nous-hermes:latest",
                base_url="http://localhost:11434",
                api_key="ollama"
            )
            logger.info("✅ Ollama LLM connected successfully")
        except Exception as e:
            logger.error(f"❌ Ollama connection failed: {e}")
            self.llm = None
            return
        
        # Initialize Serper search tool if available
        self.search_available = False
        if serper_api_key:
            try:
                os.environ["SERPER_API_KEY"] = serper_api_key
                self.search_tool = SerperDevTool()
                self.search_available = True
                logger.info("✅ Serper search tool enabled")
            except Exception as e:
                logger.warning(f"⚠️ Serper tool not available: {e}")
                self.search_tool = None
        else:
            self.search_tool = None
        
        # Create specialized vendor selection agents
        self.agents = self._create_vendor_agents()
        
        logger.info("✅ Intelligent Vendor Selection Crew initialized")
    
    def _create_vendor_agents(self) -> Dict[str, Agent]:
        """Create specialized vendor selection agents"""
        
        tools = [self.search_tool] if self.search_available else []
        
        # Vendor Filtering Agent
        vendor_filter_agent = Agent(
            role="Vendor Filtering Specialist",
            goal="Apply intelligent filtering criteria to find suitable vendors",
            backstory="""Expert in vendor qualification and filtering based on wedding requirements.
            Applies business logic to ensure vendors meet basic criteria like budget, capacity, 
            location proximity, and availability. Uses advanced filtering algorithms.""",
            tools=tools,
            llm=self.llm,
            verbose=True,
            allow_delegation=False,
            max_iter=2
        )
        
        # Vendor Scoring Agent
        vendor_scoring_agent = Agent(
            role="Vendor Scoring Specialist", 
            goal="Calculate intelligent match scores for vendor recommendations",
            backstory="""Mathematical expert in vendor-client matching algorithms.
            Calculates multi-factor scores based on budget alignment, style compatibility,
            location convenience, quality ratings, and user preferences.""",
            tools=tools,
            llm=self.llm,
            verbose=True,
            allow_delegation=False,
            max_iter=2
        )
        
        # Budget Validation Agent
        budget_validation_agent = Agent(
            role="Budget Validation Specialist",
            goal="Ensure vendor selections align with allocated category budgets",
            backstory="""Financial expert specializing in wedding budget management.
            Validates that recommended vendors fit within allocated category budgets
            and provides cost-impact analysis for different vendor choices.""",
            tools=tools,
            llm=self.llm,
            verbose=True,
            allow_delegation=False,
            max_iter=2
        )
        
        # Style Matching Agent
        style_matching_agent = Agent(
            role="Style Matching Specialist",
            goal="Match vendors to specific wedding themes and aesthetic preferences",
            backstory="""Creative expert in wedding aesthetics and vendor specializations.
            Analyzes vendor portfolios and specialties to match with couple's style
            preferences, theme requirements, and cultural considerations.""",
            tools=tools,
            llm=self.llm,
            verbose=True,
            allow_delegation=False,
            max_iter=2
        )
        
        # Vendor Research Agent
        vendor_research_agent = Agent(
            role="Vendor Research Specialist",
            goal="Research and validate vendor credentials and availability",
            backstory="""Investigation expert specializing in vendor verification.
            Researches vendor backgrounds, reviews, availability, and current
            market positioning to ensure quality recommendations.""",
            tools=tools,
            llm=self.llm,
            verbose=True,
            allow_delegation=False,
            max_iter=2
        )
        
        return {
            "vendor_filter": vendor_filter_agent,
            "vendor_scoring": vendor_scoring_agent,
            "budget_validation": budget_validation_agent,
            "style_matching": style_matching_agent,
            "vendor_research": vendor_research_agent
        }
    
    def intelligent_vendor_selection(self, wedding_data: Dict, vendor_pool: List[Dict]) -> Dict:
        """
        Perform intelligent vendor selection using CrewAI agents
        """
        if not self.llm:
            return {"error": "LLM not available"}
            
        try:
            logger.info("🚀 Starting intelligent vendor selection with CrewAI")
            
            # Task 1: Apply intelligent filtering
            filtering_task = Task(
                description=f"""Apply intelligent filtering to vendor pool based on wedding requirements:

Wedding Requirements:
- Budget Range: {wedding_data.get('budgetRange', 'Not specified')}
- Location: {wedding_data.get('city', 'Mumbai')}
- Guest Count: {wedding_data.get('guestCount', 100)}
- Wedding Type: {wedding_data.get('weddingType', 'Traditional')}
- Style Preference: {wedding_data.get('weddingStyle', 'Traditional')}
- Priority Categories: {', '.join(wedding_data.get('priorities', []))}

Vendor Pool: {len(vendor_pool)} vendors to evaluate

Apply these filtering criteria:

1. **Budget Compatibility**: 
   - Calculate category budget allocation (Venue: 35%, Catering: 25%, Photography: 15%, etc.)
   - Filter vendors within 120% of allocated budget
   - Flag premium options that exceed budget

2. **Capacity Validation**:
   - For venues: Check capacity vs guest count
   - Ensure vendor can handle event scale
   - Consider logistics and space requirements

3. **Location Proximity**:
   - Prioritize local vendors (same city)
   - Include nearby vendors (within 50km)
   - Note travel costs for distant vendors

4. **Availability Screening**:
   - Check general availability patterns
   - Consider seasonal demand factors
   - Flag popular vendors that book early

5. **Quality Standards**:
   - Minimum rating threshold (4.0+)
   - Experience requirements (2+ years)
   - Portfolio quality assessment

Provide filtered vendor list with elimination reasons for excluded vendors.""",
                agent=self.agents["vendor_filter"],
                expected_output="Filtered vendor list with detailed elimination criteria and reasoning"
            )
            
            # Task 2: Calculate intelligent match scores
            scoring_task = Task(
                description=f"""Calculate intelligent match scores for filtered vendors:

For each vendor in the filtered list, calculate comprehensive match scores:

**SCORING ALGORITHM** (Total: 100 points):

1. **Budget Alignment (25 points)**:
   - Perfect fit (within allocated budget): 25 points
   - Slight overage (10-20% over): 20 points
   - Moderate overage (20-30% over): 15 points
   - High overage (30%+ over): 5 points

2. **Style Compatibility (20 points)**:
   - Perfect style match: 20 points
   - Good style alignment: 15 points
   - Moderate compatibility: 10 points
   - Style mismatch: 5 points

3. **Location Convenience (15 points)**:
   - Same city: 15 points
   - Nearby (within 25km): 12 points
   - Regional (within 50km): 8 points
   - Distant (50km+): 3 points

4. **Quality Rating (15 points)**:
   - 4.8+ rating: 15 points
   - 4.5-4.7 rating: 12 points
   - 4.0-4.4 rating: 8 points
   - Below 4.0: 3 points

5. **Experience Factor (10 points)**:
   - 10+ years: 10 points
   - 5-9 years: 8 points
   - 2-4 years: 5 points
   - Less than 2 years: 2 points

6. **Availability Score (10 points)**:
   - Highly available: 10 points
   - Moderately available: 7 points
   - Limited availability: 4 points
   - Rarely available: 1 point

7. **Special Factors (5 points)**:
   - Awards/certifications: +3 points
   - Client testimonials: +2 points
   - Portfolio strength: +2 points
   - Social media presence: +1 point

Calculate final match score and rank vendors by total score.""",
                agent=self.agents["vendor_scoring"],
                expected_output="Ranked vendor list with detailed match scores and breakdown"
            )
            
            # Task 3: Budget validation and impact analysis
            budget_task = Task(
                description=f"""Perform budget validation and cost impact analysis:

Wedding Budget: {wedding_data.get('budgetRange', 'Not specified')}

**BUDGET ALLOCATION ANALYSIS**:

1. **Category Budget Calculation**:
   - Venue: 35% of total budget
   - Catering: 25% of total budget  
   - Photography: 15% of total budget
   - Decoration: 12% of total budget
   - Other categories: Remaining 13%

2. **Vendor Cost Validation**:
   - Check each recommended vendor against category budget
   - Calculate total wedding cost with recommended vendors
   - Identify budget overruns and savings opportunities

3. **Cost Optimization Recommendations**:
   - Suggest alternative vendors if budget exceeded
   - Recommend premium upgrades if budget allows
   - Provide cost-saving strategies

4. **Financial Impact Analysis**:
   - Total estimated cost with recommended vendors
   - Budget variance analysis (+/- from planned budget)
   - Risk assessment for cost overruns

Provide detailed budget validation with actionable recommendations.""",
                agent=self.agents["budget_validation"],
                expected_output="Comprehensive budget validation with cost optimization recommendations"
            )
            
            # Task 4: Style matching and aesthetic analysis
            style_task = Task(
                description=f"""Perform style matching and aesthetic analysis:

Wedding Style Preferences:
- Wedding Type: {wedding_data.get('weddingType', 'Traditional')}
- Style Theme: {wedding_data.get('weddingStyle', 'Traditional')}
- Visual Preferences: {wedding_data.get('visualPreferences', {})}

**STYLE MATCHING ANALYSIS**:

1. **Theme Compatibility**:
   - Analyze vendor specializations vs wedding theme
   - Check portfolio alignment with style preferences
   - Evaluate cultural appropriateness and authenticity

2. **Aesthetic Coordination**:
   - Ensure cohesive visual narrative across vendors
   - Check color scheme compatibility
   - Validate decor and photography style alignment

3. **Vendor Specialization Match**:
   - Traditional vs modern specialization
   - Cultural wedding expertise
   - Seasonal and regional style knowledge

4. **Portfolio Quality Assessment**:
   - Review vendor past work for style consistency
   - Evaluate creative capability and innovation
   - Check style evolution and trend awareness

Provide style compatibility scores and coordination recommendations.""",
                agent=self.agents["style_matching"],
                expected_output="Style compatibility analysis with aesthetic coordination recommendations"
            )
            
            # Task 5: Final vendor research and validation
            research_task = Task(
                description=f"""Conduct final vendor research and validation:

{"Search for current vendor information and" if self.search_available else "Based on knowledge,"}
perform comprehensive vendor validation:

**VENDOR VALIDATION CHECKLIST**:

1. **Credential Verification**:
   - Business registration and licensing
   - Insurance and bonding status
   - Professional certifications
   - Industry memberships

2. **Market Position Analysis**:
   - Current market reputation
   - Recent client reviews and feedback
   - Social media presence and engagement
   - Award recognition and media coverage

3. **Operational Assessment**:
   - Service capacity and scalability
   - Team size and expertise
   - Equipment and technology capabilities
   - Quality control processes

4. **Risk Assessment**:
   - Financial stability indicators
   - Reliability and punctuality track record
   - Communication and professionalism
   - Contingency planning capabilities

5. **Final Recommendation Matrix**:
   - Top 3 vendors per category with rationale
   - Backup options for each category
   - Risk mitigation strategies
   - Negotiation recommendations

Provide final validated vendor recommendations with risk assessment.""",
                agent=self.agents["vendor_research"],
                expected_output="Final vendor recommendations with validation and risk assessment"
            )
            
            # Create crew and execute vendor selection
            vendor_crew = Crew(
                agents=list(self.agents.values()),
                tasks=[filtering_task, scoring_task, budget_task, style_task, research_task],
                verbose=True,
                memory=False
            )
            
            # Execute the vendor selection process
            result = vendor_crew.kickoff()
            
            # Parse and format results
            vendor_recommendations = self._parse_vendor_results(str(result))
            vendor_recommendations["search_enabled"] = self.search_available
            vendor_recommendations["agents_used"] = list(self.agents.keys())
            vendor_recommendations["processing_time"] = datetime.now().isoformat()
            
            return vendor_recommendations
            
        except Exception as e:
            logger.error(f"Error in vendor selection: {e}")
            return {"error": str(e)}
    
    def _parse_vendor_results(self, result: str) -> Dict:
        """Parse and structure vendor selection results"""
        try:
            recommendations = {
                "filtered_vendors": [],
                "scored_vendors": [],
                "budget_analysis": {},
                "style_matches": [],
                "final_recommendations": [],
                "risk_assessment": [],
                "optimization_tips": []
            }
            
            lines = result.split("\n")
            current_section = None
            
            for line in lines:
                line = line.strip()
                if not line:
                    continue
                    
                # Identify sections
                if "FILTERED VENDOR" in line.upper():
                    current_section = "filtered_vendors"
                elif "SCORED VENDOR" in line.upper() or "MATCH SCORE" in line.upper():
                    current_section = "scored_vendors"
                elif "BUDGET" in line.upper():
                    current_section = "budget_analysis"
                elif "STYLE" in line.upper():
                    current_section = "style_matches"
                elif "FINAL RECOMMENDATION" in line.upper():
                    current_section = "final_recommendations"
                elif "RISK" in line.upper():
                    current_section = "risk_assessment"
                elif current_section and line.startswith("-") or line.startswith("•"):
                    # Add content to current section
                    if current_section in recommendations:
                        if isinstance(recommendations[current_section], list):
                            recommendations[current_section].append(line[1:].strip())
                        elif isinstance(recommendations[current_section], dict) and ":" in line:
                            key, value = line.split(":", 1)
                            recommendations[current_section][key.strip()] = value.strip()
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Error parsing vendor results: {e}")
            return {"error": str(e), "raw_result": result}

# Global instance
intelligent_vendor_crew = None

def get_intelligent_vendor_crew(serper_api_key: str = None):
    """Get or create intelligent vendor crew instance"""
    global intelligent_vendor_crew
    if intelligent_vendor_crew is None:
        intelligent_vendor_crew = IntelligentVendorSelectionCrew(serper_api_key)
    return intelligent_vendor_crew

def test_vendor_selection_system():
    """Test the intelligent vendor selection system"""
    try:
        print("🧪 Testing Intelligent Vendor Selection System...")
        
        # Use Serper API key if available
        crew = get_intelligent_vendor_crew("19dd65af8ee73ed572d5b91d25a32d01eec1a31f")
        
        if not crew.llm:
            print("❌ Ollama not available - please start: ollama serve")
            return False
        
        # Test data
        test_wedding_data = {
            "weddingType": "Traditional Hindu",
            "city": "Mumbai", 
            "guestCount": 300,
            "budgetRange": "₹50-70 Lakhs",
            "weddingStyle": "Royal Traditional",
            "priorities": ["Venue", "Catering", "Photography"],
            "visualPreferences": {
                "theme": "Royal Palace",
                "colors": ["Red", "Gold", "Cream"]
            }
        }
        
        # Mock vendor pool
        test_vendors = [
            {
                "name": "Royal Palace Hotel",
                "category": "venue",
                "location": "Mumbai",
                "price_range": "₹8-12L",
                "rating": 4.8,
                "capacity": 500,
                "specialties": ["Royal Weddings", "Traditional"]
            },
            {
                "name": "Elite Photography Studio", 
                "category": "photography",
                "location": "Mumbai",
                "price_range": "₹3-5L",
                "rating": 4.9,
                "specialties": ["Traditional", "Candid"]
            }
        ]
        
        print("🤖 Running intelligent vendor selection...")
        result = crew.intelligent_vendor_selection(test_wedding_data, test_vendors)
        
        if "error" not in result:
            print("✅ Intelligent Vendor Selection System working!")
            print(f"   Search Enabled: {result.get('search_enabled', False)}")
            print(f"   Agents Used: {result.get('agents_used', [])}")
            print(f"   Sections Generated: {len([k for k, v in result.items() if isinstance(v, (list, dict)) and v])}")
            return True
        else:
            print(f"❌ Failed: {result['error']}")
            return False
            
    except Exception as e:
        print(f"❌ Test error: {str(e)}")
        return False

if __name__ == "__main__":
    success = test_vendor_selection_system()
    
    if success:
        print("\n" + "="*70)
        print("🎉 Intelligent Vendor Selection System Ready!")
        print("   ✅ Advanced filtering with business logic")
        print("   ✅ Multi-factor scoring algorithm") 
        print("   ✅ Budget validation and optimization")
        print("   ✅ Style matching and aesthetic analysis")
        print("   ✅ Vendor research and validation")
        print("   ✅ CrewAI agents: 5 specialized agents deployed")
        print("   ✅ Ollama LLM + Serper search integration")
        print("="*70)
    else:
        print("\n❌ Check Ollama setup and try again")
