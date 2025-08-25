
export interface CloudflareAIConfig {
  apiKey?: string;
  accountId?: string;
  endpoint?: string;
}

export interface ImageGenerationResponse {
  success: boolean;
  images: string[];
  analysis?: {
    theme: string;
    style: string;
    colors: string[];
    mood: string;
    keywords: string[];
  };
  error?: string;
}

export interface ThemeAnalysisResponse {
  success: boolean;
  analysis: {
    theme: string;
    description: string;
    keywords: string[];
    mood: string;
    style: string;
    colors: string[];
  };
  error?: string;
}

class CloudflareAIService {
  private config: CloudflareAIConfig;
  private isInitialized: boolean = false;

  constructor(config: CloudflareAIConfig = {}) {
    this.config = {
      apiKey: config.apiKey || process.env.REACT_APP_CLOUDFLARE_API_KEY || '',
      accountId: config.accountId || process.env.REACT_APP_CLOUDFLARE_ACCOUNT_ID || '',
      endpoint: config.endpoint || 'https://api.cloudflare.com/client/v4'
    };
    this.initialize();
  }

  private initialize(): void {
    try {
      this.isInitialized = true;
      console.log('CloudflareAIService initialized successfully');
    } catch (error) {
      console.warn('CloudflareAIService initialization failed:', error);
      this.isInitialized = false;
    }
  }

  private validateConfig(): boolean {
    if (!this.config.apiKey || !this.config.accountId) {
      console.warn('Cloudflare AI: Missing API key or account ID, using mock responses');
      return false;
    }
    return true;
  }

  private createMockResponse(preferences: any): ImageGenerationResponse {
    const themes = ['royal-palace', 'beach-destination', 'boho-garden', 'traditional-cultural'];
    const selectedTheme = preferences.theme || themes[Math.floor(Math.random() * themes.length)];
    
    return {
      success: true,
      images: [
        `/images/themes/${selectedTheme}.jpg`,
        `/images/themes/fallback-theme.jpg`,
        `/images/themes/royal-palace.jpg`,
        `/images/themes/traditional-cultural.jpg`
      ],
      analysis: {
        theme: selectedTheme,
        style: preferences.style || 'Traditional',
        colors: preferences.colors?.split(',').map((c: string) => c.trim()) || ['Gold', 'Red', 'Maroon'],
        mood: 'Elegant and Traditional',
        keywords: ['wedding', 'traditional', 'elegant', 'cultural', 'celebration']
      }
    };
  }

  private createMockThemeAnalysis(preferences: any): ThemeAnalysisResponse {
    return {
      success: true,
      analysis: {
        theme: preferences.theme || 'Traditional Indian Wedding',
        description: `A beautiful ${preferences.style || 'traditional'} wedding celebration with ${preferences.colors || 'warm colors'} in a ${preferences.season || 'winter'} setting.`,
        keywords: ['wedding', 'celebration', 'traditional', 'elegant', 'indian'],
        mood: 'Joyful and Traditional',
        style: preferences.style || 'Traditional',
        colors: preferences.colors?.split(',').map((c: string) => c.trim()) || ['Gold', 'Red']
      }
    };
  }

  async generateWeddingImages(preferences: any): Promise<ImageGenerationResponse> {
    try {
      if (!this.isInitialized || !this.validateConfig()) {
        console.log('Using mock Cloudflare AI response for image generation');
        return this.createMockResponse(preferences);
      }

      const prompt = this.buildImagePrompt(preferences);
      
      const response = await fetch(`${this.config.endpoint}/accounts/${this.config.accountId}/ai/run/@cf/stabilityai/stable-diffusion-xl-base-1.0`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: prompt,
          num_steps: 20,
          guidance_scale: 7.5,
          width: 1024,
          height: 768
        })
      });

      if (!response.ok) {
        throw new Error(`Cloudflare AI API error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        images: data.result ? [data.result] : [],
        analysis: this.analyzeGeneratedContent(preferences)
      };

    } catch (error) {
      console.warn('Cloudflare AI generation failed, using mock response:', error);
      return this.createMockResponse(preferences);
    }
  }

  async analyzeWeddingTheme(preferences: any): Promise<ThemeAnalysisResponse> {
    try {
      if (!this.isInitialized || !this.validateConfig()) {
        console.log('Using mock Cloudflare AI response for theme analysis');
        return this.createMockThemeAnalysis(preferences);
      }

      const prompt = this.buildAnalysisPrompt(preferences);

      const response = await fetch(`${this.config.endpoint}/accounts/${this.config.accountId}/ai/run/@cf/meta/llama-2-7b-chat-int8`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`Cloudflare AI API error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        analysis: this.parseAnalysisResponse(data.result?.response || '', preferences)
      };

    } catch (error) {
      console.warn('Cloudflare AI analysis failed, using mock response:', error);
      return this.createMockThemeAnalysis(preferences);
    }
  }

  private buildImagePrompt(preferences: any): string {
    const theme = preferences.theme || 'traditional';
    const style = preferences.style || 'traditional';
    const colors = preferences.colors || 'gold and red';
    const season = preferences.season || 'winter';
    
    return `Beautiful ${theme} Indian wedding venue decoration in ${style} style with ${colors} color scheme during ${season} season, elegant mandap, floral arrangements, traditional decor, high quality, detailed, photorealistic`;
  }

  private buildAnalysisPrompt(preferences: any): string {
    return `Analyze this Indian wedding theme: Theme: ${preferences.theme}, Style: ${preferences.style}, Colors: ${preferences.colors}, Season: ${preferences.season}, Guest Count: ${preferences.guestCount}. Provide a detailed description, mood, and relevant keywords.`;
  }

  private analyzeGeneratedContent(preferences: any): any {
    return {
      theme: preferences.theme || 'Traditional',
      style: preferences.style || 'Traditional',
      colors: preferences.colors?.split(',').map((c: string) => c.trim()) || ['Gold', 'Red'],
      mood: 'Elegant and Festive',
      keywords: ['wedding', 'traditional', 'elegant', 'celebration', 'indian']
    };
  }

  private parseAnalysisResponse(response: string, preferences: any): any {
    return {
      theme: preferences.theme || 'Traditional Indian Wedding',
      description: response || `A beautiful wedding celebration in ${preferences.style || 'traditional'} style`,
      keywords: ['wedding', 'traditional', 'elegant', 'indian', 'celebration'],
      mood: 'Joyful and Traditional',
      style: preferences.style || 'Traditional',
      colors: preferences.colors?.split(',').map((c: string) => c.trim()) || ['Gold', 'Red']
    };
  }

  isAvailable(): boolean {
    return this.isInitialized;
  }

  getConfig(): CloudflareAIConfig {
    return { ...this.config };
  }
}

export default CloudflareAIService;
