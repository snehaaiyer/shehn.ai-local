import React, { useState, useEffect } from 'react';
import { Heart, Palette, Building2, Camera, Utensils, Sparkles, Users, FileText } from "lucide-react";
import WeddingBlueprint from "../components/WeddingBlueprint";

// Removed Cloudflare AI service

interface Priority {
  id: string;
  name: string;
  description: string;
}

interface WeddingPreferencesData {
  basicDetails: {
    guestCount: number;
    weddingDate: string;
    location: string;
    budgetRange: string;
    yourName: string;
    partnerName: string;
    contactNumber: string;
    priorities: Priority[];
    datesFlexible: boolean;
    eventDuration: string;
  };
  theme: {
    selectedTheme: string;
    generatedImages: string[];
    isGeneratingImages: boolean;
  };
  venue: {
    selectedVenue: string;
    venueType: string;
    capacity: number;
  };
  catering: {
    cuisine: string;
    mealType: string;
    dietaryRestrictions: string[];
  };
  photography: {
    style: string;
    coverage: string;
    specialRequests: string;
    // Enhanced photography preferences
    multiDayCoverage: {
      preWeddingShoot: boolean;
      engagementShoot: boolean;
      mehendiCeremony: boolean;
      haldiCeremony: boolean;
      sangeetCeremony: boolean;
      weddingCeremony: boolean;
      reception: boolean;
      postWeddingShoot: boolean;
    };
    videography: {
      required: boolean;
      style: string;
      droneCoverage: boolean;
      coverageDuration: string;
    };
    culturalCoverage: {
      mandapCeremony: boolean;
      agniCeremony: boolean;
      familyPortraits: boolean;
      traditionalAttire: boolean;
      culturalPerformances: boolean;
      specificRituals: string[];
    };
    deliverables: {
      digitalGallery: boolean;
      physicalAlbum: boolean;
      videoHighlights: boolean;
      fullVideo: boolean;
      prints: boolean;
      socialMediaSharing: boolean;
    };
    technicalPreferences: {
      equipmentType: string;
      lightingStyle: string;
      backupPhotographer: boolean;
      editingStyle: string;
    };
    budgetRange: string;
  };
}

const WeddingPreferences: React.FC = () => {
  const [showBlueprint, setShowBlueprint] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');


  const [preferences, setPreferences] = useState<WeddingPreferencesData>({
    basicDetails: {
      guestCount: 100,
      weddingDate: '',
      location: '',
      budgetRange: '',
      yourName: '',
      partnerName: '',
      contactNumber: '',
      priorities: [
        { id: 'venue', name: '🏛️ Perfect Venue', description: 'Finding the ideal location for your celebration' },
        { id: 'photography', name: '📸 Photography & Videography', description: 'Capturing every precious moment' },
        { id: 'catering', name: '🍽️ Food & Catering', description: 'Delicious cuisine for your guests' },
        { id: 'decor', name: '🎨 Decor & Theme', description: 'Beautiful decorations and ambiance' },
        { id: 'entertainment', name: '🎵 Music & Entertainment', description: 'DJ, band, and entertainment for guests' },
        { id: 'outfits', name: '👗 Wedding Outfits', description: 'Perfect attire for the couple' },
        { id: 'flowers', name: '🌸 Floral Arrangements', description: 'Beautiful flowers and bouquets' },
        { id: 'transportation', name: '🚗 Transportation', description: 'Getting to and from the venue' }
      ],
      datesFlexible: false,
      eventDuration: ''
    },
    theme: {
      selectedTheme: '',
      generatedImages: [],
      isGeneratingImages: false
    },
    venue: {
      selectedVenue: '',
      venueType: '',
      capacity: 100
    },
    catering: {
      cuisine: '',
      mealType: '',
      dietaryRestrictions: []
    },
    photography: {
      style: '',
      coverage: '',
      specialRequests: '',
      // Enhanced photography preferences
      multiDayCoverage: {
        preWeddingShoot: false,
        engagementShoot: false,
        mehendiCeremony: false,
        haldiCeremony: false,
        sangeetCeremony: false,
        weddingCeremony: true,
        reception: true,
        postWeddingShoot: false
      },
      videography: {
        required: false,
        style: '',
        droneCoverage: false,
        coverageDuration: ''
      },
      culturalCoverage: {
        mandapCeremony: true,
        agniCeremony: true,
        familyPortraits: true,
        traditionalAttire: true,
        culturalPerformances: false,
        specificRituals: []
      },
      deliverables: {
        digitalGallery: true,
        physicalAlbum: false,
        videoHighlights: false,
        fullVideo: false,
        prints: false,
        socialMediaSharing: true
      },
      technicalPreferences: {
        equipmentType: '',
        lightingStyle: '',
        backupPhotographer: false,
        editingStyle: ''
      },
      budgetRange: ''
    }
  });

  // Wedding Theme Categories for better organization
  const themeCategories = [
    {
      id: 'royal-traditional',
      name: '👑 Royal & Traditional',
      description: 'Majestic heritage celebrations with royal grandeur and cultural authenticity',
      themes: [
        { 
          id: 'royal-palace-rajasthani', 
          name: 'Royal Palace Rajasthani', 
          description: 'Majestic Rajasthani palace celebrations with royal grandeur, mirror work, and desert charm', 
          color: '#B91C1C',
          image: '/rajasthani royal.png',
          features: ['Heritage Palaces', 'Royal Rajasthani Decor', 'Mirror Work', 'Traditional Music'],
          imagePrompt: 'Cinematic wide shot of a magnificent Rajasthani royal palace Indian wedding ceremony. Traditional red sandstone architecture with intricate carved jharokhas and ornate mirror work. Golden mandap decorated with vibrant marigold garlands and roses. Bride in red lehenga with heavy gold jewelry, groom in cream sherwani with kalgi. Traditional Rajasthani musicians playing shehnai and tabla. Warm golden hour lighting, rich red and gold color palette, ultra-detailed, 4K quality, professional wedding photography style.'
        },
        { 
          id: 'traditional-regional-roots', 
          name: 'Traditional Regional Heritage', 
          description: 'Authentic celebrations reflecting specific cultural roots and regional traditions', 
          color: '#DC2626',
          image: '/traditional.png',
          features: ['Regional Customs', 'Cultural Authenticity', 'Local Traditions', 'Heritage Elements'],
          imagePrompt: 'Beautiful traditional South Indian temple wedding ceremony with authentic cultural elements. Ornate carved stone pillars and temple architecture. Bride in silk Kanjivaram saree with temple jewelry, groom in white dhoti and angavastram. Sacred fire ceremony with banana leaves, coconut decorations, and colorful rangoli patterns. Traditional nadaswaram music, brass oil lamps, jasmine garlands. Warm temple lighting, rich jewel tones, ultra-detailed Indian cultural authenticity, 4K cinematic quality.'
        },
        { 
          id: 'vintage-classic', 
          name: 'Vintage Classic Heritage', 
          description: 'Timeless celebrations with classic elegance, antique elements, and nostalgic charm', 
          color: '#92400E',
          image: '/vintage.png',
          features: ['Antique Elements', 'Classic Elegance', 'Vintage Furniture', 'Nostalgic Charm'],
          imagePrompt: 'Vintage classic Indian wedding with timeless elegance and nostalgic charm. Heritage mandap with antique furniture and vintage lace decorations. Bride in classic heavy silk saree with traditional gold jewelry, groom in vintage-style achkan. Vintage Indian brass items, heritage photographs, classic floral arrangements in antique vases. Old Bollywood music setup, heritage textiles, sepia-toned lighting. Warm vintage color palette, 4K classic elegance, professional heritage photography style, old-world charm.'
        }
      ]
    },
    {
      id: 'modern-glamour',
      name: '🎬 Modern & Glamour',
      description: 'Contemporary celebrations with cinematic flair, modern elegance, and sophisticated style',
      themes: [
        { 
          id: 'bollywood-glamour', 
          name: 'Bollywood Glamour', 
          description: 'Vibrant Bollywood-inspired celebrations with glamour, dance, and cinematic grandeur', 
          color: '#F59E0B',
          image: '/bollywoodglamor.png',
          features: ['Cinematic Setup', 'Glamorous Decor', 'Dance Floor', 'Vibrant Colors'],
          imagePrompt: 'Glamorous Bollywood-style Indian wedding reception with cinematic grandeur. Large dance floor with disco balls and dramatic spotlights. Vintage Bollywood movie posters and film reel decorations. Bride in heavily embellished lehenga with statement jewelry, groom in designer sherwani. Golden and red sequined draping, champagne towers, red carpet entrance. Professional dancers performing, live orchestra, vibrant party atmosphere. Rich golden lighting, 4K cinematic quality, Bollywood movie aesthetic.'
        },
        { 
          id: 'minimalist-modern', 
          name: 'Minimalist Modern', 
          description: 'Clean, contemporary celebrations with sophisticated simplicity and modern elegance', 
          color: '#64748B',
          image: '/minimalist pastel.png',
          features: ['Clean Lines', 'Modern Furniture', 'Neutral Colors', 'Sophisticated Simplicity'],
          imagePrompt: 'Sophisticated minimalist modern Indian wedding with contemporary elegance. Clean geometric mandap with simple white and gold decorations. Couple in modern traditional wear - bride in subtle pastel lehenga, groom in contemporary sherwani. Sleek furniture, geometric floral arrangements, modern lighting fixtures. Neutral color palette of whites, greys, and soft pastels. Uncluttered space design, glass elements, architectural lines. Soft professional lighting, 4K ultra-clean aesthetic, luxury hotel setting.'
        },
        { 
          id: 'luxury-contemporary', 
          name: 'Luxury Contemporary', 
          description: 'High-end modern celebrations with premium decor, sophisticated lighting, and urban elegance', 
          color: '#1F2937',
          image: '/classic contemporary.png',
          features: ['Premium Materials', 'Sophisticated Lighting', 'Urban Elegance', 'High-End Decor'],
          imagePrompt: 'Luxury contemporary Indian wedding in upscale urban venue. Premium materials like marble and crystal, sophisticated LED lighting systems, sleek modern mandap with metallic accents. Bride in designer contemporary lehenga, groom in luxury modern sherwani. High-end floral arrangements, premium table settings, urban city views. Sophisticated color palette of blacks, whites, and metallics. Professional lighting, 4K luxury aesthetic, five-star hotel setting.'
        }
      ]
    },
    {
      id: 'nature-garden',
      name: '🌿 Nature & Garden',
      description: 'Natural celebrations with eco-conscious elements, garden beauty, and organic charm',
      themes: [
        { 
          id: 'eco-friendly-sustainable', 
          name: 'Eco-Friendly Sustainable', 
          description: 'Green celebrations with sustainable practices, organic decorations, and eco-conscious choices', 
          color: '#16A34A',
          image: '/eco sustainable.png',
          features: ['Organic Decorations', 'Sustainable Practices', 'Natural Elements', 'Eco-Conscious'],
          imagePrompt: 'Stunning eco-friendly Indian wedding in lush garden setting. Natural bamboo mandap with living plants and organic decorations. Couple in sustainable traditional wear - bride in handloom saree, groom in organic cotton kurta. Potted plants replacing cut flowers, solar string lights, biodegradable leaf plates. Natural wood furniture, jute decorations, earthen diyas. Green and earth tone color palette, soft natural lighting, 4K eco-conscious celebration, professional nature photography style.'
        },
        { 
          id: 'floral-paradise', 
          name: 'Floral Paradise Garden', 
          description: 'Enchanting celebrations surrounded by abundant flowers, garden elements, and natural beauty', 
          color: '#EC4899',
          image: '/floralparadise.png',
          features: ['Abundant Flowers', 'Garden Elements', 'Floral Arches', 'Natural Beauty'],
          imagePrompt: 'Breathtaking floral paradise Indian wedding in blooming garden. Mandap completely covered in roses, jasmine, and marigolds. Massive floral archways and hanging flower installations. Bride in floral-themed lehenga with fresh flower jewelry, groom with floral sehra. Flower walls as backdrops, floral carpets, botanical ceiling decorations. Pastel color palette with pinks, whites, and soft greens. Natural garden setting with butterflies, 4K botanical paradise, dreamy romantic lighting, professional garden photography.'
        },
        { 
          id: 'bohemian-chic', 
          name: 'Bohemian Garden Chic', 
          description: 'Free-spirited garden celebrations with eclectic decor, artistic elements, and bohemian charm', 
          color: '#7C3AED',
          image: '/boho.png',
          features: ['Eclectic Decor', 'Artistic Elements', 'Garden Setting', 'Free-Spirited Vibe'],
          imagePrompt: 'Bohemian chic Indian wedding with artistic eclectic decorations in garden setting. Mandap with flowing fabrics, macrame hanging installations, vintage rugs and floor cushions. Bride in boho-style lehenga with oxidized jewelry, groom in artistic kurta. Dreamcatchers, feathers, mixed textures and patterns. Vintage furniture pieces, natural wood elements, fairy lights. Warm earth tones with jewel color pops, outdoor garden setting. 4K artistic bohemian aesthetic, free-spirited celebration, warm golden lighting.'
        }
      ]
    }
  ];

  // Create a flat themes array for compatibility with existing code
  const themes = themeCategories.flatMap(category => category.themes);

  // Venue Categories for better organization
  const venueCategories = [
    {
      id: 'heritage-luxury',
      name: '🏛️ Heritage & Luxury',
      description: 'Royal palaces, heritage venues, and luxury hotels',
      venues: [
        {
          id: 'heritage-palaces',
          name: 'Heritage Palaces',
          description: 'Royal and heritage venues with historical significance and grandeur',
          capacity: '100-800 guests',
          features: ['Historical Architecture', 'Royal Ambiance', 'Traditional Cuisine', 'Cultural Experience'],
          image: '/images/venues/heritage palace.png',
          prompt: 'A majestic heritage palace wedding venue with grand Mughal architecture, intricately carved marble walls, royal courtyards with fountains, ornate chandeliers, traditional Indian wedding mandap setup, elegant arches with floral decorations, and historical grandeur perfect for royal celebrations'
        },
        { 
          id: 'luxury-hotels', 
          name: 'Luxury Hotels', 
          description: 'Five-star hotel venues with world-class amenities and professional service',
          capacity: '200-1000 guests',
          features: ['Premium Service', 'Luxury Accommodations', 'International Cuisine', 'Professional Staff'],
          image: '/images/venues/luxury hotel.png',
          prompt: 'A luxurious five-star Indian hotel wedding venue with grand ballrooms, crystal chandeliers, sophisticated modern decor, premium white and gold color scheme, beautifully set tables with fine china, traditional Indian wedding mandap setup, and world-class amenities perfect for grand Indian celebrations'
        },
        { 
          id: 'heritage-havelis', 
          name: 'Heritage Havelis', 
          description: 'Regional heritage venues with cultural authenticity and traditional charm',
          capacity: '50-400 guests',
          features: ['Regional Architecture', 'Cultural Ambiance', 'Traditional Cuisine', 'Local Experience'],
          image: '/images/venues/heritagehaveli.png',
          prompt: 'A beautiful heritage haveli wedding venue with traditional Rajasthani architecture, ornate courtyards with jharokhas, colorful frescoes depicting Indian mythology, traditional wedding mandap setup with marigold decorations, and cultural authenticity perfect for traditional Indian weddings'
        },
        { 
          id: 'royal-forts', 
          name: 'Royal Forts', 
          description: 'Historical fort venues with royal grandeur and unique experience',
          capacity: '100-600 guests',
          features: ['Historical Fort', 'Royal Setting', 'Traditional Cuisine', 'Unique Experience'],
          image: '/images/venues/royal fort.png',
          prompt: 'A magnificent royal Indian fort wedding venue with ancient stone walls, grand courtyards, historical architecture, traditional Indian wedding mandap setup with ethnic decorations, royal grandeur, and breathtaking views perfect for royal Indian celebrations'
        }
      ]
    },
    {
      id: 'destination-nature',
      name: '🌴 Destination & Nature',
      description: 'Beach resorts, mountain venues, and natural settings',
      venues: [
        { 
          id: 'beach-resorts', 
          name: 'Beach Resorts', 
          description: 'Beachside celebrations with ocean views and tropical charm',
          capacity: '50-300 guests',
          features: ['Ocean Views', 'Beach Access', 'Seafood Menu', 'Sunset Ceremonies'],
          image: '/images/venues/beachresort.png',
          prompt: 'A stunning Indian beach resort wedding venue with pristine sandy beaches, Arabian Sea or Indian Ocean views, tropical palm trees, beachside wedding mandap setup, sunset ceremony area, and coastal elegance perfect for destination Indian weddings'
        },
        { 
          id: 'mountain-resorts', 
          name: 'Mountain Resorts', 
          description: 'Scenic mountain venues with breathtaking views and peaceful atmosphere',
          capacity: '30-200 guests',
          features: ['Mountain Views', 'Natural Setting', 'Adventure Activities', 'Peaceful Atmosphere'],
          image: '/images/venues/mountain.png',
          prompt: 'A breathtaking Indian mountain resort wedding venue with panoramic Himalayan or Western Ghats views, natural stone architecture, outdoor wedding mandap setup, pine trees, and peaceful mountain atmosphere perfect for intimate Indian weddings'
        },
        { 
          id: 'garden-venues', 
          name: 'Garden Venues', 
          description: 'Natural garden venues with outdoor beauty and floral charm',
          capacity: '50-300 guests',
          features: ['Garden Setting', 'Natural Beauty', 'Outdoor Space', 'Floral Decor'],
          image: '/images/venues/garden.png',
          prompt: 'A beautiful Indian garden wedding venue with lush greenery, colorful Indian flowers like marigolds and roses, outdoor wedding mandap setup, natural beauty, garden pathways, and traditional floral decorations perfect for romantic Indian weddings'
        },
        { 
          id: 'lakefront-resorts', 
          name: 'Lakefront Resorts', 
          description: 'Serene lakefront venues with water views and tranquil atmosphere',
          capacity: '50-250 guests',
          features: ['Lake Views', 'Waterfront Setting', 'Boat Ceremonies', 'Tranquil Atmosphere'],
          image: '/images/venues/lakeresort.png',
          prompt: 'A serene Indian lakefront resort wedding venue with calm lake waters, waterfront wedding mandap setup, natural beauty, tranquil atmosphere, and peaceful surroundings perfect for intimate Indian wedding celebrations'
        }
      ]
    },
    {
      id: 'traditional-cultural',
      name: '🏮 Traditional & Cultural',
      description: 'Temples, community halls, and cultural venues',
      venues: [
        { 
          id: 'banquet-halls', 
          name: 'Banquet Halls', 
          description: 'Traditional banquet halls with modern facilities and large capacity',
          capacity: '100-800 guests',
          features: ['Large Capacity', 'Modern Facilities', 'Traditional Cuisine', 'Convenient Location'],
          image: '/images/venues/banquet.png',
          prompt: 'A modern Indian banquet hall wedding venue with spacious interiors, elegant decor, professional lighting, large capacity setup, traditional Indian wedding mandap, and contemporary amenities perfect for grand Indian wedding celebrations'
        },
        { 
          id: 'temple-complexes', 
          name: 'Temple Complexes', 
          description: 'Sacred temple venues for traditional ceremonies and spiritual experience',
          capacity: '50-300 guests',
          features: ['Sacred Atmosphere', 'Traditional Rituals', 'Spiritual Experience', 'Cultural Heritage'],
          image: '/images/venues/temple.png',
          prompt: 'A sacred Indian temple complex wedding venue with traditional temple architecture, spiritual atmosphere, cultural heritage, traditional Indian wedding rituals, religious significance, and divine blessings perfect for spiritual Indian weddings'
        },
        { 
          id: 'community-halls', 
          name: 'Community Halls', 
          description: 'Traditional community venues with local support and cultural authenticity',
          capacity: '100-500 guests',
          features: ['Community Support', 'Traditional Setting', 'Local Cuisine', 'Cultural Authenticity'],
          image: '/images/venues/communityhall.png',
          prompt: 'A traditional Indian community hall wedding venue with local cultural elements, community support, traditional setting, authentic local experience, and traditional Indian wedding mandap setup perfect for community celebrations'
        },
        { 
          id: 'gurudwara-grounds', 
          name: 'Gurudwara Grounds', 
          description: 'Religious Sikh venues with spiritual significance and community celebration',
          capacity: '100-400 guests',
          features: ['Religious Significance', 'Community Celebration', 'Traditional Music', 'Spiritual Experience'],
          image: '/images/venues/gurudwara.png',
          prompt: 'A spiritual Indian Gurudwara wedding venue with religious significance, community celebration, traditional Sikh Anand Karaj wedding setup, spiritual atmosphere, and divine blessings perfect for Sikh Indian weddings'
        }
      ]
    },
    {
      id: 'modern-urban',
      name: '🏙️ Modern & Urban',
      description: 'Rooftop venues, farmhouses, and contemporary spaces',
      venues: [
        { 
          id: 'rooftop-venues', 
          name: 'Rooftop Venues', 
          description: 'Modern rooftop venues with city views and contemporary atmosphere',
          capacity: '50-200 guests',
          features: ['City Views', 'Modern Setting', 'Contemporary Style', 'Urban Atmosphere'],
          image: '/images/venues/rooftop.png',
          prompt: 'A modern Indian rooftop wedding venue with stunning city skyline views of Mumbai, Delhi, or Bangalore, contemporary urban atmosphere, modern decor, sophisticated rooftop setting, and traditional Indian wedding mandap perfect for modern Indian celebrations'
        },
        { 
          id: 'farmhouses', 
          name: 'Farmhouses', 
          description: 'Rustic farmhouse venues with natural charm and outdoor space',
          capacity: '50-300 guests',
          features: ['Rustic Charm', 'Natural Setting', 'Outdoor Space', 'Countryside Views'],
          image: '/images/venues/farmhouse.png',
          prompt: 'A charming Indian farmhouse wedding venue with rustic wooden beams, natural greenery, outdoor wedding mandap setup, countryside views of Indian villages, and natural charm perfect for rustic Indian wedding celebrations'
        },
        { 
          id: 'luxury-villas', 
          name: 'Luxury Villas', 
          description: 'Exclusive villa venues with privacy and luxury amenities',
          capacity: '30-150 guests',
          features: ['Privacy', 'Luxury Amenities', 'Exclusive Setting', 'Personalized Service'],
          image: '/images/venues/luxuryvilla.png',
          prompt: 'An exclusive Indian luxury villa wedding venue with private setting, high-end amenities, sophisticated decor, personalized service, intimate atmosphere, and traditional Indian wedding mandap setup perfect for luxury Indian celebrations'
        },
        { 
          id: 'industrial-venues', 
          name: 'Industrial Venues', 
          description: 'Modern industrial venues with unique character and contemporary style',
          capacity: '100-400 guests',
          features: ['Industrial Charm', 'Modern Design', 'Unique Character', 'Contemporary Style'],
          image: '/images/venues/industrial.png',
          prompt: 'A modern Indian industrial wedding venue with exposed brick walls, high ceilings, contemporary design, unique industrial character, modern urban style, and traditional Indian wedding mandap setup perfect for contemporary Indian celebrations'
        }
      ]
    }
  ];

  // Tab configuration
  const tabs = [
    {
      id: 'basic',
      name: 'Basic Details',
      icon: Users,
      description: 'Wedding information and couple details'
    },
    {
      id: 'venue',
      name: 'Venue',
      icon: Building2,
      description: 'Venue type and location preferences'
    },
    {
      id: 'theme',
      name: 'Decor & Theme',
      icon: Palette,
      description: 'Wedding theme and decoration style'
    },
    {
      id: 'catering',
      name: 'Catering',
      icon: Utensils,
      description: 'Cuisine and dietary preferences'
    },
    {
      id: 'photography',
      name: 'Photography',
      icon: Camera,
      description: 'Photography, videography, and cultural coverage'
    },
    {
      id: 'blueprint',
      name: 'Wedding Blueprint',
      icon: FileText,
      description: 'AI-generated wedding blueprint',
      disabled: !(preferences.venue.venueType && preferences.theme.selectedTheme)
    }
  ];

  // Budget Ranges
  const budgetRanges = [
    { id: 'budget', name: 'Budget Friendly', description: 'Under 5 Lakhs' },
    { id: 'mid', name: 'Mid Range', description: '5-15 Lakhs' },
    { id: 'luxury', name: 'Luxury', description: '15-50 Lakhs' },
    { id: 'ultra', name: 'Ultra Luxury', description: '50+ Lakhs' }
  ];

  useEffect(() => {
    const loadDefaultPreferences = () => {
      try {
        const savedPreferences = localStorage.getItem('weddingPreferences');
        if (savedPreferences) {
          const preferences = JSON.parse(savedPreferences);
          console.log('📋 Loading saved preferences:', preferences);

          // Set basic details
          if (preferences.basicDetails) {
            Object.keys(preferences.basicDetails).forEach(key => {
              if (preferences.basicDetails[key] !== undefined) {
                updatePreference('basicDetails', key, preferences.basicDetails[key]);
              }
            });
          }

          // Set other sections
          if (preferences.theme) {
            Object.keys(preferences.theme).forEach(key => {
              if (preferences.theme[key] !== undefined) {
                updatePreference('theme', key, preferences.theme[key]);
              }
            });
          }

          if (preferences.venue) {
            Object.keys(preferences.venue).forEach(key => {
              if (preferences.venue[key] !== undefined) {
                updatePreference('venue', key, preferences.venue[key]);
              }
            });
          }

          if (preferences.catering) {
            Object.keys(preferences.catering).forEach(key => {
              if (preferences.catering[key] !== undefined) {
                updatePreference('catering', key, preferences.catering[key]);
              }
            });
          }

          // Load photography preferences with all nested objects
          if (preferences.photography) {
            const photoPrefs = preferences.photography;

            // Basic photography fields
            ['style', 'coverage', 'specialRequests', 'budgetRange'].forEach(key => {
              if (photoPrefs[key] !== undefined) {
                updatePreference('photography', key, photoPrefs[key]);
              }
            });

            // Nested objects
            if (photoPrefs.multiDayCoverage) {
              Object.keys(photoPrefs.multiDayCoverage).forEach(key => {
                updatePreference('photography', 'multiDayCoverage', photoPrefs.multiDayCoverage[key], key);
              });
            }

            if (photoPrefs.videography) {
              Object.keys(photoPrefs.videography).forEach(key => {
                updatePreference('photography', 'videography', photoPrefs.videography[key], key);
              });
            }

            if (photoPrefs.culturalCoverage) {
              Object.keys(photoPrefs.culturalCoverage).forEach(key => {
                updatePreference('photography', 'culturalCoverage', photoPrefs.culturalCoverage[key], key);
              });
            }

            if (photoPrefs.deliverables) {
              Object.keys(photoPrefs.deliverables).forEach(key => {
                updatePreference('photography', 'deliverables', photoPrefs.deliverables[key], key);
              });
            }

            if (photoPrefs.technicalPreferences) {
              Object.keys(photoPrefs.technicalPreferences).forEach(key => {
                updatePreference('photography', 'technicalPreferences', photoPrefs.technicalPreferences[key], key);
              });
            }
          }

          console.log('✅ Successfully loaded preferences');
        } else {
          console.log('📝 No saved preferences found, using defaults');
        }
      } catch (error) {
        console.error('❌ Error loading preferences:', error);
        // Continue with default values
      }
    };

    loadDefaultPreferences();
  }, []);

  // Drag and Drop State
  const [draggedPriority, setDraggedPriority] = useState<Priority | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number>(-1);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, priority: Priority, index: number) => {
    setDraggedPriority(priority);
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.style.opacity = '0.5';
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.style.opacity = '1';
    setDraggedPriority(null);
    setDraggedIndex(-1);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
    e.preventDefault();

    if (draggedIndex === -1 || draggedIndex === dropIndex) return;

    const newPriorities = [...preferences.basicDetails.priorities];
    const draggedItem = newPriorities[draggedIndex];

    // Remove the dragged item
    newPriorities.splice(draggedIndex, 1);

    // Insert at new position
    newPriorities.splice(dropIndex, 0, draggedItem);

    updatePreference('basicDetails', 'priorities', newPriorities);
  };

  const updatePreference = (section: keyof WeddingPreferencesData, key: string, value: any, subKey?: string) => {
    setPreferences(prev => {
      // Handle deeply nested updates carefully
      let updatedSection = { ...prev[section] as any };

      if (subKey) {
        // Check if the key and subKey path exists, create if not
        const keys = key.split('.');
        let currentLevel = updatedSection;
        for (let i = 0; i < keys.length - 1; i++) {
          if (!currentLevel[keys[i]]) {
            currentLevel[keys[i]] = {};
          }
          currentLevel = currentLevel[keys[i]];
        }
        const finalKey = key.split('.').pop()!;
        currentLevel[finalKey] = { ...currentLevel[finalKey], [subKey]: value };
      } else {
        updatedSection[key] = value;
      }

      return {
        ...prev,
        [section]: updatedSection
      };
    });

    // Auto-save to localStorage
    const updatedPreferences = {
      ...preferences,
      [section]: subKey 
        ? { ...preferences[section], [key]: { ...(preferences[section] as any)[key], [subKey]: value } }
        : { ...preferences[section], [key]: value }
    };
    localStorage.setItem('weddingPreferences', JSON.stringify(updatedPreferences));

    // Auto-save to NocoDB (debounced)
    saveToNocoDB(updatedPreferences);
  };

  // Import NocoDB service at the top
  const { NocoDBService } = require('../services/nocodb_service');

  // Mock service for AI image generation
  const MockCloudflareAIService = {
    generateWeddingThemeImages: async (params: any) => {
      console.log('Mock AI service called with:', params);
      // Simulate API response for testing
      return {
        success: true,
        data: {
          images: [
            'https://via.placeholder.com/300x200?text=Generated+Image+1',
            'https://via.placeholder.com/300x200?text=Generated+Image+2',
          ],
        },
      };
    },
  };

  // Debounced save function to prevent excessive API calls
  const saveToNocoDB = React.useCallback(
    debounce(async (preferencesData: WeddingPreferencesData) => {
      try {
        console.log('🔄 Auto-saving preferences to NocoDB...');
        const result = await NocoDBService.savePreferences(preferencesData);

        if (result.success) {
          console.log('✅ Preferences saved to NocoDB successfully');
          // Optional: Show success toast
        } else {
          console.warn('⚠️ Failed to save to NocoDB:', result.error);
        }
      } catch (error) {
        console.error('❌ Error saving to NocoDB:', error);
      }
    }, 2000), // 2 second debounce
    []
  );

  // Simple debounce function
  function debounce(func: Function, wait: number) {
    let timeout: NodeJS.Timeout;
    return function executedFunction(this: any, ...args: any[]) {
      const context = this;
      const later = () => {
        timeout = setTimeout(function() {
          func.apply(context, args);
        }, wait);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  const handleTabChange = (tabId: string) => {
    if (tabId === 'blueprint' && !(preferences.venue.venueType && preferences.theme.selectedTheme)) {
      alert('Please complete Venue Type and Decor & Theme selections before generating the wedding blueprint.');
      return;
    }
    setActiveTab(tabId);
  };

  const isSectionComplete = (section: string) => {
    switch (section) {
      case 'basic':
        return preferences.basicDetails.yourName && preferences.basicDetails.partnerName && preferences.basicDetails.location;
      case 'venue':
        return preferences.venue.venueType;
      case 'theme':
        return preferences.theme.selectedTheme;
      case 'catering':
        return preferences.catering.cuisine;
      case 'photography':
        return preferences.photography.style && (
          (preferences.photography.multiDayCoverage?.weddingCeremony) || 
          (preferences.photography.multiDayCoverage?.reception)
        );
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="bg-white rounded-2xl p-8 border shadow-lg" style={{ borderColor: '#FFB6C1' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#2F4F4F' }}>
                  <Heart className="w-6 h-6" style={{ color: '#FFFFFF' }} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold" style={{ color: '#2F4F4F' }}>Wedding Preferences</h1>
                  <p className="text-gray-600">Customize your dream wedding experience</p>
                </div>
              </div>
            </div>
          </div>

          {/* Horizontal Tab Navigation */}
          <div className="bg-white rounded-2xl p-6 border shadow-lg" style={{ borderColor: '#FFB6C1' }}>
            <div className="flex overflow-x-auto gap-2 pb-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isComplete = isSectionComplete(tab.id);
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    disabled={tab.disabled}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-300 whitespace-nowrap ${
                      isActive 
                        ? 'bg-deep-navy text-white shadow-lg' 
                        : tab.disabled
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : isComplete
                        ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                        : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.name}</span>
                    {isComplete && !isActive && (
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-2xl p-8 border shadow-lg" style={{ borderColor: '#FFB6C1' }}>
            {/* Basic Details Tab */}
            {activeTab === 'basic' && (
              <div>
                <h2 className="text-xl font-bold mb-6 flex items-center" style={{ color: '#2F4F4F' }}>
                  <Users className="w-5 h-5 mr-2" style={{ color: '#2F4F4F' }} />
                  Wedding Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
                    <input
                      type="text"
                      value={preferences.basicDetails.yourName}
                      onChange={(e) => updatePreference('basicDetails', 'yourName', e.target.value)}
                      placeholder="Your name"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-gray-400 focus:ring-2 focus:ring-gray-400/20 transition-all duration-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Partner's Name</label>
                    <input
                      type="text"
                      value={preferences.basicDetails.partnerName}
                      onChange={(e) => updatePreference('basicDetails', 'partnerName', e.target.value)}
                      placeholder="Partner's name"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-gray-400 focus:ring-2 focus:ring-gray-400/20 transition-all duration-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Contact Number</label>
                    <input
                      type="tel"
                      value={preferences.basicDetails.contactNumber}
                      onChange={(e) => updatePreference('basicDetails', 'contactNumber', e.target.value)}
                      placeholder="Phone number"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-gray-400 focus:ring-2 focus:ring-gray-400/20 transition-all duration-300"
                    />
                  </div>

                  {/* Wedding Date */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Wedding Date
                </label>
                <input
                  type="date"
                  value={preferences.basicDetails.weddingDate}
                  onChange={(e) => updatePreference('basicDetails', 'weddingDate', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-gray-400 focus:ring-2 focus:ring-gray-400/20 transition-all duration-300"
                  disabled={preferences.basicDetails.datesFlexible}
                />
              </div>

              {/* Dates Flexible Checkbox */}
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="datesFlexible"
                  checked={preferences.basicDetails.datesFlexible}
                  onChange={(e) => updatePreference('basicDetails', 'datesFlexible', e.target.checked)}
                  className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                />
                <label htmlFor="datesFlexible" className="text-sm font-medium text-gray-700">
                  My dates are flexible
                </label>
              </div>

              {/* Event Duration */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Number of Days of Event
                </label>
                <select
                  value={preferences.basicDetails.eventDuration}
                  onChange={(e) => updatePreference('basicDetails', 'eventDuration', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-gray-400 focus:ring-2 focus:ring-gray-400/20 transition-all duration-300"
                >
                  <option value="">Select duration</option>
                  <option value="1">1 Day</option>
                  <option value="2">2 Days</option>
                  <option value="3">3 Days</option>
                  <option value="4">4 Days</option>
                  <option value="5">5 Days</option>
                  <option value="7">1 Week</option>
                </select>
              </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Guest Count</label>
                    <input
                      type="number"
                      value={preferences.basicDetails.guestCount}
                      onChange={(e) => updatePreference('basicDetails', 'guestCount', parseInt(e.target.value, 10) || 0)}
                      placeholder="Number of guests"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-gray-400 focus:ring-2 focus:ring-gray-400/20 transition-all duration-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Budget Range</label>
                    <select
                      value={preferences.basicDetails.budgetRange}
                      onChange={(e) => updatePreference('basicDetails', 'budgetRange', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-gray-400 focus:ring-2 focus:ring-gray-400/20 transition-all duration-300"
                    >
                      <option value="">Select budget</option>
                      {budgetRanges.map(budget => (
                        <option key={budget.id} value={budget.name}>{budget.name} - {budget.description}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                    <input
                      type="text"
                      value={preferences.basicDetails.location}
                      onChange={(e) => updatePreference('basicDetails', 'location', e.target.value)}
                      placeholder="City or venue"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-gray-400 focus:ring-2 focus:ring-gray-400/20 transition-all duration-300"
                    />
                  </div>
                </div>

                {/* Priority Ranking Section */}
                <div className="mt-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold mb-1" style={{ color: '#2F4F4F' }}>
                      🎯 Wedding Priorities
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Drag to reorder by importance (most important at top)
                    </p>
                  </div>

                  <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-3 rounded-xl border border-pink-100">
                    <div className="space-y-1.5">
                      {preferences.basicDetails.priorities.map((priority, index) => (
                        <div
                          key={priority.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, priority, index)}
                          onDragEnd={handleDragEnd}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, index)}
                          className={`bg-white rounded-lg p-2.5 border border-gray-200 cursor-move transition-all duration-200 hover:shadow-sm hover:border-pink-300 group ${
                            draggedIndex === index ? 'opacity-50 scale-95' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2.5 flex-1 min-w-0">
                              {/* Priority Rank Badge */}
                              <div className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center font-bold text-white text-xs" 
                                   style={{ backgroundColor: `hsl(${index * 45}, 70%, 60%)` }}>
                                {index + 1}
                              </div>

                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-gray-800 group-hover:text-pink-700 transition-colors text-sm truncate">
                                  {priority.name}
                                </h4>
                                <p className="text-xs text-gray-500 mt-0.5 truncate">
                                  {priority.description}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2 flex-shrink-0">
                              {/* Priority Level Dots - Compact */}
                              <div className="flex space-x-0.5">
                                {Array.from({ length: Math.min(5, 8 - index) }).map((_, i) => (
                                  <div
                                    key={i}
                                    className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-pink-400 to-purple-400"
                                  />
                                ))}
                              </div>

                              {/* Priority Label */}
                              <span className="text-xs font-medium text-gray-500 min-w-0">
                                {index === 0 && '🔥 Top'}
                                {index === 1 && '⭐ High'}
                                {index === 2 && '📍 Important'}
                                {index >= 3 && index <= 4 && '📝 Consider'}
                                {index >= 5 && '💡 Nice'}
                              </span>

                              {/* Drag Handle */}
                              <div className="text-gray-400 group-hover:text-pink-500 transition-colors">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Compact Priority Summary */}
                    <div className="mt-3 p-2.5 bg-white/70 rounded-lg border border-pink-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-sm">📊</span>
                          <h4 className="font-medium text-gray-800 text-sm">Priority Focus</h4>
                        </div>
                        <div className="text-xs text-gray-600 text-right">
                          <div><strong className="text-pink-600">1st:</strong> {preferences.basicDetails.priorities[0]?.name.replace(/🏛️|📸|🍽️|🎨|🎵|👗|🌸|🚗/g, '').trim()}</div>
                          <div><strong className="text-purple-600">2nd:</strong> {preferences.basicDetails.priorities[1]?.name.replace(/🏛️|📸|🍽️|🎨|🎵|👗|🌸|🚗/g, '').trim()}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Venue Tab */}
            {activeTab === 'venue' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-xl font-bold flex items-center" style={{ color: '#2F4F4F' }}>
                    <Building2 className="w-5 h-5 mr-2" style={{ color: '#2F4F4F' }} />
                    Venue Selection
                  </h2>
                </div>
                <div className="space-y-8">
                  {venueCategories.map((category) => (
                    <div key={category.id} className="space-y-4">
                      <div className="border-b border-gray-200 pb-2">
                        <h3 className="text-lg font-semibold" style={{ color: '#2F4F4F' }}>
                          {category.name}
                        </h3>
                        <p className="text-sm text-gray-600">{category.description}</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {category.venues.map((venue) => (
                          <div
                            key={venue.id}
                            onClick={() => updatePreference('venue', 'venueType', venue.id)}
                            className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-300 hover:shadow-md ${
                              preferences.venue.venueType === venue.id
                                ? 'border-deep-navy bg-deep-navy/5 shadow-md'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="aspect-video bg-gray-100 rounded-lg mb-3 overflow-hidden relative">
                              <img
                                src={venue.image}
                                alt={venue.name}
                                className="w-full h-full object-cover"
                                style={{ objectPosition: 'center 30%' }}
                                onError={(e) => {
                                  console.log(`❌ Failed to load venue image: ${venue.image}`);
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  target.parentElement!.innerHTML = `
                                    <div class="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                                      <div class="text-center">
                                        <div class="text-2xl mb-2">🏛️</div>
                                        <p class="text-sm">${venue.name}</p>
                                      </div>
                                    </div>
                                  `;
                                }}
                                onLoad={() => {
                                  console.log(`✅ Successfully loaded venue image: ${venue.image}`);
                                }}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                            </div>
                            <h4 className="font-semibold text-base mb-1" style={{ color: '#2F4F4F' }}>
                              {venue.name}
                            </h4>
                            <p className="text-gray-600 text-xs mb-2" style={{ 
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden'
                            }}>{venue.description}</p>
                            <div className="text-xs text-gray-500 mb-2">
                              <strong>Capacity:</strong> {venue.capacity}
                            </div>
                            <div className="space-y-1">
                              {venue.features.slice(0, 2).map((feature, index) => (
                                <div key={index} className="text-xs text-gray-600 flex items-center">
                                  <div className="w-1 h-1 bg-gray-400 rounded-full mr-1"></div>
                                  <span className="truncate">{feature}</span>
                                </div>
                              ))}
                              {venue.features.length > 2 && (
                                <div className="text-xs text-gray-500">
                                  +{venue.features.length - 2} more features
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Decor & Theme Tab */}
            {activeTab === 'theme' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-xl font-bold flex items-center" style={{ color: '#2F4F4F' }}>
                    <Palette className="w-5 h-5 mr-2" style={{ color: '#2F4F4F' }} />
                    Wedding Theme Selection
                  </h2>
                  <p className="text-gray-600 mt-2">Choose from our curated collection of wedding themes, organized by style and aesthetic</p>
                </div>
                <div className="space-y-8">
                  {themeCategories.map((category) => (
                    <div key={category.id} className="space-y-4">
                      <div className="border-b border-gray-200 pb-2">
                        <h3 className="text-lg font-semibold" style={{ color: '#2F4F4F' }}>
                          {category.name}
                        </h3>
                        <p className="text-sm text-gray-600">{category.description}</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {category.themes.map((theme) => {
                          console.log(`🎨 Theme: ${theme.name}, ID: ${theme.id}, Image: ${theme.image}`);
                          return (
                            <div
                              key={theme.id}
                              onClick={() => updatePreference('theme', 'selectedTheme', theme.id)}
                              className={`p-6 border-2 rounded-xl cursor-pointer transition-all duration-300 hover:shadow-md ${
                                preferences.theme.selectedTheme === theme.id
                                  ? 'border-deep-navy bg-deep-navy/5 shadow-md'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className="aspect-video bg-gray-100 rounded-lg mb-4 overflow-hidden relative">
                                <img
                                  src={theme.image}
                                  alt={theme.name}
                                  className="w-full h-full object-cover"
                                  style={{ objectPosition: 'center 30%' }}
                                  onError={(e) => {
                                    console.log(`❌ Failed to load image for ${theme.name}: ${theme.image}`);
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    target.parentElement!.innerHTML = `
                                      <div class="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                                        <div class="text-center">
                                          <div class="text-2xl mb-2">🎭</div>
                                          <p class="text-sm">${theme.name}</p>
                                        </div>
                                      </div>
                                    `;
                                  }}
                                  onLoad={() => {
                                    console.log(`✅ Successfully loaded image for ${theme.name}: ${theme.image}`);
                                  }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                              </div>
                              <h4 className="font-semibold text-base mb-2" style={{ color: '#2F4F4F' }}>
                                {theme.name}
                              </h4>
                              <p className="text-gray-600 text-sm mb-3" style={{ 
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden'
                              }}>{theme.description}</p>
                              <div className="space-y-1">
                                {theme.features.slice(0, 2).map((feature, index) => (
                                  <div key={index} className="text-xs text-gray-600 flex items-center">
                                    <div className="w-1 h-1 bg-gray-400 rounded-full mr-1"></div>
                                    <span className="truncate">{feature}</span>
                                  </div>
                                ))}
                                {theme.features.length > 2 && (
                                  <div className="text-xs text-gray-500">
                                    +{theme.features.length - 2} more features
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Catering Tab */}
            {activeTab === 'catering' && (
              <div>
                <h2 className="text-xl font-bold mb-6 flex items-center" style={{ color: '#2F4F4F' }}>
                  <Utensils className="w-5 h-5 mr-2" style={{ color: '#2F4F4F' }} />
                  Catering Preferences
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cuisine Type</label>
                    <select
                      value={preferences.catering.cuisine}
                      onChange={(e) => updatePreference('catering', 'cuisine', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-gray-400 focus:ring-2 focus:ring-gray-400/20 transition-all duration-300"
                    >
                      <option value="">Select cuisine</option>
                      <option value="indian">Indian</option>
                      <option value="continental">Continental</option>
                      <option value="chinese">Chinese</option>
                      <option value="italian">Italian</option>
                      <option value="mexican">Mexican</option>
                      <option value="fusion">Fusion</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Meal Type</label>
                    <select
                      value={preferences.catering.mealType}
                      onChange={(e) => updatePreference('catering', 'mealType', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-gray-400 focus:ring-2 focus:ring-gray-400/20 transition-all duration-300"
                    >
                      <option value="">Select meal type</option>
                      <option value="lunch">Lunch</option>
                      <option value="dinner">Dinner</option>
                      <option value="both">Both Lunch & Dinner</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Photography Tab */}
            {activeTab === 'photography' && (
              <div className="space-y-8">
                <h2 className="text-xl font-bold mb-6 flex items-center" style={{ color: '#2F4F4F' }}>
                  <Camera className="w-5 h-5 mr-2" style={{ color: '#2F4F4F' }} />
                  Photography & Videography Preferences
                </h2>

                {/* Basic Photography Preferences */}
                <div className="bg-gray-50 p-6 rounded-xl">
                  <h3 className="text-lg font-semibold mb-4" style={{ color: '#2F4F4F' }}>Basic Photography</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Photography Style</label>
                      <select
                        value={preferences.photography.style}
                        onChange={(e) => updatePreference('photography', 'style', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-gray-400 focus:ring-2 focus:ring-gray-400/20 transition-all duration-300"
                      >
                        <option value="">Select style</option>
                        <option value="traditional">Traditional</option>
                        <option value="candid">Candid</option>
                        <option value="artistic">Artistic</option>
                        <option value="documentary">Documentary</option>
                        <option value="cinematic">Cinematic</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Coverage Type</label>
                      <select
                        value={preferences.photography.coverage}
                        onChange={(e) => updatePreference('photography', 'coverage', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-gray-400 focus:ring-2 focus:ring-gray-400/20 transition-all duration-300"
                      >
                        <option value="">Select coverage</option>
                        <option value="full-day">Full Day</option>
                        <option value="half-day">Half Day</option>
                        <option value="ceremony-only">Ceremony Only</option>
                        <option value="reception-only">Reception Only</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Multi-Day Coverage */}
                <div className="bg-gray-50 p-6 rounded-xl">
                  <h3 className="text-lg font-semibold mb-4" style={{ color: '#2F4F4F' }}>Multi-Day Coverage</h3>
                  <p className="text-gray-600 mb-4">Select which events you'd like photographed:</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <label className="flex items-center space-x-2 p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={preferences.photography.multiDayCoverage?.preWeddingShoot || false}
                        onChange={(e) => updatePreference('photography', 'multiDayCoverage', e.target.checked, 'preWeddingShoot')}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">Pre-Wedding Shoot</span>
                    </label>
                    <label className="flex items-center space-x-2 p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={preferences.photography.multiDayCoverage?.engagementShoot || false}
                        onChange={(e) => updatePreference('photography', 'multiDayCoverage', e.target.checked, 'engagementShoot')}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">Engagement Shoot</span>
                    </label>
                    <label className="flex items-center space-x-2 p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={preferences.photography.multiDayCoverage?.mehendiCeremony || false}
                        onChange={(e) => updatePreference('photography', 'multiDayCoverage', e.target.checked, 'mehendiCeremony')}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">Mehendi Ceremony</span>
                    </label>
                    <label className="flex items-center space-x-2 p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={preferences.photography.multiDayCoverage?.haldiCeremony || false}
                        onChange={(e) => updatePreference('photography', 'multiDayCoverage', e.target.checked, 'haldiCeremony')}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">Haldi Ceremony</span>
                    </label>
                    <label className="flex items-center space-x-2 p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={preferences.photography.multiDayCoverage?.sangeetCeremony || false}
                        onChange={(e) => updatePreference('photography', 'multiDayCoverage', e.target.checked, 'sangeetCeremony')}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">Sangeet Ceremony</span>
                    </label>
                    <label className="flex items-center space-x-2 p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={preferences.photography.multiDayCoverage?.weddingCeremony || false}
                        onChange={(e) => updatePreference('photography', 'multiDayCoverage', e.target.checked, 'weddingCeremony')}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">Wedding Ceremony</span>
                    </label>
                    <label className="flex items-center space-x-2 p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={preferences.photography.multiDayCoverage?.reception || false}
                        onChange={(e) => updatePreference('photography', 'multiDayCoverage', e.target.checked, 'reception')}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">Reception</span>
                    </label>
                    <label className="flex items-center space-x-2 p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={preferences.photography.multiDayCoverage?.postWeddingShoot || false}
                        onChange={(e) => updatePreference('photography', 'multiDayCoverage', e.target.checked, 'postWeddingShoot')}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">Post-Wedding Shoot</span>
                    </label>
                  </div>
                </div>

                {/* Videography Services */}
                <div className="bg-gray-50 p-6 rounded-xl">
                  <h3 className="text-lg font-semibold mb-4" style={{ color: '#2F4F4F' }}>Videography Services</h3>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        checked={preferences.photography.videography?.required || false}
                        onChange={(e) => updatePreference('photography', 'videography', e.target.checked, 'required')}
                        className="rounded border-gray-300"
                      />
                      <span className="font-medium">Include Videography Services</span>
                    </div>

                    {preferences.photography.videography?.required && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Video Style</label>
                          <select
                            value={preferences.photography.videography?.style || ''}
                            onChange={(e) => updatePreference('photography', 'videography', e.target.value, 'style')}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-gray-400 focus:ring-2 focus:ring-gray-400/20 transition-all duration-300"
                          >
                            <option value="">Select video style</option>
                            <option value="cinematic">Cinematic</option>
                            <option value="documentary">Documentary</option>
                            <option value="traditional">Traditional</option>
                            <option value="artistic">Artistic</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Coverage Duration</label>
                          <select
                            value={preferences.photography.videography?.coverageDuration || ''}
                            onChange={(e) => updatePreference('photography', 'videography', e.target.value, 'coverageDuration')}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-gray-400 focus:ring-2 focus:ring-gray-400/20 transition-all duration-300"
                          >
                            <option value="">Select duration</option>
                            <option value="full-day">Full Day</option>
                            <option value="half-day">Half Day</option>
                            <option value="ceremony-only">Ceremony Only</option>
                          </select>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input 
                            type="checkbox" 
                            checked={preferences.photography.videography?.droneCoverage || false}
                            onChange={(e) => updatePreference('photography', 'videography', e.target.checked, 'droneCoverage')}
                            className="rounded border-gray-300"
                          />
                          <span>Include Drone Coverage</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Cultural Coverage */}
                <div className="bg-gray-50 p-6 rounded-xl">
                  <h3 className="text-lg font-semibold mb-4" style={{ color: '#2F4F4F' }}>Cultural Ceremony Coverage</h3>
                  <p className="text-gray-600 mb-4">Select cultural elements you want captured:</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <label className="flex items-center space-x-2 p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={preferences.photography.culturalCoverage.mandapCeremony}
                        onChange={(e) => updatePreference('photography', 'culturalCoverage', e.target.checked, 'mandapCeremony')}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">Mandap Ceremony</span>
                    </label>
                    <label className="flex items-center space-x-2 p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={preferences.photography.culturalCoverage.agniCeremony}
                        onChange={(e) => updatePreference('photography', 'culturalCoverage', e.target.checked, 'agniCeremony')}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">Agni Ceremony</span>
                    </label>
                    <label className="flex items-center space-x-2 p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={preferences.photography.culturalCoverage.familyPortraits}
                        onChange={(e) => updatePreference('photography', 'culturalCoverage', e.target.checked, 'familyPortraits')}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">Family Portraits</span>
                    </label>
                    <label className="flex items-center space-x-2 p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={preferences.photography.culturalCoverage.traditionalAttire}
                        onChange={(e) => updatePreference('photography', 'culturalCoverage', e.target.checked, 'traditionalAttire')}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">Traditional Attire</span>
                    </label>
                    <label className="flex items-center space-x-2 p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={preferences.photography.culturalCoverage.culturalPerformances}
                        onChange={(e) => updatePreference('photography', 'culturalCoverage', e.target.checked, 'culturalPerformances')}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">Cultural Performances</span>
                    </label>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Specific Rituals to Capture</label>
                    <textarea
                      value={preferences.photography.culturalCoverage.specificRituals.join(', ')}
                      onChange={(e) => updatePreference('photography', 'culturalCoverage', e.target.value.split(',').map(s => s.trim()).filter(s => s), 'specificRituals')}
                      placeholder="List any specific rituals, ceremonies, or moments you want captured (comma-separated)..."
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-gray-400 focus:ring-2 focus:ring-gray-400/20 transition-all duration-300"
                    />
                  </div>
                </div>

                {/* Deliverables */}
                <div className="bg-gray-50 p-6 rounded-xl">
                  <h3 className="text-lg font-semibold mb-4" style={{ color: '#2F4F4F' }}>Final Deliverables</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <label className="flex items-center space-x-2 p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={preferences.photography.deliverables.digitalGallery}
                        onChange={(e) => updatePreference('photography', 'deliverables', e.target.checked, 'digitalGallery')}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">Digital Gallery</span>
                    </label>
                    <label className="flex items-center space-x-2 p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={preferences.photography.deliverables.physicalAlbum}
                        onChange={(e) => updatePreference('photography', 'deliverables', e.target.checked, 'physicalAlbum')}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">Physical Album</span>
                    </label>
                    <label className="flex items-center space-x-2 p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={preferences.photography.deliverables.videoHighlights}
                        onChange={(e) => updatePreference('photography', 'deliverables', e.target.checked, 'videoHighlights')}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">Video Highlights</span>
                    </label>
                    <label className="flex items-center space-x-2 p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={preferences.photography.deliverables.fullVideo}
                        onChange={(e) => updatePreference('photography', 'deliverables', e.target.checked, 'fullVideo')}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">Full Video</span>
                    </label>
                    <label className="flex items-center space-x-2 p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={preferences.photography.deliverables.prints}
                        onChange={(e) => updatePreference('photography', 'deliverables', e.target.checked, 'prints')}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">Prints</span>
                    </label>
                    <label className="flex items-center space-x-2 p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={preferences.photography.deliverables.socialMediaSharing}
                        onChange={(e) => updatePreference('photography', 'deliverables', e.target.checked, 'socialMediaSharing')}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">Social Media Sharing</span>
                    </label>
                  </div>
                </div>

                {/* Technical Preferences */}
                <div className="bg-gray-50 p-6 rounded-xl">
                  <h3 className="text-lg font-semibold mb-4" style={{ color: '#2F4F4F' }}>Technical Preferences</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Equipment Preference</label>
                      <select
                        value={preferences.photography.technicalPreferences.equipmentType}
                        onChange={(e) => updatePreference('photography', 'technicalPreferences', e.target.value, 'equipmentType')}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-gray-400 focus:ring-2 focus:ring-gray-400/20 transition-all duration-300"
                      >
                        <option value="">Select equipment</option>
                        <option value="dslr">DSLR</option>
                        <option value="mirrorless">Mirrorless</option>
                        <option value="film">Film</option>
                        <option value="mixed">Mixed</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Lighting Style</label>
                      <select
                        value={preferences.photography.technicalPreferences.lightingStyle}
                        onChange={(e) => updatePreference('photography', 'technicalPreferences', e.target.value, 'lightingStyle')}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-gray-400 focus:ring-2 focus:ring-gray-400/20 transition-all duration-300"
                      >
                        <option value="">Select lighting</option>
                        <option value="natural">Natural Light</option>
                        <option value="studio">Studio Lighting</option>
                        <option value="mixed">Mixed</option>
                      </select>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        checked={preferences.photography.technicalPreferences.backupPhotographer}
                        onChange={(e) => updatePreference('photography', 'technicalPreferences', e.target.checked, 'backupPhotographer')}
                        className="rounded border-gray-300"
                      />
                      <span>Backup Photographer Required</span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Editing Style</label>
                      <select
                        value={preferences.photography.technicalPreferences.editingStyle}
                        onChange={(e) => updatePreference('photography', 'technicalPreferences', e.target.value, 'editingStyle')}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-gray-400 focus:ring-2 focus:ring-gray-400/20 transition-all duration-300"
                      >
                        <option value="">Select editing style</option>
                        <option value="natural">Natural</option>
                        <option value="enhanced">Enhanced</option>
                        <option value="artistic">Artistic</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Budget Range */}
                <div className="bg-gray-50 p-6 rounded-xl">
                  <h3 className="text-lg font-semibold mb-4" style={{ color: '#2F4F4F' }}>Photography Budget</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Budget Range for Photography & Videography</label>
                    <select
                      value={preferences.photography.budgetRange}
                      onChange={(e) => updatePreference('photography', 'budgetRange', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-gray-400 focus:ring-2 focus:ring-gray-400/20 transition-all duration-300"
                    >
                      <option value="">Select budget range</option>
                      <option value="budget-50k-1L">₹50K - ₹1 Lakh</option>
                      <option value="mid-1L-2L">₹1 Lakh - ₹2 Lakhs</option>
                      <option value="premium-2L-3L">₹2 Lakhs - ₹3 Lakhs</option>
                      <option value="luxury-3L-5L">₹3 Lakhs - ₹5 Lakhs</option>
                      <option value="ultra-5L+">₹5 Lakhs+</option>
                    </select>
                  </div>
                </div>

                {/* Special Requests */}
                <div className="bg-gray-50 p-6 rounded-xl">
                  <h3 className="text-lg font-semibold mb-4" style={{ color: '#2F4F4F' }}>Special Requests</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Additional Requirements</label>
                    <textarea
                      value={preferences.photography.specialRequests}
                      onChange={(e) => updatePreference('photography', 'specialRequests', e.target.value)}
                      placeholder="Any special photography or videography requests, specific shots, or additional requirements..."
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-gray-400 focus:ring-2 focus:ring-gray-400/20 transition-all duration-300"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Wedding Blueprint Tab */}
            {activeTab === 'blueprint' && (
              <div>
                <h2 className="text-xl font-bold mb-6 flex items-center" style={{ color: '#2F4F4F' }}>
                  <FileText className="w-5 h-5 mr-2" style={{ color: '#2F4F4F' }} />
                  Wedding Blueprint
                </h2>
                {showBlueprint ? (
                  <WeddingBlueprint
                    preferences={preferences}
                    onClose={() => setShowBlueprint(false)}
                  />
                ) : (
                  <div className="text-center py-12">
                    <div className="mb-6">
                      <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">Generate Your Wedding Blueprint</h3>
                      <p className="text-gray-600 mb-6">
                        Create a comprehensive AI-generated wedding blueprint based on your preferences.
                      </p>
                    </div>

                    {!(preferences.venue.venueType && preferences.theme.selectedTheme) && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                        <p className="text-yellow-800 text-sm">
                          ⚠️ <strong>Note:</strong> Venue Type and Decor & Theme selections are required for blueprint generation. 
                          Other fields are optional but recommended for a complete blueprint.
                        </p>
                      </div>
                    )}

                    <button
                      onClick={() => setShowBlueprint(true)}
                      className="px-8 py-3 bg-deep-navy text-white rounded-xl font-semibold hover:opacity-90 transition-all duration-300 flex items-center gap-2 mx-auto"
                    >
                      <Sparkles className="w-4 h-4" />
                      Generate Wedding Blueprint
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeddingPreferences;