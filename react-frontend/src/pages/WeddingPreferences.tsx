import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Palette, Building2, Camera, Utensils, Sparkles, Users, FileText, Calendar, Loader2, Mail } from "lucide-react";
import WeddingBlueprint from "../components/WeddingBlueprint";
import { useFormValidation, validationRules, ValidationRules } from '../hooks/useFormValidation';
import FieldError from '../components/FieldError';
import { GooglePlacesInput } from '../components/GooglePlacesInput';
import { useAppStore } from '../store/useAppStore';


interface Priority {
  id: string;
  name: string;
  description: string;
}

interface IndianWeddingEvent {
  id: string;
  name: string;
  description: string;
  category: 'pre-wedding' | 'main-wedding' | 'post-wedding' | 'optional';
  duration: string; // e.g., "2-3 hours", "Full day"
  recommended: boolean;
  importance: 'essential' | 'traditional' | 'optional';
  guestType: 'intimate' | 'extended' | 'all';
  timing: 'morning' | 'afternoon' | 'evening' | 'night' | 'flexible';
  venue: 'home' | 'hall' | 'outdoor' | 'temple' | 'flexible';
  emoji: string;
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
    mealTiming?: string;
    dietaryRestrictions: string[];
    mustHaveDishes?: string;
    allergies?: string;
    budgetPerPerson?: string;
    additionalServices?: string[];
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
  events: {
    selectedEvents: string[];
    customEvents: IndianWeddingEvent[];
    aiRecommendations: IndianWeddingEvent[];
  };
}

const WeddingPreferences: React.FC = () => {
  const navigate = useNavigate();
  const { updateWeddingPreferences, blueprint, blueprintId, updateBlueprint } = useAppStore();
  const theme = useAppStore(s => s.theme);
  const isDark = theme === 'dark';
  const [showBlueprint, setShowBlueprint] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [isGenerating, setIsGenerating] = useState(false); // State for blueprint generation
  const [showAIRecommendations, setShowAIRecommendations] = useState(false);
  const [loadedFromSmartPlanner, setLoadedFromSmartPlanner] = useState(false);

  // Validation rules for form fields
  const basicDetailsValidationRules: ValidationRules = {
    yourName: validationRules.required('Your name'),
    partnerName: validationRules.required("Partner's name"),
    contactNumber: validationRules.phone,
    weddingDate: validationRules.dateNotPast,
    guestCount: validationRules.positiveNumber,
    location: validationRules.required('Wedding location'),
    budgetRange: validationRules.required('Budget range')
  };

  const { errors, validateField, validateAll, clearFieldError, markFieldTouched } = useFormValidation(basicDetailsValidationRules);


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
      mealTiming: '',
      dietaryRestrictions: [],
      mustHaveDishes: '',
      allergies: '',
      budgetPerPerson: '',
      additionalServices: []
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
    },
    events: {
      selectedEvents: [],
      customEvents: [],
      aiRecommendations: []
    }
  });

  // Comprehensive Indian Wedding Events Database
  const indianWeddingEvents: IndianWeddingEvent[] = [
    // Pre-Wedding Rituals
    {
      id: 'tilak-ceremony',
      name: 'Tilak/Roka Ceremony',
      description: 'Traditional engagement ceremony where families formally accept the alliance',
      category: 'pre-wedding',
      duration: '2-3 hours',
      recommended: true,
      importance: 'traditional',
      guestType: 'intimate',
      timing: 'morning',
      venue: 'home',
      emoji: '🙏'
    },
    {
      id: 'ring-ceremony',
      name: 'Ring Ceremony (Sagai)',
      description: 'Exchange of rings between the couple in presence of family',
      category: 'pre-wedding',
      duration: '2-3 hours',
      recommended: true,
      importance: 'traditional',
      guestType: 'extended',
      timing: 'evening',
      venue: 'hall',
      emoji: '💍'
    },
    {
      id: 'mehendi',
      name: 'Mehendi Ceremony',
      description: 'Henna application ceremony with music, dance, and celebrations',
      category: 'pre-wedding',
      duration: '4-6 hours',
      recommended: true,
      importance: 'essential',
      guestType: 'extended',
      timing: 'afternoon',
      venue: 'home',
      emoji: '🎨'
    },
    {
      id: 'sangeet',
      name: 'Sangeet Night',
      description: 'Musical night with performances by family and friends',
      category: 'pre-wedding',
      duration: '4-5 hours',
      recommended: true,
      importance: 'essential',
      guestType: 'all',
      timing: 'evening',
      venue: 'hall',
      emoji: '🎵'
    },
    {
      id: 'haldi',
      name: 'Haldi Ceremony',
      description: 'Turmeric paste application for purification and blessing',
      category: 'pre-wedding',
      duration: '2-3 hours',
      recommended: true,
      importance: 'essential',
      guestType: 'intimate',
      timing: 'morning',
      venue: 'home',
      emoji: '🌿'
    },
    {
      id: 'chooda-ceremony',
      name: 'Chooda Ceremony',
      description: 'Traditional bangle ceremony for the bride (North Indian)',
      category: 'pre-wedding',
      duration: '1-2 hours',
      recommended: false,
      importance: 'traditional',
      guestType: 'intimate',
      timing: 'morning',
      venue: 'home',
      emoji: '🔗'
    },
    
    // Main Wedding Day
    {
      id: 'ganesh-puja',
      name: 'Ganesh Puja',
      description: 'Invoking Lord Ganesha for auspicious beginning',
      category: 'main-wedding',
      duration: '1 hour',
      recommended: true,
      importance: 'essential',
      guestType: 'intimate',
      timing: 'morning',
      venue: 'temple',
      emoji: '🐘'
    },
    {
      id: 'baraat',
      name: 'Baraat Procession',
      description: 'Groom\'s grand procession to the wedding venue',
      category: 'main-wedding',
      duration: '2-3 hours',
      recommended: true,
      importance: 'essential',
      guestType: 'all',
      timing: 'morning',
      venue: 'outdoor',
      emoji: '🎠'
    },
    {
      id: 'jaimala',
      name: 'Jaimala/Varmala',
      description: 'Exchange of garlands between bride and groom',
      category: 'main-wedding',
      duration: '30 minutes',
      recommended: true,
      importance: 'essential',
      guestType: 'all',
      timing: 'morning',
      venue: 'hall',
      emoji: '🌺'
    },
    {
      id: 'mandap-ceremony',
      name: 'Mandap Ceremony',
      description: 'Sacred wedding ceremony under the mandap',
      category: 'main-wedding',
      duration: '2-3 hours',
      recommended: true,
      importance: 'essential',
      guestType: 'all',
      timing: 'morning',
      venue: 'hall',
      emoji: '🏛️'
    },
    {
      id: 'saptapadi',
      name: 'Saptapadi (Seven Pheras)',
      description: 'Seven sacred vows around the holy fire',
      category: 'main-wedding',
      duration: '45 minutes',
      recommended: true,
      importance: 'essential',
      guestType: 'all',
      timing: 'morning',
      venue: 'hall',
      emoji: '🔥'
    },
    {
      id: 'sindoor-ceremony',
      name: 'Sindoor & Mangalsutra',
      description: 'Groom applies sindoor and ties mangalsutra',
      category: 'main-wedding',
      duration: '15 minutes',
      recommended: true,
      importance: 'essential',
      guestType: 'all',
      timing: 'morning',
      venue: 'hall',
      emoji: '❤️'
    },
    
    // Post-Wedding Events
    {
      id: 'bidaai',
      name: 'Bidaai Ceremony',
      description: 'Emotional farewell of the bride from her family',
      category: 'post-wedding',
      duration: '1 hour',
      recommended: true,
      importance: 'essential',
      guestType: 'intimate',
      timing: 'afternoon',
      venue: 'home',
      emoji: '😢'
    },
    {
      id: 'ghar-pravesh',
      name: 'Ghar Pravesh',
      description: 'Bride\'s first entry into groom\'s home',
      category: 'post-wedding',
      duration: '2 hours',
      recommended: true,
      importance: 'traditional',
      guestType: 'intimate',
      timing: 'evening',
      venue: 'home',
      emoji: '🏠'
    },
    {
      id: 'reception',
      name: 'Wedding Reception',
      description: 'Grand celebration dinner for extended family and friends',
      category: 'post-wedding',
      duration: '4-5 hours',
      recommended: true,
      importance: 'essential',
      guestType: 'all',
      timing: 'evening',
      venue: 'hall',
      emoji: '🎉'
    },
    {
      id: 'muh-dikhai',
      name: 'Muh Dikhai',
      description: 'Bride meets groom\'s extended family',
      category: 'post-wedding',
      duration: '2-3 hours',
      recommended: false,
      importance: 'traditional',
      guestType: 'extended',
      timing: 'afternoon',
      venue: 'home',
      emoji: '👨‍👩‍👧‍👦'
    },
    
    // Optional/Additional Events
    {
      id: 'cocktail-party',
      name: 'Cocktail Party',
      description: 'Modern celebration with drinks and music',
      category: 'optional',
      duration: '3-4 hours',
      recommended: false,
      importance: 'optional',
      guestType: 'extended',
      timing: 'evening',
      venue: 'hall',
      emoji: '🍸'
    },
    {
      id: 'bachelor-party',
      name: 'Bachelor/Bachelorette',
      description: 'Pre-wedding celebration with friends',
      category: 'optional',
      duration: '4-6 hours',
      recommended: false,
      importance: 'optional',
      guestType: 'intimate',
      timing: 'evening',
      venue: 'flexible',
      emoji: '🎭'
    },
    {
      id: 'prewedding-shoot',
      name: 'Pre-Wedding Photoshoot',
      description: 'Professional photoshoot before wedding',
      category: 'optional',
      duration: '4-6 hours',
      recommended: false,
      importance: 'optional',
      guestType: 'intimate',
      timing: 'flexible',
      venue: 'outdoor',
      emoji: '📸'
    },
    {
      id: 'kanya-daan',
      name: 'Kanya Daan',
      description: 'Father giving away the bride (specific ritual)',
      category: 'main-wedding',
      duration: '30 minutes',
      recommended: true,
      importance: 'traditional',
      guestType: 'all',
      timing: 'morning',
      venue: 'hall',
      emoji: '👨‍👧'
    },
    {
      id: 'aashirwad',
      name: 'Aashirwad Ceremony',
      description: 'Blessing ceremony by elders',
      category: 'post-wedding',
      duration: '1 hour',
      recommended: true,
      importance: 'traditional',
      guestType: 'extended',
      timing: 'morning',
      venue: 'home',
      emoji: '🙌'
    }
  ];

  // AI-powered event recommendation logic
  const getAIEventRecommendations = (eventDuration: string, guestCount: number, budgetRange: string): IndianWeddingEvent[] => {
    const durationDays = parseInt(eventDuration) || 1;
    let recommendations: IndianWeddingEvent[] = [];

    if (durationDays === 1) {
      // Single day wedding - essential events only
      recommendations = indianWeddingEvents.filter(event => 
        event.importance === 'essential' && 
        (event.category === 'main-wedding' || (event.category === 'pre-wedding' && event.id === 'haldi'))
      );
    } else if (durationDays === 2) {
      // Two day wedding - essential + some traditional
      recommendations = indianWeddingEvents.filter(event => 
        event.importance === 'essential' || 
        (event.importance === 'traditional' && ['mehendi', 'sangeet', 'reception'].includes(event.id))
      );
    } else if (durationDays === 3) {
      // Three day wedding - comprehensive celebration
      recommendations = indianWeddingEvents.filter(event => 
        event.importance !== 'optional' || 
        (event.importance === 'optional' && ['cocktail-party'].includes(event.id))
      );
    } else if (durationDays >= 4) {
      // Extended celebration - all events
      recommendations = [...indianWeddingEvents];
    }

    // Filter by guest count
    if (guestCount <= 50) {
      recommendations = recommendations.filter(event => 
        event.guestType === 'intimate' || 
        (event.guestType === 'extended' && event.importance === 'essential')
      );
    } else if (guestCount <= 150) {
      recommendations = recommendations.filter(event => 
        event.guestType !== 'all' || event.importance === 'essential'
      );
    }

    // Filter by budget
    if (budgetRange.includes('5-15')) {
      recommendations = recommendations.filter(event => 
        event.importance === 'essential' || 
        (event.importance === 'traditional' && ['mehendi', 'haldi'].includes(event.id))
      );
    }

    return recommendations.map(event => ({ ...event, recommended: true }));
  };

  // Generate AI recommendations when basic details change
  useEffect(() => {
    if (preferences.basicDetails.eventDuration && preferences.basicDetails.guestCount && preferences.basicDetails.budgetRange) {
      const aiRecommendations = getAIEventRecommendations(
        preferences.basicDetails.eventDuration,
        preferences.basicDetails.guestCount,
        preferences.basicDetails.budgetRange
      );
      
      setPreferences(prev => ({
        ...prev,
        events: {
          ...prev.events,
          aiRecommendations
        }
      }));
      
      setShowAIRecommendations(true);
    }
  }, [preferences.basicDetails.eventDuration, preferences.basicDetails.guestCount, preferences.basicDetails.budgetRange]);

  const toggleEventSelection = (eventId: string) => {
    setPreferences(prev => ({
      ...prev,
      events: {
        ...prev.events,
        selectedEvents: prev.events.selectedEvents.includes(eventId)
          ? prev.events.selectedEvents.filter(id => id !== eventId)
          : [...prev.events.selectedEvents, eventId]
      }
    }));
  };

  const getAITipsForGuestCount = (guestCount: number): string[] => {
    if (guestCount <= 50) {
      return [
        "🏠 Consider intimate venues like boutique hotels, private dining rooms, or family homes",
        "🌿 Garden venues and smaller banquet halls work perfectly for this size",
        "💰 You can focus budget on premium per-person experiences",
        "🎯 Ideal for destination weddings or heritage properties"
      ];
    } else if (guestCount <= 100) {
      return [
        "🏛️ Traditional wedding venues and mid-sized banquet halls are perfect",
        "🌟 Consider hotel ballrooms or community halls with good facilities",
        "⚖️ Balance between intimate feel and grand celebration",
        "🎪 Outdoor venues with weather backup options work well"
      ];
    } else if (guestCount <= 200) {
      return [
        "🏨 Large banquet halls, hotel ballrooms, or convention centers recommended",
        "🎯 Look for venues with multiple spaces for different events",
        "🚗 Ensure adequate parking and accessibility for guests",
        "🍽️ Choose venues with proven large-scale catering capabilities"
      ];
    } else {
      return [
        "🏟️ Premium hotels, resorts, or large convention centers required",
        "🎪 Consider venues that specialize in big Indian weddings",
        "🚌 Plan for guest transportation and accommodation logistics",
        "👥 Venues with dedicated wedding planning teams are essential",
        "🎨 Multiple mandap setups and extensive decoration space needed"
      ];
    }
  };

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
      id: 'events',
      name: 'Wedding Events',
      icon: Calendar,
      description: 'AI-recommended Indian wedding ceremonies and events'
    },
    {
      id: 'blueprint',
      name: 'Wedding Blueprint',
      icon: FileText,
      description: 'AI-generated wedding blueprint',
      disabled: !(preferences.venue.venueType && preferences.theme.selectedTheme)
    }
  ];



  // Import NocoDB service at the top
  const { NocoDBService } = require('../services/nocodb_service');

  // Simple debounce function
  function debounce(func: Function, wait: number) {
    let timeout: NodeJS.Timeout;
    return function executedFunction(this: any, ...args: any[]) {
      const context = this;
      const later = () => {
        // Use a fresh timeout ID for each call
        timeout = setTimeout(() => {
          func.apply(context, args);
        }, wait);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Debounced save function to prevent excessive API calls
  const saveToNocoDB = useCallback(
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
    [] // Empty dependency array since we're using require
  );

  const updatePreference = useCallback((section: keyof WeddingPreferencesData, key: string, value: any, subKey?: string) => {
    // Only validate on blur or after user interaction, not on every keystroke
    // This prevents flickering during typing

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

      const newPreferences = {
        ...prev,
        [section]: updatedSection
      };

      // Auto-save to localStorage using the new state
      localStorage.setItem('weddingPreferences', JSON.stringify(newPreferences));

      // Sync to app store
      updateWeddingPreferences({
        weddingType: newPreferences.theme?.selectedTheme || '',
        city: newPreferences.basicDetails?.location || '',
        guestCount: String(newPreferences.basicDetails?.guestCount || ''),
        weddingStyle: newPreferences.theme?.selectedTheme || '',
        weddingDate: newPreferences.basicDetails?.weddingDate || '',
        budget: newPreferences.basicDetails?.budgetRange || '',
        events: newPreferences.events?.selectedEvents || [],
      });

      // Auto-save to NocoDB (debounced) using the new state
      saveToNocoDB(newPreferences);

      return newPreferences;
    });
  }, [saveToNocoDB, updateWeddingPreferences]);

  // Better number input handling
  const handleNumberChange = useCallback((field: string, value: string) => {
    const numValue = value === '' ? 0 : parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 0) {
      updatePreference('basicDetails', field, numValue);
    }
  }, [updatePreference]);

  useEffect(() => {
    const loadDefaultPreferences = () => {
      try {
        // Pre-fill from blueprint (AI planner) if available
        const bp = blueprint;  // from zustand store
        if (bp && (bp.city || bp.budget || bp.guestCount)) {
          setPreferences(prev => ({
            ...prev,
            basicDetails: {
              ...prev.basicDetails,
              location: bp.city || prev.basicDetails.location,
              guestCount: bp.guestCount ? parseInt(bp.guestCount) || prev.basicDetails.guestCount : prev.basicDetails.guestCount,
              budgetRange: bp.budget || prev.basicDetails.budgetRange,
              weddingDate: bp.date || prev.basicDetails.weddingDate,
            },
            theme: {
              ...prev.theme,
              selectedTheme: bp.theme || prev.theme.selectedTheme,
            },
            events: {
              ...prev.events,
              selectedEvents: bp.events?.length ? bp.events : prev.events.selectedEvents,
            }
          }));
          setLoadedFromSmartPlanner(true);
          console.log('📋 Pre-filled preferences from AI blueprint:', bp);
          return; // Skip localStorage loading since blueprint is more recent
        }

        const savedPreferences = localStorage.getItem('weddingPreferences');
        if (savedPreferences) {
          const parsedPreferences = JSON.parse(savedPreferences);
          console.log('📋 Loading saved preferences:', parsedPreferences);

          // Set basic details
          if (parsedPreferences.basicDetails) {
            Object.keys(parsedPreferences.basicDetails).forEach(key => {
              if (parsedPreferences.basicDetails[key] !== undefined) {
                updatePreference('basicDetails', key, parsedPreferences.basicDetails[key]);
              }
            });
          }

          // Set other sections
          if (parsedPreferences.theme) {
            Object.keys(parsedPreferences.theme).forEach(key => {
              if (parsedPreferences.theme[key] !== undefined) {
                updatePreference('theme', key, parsedPreferences.theme[key]);
              }
            });
          }

          if (parsedPreferences.venue) {
            Object.keys(parsedPreferences.venue).forEach(key => {
              if (parsedPreferences.venue[key] !== undefined) {
                updatePreference('venue', key, parsedPreferences.venue[key]);
              }
            });
          }

          if (parsedPreferences.catering) {
            Object.keys(parsedPreferences.catering).forEach(key => {
              if (parsedPreferences.catering[key] !== undefined) {
                updatePreference('catering', key, parsedPreferences.catering[key]);
              }
            });
          }

          // Load photography preferences with all nested objects
          if (parsedPreferences.photography) {
            const photoPrefs = parsedPreferences.photography;

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

          // Detect if preferences came from Smart Planner (has basicDetails with populated fields)
          if (parsedPreferences.basicDetails?.yourName || parsedPreferences.basicDetails?.location || parsedPreferences.theme?.selectedTheme) {
            setLoadedFromSmartPlanner(true);
          }
        } else {
          console.log('📝 No saved preferences found, using defaults');
        }
      } catch (error) {
        console.error('❌ Error loading preferences:', error);
        // Continue with default values
      }
    };

    loadDefaultPreferences();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updatePreference, blueprint?.city, blueprint?.budget, blueprint?.guestCount, blueprint?.date, blueprint?.theme]);

  // Drag and Drop State
  const [draggedIndex, setDraggedIndex] = useState<number>(-1);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, priority: Priority, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.style.opacity = '0.5';
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.style.opacity = '1';
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

  // Dummy function for blueprint generation
  const handleGenerateBlueprint = () => {
    setIsGenerating(true);
    // Simulate API call or processing
    setTimeout(() => {
      setShowBlueprint(true);
      setIsGenerating(false);
    }, 1500);
  };

  const syncPreferencesToBlueprint = useCallback(() => {
    // Save to localStorage
    localStorage.setItem('weddingPreferences', JSON.stringify(preferences));
    // Sync to legacy store
    updateWeddingPreferences({
      weddingType: preferences.theme?.selectedTheme || '',
      city: preferences.basicDetails?.location || '',
      guestCount: String(preferences.basicDetails?.guestCount || ''),
      weddingStyle: preferences.theme?.selectedTheme || '',
      weddingDate: preferences.basicDetails?.weddingDate || '',
      budget: preferences.basicDetails?.budgetRange || '',
      events: preferences.events?.selectedEvents || [],
    });
    // Also sync to the blueprint store (the source of truth)
    if (blueprintId) {
      updateBlueprint({
        city: preferences.basicDetails?.location || '',
        guestCount: String(preferences.basicDetails?.guestCount || ''),
        budget: preferences.basicDetails?.budgetRange || '',
        date: preferences.basicDetails?.weddingDate || '',
        theme: preferences.theme?.selectedTheme || '',
        events: preferences.events?.selectedEvents || [],
      });
    }
  }, [preferences, blueprintId, updateBlueprint, updateWeddingPreferences]);

  const hasRequiredFields = () => {
    return preferences.venue.venueType && preferences.theme.selectedTheme;
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
      case 'events':
        return preferences.events?.selectedEvents && preferences.events.selectedEvents.length > 0;
      default:
        return false;
    }
  };

  // Mapping theme IDs to image paths with fallbacks
  const themeImages: { [key: string]: string } = {
    'royal-palace-rajasthani': `${process.env.PUBLIC_URL}/rajasthani royal.png`,
    'traditional-regional-roots': `${process.env.PUBLIC_URL}/traditional.png`,
    'vintage-classic': `${process.env.PUBLIC_URL}/vintage.png`,
    'bollywood-glamour': `${process.env.PUBLIC_URL}/bollywoodglamor.png`,
    'minimalist-modern': `${process.env.PUBLIC_URL}/minimalist pastel.png`,
    'luxury-contemporary': `${process.env.PUBLIC_URL}/classic contemporary.png`,
    'eco-friendly-sustainable': `${process.env.PUBLIC_URL}/eco sustainable.png`,
    'floral-paradise': `${process.env.PUBLIC_URL}/floralparadise.png`,
    'bohemian-chic': `${process.env.PUBLIC_URL}/boho.png`,
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
      <div className="container mx-auto px-4 sm:px-6 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Smart Planner Banner */}
          {loadedFromSmartPlanner && (
            <div className={`rounded-xl px-5 py-3 flex items-center justify-between border ${isDark ? 'bg-emerald-900/20 border-emerald-800' : 'bg-emerald-50 border-emerald-200'}`}>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="text-sm text-emerald-800 font-medium">Pre-filled from AI Planner — edit below or skip to continue</span>
              </div>
              <button onClick={() => navigate(blueprintId ? '/blueprint' : '/plan')}
                className="text-xs px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all">
                Skip for now →
              </button>
            </div>
          )}
          {/* Header */}
          <div className={`rounded-2xl p-8 border shadow-sm ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#3D5A3D' }}>
                  <Heart className="w-6 h-6" style={{ color: '#FFFFFF' }} />
                </div>
                <div>
                  <h1 className={`text-xl sm:text-2xl font-bold ${isDark ? 'text-gray-100' : ''}`} style={isDark ? {} : { color: '#3D5A3D' }}>
                    {blueprintId ? 'Edit Preferences' : 'Wedding Preferences'}
                  </h1>
                  <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                    {blueprintId ? 'Fine-tune the details collected by AI — changes auto-sync to your blueprint' : 'Customize your dream wedding experience'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {blueprintId && (
                  <button
                    onClick={() => navigate('/plan')}
                    className={`text-sm px-4 py-2.5 border rounded-xl transition-all flex items-center gap-1.5 ${isDark ? 'border-gray-700 text-gray-400 hover:bg-gray-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                  >
                    <Sparkles className="w-4 h-4" />
                    Back to AI Planner
                  </button>
                )}
                <button
                  onClick={() => {
                    // Save & sync before navigating
                    syncPreferencesToBlueprint();
                    navigate(blueprintId ? '/blueprint' : '/plan');
                  }}
                  className={`text-sm px-4 py-2.5 rounded-xl transition-all ${isDark ? 'bg-gray-700 text-gray-400 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  Skip for now
                </button>
                <button
                  onClick={() => {
                    syncPreferencesToBlueprint();
                    navigate('/vendor-discovery');
                  }}
                  className="bg-rose-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-rose-600 transition-all duration-300 flex items-center gap-2 shadow-sm hover:shadow-md"
                >
                  <Users className="w-5 h-5" />
                  Find Vendors
                </button>
              </div>
            </div>
          </div>

          {/* Find Vendors CTA Section - Appears when preferences are set */}
          {(preferences.basicDetails.yourName && preferences.basicDetails.location && 
            (preferences.venue.venueType || preferences.theme.selectedTheme)) && (
            <div className={`rounded-2xl p-8 border shadow-sm ${isDark ? 'bg-rose-900/20 border-gray-700' : 'bg-rose-50 border-gray-200'}`}>
              <div className="text-center">
                <div className="mb-6">
                  <div className="w-16 h-16 mx-auto mb-4 bg-rose-500 rounded-full flex items-center justify-center">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <h3 className={`text-xl sm:text-2xl font-bold mb-2 ${isDark ? 'text-gray-100' : ''}`} style={isDark ? {} : { color: '#3D5A3D' }}>
                    Ready to Find Your Perfect Vendors?
                  </h3>
                  <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Your preferences are set! Let's discover amazing vendors that match your vision.
                  </p>
                </div>

                {/* Vendor Categories Preview */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                  {[
                    { name: 'Venues', icon: '🏛️', category: 'venues' },
                    { name: 'Photography', icon: '📸', category: 'photography' },
                    { name: 'Catering', icon: '🍽️', category: 'catering' },
                    { name: 'Decoration', icon: '🎨', category: 'decoration' },
                    { name: 'Entertainment', icon: '🎵', category: 'entertainment' },
                    { name: 'Beauty', icon: '💄', category: 'beauty' }
                  ].map((category) => (
                    <div key={category.category} className={`rounded-lg p-4 shadow-sm border hover:shadow-md transition-all duration-300 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                      <div className="text-2xl mb-2">{category.icon}</div>
                      <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{category.name}</p>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => {
                    // Save current preferences before navigating
                    localStorage.setItem('weddingPreferences', JSON.stringify(preferences));
                    updateWeddingPreferences({
                      weddingType: preferences.theme?.selectedTheme || '',
                      city: preferences.basicDetails?.location || '',
                      guestCount: String(preferences.basicDetails?.guestCount || ''),
                      weddingStyle: preferences.theme?.selectedTheme || '',
                      weddingDate: preferences.basicDetails?.weddingDate || '',
                      budget: preferences.basicDetails?.budgetRange || '',
                      events: preferences.events?.selectedEvents || [],
                    });
                    navigate('/vendor-discovery');
                  }}
                  className="bg-rose-500 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-rose-600 transition-all duration-300 flex items-center gap-3 mx-auto shadow-sm hover:shadow-md"
                >
                  <Users className="w-6 h-6" />
                  Find Vendors Now
                  <span className="text-sm bg-white/20 px-2 py-1 rounded-full">Venues First!</span>
                </button>

                <p className={`text-sm mt-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  We'll start with venues and show you vendors for all categories based on your preferences
                </p>
              </div>
            </div>
          )}

          {/* Horizontal Tab Navigation */}
          <div className={`rounded-2xl p-6 border shadow-sm ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
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
                        ? (isDark ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed')
                        : isComplete
                        ? (isDark ? 'bg-sage-900/30 text-sage-400 border border-sage-800 hover:bg-sage-900/40' : 'bg-sage-50 text-sage-700 border border-sage-200 hover:bg-sage-100')
                        : (isDark ? 'bg-gray-700 text-gray-300 border border-gray-600 hover:bg-gray-600' : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100')
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.name}</span>
                    {isComplete && !isActive && (
                      <div className="w-2 h-2 bg-sage-500 rounded-full"></div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div className={`rounded-2xl p-4 sm:p-8 border shadow-sm ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            {/* Basic Details Tab */}
            {activeTab === 'basic' && (
              <div>
                <h2 className={`text-lg sm:text-xl font-bold mb-6 flex items-center ${isDark ? 'text-gray-100' : ''}`} style={isDark ? {} : { color: '#3D5A3D' }}>
                  <Users className="w-5 h-5 mr-2" style={{ color: '#3D5A3D' }} />
                  Wedding Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Basic Information */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Your Name</label>
                    <input
                      type="text"
                      value={preferences.basicDetails.yourName}
                      onChange={(e) => updatePreference('basicDetails', 'yourName', e.target.value)}
                      placeholder="Your name"
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 transition-all duration-300 ${isDark ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500 focus:border-gray-500 focus:ring-gray-500/20' : 'border-gray-200 focus:border-gray-400 focus:ring-gray-400/20'}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Partner's Name</label>
                    <input
                      type="text"
                      value={preferences.basicDetails.partnerName}
                      onChange={(e) => updatePreference('basicDetails', 'partnerName', e.target.value)}
                      placeholder="Partner's name"
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 transition-all duration-300 ${isDark ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500 focus:border-gray-500 focus:ring-gray-500/20' : 'border-gray-200 focus:border-gray-400 focus:ring-gray-400/20'}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Contact Number</label>
                    <input
                      type="tel"
                      value={preferences.basicDetails.contactNumber}
                      onChange={(e) => updatePreference('basicDetails', 'contactNumber', e.target.value)}
                      placeholder="Phone number (e.g., +91 9876543210)"
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 transition-all duration-300 ${isDark ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500 focus:border-gray-500 focus:ring-gray-500/20' : 'border-gray-200 focus:border-gray-400 focus:ring-gray-400/20'}`}
                    />
                  </div>

                  {/* Wedding Date */}
                  <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Wedding Date</label>
                      <div className="relative">
                        <input
                          type="date"
                          value={preferences.basicDetails.weddingDate}
                          onChange={(e) => updatePreference('basicDetails', 'weddingDate', e.target.value)}
                          className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:border-gray-400 focus:ring-2 focus:ring-gray-400/20 transition-all duration-300"
                        />
                        <button
                          onClick={() => window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=Wedding%20Day&dates=${preferences.basicDetails.weddingDate.replace(/-/g, '')}/`, '_blank')}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 text-gray-600 hover:text-gray-800 transition-colors"
                          title="Add to Google Calendar"
                        >
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                          </svg>
                        </button>
                      </div>
                    </div>

                  {/* Event Duration */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Number of Days
                    </label>
                    <select
                      value={preferences.basicDetails.eventDuration}
                      onChange={(e) => updatePreference('basicDetails', 'eventDuration', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 transition-all duration-300 ${isDark ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500 focus:border-gray-500 focus:ring-gray-500/20' : 'border-gray-200 focus:border-gray-400 focus:ring-gray-400/20'}`}
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

                  {/* Dates Flexible */}
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="datesFlexible"
                      checked={preferences.basicDetails.datesFlexible}
                      onChange={(e) => updatePreference('basicDetails', 'datesFlexible', e.target.checked)}
                      className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                    />
                    <label htmlFor="datesFlexible" className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      My dates are flexible
                    </label>
                  </div>

                  {/* Guest Count */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Guest Count</label>
                    <input
                      type="number"
                      min="1"
                      value={preferences.basicDetails.guestCount}
                      onChange={(e) => handleNumberChange('guestCount', e.target.value)}
                      placeholder="Number of guests"
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 transition-all duration-300 ${isDark ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500 focus:border-gray-500 focus:ring-gray-500/20' : 'border-gray-200 focus:border-gray-400 focus:ring-gray-400/20'}`}
                    />
                  </div>

                  {/* Location with Google Places API */}
                  <div>
                    <GooglePlacesInput
                      label="Wedding Location"
                      value={preferences.basicDetails.location}
                      onChange={(location, placeDetails) => {
                        updatePreference('basicDetails', 'location', location);
                        // Store additional place details for venue recommendations
                        if (placeDetails) {
                          console.log('Selected place:', placeDetails);
                          // You can store place_id, rating, coordinates, etc.
                          updatePreference('basicDetails', 'locationDetails', {
                            place_id: placeDetails.place_id,
                            name: placeDetails.name,
                            rating: placeDetails.rating,
                            types: placeDetails.types,
                            coordinates: placeDetails.geometry?.location
                          });
                        }
                      }}
                      placeholder="Search for cities, venues, banquet halls, hotels..."
                      types={['establishment', 'locality', 'sublocality', 'administrative_area_level_2']}
                      country="IN"
                    />
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => window.open(`/vendors?location=${encodeURIComponent(preferences.basicDetails.location)}`, '_blank')}
                        className={`px-3 py-1.5 text-xs rounded-lg transition-colors flex items-center gap-1 ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                      >
                        🗺️ Search Venues
                      </button>
                      <button
                        onClick={() => window.open('/messages', '_blank')}
                        className="px-3 py-1.5 text-xs bg-sage-100 text-sage-700 rounded-lg hover:bg-sage-200 transition-colors flex items-center gap-1"
                      >
                        📅 Schedule Visit
                      </button>
                    </div>
                  </div>

                  {/* Budget Range */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Budget Range</label>
                    <select
                      value={preferences.basicDetails.budgetRange}
                      onChange={(e) => updatePreference('basicDetails', 'budgetRange', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 transition-all duration-300 ${isDark ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500 focus:border-gray-500 focus:ring-gray-500/20' : 'border-gray-200 focus:border-gray-400 focus:ring-gray-400/20'}`}
                    >
                      <option value="">Select budget range</option>
                      <option value="₹5-15 Lakhs">₹5-15 Lakhs (Budget)</option>
                      <option value="₹15-30 Lakhs">₹15-30 Lakhs (Premium)</option>
                      <option value="₹30-50 Lakhs">₹30-50 Lakhs (Luxury)</option>
                      <option value="₹50+ Lakhs">₹50+ Lakhs (Ultra Luxury)</option>
                    </select>
                  </div>
                </div>

                {/* Priority Ranking Section */}
                <div className="mt-6">
                  <div className="mb-4">
                    <h3 className={`text-lg font-semibold mb-1 ${isDark ? 'text-gray-100' : ''}`} style={isDark ? {} : { color: '#3D5A3D' }}>
                      🎯 Wedding Priorities
                    </h3>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Drag to reorder by importance (most important at top)
                    </p>
                  </div>

                  <div className="bg-rose-50 p-3 rounded-xl border border-rose-100">
                    <div className="space-y-1.5">
                      {preferences.basicDetails.priorities.map((priority, index) => (
                        <div
                          key={priority.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, priority, index)}
                          onDragEnd={handleDragEnd}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, index)}
                          className={`rounded-lg p-2.5 border cursor-move transition-all duration-200 hover:shadow-sm hover:border-pink-300 group ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'} ${
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
                                <h4 className={`font-medium group-hover:text-pink-700 transition-colors text-sm truncate ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
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
                                    className="w-1.5 h-1.5 rounded-full bg-rose-400"
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
                          <div><strong className="text-rose-600">2nd:</strong> {preferences.basicDetails.priorities[1]?.name.replace(/🏛️|📸|🍽️|🎨|🎵|👗|🌸|🚗/g, '').trim()}</div>
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
                  <h2 className={`text-lg sm:text-xl font-bold flex items-center ${isDark ? 'text-gray-100' : ''}`} style={isDark ? {} : { color: '#3D5A3D' }}>
                    <Building2 className="w-5 h-5 mr-2" style={{ color: '#3D5A3D' }} />
                    Venue Selection
                  </h2>
                </div>
                <div className="space-y-8">
                  {venueCategories.map((category) => (
                    <div key={category.id} className="space-y-4">
                      <div className={`border-b pb-2 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                        <h3 className={`text-lg font-semibold ${isDark ? 'text-gray-100' : ''}`} style={isDark ? {} : { color: '#3D5A3D' }}>
                          {category.name}
                        </h3>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{category.description}</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {category.venues.map((venue) => (
                          <div
                            key={venue.id}
                            onClick={() => updatePreference('venue', 'venueType', venue.id)}
                            className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-300 hover:shadow-md ${
                              preferences.venue.venueType === venue.id
                                ? 'border-deep-navy bg-deep-navy/5 shadow-md'
                                : (isDark ? 'border-gray-600 hover:border-gray-500' : 'border-gray-200 hover:border-gray-300')
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
                            <h4 className={`font-semibold text-base mb-1 ${isDark ? 'text-gray-100' : ''}`} style={isDark ? {} : { color: '#3D5A3D' }}>
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
                  <h2 className={`text-lg sm:text-xl font-bold flex items-center ${isDark ? 'text-gray-100' : ''}`} style={isDark ? {} : { color: '#3D5A3D' }}>
                    <Palette className="w-5 h-5 mr-2" style={{ color: '#3D5A3D' }} />
                    Wedding Theme Selection
                  </h2>
                  <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Choose from our curated collection of wedding themes, organized by style and aesthetic</p>
                </div>
                <div className="space-y-8">
                  {themeCategories.map((category) => (
                    <div key={category.id} className="space-y-4">
                      <div className={`border-b pb-2 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                        <h3 className={`text-lg font-semibold ${isDark ? 'text-gray-100' : ''}`} style={isDark ? {} : { color: '#3D5A3D' }}>
                          {category.name}
                        </h3>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{category.description}</p>
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
                                  : (isDark ? 'border-gray-600 hover:border-gray-500' : 'border-gray-200 hover:border-gray-300')
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
                              <h4 className="font-semibold text-base mb-2" style={{ color: '#3D5A3D' }}>
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
              <div className="space-y-8">
                <h2 className={`text-lg sm:text-xl font-bold mb-6 flex items-center ${isDark ? 'text-gray-100' : ''}`} style={isDark ? {} : { color: '#3D5A3D' }}>
                  <Utensils className="w-5 h-5 mr-2" style={{ color: '#3D5A3D' }} />
                  Catering Preferences
                </h2>

                {/* Basic Catering Preferences */}
                <div className="bg-gray-50 p-6 rounded-xl">
                  <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-gray-100' : ''}`} style={isDark ? {} : { color: '#3D5A3D' }}>Cuisine & Service Style</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Primary Cuisine Type</label>
                      <select
                        value={preferences.catering.cuisine}
                        onChange={(e) => updatePreference('catering', 'cuisine', e.target.value)}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 transition-all duration-300 ${isDark ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500 focus:border-gray-500 focus:ring-gray-500/20' : 'border-gray-200 focus:border-gray-400 focus:ring-gray-400/20'}`}
                      >
                        <option value="">Select cuisine</option>
                        <option value="north-indian">North Indian</option>
                        <option value="south-indian">South Indian</option>
                        <option value="gujarati">Gujarati</option>
                        <option value="punjabi">Punjabi</option>
                        <option value="bengali">Bengali</option>
                        <option value="marathi">Marathi</option>
                        <option value="multi-cuisine">Multi-Cuisine Indian</option>
                        <option value="continental">Continental</option>
                        <option value="chinese">Chinese</option>
                        <option value="italian">Italian</option>
                        <option value="mexican">Mexican</option>
                        <option value="fusion">Indo-Fusion</option>
                        <option value="international">International</option>
                      </select>
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Service Style</label>
                      <select
                        value={preferences.catering.mealType}
                        onChange={(e) => updatePreference('catering', 'mealType', e.target.value)}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 transition-all duration-300 ${isDark ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500 focus:border-gray-500 focus:ring-gray-500/20' : 'border-gray-200 focus:border-gray-400 focus:ring-gray-400/20'}`}
                      >
                        <option value="">Select service style</option>
                        <option value="buffet">Buffet Style</option>
                        <option value="plated">Plated Service</option>
                        <option value="family-style">Family Style</option>
                        <option value="cocktail">Cocktail Reception</option>
                        <option value="mixed">Mixed Service</option>
                      </select>
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Meal Times</label>
                      <select
                        value={preferences.catering.mealTiming || ''}
                        onChange={(e) => updatePreference('catering', 'mealTiming', e.target.value)}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 transition-all duration-300 ${isDark ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500 focus:border-gray-500 focus:ring-gray-500/20' : 'border-gray-200 focus:border-gray-400 focus:ring-gray-400/20'}`}
                      >
                        <option value="">Select meal timing</option>
                        <option value="breakfast">Breakfast</option>
                        <option value="lunch">Lunch</option>
                        <option value="evening-snacks">Evening Snacks</option>
                        <option value="dinner">Dinner</option>
                        <option value="lunch-dinner">Lunch & Dinner</option>
                        <option value="all-meals">All Meals</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Dietary Requirements */}
                <div className="bg-gray-50 p-6 rounded-xl">
                  <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-gray-100' : ''}`} style={isDark ? {} : { color: '#3D5A3D' }}>Dietary Requirements</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      'Vegetarian Only',
                      'Vegan Options',
                      'Jain Food',
                      'Gluten-Free',
                      'Dairy-Free',
                      'No Onion/Garlic',
                      'Halal',
                      'Kosher',
                      'Diabetic-Friendly',
                      'Low-Sodium',
                      'Organic',
                      'No Special Requirements'
                    ].map((restriction) => (
                      <label key={restriction} className={`flex items-center space-x-2 p-3 rounded-lg border cursor-pointer ${isDark ? 'bg-gray-700 border-gray-600 hover:border-gray-500' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                        <input 
                          type="checkbox" 
                          checked={preferences.catering.dietaryRestrictions?.includes(restriction) || false}
                          onChange={(e) => {
                            const current = preferences.catering.dietaryRestrictions || [];
                            const updated = e.target.checked
                              ? [...current, restriction]
                              : current.filter(r => r !== restriction);
                            updatePreference('catering', 'dietaryRestrictions', updated);
                          }}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">{restriction}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Special Menu Items */}
                <div className="bg-gray-50 p-6 rounded-xl">
                  <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-gray-100' : ''}`} style={isDark ? {} : { color: '#3D5A3D' }}>Special Menu Preferences</h3>
                  <div className="space-y-4">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Must-Have Dishes</label>
                      <textarea
                        value={preferences.catering.mustHaveDishes || ''}
                        onChange={(e) => updatePreference('catering', 'mustHaveDishes', e.target.value)}
                        placeholder="List any specific dishes or items that must be included..."
                        rows={3}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 transition-all duration-300 ${isDark ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500 focus:border-gray-500 focus:ring-gray-500/20' : 'border-gray-200 focus:border-gray-400 focus:ring-gray-400/20'}`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Food Allergies or Restrictions</label>
                      <textarea
                        value={preferences.catering.allergies || ''}
                        onChange={(e) => updatePreference('catering', 'allergies', e.target.value)}
                        placeholder="List any food allergies or specific restrictions for guests..."
                        rows={2}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 transition-all duration-300 ${isDark ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500 focus:border-gray-500 focus:ring-gray-500/20' : 'border-gray-200 focus:border-gray-400 focus:ring-gray-400/20'}`}
                      />
                    </div>
                  </div>
                </div>

                {/* Catering Budget */}
                <div className="bg-gray-50 p-6 rounded-xl">
                  <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-gray-100' : ''}`} style={isDark ? {} : { color: '#3D5A3D' }}>Catering Budget</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Budget Per Person</label>
                      <select
                        value={preferences.catering.budgetPerPerson || ''}
                        onChange={(e) => updatePreference('catering', 'budgetPerPerson', e.target.value)}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 transition-all duration-300 ${isDark ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500 focus:border-gray-500 focus:ring-gray-500/20' : 'border-gray-200 focus:border-gray-400 focus:ring-gray-400/20'}`}
                      >
                        <option value="">Select budget per person</option>
                        <option value="₹500-800">₹500-800 (Basic)</option>
                        <option value="₹800-1200">₹800-1200 (Standard)</option>
                        <option value="₹1200-1800">₹1200-1800 (Premium)</option>
                        <option value="₹1800-2500">₹1800-2500 (Luxury)</option>
                        <option value="₹2500+">₹2500+ (Ultra Luxury)</option>
                      </select>
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Additional Services</label>
                      <div className="space-y-2">
                        {['Bar Service', 'Live Counters', 'Welcome Drinks', 'Late Night Snacks'].map((service) => (
                          <label key={service} className="flex items-center space-x-2">
                            <input 
                              type="checkbox" 
                              checked={preferences.catering.additionalServices?.includes(service) || false}
                              onChange={(e) => {
                                const current = preferences.catering.additionalServices || [];
                                const updated = e.target.checked
                                  ? [...current, service]
                                  : current.filter(s => s !== service);
                                updatePreference('catering', 'additionalServices', updated);
                              }}
                              className="rounded border-gray-300"
                            />
                            <span className="text-sm">{service}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Photography Tab */}
            {activeTab === 'photography' && (
              <div className="space-y-8">
                <h2 className={`text-lg sm:text-xl font-bold mb-6 flex items-center ${isDark ? 'text-gray-100' : ''}`} style={isDark ? {} : { color: '#3D5A3D' }}>
                  <Camera className="w-5 h-5 mr-2" style={{ color: '#3D5A3D' }} />
                  Photography & Videography Preferences
                </h2>

                {/* Basic Photography Preferences */}
                <div className="bg-gray-50 p-6 rounded-xl">
                  <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-gray-100' : ''}`} style={isDark ? {} : { color: '#3D5A3D' }}>Basic Photography</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Photography Style</label>
                      <select
                        value={preferences.photography.style}
                        onChange={(e) => updatePreference('photography', 'style', e.target.value)}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 transition-all duration-300 ${isDark ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500 focus:border-gray-500 focus:ring-gray-500/20' : 'border-gray-200 focus:border-gray-400 focus:ring-gray-400/20'}`}
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
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Coverage Type</label>
                      <select
                        value={preferences.photography.coverage}
                        onChange={(e) => updatePreference('photography', 'coverage', e.target.value)}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 transition-all duration-300 ${isDark ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500 focus:border-gray-500 focus:ring-gray-500/20' : 'border-gray-200 focus:border-gray-400 focus:ring-gray-400/20'}`}
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
                  <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-gray-100' : ''}`} style={isDark ? {} : { color: '#3D5A3D' }}>Multi-Day Coverage</h3>
                  <p className={`mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Select which events you would like photographed:</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <label className={`flex items-center space-x-2 p-3 rounded-lg border cursor-pointer ${isDark ? 'bg-gray-700 border-gray-600 hover:border-gray-500' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                      <input 
                        type="checkbox" 
                        checked={preferences.photography.multiDayCoverage?.preWeddingShoot || false}
                        onChange={(e) => updatePreference('photography', 'multiDayCoverage', e.target.checked, 'preWeddingShoot')}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">Pre-Wedding Shoot</span>
                    </label>
                    <label className={`flex items-center space-x-2 p-3 rounded-lg border cursor-pointer ${isDark ? 'bg-gray-700 border-gray-600 hover:border-gray-500' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                      <input 
                        type="checkbox" 
                        checked={preferences.photography.multiDayCoverage?.engagementShoot || false}
                        onChange={(e) => updatePreference('photography', 'multiDayCoverage', e.target.checked, 'engagementShoot')}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">Engagement Shoot</span>
                    </label>
                    <label className={`flex items-center space-x-2 p-3 rounded-lg border cursor-pointer ${isDark ? 'bg-gray-700 border-gray-600 hover:border-gray-500' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                      <input 
                        type="checkbox" 
                        checked={preferences.photography.multiDayCoverage?.mehendiCeremony || false}
                        onChange={(e) => updatePreference('photography', 'multiDayCoverage', e.target.checked, 'mehendiCeremony')}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">Mehendi Ceremony</span>
                    </label>
                    <label className={`flex items-center space-x-2 p-3 rounded-lg border cursor-pointer ${isDark ? 'bg-gray-700 border-gray-600 hover:border-gray-500' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                      <input 
                        type="checkbox" 
                        checked={preferences.photography.multiDayCoverage?.haldiCeremony || false}
                        onChange={(e) => updatePreference('photography', 'multiDayCoverage', e.target.checked, 'haldiCeremony')}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">Haldi Ceremony</span>
                    </label>
                    <label className={`flex items-center space-x-2 p-3 rounded-lg border cursor-pointer ${isDark ? 'bg-gray-700 border-gray-600 hover:border-gray-500' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                      <input 
                        type="checkbox" 
                        checked={preferences.photography.multiDayCoverage?.sangeetCeremony || false}
                        onChange={(e) => updatePreference('photography', 'multiDayCoverage', e.target.checked, 'sangeetCeremony')}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">Sangeet Ceremony</span>
                    </label>
                    <label className={`flex items-center space-x-2 p-3 rounded-lg border cursor-pointer ${isDark ? 'bg-gray-700 border-gray-600 hover:border-gray-500' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                      <input 
                        type="checkbox" 
                        checked={preferences.photography.multiDayCoverage?.weddingCeremony || false}
                        onChange={(e) => updatePreference('photography', 'multiDayCoverage', e.target.checked, 'weddingCeremony')}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">Wedding Ceremony</span>
                    </label>
                    <label className={`flex items-center space-x-2 p-3 rounded-lg border cursor-pointer ${isDark ? 'bg-gray-700 border-gray-600 hover:border-gray-500' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                      <input 
                        type="checkbox" 
                        checked={preferences.photography.multiDayCoverage?.reception || false}
                        onChange={(e) => updatePreference('photography', 'multiDayCoverage', e.target.checked, 'reception')}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">Reception</span>
                    </label>
                    <label className={`flex items-center space-x-2 p-3 rounded-lg border cursor-pointer ${isDark ? 'bg-gray-700 border-gray-600 hover:border-gray-500' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
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
                  <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-gray-100' : ''}`} style={isDark ? {} : { color: '#3D5A3D' }}>Videography Services</h3>
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
                          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Video Style</label>
                          <select
                            value={preferences.photography.videography?.style || ''}
                            onChange={(e) => updatePreference('photography', 'videography', e.target.value, 'style')}
                            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 transition-all duration-300 ${isDark ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500 focus:border-gray-500 focus:ring-gray-500/20' : 'border-gray-200 focus:border-gray-400 focus:ring-gray-400/20'}`}
                          >
                            <option value="">Select video style</option>
                            <option value="cinematic">Cinematic</option>
                            <option value="documentary">Documentary</option>
                            <option value="traditional">Traditional</option>
                            <option value="artistic">Artistic</option>
                          </select>
                        </div>
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Coverage Duration</label>
                          <select
                            value={preferences.photography.videography?.coverageDuration || ''}
                            onChange={(e) => updatePreference('photography', 'videography', e.target.value, 'coverageDuration')}
                            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 transition-all duration-300 ${isDark ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500 focus:border-gray-500 focus:ring-gray-500/20' : 'border-gray-200 focus:border-gray-400 focus:ring-gray-400/20'}`}
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
                  <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-gray-100' : ''}`} style={isDark ? {} : { color: '#3D5A3D' }}>Cultural Ceremony Coverage</h3>
                  <p className={`mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Select cultural elements you want captured:</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <label className={`flex items-center space-x-2 p-3 rounded-lg border cursor-pointer ${isDark ? 'bg-gray-700 border-gray-600 hover:border-gray-500' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                      <input 
                        type="checkbox" 
                        checked={preferences.photography.culturalCoverage.mandapCeremony}
                        onChange={(e) => updatePreference('photography', 'culturalCoverage', e.target.checked, 'mandapCeremony')}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">Mandap Ceremony</span>
                    </label>
                    <label className={`flex items-center space-x-2 p-3 rounded-lg border cursor-pointer ${isDark ? 'bg-gray-700 border-gray-600 hover:border-gray-500' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                      <input 
                        type="checkbox" 
                        checked={preferences.photography.culturalCoverage.agniCeremony}
                        onChange={(e) => updatePreference('photography', 'culturalCoverage', e.target.checked, 'agniCeremony')}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">Agni Ceremony</span>
                    </label>
                    <label className={`flex items-center space-x-2 p-3 rounded-lg border cursor-pointer ${isDark ? 'bg-gray-700 border-gray-600 hover:border-gray-500' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                      <input 
                        type="checkbox" 
                        checked={preferences.photography.culturalCoverage.familyPortraits}
                        onChange={(e) => updatePreference('photography', 'culturalCoverage', e.target.checked, 'familyPortraits')}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">Family Portraits</span>
                    </label>
                    <label className={`flex items-center space-x-2 p-3 rounded-lg border cursor-pointer ${isDark ? 'bg-gray-700 border-gray-600 hover:border-gray-500' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                      <input 
                        type="checkbox" 
                        checked={preferences.photography.culturalCoverage.traditionalAttire}
                        onChange={(e) => updatePreference('photography', 'culturalCoverage', e.target.checked, 'traditionalAttire')}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">Traditional Attire</span>
                    </label>
                    <label className={`flex items-center space-x-2 p-3 rounded-lg border cursor-pointer ${isDark ? 'bg-gray-700 border-gray-600 hover:border-gray-500' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
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
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Specific Rituals to Capture</label>
                    <textarea
                      value={preferences.photography.culturalCoverage.specificRituals.join(', ')}
                      onChange={(e) => updatePreference('photography', 'culturalCoverage', e.target.value.split(',').map(s => s.trim()).filter(s => s), 'specificRituals')}
                      placeholder="List any specific rituals, ceremonies, or moments you want captured (comma-separated)..."
                      rows={3}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 transition-all duration-300 ${isDark ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500 focus:border-gray-500 focus:ring-gray-500/20' : 'border-gray-200 focus:border-gray-400 focus:ring-gray-400/20'}`}
                    />
                  </div>
                </div>

                {/* Deliverables */}
                <div className="bg-gray-50 p-6 rounded-xl">
                  <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-gray-100' : ''}`} style={isDark ? {} : { color: '#3D5A3D' }}>Final Deliverables</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <label className={`flex items-center space-x-2 p-3 rounded-lg border cursor-pointer ${isDark ? 'bg-gray-700 border-gray-600 hover:border-gray-500' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                      <input 
                        type="checkbox" 
                        checked={preferences.photography.deliverables.digitalGallery}
                        onChange={(e) => updatePreference('photography', 'deliverables', e.target.checked, 'digitalGallery')}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">Digital Gallery</span>
                    </label>
                    <label className={`flex items-center space-x-2 p-3 rounded-lg border cursor-pointer ${isDark ? 'bg-gray-700 border-gray-600 hover:border-gray-500' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                      <input 
                        type="checkbox" 
                        checked={preferences.photography.deliverables.physicalAlbum}
                        onChange={(e) => updatePreference('photography', 'deliverables', e.target.checked, 'physicalAlbum')}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">Physical Album</span>
                    </label>
                    <label className={`flex items-center space-x-2 p-3 rounded-lg border cursor-pointer ${isDark ? 'bg-gray-700 border-gray-600 hover:border-gray-500' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                      <input 
                        type="checkbox" 
                        checked={preferences.photography.deliverables.videoHighlights}
                        onChange={(e) => updatePreference('photography', 'deliverables', e.target.checked, 'videoHighlights')}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">Video Highlights</span>
                    </label>
                    <label className={`flex items-center space-x-2 p-3 rounded-lg border cursor-pointer ${isDark ? 'bg-gray-700 border-gray-600 hover:border-gray-500' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                      <input 
                        type="checkbox" 
                        checked={preferences.photography.deliverables.fullVideo}
                        onChange={(e) => updatePreference('photography', 'deliverables', e.target.checked, 'fullVideo')}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">Full Video</span>
                    </label>
                    <label className={`flex items-center space-x-2 p-3 rounded-lg border cursor-pointer ${isDark ? 'bg-gray-700 border-gray-600 hover:border-gray-500' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                      <input 
                        type="checkbox" 
                        checked={preferences.photography.deliverables.prints}
                        onChange={(e) => updatePreference('photography', 'deliverables', e.target.checked, 'prints')}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">Prints</span>
                    </label>
                    <label className={`flex items-center space-x-2 p-3 rounded-lg border cursor-pointer ${isDark ? 'bg-gray-700 border-gray-600 hover:border-gray-500' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
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
                  <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-gray-100' : ''}`} style={isDark ? {} : { color: '#3D5A3D' }}>Technical Preferences</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Equipment Preference</label>
                      <select
                        value={preferences.photography.technicalPreferences.equipmentType}
                        onChange={(e) => updatePreference('photography', 'technicalPreferences', e.target.value, 'equipmentType')}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 transition-all duration-300 ${isDark ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500 focus:border-gray-500 focus:ring-gray-500/20' : 'border-gray-200 focus:border-gray-400 focus:ring-gray-400/20'}`}
                      >
                        <option value="">Select equipment</option>
                        <option value="dslr">DSLR</option>
                        <option value="mirrorless">Mirrorless</option>
                        <option value="film">Film</option>
                        <option value="mixed">Mixed</option>
                      </select>
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Lighting Style</label>
                      <select
                        value={preferences.photography.technicalPreferences.lightingStyle}
                        onChange={(e) => updatePreference('photography', 'technicalPreferences', e.target.value, 'lightingStyle')}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 transition-all duration-300 ${isDark ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500 focus:border-gray-500 focus:ring-gray-500/20' : 'border-gray-200 focus:border-gray-400 focus:ring-gray-400/20'}`}
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
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Editing Style</label>
                      <select
                        value={preferences.photography.technicalPreferences.editingStyle}
                        onChange={(e) => updatePreference('photography', 'technicalPreferences', e.target.value, 'editingStyle')}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 transition-all duration-300 ${isDark ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500 focus:border-gray-500 focus:ring-gray-500/20' : 'border-gray-200 focus:border-gray-400 focus:ring-gray-400/20'}`}
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
                  <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-gray-100' : ''}`} style={isDark ? {} : { color: '#3D5A3D' }}>Photography Budget</h3>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Budget Range for Photography & Videography</label>
                    <select
                      value={preferences.photography.budgetRange}
                      onChange={(e) => updatePreference('photography', 'budgetRange', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 transition-all duration-300 ${isDark ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500 focus:border-gray-500 focus:ring-gray-500/20' : 'border-gray-200 focus:border-gray-400 focus:ring-gray-400/20'}`}
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
                  <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-gray-100' : ''}`} style={isDark ? {} : { color: '#3D5A3D' }}>Special Requests</h3>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Additional Requirements</label>
                    <textarea
                      value={preferences.photography.specialRequests}
                      onChange={(e) => updatePreference('photography', 'specialRequests', e.target.value)}
                      placeholder="Any special photography or videography requests, specific shots, or additional requirements..."
                      rows={4}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 transition-all duration-300 ${isDark ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500 focus:border-gray-500 focus:ring-gray-500/20' : 'border-gray-200 focus:border-gray-400 focus:ring-gray-400/20'}`}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Wedding Events Tab */}
            {activeTab === 'events' && (
              <div className="space-y-8">
                <h2 className={`text-lg sm:text-xl font-bold mb-6 flex items-center ${isDark ? 'text-gray-100' : ''}`} style={isDark ? {} : { color: '#3D5A3D' }}>
                  <Calendar className="w-5 h-5 mr-2" style={{ color: '#3D5A3D' }} />
                  Wedding Events & Ceremonies
                </h2>

                {/* AI Tips for Guest Count */}
                {preferences.basicDetails.guestCount > 0 && (
                  <div className={`rounded-2xl p-6 border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-gray-600' : 'bg-gray-100'}`}>
                        <Sparkles className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                      </div>
                      <div>
                        <h3 className={`text-lg font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                          AI Venue Tips for {preferences.basicDetails.guestCount} Guests
                        </h3>
                        <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Based on your guest count and Indian wedding requirements</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {getAITipsForGuestCount(preferences.basicDetails.guestCount).map((tip, index) => (
                        <div key={index} className={`flex items-start gap-2 rounded-lg p-3 ${isDark ? 'bg-gray-600/50' : 'bg-white/50'}`}>
                          <div className="w-2 h-2 rounded-full bg-gray-500 mt-2 flex-shrink-0"></div>
                          <span className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{tip}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Event Recommendations */}
                {showAIRecommendations && preferences.events.aiRecommendations.length > 0 && (
                  <div className="bg-sage-50 rounded-2xl p-6 border border-sage-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-sage-100 flex items-center justify-center">
                          <Sparkles className="w-5 h-5 text-sage-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-sage-900">
                            AI Recommended Events ({preferences.basicDetails.eventDuration} day{parseInt(preferences.basicDetails.eventDuration) !== 1 ? 's' : ''})
                          </h3>
                          <p className="text-sm text-sage-700">Perfect for your {preferences.basicDetails.guestCount} guests and {preferences.basicDetails.budgetRange} budget</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          const allRecommendedIds = preferences.events.aiRecommendations.map(e => e.id);
                          setPreferences(prev => ({
                            ...prev,
                            events: {
                              ...prev.events,
                              selectedEvents: allRecommendedIds
                            }
                          }));
                        }}
                        className="px-4 py-2 bg-sage-600 text-white rounded-lg hover:bg-sage-700 transition-colors text-sm"
                      >
                        Select All Recommended
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {preferences.events.aiRecommendations.map((event) => (
                        <div 
                          key={event.id} 
                          className="bg-white/50 rounded-lg p-3 border border-sage-200"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">{event.emoji}</span>
                            <span className="font-medium text-sage-900 text-sm">{event.name}</span>
                          </div>
                          <p className="text-xs text-sage-700">{event.description}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-sage-600">
                              {event.duration} • {event.importance}
                            </span>
                            <button
                              onClick={() => toggleEventSelection(event.id)}
                              className={`px-2 py-1 rounded text-xs transition-colors ${
                                preferences.events.selectedEvents.includes(event.id)
                                  ? 'bg-sage-600 text-white'
                                  : 'bg-white border border-sage-600 text-sage-600 hover:bg-sage-50'
                              }`}
                            >
                              {preferences.events.selectedEvents.includes(event.id) ? 'Selected' : 'Select'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* All Events by Category */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className={`text-lg font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>All Indian Wedding Events</h3>
                    <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {preferences.events.selectedEvents.length} events selected
                    </div>
                  </div>

                  {['pre-wedding', 'main-wedding', 'post-wedding', 'optional'].map((category) => {
                    const categoryEvents = indianWeddingEvents.filter(event => event.category === category);
                    const categoryNames = {
                      'pre-wedding': '🎭 Pre-Wedding Ceremonies',
                      'main-wedding': '👰 Main Wedding Day',
                      'post-wedding': '🎊 Post-Wedding Events',
                      'optional': '🎪 Optional Celebrations'
                    };

                    return (
                      <div key={category} className={`rounded-2xl p-6 border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                        <h4 className={`text-lg font-semibold mb-4 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                          {categoryNames[category as keyof typeof categoryNames]}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {categoryEvents.map((event) => {
                            const isSelected = preferences.events.selectedEvents.includes(event.id);
                            const isRecommended = preferences.events.aiRecommendations.some(rec => rec.id === event.id);
                            
                            return (
                              <div 
                                key={event.id}
                                className={`relative rounded-lg p-4 border-2 transition-all duration-300 cursor-pointer ${
                                  isSelected
                                    ? (isDark ? 'border-rose-500 bg-rose-900/30' : 'border-rose-500 bg-rose-50')
                                    : (isDark ? 'border-gray-600 bg-gray-700 hover:border-gray-500' : 'border-gray-200 bg-white hover:border-gray-300')
                                }`}
                                onClick={() => toggleEventSelection(event.id)}
                              >
                                {isRecommended && (
                                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-sage-500 rounded-full flex items-center justify-center">
                                    <Sparkles className="w-3 h-3 text-white" />
                                  </div>
                                )}
                                
                                <div className="flex items-start gap-3">
                                  <span className="text-2xl">{event.emoji}</span>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h5 className={`font-medium ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{event.name}</h5>
                                      <span className={`px-2 py-1 text-xs rounded-full ${
                                        event.importance === 'essential' ? 'bg-red-100 text-red-700' :
                                        event.importance === 'traditional' ? 'bg-rose-100 text-rose-700' :
                                        'bg-gray-100 text-gray-700'
                                      }`}>
                                        {event.importance}
                                      </span>
                                    </div>
                                    <p className={`text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{event.description}</p>
                                    <div className={`flex items-center gap-4 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                      <span>⏱️ {event.duration}</span>
                                      <span>👥 {event.guestType}</span>
                                      <span>📍 {event.venue}</span>
                                    </div>
                                  </div>
                                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                    isSelected
                                      ? 'border-rose-500 bg-rose-500'
                                      : 'border-gray-300'
                                  }`}>
                                    {isSelected && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Wedding Blueprint Tab */}
            {activeTab === 'blueprint' && (
              <div>
                <h2 className={`text-lg sm:text-xl font-bold mb-6 flex items-center ${isDark ? 'text-gray-100' : ''}`} style={isDark ? {} : { color: '#3D5A3D' }}>
                  <FileText className="w-5 h-5 mr-2" style={{ color: '#3D5A3D' }} />
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
                      <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Generate Your Wedding Blueprint</h3>
                      <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Create a comprehensive AI-generated wedding blueprint based on your preferences.
                      </p>
                    </div>

                    {!(preferences.venue.venueType && preferences.theme.selectedTheme) && (
                      <div className={`rounded-lg p-4 mb-6 border ${isDark ? 'bg-rose-900/30 border-rose-800' : 'bg-rose-50 border-rose-200'}`}>
                        <p className="text-rose-800 text-sm">
                          ⚠️ <strong>Note:</strong> Venue Type and Decor & Theme selections are required for blueprint generation. 
                          Other fields are optional but recommended for a complete blueprint.
                        </p>
                      </div>
                    )}

                    <div className="space-y-4">
                      <button
                        onClick={handleGenerateBlueprint}
                        disabled={isGenerating || !hasRequiredFields()}
                        className="w-full bg-rose-500 text-white py-4 px-8 rounded-xl font-semibold hover:bg-rose-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Generating Blueprint...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-5 h-5" />
                            Generate Wedding Blueprint
                          </>
                        )}
                      </button>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button
                          onClick={() => window.open('/messages', '_blank')}
                          className="bg-sage-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-sage-700 transition-all duration-300 flex items-center justify-center gap-2"
                        >
                          <Calendar className="w-5 h-5" />
                          Schedule Planning
                        </button>
                        <button
                          onClick={() => window.open('/vendors', '_blank')}
                          className="bg-rose-500 text-white py-3 px-6 rounded-xl font-semibold hover:bg-rose-600 transition-all duration-300 flex items-center justify-center gap-2"
                        >
                          <Mail className="w-5 h-5" />
                          Email Vendors
                        </button>
                      </div>
                    </div>
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