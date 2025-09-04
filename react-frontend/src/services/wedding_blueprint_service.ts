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

export class WeddingBlueprintService {
  /**
   * Generate comprehensive wedding blueprint using AI services
   */
  static async generateWeddingBlueprint(preferences: WeddingBlueprintRequest): Promise<WeddingBlueprintResponse> {
    try {
      console.log('Generating wedding blueprint for:', preferences);

      // Step 1: Generate comprehensive summary using Gemini API
      const summaryPrompt = this.generateSummaryPrompt(preferences);
      const summaryResponse = await this.generateTextWithGemini(summaryPrompt);

      // Step 2: Generate specialized theme prompts
      const themePromptsResponse = await ThemePromptGenerator.generateThemePrompts(preferences);
      let ceremonyPrompt = '';
      let receptionPrompt = '';
      let detailPrompt = '';

      if (themePromptsResponse.success && themePromptsResponse.prompts) {
        ceremonyPrompt = themePromptsResponse.prompts.ceremonyPrompt;
        receptionPrompt = themePromptsResponse.prompts.receptionPrompt;
        detailPrompt = themePromptsResponse.prompts.detailPrompt;
      } else {
        // Fallback to theme-specific prompts
        const fallbackPrompts = ThemePromptGenerator.generateThemeSpecificPrompts(
          preferences.theme.selectedTheme, 
          preferences
        );
        ceremonyPrompt = fallbackPrompts.ceremonyPrompt;
        receptionPrompt = fallbackPrompts.receptionPrompt;
        detailPrompt = fallbackPrompts.detailPrompt;
      }

      // Step 3: Generate ceremony image using Cloudflare AI
      const ceremonyImageResponse = await CloudflareAIService.generateWeddingThemeImages(this.generateVenueImagePrompt(preferences));

      // Step 4: Generate reception image using Cloudflare AI
      const receptionImageResponse = await CloudflareAIService.generateWeddingThemeImages(this.generateThemeImagePrompt(preferences));

      // Step 5: Generate detail image using Cloudflare AI
      const detailImageResponse = await CloudflareAIService.generateWeddingThemeImages(this.generatePhotographyImagePrompt(preferences));

      // Step 5: Generate recommendations using Gemini API
      const recommendationsPrompt = this.generateRecommendationsPrompt(preferences);
      const recommendationsResponse = await this.generateTextWithGemini(recommendationsPrompt);

      // Step 6: Generate timeline using Gemini API
      const timelinePrompt = this.generateTimelinePrompt(preferences);
      const timelineResponse = await this.generateTextWithGemini(timelinePrompt);

      // Step 7: Generate budget breakdown using Gemini API
      const budgetPrompt = this.generateBudgetPrompt(preferences);
      const budgetResponse = await this.generateTextWithGemini(budgetPrompt);

      // Parse responses
      const summary = summaryResponse.success && summaryResponse.text ? summaryResponse.text : 'Your dream wedding blueprint is being prepared...';
      const ceremonyImage = ceremonyImageResponse.success && ceremonyImageResponse.imageUrls && ceremonyImageResponse.imageUrls.length > 0 ? ceremonyImageResponse.imageUrls[0] : '';
      const receptionImage = receptionImageResponse.success && receptionImageResponse.imageUrls && receptionImageResponse.imageUrls.length > 0 ? receptionImageResponse.imageUrls[0] : '';
      const detailImage = detailImageResponse.success && detailImageResponse.imageUrls && detailImageResponse.imageUrls.length > 0 ? detailImageResponse.imageUrls[0] : '';

      const recommendations = this.parseRecommendations(recommendationsResponse.success && recommendationsResponse.text ? recommendationsResponse.text : '');
      const timeline = this.parseTimeline(timelineResponse.success && timelineResponse.text ? timelineResponse.text : '');
      const budgetBreakdown = this.parseBudgetBreakdown(budgetResponse.success && budgetResponse.text ? budgetResponse.text : '', preferences.basicDetails.budgetRange);

      return {
        success: true,
        blueprint: {
          summary,
          venueImage: ceremonyImage,
          themeImage: receptionImage,
          photographyImage: detailImage,
          recommendations,
          timeline,
          budgetBreakdown
        }
      };

    } catch (error) {
      console.error('Error generating wedding blueprint:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Generate text using Gemini API
   */
  private static async generateTextWithGemini(prompt: string): Promise<{ success: boolean; text?: string; error?: string }> {
    try {
      const API_KEY = 'REDACTED_GEMINI_KEY';
      const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

      const response = await fetch(`${GEMINI_BASE_URL}?key=${API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      const generatedText = result.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!generatedText) {
        throw new Error('No content generated from Gemini API');
      }

      return { success: true, text: generatedText };

    } catch (error) {
      console.error('Error generating text with Gemini:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Generate summary prompt for Gemini API
   */
  private static generateSummaryPrompt(preferences: WeddingBlueprintRequest): string {
    return `Create a professional, well-structured wedding blueprint summary for ${preferences.basicDetails.yourName} and ${preferences.basicDetails.partnerName}'s wedding.

**Wedding Details:**
- Date: ${preferences.basicDetails.weddingDate}
- Location: ${preferences.basicDetails.location}
- Guest Count: ${preferences.basicDetails.guestCount}
- Budget Range: ${preferences.basicDetails.budgetRange}
- Theme: ${preferences.theme.selectedTheme}
- Venue Type: ${preferences.venue.venueType}
- Cuisine: ${preferences.catering.cuisine}
- Photography Style: ${preferences.photography.style}

**Please provide a structured summary with the following sections:**

**1. Executive Overview**
A concise introduction about the couple and their special day, highlighting the date, location, and guest count.

**2. Vision Statement**
The overall concept and atmosphere of the wedding, emphasizing the chosen theme and venue type.

**3. Key Highlights**
- Venue Strategy: How the chosen venue type will be utilized
- Culinary Experience: The dining and catering approach
- Photography Vision: The storytelling approach through images
- Entertainment & Atmosphere: The overall guest experience

**4. Unique Elements**
What makes this wedding special and memorable, including personal touches and cultural elements.

**5. Celebration Summary**
A warm conclusion about the day's significance and the memories that will be created.

**Format Requirements:**
- Use clear section headers
- Write in a professional yet warm tone
- Include specific details about the chosen preferences
- Make it comprehensive but concise
- Avoid repetitive phrases
- Focus on actionable insights for wedding planners and vendors

Make it crisp, comprehensive, and professional - suitable for wedding planners and vendors to understand the vision clearly.`;
  }

  /**
   * Generate venue image prompt
   */
  private static generateVenueImagePrompt(preferences: WeddingBlueprintRequest): string {
    return `A stunning ${preferences.venue.venueType} wedding venue setup for ${preferences.basicDetails.guestCount} guests in ${preferences.basicDetails.location}. 
    Features elegant ${preferences.theme.selectedTheme} theme decorations, sophisticated lighting, beautifully arranged seating, 
    and a grand ceremony area. The venue should reflect luxury and elegance with professional photography quality, 
    natural lighting, and magazine-worthy composition.`;
  }

  /**
   * Generate theme image prompt
   */
  private static generateThemeImagePrompt(preferences: WeddingBlueprintRequest): string {
    return `A beautiful ${preferences.theme.selectedTheme} wedding theme setup with elegant decorations, 
    traditional Indian wedding elements, ornate mandap or ceremony area, floral arrangements, 
    and cultural elements that represent the chosen theme. The image should showcase the overall 
    aesthetic and mood of the wedding theme with rich colors and sophisticated details.`;
  }

  /**
   * Generate photography image prompt
   */
  private static generatePhotographyImagePrompt(preferences: WeddingBlueprintRequest): string {
    return `A professional ${preferences.photography.style} wedding photography setup showing 
    elegant camera equipment, lighting setup, and a beautiful wedding scene being photographed. 
    The image should represent the photography style and coverage type, with professional 
    equipment and a romantic wedding atmosphere in the background.`;
  }

  /**
   * Generate recommendations prompt
   */
  private static generateRecommendationsPrompt(preferences: WeddingBlueprintRequest): string {
    return `Based on the wedding preferences, provide specific recommendations in JSON format:

**Wedding Details:**
- Theme: ${preferences.theme.selectedTheme}
- Venue Type: ${preferences.venue.venueType}
- Cuisine: ${preferences.catering.cuisine}
- Photography: ${preferences.photography.style}
- Budget: ${preferences.basicDetails.budgetRange}
- Guest Count: ${preferences.basicDetails.guestCount}

**Please provide recommendations for:**
1. Venue suggestions (3-4 specific venue types or features)
2. Catering recommendations (3-4 menu suggestions)
3. Photography recommendations (3-4 specific styles or packages)
4. Decor recommendations (3-4 decoration ideas)

**Format as JSON:**
{
  "venue": ["recommendation1", "recommendation2", "recommendation3"],
  "catering": ["recommendation1", "recommendation2", "recommendation3"],
  "photography": ["recommendation1", "recommendation2", "recommendation3"],
  "decor": ["recommendation1", "recommendation2", "recommendation3"]
}`;
  }

  /**
   * Generate timeline prompt
   */
  private static generateTimelinePrompt(preferences: WeddingBlueprintRequest): string {
    return `Create a wedding day timeline for ${preferences.basicDetails.yourName} and ${preferences.basicDetails.partnerName}'s ${preferences.theme.selectedTheme} wedding.

**Wedding Details:**
- Theme: ${preferences.theme.selectedTheme}
- Venue Type: ${preferences.venue.venueType}
- Photography: ${preferences.photography.coverage}
- Guest Count: ${preferences.basicDetails.guestCount}

**Please provide a detailed timeline in JSON format:**
{
  "timeline": [
    {"time": "6:00 AM", "event": "Bride and groom preparation begins"},
    {"time": "8:00 AM", "event": "Photography session starts"},
    {"time": "10:00 AM", "event": "Ceremony begins"},
    {"time": "12:00 PM", "event": "Reception starts"},
    {"time": "2:00 PM", "event": "Lunch service"},
    {"time": "4:00 PM", "event": "Evening celebrations"},
    {"time": "6:00 PM", "event": "Dinner service"},
    {"time": "8:00 PM", "event": "Wedding concludes"}
  ]
}

Make it realistic and detailed for an Indian wedding with the chosen theme and venue type.`;
  }

  /**
   * Generate budget breakdown prompt
   */
  private static generateBudgetPrompt(preferences: WeddingBlueprintRequest): string {
    return `Create a budget breakdown for a ${preferences.basicDetails.budgetRange} wedding in ${preferences.basicDetails.location}.

**Wedding Details:**
- Budget Range: ${preferences.basicDetails.budgetRange}
- Guest Count: ${preferences.basicDetails.guestCount}
- Theme: ${preferences.theme.selectedTheme}
- Venue Type: ${preferences.venue.venueType}
- Cuisine: ${preferences.catering.cuisine}
- Photography: ${preferences.photography.style}

**Please provide budget allocation in JSON format:**
{
  "venue": 30,
  "catering": 25,
  "photography": 15,
  "decor": 20,
  "total": 100
}

The percentages should add up to 100% and be realistic for the budget range and location.`;
  }

  /**
   * Parse recommendations from text
   */
  private static parseRecommendations(text: string): { venue: string[]; catering: string[]; photography: string[]; decor: string[] } {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          venue: parsed.venue || ['Luxury hotel venue', 'Heritage palace', 'Garden venue'],
          catering: parsed.catering || ['Traditional Indian cuisine', 'Multi-cuisine buffet', 'Royal thali service'],
          photography: parsed.photography || ['Full day coverage', 'Candid photography', 'Cinematic style'],
          decor: parsed.decor || ['Floral arrangements', 'Lighting setup', 'Theme decorations']
        };
      }
    } catch (error) {
      console.error('Error parsing recommendations:', error);
    }

    return {
      venue: ['Luxury hotel venue', 'Heritage palace', 'Garden venue'],
      catering: ['Traditional Indian cuisine', 'Multi-cuisine buffet', 'Royal thali service'],
      photography: ['Full day coverage', 'Candid photography', 'Cinematic style'],
      decor: ['Floral arrangements', 'Lighting setup', 'Theme decorations']
    };
  }

  /**
   * Parse timeline from text
   */
  private static parseTimeline(text: string): string[] {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.timeline && Array.isArray(parsed.timeline)) {
          return parsed.timeline.map((item: any) => `${item.time} - ${item.event}`);
        }
      }
    } catch (error) {
      console.error('Error parsing timeline:', error);
    }

    return [
      '6:00 AM - Bride and groom preparation begins',
      '8:00 AM - Photography session starts',
      '10:00 AM - Ceremony begins',
      '12:00 PM - Reception starts',
      '2:00 PM - Lunch service',
      '4:00 PM - Evening celebrations',
      '6:00 PM - Dinner service',
      '8:00 PM - Wedding concludes'
    ];
  }

  /**
   * Parse budget breakdown from text
   */
  private static parseBudgetBreakdown(text: string, budgetRange: string): { venue: number; catering: number; photography: number; decor: number; total: number } {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const total = this.getBudgetTotal(budgetRange);
        return {
          venue: Math.round((parsed.venue / 100) * total),
          catering: Math.round((parsed.catering / 100) * total),
          photography: Math.round((parsed.photography / 100) * total),
          decor: Math.round((parsed.decor / 100) * total),
          total
        };
      }
    } catch (error) {
      console.error('Error parsing budget breakdown:', error);
    }

    const total = this.getBudgetTotal(budgetRange);
    return {
      venue: Math.round(0.30 * total),
      catering: Math.round(0.25 * total),
      photography: Math.round(0.15 * total),
      decor: Math.round(0.20 * total),
      total
    };
  }

  /**
   * Get budget total based on budget range
   */
  private static getBudgetTotal(budgetRange: string): number {
    switch (budgetRange) {
      case 'Budget Friendly':
        return 500000; // 5 Lakhs
      case 'Mid Range':
        return 1000000; // 10 Lakhs
      case 'Luxury':
        return 2500000; // 25 Lakhs
      case 'Ultra Luxury':
        return 5000000; // 50 Lakhs
      default:
        return 1000000; // Default 10 Lakhs
    }
  }
}