
import CloudflareAIService from '../services/cloudflare_ai_service';

// Mock fetch globally
global.fetch = jest.fn();

describe('CloudflareAIService', () => {
  let service: CloudflareAIService;
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CloudflareAIService({
      apiKey: 'test-api-key',
      accountId: 'test-account-id'
    });
  });

  describe('Initialization', () => {
    it('should initialize without API credentials', () => {
      const serviceWithoutCreds = new CloudflareAIService();
      expect(serviceWithoutCreds.isAvailable()).toBe(true);
    });

    it('should initialize with API credentials', () => {
      expect(service.isAvailable()).toBe(true);
    });

    it('should return config', () => {
      const config = service.getConfig();
      expect(config.apiKey).toBe('test-api-key');
      expect(config.accountId).toBe('test-account-id');
    });
  });

  describe('Image Generation', () => {
    const mockPreferences = {
      theme: 'royal-palace',
      style: 'Traditional',
      colors: 'Gold, Red',
      season: 'Winter',
      guestCount: 200
    };

    it('should generate images successfully with API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          result: 'base64-image-data'
        })
      } as Response);

      const result = await service.generateWeddingImages(mockPreferences);
      
      expect(result.success).toBe(true);
      expect(result.images).toHaveLength(1);
      expect(result.analysis).toBeDefined();
      expect(result.analysis?.theme).toBe('royal-palace');
    });

    it('should handle API errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      } as Response);

      const result = await service.generateWeddingImages(mockPreferences);
      
      expect(result.success).toBe(true); // Should fallback to mock
      expect(result.images).toHaveLength(4); // Mock returns 4 images
    });

    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await service.generateWeddingImages(mockPreferences);
      
      expect(result.success).toBe(true); // Should fallback to mock
      expect(result.images).toHaveLength(4);
    });

    it('should work without API credentials', async () => {
      const serviceWithoutCreds = new CloudflareAIService();
      const result = await serviceWithoutCreds.generateWeddingImages(mockPreferences);
      
      expect(result.success).toBe(true);
      expect(result.images).toHaveLength(4);
      expect(result.analysis).toBeDefined();
    });
  });

  describe('Theme Analysis', () => {
    const mockPreferences = {
      theme: 'traditional',
      style: 'Traditional',
      colors: 'Gold, Red',
      season: 'Winter'
    };

    it('should analyze theme successfully with API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          result: {
            response: 'This is a beautiful traditional wedding with elegant decorations'
          }
        })
      } as Response);

      const result = await service.analyzeWeddingTheme(mockPreferences);
      
      expect(result.success).toBe(true);
      expect(result.analysis).toBeDefined();
      expect(result.analysis.theme).toBe('traditional');
    });

    it('should handle API errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401
      } as Response);

      const result = await service.analyzeWeddingTheme(mockPreferences);
      
      expect(result.success).toBe(true); // Should fallback to mock
      expect(result.analysis).toBeDefined();
    });

    it('should work without API credentials', async () => {
      const serviceWithoutCreds = new CloudflareAIService();
      const result = await serviceWithoutCreds.analyzeWeddingTheme(mockPreferences);
      
      expect(result.success).toBe(true);
      expect(result.analysis).toBeDefined();
      expect(result.analysis.keywords).toContain('wedding');
    });
  });

  describe('Error Handling', () => {
    it('should handle empty preferences gracefully', async () => {
      const result = await service.generateWeddingImages({});
      
      expect(result.success).toBe(true);
      expect(result.images).toHaveLength(4);
    });

    it('should handle null preferences gracefully', async () => {
      const result = await service.generateWeddingImages(null);
      
      expect(result.success).toBe(true);
      expect(result.images).toHaveLength(4);
    });

    it('should handle undefined preferences gracefully', async () => {
      const result = await service.generateWeddingImages(undefined);
      
      expect(result.success).toBe(true);
      expect(result.images).toHaveLength(4);
    });
  });

  describe('Mock Responses', () => {
    it('should return consistent mock image responses', async () => {
      const serviceWithoutCreds = new CloudflareAIService();
      const preferences = { theme: 'royal-palace' };
      
      const result1 = await serviceWithoutCreds.generateWeddingImages(preferences);
      const result2 = await serviceWithoutCreds.generateWeddingImages(preferences);
      
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result1.images).toHaveLength(4);
      expect(result2.images).toHaveLength(4);
    });

    it('should return consistent mock analysis responses', async () => {
      const serviceWithoutCreds = new CloudflareAIService();
      const preferences = { theme: 'traditional' };
      
      const result1 = await serviceWithoutCreds.analyzeWeddingTheme(preferences);
      const result2 = await serviceWithoutCreds.analyzeWeddingTheme(preferences);
      
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result1.analysis.keywords).toEqual(result2.analysis.keywords);
    });
  });
});
