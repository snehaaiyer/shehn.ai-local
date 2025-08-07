interface GeminiImageGenerationRequest {
  theme: string;
  style: string;
  colors: string;
  season: string;
  venueType: string;
  customDescription: string;
  guestCount: number;
  location: string;
}

interface GeminiImageGenerationResponse {
  images: string[];
  success: boolean;
  error?: string;
  generatedDescription?: string;
  themeAnalysis?: {
    keywords: string[];
    mood: string;
    style: string;
    colors: string[];
  };
}

export class GeminiService {
  private static readonly API_KEY = 'AIzaSyBSzy9WsCPlJJRkYTejbD5UrgxDN0XTJQg';
  
  // Use Google's Imagen 4 model for high-quality image generation





  
  private static readonly IMAGEN_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-preview:generateContent';
  
  // Use Gemini 2.0 Flash for text analysis
  private static readonly GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

  /**
   * Generate a detailed prompt for Imagen 4 wedding theme image generation
   */
  private static generateImagePrompt(request: GeminiImageGenerationRequest): string {
    const {
      theme,
      style,
      colors,
      season,
      venueType,
      customDescription,
      guestCount,
      location
    } = request;

    let prompt = `A stunning, high-resolution wedding venue setup featuring:

**Main Scene:**
- Beautiful ${venueType || 'luxury hotel'} wedding venue
- ${theme || 'Elegant'} ${style || 'classic'} wedding theme
- ${colors || 'White and gold'} color palette throughout
- ${season || 'Spring'} season atmosphere

**Venue Details:**
- Sophisticated ceremony area with elegant arch and floral arrangements
- Luxurious reception space with beautifully set tables
- Professional lighting creating romantic ambiance
- ${guestCount} guest capacity setup

**Custom Elements:**
${customDescription ? customDescription : 'Traditional wedding elegance'}

**Visual Style:**
- Photorealistic, professional photography quality
- Natural lighting with warm, romantic tones
- High attention to detail in decorations and setup
- Elegant and sophisticated atmosphere
- Magazine-worthy wedding venue photography

**Technical Quality:**
- Ultra-high resolution, crisp details
- Professional composition and framing
- Beautiful depth of field
- Rich, vibrant colors
- Stunning visual impact`;

    return prompt;
  }

  /**
   * Generate a detailed prompt for wedding theme analysis
   */
  private static generateAnalysisPrompt(request: GeminiImageGenerationRequest): string {
    const {
      theme,
      style,
      colors,
      season,
      venueType,
      customDescription,
      guestCount,
      location
    } = request;

    let prompt = `Analyze this wedding theme request and provide a detailed breakdown:

**Wedding Theme Request:**
- Primary Theme: ${theme || 'Elegant'}
- Style: ${style || 'Classic'}
- Color Palette: ${colors || 'White and Gold'}
- Season: ${season || 'Spring'}
- Venue Type: ${venueType || 'Luxury Hotel'}
- Location: ${location || 'Urban setting'}
- Guest Count: ${guestCount} guests
- Custom Description: ${customDescription || 'None'}

**Please provide:**
1. A detailed visual description of the wedding setup
2. 5-8 relevant search keywords for finding similar wedding images
3. The overall mood and atmosphere
4. Specific style characteristics
5. Color scheme breakdown

**Format your response as JSON:**
{
  "description": "Detailed visual description...",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "mood": "romantic/elegant/rustic/etc",
  "style": "modern/traditional/bohemian/etc",
  "colors": ["color1", "color2", "color3"]
}`;

    return prompt;
  }

  /**
   * Extract keywords and analysis from Gemini response
   */
  private static parseGeminiResponse(text: string): any {
    try {
      // Try to extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Fallback: extract keywords manually
      const keywords = text.toLowerCase().match(/\b(wedding|elegant|romantic|luxury|garden|beach|palace|rustic|modern|traditional|bohemian|vintage|classic|sophisticated|intimate|grand|chic|minimalist|opulent|charming)\b/g) || [];
      
      return {
        description: text,
        keywords: Array.from(new Set(keywords)).slice(0, 8),
        mood: 'elegant',
        style: 'classic',
        colors: ['white', 'gold', 'cream']
      };
    } catch (error) {
      console.error('Error parsing Gemini response:', error);
      return {
        description: text,
        keywords: ['wedding', 'elegant', 'romantic'],
        mood: 'elegant',
        style: 'classic',
        colors: ['white', 'gold']
      };
    }
  }

  /**
   * Generate wedding theme images using Gemini API with image generation
   */
  static async generateWeddingThemeImages(request: GeminiImageGenerationRequest): Promise<GeminiImageGenerationResponse> {
    try {
      console.log('Starting Gemini image generation for:', request);
      
      // Step 1: Try to generate images using Gemini 2.0 Flash with image generation
      const imagePrompt = this.generateImagePrompt(request);
      
      console.log('Generated image prompt for Gemini API:', imagePrompt);
      
      let images: string[] = [];
      let imageGenerationSuccess = false;
      
      try {
        const response = await fetch(`${this.IMAGEN_BASE_URL}?key=${this.API_KEY}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: imagePrompt
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

        if (response.ok) {
          const result = await response.json();
          console.log('Gemini API response:', result);
          
          // Extract generated images from Imagen 4 response
          const candidates = result.candidates || [];
          
          for (const candidate of candidates) {
            const parts = candidate.content?.parts || [];
            for (const part of parts) {
              // Imagen 4 returns images in different formats
              if (part.inlineData && part.inlineData.mimeType === 'image/png') {
                // Convert base64 to data URL
                const imageData = `data:image/png;base64,${part.inlineData.data}`;
                images.push(imageData);
              } else if (part.inlineData && part.inlineData.mimeType === 'image/jpeg') {
                // Convert base64 to data URL
                const imageData = `data:image/jpeg;base64,${part.inlineData.data}`;
                images.push(imageData);
              } else if (part.text && part.text.includes('data:image')) {
                // Direct data URL
                images.push(part.text);
              }
            }
          }
          
          console.log('Extracted images:', images.length);
          imageGenerationSuccess = images.length > 0;
        } else {
          console.warn('Image generation failed, falling back to analysis only');
          console.error('Response status:', response.status);
          console.error('Response text:', await response.text());
        }
      } catch (imageError) {
        console.warn('Image generation error, falling back to analysis:', imageError);
      }

      // Step 2: Generate theme analysis for additional insights
      const analysisPrompt = this.generateAnalysisPrompt(request);
      
      const analysisResponse = await fetch(`${this.GEMINI_BASE_URL}?key=${this.API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: analysisPrompt
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

      let themeAnalysis = null;
      if (analysisResponse.ok) {
        const analysisResult = await analysisResponse.json();
        const generatedText = analysisResult.candidates?.[0]?.content?.parts?.[0]?.text;
        if (generatedText) {
          themeAnalysis = this.parseGeminiResponse(generatedText);
        }
      }
      
      return {
        images,
        success: true,
        generatedDescription: themeAnalysis?.description,
        themeAnalysis: themeAnalysis ? {
          keywords: themeAnalysis.keywords,
          mood: themeAnalysis.mood,
          style: themeAnalysis.style,
          colors: themeAnalysis.colors
        } : undefined
      };
      
    } catch (error) {
      console.error('Error generating wedding theme images:', error);
      return {
        images: [],
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Generate theme analysis only (for when image generation fails)
   */
  static async generateThemeAnalysis(request: GeminiImageGenerationRequest): Promise<GeminiImageGenerationResponse> {
    try {
      const analysisPrompt = this.generateAnalysisPrompt(request);
      
      console.log('Generated analysis prompt for Gemini API:', analysisPrompt);
      
      const response = await fetch(`${this.GEMINI_BASE_URL}?key=${this.API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: analysisPrompt
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

      console.log('Gemini analysis response:', generatedText);

      const themeAnalysis = this.parseGeminiResponse(generatedText);
      
      return {
        images: [],
        success: true,
        generatedDescription: themeAnalysis.description,
        themeAnalysis: {
          keywords: themeAnalysis.keywords,
          mood: themeAnalysis.mood,
          style: themeAnalysis.style,
          colors: themeAnalysis.colors
        }
      };
      
    } catch (error) {
      console.error('Error generating theme analysis:', error);
      return {
        images: [],
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Validate API key and connection
   */
  static async validateConnection(): Promise<boolean> {
    try {
      // Make a simple API call to test the connection
      const response = await fetch(`${this.GEMINI_BASE_URL}?key=${this.API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: 'Hello, this is a test message.'
            }]
          }],
          generationConfig: {
            maxOutputTokens: 10,
          }
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Gemini API connection validation failed:', error);
      return false;
    }
  }
} 