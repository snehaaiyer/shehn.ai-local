import React, { useState, useEffect } from 'react';
import { Heart, Palette, Building2, Camera, Utensils, Sparkles, Users, FileText } from "lucide-react";
import { CloudflareAIService } from "../services/cloudflare_ai_service";
import { NocoDBService } from "../services/nocodb_service";
import WeddingBlueprint from "../components/WeddingBlueprint";

interface WeddingPreferencesData {
  basicDetails: {
    guestCount: number;
    weddingDate: string;
    location: string;
    budgetRange: string;
    yourName: string;
    partnerName: string;
    contactNumber: string;
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
  const [savedSections, setSavedSections] = useState<Set<string>>(new Set());

  
  const [preferences, setPreferences] = useState<WeddingPreferencesData>({
    basicDetails: {
      guestCount: 100,
      weddingDate: '',
      location: '',
      budgetRange: '',
      yourName: '',
      partnerName: '',
      contactNumber: ''
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

  // Wedding Themes with images and detailed descriptions (Research-based from leading Indian wedding companies)
  const themes = [
    // Heritage & Luxury Themes (High Engagement)
    { 
      id: 'royal-palace-extravaganza', 
      name: 'Royal Palace Extravaganza', 
      description: 'Majestic palace celebrations with royal grandeur and heritage charm', 
      color: '#7C3AED',
      image: '/images/themes/royal-palace.jpg',
      features: ['Heritage Palace', 'Royal Decorations', 'Traditional Music', 'Cultural Experience']
    },
    { 
      id: 'heritage-palace-wedding', 
      name: 'Heritage Palace Wedding', 
      description: 'Elegant heritage palace celebrations with cultural authenticity', 
      color: '#DC2626',
      image: '/images/themes/traditional-cultural.jpg',
      features: ['Historical Venue', 'Cultural Decor', 'Traditional Cuisine', 'Heritage Experience']
    },
    { 
      id: 'luxury-hotel-grandeur', 
      name: 'Luxury Hotel Grandeur', 
      description: 'Five-star celebrations with modern amenities and world-class service', 
      color: '#8B5CF6',
      image: '/images/themes/minimalist-pastel.jpg',
      features: ['Premium Service', 'Modern Amenities', 'International Cuisine', 'Luxury Accommodations']
    },
    { 
      id: 'heritage-haveli-celebration', 
      name: 'Heritage Haveli Celebration', 
      description: 'Regional charm with cultural authenticity in traditional havelis', 
      color: '#F59E0B',
      image: '/images/themes/traditional-cultural.jpg',
      features: ['Regional Architecture', 'Cultural Decor', 'Traditional Cuisine', 'Local Experience']
    },
    
    // Destination & Nature Themes (High Engagement)
    { 
      id: 'beach-destination-luxury', 
      name: 'Beach Destination Luxury', 
      description: 'Luxurious beachside celebrations with ocean views and tropical charm', 
      color: '#06B6D4',
      image: '/images/themes/beach-destination.jpg',
      features: ['Ocean Views', 'Beach Setup', 'Seafood Menu', 'Sunset Ceremony']
    },
    { 
      id: 'mountain-retreat-celebration', 
      name: 'Mountain Retreat Celebration', 
      description: 'Scenic mountain celebrations with breathtaking views and peaceful atmosphere', 
      color: '#059669',
      image: '/images/themes/boho-garden.jpg',
      features: ['Mountain Views', 'Natural Setting', 'Peaceful Atmosphere', 'Adventure Activities']
    },
    { 
      id: 'garden-palace-affair', 
      name: 'Garden Palace Affair', 
      description: 'Natural elegance with outdoor charm in garden palace settings', 
      color: '#10B981',
      image: '/images/themes/boho-garden.jpg',
      features: ['Garden Setting', 'Natural Beauty', 'Outdoor Celebration', 'Floral Decor']
    },
    { 
      id: 'lakefront-wedding', 
      name: 'Lakefront Wedding', 
      description: 'Serene lakefront celebrations with water views and tranquil atmosphere', 
      color: '#3B82F6',
      image: '/images/themes/beach-destination.jpg',
      features: ['Lake Views', 'Waterfront Setting', 'Tranquil Atmosphere', 'Boat Ceremonies']
    },
    
    // Cultural & Traditional Themes (High Engagement)
    { 
      id: 'traditional-hindu-grandeur', 
      name: 'Traditional Hindu Grandeur', 
      description: 'Sacred ceremonies with Vedic rituals, mandap decorations, and traditional customs', 
      color: '#DC2626',
      image: '/images/themes/traditional-cultural.jpg',
      features: ['Mandap Setup', 'Vedic Rituals', 'Traditional Attire', 'Sacred Fire Ceremony']
    },
    { 
      id: 'sikh-anand-karaj', 
      name: 'Sikh Anand Karaj', 
      description: 'Sacred Sikh wedding ceremonies with religious significance and cultural richness', 
      color: '#F59E0B',
      image: '/images/themes/traditional-cultural.jpg',
      features: ['Gurudwara Ceremony', 'Religious Rituals', 'Traditional Music', 'Community Celebration']
    },
    { 
      id: 'muslim-nikah-ceremony', 
      name: 'Muslim Nikah Ceremony', 
      description: 'Traditional Islamic wedding ceremonies with cultural diversity and traditional values', 
      color: '#059669',
      image: '/images/themes/traditional-cultural.jpg',
      features: ['Nikah Ceremony', 'Islamic Traditions', 'Cultural Decor', 'Community Gathering']
    },
    { 
      id: 'south-indian-temple', 
      name: 'South Indian Temple Wedding', 
      description: 'Traditional temple ceremonies with classical music and cultural authenticity', 
      color: '#7C3AED',
      image: '/images/themes/south-indian-temple.jpg',
      features: ['Temple Ceremony', 'Classical Music', 'Traditional Attire', 'Cultural Rituals']
    },
    
    // Modern & Contemporary Themes (Medium-High Engagement)
    { 
      id: 'modern-fusion-wedding', 
      name: 'Modern Fusion Wedding', 
      description: 'Contemporary celebrations blending traditional and modern elements', 
      color: '#8B5CF6',
      image: '/images/themes/minimalist-pastel.jpg',
      features: ['Modern Decor', 'Fusion Cuisine', 'Contemporary Music', 'Cultural Blend']
    },
    { 
      id: 'bollywood-sangeet', 
      name: 'Bollywood Sangeet', 
      description: 'Vibrant dance and music celebrations with Bollywood flair and entertainment', 
      color: '#EC4899',
      image: '/images/themes/bollywood-sangeet.jpg',
      features: ['Dance Floor', 'Live Music', 'Bollywood Songs', 'Colorful Decorations']
    },
    { 
      id: 'contemporary-luxury', 
      name: 'Contemporary Luxury', 
      description: 'Modern elegance with sophisticated style and contemporary luxury', 
      color: '#1F2937',
      image: '/images/themes/minimalist-pastel.jpg',
      features: ['Modern Design', 'Luxury Amenities', 'Contemporary Style', 'Sophisticated Decor']
    },
    { 
      id: 'minimalist-elegance', 
      name: 'Minimalist Elegance', 
      description: 'Clean and simple celebrations with understated elegance and modern minimalism', 
      color: '#6B7280',
      image: '/images/themes/minimalist-pastel.jpg',
      features: ['Clean Design', 'Simple Decor', 'Modern Aesthetics', 'Understated Elegance']
    },
    { 
      id: 'urban-chic-celebration', 
      name: 'Urban Chic Celebration', 
      description: 'City sophistication with modern urban style and contemporary charm', 
      color: '#374151',
      image: '/images/themes/minimalist-pastel.jpg',
      features: ['City Views', 'Modern Venue', 'Urban Setting', 'Contemporary Style']
    }
  ];

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

  // Venue categories for better organization

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
    const savedPreferences = localStorage.getItem('weddingPreferences');
    if (savedPreferences) {
      try {
        const parsed = JSON.parse(savedPreferences);
        
        // Ensure the photography object has all required nested properties
        const enhancedParsed = {
          ...parsed,
          photography: {
            style: parsed.photography?.style || '',
            coverage: parsed.photography?.coverage || '',
            specialRequests: parsed.photography?.specialRequests || '',
            multiDayCoverage: {
              preWeddingShoot: parsed.photography?.multiDayCoverage?.preWeddingShoot || false,
              engagementShoot: parsed.photography?.multiDayCoverage?.engagementShoot || false,
              mehendiCeremony: parsed.photography?.multiDayCoverage?.mehendiCeremony || false,
              haldiCeremony: parsed.photography?.multiDayCoverage?.haldiCeremony || false,
              sangeetCeremony: parsed.photography?.multiDayCoverage?.sangeetCeremony || false,
              weddingCeremony: parsed.photography?.multiDayCoverage?.weddingCeremony || true,
              reception: parsed.photography?.multiDayCoverage?.reception || true,
              postWeddingShoot: parsed.photography?.multiDayCoverage?.postWeddingShoot || false
            },
            videography: {
              required: parsed.photography?.videography?.required || false,
              style: parsed.photography?.videography?.style || '',
              droneCoverage: parsed.photography?.videography?.droneCoverage || false,
              coverageDuration: parsed.photography?.videography?.coverageDuration || ''
            },
            culturalCoverage: {
              mandapCeremony: parsed.photography?.culturalCoverage?.mandapCeremony || true,
              agniCeremony: parsed.photography?.culturalCoverage?.agniCeremony || true,
              familyPortraits: parsed.photography?.culturalCoverage?.familyPortraits || true,
              traditionalAttire: parsed.photography?.culturalCoverage?.traditionalAttire || true,
              culturalPerformances: parsed.photography?.culturalCoverage?.culturalPerformances || false,
              specificRituals: parsed.photography?.culturalCoverage?.specificRituals || []
            },
            deliverables: {
              digitalGallery: parsed.photography?.deliverables?.digitalGallery || true,
              physicalAlbum: parsed.photography?.deliverables?.physicalAlbum || false,
              videoHighlights: parsed.photography?.deliverables?.videoHighlights || false,
              fullVideo: parsed.photography?.deliverables?.fullVideo || false,
              prints: parsed.photography?.deliverables?.prints || false,
              socialMediaSharing: parsed.photography?.deliverables?.socialMediaSharing || true
            },
            technicalPreferences: {
              equipmentType: parsed.photography?.technicalPreferences?.equipmentType || '',
              lightingStyle: parsed.photography?.technicalPreferences?.lightingStyle || '',
              backupPhotographer: parsed.photography?.technicalPreferences?.backupPhotographer || false,
              editingStyle: parsed.photography?.technicalPreferences?.editingStyle || ''
            },
            budgetRange: parsed.photography?.budgetRange || ''
          }
        };
        
        setPreferences(prev => ({ ...prev, ...enhancedParsed }));
      } catch (error) {
        console.error('Error parsing saved preferences:', error);
      }
    }
  }, []);

  const updatePreference = (section: keyof WeddingPreferencesData, key: string, value: any, subKey?: string) => {
    setPreferences(prev => {
      if (subKey) {
        // Handle nested objects (e.g., photography.multiDayCoverage.preWeddingShoot)
        const currentSection = prev[section] as any;
        const currentKey = currentSection[key] as any;
        
        return {
          ...prev,
          [section]: {
            ...currentSection,
            [key]: {
              ...currentKey,
              [subKey]: value
            }
          }
        };
      } else {
        // Handle direct properties
        return {
          ...prev,
          [section]: { ...prev[section] as any, [key]: value }
        };
      }
    });
    
    // Auto-save to localStorage
    const currentSection = preferences[section] as any;
    const updatedPreferences = {
      ...preferences,
      [section]: subKey 
        ? { ...currentSection, [key]: { ...currentSection[key], [subKey]: value } }
        : { ...currentSection, [key]: value }
    };
    localStorage.setItem('weddingPreferences', JSON.stringify(updatedPreferences));
    
    // Mark section as saved
    setSavedSections(prev => new Set(Array.from(prev).concat(section)));
  };

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

  // Auto-save is handled in updatePreference function
  // const savePreferences = async () => {
  //   try {
  //     // Save to localStorage first
  //     localStorage.setItem('weddingPreferences', JSON.stringify(preferences));
  //     console.log('Preferences saved to localStorage');

  //     // Save to NocoDB
  //     const nocodbResult = await NocoDBService.savePreferences(preferences);
  //     if (nocodbResult.success) {
  //       console.log('✅ Preferences saved to NocoDB successfully');
  //       // Also save couple data if we have basic details
  //       if (preferences.basicDetails.yourName && preferences.basicDetails.partnerName) {
  //         await NocoDBService.saveCoupleData({
  //           yourName: preferences.basicDetails.yourName,
  //           partnerName: preferences.basicDetails.partnerName,
  //           contactNumber: preferences.basicDetails.contactNumber,
  //           weddingDate: preferences.basicDetails.weddingDate,
  //           location: preferences.basicDetails.location,
  //           guestCount: preferences.basicDetails.guestCount,
  //           budgetRange: preferences.basicDetails.budgetRange
  //         });
  //       }
  //     } else {
  //       console.warn('⚠️ Failed to save to NocoDB:', nocodbResult.error);
  //     }
  //   } catch (error) {
  //     console.error('Error saving preferences:', error);
  //   }
  // };

  // Theme image generation is handled elsewhere
  // const handleGenerateThemeImages = async () => {
  //   if (!preferences.theme.selectedTheme) {
  //     alert('Please select a wedding theme first');
  //     return;
  //   }

  //   updatePreference('theme', 'isGeneratingImages', true);

  //   try {
  //     const selectedTheme = themes.find(t => t.id === preferences.theme.selectedTheme);
  //     if (!selectedTheme) return;

  //     const requestData = {
  //       theme: selectedTheme.name,
  //       style: 'Traditional',
  //       colors: 'Red & Gold',
  //       season: 'Wedding Season',
  //       venueType: preferences.venue.venueType || 'Hotel',
  //       customDescription: selectedTheme.description,
  //       guestCount: preferences.basicDetails.guestCount,
  //       location: preferences.basicDetails.location || 'India',
  //       imageCount: 2
  //     };

  //     const response = await CloudflareAIService.generateWeddingThemeImages(requestData);
  //     
  //     if (response.success && response.images) {
  //       updatePreference('theme', 'generatedImages', response.images);
  //     } else {
  //       console.error('Failed to generate images:', response.error);
  //     }
  //   } catch (error) {
  //     console.error('Error generating images:', error);
  //   } finally {
  //     updatePreference('theme', 'isGeneratingImages', false);
  //   }
  // };



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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Wedding Date</label>
                    <input
                      type="date"
                      value={preferences.basicDetails.weddingDate}
                      onChange={(e) => updatePreference('basicDetails', 'weddingDate', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-gray-400 focus:ring-2 focus:ring-gray-400/20 transition-all duration-300"
                    />
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
                                className="w-full h-full object-cover object-center"
                                style={{ objectPosition: 'center 30%' }}
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  target.parentElement!.innerHTML = `
                                    <div class="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                                      <div class="text-center">
                                        <svg class="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path>
                                        </svg>
                                        <p class="text-sm">Venue image</p>
                                      </div>
                                    </div>
                                  `;
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
                <h2 className="text-xl font-bold mb-6 flex items-center" style={{ color: '#2F4F4F' }}>
                  <Palette className="w-5 h-5 mr-2" style={{ color: '#2F4F4F' }} />
                  Wedding Theme
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {themes.map((theme) => (
                    <div
                      key={theme.id}
                      onClick={() => updatePreference('theme', 'selectedTheme', theme.id)}
                      className={`p-6 border-2 rounded-xl cursor-pointer transition-all duration-300 ${
                        preferences.theme.selectedTheme === theme.id
                          ? 'border-deep-navy bg-deep-navy/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="aspect-video bg-gray-100 rounded-lg mb-4 overflow-hidden">
                        <img
                          src={theme.image}
                          alt={theme.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/images/themes/traditional-cultural.jpg';
                          }}
                        />
                      </div>
                      <h3 className="font-semibold text-lg mb-2" style={{ color: '#2F4F4F' }}>
                        {theme.name}
                      </h3>
                      <p className="text-gray-600 text-sm mb-3">{theme.description}</p>
                      <div className="space-y-1">
                        {theme.features.map((feature, index) => (
                          <div key={index} className="text-xs text-gray-600 flex items-center">
                            <div className="w-1 h-1 bg-gray-400 rounded-full mr-2"></div>
                            {feature}
                          </div>
                        ))}
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