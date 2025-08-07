interface MockImageGenerationRequest {
  theme: string;
  style: string;
  colors: string;
  season: string;
  venueType: string;
  customDescription: string;
  guestCount: number;
  location: string;
}

interface MockImageGenerationResponse {
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

export class MockCloudflareAIService {
  // Mock service for local development
  private static readonly MOCK_DELAY = 2000; // 2 seconds to simulate API call

  /**
   * Generate a detailed prompt for wedding theme image generation
   */
  private static generateImagePrompt(request: MockImageGenerationRequest): string {
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
  private static generateAnalysisPrompt(request: MockImageGenerationRequest): string {
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
   * Generate mock theme analysis
   */
  private static generateMockAnalysis(request: MockImageGenerationRequest): any {
    const { theme, style, colors, season, venueType } = request;
    
    // Generate realistic analysis based on input
    const descriptions = {
      'Elegant': 'A sophisticated and refined wedding setup featuring luxurious details and timeless elegance.',
      'Rustic': 'A charming and warm wedding atmosphere with natural elements and cozy, intimate vibes.',
      'Modern': 'A contemporary and sleek wedding design with clean lines and minimalist sophistication.',
      'Bohemian': 'A free-spirited and artistic wedding theme with eclectic decor and natural beauty.',
      'Traditional': 'A classic and formal wedding celebration with time-honored customs and elegant traditions.'
    };

    const moods = {
      'Elegant': 'sophisticated',
      'Rustic': 'warm',
      'Modern': 'contemporary',
      'Bohemian': 'free-spirited',
      'Traditional': 'classic'
    };

    const styles = {
      'Classic': 'traditional',
      'Modern': 'contemporary',
      'Vintage': 'retro',
      'Minimalist': 'clean',
      'Luxury': 'opulent'
    };

    const colorSchemes = {
      'White and Gold': ['white', 'gold', 'cream', 'ivory'],
      'Blush and Gold': ['blush', 'gold', 'white', 'rose'],
      'Navy and Gold': ['navy', 'gold', 'white', 'silver'],
      'Burgundy and Gold': ['burgundy', 'gold', 'cream', 'deep-red'],
      'Sage and White': ['sage', 'white', 'cream', 'mint']
    };

    const keywords = [
      'wedding', 'venue', theme?.toLowerCase(), style?.toLowerCase(),
      venueType?.toLowerCase(), season?.toLowerCase(), 'elegant', 'romantic'
    ].filter(Boolean);

    return {
      description: descriptions[theme as keyof typeof descriptions] || descriptions['Elegant'],
      keywords: keywords.slice(0, 8),
      mood: moods[theme as keyof typeof moods] || 'elegant',
      style: styles[style as keyof typeof styles] || 'classic',
      colors: colorSchemes[colors as keyof typeof colorSchemes] || ['white', 'gold', 'cream']
    };
  }

  /**
   * Generate mock wedding theme images using local development
   */
  static async generateWeddingThemeImages(request: MockImageGenerationRequest): Promise<MockImageGenerationResponse> {
    try {
      console.log('Starting Mock Cloudflare AI image generation for:', request);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, this.MOCK_DELAY));
      
      // Generate mock analysis
      const themeAnalysis = this.generateMockAnalysis(request);
      
      // Generate mock images (using placeholder images)
      const mockImages = [
        'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1024&h=1024&fit=crop',
        'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1024&h=1024&fit=crop',
        'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=1024&h=1024&fit=crop',
        'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1024&h=1024&fit=crop&sat=-50'
      ];
      
      console.log('Mock Cloudflare AI response generated');
      
      return {
        images: mockImages,
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
      console.error('Error in mock image generation:', error);
      return {
        images: [],
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Generate theme analysis only
   */
  static async generateThemeAnalysis(request: MockImageGenerationRequest): Promise<MockImageGenerationResponse> {
    try {
      console.log('Starting Mock Cloudflare AI theme analysis for:', request);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, this.MOCK_DELAY));
      
      // Generate mock analysis
      const themeAnalysis = this.generateMockAnalysis(request);
      
      console.log('Mock Cloudflare AI analysis response generated');
      
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
      console.error('Error in mock theme analysis:', error);
      return {
        images: [],
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Validate connection (always returns true for mock)
   */
  static async validateConnection(): Promise<boolean> {
    return true;
  }
} 