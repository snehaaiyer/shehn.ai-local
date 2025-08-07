interface ThemePromptRequest {
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

interface ThemePromptResponse {
  success: boolean;
  error?: string;
  prompts?: {
    ceremonyPrompt: string;
    receptionPrompt: string;
    detailPrompt: string;
  };
  descriptions?: {
    ceremonyDescription: string;
    receptionDescription: string;
    detailDescription: string;
  };
}

export class ThemePromptGenerator {
  private static readonly GEMINI_API_KEY = 'AIzaSyBSzy9WsCPlJJRkYTejbD5UrgxDN0XTJQg';
  private static readonly GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

  /**
   * Generate 3 specialized prompts for wedding theme images
   */
  static async generateThemePrompts(preferences: ThemePromptRequest): Promise<ThemePromptResponse> {
    try {
      console.log('Generating theme prompts for:', preferences);

      // Generate the main prompt generation request
      const promptRequest = this.generatePromptRequest(preferences);
      const response = await this.generateTextWithGemini(promptRequest);

      if (!response.success || !response.text) {
        throw new Error(response.error || 'Failed to generate theme prompts');
      }

      // Parse the response to extract the 3 prompts
      const parsedPrompts = this.parseThemePrompts(response.text, preferences);

      return {
        success: true,
        prompts: parsedPrompts.prompts,
        descriptions: parsedPrompts.descriptions
      };

    } catch (error) {
      console.error('Error generating theme prompts:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Generate the main prompt request for Gemini API
   */
  private static generatePromptRequest(preferences: ThemePromptRequest): string {
    const {
      basicDetails,
      theme,
      venue,
      catering,
      photography
    } = preferences;

    return `Create 3 specialized image generation prompts for a wedding theme visualization. 

**Wedding Details:**
- Couple: ${basicDetails.yourName} & ${basicDetails.partnerName}
- Date: ${basicDetails.weddingDate}
- Location: ${basicDetails.location}
- Guest Count: ${basicDetails.guestCount}
- Budget: ${basicDetails.budgetRange}
- Theme: ${theme.selectedTheme}
- Venue Type: ${venue.venueType}
- Cuisine: ${catering.cuisine}
- Photography Style: ${photography.style}

**Required Prompts:**

1. **Ceremony Setup Prompt** - Focus on the main ceremony area (mandap, altar, etc.)
2. **Reception Setup Prompt** - Focus on the reception/dining area
3. **Detail Shot Prompt** - Focus on specific decorative elements and details

**Format your response as JSON:**
{
  "ceremony": {
    "prompt": "Detailed prompt for ceremony image generation",
    "description": "Brief description of what this image captures"
  },
  "reception": {
    "prompt": "Detailed prompt for reception image generation", 
    "description": "Brief description of what this image captures"
  },
  "details": {
    "prompt": "Detailed prompt for detail shot image generation",
    "description": "Brief description of what this image captures"
  }
}

**Guidelines for each prompt:**
- Include specific visual elements relevant to the theme
- Mention lighting, colors, and atmosphere
- Specify camera angle and composition
- Include cultural elements if applicable
- Make it detailed enough for AI image generation
- Focus on the unique aspects of the chosen theme
- Include professional photography quality specifications

**Example structure for each prompt:**
"A stunning [ceremony/reception/detail] shot of a [theme] wedding featuring [specific elements], with [lighting description], [color palette], [composition details], [cultural elements], [atmosphere], professional photography quality, high resolution, magazine-worthy composition."
`;
  }

  /**
   * Generate text using Gemini API
   */
  private static async generateTextWithGemini(prompt: string): Promise<{ success: boolean; text?: string; error?: string }> {
    try {
      const response = await fetch(`${this.GEMINI_BASE_URL}?key=${this.GEMINI_API_KEY}`, {
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
   * Parse the theme prompts from Gemini response
   */
  private static parseThemePrompts(text: string, preferences: ThemePromptRequest): {
    prompts: { ceremonyPrompt: string; receptionPrompt: string; detailPrompt: string };
    descriptions: { ceremonyDescription: string; receptionDescription: string; detailDescription: string };
  } {
    try {
      // Try to extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        return {
          prompts: {
            ceremonyPrompt: parsed.ceremony?.prompt || this.generateFallbackCeremonyPrompt(preferences),
            receptionPrompt: parsed.reception?.prompt || this.generateFallbackReceptionPrompt(preferences),
            detailPrompt: parsed.details?.prompt || this.generateFallbackDetailPrompt(preferences)
          },
          descriptions: {
            ceremonyDescription: parsed.ceremony?.description || 'Ceremony setup visualization',
            receptionDescription: parsed.reception?.description || 'Reception area visualization',
            detailDescription: parsed.details?.description || 'Decorative details visualization'
          }
        };
      }
    } catch (error) {
      console.error('Error parsing theme prompts JSON:', error);
    }

    // Fallback to generated prompts if JSON parsing fails
    return {
      prompts: {
        ceremonyPrompt: this.generateFallbackCeremonyPrompt(preferences),
        receptionPrompt: this.generateFallbackReceptionPrompt(preferences),
        detailPrompt: this.generateFallbackDetailPrompt(preferences)
      },
      descriptions: {
        ceremonyDescription: 'Ceremony setup visualization',
        receptionDescription: 'Reception area visualization',
        detailDescription: 'Decorative details visualization'
      }
    };
  }

  /**
   * Generate fallback ceremony prompt
   */
  private static generateFallbackCeremonyPrompt(preferences: ThemePromptRequest): string {
    const { theme, venue, basicDetails } = preferences;
    
    return `A stunning ceremony setup shot of a ${theme.selectedTheme} wedding featuring a beautiful ${venue.venueType} venue, 
    with an elegant mandap or ceremony area decorated with traditional Indian wedding elements, 
    ${theme.selectedTheme === 'Traditional Hindu' ? 'sacred fire pit, traditional Vedic setup' : 'modern ceremony arch, sophisticated lighting'}, 
    ${basicDetails.guestCount} guest seating arrangement, warm golden lighting creating romantic ambiance, 
    rich ${theme.selectedTheme === 'Traditional Hindu' ? 'red and gold' : 'white and gold'} color palette, 
    professional photography quality, high resolution, magazine-worthy composition, 
    capturing the sacred and romantic atmosphere of the wedding ceremony.`;
  }

  /**
   * Generate fallback reception prompt
   */
  private static generateFallbackReceptionPrompt(preferences: ThemePromptRequest): string {
    const { theme, venue, catering, basicDetails } = preferences;
    
    return `A beautiful reception setup shot of a ${theme.selectedTheme} wedding featuring a luxurious ${venue.venueType} reception area, 
    with elegantly set dining tables for ${basicDetails.guestCount} guests, 
    ${catering.cuisine} cuisine presentation with traditional Indian wedding dishes, 
    sophisticated lighting creating warm and inviting atmosphere, 
    ${theme.selectedTheme === 'Traditional Hindu' ? 'traditional Indian wedding decorations' : 'modern elegant decor'}, 
    crystal chandeliers and floral centerpieces, 
    professional photography quality, high resolution, magazine-worthy composition, 
    capturing the celebration and dining experience of the wedding reception.`;
  }

  /**
   * Generate fallback detail prompt
   */
  private static generateFallbackDetailPrompt(preferences: ThemePromptRequest): string {
    const { theme, photography } = preferences;
    
    return `A detailed close-up shot of ${theme.selectedTheme} wedding decorative elements featuring 
    ${theme.selectedTheme === 'Traditional Hindu' ? 'traditional Indian wedding decorations, ornate mandap details, sacred fire setup' : 'modern elegant decor, sophisticated lighting fixtures, floral arrangements'}, 
    ${photography.style} photography style with artistic composition, 
    rich textures and intricate details, 
    ${theme.selectedTheme === 'Traditional Hindu' ? 'red and gold' : 'white and gold'} color scheme, 
    professional macro photography quality, high resolution, 
    capturing the beauty and craftsmanship of wedding decorations and cultural elements.`;
  }

  /**
   * Generate specialized prompts based on theme type
   */
  static generateThemeSpecificPrompts(theme: string, preferences: ThemePromptRequest): {
    ceremonyPrompt: string;
    receptionPrompt: string;
    detailPrompt: string;
  } {
    const basePrompts = {
      'Traditional Hindu': {
        ceremony: 'A sacred traditional Hindu wedding ceremony setup with ornate mandap, sacred fire pit, traditional Vedic elements, red and gold decorations, traditional Indian wedding attire, professional photography quality.',
        reception: 'A traditional Indian wedding reception with royal thali setup, traditional Indian cuisine presentation, cultural decorations, traditional music elements, warm lighting, professional photography quality.',
        detail: 'Close-up of traditional Hindu wedding elements - sacred fire, mandap decorations, traditional Indian jewelry, cultural symbols, red and gold color scheme, professional macro photography.'
      },
      'Luxury Hotel': {
        ceremony: 'A luxurious five-star hotel wedding ceremony with elegant crystal chandeliers, sophisticated modern decor, premium white and gold color scheme, professional lighting, upscale hotel amenities, professional photography quality.',
        reception: 'A luxury hotel wedding reception with fine dining setup, international cuisine presentation, premium service elements, sophisticated table settings, elegant lighting, professional photography quality.',
        detail: 'Close-up of luxury hotel wedding details - crystal glassware, premium table settings, sophisticated lighting fixtures, elegant floral arrangements, professional macro photography.'
      },
      'Royal Palace': {
        ceremony: 'A majestic royal palace wedding ceremony with heritage architecture, regal decorations, traditional royal elements, gold and jewel tones, historical significance, professional photography quality.',
        reception: 'A royal palace wedding reception with royal cuisine presentation, heritage venue features, traditional royal service, elegant palace interiors, sophisticated lighting, professional photography quality.',
        detail: 'Close-up of royal palace wedding elements - heritage architecture details, royal decorations, traditional royal symbols, gold and jewel tones, professional macro photography.'
      },
      'Beach Destination': {
        ceremony: 'A romantic beach destination wedding ceremony with ocean views, beach setup, natural elements, sunset lighting, tropical decorations, professional photography quality.',
        reception: 'A beach destination wedding reception with seafood cuisine, beachside dining setup, tropical elements, natural lighting, coastal decorations, professional photography quality.',
        detail: 'Close-up of beach destination wedding elements - tropical flowers, beach-inspired decorations, natural textures, ocean-themed details, professional macro photography.'
      },
      'Farmhouse Wedding': {
        ceremony: 'A charming farmhouse wedding ceremony with rustic wooden elements, natural greenery, outdoor setup, vintage decor, natural lighting, professional photography quality.',
        reception: 'A farmhouse wedding reception with organic cuisine, rustic table settings, natural elements, barn-style venue, warm lighting, professional photography quality.',
        detail: 'Close-up of farmhouse wedding elements - rustic wooden details, natural flowers, vintage decorations, organic textures, professional macro photography.'
      },
      'Bollywood Sangeet': {
        ceremony: 'A vibrant Bollywood sangeet ceremony with colorful decorations, dance floor setup, traditional Indian music elements, bright lighting, cultural dance elements, professional photography quality.',
        reception: 'A Bollywood sangeet reception with traditional Indian cuisine, colorful table settings, music and dance elements, vibrant lighting, cultural decorations, professional photography quality.',
        detail: 'Close-up of Bollywood sangeet elements - colorful decorations, traditional Indian music instruments, dance accessories, vibrant colors, professional macro photography.'
      }
    };

    const themePrompts = basePrompts[theme as keyof typeof basePrompts] || basePrompts['Traditional Hindu'];

    return {
      ceremonyPrompt: this.enhancePrompt(themePrompts.ceremony, preferences),
      receptionPrompt: this.enhancePrompt(themePrompts.reception, preferences),
      detailPrompt: this.enhancePrompt(themePrompts.detail, preferences)
    };
  }

  /**
   * Enhance prompt with additional details
   */
  private static enhancePrompt(basePrompt: string, preferences: ThemePromptRequest): string {
    const { basicDetails, venue, catering, photography } = preferences;
    
    return `${basePrompt} 
    Venue: ${venue.venueType} for ${basicDetails.guestCount} guests in ${basicDetails.location}. 
    Cuisine: ${catering.cuisine}. 
    Photography: ${photography.style} style. 
    Budget: ${basicDetails.budgetRange}. 
    High resolution, magazine-worthy composition, professional photography quality.`;
  }
} 