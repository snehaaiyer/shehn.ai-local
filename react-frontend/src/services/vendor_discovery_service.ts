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
  weddingPreferences?: any; // Added for passing preferences
  usePreferenceMatching?: boolean; // Added to enable preference matching
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

export class VendorDiscoveryService {
  /**
   * Search vendors based on parameters and wedding preferences
   */
  static async searchVendors(searchParams: any): Promise<any> {
    try {
      console.log('🔍 VendorDiscoveryService.searchVendors called with:', searchParams);

      const { 
        category, 
        location, 
        priceRange, 
        rating, 
        searchTerm, 
        weddingPreferences = {},
        usePreferenceMatching = false
      } = searchParams;

      // Generate vendors based on category and location
      const allVendors = this.generateVendorsByCategory(category || 'venues', location || 'Mumbai');

      // Apply basic filters
      let filteredVendors = [...allVendors];

      // Filter by search term
      if (searchTerm && searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        filteredVendors = filteredVendors.filter(vendor => 
          vendor.name.toLowerCase().includes(term) ||
          vendor.description.toLowerCase().includes(term) ||
          (vendor.specialties && vendor.specialties.some(s => s.toLowerCase().includes(term)))
        );
      }

      // Enhanced preference-based filtering
      if (usePreferenceMatching && weddingPreferences) {
        filteredVendors = this.applyPreferenceBasedFiltering(filteredVendors, weddingPreferences, category);
      }

      // Filter by price range
      if (priceRange && priceRange !== '') {
        filteredVendors = filteredVendors.filter(vendor => {
          const vendorPriceCategory = this.getVendorPriceCategory(vendor.price_range);
          return vendorPriceCategory === priceRange || priceRange === 'any';
        });
      }

      // Filter by rating
      if (rating && rating !== '') {
        const minRating = parseFloat(rating);
        if (!isNaN(minRating)) {
          filteredVendors = filteredVendors.filter(vendor => vendor.rating >= minRating);
        }
      }

      // Enhanced sorting based on preferences
      if (usePreferenceMatching && weddingPreferences) {
        filteredVendors = this.sortByPreferenceMatch(filteredVendors, weddingPreferences, category);
      } else {
        // Default sort by rating
        filteredVendors.sort((a, b) => b.rating - a.rating);
      }

      console.log(`✅ Filtered ${filteredVendors.length} vendors from ${allVendors.length} total using ${usePreferenceMatching ? 'preference matching' : 'basic filtering'}`);

      return {
        success: true,
        vendors: filteredVendors,
        total: filteredVendors.length,
        category,
        location,
        source: usePreferenceMatching ? 'preference_enhanced' : 'mock_enhanced',
        preferences_applied: usePreferenceMatching
      };
    } catch (error) {
      console.error('❌ Error in VendorDiscoveryService.searchVendors:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        vendors: []
      };
    }
  }

  /**
   * Apply preference-based filtering for enhanced vendor matching
   */
  private static applyPreferenceBasedFiltering(vendors: any[], preferences: any, category: string): any[] {
    console.log('🎯 Applying preference-based filtering for category:', category);

    let filtered = [...vendors];

    // Venue-specific preference filtering
    if (category === 'venues' && preferences.venueType) {
      filtered = filtered.filter(vendor => {
        const venueTypeMatch = vendor.venue_type === preferences.venueType || 
                              vendor.specialties?.some(s => s.toLowerCase().includes(preferences.venueType.toLowerCase()));
        return venueTypeMatch;
      });
    }

    // Catering-specific preference filtering
    if (category === 'catering' && preferences.cuisine) {
      filtered = filtered.filter(vendor => {
        const cuisineMatch = vendor.specialties?.some(s => s.toLowerCase().includes(preferences.cuisine.toLowerCase())) ||
                           vendor.description?.toLowerCase().includes(preferences.cuisine.toLowerCase());
        return cuisineMatch;
      });
    }

    // Photography-specific preference filtering
    if (category === 'photography' && preferences.photographyStyle) {
      filtered = filtered.filter(vendor => {
        const styleMatch = vendor.photography_styles?.includes(preferences.photographyStyle) ||
                         vendor.specialties?.some(s => s.toLowerCase().includes(preferences.photographyStyle.toLowerCase()));
        return styleMatch;
      });
    }

    // Guest count compatibility
    if (preferences.guestCount && category === 'venues') {
      filtered = filtered.filter(vendor => {
        const capacity = vendor.capacity || 200;
        return capacity >= preferences.guestCount * 0.8; // Allow 20% flexibility
      });
    }

    // Theme compatibility
    if (preferences.weddingTheme) {
      filtered = filtered.filter(vendor => {
        const themeMatch = vendor.specialties?.some(s => 
          s.toLowerCase().includes(preferences.weddingTheme.toLowerCase()) ||
          this.getThemeKeywords(preferences.weddingTheme).some(keyword => 
            s.toLowerCase().includes(keyword.toLowerCase())
          )
        );
        return themeMatch;
      });
    }

    console.log(`🎯 Preference filtering: ${vendors.length} → ${filtered.length} vendors`);
    return filtered;
  }

  /**
   * Sort vendors by preference match score
   */
  private static sortByPreferenceMatch(vendors: any[], preferences: any, category: string): any[] {
    return vendors.map(vendor => ({
      ...vendor,
      preferenceScore: this.calculatePreferenceScore(vendor, preferences, category)
    })).sort((a, b) => {
      // Sort by preference score first, then by rating
      if (b.preferenceScore !== a.preferenceScore) {
        return b.preferenceScore - a.preferenceScore;
      }
      return b.rating - a.rating;
    });
  }

  /**
   * Calculate preference match score for a vendor
   */
  private static calculatePreferenceScore(vendor: any, preferences: any, category: string): number {
    let score = 0;

    // Base score from rating
    score += (vendor.rating / 5.0) * 30;

    // Category-specific scoring
    if (category === 'venues') {
      if (preferences.venueType && vendor.venue_type === preferences.venueType) score += 20;
      if (preferences.guestCount && vendor.capacity) {
        const capacityFit = Math.min(1.0, vendor.capacity / preferences.guestCount);
        score += capacityFit * 15;
      }
    }

    if (category === 'catering') {
      if (preferences.cuisine && vendor.specialties?.some(s => s.toLowerCase().includes(preferences.cuisine.toLowerCase()))) {
        score += 25;
      }
      if (preferences.mealType && vendor.services_offered?.includes(preferences.mealType)) {
        score += 15;
      }
    }

    if (category === 'photography') {
      if (preferences.photographyStyle && vendor.photography_styles?.includes(preferences.photographyStyle)) {
        score += 25;
      }
      if (preferences.videographyRequired && vendor.services_offered?.includes('Videography')) {
        score += 15;
      }
    }

    // Theme compatibility bonus
    if (preferences.weddingTheme) {
      const themeKeywords = this.getThemeKeywords(preferences.weddingTheme);
      const themeMatch = vendor.specialties?.some(s => 
        themeKeywords.some(keyword => s.toLowerCase().includes(keyword.toLowerCase()))
      );
      if (themeMatch) score += 20;
    }

    // Priority bonus - if this category is in top priorities
    if (preferences.priorities?.slice(0, 3).includes(category)) {
      score += 10;
    }

    return Math.min(100, score);
  }

  /**
   * Get theme-related keywords for matching
   */
  private static getThemeKeywords(theme: string): string[] {
    const themeMap: { [key: string]: string[] } = {
      'royal-palace-rajasthani': ['royal', 'rajasthani', 'palace', 'heritage', 'traditional'],
      'traditional-regional-roots': ['traditional', 'cultural', 'regional', 'heritage'],
      'vintage-classic': ['vintage', 'classic', 'heritage', 'antique'],
      'bollywood-glamour': ['bollywood', 'glamour', 'cinematic', 'vibrant'],
      'minimalist-modern': ['modern', 'minimalist', 'contemporary', 'sleek'],
      'luxury-contemporary': ['luxury', 'contemporary', 'premium', 'modern'],
      'eco-friendly-sustainable': ['eco', 'sustainable', 'organic', 'green'],
      'floral-paradise': ['floral', 'garden', 'flowers', 'natural'],
      'bohemian-chic': ['bohemian', 'boho', 'artistic', 'eclectic']
    };

    return themeMap[theme] || [theme];
  }

  /**
   * Get vendor price category
   */
  private static getVendorPriceCategory(priceRange: string): string {
    if (priceRange.includes('Budget') || priceRange.includes('Under')) return 'budget';
    if (priceRange.includes('Mid-Range') || priceRange.includes('Standard')) return 'mid';
    if (priceRange.includes('Premium') || priceRange.includes('Luxury') || priceRange.includes('50+')) return 'premium';
    return 'any';
  }

  /**
   * Generate vendors based on category and location (mock data)
   */
  private static generateVendorsByCategory(category: string, location: string): Vendor[] {
    switch (category) {
      case 'venues':
        return this.generateVenueVendors(location);
      case 'photography':
        return this.generatePhotographyVendors(location);
      case 'catering':
        return this.generateCateringVendors(location);
      case 'planners':
        return this.generateWeddingPlanners(location);
      case 'decoration':
        return this.generateOtherVendors('decoration', location);
      case 'entertainment':
        return this.generateOtherVendors('entertainment', location);
      case 'beauty':
        return this.generateOtherVendors('beauty', location);
      default:
        return [];
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
        id: `other-1-${category}`,
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