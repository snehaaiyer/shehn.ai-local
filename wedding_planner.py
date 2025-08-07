import logging
from typing import Dict, Any
from crewai import Agent, Task, Crew, Process
from .llm import DirectOllamaLLM

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class WeddingPlannerCrew:
    """Wedding Planner Crew orchestrating multiple specialized agents."""
    
    def __init__(self, llm=None):
        """Initialize the wedding planner crew with a custom LLM."""
        self.llm = llm or DirectOllamaLLM(
            model="nous-hermes",
            temperature=0.7
        )
        
    def create_agents(self):
        """Create specialized agents for wedding planning."""
        
        # Form Analyzer Agent
        form_analyzer = Agent(
            role='Form Analyzer',
            goal='Analyze wedding form data and extract key requirements',
            backstory="""You are an expert at analyzing wedding requirements and extracting key insights.
            You understand how different factors like budget, guest count, and location affect wedding planning.
            You can identify potential challenges and opportunities in the requirements.""",
            allow_delegation=False,
            memory=False,
            llm=self.llm,
            verbose=True
        )
        
        # Preferences Analyzer Agent
        preferences_analyzer = Agent(
            role='Preferences Analyzer',
            goal='Analyze visual preferences and create style guidelines',
            backstory="""You are an expert wedding stylist with an eye for design and aesthetics.
            You can analyze visual preferences and mood boards to understand the desired wedding style.
            You excel at creating cohesive style guidelines that vendors can follow.""",
            allow_delegation=False,
            memory=False,
            llm=self.llm,
            verbose=True
        )
        
        # Vendor Research Agent
        vendor_researcher = Agent(
            role='Vendor Researcher',
            goal='Find and evaluate suitable vendors based on requirements',
            backstory="""You are a wedding vendor specialist with extensive knowledge of the industry.
            You know how to match vendors with specific wedding styles and requirements.
            You are skilled at evaluating vendors based on quality, reliability, and value.""",
            allow_delegation=False,
            memory=False,
            llm=self.llm,
            verbose=True
        )
        
        # Coordinator Agent
        coordinator = Agent(
            role='Wedding Coordinator',
            goal='Create final vendor recommendations and comprehensive plan',
            backstory="""You are a senior wedding coordinator who excels at bringing everything together.
            You can take inputs from various sources and create a cohesive plan.
            You know how to balance different factors to create the perfect vendor recommendations.""",
            allow_delegation=True,  # Coordinator can delegate tasks if needed
            memory=False,
            llm=self.llm,
            verbose=True
        )
        
        return {
            'form_analyzer': form_analyzer,
            'preferences_analyzer': preferences_analyzer,
            'vendor_researcher': vendor_researcher,
            'coordinator': coordinator
        }
    
    def create_tasks(self, agents: Dict[str, Agent], wedding_data: Dict[str, Any]):
        """Create tasks for the wedding planning process."""
        
        # Form Analysis Task
        analyze_form = Task(
            description=f"""Analyze the following wedding form data and extract key requirements:
            {wedding_data.get('form_data', {})}
            
            Focus on:
            1. Budget constraints and allocation
            2. Guest count implications
            3. Location requirements
            4. Timeline considerations
            
            Provide a structured analysis that other agents can use.""",
            agent=agents['form_analyzer']
        )
        
        # Preferences Analysis Task
        analyze_preferences = Task(
            description=f"""Analyze the visual preferences and create style guidelines:
            {wedding_data.get('visual_preferences', {})}
            
            Focus on:
            1. Color schemes and patterns
            2. Style and theme elements
            3. Mood and atmosphere
            4. Key visual requirements
            
            Create clear style guidelines for vendors.""",
            agent=agents['preferences_analyzer']
        )
        
        # Vendor Research Task
        research_vendors = Task(
            description="""Using the form analysis and style guidelines, research and evaluate vendors.
            
            Focus on:
            1. Matching vendors to style requirements
            2. Verifying availability and pricing
            3. Evaluating quality and reliability
            4. Creating vendor shortlists by category
            
            Provide detailed vendor recommendations.""",
            agent=agents['vendor_researcher']
        )
        
        # Final Coordination Task
        create_final_plan = Task(
            description="""Create a comprehensive vendor recommendation plan:
            
            1. Review all previous analyses
            2. Create final vendor recommendations
            3. Provide rationale for each selection
            4. Include backup options
            
            The plan should be clear and actionable.""",
            agent=agents['coordinator']
        )
        
        return [analyze_form, analyze_preferences, research_vendors, create_final_plan]
    
    def run(self, wedding_data: Dict[str, Any]) -> Dict[str, Any]:
        """Run the wedding planning process."""
        try:
            # Create agents
            agents = self.create_agents()
            
            # Create tasks
            tasks = self.create_tasks(agents, wedding_data)
            
            # Create crew
            crew = Crew(
                agents=list(agents.values()),
                tasks=tasks,
                memory=False,
                verbose=True
            )
            
            # Execute the planning process
            result = crew.kickoff()
            
            return {
                'success': True,
                'recommendations': result
            }
            
        except Exception as e:
            logger.error(f"Error in wedding planning process: {str(e)}", exc_info=True)
            return {
                'success': False,
                'error': str(e)
            }

# Example usage:
if __name__ == "__main__":
    # Example wedding data
    wedding_data = {
        'form_data': {
            'date': '2024-09-15',
            'location': 'San Francisco, CA',
            'budget': 50000,
            'guest_count': 100
        },
        'visual_preferences': {
            'color_scheme': ['dusty rose', 'navy', 'gold'],
            'style': 'modern elegant',
            'mood': 'romantic but not traditional'
        }
    }
    
    # Create and run the wedding planner
    planner = WeddingPlannerCrew()
    result = planner.run(wedding_data)
    
    # Print results
    if result['success']:
        print("\nWedding Planning Recommendations:")
        print(result['recommendations'])
    else:
        print("\nError in wedding planning:")
        print(result['error']) 