// Simplified Cloudflare AI Service for Replit deployment
// Use static images and Gemini API instead
import { AIImageResponse } from '../types/ai';

export class CloudflareAIService {
  static async generateWeddingThemeImages(params?: any): Promise<AIImageResponse> {
    // Return mock response instead of throwing error to prevent build failures
    return {
      success: false,
      images: [],
      message: 'Cloudflare AI service has been removed. Use static images instead.'
    };
  }

  static async generateVenueImages(): Promise<any> {
    throw new Error('Cloudflare AI service has been removed. Use static images instead.');
  }

  static async validateConnection(): Promise<boolean> {
    return false;
  }
}