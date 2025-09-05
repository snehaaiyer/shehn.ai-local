import { CloudflareAIService } from './cloudflare_ai_service';
import { ThemePromptGenerator } from './theme_prompt_generator';
import { GeminiService } from './gemini_service';
import { AIImageResponse } from '../types/ai';

class WeddingBlueprintService {
  private static readonly API_BASE = process.env.NODE_ENV === 'production' 
    ? 'https://your-repl-domain.replit.dev'
    : 'http://0.0.0.0:8001';

  /**
   * Generate AI-powered wedding blueprint with comprehensive content
   */
  static async generateWeddingBlueprint(request: WeddingBlueprintRequest): Promise<{
    success: boolean;
    blueprint?: SavedBlueprint;
    error?: string;
  }> {
    try {
      console.log('🤖 Starting AI-powered wedding blueprint generation...');

      // Step 1: Generate AI content using Gemini
      const aiContent = await this.generateAIBlueprintContent(request);

      // Step 2: Generate theme-based images using Cloudflare AI
      const imagePrompt = {
        theme: request.theme.selectedTheme,
        style: 'Elegant Wedding Setup',
        colors: 'Traditional Wedding Colors',
        season: 'Wedding Season',
        venueType: request.venue.venueType,
        customDescription: `A beautiful ${request.theme.selectedTheme} wedding for ${request.basicDetails.guestCount} guests`,
        guestCount: request.basicDetails.guestCount,
        location: request.basicDetails.location
      };

      const imageResponse = await CloudflareAIService.generateWeddingThemeImages(imagePrompt);

      // Step 3: Create blueprint object
      const blueprint: SavedBlueprint = {
        id: `blueprint_${Date.now()}`,
        weddingId: `wedding_${Date.now()}`,
        coupleNames: `${request.basicDetails.yourName} & ${request.basicDetails.partnerName}`,
        aiGeneratedContent: aiContent,
        images: imageResponse.success ? imageResponse.images : [],
        generatedAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };

      // Step 4: Save blueprint to backend
      const saveResult = await this.saveBlueprintToBackend(blueprint);

      if (saveResult.success) {
        console.log('✅ Wedding blueprint generated and saved successfully');
        return { success: true, blueprint };
      } else {
        throw new Error('Failed to save blueprint to backend');
      }

    } catch (error) {
      console.error('❌ Error generating wedding blueprint:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Generate AI content using Gemini for comprehensive wedding planning
   */
  private static async generateAIBlueprintContent(request: WeddingBlueprintRequest) {
    const prompt = `You are an expert Indian wedding planner AI. Generate a comprehensive wedding blueprint based on these details:

**Wedding Details:**
- Couple: ${request.basicDetails.yourName} & ${request.basicDetails.partnerName}
- Date: ${request.basicDetails.weddingDate}
- Location: ${request.basicDetails.location}
- Guest Count: ${request.basicDetails.guestCount}
- Budget: ${request.basicDetails.budgetRange}
- Theme: ${request.theme.selectedTheme}
- Venue Type: ${request.venue.venueType}
- Catering: ${request.catering.cuisine} - ${request.catering.mealType}
- Photography: ${request.photography.style} - ${request.photography.coverage}

**Generate the following in JSON format:**
{
  "weddingSummary": "A beautiful 3-paragraph summary of their dream wedding vision",
  "recommendations": {
    "venue": [
      {"category": "venues", "name": "Specific venue name", "description": "Why this venue suits them", "price": "Price range"},
      {"category": "venues", "name": "Another venue", "description": "Description", "price": "Price range"},
      {"category": "venues", "name": "Third venue", "description": "Description", "price": "Price range"}
    ],
    "catering": [
      {"category": "catering", "name": "Catering service name", "description": "Menu and service style", "price": "Price per plate"},
      {"category": "catering", "name": "Another caterer", "description": "Description", "price": "Price"},
      {"category": "catering", "name": "Third caterer", "description": "Description", "price": "Price"}
    ],
    "photography": [
      {"category": "photography", "name": "Photography service", "description": "Style and coverage", "price": "Package price"},
      {"category": "photography", "name": "Another photographer", "description": "Description", "price": "Price"},
      {"category": "photography", "name": "Third photographer", "description": "Description", "price": "Price"}
    ],
    "decoration": [
      {"category": "decoration", "name": "Decoration service", "description": "Theme and style", "price": "Package price"},
      {"category": "decoration", "name": "Another decorator", "description": "Description", "price": "Price"},
      {"category": "decoration", "name": "Third decorator", "description": "Description", "price": "Price"}
    ]
  },
  "timeline": "Detailed 12-month wedding planning timeline with specific milestones",
  "budgetBreakdown": "Detailed budget allocation across all categories with specific amounts"
}

Make it personalized, culturally appropriate, and highly detailed.`;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=REDACTED_GEMINI_KEY`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 4000 }
        })
      });

      const result = await response.json();
      const generatedText = result.candidates?.[0]?.content?.parts?.[0]?.text;

      if (generatedText) {
        // Extract JSON from the response
        const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      }

      // Fallback content if AI generation fails
      return this.getFallbackContent(request);

    } catch (error) {
      console.error('Error generating AI content:', error);
      return this.getFallbackContent(request);
    }
  }

  /**
   * Save blueprint to backend with NocoDB integration
   */
  private static async saveBlueprintToBackend(blueprint: SavedBlueprint) {
    try {
      const response = await fetch(`${this.API_BASE}/api/save-blueprint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(blueprint)
      });

      if (response.ok) {
        const result = await response.json();
        return { success: true, id: result.id };
      } else {
        throw new Error(`Failed to save blueprint: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error saving blueprint:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send category-specific vendor emails with blueprint preferences
   */
  static async sendVendorEmails(blueprint: SavedBlueprint, testEmail: string = 'aiyersneha19@gmail.com') {
    try {
      console.log('📧 Sending category-specific vendor emails...');

      const categories = ['venue', 'catering', 'photography', 'decoration'];
      const emailResults = [];

      for (const category of categories) {
        const categoryData = blueprint.aiGeneratedContent.recommendations[category];
        if (categoryData && categoryData.length > 0) {
          const emailContent = this.generateCategorySpecificEmail(category, blueprint, categoryData);

          const emailResult = await fetch(`${this.API_BASE}/api/send-vendor-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              category,
              email: testEmail,
              subject: `Wedding ${category.charAt(0).toUpperCase() + category.slice(1)} Inquiry - ${blueprint.coupleNames}`,
              content: emailContent,
              blueprintId: blueprint.id,
              weddingDetails: {
                coupleNames: blueprint.coupleNames,
                weddingDate: blueprint.aiGeneratedContent.timeline,
                requirements: categoryData
              }
            })
          });

          if (emailResult.ok) {
            const result = await emailResult.json();
            emailResults.push({ category, success: true, messageId: result.messageId });
          } else {
            emailResults.push({ category, success: false, error: 'Email send failed' });
          }
        }
      }

      return { success: true, results: emailResults };
    } catch (error) {
      console.error('Error sending vendor emails:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate category-specific email content
   */
  private static generateCategorySpecificEmail(category: string, blueprint: SavedBlueprint, categoryData: any[]) {
    const categoryTitles = {
      venue: 'Venue Booking',
      catering: 'Catering Services',
      photography: 'Photography & Videography',
      decoration: 'Decoration & Floral'
    };

    return `Dear ${categoryTitles[category]} Team,

Greetings! We hope this email finds you well.

We are ${blueprint.coupleNames}, and we are excited to plan our upcoming wedding. We came across your services and would love to explore how you can help make our special day memorable.

**Wedding Details:**
${blueprint.aiGeneratedContent.weddingSummary.split('\n')[0]}

**Our Requirements for ${categoryTitles[category]}:**
${categoryData.map(item => `• ${item.description}`).join('\n')}

**What We're Looking For:**
Based on our research and preferences, we are specifically interested in services that align with our vision. We would appreciate if you could provide:

1. **Detailed Quotation** - Comprehensive pricing for your ${category} services
2. **Package Options** - Different service levels and their respective costs
3. **Availability** - Your availability for our wedding date
4. **Portfolio** - Recent work samples that match our theme and style
5. **Customization Options** - How you can tailor services to our specific needs

**Our Budget Range:**
${blueprint.aiGeneratedContent.budgetBreakdown}

**Next Steps:**
We would be delighted to schedule a consultation at your convenience to discuss our requirements in detail. Please let us know your availability for a meeting or call.

We look forward to hearing from you soon and potentially working together to create our dream wedding.

Thank you for your time and consideration.

Warm regards,
${blueprint.coupleNames}

---
Generated by BID AI Wedding Assistant
For inquiries: aiyersneha19@gmail.com`;
  }

  /**
   * Retrieve saved blueprint by ID
   */
  static async getSavedBlueprint(blueprintId: string): Promise<{
    success: boolean;
    blueprint?: SavedBlueprint;
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.API_BASE}/api/get-blueprint/${blueprintId}`);

      if (response.ok) {
        const blueprint = await response.json();
        return { success: true, blueprint };
      } else {
        throw new Error(`Blueprint not found: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error retrieving blueprint:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get all saved blueprints for a user
   */
  static async getAllBlueprints(): Promise<{
    success: boolean;
    blueprints?: SavedBlueprint[];
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.API_BASE}/api/get-all-blueprints`);

      if (response.ok) {
        const blueprints = await response.json();
        return { success: true, blueprints };
      } else {
        throw new Error(`Failed to retrieve blueprints: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error retrieving blueprints:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Fallback content when AI generation fails
   */
  private static getFallbackContent(request: WeddingBlueprintRequest) {
    return {
      weddingSummary: `A beautiful ${request.theme.selectedTheme} wedding celebration for ${request.basicDetails.yourName} & ${request.basicDetails.partnerName}. This special day will bring together ${request.basicDetails.guestCount} loved ones to witness their union in ${request.basicDetails.location}. The celebration will feature elegant ${request.catering.cuisine} cuisine and stunning ${request.photography.style} photography to capture every precious moment.`,
      recommendations: {
        venue: [
          {category: "venues", name: "Grand Palace Hotel", description: "Elegant ballroom perfect for your celebration", price: "₹2,00,000 - ₹3,00,000"},
          {category: "venues", name: "Heritage Gardens", description: "Beautiful outdoor venue with traditional charm", price: "₹1,50,000 - ₹2,50,000"},
          {category: "venues", name: "Royal Convention Center", description: "Modern facilities with classical elegance", price: "₹1,80,000 - ₹2,80,000"}
        ],
        catering: [
          {category: "catering", name: "Royal Feast Catering", description: "Authentic Indian cuisine with modern presentation", price: "₹1,200 - ₹1,800 per plate"},
          {category: "catering", name: "Spice Garden Caterers", description: "Traditional recipes with contemporary service", price: "₹1,000 - ₹1,500 per plate"},
          {category: "catering", name: "Maharaja Dining", description: "Luxury catering with premium ingredients", price: "₹1,500 - ₹2,200 per plate"}
        ],
        photography: [
          {category: "photography", name: "Moments Photography", description: "Cinematic wedding photography and videography", price: "₹80,000 - ₹1,20,000"},
          {category: "photography", name: "Eternal Frames", description: "Traditional and contemporary wedding coverage", price: "₹60,000 - ₹1,00,000"},
          {category: "photography", name: "Dream Capture Studios", description: "Premium wedding documentation services", price: "₹1,00,000 - ₹1,50,000"}
        ],
        decoration: [
          {category: "decoration", name: "Floral Paradise Decorators", description: "Elegant floral arrangements and stage decoration", price: "₹1,20,000 - ₹2,00,000"},
          {category: "decoration", name: "Royal Event Decorators", description: "Traditional mandap and reception decoration", price: "₹1,00,000 - ₹1,80,000"},
          {category: "decoration", name: "Dream Decor Solutions", description: "Complete wedding decoration and lighting", price: "₹1,40,000 - ₹2,20,000"}
        ]
      },
      timeline: "12-month comprehensive wedding planning timeline with vendor bookings, preparations, and celebrations",
      budgetBreakdown: `Venue: 25%, Catering: 35%, Photography: 15%, Decoration: 15%, Miscellaneous: 10% of ${request.basicDetails.budgetRange}`
    };
  }
}

export { WeddingBlueprintService, type WeddingBlueprintRequest, type SavedBlueprint };

interface WeddingBlueprintRequest {
  basicDetails: {
    guestCount: number;
    weddingDate: string;
    location: string;
    budgetRange: string;
    yourName: string;
    partnerName: string;
  };
  theme: {
    selectedTheme: string;
  };
  venue: {
    venueType: string;
    capacity: number;
  };
  catering: {
    cuisine: string;
    mealType: string;
  };
  photography: {
    style: string;
    coverage: string;
  };
}

interface SavedBlueprint {
  id: string;
  weddingId: string;
  coupleNames: string;
  aiGeneratedContent: {
    weddingSummary: string;
    recommendations: {
      venue: Array<{category: string, name: string, description: string, price: string}>;
      catering: Array<{category: string, name: string, description: string, price: string}>;
      photography: Array<{category: string, name: string, description: string, price: string}>;
      decoration: Array<{category: string, name: string, description: string, price: string}>;
    };
    timeline: string;
    budgetBreakdown: string;
  };
  images: string[];
  generatedAt: string;
  lastUpdated: string;
}

interface WeddingBlueprintResponse {
  success: boolean;
  error?: string;
  blueprint?: {
    summary: string;
    venueImage: string;
    themeImage: string;
    photographyImage: string;
    recommendations: {
      venue: string[];
      catering: string[];
      photography: string[];
      decor: string[];
    };
    timeline: string[];
    budgetBreakdown: {
      venue: number;
      catering: number;
      photography: number;
      decor: number;
      total: number;
    };
  };
}