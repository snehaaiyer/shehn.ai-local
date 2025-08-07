
// Simple Mock Service - No AI dependencies
export interface MockImageGenerationRequest {
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

export interface MockImageGenerationResponse {
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

export class SimpleMockService {
  /**
   * Generate mock wedding theme images using placeholder images
   */
  static async generateWeddingThemeImages(request: MockImageGenerationRequest): Promise<MockImageGenerationResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const { theme, style, colors, venueType } = request;
    
    // Generate mock images based on theme
    const mockImages = [
      '/images/themes/traditional-cultural.jpg',
      '/images/themes/royal-palace.jpg',
      '/images/themes/boho-garden.jpg',
      '/images/themes/destination.jpg'
    ];
    
    // Generate mock analysis
    const mockAnalysis = {
      keywords: [theme, style, 'wedding', 'celebration', 'elegant', 'beautiful'],
      mood: 'romantic',
      style: style.toLowerCase(),
      colors: colors.split(' ').map(c => c.toLowerCase())
    };
    
    const mockDescription = `A beautiful ${theme} wedding with ${style} styling in ${colors} colors. Perfect for ${venueType} venues with elegant decorations and romantic atmosphere.`;
    
    return {
      images: mockImages.slice(0, request.imageCount || 2),
      success: true,
      generatedDescription: mockDescription,
      themeAnalysis: mockAnalysis
    };
  }

  /**
   * Generate venue images using mock data
   */
  static async generateVenueImages(venuePrompt: string): Promise<MockImageGenerationResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      images: ['/images/venues/luxury hotel.png'],
      success: true,
      generatedDescription: venuePrompt
    };
  }

  /**
   * Generate theme analysis only
   */
  static async generateThemeAnalysis(request: MockImageGenerationRequest): Promise<MockImageGenerationResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const mockAnalysis = {
      keywords: [request.theme, request.style, 'wedding'],
      mood: 'elegant',
      style: request.style.toLowerCase(),
      colors: ['white', 'gold']
    };
    
    return {
      images: [],
      success: true,
      generatedDescription: `Analysis for ${request.theme} wedding theme`,
      themeAnalysis: mockAnalysis
    };
  }

  /**
   * Always returns true for mock service
   */
  static async validateConnection(): Promise<boolean> {
    return true;
  }
}
