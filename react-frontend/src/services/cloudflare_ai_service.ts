// Cloudflare AI service has been removed
// Use static images and Gemini API instead
export class CloudflareAIService {
  static async generateWeddingThemeImages(params?: any): Promise<WeddingThemeImageResponse> {
    throw new Error('Cloudflare AI service has been removed. Use static images instead.');
  }

  static async generateVenueImages(): Promise<any> {
    throw new Error('Cloudflare AI service has been removed. Use static images instead.');
  }

  static async validateConnection(): Promise<boolean> {
    return false;
  }
}