
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
    
    // Map theme names to appropriate images
    const themeImageMappings: { [key: string]: string } = {
      // Indian Wedding Themes
      'royal palace': '/images/themes/royal-rajasthani-mandap.jpg',
      'rajasthani': '/images/themes/royal-rajasthani-mandap.jpg',
      'royal': '/images/themes/royal-rajasthani-mandap.jpg',
      'palace': '/images/themes/royal-rajasthani-mandap.jpg',
      
      'traditional': '/images/themes/traditional-temple-ceremony.jpg',
      'temple': '/images/themes/traditional-temple-ceremony.jpg',
      'regional': '/images/themes/traditional-temple-ceremony.jpg',
      'hindu': '/images/themes/traditional-temple-ceremony.jpg',
      
      'bollywood': '/images/themes/bollywood-glamour-stage.jpg',
      'glamour': '/images/themes/bollywood-glamour-stage.jpg',
      'sangeet': '/images/themes/bollywood-glamour-stage.jpg',
      
      'minimalist': '/images/themes/minimalist-modern-white.jpg',
      'modern': '/images/themes/minimalist-modern-white.jpg',
      'contemporary': '/images/themes/minimalist-modern-white.jpg',
      
      'floral': '/images/themes/floral-paradise-garden.jpg',
      'paradise': '/images/themes/floral-paradise-garden.jpg',
      'garden': '/images/themes/floral-paradise-garden.jpg',
      'flower': '/images/themes/floral-paradise-garden.jpg',
      
      'eco': '/images/themes/eco-sustainable-bamboo.jpg',
      'sustainable': '/images/themes/eco-sustainable-bamboo.jpg',
      'green': '/images/themes/eco-sustainable-bamboo.jpg',
      'bamboo': '/images/themes/eco-sustainable-bamboo.jpg',
      
      'bohemian': '/images/themes/bohemian-chic-dreamcatcher.jpg',
      'boho': '/images/themes/bohemian-chic-dreamcatcher.jpg',
      'chic': '/images/themes/bohemian-chic-dreamcatcher.jpg',
      
      'beach': '/images/themes/beach-destination.jpg',
      'destination': '/images/themes/beach-destination.jpg',
      'luxury': '/images/themes/beach-destination.jpg'
    };
    
    // Find appropriate image based on theme
    let selectedImage = '/images/themes/traditional-cultural.jpg'; // default
    
    const themeLower = theme.toLowerCase();
    for (const [keyword, imagePath] of Object.entries(themeImageMappings)) {
      if (themeLower.includes(keyword)) {
        selectedImage = imagePath;
        break;
      }
    }
    
    // Generate mock analysis
    const mockAnalysis = {
      keywords: [theme, style, 'wedding', 'celebration', 'elegant', 'beautiful'],
      mood: 'romantic',
      style: style.toLowerCase(),
      colors: colors.split(' ').map(c => c.toLowerCase())
    };
    
    const mockDescription = `A beautiful ${theme} wedding with ${style} styling in ${colors} colors. Perfect for ${venueType} venues with elegant decorations and romantic atmosphere.`;
    
    return {
      images: [selectedImage],
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
    
    // Map venue prompts to appropriate images
    const venueImageMappings: { [key: string]: string } = {
      // Heritage & Luxury
      'heritage': '/images/venues/heritage palace.png',
      'palace': '/images/venues/heritage palace.png',
      'luxury': '/images/venues/luxury hotel.png',
      'hotel': '/images/venues/luxury hotel.png',
      'haveli': '/images/venues/heritagehaveli.png',
      'fort': '/images/venues/royal fort.png',
      'royal': '/images/venues/royal fort.png',
      
      // Destination & Nature
      'beach': '/images/venues/beachresort.png',
      'resort': '/images/venues/beachresort.png',
      'mountain': '/images/venues/mountain.png',
      'garden': '/images/venues/garden.png',
      'lake': '/images/venues/lakeresort.png',
      'lakefront': '/images/venues/lakeresort.png',
      
      // Traditional & Cultural
      'banquet': '/images/venues/banquet.png',
      'hall': '/images/venues/banquet.png',
      'temple': '/images/venues/temple.png',
      'community': '/images/venues/communityhall.png',
      'gurudwara': '/images/venues/gurudwara.png',
      
      // Modern & Urban
      'rooftop': '/images/venues/rooftop.png',
      'farmhouse': '/images/venues/farmhouse.png',
      'farm': '/images/venues/farmhouse.png',
      'villa': '/images/venues/luxuryvilla.png',
      'industrial': '/images/venues/industrial.png'
    };
    
    // Find appropriate image based on venue prompt
    let selectedImage = '/images/venues/luxury hotel.png'; // default
    
    const promptLower = venuePrompt.toLowerCase();
    for (const [keyword, imagePath] of Object.entries(venueImageMappings)) {
      if (promptLower.includes(keyword)) {
        selectedImage = imagePath;
        break;
      }
    }
    
    return {
      images: [selectedImage],
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
