# 🤖 AI Blueprint Generation - Detailed Breakdown

## **Overview**
The wedding blueprint generation is powered by **5 specialized CrewAI agents** using **Google Gemini API** (gemini-2.0-flash-exp model) with detailed prompts designed specifically for Indian weddings.

---

## **🎯 AI Agents & Their Roles**

### **1. Wedding Budget Specialist**
- **Role**: Create optimal budget allocations based on wedding requirements
- **Expertise**: 15+ years of experience in Indian weddings, regional pricing, seasonal variations
- **Prompt Focus**: 
  - Venue (35-40%), Catering (25-30%), Photography (10-15%)
  - Decoration (8-12%), Clothing & Jewelry (5-10%), Entertainment (3-8%)
  - Transport (2-5%), Miscellaneous (5-10%)
  - Specific INR amounts based on total budget
  - Cost-saving tips and priority recommendations

### **2. Wedding Vendor Specialist**
- **Role**: Recommend suitable wedding vendors based on requirements and budget
- **Expertise**: Deep knowledge of Indian wedding industry, vendor categories, quality indicators
- **Prompt Focus**:
  - Venue vendors (banquet halls, hotels, outdoor venues)
  - Catering vendors (menu options, pricing per plate, tasting considerations)
  - Photography vendors (portfolio evaluation, package inclusions)
  - Decoration vendors (style matching, seasonal flowers, lighting setup)

### **3. Wedding Style Consultant**
- **Role**: Create cohesive wedding themes and design recommendations
- **Expertise**: Indian wedding traditions, modern trends, color theory, cultural significance
- **Currently**: Available but not actively used in blueprint generation

### **4. Wedding Timeline Manager**
- **Role**: Create comprehensive wedding planning timelines and schedules
- **Expertise**: Multi-day celebrations, vendor coordination, cultural timing requirements
- **Currently**: Available but not actively used in blueprint generation

### **5. Wedding Communications Specialist**
- **Role**: Orchestrate digital communications (Google & Meta platform integrations)
- **Expertise**: Gmail vendor communications, Google Calendar, WhatsApp coordination, RSVP management
- **Currently**: Used for separate communications strategy endpoint

---

## **📋 Current Blueprint Generation Process**

### **Step 1: Data Transformation**
Frontend preferences are converted to this format:
```json
{
  "yourName": "Sneha",
  "partnerName": "Raj", 
  "city": "Mumbai",
  "weddingDate": "2024-12-15",
  "budget": "₹50-70 Lakhs",
  "guestCount": 200,
  "weddingType": "Traditional",
  "duration": "Multi-day celebration",
  "events": ["Wedding Ceremony", "Reception"],
  "priorities": ["Venue", "Photography", "Catering"],
  "specialRequirements": "Venue: Hotel, Cuisine: Indian, Photography: Traditional"
}
```

### **Step 2: AI Agent Execution**
**Budget Agent Prompt:**
```
Analyze the wedding requirements and create a detailed budget plan:

Wedding Details:
- Type: Traditional
- Location: Mumbai  
- Guest Count: 200
- Budget Range: ₹50-70 Lakhs
- Style: Traditional
- Events: Wedding Ceremony, Reception

Based on your expertise in Indian wedding planning, create a comprehensive budget breakdown:

1. VENUE (35-40%): Estimate costs for ceremony and reception venues
2. CATERING (25-30%): Food costs per plate for 200 guests
3. PHOTOGRAPHY (10-15%): Professional wedding photography and videography
4. DECORATION (8-12%): Floral arrangements, lighting, and stage decoration
5. CLOTHING & JEWELRY (5-10%): Bridal and groom attire
6. ENTERTAINMENT (3-8%): Music, DJ, or live performances
7. TRANSPORT (2-5%): Vehicle arrangements for wedding party
8. MISCELLANEOUS (5-10%): Invitations, gifts, and unexpected expenses

Provide specific amount ranges in INR for each category based on the total budget of ₹50-70 Lakhs.
Include cost-saving tips and priority recommendations.
```

**Vendor Agent Prompt:**
```
Based on the wedding requirements, provide comprehensive vendor recommendations:

Requirements:
- Location: Mumbai
- Wedding Type: Traditional
- Budget: ₹50-70 Lakhs
- Guest Count: 200
- Style: Traditional

For each major vendor category, provide:

1. VENUE VENDORS:
   - Types to consider (banquet halls, hotels, outdoor venues)
   - Key questions to ask about capacity, catering policies, decorations
   - Red flags to avoid
   - Expected pricing range for 200 guests

2. CATERING VENDORS:
   - Menu options for Traditional weddings
   - Questions about food quality, service staff, equipment
   - Pricing expectations per plate
   - Tasting and contract considerations

3. PHOTOGRAPHY VENDORS:
   - Portfolio evaluation criteria
   - Package inclusions (pre-wedding, ceremony, reception)
   - Delivery timelines and formats
   - Pricing expectations for professional coverage

4. DECORATION VENDORS:
   - Style matching for Traditional theme
   - Seasonal flower availability and pricing
   - Lighting and stage setup capabilities
   - Setup and breakdown logistics

Provide practical, actionable advice for vendor selection and negotiation.
```

### **Step 3: CrewAI Processing**
- **Model**: gemini-2.0-flash-exp
- **Temperature**: 0.7 (balanced creativity/accuracy)
- **Max Tokens**: 2000
- **Process**: Sequential (Budget Agent → Vendor Agent)
- **Memory**: Disabled (stateless processing)

### **Step 4: Blueprint Assembly**
The AI responses are structured into:
```json
{
  "weddingSummary": "AI-powered wedding plan summary",
  "recommendations": {
    "venue": [{"category": "Primary Venue", "name": "Hotel in Mumbai", "description": "AI recommendations", "price": "₹50-70 Lakhs"}],
    "catering": [{"category": "Catering Service", "name": "Multi-cuisine Catering", "description": "AI-curated options", "price": "Based on guest count"}],
    "photography": [{"category": "Photography & Videography", "name": "Traditional Photography", "description": "Professional team", "price": "Package coverage"}],
    "decoration": [{"category": "Decor & Theme", "name": "Traditional Theme", "description": "AI-designed theme", "price": "Custom package"}]
  },
  "timeline": "AI-generated 6-month timeline",
  "budgetBreakdown": "Venue (40%), Catering (25%), Photography (15%), Decoration (12%), Miscellaneous (8%)"
}
```

---

## **🔧 Technical Architecture**

### **Backend API Flow**
1. **Frontend** → `POST /ai-consultation` → **FastAPI**
2. **FastAPI** → `ProductionWeddingAgentsGemini.process_wedding_form()` → **CrewAI**
3. **CrewAI** → **Gemini API** (gemini-2.0-flash-exp)
4. **Gemini** → **AI Analysis** → **Structured Response**
5. **Response** → **Frontend Blueprint Modal**

### **Current Active Agents**
- ✅ **Budget Specialist**: Generating detailed budget breakdowns
- ✅ **Vendor Specialist**: Providing vendor recommendations
- ⏸️ **Style Consultant**: Available but not currently used
- ⏸️ **Timeline Manager**: Available but not currently used  
- ⏸️ **Communications Specialist**: Used for separate communications endpoint

---

## **💡 Optimization Opportunities**

### **1. Expand Agent Usage**
- **Style Agent**: Add detailed theme and decoration prompts
- **Timeline Agent**: Include comprehensive planning timelines
- **All Agents**: Create multi-agent collaboration for richer blueprints

### **2. Enhanced Prompting**
- **Location-Specific**: Add city-specific vendor knowledge
- **Cultural Context**: Include regional wedding traditions
- **Seasonal Considerations**: Factor in wedding season pricing

### **3. Prompt Engineering**
- **Examples**: Include sample responses in prompts
- **Constraints**: Add specific output format requirements
- **Chain of Thought**: Guide agents through step-by-step reasoning

---

## **📊 Current Blueprint Quality**

### **✅ Strengths**
- **AI-Powered**: Real Gemini API integration with specialized agents
- **Indian Context**: Prompts designed for Indian wedding market
- **Comprehensive**: Covers all major wedding categories
- **Budget-Focused**: Detailed financial planning with percentages

### **🔄 Areas for Enhancement**
- **More Agents**: Only 2 of 5 agents currently active in blueprint generation
- **Richer Content**: Could include more detailed recommendations
- **Image Generation**: Not currently implemented
- **Personalization**: Could be more specific to couple's unique preferences

---

## **🎯 Summary**

**Yes, specialized AI agents are working on blueprint generation!** 

The system uses **2 active CrewAI agents** (Budget Specialist & Vendor Specialist) powered by **Google Gemini API** with detailed, Indian wedding-specific prompts. Each agent receives comprehensive context about the couple's preferences and generates expert-level recommendations in their domain.

The prompts are carefully crafted with:
- **Specific percentages** for budget allocation
- **Detailed vendor categories** and evaluation criteria  
- **Indian wedding context** and cultural considerations
- **Practical advice** for vendor selection and negotiation

This creates a truly **AI-generated, expert-level wedding blueprint** tailored to the couple's specific requirements and budget.
