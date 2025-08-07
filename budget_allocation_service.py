from typing import Dict, Any, List, Tuple
import json

class BudgetAllocationService:
    """
    Intelligent budget allocation based on user priorities and total budget
    """
    
    def __init__(self):
        # Default budget percentages for different categories
        self.default_allocations = {
            "Venue": 30,           # Largest expense typically
            "Catering": 25,        # Food and beverage
            "Photography": 12,     # Photos/videos
            "Decor": 15,          # Decorations and flowers
            "Entertainment": 8,    # Music, DJ, performers
            "Outfits": 6,         # Clothing and jewelry
            "Guest Experience": 4, # Transportation, accommodation
            "Traditions": 3,       # Religious ceremonies, customs
            "Miscellaneous": 2     # Buffer for unexpected costs
        }
        
        # Priority-based allocation adjustments
        self.priority_multipliers = {
            1: 1.4,  # First priority gets 40% boost
            2: 1.2,  # Second priority gets 20% boost  
            3: 1.1   # Third priority gets 10% boost
        }
        
        # Budget range mappings (in Indian Rupees)
        self.budget_ranges = {
            "Under ₹10 Lakhs": {"min": 500000, "max": 1000000, "avg": 750000},
            "₹10-20 Lakhs": {"min": 1000000, "max": 2000000, "avg": 1500000},
            "₹20-30 Lakhs": {"min": 2000000, "max": 3000000, "avg": 2500000},
            "₹30-50 Lakhs": {"min": 3000000, "max": 5000000, "avg": 4000000},
            "Above ₹50 Lakhs": {"min": 5000000, "max": 10000000, "avg": 7500000}
        }
    
    def calculate_budget_allocation(self, budget_range: str, priorities: List[str], 
                                  guest_count: int = 150, wedding_style: str = "Traditional") -> Dict[str, Any]:
        """
        Calculate detailed budget allocation based on priorities and constraints
        """
        result = {
            "success": False,
            "total_budget": 0,
            "allocations": {},
            "priority_based_allocations": {},
            "recommendations": [],
            "summary": ""
        }
        
        try:
            # Step 1: Get total budget amount
            if budget_range not in self.budget_ranges:
                result["error"] = f"Invalid budget range: {budget_range}"
                return result
            
            budget_info = self.budget_ranges[budget_range]
            total_budget = budget_info["avg"]
            result["total_budget"] = total_budget
            
            # Step 2: Start with default allocations
            base_allocations = self.default_allocations.copy()
            
            # Step 3: Adjust based on priorities
            priority_adjusted = self._apply_priority_adjustments(base_allocations, priorities)
            
            # Step 4: Adjust based on guest count and style
            style_adjusted = self._apply_style_adjustments(priority_adjusted, wedding_style, guest_count)
            
            # Step 5: Calculate actual amounts
            final_allocations = self._calculate_amounts(style_adjusted, total_budget)
            
            # Step 6: Generate recommendations
            recommendations = self._generate_recommendations(final_allocations, priorities, wedding_style)
            
            result["success"] = True
            result["allocations"] = final_allocations
            result["priority_based_allocations"] = self._get_priority_breakdown(final_allocations, priorities)
            result["recommendations"] = recommendations
            result["summary"] = self._create_summary(final_allocations, priorities, total_budget)
            
        except Exception as e:
            result["error"] = f"Budget calculation failed: {str(e)}"
        
        return result
    
    def _apply_priority_adjustments(self, base_allocations: Dict[str, float], 
                                  priorities: List[str]) -> Dict[str, float]:
        """Apply priority-based adjustments to budget allocations"""
        adjusted = base_allocations.copy()
        
        # Apply multipliers to prioritized categories
        for i, priority_category in enumerate(priorities[:3]):  # Top 3 priorities only
            if priority_category in adjusted:
                priority_rank = i + 1
                multiplier = self.priority_multipliers.get(priority_rank, 1.0)
                adjusted[priority_category] *= multiplier
        
        # Normalize to ensure total is 100%
        total = sum(adjusted.values())
        for category in adjusted:
            adjusted[category] = (adjusted[category] / total) * 100
        
        return adjusted
    
    def _apply_style_adjustments(self, allocations: Dict[str, float], 
                               wedding_style: str, guest_count: int) -> Dict[str, float]:
        """Adjust allocations based on wedding style and guest count"""
        adjusted = allocations.copy()
        
        # Style-based adjustments
        style_adjustments = {
            "Traditional": {"Traditions": 1.3, "Decor": 1.2, "Outfits": 1.2},
            "Modern": {"Photography": 1.3, "Entertainment": 1.2, "Guest Experience": 1.1},
            "Fusion": {"Decor": 1.2, "Entertainment": 1.2, "Photography": 1.1},
            "Minimalist": {"Venue": 1.2, "Photography": 1.3, "Decor": 0.7},
            "Royal": {"Venue": 1.3, "Decor": 1.4, "Outfits": 1.3},
            "Destination": {"Venue": 1.4, "Guest Experience": 1.5, "Catering": 1.2}
        }
        
        if wedding_style in style_adjustments:
            for category, multiplier in style_adjustments[wedding_style].items():
                if category in adjusted:
                    adjusted[category] *= multiplier
        
        # Guest count adjustments
        if guest_count > 300:
            adjusted["Catering"] *= 1.2
            adjusted["Venue"] *= 1.1
        elif guest_count < 100:
            adjusted["Catering"] *= 0.9
            adjusted["Venue"] *= 0.9
        
        # Normalize again
        total = sum(adjusted.values())
        for category in adjusted:
            adjusted[category] = (adjusted[category] / total) * 100
        
        return adjusted
    
    def _calculate_amounts(self, percentages: Dict[str, float], 
                          total_budget: int) -> Dict[str, Dict[str, Any]]:
        """Convert percentages to actual rupee amounts"""
        allocations = {}
        
        for category, percentage in percentages.items():
            amount = int((percentage / 100) * total_budget)
            allocations[category] = {
                "percentage": round(percentage, 1),
                "amount": amount,
                "amount_formatted": self._format_rupees(amount),
                "range_min": int(amount * 0.8),  # 80% of budget
                "range_max": int(amount * 1.2),  # 120% of budget
                "range_formatted": f"{self._format_rupees(int(amount * 0.8))} - {self._format_rupees(int(amount * 1.2))}"
            }
        
        return allocations
    
    def _get_priority_breakdown(self, allocations: Dict[str, Dict[str, Any]], 
                              priorities: List[str]) -> Dict[str, Any]:
        """Create a special breakdown for priority categories"""
        priority_breakdown = {}
        total_priority_budget = 0
        
        for i, priority in enumerate(priorities[:3]):
            if priority in allocations:
                rank = i + 1
                priority_breakdown[f"Priority_{rank}"] = {
                    "category": priority,
                    "rank": rank,
                    **allocations[priority]
                }
                total_priority_budget += allocations[priority]["amount"]
        
        priority_breakdown["total_priority_budget"] = {
            "amount": total_priority_budget,
            "amount_formatted": self._format_rupees(total_priority_budget),
            "percentage_of_total": round((total_priority_budget / sum(a["amount"] for a in allocations.values())) * 100, 1)
        }
        
        return priority_breakdown
    
    def _generate_recommendations(self, allocations: Dict[str, Dict[str, Any]], 
                                priorities: List[str], wedding_style: str) -> List[str]:
        """Generate budget recommendations based on allocation"""
        recommendations = []
        
        # Priority-based recommendations
        for i, priority in enumerate(priorities[:3]):
            if priority in allocations:
                rank = i + 1
                amount = allocations[priority]["amount_formatted"]
                recommendations.append(
                    f"💎 Priority {rank} ({priority}): Allocate {amount} for premium {priority.lower()} options"
                )
        
        # Style-specific recommendations
        style_recommendations = {
            "Traditional": [
                "🏛️ Consider heritage venues for authentic traditional ambiance",
                "🎨 Invest in traditional decor elements like marigolds and brass items",
                "👘 Budget for traditional outfits and jewelry rental/purchase"
            ],
            "Modern": [
                "📸 Prioritize professional photography and videography packages",
                "🎵 Invest in modern entertainment and sound systems",
                "🏨 Consider contemporary venues with modern amenities"
            ],
            "Royal": [
                "🏰 Book premium palace or luxury hotel venues",
                "👑 Allocate significant budget for elaborate decor and lighting",
                "💎 Consider higher-end outfit and jewelry options"
            ]
        }
        
        if wedding_style in style_recommendations:
            recommendations.extend(style_recommendations[wedding_style])
        
        # General recommendations
        recommendations.extend([
            "💰 Keep 10-15% buffer for unexpected expenses",
            "📋 Get multiple quotes for each category before finalizing",
            "🎯 Focus 60% of budget on your top 3 priorities for maximum impact"
        ])
        
        return recommendations
    
    def _create_summary(self, allocations: Dict[str, Dict[str, Any]], 
                       priorities: List[str], total_budget: int) -> str:
        """Create a summary of the budget allocation"""
        priority_total = sum(allocations[p]["amount"] for p in priorities[:3] if p in allocations)
        priority_percentage = round((priority_total / total_budget) * 100, 1)
        
        summary = f"""
Budget Allocation Summary:
• Total Budget: {self._format_rupees(total_budget)}
• Priority Categories ({len(priorities[:3])}): {self._format_rupees(priority_total)} ({priority_percentage}%)
• Top Allocation: {max(allocations, key=lambda x: allocations[x]['amount'])} - {allocations[max(allocations, key=lambda x: allocations[x]['amount'])]['amount_formatted']}
• Recommended to focus on your priorities: {', '.join(priorities[:3])}
""".strip()
        
        return summary
    
    def _format_rupees(self, amount: int) -> str:
        """Format amount in Indian rupee format"""
        if amount >= 10000000:  # 1 crore
            return f"₹{amount/10000000:.1f} Cr"
        elif amount >= 100000:  # 1 lakh
            return f"₹{amount/100000:.1f} L"
        else:
            return f"₹{amount:,}"

def test_budget_allocation():
    """Test budget allocation with sample data"""
    service = BudgetAllocationService()
    
    # Test data matching your frontend form
    test_cases = [
        {
            "name": "Traditional High-Budget Wedding",
            "budget_range": "₹30-50 Lakhs",
            "priorities": ["Venue", "Decor", "Catering"],
            "guest_count": 300,
            "wedding_style": "Traditional"
        },
        {
            "name": "Modern Mid-Budget Wedding", 
            "budget_range": "₹20-30 Lakhs",
            "priorities": ["Photography", "Venue", "Entertainment"],
            "guest_count": 150,
            "wedding_style": "Modern"
        },
        {
            "name": "Minimalist Wedding",
            "budget_range": "₹10-20 Lakhs", 
            "priorities": ["Photography", "Guest Experience", "Catering"],
            "guest_count": 80,
            "wedding_style": "Minimalist"
        }
    ]
    
    print("🧮 Testing Budget Allocation Service")
    print("="*70)
    
    for test_case in test_cases:
        print(f"\n🎯 {test_case['name']}")
        print("-" * 50)
        
        result = service.calculate_budget_allocation(
            budget_range=test_case["budget_range"],
            priorities=test_case["priorities"],
            guest_count=test_case["guest_count"],
            wedding_style=test_case["wedding_style"]
        )
        
        if result["success"]:
            print(f"Total Budget: {service._format_rupees(result['total_budget'])}")
            print(f"Priorities: {', '.join(test_case['priorities'])}")
            
            print("\n📊 Priority-Based Allocations:")
            for key, value in result["priority_based_allocations"].items():
                if key.startswith("Priority_"):
                    print(f"  {value['category']}: {value['amount_formatted']} ({value['percentage']}%)")
            
            print(f"\n💡 Top 3 Recommendations:")
            for i, rec in enumerate(result["recommendations"][:3], 1):
                print(f"  {i}. {rec}")
                
            print(f"\n📋 {result['summary']}")
        else:
            print(f"❌ Error: {result.get('error', 'Unknown error')}")
    
    return result

if __name__ == "__main__":
    test_budget_allocation() 