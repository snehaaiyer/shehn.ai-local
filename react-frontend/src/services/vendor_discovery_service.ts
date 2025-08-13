import { VenueImageGenerator } from './venue_image_generator';

interface Vendor {
  id: string;
  name: string;
  category: string;
  location: string;
  rating: number;
  price_range: string;
  description: string;
  phone?: string;
  email?: string;
  website?: string;
  instagram?: string;
  images?: string[];
  contact_score: number;
  venue_type?: string;
  capacity?: number;
  amenities?: string[];
  awards?: string[];
  experience_years?: number;
  weddings_planned?: number;
  specialties?: string[];
  photography_styles?: string[];
  services_offered?: string[];
  testimonials?: Array<{
    name: string;
    date: string;
    rating: number;
    text: string;
    wedding_type: string;
  }>;
  insights?: Array<{
    title: string;
    description: string;
    icon: string;
  }>;
}

interface VendorSearchParams {
  category?: string;
  location?: string;
  priceRange?: string;
  rating?: string;
  searchTerm?: string;
  capacity?: number;
}

interface VendorDiscoveryResponse {
  success: boolean;
  error?: string;
  vendors?: Vendor[];
  totalCount?: number;
  generatedImages?: { [vendorName: string]: any };
}

export class VendorDiscoveryService {
  /**
   * Search for vendors based on criteria
   */
  static async searchVendors(params: VendorSearchParams): Promise<VendorDiscoveryResponse> {
    try {
      console.log('🔍 Searching vendors with params:', params);

      // Get comprehensive wedding data from preferences
      const weddingData = this.getWeddingDataFromPreferences();
      console.log('📋 Wedding preferences data:', weddingData);

      // First, try to use the intelligent backend API
      try {
        const backendResponse = await this.searchVendorsFromBackend(params, weddingData);
        if (backendResponse.success) {
          console.log('✅ Using backend API results');
          return backendResponse;
        }
      } catch (backendError) {
        console.warn('⚠️ Backend API unavailable, using enhanced mock data:', backendError);
      }

      // Fallback to enhanced mock data that respects preferences
      const enhancedVendors = this.generateEnhancedMockVendors(params, weddingData);

      // Apply strict business logic filtering
      let filteredVendors = this.applyBusinessLogicFilters(enhancedVendors, params, weddingData);

      // Apply priority-based sorting
      filteredVendors = this.applySortingBasedOnPriorities(filteredVendors, weddingData);

      // Generate AI images for venue vendors
      let generatedImages = {};
      if (params.category === 'venues' || !params.category) {
        const venueVendors = filteredVendors.filter(v => v.category === 'venues');
        generatedImages = await this.generateVenueImages(venueVendors);
      }

      console.log(`📊 Final results: ${filteredVendors.length} vendors after filtering`);

      return {
        success: true,
        vendors: filteredVendors,
        totalCount: filteredVendors.length,
        generatedImages,
        appliedFilters: {
          weddingPreferences: weddingData,
          searchParams: params
        }
      };

    } catch (error) {
      console.error('❌ Error searching vendors:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get comprehensive wedding data from stored preferences
   */
  private static getWeddingDataFromPreferences(): any {
    try {
      const savedPreferences = localStorage.getItem('weddingPreferences');
      if (!savedPreferences) {
        console.warn('No wedding preferences found, using defaults');
        return this.getDefaultWeddingData();
      }

      const preferences = JSON.parse(savedPreferences);
      
      return {
        // Basic details
        yourName: preferences.basicDetails?.yourName || '',
        partnerName: preferences.basicDetails?.partnerName || '',
        guestCount: preferences.basicDetails?.guestCount || 100,
        budgetRange: preferences.basicDetails?.budgetRange || '',
        city: preferences.basicDetails?.location || 'Mumbai',
        weddingDate: preferences.basicDetails?.weddingDate || '',
        eventDuration: preferences.basicDetails?.eventDuration || '1',
        
        // Preferences
        weddingStyle: preferences.theme?.selectedTheme || 'traditional',
        venueType: preferences.venue?.venueType || '',
        cuisine: preferences.catering?.cuisine || '',
        photographyStyle: preferences.photography?.style || '',
        
        // Priorities (top 3)
        priorities: preferences.basicDetails?.priorities?.slice(0, 3).map((p: any) => p.id) || ['venue', 'catering', 'photography'],
        
        // User flexibility
        flexibility: {
          budget: 0.2,
          location: 0.1,
          date: 0.3,
          style: 0.2
        }
      };
    } catch (error) {
      console.error('Error parsing wedding preferences:', error);
      return this.getDefaultWeddingData();
    }
  }

  /**
   * Search vendors using backend API with intelligent algorithms
   */
  private static async searchVendorsFromBackend(params: VendorSearchParams, weddingData: any): Promise<VendorDiscoveryResponse> {
    const backendUrl = window.location.hostname === 'localhost' ? 
      'http://localhost:5002' : 
      `https://${window.location.hostname}`;

    const requestBody = {
      weddingData: weddingData,
      searchParams: params,
      filterCategory: params.category
    };

    console.log('🚀 Calling backend API:', `${backendUrl}/api/intelligent-vendor-selection`);
    console.log('📤 Request body:', requestBody);

    const response = await fetch(`${backendUrl}/api/intelligent-vendor-selection`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Backend API failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(`Backend API error: ${data.error}`);
    }

    // Transform backend response to frontend format
    const vendors: Vendor[] = [];
    
    if (data.final_recommendations) {
      Object.entries(data.final_recommendations).forEach(([category, categoryVendors]: [string, any]) => {
        if (Array.isArray(categoryVendors)) {
          categoryVendors.forEach((vendor: any) => {
            vendors.push({
              id: vendor.id || `${category}-${Math.random()}`,
              name: vendor.name || 'Unknown Vendor',
              category: category,
              location: vendor.location || weddingData.city,
              rating: vendor.rating || 4.5,
              price_range: vendor.price_range || 'Contact for pricing',
              description: vendor.description || `Professional ${category} services`,
              contact_score: vendor.business_logic_score || 85,
              phone: vendor.contact?.phone,
              email: vendor.contact?.email,
              website: vendor.contact?.website,
              images: vendor.images || []
            });
          });
        }
      });
    }

    return {
      success: true,
      vendors: vendors,
      totalCount: vendors.length,
      generatedImages: {},
      backendData: data
    };
  }

  /**
   * Apply business logic filters based on wedding preferences
   */
  private static applyBusinessLogicFilters(vendors: Vendor[], params: VendorSearchParams, weddingData: any): Vendor[] {
    console.log('🔧 Applying business logic filters...');
    
    let filtered = [...vendors];

    // 1. Budget Compatibility Filter
    if (weddingData.budgetRange) {
      filtered = this.filterByBudgetCompatibility(filtered, weddingData.budgetRange);
      console.log(`💰 After budget filter: ${filtered.length} vendors`);
    }

    // 2. Location Proximity Filter
    if (weddingData.city) {
      filtered = this.filterByLocationProximity(filtered, weddingData.city);
      console.log(`📍 After location filter: ${filtered.length} vendors`);
    }

    // 3. Guest Count Capacity Filter
    if (weddingData.guestCount) {
      filtered = this.filterByCapacity(filtered, weddingData.guestCount);
      console.log(`👥 After capacity filter: ${filtered.length} vendors`);
    }

    // 4. Style Compatibility Filter
    if (weddingData.weddingStyle) {
      filtered = this.filterByStyleCompatibility(filtered, weddingData.weddingStyle);
      console.log(`🎨 After style filter: ${filtered.length} vendors`);
    }

    // 5. Category-specific filters
    if (params.category) {
      filtered = filtered.filter(vendor => vendor.category === params.category);
      console.log(`📂 After category filter: ${filtered.length} vendors`);
    }

    // 6. Additional search filters from UI
    filtered = this.applyUIFilters(filtered, params);
    console.log(`🎛️ After UI filters: ${filtered.length} vendors`);

    return filtered;
  }

  /**
   * Filter vendors by budget compatibility
   */
  private static filterByBudgetCompatibility(vendors: Vendor[], budgetRange: string): Vendor[] {
    const budgetCategories = {
      'Budget Friendly - Under 5 Lakhs': ['budget', 'Budget (< ₹50K)', 'Mid-Range (₹50K - ₹2L)'],
      'Mid Range - 5-15 Lakhs': ['mid', 'Mid-Range (₹50K - ₹2L)', 'Premium (> ₹2L)'],
      'Luxury - 15-50 Lakhs': ['premium', 'Premium (> ₹2L)', 'luxury'],
      'Ultra Luxury - 50+ Lakhs': ['luxury', 'Premium (> ₹2L)', 'ultra']
    };

    const compatibleRanges = budgetCategories[budgetRange as keyof typeof budgetCategories] || [];
    
    return vendors.filter(vendor => {
      const vendorPriceRange = vendor.price_range.toLowerCase();
      return compatibleRanges.some(range => 
        vendorPriceRange.includes(range.toLowerCase()) ||
        this.isPriceRangeCompatible(vendorPriceRange, budgetRange)
      );
    });
  }

  /**
   * Filter vendors by location proximity
   */
  private static filterByLocationProximity(vendors: Vendor[], userLocation: string): Vendor[] {
    const userCity = userLocation.toLowerCase();
    
    return vendors.filter(vendor => {
      const vendorLocation = vendor.location.toLowerCase();
      
      // Exact city match (highest priority)
      if (vendorLocation.includes(userCity)) {
        return true;
      }
      
      // Metro area matches
      const metroAreas = {
        'mumbai': ['navi mumbai', 'thane', 'pune'],
        'delhi': ['gurgaon', 'noida', 'faridabad', 'ghaziabad'],
        'bangalore': ['mysore', 'hosur'],
        'chennai': ['pondicherry', 'kanchipuram']
      };
      
      const nearbyAreas = metroAreas[userCity as keyof typeof metroAreas] || [];
      return nearbyAreas.some(area => vendorLocation.includes(area));
    });
  }

  /**
   * Apply sorting based on user priorities
   */
  private static applySortingBasedOnPriorities(vendors: Vendor[], weddingData: any): Vendor[] {
    const priorities = weddingData.priorities || ['venue', 'photography', 'catering'];
    
    return vendors.sort((a, b) => {
      // Priority category bonus
      const aPriorityIndex = priorities.indexOf(a.category);
      const bPriorityIndex = priorities.indexOf(b.category);
      
      if (aPriorityIndex !== -1 && bPriorityIndex === -1) return -1;
      if (bPriorityIndex !== -1 && aPriorityIndex === -1) return 1;
      if (aPriorityIndex !== -1 && bPriorityIndex !== -1) {
        if (aPriorityIndex !== bPriorityIndex) return aPriorityIndex - bPriorityIndex;
      }
      
      // Secondary sort by rating and contact score
      const aScore = (a.rating * 20) + a.contact_score;
      const bScore = (b.rating * 20) + b.contact_score;
      
      return bScore - aScore;
    });
  }

  /**
   * Generate AI images for venue vendors
   */
  private static async generateVenueImages(venueVendors: Vendor[]): Promise<{ [vendorName: string]: any }> {
    const generatedImages: { [vendorName: string]: any } = {};

    for (const vendor of venueVendors) {
      try {
        const venueRequest = {
          venueType: vendor.venue_type || 'hotels',
          venueName: vendor.name,
          location: vendor.location,
          capacity: vendor.capacity || 200,
          priceRange: vendor.price_range,
          amenities: vendor.amenities || [],
          description: vendor.description
        };

        const imageResponse = await VenueImageGenerator.generateVenueImages(venueRequest);
        
        if (imageResponse.success && imageResponse.images) {
          generatedImages[vendor.name] = imageResponse;
          
          // Update vendor images with generated ones
          vendor.images = [
            imageResponse.images.mainImage,
            imageResponse.images.ceremonyImage,
            imageResponse.images.receptionImage
          ].filter((img): img is string => img !== undefined && img !== null && img !== ''); // Remove empty images
        } else {
          // Use fallback images
          const fallbackResponse = VenueImageGenerator.generateFallbackVenueImages(venueRequest);
          generatedImages[vendor.name] = fallbackResponse;
          
          vendor.images = [
            fallbackResponse.images?.mainImage,
            fallbackResponse.images?.ceremonyImage,
            fallbackResponse.images?.receptionImage
          ].filter((img): img is string => img !== undefined && img !== null);
        }

        // Add delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`Error generating images for ${vendor.name}:`, error);
        // Use fallback images
        const fallbackResponse = VenueImageGenerator.generateFallbackVenueImages({
          venueType: vendor.venue_type || 'hotels',
          venueName: vendor.name,
          location: vendor.location,
          capacity: vendor.capacity || 200,
          priceRange: vendor.price_range,
          amenities: vendor.amenities || [],
          description: vendor.description
        });
        
        generatedImages[vendor.name] = fallbackResponse;
        vendor.images = [
          fallbackResponse.images?.mainImage,
          fallbackResponse.images?.ceremonyImage,
          fallbackResponse.images?.receptionImage
        ].filter((img): img is string => img !== undefined && img !== null);
      }
    }

    return generatedImages;
  }

  /**
   * Apply filters to vendors
   */
  private static applyFilters(vendors: Vendor[], params: VendorSearchParams): Vendor[] {
    let filtered = [...vendors];

    // Search term filter
    if (params.searchTerm) {
      const searchLower = params.searchTerm.toLowerCase();
      filtered = filtered.filter(vendor =>
        vendor.name.toLowerCase().includes(searchLower) ||
        vendor.description.toLowerCase().includes(searchLower) ||
        vendor.category.toLowerCase().includes(searchLower) ||
        vendor.location.toLowerCase().includes(searchLower)
      );
    }

    // Category filter
    if (params.category && params.category !== 'all') {
      filtered = filtered.filter(vendor => vendor.category === params.category);
    }

    // Location filter
    if (params.location) {
      filtered = filtered.filter(vendor => 
        vendor.location.toLowerCase().includes(params.location!.toLowerCase())
      );
    }

    // Price range filter
    if (params.priceRange && params.priceRange !== 'all') {
      filtered = filtered.filter(vendor => {
        const vendorPrice = vendor.price_range.toLowerCase();
        const filterPrice = params.priceRange!.toLowerCase();
        
        if (filterPrice === 'budget') return vendorPrice.includes('budget') || vendorPrice.includes('<');
        if (filterPrice === 'mid') return vendorPrice.includes('mid') || vendorPrice.includes('standard');
        if (filterPrice === 'premium') return vendorPrice.includes('premium') || vendorPrice.includes('luxury') || vendorPrice.includes('>');
        return true;
      });
    }

    // Rating filter
    if (params.rating && params.rating !== 'all') {
      const minRating = parseFloat(params.rating);
      filtered = filtered.filter(vendor => vendor.rating >= minRating);
    }

    // Capacity filter
    if (params.capacity) {
      filtered = filtered.filter(vendor => 
        vendor.capacity && vendor.capacity >= params.capacity!
      );
    }

    return filtered;
  }

  /**
   * Generate mock vendors based on category
   */
  private static generateMockVendors(category: string, location: string): Vendor[] {
    switch (category) {
      case 'venues':
        return this.generateVenueVendors(location);
      case 'photography':
        return this.generatePhotographyVendors(location);
      case 'catering':
        return this.generateCateringVendors(location);
      case 'planners':
        return this.generateWeddingPlanners(location);
      default:
        return this.generateOtherVendors(category, location);
    }
  }

  /**
   * Generate venue vendors
   */
  private static generateVenueVendors(location: string): Vendor[] {
    return [
      {
        id: 'venue-1',
        name: 'Taj Palace Hotel',
        category: 'venues',
        location: location,
        rating: 4.9,
        price_range: 'Premium (> ₹2L)',
        description: 'Luxury 5-star hotel with grand ballrooms and world-class amenities. Perfect for extravagant weddings with international standards.',
        contact_score: 98,
        phone: '+91 98765 43210',
        email: 'events@tajpalace.com',
        website: 'www.tajpalace.com',
        instagram: '@tajpalaceweddings',
        venue_type: 'hotels',
        capacity: 500,
        amenities: ['Grand Ballroom', 'Garden Area', 'In-house Catering', 'Valet Parking', 'Luxury Accommodation'],
        experience_years: 25,
        weddings_planned: 1200,
        awards: [
          'Best Luxury Wedding Venue 2023 - Wedding Wire',
          '5-Star Hotel Excellence Award',
          'International Wedding Venue Recognition'
        ],
        testimonials: [
          {
            name: 'Priya & Arjun',
            date: 'March 2024',
            rating: 5,
            text: 'Taj Palace exceeded all expectations! The grand ballroom was perfect for our 500-guest wedding.',
            wedding_type: 'Luxury Traditional Wedding'
          }
        ],
        insights: [
          {
            title: 'Luxury Standards',
            description: 'World-class amenities and international hospitality standards for premium wedding experiences.',
            icon: 'Crown'
          }
        ]
      },
      {
        id: 'venue-2',
        name: 'Garden Palace Resort',
        category: 'venues',
        location: location,
        rating: 4.7,
        price_range: 'Mid-Range (₹50K - ₹2L)',
        description: 'Beautiful resort surrounded by lush gardens and scenic views. Ideal for nature-loving couples seeking a peaceful wedding experience.',
        contact_score: 92,
        phone: '+91 87654 32109',
        email: 'weddings@gardenpalace.com',
        website: 'www.gardenpalace.com',
        instagram: '@gardenpalaceresort',
        venue_type: 'resorts',
        capacity: 300,
        amenities: ['Garden Venue', 'Swimming Pool', 'Spa Services', 'Outdoor Catering', 'Accommodation'],
        experience_years: 15,
        weddings_planned: 450,
        awards: [
          'Best Garden Wedding Venue 2023',
          'Eco-Friendly Resort Award',
          'Nature Wedding Excellence'
        ],
        testimonials: [
          {
            name: 'Maya & Dev',
            date: 'February 2024',
            rating: 5,
            text: 'The garden setting was absolutely magical! Our outdoor ceremony was perfect.',
            wedding_type: 'Garden Wedding'
          }
        ],
        insights: [
          {
            title: 'Natural Beauty',
            description: 'Lush gardens and scenic views create a peaceful, nature-inspired wedding atmosphere.',
            icon: 'Trees'
          }
        ]
      },
      {
        id: 'venue-3',
        name: 'Royal Banquet Hall',
        category: 'venues',
        location: location,
        rating: 4.5,
        price_range: 'Mid-Range (₹50K - ₹2L)',
        description: 'Elegant banquet hall with modern facilities and professional event management services. Perfect for traditional Indian weddings.',
        contact_score: 88,
        phone: '+91 76543 21098',
        email: 'info@royalbanquet.com',
        website: 'www.royalbanquet.com',
        instagram: '@royalbanquethall',
        venue_type: 'banquet',
        capacity: 400,
        amenities: ['Grand Hall', 'Dance Floor', 'Stage Setup', 'Audio-Visual Equipment', 'Parking'],
        experience_years: 20,
        weddings_planned: 800,
        awards: [
          'Best Banquet Hall 2023 - Event Management',
          'Traditional Wedding Venue Excellence',
          'Customer Service Award'
        ],
        testimonials: [
          {
            name: 'Riya & Aman',
            date: 'January 2024',
            rating: 5,
            text: 'Perfect venue for our traditional wedding! The hall accommodated all our guests comfortably.',
            wedding_type: 'Traditional Indian Wedding'
          }
        ],
        insights: [
          {
            title: 'Traditional Excellence',
            description: 'Specialized in traditional Indian weddings with modern amenities and professional service.',
            icon: 'Building2'
          }
        ]
      },
      {
        id: 'venue-4',
        name: 'Heritage Palace',
        category: 'venues',
        location: location,
        rating: 4.8,
        price_range: 'Premium (> ₹2L)',
        description: 'Historic palace with royal architecture and traditional charm. Perfect for royal-themed weddings with authentic heritage experience.',
        contact_score: 95,
        phone: '+91 65432 10987',
        email: 'royal@heritagepalace.com',
        website: 'www.heritagepalace.com',
        instagram: '@heritagepalace',
        venue_type: 'palaces',
        capacity: 600,
        amenities: ['Royal Courtyard', 'Heritage Rooms', 'Traditional Décor', 'Cultural Performances', 'Royal Treatment'],
        experience_years: 30,
        weddings_planned: 950,
        awards: [
          'Heritage Wedding Venue of the Year 2023',
          'Cultural Preservation Award',
          'Royal Wedding Excellence'
        ],
        testimonials: [
          {
            name: 'Emma & James',
            date: 'December 2023',
            rating: 5,
            text: 'A truly royal experience! The heritage palace made our wedding feel like a fairy tale.',
            wedding_type: 'Royal Heritage Wedding'
          }
        ],
        insights: [
          {
            title: 'Royal Heritage',
            description: 'Authentic royal architecture and heritage rooms provide a majestic wedding experience.',
            icon: 'Crown'
          }
        ]
      },
      {
        id: 'venue-5',
        name: 'Green Valley Farmhouse',
        category: 'venues',
        location: location,
        rating: 4.4,
        price_range: 'Budget (< ₹50K)',
        description: 'Rustic farmhouse with natural beauty and affordable pricing. Great for intimate weddings with a countryside charm.',
        contact_score: 85,
        phone: '+91 54321 09876',
        email: 'contact@greenvalley.com',
        website: 'www.greenvalley.com',
        instagram: '@greenvalleyfarmhouse',
        venue_type: 'farmhouses',
        capacity: 150,
        amenities: ['Open Air Venue', 'Natural Setting', 'Basic Facilities', 'Parking', 'Camping Option'],
        experience_years: 8,
        weddings_planned: 200,
        awards: [
          'Best Budget Wedding Venue 2023',
          'Eco-Friendly Venue Award',
          'Rustic Wedding Excellence'
        ],
        testimonials: [
          {
            name: 'Sophie & Alex',
            date: 'November 2023',
            rating: 5,
            text: 'Perfect for our intimate wedding! The rustic charm and natural setting were exactly what we wanted.',
            wedding_type: 'Intimate Farmhouse Wedding'
          }
        ],
        insights: [
          {
            title: 'Rustic Charm',
            description: 'Natural countryside setting with rustic charm for intimate, budget-friendly weddings.',
            icon: 'Trees'
          }
        ]
      }
    ];
  }

  /**
   * Generate photography vendors
   */
  private static generatePhotographyVendors(location: string): Vendor[] {
    return [
      {
        id: 'photo-1',
        name: 'Elite Wedding Photography Studio',
        category: 'photography',
        location: location,
        rating: 4.9,
        price_range: 'Premium (> ₹2L)',
        description: 'Award-winning photography studio specializing in artistic and cinematic wedding photography.',
        contact_score: 98,
        phone: '+91 98765 43210',
        email: 'hello@elitephotography.com',
        website: 'www.elitephotography.com',
        instagram: '@eliteweddingphotography',
        experience_years: 12,
        weddings_planned: 450,
        photography_styles: [
          'Artistic/Creative Photography',
          'Cinematic Wedding Videography',
          'Candid Wedding Photography',
          'Documentary/Photojournalistic'
        ],
        services_offered: [
          'Full Day Coverage',
          'Pre-Wedding Shoots',
          'Cinematic Videos',
          'Drone Coverage',
          'Photo Albums'
        ],
        awards: [
          'Best Wedding Photographer 2023 - Wedding Wire',
          'Artistic Excellence Award - Photography Association',
          'Cinematic Videography Award'
        ],
        testimonials: [
          {
            name: 'Priya & Arjun',
            date: 'March 2024',
            rating: 5,
            text: 'Elite Photography captured our wedding like a fairy tale! The artistic shots and cinematic video are absolutely breathtaking.',
            wedding_type: 'Traditional Indian Wedding'
          }
        ],
        insights: [
          {
            title: 'Artistic Vision',
            description: 'Create stunning visual narratives with unique compositions, dramatic lighting, and artistic effects.',
            icon: 'Camera'
          }
        ],
        images: [
          'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400&h=300&fit=crop'
        ]
      }
    ];
  }

  /**
   * Generate catering vendors
   */
  private static generateCateringVendors(location: string): Vendor[] {
    return [
      {
        id: 'catering-1',
        name: 'Royal Feast Catering',
        category: 'catering',
        location: location,
        rating: 4.9,
        price_range: 'Premium (> ₹2L)',
        description: 'Luxury catering service specializing in multi-cuisine wedding feasts with international standards.',
        contact_score: 96,
        phone: '+91 98765 43210',
        email: 'feast@royalcatering.com',
        website: 'www.royalcatering.com',
        instagram: '@royalfeastcatering',
        experience_years: 18,
        weddings_planned: 650,
        specialties: [
          'Multi-Cuisine Catering',
          'International Cuisine',
          'Custom Menu Design',
          'Live Cooking Stations'
        ],
        services_offered: [
          'Wedding Feast Catering',
          'Pre-Wedding Functions',
          'Live Cooking Stations',
          'Beverage Services'
        ],
        awards: [
          'Best Wedding Caterer 2023 - Food Awards',
          'International Cuisine Excellence',
          'Hygiene & Safety Award'
        ],
        testimonials: [
          {
            name: 'Priya & Arjun',
            date: 'March 2024',
            rating: 5,
            text: 'Royal Feast created the most amazing wedding feast! The multi-cuisine spread was incredible.',
            wedding_type: 'Luxury Multi-Cuisine Wedding'
          }
        ],
        insights: [
          {
            title: 'Multi-Cuisine Excellence',
            description: 'Specialized in diverse cuisines with international standards and personalized menu design.',
            icon: 'Utensils'
          }
        ],
        images: [
          'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=300&fit=crop'
        ]
      }
    ];
  }

  /**
   * Generate wedding planners
   */
  private static generateWeddingPlanners(location: string): Vendor[] {
    return [
      {
        id: 'planner-1',
        name: 'Elite Wedding Creations',
        category: 'planners',
        location: location,
        rating: 4.9,
        price_range: 'Premium (> ₹2L)',
        description: 'Award-winning wedding planning studio with 15+ years of experience creating magical celebrations.',
        contact_score: 98,
        phone: '+91 98765 43210',
        email: 'hello@eliteweddingcreations.com',
        website: 'www.eliteweddingcreations.com',
        experience_years: 15,
        weddings_planned: 500,
        awards: [
          'Best Wedding Planner 2023 - Wedding Wire',
          'Excellence Award - Vogue Weddings',
          'Top 10 Planners - Bridal Guide India'
        ],
        specialties: [
          'Luxury Destination Weddings',
          'Multi-day Celebrations',
          'Cultural Fusion Weddings',
          'Intimate Elopements'
        ],
        testimonials: [
          {
            name: 'Priya & Arjun',
            date: 'March 2024',
            rating: 5,
            text: 'Elite Wedding Creations made our dream wedding a reality! Every detail was perfect.',
            wedding_type: 'Luxury Destination Wedding'
          }
        ],
        insights: [
          {
            title: 'Personalized Planning',
            description: 'Every wedding is unique. We create custom timelines and checklists tailored to your specific needs.',
            icon: 'CheckCircle'
          }
        ],
        images: [
          'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop'
        ]
      }
    ];
  }

  /**
   * Get default wedding data
   */
  private static getDefaultWeddingData(): any {
    return {
      yourName: 'User',
      partnerName: 'Partner',
      guestCount: 100,
      budgetRange: 'Mid Range - 5-15 Lakhs',
      city: 'Mumbai',
      weddingDate: '',
      eventDuration: '1',
      weddingStyle: 'traditional',
      venueType: '',
      cuisine: '',
      photographyStyle: '',
      priorities: ['venue', 'catering', 'photography'],
      flexibility: { budget: 0.2, location: 0.1, date: 0.3, style: 0.2 }
    };
  }

  /**
   * Check if price range is compatible with budget
   */
  private static isPriceRangeCompatible(vendorPriceRange: string, userBudget: string): boolean {
    // Extract numeric values and compare
    const budgetValues = {
      'Budget Friendly - Under 5 Lakhs': { min: 0, max: 500000 },
      'Mid Range - 5-15 Lakhs': { min: 500000, max: 1500000 },
      'Luxury - 15-50 Lakhs': { min: 1500000, max: 5000000 },
      'Ultra Luxury - 50+ Lakhs': { min: 5000000, max: 50000000 }
    };

    const userRange = budgetValues[userBudget as keyof typeof budgetValues];
    if (!userRange) return true;

    // Basic compatibility check
    if (vendorPriceRange.includes('budget') && userRange.max < 500000) return true;
    if (vendorPriceRange.includes('premium') && userRange.min > 1500000) return true;
    if (vendorPriceRange.includes('luxury') && userRange.min > 5000000) return true;

    return true; // Default to compatible if unclear
  }

  /**
   * Filter vendors by capacity
   */
  private static filterByCapacity(vendors: Vendor[], guestCount: number): Vendor[] {
    return vendors.filter(vendor => {
      if (vendor.category !== 'venues') return true; // Only apply to venues
      
      const capacity = vendor.capacity || 200;
      
      // Venue should handle at least the guest count, but not be more than 3x oversized
      return capacity >= guestCount && capacity <= (guestCount * 3);
    });
  }

  /**
   * Filter vendors by style compatibility
   */
  private static filterByStyleCompatibility(vendors: Vendor[], weddingStyle: string): Vendor[] {
    const styleMapping = {
      'traditional': ['traditional', 'heritage', 'classic', 'cultural'],
      'modern': ['modern', 'contemporary', 'minimalist', 'urban'],
      'royal': ['royal', 'palace', 'luxury', 'premium', 'heritage'],
      'destination': ['destination', 'beach', 'mountain', 'resort'],
      'fusion': ['fusion', 'mixed', 'contemporary', 'modern'],
      'bohemian': ['bohemian', 'boho', 'garden', 'rustic'],
      'vintage': ['vintage', 'classic', 'heritage', 'retro']
    };

    const compatibleStyles = styleMapping[weddingStyle.toLowerCase() as keyof typeof styleMapping] || [];
    
    return vendors.filter(vendor => {
      const vendorSpecialties = (vendor.specialties || []).map(s => s.toLowerCase());
      const vendorName = vendor.name.toLowerCase();
      const vendorDescription = vendor.description.toLowerCase();
      
      // Check if vendor specializes in compatible styles
      return compatibleStyles.some(style => 
        vendorSpecialties.some(specialty => specialty.includes(style)) ||
        vendorName.includes(style) ||
        vendorDescription.includes(style)
      ) || compatibleStyles.length === 0; // If no specific style mapping, include all
    });
  }

  /**
   * Apply UI-based filters
   */
  private static applyUIFilters(vendors: Vendor[], params: VendorSearchParams): Vendor[] {
    let filtered = [...vendors];

    // Search term filter
    if (params.searchTerm) {
      const searchLower = params.searchTerm.toLowerCase();
      filtered = filtered.filter(vendor =>
        vendor.name.toLowerCase().includes(searchLower) ||
        vendor.description.toLowerCase().includes(searchLower) ||
        vendor.category.toLowerCase().includes(searchLower) ||
        vendor.location.toLowerCase().includes(searchLower)
      );
    }

    // Location filter (more specific than business logic)
    if (params.location) {
      filtered = filtered.filter(vendor => 
        vendor.location.toLowerCase().includes(params.location!.toLowerCase())
      );
    }

    // Price range filter
    if (params.priceRange && params.priceRange !== 'all') {
      filtered = filtered.filter(vendor => {
        const vendorPrice = vendor.price_range.toLowerCase();
        const filterPrice = params.priceRange!.toLowerCase();
        
        if (filterPrice === 'budget') return vendorPrice.includes('budget') || vendorPrice.includes('<');
        if (filterPrice === 'mid') return vendorPrice.includes('mid') || vendorPrice.includes('standard');
        if (filterPrice === 'premium') return vendorPrice.includes('premium') || vendorPrice.includes('luxury') || vendorPrice.includes('>');
        return true;
      });
    }

    // Rating filter
    if (params.rating && params.rating !== 'all') {
      const minRating = parseFloat(params.rating);
      filtered = filtered.filter(vendor => vendor.rating >= minRating);
    }

    // Capacity filter
    if (params.capacity) {
      filtered = filtered.filter(vendor => 
        vendor.capacity && vendor.capacity >= params.capacity!
      );
    }

    return filtered;
  }

  /**
   * Generate enhanced mock vendors that respect wedding preferences
   */
  private static generateEnhancedMockVendors(params: VendorSearchParams, weddingData: any): Vendor[] {
    const location = weddingData.city || params.location || 'Mumbai';
    let vendors: Vendor[] = [];
    
    if (params.category) {
      // Generate vendors for specific category
      vendors = this.generateMockVendors(params.category, location);
    } else {
      // Generate vendors for all categories when no specific category is selected
      const categories = ['venues', 'photography', 'catering', 'planners', 'decoration', 'entertainment', 'beauty'];
      vendors = categories.flatMap(category => this.generateMockVendors(category, location));
    }
    
    // Enhance vendors with preference-aware data
    vendors = vendors.map(vendor => ({
      ...vendor,
      // Add capacity based on guest count
      capacity: this.generateRealisticCapacity(vendor, weddingData.guestCount),
      // Add specialties based on wedding style
      specialties: this.generateStyleSpecialties(vendor, weddingData.weddingStyle),
      // Add awards based on quality tier
      awards: this.generateAwards(vendor),
      // Enhance description
      description: this.enhanceDescription(vendor, weddingData)
    }));
    
    return vendors;
  }

  /**
   * Generate realistic capacity for venues
   */
  private static generateRealisticCapacity(vendor: Vendor, guestCount: number): number {
    if (vendor.category !== 'venues') return 0;
    
    const baseCapacity = guestCount || 200;
    const variation = Math.random() * 0.6 + 0.7; // 70% - 130% of guest count
    
    return Math.round(baseCapacity * variation / 50) * 50; // Round to nearest 50
  }

  /**
   * Generate style specialties
   */
  private static generateStyleSpecialties(vendor: Vendor, weddingStyle: string): string[] {
    const baseSpecialties = vendor.specialties || [];
    
    const styleSpecialties = {
      'traditional': ['Traditional Indian Weddings', 'Heritage Ceremonies', 'Cultural Events'],
      'modern': ['Contemporary Weddings', 'Modern Celebrations', 'Urban Events'],
      'royal': ['Royal Weddings', 'Palace Events', 'Luxury Celebrations'],
      'destination': ['Destination Weddings', 'Resort Events', 'Travel Celebrations']
    };
    
    const additionalSpecialties = styleSpecialties[weddingStyle as keyof typeof styleSpecialties] || [];
    
    return [...baseSpecialties, ...additionalSpecialties.slice(0, 2)];
  }

  /**
   * Generate awards based on vendor quality
   */
  private static generateAwards(vendor: Vendor): string[] {
    if (vendor.rating < 4.0) return [];
    
    const awards = [
      'Best Wedding Vendor 2023',
      'Excellence in Service Award',
      'Customer Choice Award',
      'Wedding Industry Recognition',
      'Quality Service Certification'
    ];
    
    const awardCount = vendor.rating >= 4.8 ? 3 : vendor.rating >= 4.5 ? 2 : 1;
    return awards.slice(0, awardCount);
  }

  /**
   * Enhance vendor description based on wedding data
   */
  private static enhanceDescription(vendor: Vendor, weddingData: any): string {
    let description = vendor.description;
    
    // Add guest count relevance
    if (vendor.category === 'venues' && weddingData.guestCount) {
      description += ` Perfect for ${weddingData.guestCount} guest celebrations.`;
    }
    
    // Add style relevance
    if (weddingData.weddingStyle) {
      description += ` Specializing in ${weddingData.weddingStyle} wedding celebrations.`;
    }
    
    // Add location advantage
    if (vendor.location.toLowerCase().includes(weddingData.city?.toLowerCase())) {
      description += ` Conveniently located in ${weddingData.city}.`;
    }
    
    return description;
  }

  /**
   * Generate other vendors
   */
  private static generateOtherVendors(category: string, location: string): Vendor[] {
    const categoryImages = {
      decoration: [
        'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop'
      ],
      entertainment: [
        'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop'
      ],
      beauty: [
        'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=300&fit=crop'
      ]
    };

    return [
      {
        id: 'other-1',
        name: `Elite ${category.charAt(0).toUpperCase() + category.slice(1)} Services`,
        category: category,
        location: location,
        rating: 4.8,
        price_range: 'Premium (> ₹2L)',
        description: `Professional ${category} services with over 10 years of experience. Specializing in luxury weddings with attention to every detail.`,
        contact_score: 95,
        phone: '+91 98765 43210',
        email: `contact@elite${category}.com`,
        website: `www.elite${category}.com`,
        images: categoryImages[category as keyof typeof categoryImages] || []
      }
    ];
  }

  /**
   * Get vendor by ID
   */
  static async getVendorById(id: string): Promise<Vendor | null> {
    try {
      // In a real implementation, this would fetch from an API
      const allVendors = [
        ...this.generateVenueVendors('Mumbai'),
        ...this.generatePhotographyVendors('Mumbai'),
        ...this.generateCateringVendors('Mumbai'),
        ...this.generateWeddingPlanners('Mumbai')
      ];

      return allVendors.find(vendor => vendor.id === id) || null;
    } catch (error) {
      console.error('Error getting vendor by ID:', error);
      return null;
    }
  }

  /**
   * Get vendor recommendations
   */
  static async getVendorRecommendations(preferences: any): Promise<Vendor[]> {
    try {
      // Generate recommendations based on preferences
      const recommendations: Vendor[] = [];
      
      if (preferences.venue) {
        const venueVendors = this.generateVenueVendors(preferences.location || 'Mumbai');
        recommendations.push(...venueVendors.slice(0, 3));
      }
      
      if (preferences.photography) {
        const photoVendors = this.generatePhotographyVendors(preferences.location || 'Mumbai');
        recommendations.push(...photoVendors.slice(0, 2));
      }
      
      if (preferences.catering) {
        const cateringVendors = this.generateCateringVendors(preferences.location || 'Mumbai');
        recommendations.push(...cateringVendors.slice(0, 2));
      }

      return recommendations;
    } catch (error) {
      console.error('Error getting vendor recommendations:', error);
      return [];
    }
  }
} 