
export interface RunwayMLImageRequest {
  prompt: string;
  width?: number;
  height?: number;
  guidance_scale?: number;
  num_inference_steps?: number;
  seed?: number;
}

export interface RunwayMLImageResponse {
  success: boolean;
  image?: string;
  error?: string;
}

export class RunwayMLService {
  private static readonly API_BASE_URL = 'https://api.runwayml.com/v1';
  private static readonly API_KEY = process.env.REACT_APP_RUNWAYML_API_KEY;

  /**
   * Generate theme images using RunwayML API
   */
  static async generateThemeImage(request: RunwayMLImageRequest): Promise<RunwayMLImageResponse> {
    try {
      if (!this.API_KEY) {
        console.warn('RunwayML API key not found, using fallback');
        return {
          success: false,
          error: 'API key not configured'
        };
      }

      console.log('🎨 Generating theme image with RunwayML:', request.prompt.substring(0, 100) + '...');

      const response = await fetch(`${this.API_BASE_URL}/image/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: request.prompt,
          width: request.width || 1024,
          height: request.height || 1024,
          guidance_scale: request.guidance_scale || 7.5,
          num_inference_steps: request.num_inference_steps || 50,
          seed: request.seed || Math.floor(Math.random() * 1000000)
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('RunwayML API error:', errorText);
        return {
          success: false,
          error: `API error: ${response.status} - ${errorText}`
        };
      }

      const result = await response.json();
      
      if (result.image) {
        console.log('✅ Successfully generated theme image with RunwayML');
        return {
          success: true,
          image: result.image
        };
      } else {
        console.error('No image in RunwayML response:', result);
        return {
          success: false,
          error: 'No image in response'
        };
      }

    } catch (error) {
      console.error('Error calling RunwayML API:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Generate multiple theme images for Indian wedding themes
   */
  static async generateIndianWeddingThemeImages(themePrompts: { [key: string]: string }): Promise<{ [key: string]: string }> {
    const results: { [key: string]: string } = {};
    
    console.log('🎨 Starting batch generation of Indian wedding theme images...');
    
    for (const [themeId, prompt] of Object.entries(themePrompts)) {
      try {
        console.log(`🖼️ Generating image for theme: ${themeId}`);
        
        const response = await this.generateThemeImage({
          prompt: prompt,
          width: 1024,
          height: 1024,
          guidance_scale: 8.0,
          num_inference_steps: 50
        });
        
        if (response.success && response.image) {
          results[themeId] = response.image;
          console.log(`✅ Generated image for ${themeId}`);
        } else {
          console.log(`⚠️ Failed to generate image for ${themeId}: ${response.error}`);
        }
        
        // Add delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(`❌ Error generating image for ${themeId}:`, error);
      }
    }
    
    console.log(`🎉 Completed batch generation. Generated ${Object.keys(results).length} images.`);
    return results;
  }

  /**
   * Enhanced prompt for Indian wedding themes with cultural specificity
   */
  static enhanceIndianWeddingPrompt(basePrompt: string): string {
    const indianWeddingEnhancements = [
      'Indian wedding celebration',
      'traditional mandap ceremony',
      'vibrant marigold and rose decorations',
      'authentic Indian attire',
      'cultural rituals and customs',
      'warm festive lighting',
      'rich color palette',
      'professional wedding photography',
      '4K ultra-detailed quality',
      'cinematic composition'
    ];

    // Add cultural context if not already present
    let enhancedPrompt = basePrompt;
    
    if (!enhancedPrompt.toLowerCase().includes('indian')) {
      enhancedPrompt = `Indian ${enhancedPrompt}`;
    }
    
    if (!enhancedPrompt.toLowerCase().includes('mandap')) {
      enhancedPrompt = enhancedPrompt.replace('wedding', 'wedding with traditional mandap');
    }
    
    if (!enhancedPrompt.toLowerCase().includes('4k')) {
      enhancedPrompt += ', 4K ultra-detailed quality, professional wedding photography, cinematic composition';
    }

    return enhancedPrompt;
  }

  /**
   * Get optimized theme prompts for RunwayML generation
   */
  static getOptimizedThemePrompts(): { [key: string]: string } {
    return {
      'royal-palace-rajasthani': 'Cinematic wide shot of a magnificent Rajasthani royal palace Indian wedding ceremony. Traditional red sandstone architecture with intricate carved jharokhas and ornate mirror work. Golden mandap decorated with vibrant marigold garlands and roses. Bride in red lehenga with heavy gold jewelry, groom in cream sherwani with kalgi. Traditional Rajasthani musicians playing shehnai and tabla. Warm golden hour lighting, rich red and gold color palette, ultra-detailed, 4K quality, professional wedding photography style.',

      'traditional-regional-roots': 'Beautiful traditional South Indian temple wedding ceremony with authentic cultural elements. Ornate carved stone pillars and temple architecture. Bride in silk Kanjivaram saree with temple jewelry, groom in white dhoti and angavastram. Sacred fire ceremony with banana leaves, coconut decorations, and colorful rangoli patterns. Traditional nadaswaram music, brass oil lamps, jasmine garlands. Warm temple lighting, rich jewel tones, ultra-detailed Indian cultural authenticity, 4K cinematic quality.',

      'eco-friendly-sustainable': 'Stunning eco-friendly Indian wedding in lush garden setting. Natural bamboo mandap with living plants and organic decorations. Couple in sustainable traditional wear - bride in handloom saree, groom in organic cotton kurta. Potted plants replacing cut flowers, solar string lights, biodegradable leaf plates. Natural wood furniture, jute decorations, earthen diyas. Green and earth tone color palette, soft natural lighting, 4K eco-conscious celebration, professional nature photography style.',

      'bollywood-glamour': 'Glamorous Bollywood-style Indian wedding reception with cinematic grandeur. Large dance floor with disco balls and dramatic spotlights. Vintage Bollywood movie posters and film reel decorations. Bride in heavily embellished lehenga with statement jewelry, groom in designer sherwani. Golden and red sequined draping, champagne towers, red carpet entrance. Professional dancers performing, live orchestra, vibrant party atmosphere. Rich golden lighting, 4K cinematic quality, Bollywood movie aesthetic.',

      'minimalist-modern': 'Sophisticated minimalist modern Indian wedding with contemporary elegance. Clean geometric mandap with simple white and gold decorations. Couple in modern traditional wear - bride in subtle pastel lehenga, groom in contemporary sherwani. Sleek furniture, geometric floral arrangements, modern lighting fixtures. Neutral color palette of whites, greys, and soft pastels. Uncluttered space design, glass elements, architectural lines. Soft professional lighting, 4K ultra-clean aesthetic, luxury hotel setting.',

      'floral-paradise': 'Breathtaking floral paradise Indian wedding in blooming garden. Mandap completely covered in roses, jasmine, and marigolds. Massive floral archways and hanging flower installations. Bride in floral-themed lehenga with fresh flower jewelry, groom with floral sehra. Flower walls as backdrops, floral carpets, botanical ceiling decorations. Pastel color palette with pinks, whites, and soft greens. Natural garden setting with butterflies, 4K botanical paradise, dreamy romantic lighting, professional garden photography.',

      'bohemian-chic': 'Bohemian chic Indian wedding with artistic eclectic decorations. Mandap with flowing fabrics, macrame hanging installations, vintage rugs and floor cushions. Bride in boho-style lehenga with oxidized jewelry, groom in artistic kurta. Dreamcatchers, feathers, mixed textures and patterns. Vintage furniture pieces, natural wood elements, fairy lights. Warm earth tones with jewel color pops, outdoor garden setting. 4K artistic bohemian aesthetic, free-spirited celebration, warm golden lighting.',

      'vintage-classic': 'Vintage classic Indian wedding with timeless elegance and nostalgic charm. Heritage mandap with antique furniture and vintage lace decorations. Bride in classic heavy silk saree with traditional gold jewelry, groom in vintage-style achkan. Vintage Indian brass items, heritage photographs, classic floral arrangements in antique vases. Old Bollywood music setup, heritage textiles, sepia-toned lighting. Warm vintage color palette, 4K classic elegance, professional heritage photography style, old-world charm.'
    };
  }
}
