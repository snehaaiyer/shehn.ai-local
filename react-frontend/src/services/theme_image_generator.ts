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
    // New Indian Wedding Themes
    'royal-palace-rajasthani': {
      name: 'Royal Palace/Rajasthani Theme',
      description: 'Majestic Rajasthani palace celebrations with royal grandeur, mirror work, and desert charm',
      images: [],
      prompt: 'A magnificent Rajasthani royal palace wedding ceremony with ornate mirror work decorations, red and gold color scheme, traditional Rajasthani architecture with carved pillars, royal mandap with marigold flowers, traditional Rajasthani musicians in colorful turbans, desert palace setting, intricate henna patterns, crystal chandeliers, professional photography quality, high resolution, capturing the royal grandeur of Rajasthan.',
      hasExistingImage: true,
      category: 'indian'
    },
    'traditional-regional-roots': {
      name: 'Traditional Regional Themes',
      description: 'Authentic celebrations reflecting specific cultural roots and regional traditions',
      images: [],
      prompt: 'A beautiful traditional Indian regional wedding ceremony showcasing diverse cultural roots, with authentic regional decorations, traditional costumes from different states, cultural symbols, regional musical instruments, traditional thali setup, colorful rangoli patterns, brass lamps, banana leaves, coconut decorations, regional architecture, warm lighting, professional photography quality, capturing the essence of Indian cultural diversity.',
      hasExistingImage: true,
      category: 'indian'
    },
    'eco-friendly-sustainable': {
      name: 'Eco-Friendly Sustainable Weddings',
      description: 'Green celebrations with sustainable practices, organic decorations, and eco-conscious choices',
      images: [],
      prompt: 'A stunning eco-friendly sustainable wedding setup with organic decorations, natural bamboo mandap, potted plants instead of cut flowers, biodegradable decorations, solar-powered lighting, recycled materials, natural fabric draping, wooden furniture, green foliage backdrop, organic food presentation, earthenware, natural color palette with greens and earth tones, outdoor garden setting, professional photography quality, showcasing environmental consciousness.',
      hasExistingImage: false,
      category: 'indian'
    },
    'bollywood-glamour': {
      name: 'Bollywood Glamour Theme',
      description: 'Vibrant Bollywood-inspired celebrations with glamour, dance, and cinematic grandeur',
      images: [],
      prompt: 'A vibrant Bollywood glamour themed wedding with cinematic grandeur, movie poster backdrops, golden and red color scheme, dramatic lighting with spotlights, large dance floor with disco balls, film reel decorations, star-shaped elements, sequined draping, vintage Bollywood movie posters, glamorous seating arrangement, champagne towers, red carpet entrance, professional photography quality, capturing the essence of Bollywood cinema and glamour.',
      hasExistingImage: true,
      category: 'indian'
    },
    'minimalist-modern': {
      name: 'Minimalist Modern Theme',
      description: 'Clean, contemporary celebrations with sophisticated simplicity and modern elegance',
      images: [],
      prompt: 'A sophisticated minimalist modern wedding setup with clean geometric lines, neutral color palette of whites, greys, and soft pastels, contemporary furniture, simple elegant mandap with minimal decorations, geometric floral arrangements, modern lighting fixtures, sleek table settings, glass elements, modern art installations, uncluttered space design, professional photography quality, capturing contemporary elegance and sophisticated simplicity.',
      hasExistingImage: true,
      category: 'indian'
    },
    'floral-paradise': {
      name: 'Floral Paradise Theme',
      description: 'Enchanting celebrations surrounded by abundant flowers, garden elements, and natural beauty',
      images: [],
      prompt: 'A breathtaking floral paradise wedding with abundant flower arrangements, floral archways, garden mandap covered in roses and jasmine, hanging flower installations, floral ceiling decorations, botanical elements, flower walls as backdrops, natural garden setting, pastel color palette with pinks, whites, and soft greens, butterfly and bird motifs, floral carpets, professional photography quality, capturing the essence of a blooming garden paradise.',
      hasExistingImage: false,
      category: 'indian'
    },
    'bohemian-chic': {
      name: 'Bohemian Chic Theme',
      description: 'Free-spirited celebrations with eclectic decor, artistic elements, and bohemian charm',
      images: [],
      prompt: 'A bohemian chic wedding setup with eclectic decorations, macrame hanging installations, vintage rugs and cushions, dreamcatchers, artistic mandap with flowing fabrics, mixed textures and patterns, vintage furniture pieces, feathers and beads, natural wood elements, warm earth tones with pops of jewel colors, outdoor garden setting with fairy lights, professional photography quality, capturing the free-spirited artistic bohemian lifestyle.',
      hasExistingImage: false,
      category: 'indian'
    },
    'vintage-classic': {
      name: 'Vintage Classic Theme',
      description: 'Timeless celebrations with classic elegance, antique elements, and nostalgic charm',
      images: [],
      prompt: 'A vintage classic wedding setup with antique furniture, vintage lace decorations, classic mandap with traditional Indian vintage elements, old-world charm, sepia-toned color palette, vintage Indian brass items, heritage photographs, classic floral arrangements in vintage vases, traditional Indian vintage jewelry displays, old Bollywood music setup, heritage textiles, professional photography quality, capturing timeless Indian elegance and nostalgic charm.',
      hasExistingImage: true,
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
    // New Indian Wedding Themes
    'royal-palace-rajasthani': '/images/themes/royal-palace.jpg',
    'traditional-regional-roots': '/images/themes/traditional-cultural.jpg',
    'eco-friendly-sustainable': '/images/themes/boho-garden.jpg',
    'bollywood-glamour': '/images/themes/bollywood-sangeet.jpg',
    'minimalist-modern': '/images/themes/minimalist-pastel.jpg',
    'floral-paradise': '/images/themes/boho-garden.jpg',
    'bohemian-chic': '/images/themes/boho-garden.jpg',
    'vintage-classic': '/images/themes/traditional-cultural.jpg'
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
      // New Indian Wedding Themes
      'royal-palace-rajasthani': 'Heritage Palaces',
      'traditional-regional-roots': 'Heritage Havelis',
      'eco-friendly-sustainable': 'Garden Venues',
      'bollywood-glamour': 'Banquet Halls',
      'minimalist-modern': 'Luxury Hotels',
      'floral-paradise': 'Garden Venues',
      'bohemian-chic': 'Farmhouse',
      'vintage-classic': 'Heritage Palaces'
    };
    
    return venueMapping[themeId] || 'Heritage Palaces';
  }

  private static getFallbackImages(themeId: string): string[] {
    // Fallback images for new Indian wedding themes
    const fallbackImages: { [key: string]: string[] } = {
      'royal-palace-rajasthani': [
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1024&h=1024&fit=crop',
        'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1024&h=1024&fit=crop'
      ],
      'traditional-regional-roots': [
        'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1024&h=1024&fit=crop',
        'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1024&h=1024&fit=crop'
      ],
      'eco-friendly-sustainable': [
        'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=1024&h=1024&fit=crop',
        'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1024&h=1024&fit=crop'
      ],
      'bollywood-glamour': [
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1024&h=1024&fit=crop',
        'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1024&h=1024&fit=crop&sat=50'
      ],
      'minimalist-modern': [
        'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1024&h=1024&fit=crop&sat=-50',
        'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=1024&h=1024&fit=crop&sat=-50'
      ],
      'floral-paradise': [
        'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1024&h=1024&fit=crop',
        'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=1024&h=1024&fit=crop'
      ],
      'bohemian-chic': [
        'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=1024&h=1024&fit=crop',
        'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1024&h=1024&fit=crop'
      ],
      'vintage-classic': [
        'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1024&h=1024&fit=crop&sat=-20',
        'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1024&h=1024&fit=crop&sat=-20'
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