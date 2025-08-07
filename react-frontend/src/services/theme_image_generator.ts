import { LocalAIService } from './local_ai_service';

export interface ThemeImageMapping {
  [themeId: string]: {
    name: string;
    description: string;
    images: string[];
    prompt: string;
    hasExistingImage: boolean;
    category: 'original' | 'indian';
  };
}

export class ThemeImageGenerator {
  private static readonly THEME_PROMPTS: ThemeImageMapping = {
    // Heritage & Luxury Themes (High Engagement)
    'royal-palace-extravaganza': {
      name: 'Royal Palace Extravaganza',
      description: 'Majestic palace celebrations with royal grandeur and heritage charm',
      images: [],
      prompt: 'Royal palace extravaganza wedding with majestic architecture, grand halls, crystal chandeliers, and luxurious decorations. Majestic and opulent atmosphere with royal grandeur and heritage charm.',
      hasExistingImage: true,
      category: 'original'
    },
    'heritage-palace-wedding': {
      name: 'Heritage Palace Wedding',
      description: 'Elegant heritage palace celebrations with cultural authenticity',
      images: [],
      prompt: 'Heritage palace wedding with historical architecture, cultural decorations, traditional elements, and authentic Indian heritage. Elegant and culturally rich atmosphere with heritage charm.',
      hasExistingImage: false,
      category: 'indian'
    },
    'luxury-hotel-grandeur': {
      name: 'Luxury Hotel Grandeur',
      description: 'Five-star celebrations with modern amenities and world-class service',
      images: [],
      prompt: 'Luxury hotel grandeur wedding with modern amenities, elegant ballroom, crystal chandeliers, and sophisticated decorations. Contemporary and luxurious atmosphere with world-class service.',
      hasExistingImage: false,
      category: 'indian'
    },
    'heritage-haveli-celebration': {
      name: 'Heritage Haveli Celebration',
      description: 'Regional charm with cultural authenticity in traditional havelis',
      images: [],
      prompt: 'Heritage haveli celebration with regional architecture, cultural decorations, traditional elements, and local authenticity. Regional charm with cultural authenticity and traditional haveli setting.',
      hasExistingImage: false,
      category: 'indian'
    },
    
    // Destination & Nature Themes (High Engagement)
    'beach-destination-luxury': {
      name: 'Beach Destination Luxury',
      description: 'Luxurious beachside celebrations with ocean views and tropical charm',
      images: [],
      prompt: 'Beach destination luxury wedding with ocean views, palm trees, tropical decorations, and luxurious beachside setting. Relaxed and romantic atmosphere with tropical charm and luxury elements.',
      hasExistingImage: true,
      category: 'original'
    },
    'mountain-retreat-celebration': {
      name: 'Mountain Retreat Celebration',
      description: 'Scenic mountain celebrations with breathtaking views and peaceful atmosphere',
      images: [],
      prompt: 'Mountain retreat celebration wedding with breathtaking mountain views, natural beauty, and serene atmosphere. Peaceful and romantic setting with scenic mountain wedding elements.',
      hasExistingImage: false,
      category: 'indian'
    },
    'garden-palace-affair': {
      name: 'Garden Palace Affair',
      description: 'Natural elegance with outdoor charm in garden palace settings',
      images: [],
      prompt: 'Garden palace affair wedding with natural garden setting, outdoor beauty, floral decorations, and palace charm. Natural elegance with outdoor charm and garden palace atmosphere.',
      hasExistingImage: false,
      category: 'indian'
    },
    'lakefront-wedding': {
      name: 'Lakefront Wedding',
      description: 'Serene lakefront celebrations with water views and tranquil atmosphere',
      images: [],
      prompt: 'Lakefront wedding with serene water views, tranquil atmosphere, and waterfront setting. Peaceful and romantic atmosphere with lakefront wedding elements.',
      hasExistingImage: false,
      category: 'indian'
    },
    
    // Cultural & Traditional Themes (High Engagement)
    'traditional-hindu-grandeur': {
      name: 'Traditional Hindu Grandeur',
      description: 'Sacred ceremonies with Vedic rituals, mandap decorations, and traditional customs',
      images: [],
      prompt: 'Traditional Hindu grandeur wedding with sacred mandap, Vedic rituals, red and gold decorations, marigold flowers, and traditional customs. Sacred and spiritual atmosphere with cultural authenticity.',
      hasExistingImage: false,
      category: 'indian'
    },
    'sikh-anand-karaj': {
      name: 'Sikh Anand Karaj',
      description: 'Sacred Sikh wedding ceremonies with religious significance and cultural richness',
      images: [],
      prompt: 'Sikh Anand Karaj wedding with Gurudwara ceremony, religious rituals, traditional music, and community celebration. Sacred and spiritual atmosphere with Sikh cultural richness.',
      hasExistingImage: false,
      category: 'indian'
    },
    'muslim-nikah-ceremony': {
      name: 'Muslim Nikah Ceremony',
      description: 'Traditional Islamic wedding ceremonies with cultural diversity and traditional values',
      images: [],
      prompt: 'Muslim Nikah ceremony with Islamic traditions, cultural decorations, community gathering, and traditional values. Cultural diversity with Islamic wedding elements.',
      hasExistingImage: false,
      category: 'indian'
    },
    'south-indian-temple': {
      name: 'South Indian Temple Wedding',
      description: 'Traditional temple ceremonies with classical music and cultural authenticity',
      images: [],
      prompt: 'South Indian temple wedding with traditional temple architecture, classical music, cultural rituals, and authentic South Indian elements. Sacred and traditional atmosphere with cultural authenticity.',
      hasExistingImage: true,
      category: 'indian'
    },
    
    // Modern & Contemporary Themes (Medium-High Engagement)
    'modern-fusion-wedding': {
      name: 'Modern Fusion Wedding',
      description: 'Contemporary celebrations blending traditional and modern elements',
      images: [],
      prompt: 'Modern fusion wedding with contemporary decor, fusion cuisine, modern music, and cultural blend. Contemporary celebrations blending traditional and modern elements.',
      hasExistingImage: false,
      category: 'indian'
    },
    'bollywood-sangeet': {
      name: 'Bollywood Sangeet',
      description: 'Vibrant dance and music celebrations with Bollywood flair and entertainment',
      images: [],
      prompt: 'Bollywood sangeet celebration with vibrant colors, dance floor, live music, Bollywood songs, and colorful decorations. Energetic and fun atmosphere with Bollywood entertainment.',
      hasExistingImage: true,
      category: 'indian'
    },
    'contemporary-luxury': {
      name: 'Contemporary Luxury',
      description: 'Modern elegance with sophisticated style and contemporary luxury',
      images: [],
      prompt: 'Contemporary luxury wedding with modern design, luxury elements, sophisticated style, and contemporary elegance. Modern luxury with sophisticated contemporary atmosphere.',
      hasExistingImage: false,
      category: 'indian'
    },
    'urban-rooftop-wedding': {
      name: 'Urban Rooftop Wedding',
      description: 'City charm with modern convenience and urban sophistication',
      images: [],
      prompt: 'Urban rooftop wedding with city views, modern venue, urban setting, and contemporary style. City charm with modern convenience and urban sophistication.',
      hasExistingImage: false,
      category: 'indian'
    }
  };

  // Map of existing images that can be reused for themes
  private static readonly EXISTING_IMAGE_MAPPINGS: { [themeId: string]: string } = {
    // Heritage & Luxury Themes
    'royal-palace-extravaganza': '/images/themes/royal-palace.jpg',
    'heritage-palace-wedding': '/images/themes/traditional-cultural.jpg',
    'luxury-hotel-grandeur': '/images/themes/minimalist-pastel.jpg',
    'heritage-haveli-celebration': '/images/themes/traditional-cultural.jpg',
    
    // Destination & Nature Themes
    'beach-destination-luxury': '/images/themes/beach-destination.jpg',
    'mountain-retreat-celebration': '/images/themes/boho-garden.jpg',
    'garden-palace-affair': '/images/themes/boho-garden.jpg',
    'lakefront-wedding': '/images/themes/beach-destination.jpg',
    
    // Cultural & Traditional Themes
    'traditional-hindu-grandeur': '/images/themes/traditional-cultural.jpg',
    'sikh-anand-karaj': '/images/themes/traditional-cultural.jpg',
    'muslim-nikah-ceremony': '/images/themes/traditional-cultural.jpg',
    'south-indian-temple': '/images/themes/south-indian-temple.jpg',
    
    // Modern & Contemporary Themes
    'modern-fusion-wedding': '/images/themes/minimalist-pastel.jpg',
    'bollywood-sangeet': '/images/themes/bollywood-sangeet.jpg',
    'contemporary-luxury': '/images/themes/minimalist-pastel.jpg',
    'urban-rooftop-wedding': '/images/themes/minimalist-pastel.jpg'
  };

  static async generateMissingThemeImages(): Promise<ThemeImageMapping> {
    console.log('🎨 Starting generation of missing theme images...');
    
    const updatedThemes = { ...this.THEME_PROMPTS };
    
    for (const [themeId, themeData] of Object.entries(this.THEME_PROMPTS)) {
      try {
        // Check if theme already has an existing image
        const existingImage = this.EXISTING_IMAGE_MAPPINGS[themeId];
        
        if (existingImage) {
          // Use existing image
          updatedThemes[themeId].images = [existingImage];
          updatedThemes[themeId].hasExistingImage = true;
          console.log(`✅ ${themeData.name} (${themeData.category}): Using existing image - ${existingImage}`);
        } else {
          // Generate new image
          console.log(`🖼️ Generating new image for: ${themeData.name} (${themeData.category})`);
          
          const requestData = {
            theme: themeData.name,
            style: 'Traditional',
            colors: 'Red & Gold',
            season: 'Wedding Season',
            venueType: this.getVenueTypeForTheme(themeId),
            customDescription: themeData.prompt,
            guestCount: 200,
            location: 'India',
            imageCount: 1
          };

          const response = await LocalAIService.generateWeddingThemeImages(requestData);
          
          if (response.success && response.images) {
            updatedThemes[themeId].images = response.images;
            updatedThemes[themeId].hasExistingImage = false;
            console.log(`✅ Generated new image for ${themeData.name}`);
          } else {
            console.log(`⚠️ Failed to generate image for ${themeData.name}, using fallback`);
            updatedThemes[themeId].images = this.getFallbackImages(themeId);
            updatedThemes[themeId].hasExistingImage = false;
          }
          
          // Add delay between requests to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
      } catch (error) {
        console.error(`❌ Error processing ${themeData.name}:`, error);
        updatedThemes[themeId].images = this.getFallbackImages(themeId);
        updatedThemes[themeId].hasExistingImage = false;
      }
    }
    
    console.log('🎉 Theme image processing completed!');
    return updatedThemes;
  }

  static getExistingImageForTheme(themeId: string): string | null {
    return this.EXISTING_IMAGE_MAPPINGS[themeId] || null;
  }

  static hasExistingImage(themeId: string): boolean {
    return !!this.EXISTING_IMAGE_MAPPINGS[themeId];
  }

  static getThemesByCategory(category: 'original' | 'indian'): string[] {
    return Object.entries(this.THEME_PROMPTS)
      .filter(([themeId, themeData]) => themeData.category === category)
      .map(([themeId]) => themeId);
  }

  private static getVenueTypeForTheme(themeId: string): string {
    const venueMapping: { [key: string]: string } = {
      // Heritage & Luxury Themes
      'royal-palace-extravaganza': 'Heritage Palaces',
      'heritage-palace-wedding': 'Heritage Palaces',
      'luxury-hotel-grandeur': 'Luxury Hotels',
      'heritage-haveli-celebration': 'Heritage Havelis',
      
      // Destination & Nature Themes
      'beach-destination-luxury': 'Beach Resorts',
      'mountain-retreat-celebration': 'Mountain Resorts',
      'garden-palace-affair': 'Garden Venues',
      'lakefront-wedding': 'Lakefront Resorts',
      
      // Cultural & Traditional Themes
      'traditional-hindu-grandeur': 'Temple Complexes',
      'sikh-anand-karaj': 'Gurudwara Grounds',
      'muslim-nikah-ceremony': 'Community Halls',
      'south-indian-temple': 'Temple Complexes',
      
      // Modern & Contemporary Themes
      'modern-fusion-wedding': 'Luxury Hotels',
      'bollywood-sangeet': 'Banquet Halls',
      'contemporary-luxury': 'Luxury Hotels',
      'urban-rooftop-wedding': 'Rooftop Venues'
    };
    
    return venueMapping[themeId] || 'Heritage Palaces';
  }

  private static getFallbackImages(themeId: string): string[] {
    // Fallback images for simplified themes
    const fallbackImages: { [key: string]: string[] } = {
      'traditional-hindu': [
        'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1024&h=1024&fit=crop',
        'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1024&h=1024&fit=crop'
      ],
      'luxury-hotel': [
        'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1024&h=1024&fit=crop',
        'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1024&h=1024&fit=crop'
      ],
      'royal-palace': [
        'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1024&h=1024&fit=crop',
        'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1024&h=1024&fit=crop'
      ],
      'beach-destination': [
        'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=1024&h=1024&fit=crop',
        'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1024&h=1024&fit=crop&sat=-50'
      ],
      'farmhouse-wedding': [
        'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=1024&h=1024&fit=crop',
        'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1024&h=1024&fit=crop&sat=-50'
      ],
      'bollywood-sangeet': [
        'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=1024&h=1024&fit=crop',
        'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1024&h=1024&fit=crop&sat=-50'
      ]
    };
    
    return fallbackImages[themeId] || [
      'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1024&h=1024&fit=crop',
      'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1024&h=1024&fit=crop'
    ];
  }

  static getThemeImages(themeId: string): string[] {
    // First check for existing image
    const existingImage = this.getExistingImageForTheme(themeId);
    if (existingImage) {
      return [existingImage];
    }
    
    // Then check for generated images
    return this.THEME_PROMPTS[themeId]?.images || this.getFallbackImages(themeId);
  }

  static getAllThemes(): ThemeImageMapping {
    return this.THEME_PROMPTS;
  }

  static getThemesNeedingGeneration(): string[] {
    return Object.entries(this.THEME_PROMPTS)
      .filter(([themeId, themeData]) => !this.hasExistingImage(themeId))
      .map(([themeId]) => themeId);
  }

  static getThemesWithExistingImages(): string[] {
    return Object.entries(this.THEME_PROMPTS)
      .filter(([themeId]) => this.hasExistingImage(themeId))
      .map(([themeId]) => themeId);
  }
} 