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
  fallbackUsed?: boolean;
}

export class CloudflareAIService {
  /**
   * Generate wedding theme images - disabled
   */
  static async generateWeddingThemeImages(request: CloudflareImageGenerationRequest): Promise<CloudflareImageGenerationResponse> {
    console.log('Cloudflare AI service is disabled');
    return {
      images: [],
      success: false,
      error: 'Cloudflare AI service is disabled. Using static images only.',
      fallbackUsed: true
    };
  }

  /**
   * Generate venue images - disabled
   */
  static async generateVenueImages(venuePrompt: string): Promise<CloudflareImageGenerationResponse> {
    console.log('Cloudflare AI service is disabled');
    return {
      images: [],
      success: false,
      error: 'Cloudflare AI service is disabled. Using static images only.',
      fallbackUsed: true
    };
  }

  /**
   * Generate theme analysis - disabled
   */
  static async generateThemeAnalysis(request: CloudflareImageGenerationRequest): Promise<CloudflareImageGenerationResponse> {
    console.log('Cloudflare AI service is disabled');
    return {
      images: [],
      success: false,
      error: 'Cloudflare AI service is disabled.',
      fallbackUsed: true
    };
  }

  /**
   * Validate connection - always returns false
   */
  static async validateConnection(): Promise<boolean> {
    return false;
  }
}