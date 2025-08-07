interface CloudflareImageGenerationRequest {
  theme: string;
  style: string;
  colors: string;
  season: string;
  venueType: string;
  customDescription: string;
  guestCount: number;
  location: string;
  imageCount?: number;
}

interface CloudflareImageGenerationResponse {
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

export class CloudflareAIService {
  // Cloudflare Workers AI endpoints
  private static readonly CLOUDFLARE_AI_BASE_URL = 'https://api.cloudflare.com/client/v4/ai/run';
  
  // Cloudflare Worker URL for AI image generation
  private static readonly WORKER_URL = 'https://wedding-ai-worker.aiyersneha19.workers.dev';
  
  // Cloudflare AI models
  private static readonly IMAGE_MODEL = '@cf/lykon/dreamshaper-xl-10';
  private static readonly TEXT_MODEL = '@cf/meta/llama-3.1-8b-instruct';

  /**
   * Generate a detailed prompt for wedding theme image generation
   */
  private static generateImagePrompt(request: CloudflareImageGenerationRequest): string {
    const {
      theme,
      style,
      colors,
      season,
      venueType,
      customDescription,
      guestCount
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
  private static generateAnalysisPrompt(request: CloudflareImageGenerationRequest): string {
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
   * Extract keywords and analysis from Cloudflare AI response
   */
  private static parseCloudflareResponse(text: string): any {
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
      console.error('Error parsing Cloudflare AI response:', error);
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
   * Generate wedding theme images using Cloudflare Workers AI
   */
  static async generateWeddingThemeImages(request: CloudflareImageGenerationRequest): Promise<CloudflareImageGenerationResponse> {
    try {
      console.log('Starting Cloudflare AI image generation for:', request);
      
      // Step 1: Generate images using Cloudflare Workers AI
      const imagePrompt = this.generateImagePrompt(request);
      
      console.log('Generated image prompt for Cloudflare AI:', imagePrompt);
      
      let images: string[] = [];
      
      try {
        const response = await fetch(`${this.WORKER_URL}/generate-image`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: imagePrompt,
            model: this.IMAGE_MODEL,
            num_images: request.imageCount || 2,
            width: 1024,
            height: 1024
          })
        });

        if (response.ok) {
          const result = await response.json();
          console.log('Cloudflare AI response:', result);
          
          // Extract generated images from response
          if (result.success && result.images) {
            images = result.images;
          }
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
      
      const analysisResponse = await fetch(`${this.WORKER_URL}/analyze-text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: analysisPrompt,
          model: this.TEXT_MODEL,
          max_tokens: 2048
        })
      });

      let themeAnalysis = null;
      if (analysisResponse.ok) {
        const analysisResult = await analysisResponse.json();
        const generatedText = analysisResult.response;
        if (generatedText) {
          themeAnalysis = this.parseCloudflareResponse(generatedText);
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
   * Generate venue images using Cloudflare AI with venue-specific prompts
   */
  static async generateVenueImages(venuePrompt: string): Promise<CloudflareImageGenerationResponse> {
    try {
      console.log('Generating venue image with prompt:', venuePrompt);
      
      // Create a detailed venue-specific prompt
      const detailedPrompt = `A stunning, high-resolution wedding venue photograph featuring:

${venuePrompt}

**Visual Style:**
- Photorealistic, professional photography quality
- Natural lighting with warm, romantic tones
- High attention to detail in architecture and design
- Elegant and sophisticated atmosphere
- Magazine-worthy wedding venue photography

**Technical Quality:**
- Ultra-high resolution, crisp details
- Professional composition and framing
- Beautiful depth of field
- Rich, vibrant colors
- Stunning visual impact

**Setting:**
- Perfect for Indian weddings
- Wedding-ready setup and atmosphere
- Elegant and inviting space`;

      console.log('Generated detailed venue prompt:', detailedPrompt);
      
      // Call Cloudflare AI directly for venue image
      const response = await fetch(`${this.WORKER_URL}/generate-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: detailedPrompt,
          model: this.IMAGE_MODEL,
          num_images: 1,
          width: 1024,
          height: 1024
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Venue image generation response:', result);
        
        if (result.success && result.images && result.images.length > 0) {
          return {
            images: result.images,
            success: true,
            generatedDescription: detailedPrompt
          };
        }
      }
      
      return {
        images: [],
        success: false,
        error: 'Failed to generate venue image'
      };
      
    } catch (error) {
      console.error('Error generating venue image:', error);
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
  static async generateThemeAnalysis(request: CloudflareImageGenerationRequest): Promise<CloudflareImageGenerationResponse> {
    try {
      const analysisPrompt = this.generateAnalysisPrompt(request);
      
      console.log('Generated analysis prompt for Cloudflare AI:', analysisPrompt);
      
      
      const response = await fetch(`${this.WORKER_URL}/analyze-text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: analysisPrompt,
          model: this.TEXT_MODEL,
          max_tokens: 2048
        })
      });

      if (!response.ok) {
        throw new Error(`Cloudflare AI error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      const generatedText = result.response;
      
      if (!generatedText) {
        throw new Error('No content generated from Cloudflare AI');
      }

      console.log('Cloudflare AI analysis response:', generatedText);

      const themeAnalysis = this.parseCloudflareResponse(generatedText);
      
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
   * Validate connection to Cloudflare Workers AI
   */
  static async validateConnection(): Promise<boolean> {
    try {
      // Make a simple API call to test the connection
      const response = await fetch(`${this.WORKER_URL}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Cloudflare AI connection validation failed:', error);
      return false;
    }
  }
} 