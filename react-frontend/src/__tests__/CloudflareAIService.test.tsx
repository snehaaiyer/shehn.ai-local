
import { CloudflareAIService } from '../services/cloudflare_ai_service';

// Mock fetch globally
global.fetch = jest.fn();

describe('CloudflareAIService', () => {
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Static Methods', () => {
    it('should have generateWeddingThemeImages method', () => {
      expect(typeof CloudflareAIService.generateWeddingThemeImages).toBe('function');
    });

    it('should have generateImage method', () => {
      expect(typeof CloudflareAIService.generateImage).toBe('function');
    });

    it('should have analyzeText method', () => {
      expect(typeof CloudflareAIService.analyzeText).toBe('function');
    });
  });

  describe('Image Generation', () => {
    it('should generate wedding theme images', async () => {
      const result = await CloudflareAIService.generateWeddingThemeImages('elegant wedding venue');
      
      expect(result.success).toBe(true);
      expect(result.images).toHaveLength(2);
      expect(result.themeAnalysis).toBeDefined();
      expect(result.themeAnalysis?.keywords).toContain('elegant');
    });

    it('should handle generateImage method', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          result: {
            image: 'base64-image-data'
          },
          success: true
        })
      } as Response);

      const result = await CloudflareAIService.generateImage('test prompt');
      
      expect(result.success).toBe(true);
      expect(result.result.image).toBe('base64-image-data');
    });

    it('should handle generateImage errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(CloudflareAIService.generateImage('test prompt')).rejects.toThrow('Network error');
    });
  });

  describe('Text Analysis', () => {
    it('should analyze text successfully with API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          result: {
            response: 'This is a beautiful traditional wedding analysis'
          }
        })
      } as Response);

      const result = await CloudflareAIService.analyzeText('traditional wedding theme');
      
      expect(result).toBe('This is a beautiful traditional wedding analysis');
    });

    it('should handle API errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await CloudflareAIService.analyzeText('test text');
      
      expect(result).toBe('Analysis unavailable');
    });

    it('should handle HTTP errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401
      } as Response);

      const result = await CloudflareAIService.analyzeText('test text');
      
      expect(result).toBe('Analysis unavailable');
    });
  });

  describe('Error Handling', () => {
    it('should handle default prompt gracefully', async () => {
      const result = await CloudflareAIService.generateWeddingThemeImages();
      
      expect(result.success).toBe(true);
      expect(result.images).toHaveLength(2);
      expect(result.themeAnalysis).toBeDefined();
    });

    it('should handle custom prompt', async () => {
      const result = await CloudflareAIService.generateWeddingThemeImages('luxury royal wedding');
      
      expect(result.success).toBe(true);
      expect(result.images).toHaveLength(2);
      expect(result.themeAnalysis?.keywords).toContain('elegant');
    });
  });
});
