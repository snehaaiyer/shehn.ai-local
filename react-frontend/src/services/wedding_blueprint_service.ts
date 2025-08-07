import { CloudflareAIService } from './cloudflare_ai_service';
import { ThemePromptGenerator } from './theme_prompt_generator';

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
      const ceremonyImageResponse = await CloudflareAIService.generateWeddingThemeImages({
        theme: preferences.theme.selectedTheme,
        style: 'Traditional',
        colors: 'Red and Gold',
        season: 'Wedding Season',
        venueType: preferences.venue.venueType,
        customDescription: ceremonyPrompt,
        guestCount: preferences.basicDetails.guestCount,
        location: preferences.basicDetails.location,
        imageCount: 1
      });

      // Step 4: Generate reception image using Cloudflare AI
      const receptionImageResponse = await CloudflareAIService.generateWeddingThemeImages({
        theme: preferences.theme.selectedTheme,
        style: 'Elegant',
        colors: 'White and Gold',
        season: 'Wedding Season',
        venueType: 'Reception Area',
        customDescription: receptionPrompt,
        guestCount: preferences.basicDetails.guestCount,
        location: preferences.basicDetails.location,
        imageCount: 1
      });

      // Step 5: Generate detail image using Cloudflare AI
      const detailImageResponse = await CloudflareAIService.generateWeddingThemeImages({
        theme: preferences.theme.selectedTheme,
        style: 'Artistic',
        colors: 'Rich and Vibrant',
        season: 'Wedding Season',
        venueType: 'Decorative Details',
        customDescription: detailPrompt,
        guestCount: preferences.basicDetails.guestCount,
        location: preferences.basicDetails.location,
        imageCount: 1
      });

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
      const ceremonyImage = ceremonyImageResponse.success && ceremonyImageResponse.images && ceremonyImageResponse.images.length > 0 ? ceremonyImageResponse.images[0] : '';
      const receptionImage = receptionImageResponse.success && receptionImageResponse.images && receptionImageResponse.images.length > 0 ? receptionImageResponse.images[0] : '';
      const detailImage = detailImageResponse.success && detailImageResponse.images && detailImageResponse.images.length > 0 ? detailImageResponse.images[0] : '';
      
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
      const API_KEY = 'AIzaSyBSzy9WsCPlJJRkYTejbD5UrgxDN0XTJQg';
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