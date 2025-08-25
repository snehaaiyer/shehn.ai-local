
import { AIImageResponse } from '../types/ai';

interface CloudflareImageRequest {
  prompt: string;
  num_steps?: number;
}

interface CloudflareImageResponse {
  result: {
    image: string;
  };
  success: boolean;
  errors?: Array<{ message: string }>;
}

export class CloudflareAIService {
  private static readonly API_BASE = process.env.REACT_APP_CLOUDFLARE_API_BASE || '';
  private static readonly API_TOKEN = process.env.REACT_APP_CLOUDFLARE_API_TOKEN || '';

  static async generateWeddingThemeImages(prompt: string = 'elegant wedding venue'): Promise<AIImageResponse> {
    try {
      console.log('🎨 Generating wedding theme images with Cloudflare AI...');

      // Fallback to mock response for now
      return {
        success: true,
        imageUrls: [
          'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop'
        ],
        themeAnalysis: {
          description: `Beautiful ${prompt} setting`,
          keywords: ['elegant', 'romantic', 'luxurious'],
          mood: 'romantic',
          style: 'contemporary',
          colorPalette: ['#F4628E', '#FFCEB2', '#FFFFFF']
        }
      };
    } catch (error) {
      console.error('❌ Cloudflare AI Error:', error);
      return {
        success: false,
        error: 'Failed to generate image',
        imageUrls: [],
        themeAnalysis: {
          description: '',
          keywords: [],
          mood: '',
          style: '',
          colorPalette: []
        }
      };
    }
  }

  static async generateImage(prompt: string): Promise<CloudflareImageResponse> {
    try {
      const response = await fetch(`${this.API_BASE}/accounts/${process.env.REACT_APP_CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/stabilityai/stable-diffusion-xl-base-1.0`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          num_steps: 20,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Cloudflare AI request failed:', error);
      throw error;
    }
  }

  static async analyzeText(text: string): Promise<string> {
    try {
      const response = await fetch(`${this.API_BASE}/accounts/${process.env.REACT_APP_CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/meta/llama-2-7b-chat-int8`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: text
            }
          ]
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.result.response;
    } catch (error) {
      console.error('Cloudflare AI text analysis failed:', error);
      return 'Analysis unavailable';
    }
  }
}
