import { CloudflareAIService } from './cloudflare_ai_service';

interface VenueImageRequest {
  venueType: string;
  venueName: string;
  name?: string; // Add name property for compatibility
  location: string;
  capacity: number;
  priceRange: string;
  amenities: string[];
  description: string;
}

interface VenueImageResponse {
  success: boolean;
  error?: string;
  images?: {
    mainImage: string;
    ceremonyImage: string;
    receptionImage: string;
  };
  descriptions?: {
    mainDescription: string;
    ceremonyDescription: string;
    receptionDescription: string;
  };
}

export class VenueImageGenerator {
  /**
   * Generate venue images using Cloudflare AI
   */
  static async generateVenueImages(venue: VenueImageRequest): Promise<VenueImageResponse> {
    try {
      console.log('Generating venue images for:', venue);

      // Generate main venue image
      const mainImagePrompt = this.generateMainVenuePrompt(venue);
      const mainImageResponse = await CloudflareAIService.generateWeddingThemeImages({
        theme: venue.venueType,
        style: 'Elegant',
        colors: this.getColorScheme(venue.venueType),
        season: 'Wedding Season',
        venueType: venue.venueType,
        customDescription: mainImagePrompt,
        guestCount: venue.capacity,
        location: venue.location,
        imageCount: 1
      });

      // Generate ceremony area image
      const ceremonyImagePrompt = this.generateCeremonyAreaPrompt(venue);
      const ceremonyImageResponse = await CloudflareAIService.generateWeddingThemeImages({
        theme: venue.venueType,
        style: 'Traditional',
        colors: this.getColorScheme(venue.venueType),
        season: 'Wedding Season',
        venueType: 'Ceremony Area',
        customDescription: ceremonyImagePrompt,
        guestCount: venue.capacity,
        location: venue.location,
        imageCount: 1
      });

      // Generate reception area image
      const receptionImagePrompt = this.generateReceptionAreaPrompt(venue);
      const receptionImageResponse = await CloudflareAIService.generateWeddingThemeImages({
        theme: venue.venueType,
        style: 'Modern',
        colors: this.getColorScheme(venue.venueType),
        season: 'Wedding Season',
        venueType: 'Reception Area',
        customDescription: receptionImagePrompt,
        guestCount: venue.capacity,
        location: venue.location,
        imageCount: 1
      });

      // Parse responses
      const mainImage = mainImageResponse.success && mainImageResponse.images && mainImageResponse.images.length > 0 
        ? mainImageResponse.images[0] : '';
      const ceremonyImage = ceremonyImageResponse.success && ceremonyImageResponse.images && ceremonyImageResponse.images.length > 0 
        ? ceremonyImageResponse.images[0] : '';
      const receptionImage = receptionImageResponse.success && receptionImageResponse.images && receptionImageResponse.images.length > 0 
        ? receptionImageResponse.images[0] : '';

      return {
        success: true,
        images: {
          mainImage,
          ceremonyImage,
          receptionImage
        },
        descriptions: {
          mainDescription: mainImageResponse.generatedDescription || `Beautiful ${venue.venueType} venue`,
          ceremonyDescription: ceremonyImageResponse.generatedDescription || `Elegant ceremony area at ${venue.venueName}`,
          receptionDescription: receptionImageResponse.generatedDescription || `Stunning reception space at ${venue.venueName}`
        }
      };

    } catch (error) {
      console.error('Error generating venue images:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Generate main venue image prompt
   */
  private static generateMainVenuePrompt(venue: VenueImageRequest): string {
    return `A stunning ${venue.venueType} wedding venue called "${venue.venueName}" in ${venue.location}. 
    Features: ${venue.amenities.join(', ')}. 
    Capacity: ${venue.capacity} guests. 
    Price Range: ${venue.priceRange}. 
    ${venue.description}
    
    The image should showcase the venue's main features, elegant architecture, and wedding-ready atmosphere. 
    Professional photography quality, high resolution, magazine-worthy composition with beautiful lighting and sophisticated decor.`;
  }

  /**
   * Generate ceremony area image prompt
   */
  private static generateCeremonyAreaPrompt(venue: VenueImageRequest): string {
    const ceremonyElements = this.getCeremonyElements(venue.venueType);
    
    return `A beautiful ceremony area at ${venue.venueName} ${venue.venueType} in ${venue.location}. 
    Features: ${ceremonyElements.join(', ')}. 
    Capacity: ${venue.capacity} guests for ceremony. 
    ${venue.description}
    
    The image should show the sacred ceremony space with elegant decorations, proper seating arrangement, 
    and romantic atmosphere. Professional photography quality, high resolution, capturing the spiritual 
    and emotional essence of wedding ceremonies.`;
  }

  /**
   * Generate reception area image prompt
   */
  private static generateReceptionAreaPrompt(venue: VenueImageRequest): string {
    const receptionElements = this.getReceptionElements(venue.venueType);
    
    return `A luxurious reception area at ${venue.venueName} ${venue.venueType} in ${venue.location}. 
    Features: ${receptionElements.join(', ')}. 
    Capacity: ${venue.capacity} guests for reception. 
    ${venue.description}
    
    The image should showcase the dining and celebration space with elegant table settings, 
    beautiful lighting, and sophisticated decor. Professional photography quality, high resolution, 
    capturing the celebration atmosphere and dining experience.`;
  }

  /**
   * Get color scheme based on venue type
   */
  private static getColorScheme(venueType: string): string {
    const colorSchemes = {
      'hotels': 'White and Gold',
      'palaces': 'Gold and Jewel Tones',
      'resorts': 'Natural and Earth Tones',
      'banquet': 'Red and Gold',
      'farmhouses': 'Rustic and Natural',
      'gardens': 'Green and Pastel',
      'beach': 'Blue and White'
    };

    return colorSchemes[venueType as keyof typeof colorSchemes] || 'White and Gold';
  }

  /**
   * Get ceremony elements based on venue type
   */
  private static getCeremonyElements(venueType: string): string[] {
    const elements = {
      'hotels': ['Elegant mandap', 'Crystal chandeliers', 'Luxury seating', 'Professional lighting'],
      'palaces': ['Royal mandap', 'Heritage architecture', 'Traditional decorations', 'Regal atmosphere'],
      'resorts': ['Garden mandap', 'Natural surroundings', 'Outdoor ceremony setup', 'Scenic views'],
      'banquet': ['Traditional mandap', 'Grand hall setup', 'Cultural decorations', 'Professional staging'],
      'farmhouses': ['Rustic mandap', 'Natural materials', 'Outdoor ceremony', 'Countryside charm'],
      'gardens': ['Garden mandap', 'Floral decorations', 'Natural lighting', 'Peaceful atmosphere'],
      'beach': ['Beach mandap', 'Ocean backdrop', 'Tropical decorations', 'Sunset lighting']
    };

    return elements[venueType as keyof typeof elements] || ['Elegant mandap', 'Traditional decorations', 'Professional setup'];
  }

  /**
   * Get reception elements based on venue type
   */
  private static getReceptionElements(venueType: string): string[] {
    const elements = {
      'hotels': ['Grand ballroom', 'Fine dining setup', 'Crystal glassware', 'Luxury service'],
      'palaces': ['Royal dining hall', 'Heritage interiors', 'Traditional service', 'Regal atmosphere'],
      'resorts': ['Garden dining', 'Al fresco setup', 'Natural ambiance', 'Resort amenities'],
      'banquet': ['Grand hall', 'Traditional dining', 'Cultural cuisine', 'Professional service'],
      'farmhouses': ['Rustic dining', 'Natural setting', 'Organic cuisine', 'Countryside charm'],
      'gardens': ['Garden dining', 'Floral centerpieces', 'Natural lighting', 'Peaceful atmosphere'],
      'beach': ['Beachside dining', 'Tropical setup', 'Seafood cuisine', 'Ocean views']
    };

    return elements[venueType as keyof typeof elements] || ['Elegant dining', 'Professional service', 'Beautiful setup'];
  }

  /**
   * Generate venue images for multiple venues
   */
  static async generateMultipleVenueImages(venues: VenueImageRequest[]): Promise<{
    [venueName: string]: VenueImageResponse;
  }> {
    const results: { [venueName: string]: VenueImageResponse } = {};

    for (const venue of venues) {
      try {
        const result = await this.generateVenueImages(venue);
        results[venue.venueName] = result;
        
        // Add delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`Error generating images for ${venue.venueName}:`, error);
        results[venue.venueName] = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }

    return results;
  }

  /**
   * Generate fallback venue images using predefined prompts
   */
  static generateFallbackVenueImages(venue: VenueImageRequest): VenueImageResponse {
    const fallbackImages = {
      'hotels': [
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400&h=300&fit=crop'
      ],
      'palaces': [
        'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400&h=300&fit=crop'
      ],
      'resorts': [
        'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400&h=300&fit=crop'
      ],
      'banquet': [
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400&h=300&fit=crop'
      ],
      'farmhouses': [
        'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop'
      ]
    };

    const images = fallbackImages[venue.venueType as keyof typeof fallbackImages] || fallbackImages.hotels;

    return {
      success: true,
      images: {
        mainImage: images[0],
        ceremonyImage: images[1],
        receptionImage: images[2]
      },
      descriptions: {
        mainDescription: `Beautiful ${venue.venueType} venue - ${venue.venueName}`,
        ceremonyDescription: `Elegant ceremony area at ${venue.venueName}`,
        receptionDescription: `Stunning reception space at ${venue.venueName}`
      }
    };
  }
} 