/**
 * Simple Mock Service for AI Features
 * Provides fallback when external AI services are unavailable
 */

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

export class SimpleMockService {
  static async generateImage(prompt: string): Promise<string> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Return a placeholder image URL
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzY2NzM4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkFJIEltYWdlIEdlbmVyYXRpb24gVW5hdmFpbGFibGU8L3RleHQ+CiAgPHRleHQgeD0iNTAlIiB5PSI2NSUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzk3YTNiNCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPlBsZWFzZSB0cnkgYWdhaW4gbGF0ZXI8L3RleHQ+Cjwvc3ZnPgo=';
  }

  static async generateText(prompt: string): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return "AI text generation is temporarily unavailable. Please try again later.";
  }

  static async generateVenueImages(venuePrompt: string): Promise<CloudflareImageGenerationResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return {
      images: [],
      success: false,
      error: 'Image generation service is currently unavailable',
      fallbackUsed: true
    };
  }

  static async generateWeddingThemeImages(request: CloudflareImageGenerationRequest): Promise<CloudflareImageGenerationResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return {
      images: [],
      success: false,
      error: 'Image generation service is currently unavailable',
      fallbackUsed: true
    };
  }

  static async isServiceAvailable(): Promise<boolean> {
    return false; // Always return false to indicate fallback mode
  }
}

export default SimpleMockService;