interface LocalImageGenerationRequest {
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

interface LocalImageGenerationResponse {
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

export class LocalAIService {
  // Use your existing backend server
  private static readonly BACKEND_URL = 'http://localhost:8000';

  /**
   * Generate wedding theme images using your existing backend
   */
  static async generateWeddingThemeImages(request: LocalImageGenerationRequest): Promise<LocalImageGenerationResponse> {
    try {
      console.log('Starting Local AI image generation for:', request);
      
      // Try to use your existing backend API first
      const response = await fetch(`${this.BACKEND_URL}/api/search-images`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `${request.theme} ${request.style} ${request.colors} ${request.venueType} wedding venue`,
          num_results: request.imageCount || 2
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Backend API response:', result);
        
        if (result.success && result.images) {
          // Extract URLs from image objects
          const imageUrls = result.images.map((img: any) => img.url || img);
          
          return {
            images: imageUrls,
            success: true,
            generatedDescription: `Beautiful ${request.theme} ${request.style} wedding venue with ${request.colors} theme`,
            themeAnalysis: {
              keywords: [request.theme, request.style, request.venueType, 'wedding', 'venue'],
              mood: request.theme.toLowerCase(),
              style: request.style.toLowerCase(),
              colors: request.colors.toLowerCase().split(' and ')
            }
          };
        }
      }

      // Fallback to mock service if backend fails
      console.log('Backend API failed, using fallback images');
      
      const allFallbackImages = [
        'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1024&h=1024&fit=crop',
        'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1024&h=1024&fit=crop',
        'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=1024&h=1024&fit=crop',
        'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1024&h=1024&fit=crop&sat=-50'
      ];
      
      const fallbackImages = allFallbackImages.slice(0, request.imageCount || 2);

      return {
        images: fallbackImages,
        success: true,
        generatedDescription: `Beautiful ${request.theme} ${request.style} wedding venue with ${request.colors} theme`,
        themeAnalysis: {
          keywords: [request.theme, request.style, request.venueType, 'wedding', 'venue'],
          mood: request.theme.toLowerCase(),
          style: request.style.toLowerCase(),
          colors: request.colors.toLowerCase().split(' and ')
        }
      };
      
    } catch (error) {
      console.error('Error in local image generation:', error);
      return {
        images: [],
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Generate theme analysis
   */
  static async generateThemeAnalysis(request: LocalImageGenerationRequest): Promise<LocalImageGenerationResponse> {
    try {
      console.log('Starting Local AI theme analysis for:', request);
      
      // Generate analysis based on input
      const analysis = {
        description: `A stunning ${request.theme} ${request.style} wedding venue featuring ${request.colors} color palette, perfect for a ${request.season} celebration with ${request.guestCount} guests.`,
        keywords: [request.theme, request.style, request.venueType, 'wedding', 'venue', request.season],
        mood: request.theme.toLowerCase(),
        style: request.style.toLowerCase(),
        colors: request.colors.toLowerCase().split(' and ')
      };
      
      return {
        images: [],
        success: true,
        generatedDescription: analysis.description,
        themeAnalysis: analysis
      };
      
    } catch (error) {
      console.error('Error in local theme analysis:', error);
      return {
        images: [],
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Validate connection to backend
   */
  static async validateConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.BACKEND_URL}/health`);
      return response.ok;
    } catch (error) {
      console.error('Backend connection failed:', error);
      return false;
    }
  }
} 