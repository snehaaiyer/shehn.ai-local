import { LocalAIService } from './local_ai_service';
import { RunwayMLService } from './runwayml_service';

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
      name: 'Royal Palace/ Rajasthani Theme',
      description: 'Majestic Rajasthani palace celebrations with royal grandeur, mirror work, and desert charm',
      images: [],
      prompt: 'Cinematic wide shot of a magnificent Rajasthani royal palace Indian wedding ceremony. Traditional red sandstone architecture with intricate carved jharokhas and ornate mirror work. Golden mandap decorated with vibrant marigold garlands and roses. Bride in red lehenga with heavy gold jewelry, groom in cream sherwani with kalgi. Traditional Rajasthani musicians playing shehnai and tabla. Warm golden hour lighting, rich red and gold color palette, ultra-detailed, 4K quality, professional wedding photography style.',
      hasExistingImage: true,
      category: 'indian'
    },
    'traditional-regional-roots': {
      name: 'Traditional Regional Themes',
      description: 'Authentic celebrations reflecting specific cultural roots and regional traditions',
      images: [],
      prompt: 'Beautiful traditional South Indian temple wedding ceremony with authentic cultural elements. Ornate carved stone pillars and temple architecture. Bride in silk Kanjivaram saree with temple jewelry, groom in white dhoti and angavastram. Sacred fire ceremony with banana leaves, coconut decorations, and colorful rangoli patterns. Traditional nadaswaram music, brass oil lamps, jasmine garlands. Warm temple lighting, rich jewel tones, ultra-detailed Indian cultural authenticity, 4K cinematic quality.',
      hasExistingImage: true,
      category: 'indian'
    },
    'eco-friendly-sustainable': {
      name: 'Eco-Friendly Sustainable Weddings',
      description: 'Green celebrations with sustainable practices, organic decorations, and eco-conscious choices',
      images: [],
      prompt: 'Stunning eco-friendly Indian wedding in lush garden setting. Natural bamboo mandap with living plants and organic decorations. Couple in sustainable traditional wear - bride in handloom saree, groom in organic cotton kurta. Potted plants replacing cut flowers, solar string lights, biodegradable leaf plates. Natural wood furniture, jute decorations, earthen diyas. Green and earth tone color palette, soft natural lighting, 4K eco-conscious celebration, professional nature photography style.',
      hasExistingImage: false,
      category: 'indian'
    },
    'bollywood-glamour': {
      name: 'Bollywood Glamour Theme',
      description: 'Vibrant Bollywood-inspired celebrations with glamour, dance, and cinematic grandeur',
      images: [],
      prompt: 'Glamorous Bollywood-style Indian wedding reception with cinematic grandeur. Large dance floor with disco balls and dramatic spotlights. Vintage Bollywood movie posters and film reel decorations. Bride in heavily embellished lehenga with statement jewelry, groom in designer sherwani. Golden and red sequined draping, champagne towers, red carpet entrance. Professional dancers performing, live orchestra, vibrant party atmosphere. Rich golden lighting, 4K cinematic quality, Bollywood movie aesthetic.',
      hasExistingImage: true,
      category: 'indian'
    },
    'minimalist-modern': {
      name: 'Minimalist Modern Theme',
      description: 'Clean, contemporary celebrations with sophisticated simplicity and modern elegance',
      images: [],
      prompt: 'Sophisticated minimalist modern Indian wedding with contemporary elegance. Clean geometric mandap with simple white and gold decorations. Couple in modern traditional wear - bride in subtle pastel lehenga, groom in contemporary sherwani. Sleek furniture, geometric floral arrangements, modern lighting fixtures. Neutral color palette of whites, greys, and soft pastels. Uncluttered space design, glass elements, architectural lines. Soft professional lighting, 4K ultra-clean aesthetic, luxury hotel setting.',
      hasExistingImage: true,
      category: 'indian'
    },
    'floral-paradise': {
      name: 'Floral Paradise Theme',
      description: 'Enchanting celebrations surrounded by abundant flowers, garden elements, and natural beauty',
      images: [],
      prompt: 'Breathtaking floral paradise Indian wedding in blooming garden. Mandap completely covered in roses, jasmine, and marigolds. Massive floral archways and hanging flower installations. Bride in floral-themed lehenga with fresh flower jewelry, groom with floral sehra. Flower walls as backdrops, floral carpets, botanical ceiling decorations. Pastel color palette with pinks, whites, and soft greens. Natural garden setting with butterflies, 4K botanical paradise, dreamy romantic lighting, professional garden photography.',
      hasExistingImage: false,
      category: 'indian'
    },
    'bohemian-chic': {
      name: 'Bohemian Chic Theme',
      description: 'Free-spirited celebrations with eclectic decor, artistic elements, and bohemian charm',
      images: [],
      prompt: 'Bohemian chic Indian wedding with artistic eclectic decorations. Mandap with flowing fabrics, macrame hanging installations, vintage rugs and floor cushions. Bride in boho-style lehenga with oxidized jewelry, groom in artistic kurta. Dreamcatchers, feathers, mixed textures and patterns. Vintage furniture pieces, natural wood elements, fairy lights. Warm earth tones with jewel color pops, outdoor garden setting. 4K artistic bohemian aesthetic, free-spirited celebration, warm golden lighting.',
      hasExistingImage: false,
      category: 'indian'
    },
    'vintage-classic': {
      name: 'Vintage Classic Theme',
      description: 'Timeless celebrations with classic elegance, antique elements, and nostalgic charm',
      images: [],
      prompt: 'Vintage classic Indian wedding with timeless elegance and nostalgic charm. Heritage mandap with antique furniture and vintage lace decorations. Bride in classic heavy silk saree with traditional gold jewelry, groom in vintage-style achkan. Vintage Indian brass items, heritage photographs, classic floral arrangements in antique vases. Old Bollywood music setup, heritage textiles, sepia-toned lighting. Warm vintage color palette, 4K classic elegance, professional heritage photography style, old-world charm.',
      hasExistingImage: true,
      category: 'indian'
    },
    'classic-contemporary': {
      name: 'Classic Contemporary Theme',
      description: 'Modern elegance meets traditional charm with sophisticated contemporary design elements',
      images: [],
      prompt: 'Sophisticated classic contemporary Indian wedding with modern traditional fusion. Clean elegant mandap with contemporary design elements and classic Indian motifs. Bride in modern lehenga with contemporary styling, groom in designer Indo-western attire. Sophisticated lighting, contemporary furniture with traditional touches, modern floral arrangements. Neutral elegant color palette with gold accents, 4K sophisticated elegance, professional contemporary photography style.',
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
      hasExistingImage: true,
      category: 'indian'
    },
    'luxury-contemporary': {
      name: 'Luxury Contemporary',
      description: 'High-end modern celebrations with premium decor, sophisticated lighting, and urban elegance',
      images: [],
      prompt: 'Luxury contemporary Indian wedding with high-end modern design, premium decor, sophisticated lighting, and urban elegance. Premium materials, sophisticated lighting, contemporary luxury atmosphere.',
      hasExistingImage: true,
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
    // Each theme gets its own unique image - NO DUPLICATES
    'royal-palace-rajasthani': '/rajasthani royal.png',
    'traditional-regional-roots': '/traditional.png',
    'eco-friendly-sustainable': '/eco sustainable.png',
    'bollywood-glamour': '/bollywoodglamor.png',
    'minimalist-modern': '/minimalist pastel.png',
    'floral-paradise': '/floralparadise.png',
    'bohemian-chic': '/boho.png',
    'vintage-classic': '/vintage.png',
    'classic-contemporary': '/classic contemporary.png',
    'luxury-contemporary': '/luxury-contemporary.png',
    'contemporary-luxury': '/contemporary-luxury.png'
  };

  static async generateMissingThemeImages(): Promise<ThemeImageMapping> {
    console.log('🎨 Starting generation of missing theme images with RunwayML...');

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
          // Generate new image with RunwayML
          console.log(`🖼️ Generating new image for: ${themeData.name} (${themeData.category}) with RunwayML`);

          const runwayMLResponse = await RunwayMLService.generateThemeImage({
            prompt: themeData.prompt,
            width: 1024,
            height: 1024,
            guidance_scale: 8.0,
            num_inference_steps: 50
          });

          if (runwayMLResponse.success && runwayMLResponse.image) {
            updatedThemes[themeId].images = [runwayMLResponse.image];
            updatedThemes[themeId].hasExistingImage = false;
            console.log(`✅ Generated new image for ${themeData.name} with RunwayML`);
          } else {
            // Fallback to LocalAI if RunwayML fails
            console.log(`⚠️ RunwayML failed for ${themeData.name}, trying LocalAI fallback`);

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

            const localResponse = await LocalAIService.generateWeddingThemeImages(requestData);

            if (localResponse.success && localResponse.images) {
              updatedThemes[themeId].images = localResponse.images;
              updatedThemes[themeId].hasExistingImage = false;
              console.log(`✅ Generated fallback image for ${themeData.name}`);
            } else {
              console.log(`⚠️ All generation methods failed for ${themeData.name}, using static fallback`);
              updatedThemes[themeId].images = this.getFallbackImages(themeId);
              updatedThemes[themeId].hasExistingImage = false;
            }
          }

          // Add delay between requests to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 3000));
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
        'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1024&h=1024&fit=crop'
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