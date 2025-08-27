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

export interface VendorSearchParams {
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
  appliedFilters?: any;
  backendData?: any;
}

export export class VendorDiscoveryService {
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
  static getWeddingDataFromPreferences(): any {
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

        // Enhanced theme and style preferences
        weddingTheme: preferences.theme?.selectedTheme || 'traditional',
        weddingStyle: preferences.theme?.selectedTheme || 'traditional',

        // Detailed venue preferences
        venueType: preferences.venue?.venueType || '',
        venueStyle: preferences.venue?.venueType || '',
        venueCapacity: preferences.venue?.capacity || preferences.basicDetails?.guestCount || 100,
        indoorOutdoor: this.extractIndoorOutdoorPreference(preferences.venue?.venueType),

        // Catering preferences
        cuisine: preferences.catering?.cuisine || '',
        cuisineStyle: preferences.catering?.cuisine || '',
        mealType: preferences.catering?.mealType || '',
        dietaryRestrictions: preferences.catering?.dietaryRestrictions || [],

        // Photography style preferences
        photographyStyle: preferences.photography?.style || '',
        photographyCoverage: preferences.photography?.coverage || '',
        videographyRequired: preferences.photography?.videography?.required || false,
        droneCoverage: preferences.photography?.videography?.droneCoverage || false,

        // Decor and styling (if available in future)
        decorStyle: preferences.decor?.style || this.inferDecorFromTheme(preferences.theme?.selectedTheme),
        colorTheme: preferences.decor?.colorTheme || this.inferColorFromTheme(preferences.theme?.selectedTheme),
        floralStyle: preferences.decor?.floralStyle || this.inferFloralFromTheme(preferences.theme?.selectedTheme),

        // Budget and priorities
        priorities: preferences.basicDetails?.priorities?.slice(0, 3).map((p: any) => p.id) || ['venue', 'catering', 'photography'],

        // Enhanced flexibility preferences
        flexibility: {
          budget: 0.2,
          location: 0.1,
          date: 0.3,
          style: 0.2,
          venue: 0.15,
          decor: 0.25
        },

        // Additional attributes for enhanced filtering
        specialRequirements: preferences.basicDetails?.specialRequirements || '',
        culturalRequirements: this.extractCulturalRequirements(preferences),
        accessibilityNeeds: preferences.basicDetails?.accessibilityNeeds || '',
        seasonalPreferences: this.extractSeasonalPreferences(preferences.basicDetails?.weddingDate)
      };
    } catch (error) {
      console.error('Error parsing wedding preferences:', error);
      return this.getDefaultWeddingData();
    }
  }

  /**
   * Extract indoor/outdoor preference from venue type
   */
  static extractIndoorOutdoorPreference(venueType: string): string {
    if (!venueType) return '';

    const outdoorTypes = ['garden', 'beach', 'farmhouse', 'mountain', 'rooftop'];
    const indoorTypes = ['banquet-hall', 'heritage-palace', 'luxury-hotel', 'temple', 'gurudwara'];

    if (outdoorTypes.some(type => venueType.toLowerCase().includes(type))) {
      return 'outdoor';
    } else if (indoorTypes.some(type => venueType.toLowerCase().includes(type))) {
      return 'indoor';
    }
    return 'flexible';
  }

  /**
   * Infer decor style from wedding theme
   */
  static inferDecorFromTheme(theme: string): string {
    const decorMapping: Record<string, string> = {
      'royal': 'luxury-opulent',
      'traditional': 'traditional',
      'modern': 'minimalist',
      'boho': 'rustic',
      'vintage': 'vintage',
      'beach': 'tropical',
      'garden': 'floral'
    };

    return decorMapping[theme?.toLowerCase()] || 'traditional';
  }

  /**
   * Infer color theme from wedding theme
   */
  static inferColorFromTheme(theme: string): string {
    const colorMapping: Record<string, string> = {
      'royal': 'burgundy-gold',
      'traditional': 'red-gold',
      'modern': 'monochrome',
      'boho': 'earth-tones',
      'vintage': 'dusty-pastels',
      'beach': 'aqua-coral',
      'garden': 'sage-cream'
    };

    return colorMapping[theme?.toLowerCase()] || 'red-gold';
  }

  /**
   * Infer floral style from wedding theme
   */
  static inferFloralFromTheme(theme: string): string {
    const floralMapping: Record<string, string> = {
      'royal': 'opulent',
      'traditional': 'marigold-roses',
      'modern': 'minimalist',
      'boho': 'wildflowers',
      'vintage': 'vintage-roses',
      'beach': 'tropical',
      'garden': 'garden-fresh'
    };

    return floralMapping[theme?.toLowerCase()] || 'traditional';
  }

  /**
   * Extract cultural requirements from preferences
   */
  static extractCulturalRequirements(preferences: any): string[] {
    const requirements: string[] = [];

    const theme = preferences.theme?.selectedTheme?.toLowerCase();
    if (theme?.includes('traditional') || theme?.includes('royal')) {
      requirements.push('mandap', 'traditional-music', 'cultural-ceremonies');
    }

    if (theme?.includes('south-indian')) {
      requirements.push('south-indian-traditions', 'temple-style');
    }

    if (theme?.includes('punjabi') || theme?.includes('sikh')) {
      requirements.push('gurudwara-style', 'punjabi-traditions');
    }

    return requirements;
  }

  /**
   * Extract seasonal preferences from wedding date
   */
  static extractSeasonalPreferences(weddingDate: string): string {
    if (!weddingDate) return '';

    try {
      const date = new Date(weddingDate);
      const month = date.getMonth();

      if (month >= 2 && month <= 4) return 'spring';
      if (month >= 5 && month <= 7) return 'summer';
      if (month >= 8 && month <= 10) return 'monsoon';
      return 'winter';
    } catch {
      return '';
    }
  }

  /**
   * Search vendors using RAG-enhanced semantic search backend API
   */
  static async searchVendorsFromBackend(params: VendorSearchParams, weddingData: any): Promise<VendorDiscoveryResponse> {
    const backendUrl = window.location.hostname === 'localhost' ?
      'http://localhost:5003' :
      `https://${window.location.hostname}`;

    // Enhanced request body for RAG-enhanced semantic search
    const requestBody = {
      weddingData: {
        ...weddingData,
        // Add detailed preference context for semantic matching
        detailedPreferences: this.getDetailedPreferencesFromStorage(),
        ragContext: {
          searchMethod: 'semantic_embedding_search',
          preferenceWeights: {
            style: 0.30,      // Wedding theme, decor style, aesthetic preferences
            cultural: 0.20,   // Cultural requirements, cuisine, traditions
            service: 0.30,    // Photography style, catering type, service quality
            practical: 0.20   // Budget, capacity, location, timing
          },
          enhancementMode: 'full_semantic',
          includeContextScore: true,
          extractSpecialties: true,
          semanticMatching: true
        }
      },
      searchParams: params,
      filterCategory: params.category,
      maxResults: 20,
      ragEnabled: true
    };

    console.log('🚀 Calling RAG-Enhanced Semantic Search API:', `${backendUrl}/api/rag-vendor-search`);
    console.log('📤 Semantic search request:', requestBody);

    const response = await fetch(`${backendUrl}/api/rag-vendor-search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`RAG API failed: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(`RAG API error: ${data.error}`);
    }

    // Transform RAG API response to frontend format
    const vendors: Vendor[] = [];

    if (data.vendors && Array.isArray(data.vendors)) {
      data.vendors.forEach((vendor: any) => {
        vendors.push({
          id: vendor.id || `vendor-${Math.random()}`,
          name: vendor.name || 'Unknown Vendor',
          category: vendor.category,
          location: vendor.location || weddingData.city,
          rating: vendor.rating || 4.5,
          price_range: vendor.budget_tier || 'Contact for pricing',
          description: `Professional ${vendor.category} services with ${vendor.rag_scores?.final_score?.toFixed(2) || 'high'} compatibility score`,
          contact_score: Math.round((vendor.rag_scores?.final_score || 0.7) * 100),
          phone: vendor.contact?.phone,
          email: vendor.contact?.email,
          website: vendor.contact?.website,
          images: vendor.images || []
        });
      });
    }

    return {
      success: true,
      vendors: vendors,
      totalCount: vendors.length,
      generatedImages: {},
      backendData: {
        ...data,
        searchMethod: 'RAG-Enhanced Semantic Search',
        ragAnalytics: data.rag_analytics || {}
      }
    };
  }

  /**
   * Get detailed preferences for RAG processing
   */
  static getDetailedPreferencesFromStorage(): any {
    try {
      const savedPreferences = localStorage.getItem('weddingPreferences');
      if (!savedPreferences) {
        return {};
      }

      const preferences = JSON.parse(savedPreferences);

      return {
        // Complete basic details
        basicDetails: preferences.basicDetails || {},

        // Complete theme preferences
        theme: preferences.theme || {},

        // Complete venue preferences
        venue: preferences.venue || {},

        // Complete catering preferences
        catering: preferences.catering || {},

        // Complete photography preferences with all nested details
        photography: {
          style: preferences.photography?.style || '',
          coverage: preferences.photography?.coverage || '',
          specialRequests: preferences.photography?.specialRequests || '',

          // Multi-day coverage details
          multiDayCoverage: preferences.photography?.multiDayCoverage || {},

          // Videography preferences
          videography: preferences.photography?.videography || {},

          // Cultural coverage requirements
          culturalCoverage: preferences.photography?.culturalCoverage || {},

          // Deliverables preferences
          deliverables: preferences.photography?.deliverables || {},

          // Technical preferences
          technicalPreferences: preferences.photography?.technicalPreferences || {},

          // Budget for photography
          budgetRange: preferences.photography?.budgetRange || ''
        },

        // Metadata for RAG processing
        ragMetadata: {
          lastUpdated: new Date().toISOString(),
          preferencesVersion: '2.0',
          completionLevel: this.calculatePreferencesCompletionLevel(preferences),
          priorityCategories: preferences.basicDetails?.priorities?.slice(0, 3).map((p: any) => p.id) || []
        }
      };
    } catch (error) {
      console.error('Error extracting detailed preferences:', error);
      return {};
    }
  }

  /**
   * Calculate how complete the preferences are (0-100%)
   */
  static calculatePreferencesCompletionLevel(preferences: any): number {
    const requiredFields = [
      'basicDetails.yourName',
      'basicDetails.partnerName',
      'basicDetails.guestCount',
      'basicDetails.location',
      'basicDetails.budgetRange',
      'theme.selectedTheme',
      'venue.venueType',
      'catering.cuisine',
      'photography.style'
    ];

    let completedFields = 0;

    for (const field of requiredFields) {
      const fieldParts = field.split('.');
      let value = preferences;

      for (const part of fieldParts) {
        value = value?.[part];
      }

      if (value && value !== '') {
        completedFields++;
      }
    }

    return Math.round((completedFields / requiredFields.length) * 100);
  }

  /**
   * Apply business logic filters based on wedding preferences
   */
  static applyBusinessLogicFilters(vendors: Vendor[], params: VendorSearchParams, weddingData: any): Vendor[] {
    console.log('🔧 Applying comprehensive business logic filters...');

    let filtered = [...vendors];

    // 1. Budget Compatibility Filter
    if (weddingData.budgetRange) {
      filtered = this.filterByBudgetCompatibility(filtered, weddingData.budgetRange);
    }

    // 2. Location Proximity Filter
    if (weddingData.city) {
      filtered = this.filterByLocationProximity(filtered, weddingData.city);
    }

    // 3. Guest Count Capacity Filter
    if (weddingData.guestCount) {
      filtered = this.filterByCapacity(filtered, weddingData.guestCount);
    }

    // 4. Category-specific filters
    if (params.category) {
      filtered = filtered.filter(vendor => vendor.category === params.category);
    }

    // 5. Additional search filters from UI
    filtered = this.applyUIFilters(filtered, params);

    return filtered;
  }

  /**
   * Filter vendors by budget compatibility
   */
  static filterByBudgetCompatibility(vendors: Vendor[], budgetRange: string): Vendor[] {
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
  static filterByLocationProximity(vendors: Vendor[], userLocation: string): Vendor[] {
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
   * Filter vendors by capacity
   */
  static filterByCapacity(vendors: Vendor[], guestCount: number): Vendor[] {
    return vendors.filter(vendor => {
      if (vendor.category !== 'venues') return true; // Only apply to venues

      const capacity = vendor.capacity || 200;

      // Venue should handle at least the guest count, but not be more than 3x oversized
      return capacity >= guestCount && capacity <= (guestCount * 3);
    });
  }

  /**
   * Check if price range is compatible with budget
   */
  static isPriceRangeCompatible(vendorPriceRange: string, userBudget: string): boolean {
    // Basic compatibility check
    if (vendorPriceRange.includes('budget') && userBudget.includes('Budget')) return true;
    if (vendorPriceRange.includes('premium') && userBudget.includes('Luxury')) return true;
    return true; // Default to compatible if unclear
  }

  /**
   * Apply sorting based on user priorities
   */
  static applySortingBasedOnPriorities(vendors: Vendor[], weddingData: any): Vendor[] {
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
  static async generateVenueImages(venueVendors: Vendor[]): Promise<{ [vendorName: string]: any }> {
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
          ].filter((img): img is string => img !== undefined && img !== null && img !== '');
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
   * Apply UI-based filters
   */
  static applyUIFilters(vendors: Vendor[], params: VendorSearchParams): Vendor[] {
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
  static generateEnhancedMockVendors(params: VendorSearchParams, weddingData: any): Vendor[] {
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

    return vendors;
  }

  /**
   * Generate mock vendors based on category
   */
  static generateMockVendors(category: string, location: string): Vendor[] {
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
  static generateVenueVendors(location: string): Vendor[] {
    return [
      {
        id: 'venue-1',
        name: 'Taj Palace Hotel',
        category: 'venues',
        location: location,
        rating: 4.9,
        price_range: 'Premium (> ₹2L)',
        description: 'Luxury 5-star hotel with grand ballrooms and world-class amenities.',
        contact_score: 98,
        phone: '+91 98765 43210',
        email: 'events@tajpalace.com',
        venue_type: 'hotels',
        capacity: 500,
        amenities: ['Grand Ballroom', 'Garden Area', 'In-house Catering'],
        experience_years: 25,
        weddings_planned: 1200,
        images: []
      },
      {
        id: 'venue-2',
        name: 'Garden Palace Resort',
        category: 'venues',
        location: location,
        rating: 4.7,
        price_range: 'Mid-Range (₹50K - ₹2L)',
        description: 'Beautiful resort surrounded by lush gardens and scenic views.',
        contact_score: 92,
        phone: '+91 87654 32109',
        email: 'weddings@gardenpalace.com',
        venue_type: 'resorts',
        capacity: 300,
        amenities: ['Garden Venue', 'Swimming Pool', 'Spa Services'],
        experience_years: 15,
        weddings_planned: 450,
        images: []
      },
      {
        id: 'venue-3',
        name: 'Royal Banquet Hall',
        category: 'venues',
        location: location,
        rating: 4.5,
        price_range: 'Mid-Range (₹50K - ₹2L)',
        description: 'Elegant banquet hall with modern facilities and professional event management.',
        contact_score: 88,
        phone: '+91 76543 21098',
        email: 'info@royalbanquet.com',
        venue_type: 'banquet',
        capacity: 400,
        amenities: ['Grand Hall', 'Dance Floor', 'Stage Setup'],
        experience_years: 20,
        weddings_planned: 800,
        images: []
      }
    ];
  }

  /**
   * Generate photography vendors
   */
  static generatePhotographyVendors(location: string): Vendor[] {
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
        experience_years: 12,
        weddings_planned: 450,
        photography_styles: ['Artistic/Creative Photography', 'Cinematic Wedding Videography'],
        images: []
      }
    ];
  }

  /**
   * Generate catering vendors
   */
  static generateCateringVendors(location: string): Vendor[] {
    return [
      {
        id: 'catering-1',
        name: 'Royal Feast Catering',
        category: 'catering',
        location: location,
        rating: 4.9,
        price_range: 'Premium (> ₹2L)',
        description: 'Luxury catering service specializing in multi-cuisine wedding feasts.',
        contact_score: 96,
        phone: '+91 98765 43210',
        email: 'feast@royalcatering.com',
        experience_years: 18,
        weddings_planned: 650,
        specialties: ['Multi-Cuisine Catering', 'International Cuisine'],
        images: []
      }
    ];
  }

  /**
   * Generate wedding planners
   */
  static generateWeddingPlanners(location: string): Vendor[] {
    return [
      {
        id: 'planner-1',
        name: 'Elite Wedding Creations',
        category: 'planners',
        location: location,
        rating: 4.9,
        price_range: 'Premium (> ₹2L)',
        description: 'Award-winning wedding planning studio with 15+ years of experience.',
        contact_score: 98,
        phone: '+91 98765 43210',
        email: 'hello@eliteweddingcreations.com',
        experience_years: 15,
        weddings_planned: 500,
        specialties: ['Luxury Destination Weddings', 'Multi-day Celebrations'],
        images: []
      }
    ];
  }

  /**
   * Generate other vendors
   */
  static generateOtherVendors(category: string, location: string): Vendor[] {
    return [
      {
        id: 'other-1',
        name: `Elite ${category.charAt(0).toUpperCase() + category.slice(1)} Services`,
        category: category,
        location: location,
        rating: 4.8,
        price_range: 'Premium (> ₹2L)',
        description: `Professional ${category} services with over 10 years of experience.`,
        contact_score: 95,
        phone: '+91 98765 43210',
        email: `contact@elite${category}.com`,
        images: []
      }
    ];
  }

  /**
   * Get default wedding data
   */
  static getDefaultWeddingData(): any {
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
   * Get vendor by ID
   */
  static async getVendorById(id: string): Promise<Vendor | null> {
    try {
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