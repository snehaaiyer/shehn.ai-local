import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, Filter, MapPin, Star, DollarSign, Building2, Camera, Utensils, Palette, Music, Sparkles,
  Award, Grid, List, Heart, Phone, Mail, Calendar, Users
} from "lucide-react";
import { VendorDiscoveryService } from '../services/vendor_discovery_service';
import { VendorCommunicationService } from '../services/vendor_communication_service';

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
  contact?: { // Assuming contact object structure based on usage
    phone?: string;
    email?: string;
  };
  preferences_match_score?: number;
  preference_insights?: string[];
  compatibility_details?: {
    priority_bonus: number;
  };
}

// Placeholder for weddingPreferences state, assuming it's managed elsewhere or fetched
const weddingPreferences = {
  weddingDate: '2024-12-31',
  guestCount: 150,
  region: 'New York',
  weddingType: 'Classic',
  theme: { selectedTheme: 'Royal' },
  // ... other preference details
};

const VendorDiscovery: React.FC = () => {
  // Core state
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('venues'); // Default to venues
  const [favorites, setFavorites] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState('grid');
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedBudget, setSelectedBudget] = useState('');
  const [selectedRating, setSelectedRating] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({
    category: '',
    location: '',
    budget: '',
    rating: ''
  });
  const [filtersChanged, setFiltersChanged] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [contactingVendor, setContactingVendor] = useState<string | null>(null);

  const categories = [
    { id: 'venues', name: 'Venues', icon: <Building2 className="h-5 w-5" /> },
    { id: 'photography', name: 'Photography', icon: <Camera className="h-5 w-5" /> },
    { id: 'catering', name: 'Catering', icon: <Utensils className="h-5 w-5" /> },
    { id: 'decoration', name: 'Decoration', icon: <Palette className="h-5 w-5" /> },
    { id: 'entertainment', name: 'Entertainment', icon: <Music className="h-5 w-5" /> },
    { id: 'beauty', name: 'Beauty & Makeup', icon: <Sparkles className="h-5 w-5" /> },
    { id: 'planners', name: 'Wedding Planners', icon: <Award className="h-5 w-5" /> }
  ];

  const toggleFavorite = (vendorId: string) => {
    setFavorites(prev =>
      prev.includes(vendorId)
        ? prev.filter(id => id !== vendorId)
        : [...prev, vendorId]
    );
  };

  const handlePhoneCall = (phone: string) => {
    window.open(`tel:${phone}`, '_self');
  };

  const handleWhatsAppContact = (vendor: Vendor) => {
    const message = `Hi ${vendor.name}, I'm interested in your services for my wedding. Could you please provide more information?`;
    const whatsappUrl = `https://wa.me/${vendor.phone?.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleWebsite = (website: string) => {
    const url = website.startsWith('http') ? website : `https://${website}`;
    window.open(url, '_blank');
  };

  const handleEmailContact = async (vendor: Vendor) => {
    try {
      setContactingVendor(vendor.id);
      // Assuming weddingPreferences is available in scope or passed as argument
      const result = await VendorCommunicationService.sendVendorEmail(vendor, weddingPreferences);

      if (result.success) {
        setNotification({
          type: 'success',
          message: `Email sent to ${vendor.name} successfully!`
        });
      } else {
        throw new Error(result.error || 'Failed to send email');
      }
    } catch (error) {
      console.error('Email error:', error);
      setNotification({
        type: 'error',
        message: `Failed to send email to ${vendor.name}`
      });
    } finally {
      setContactingVendor(null);
    }
  };

  const handleGmailContact = (vendor: Vendor) => {
    const params = new URLSearchParams({
      action: 'email',
      vendorName: vendor.name,
      vendorEmail: vendor.contact?.email || '',
      vendorCategory: vendor.category,
      weddingDate: weddingPreferences?.weddingDate || '',
      guestCount: weddingPreferences?.guestCount?.toString() || '',
      location: weddingPreferences?.region || ''
    });
    window.open(`/vendor-communication?${params.toString()}`, '_blank');
  };

  const handleScheduleMeeting = (vendor: Vendor) => {
    const params = new URLSearchParams({
      action: 'calendar',
      vendorName: vendor.name,
      vendorEmail: vendor.contact?.email || '',
      vendorCategory: vendor.category,
      eventType: 'vendor-meeting'
    });
    window.open(`/vendor-communication?${params.toString()}`, '_blank');
  };

  const handleInstagram = (vendorName: string, instagramHandle?: string) => {
    if (instagramHandle) {
      const handle = instagramHandle.replace('@', '');
      const instagramUrl = `https://www.instagram.com/${handle}`;
      window.open(instagramUrl, '_blank');
    } else {
      const instagramUrl = `https://www.instagram.com/explore/tags/${encodeURIComponent(vendorName.replace(/\s+/g, ''))}`;
      window.open(instagramUrl, '_blank');
    }
  };

  const searchVendors = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);
    setErrorMessage('');

    try {
      const searchParams = {
        category: appliedFilters.category || selectedCategory,
        location: appliedFilters.location || selectedLocation,
        priceRange: appliedFilters.budget || selectedBudget,
        rating: appliedFilters.rating || selectedRating,
        searchTerm: searchQuery
      };

      console.log('🔍 Searching vendors with params:', searchParams);

      const response = await VendorDiscoveryService.searchVendors(searchParams);

      if (response.success && response.vendors) {
        setFilteredVendors(response.vendors);
        console.log(`✅ Found ${response.vendors.length} vendors`);
      } else {
        console.error('❌ Error searching vendors:', response.error);
        setErrorMessage(response.error || 'Failed to search vendors');
        setFilteredVendors([]);
      }
    } catch (error) {
      console.error('❌ Critical error fetching vendors:', error);
      setHasError(true);
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error occurred');
      setFilteredVendors([]);
    } finally {
      setIsLoading(false);
    }
  }, [appliedFilters, selectedCategory, selectedLocation, selectedBudget, selectedRating, searchQuery]);

  // Load comprehensive preferences and apply intelligent defaults
  useEffect(() => {
    const loadDefaultPreferences = () => {
      try {
        const savedPreferences = localStorage.getItem('weddingPreferences');
        if (savedPreferences) {
          const preferences = JSON.parse(savedPreferences);
          console.log('📋 Loading comprehensive wedding preferences for vendor discovery:', preferences);

          // Apply location preference
          if (preferences.basicDetails?.location) {
            const location = preferences.basicDetails.location.toLowerCase();
            setSelectedLocation(location);
            setAppliedFilters(prev => ({ ...prev, location }));
          }

          // Determine initial category based on priorities
          let initialCategory = 'venues'; // Default
          if (preferences.basicDetails?.priorities && preferences.basicDetails.priorities.length > 0) {
            const topPriority = preferences.basicDetails.priorities[0];
            // Map priority IDs to vendor categories
            const priorityCategoryMap: { [key: string]: string } = {
              'venue': 'venues',
              'venues': 'venues',
              'photography': 'photography',
              'catering': 'catering',
              'decor': 'decoration',
              'entertainment': 'entertainment',
              'outfits': 'beauty',
              'flowers': 'decoration',
              'transportation': 'planners'
            };
            initialCategory = priorityCategoryMap[topPriority.id] || 'venues';
            console.log(`🎯 Setting initial category to '${initialCategory}' based on top priority: ${topPriority.name}`);
          }

          setSelectedCategory(initialCategory);
          setAppliedFilters(prev => ({ ...prev, category: initialCategory }));

          // Apply budget preference with enhanced mapping
          if (preferences.basicDetails?.budgetRange) {
            const budget = preferences.basicDetails.budgetRange;
            const budgetMapping: { [key: string]: string } = {
              '₹5-15 Lakhs': 'budget',
              '₹15-30 Lakhs': 'standard',
              '₹30-50 Lakhs': 'premium',
              '₹50+ Lakhs': 'luxury',
              // Legacy support
              'budget-5-15l': 'budget',
              'premium-15-30l': 'standard',
              'luxury-30-50l': 'premium',
              'ultra-luxury-50l+': 'luxury'
            };

            const budgetFilter = budgetMapping[budget] || 'standard';
            setSelectedBudget(budgetFilter);
            setAppliedFilters(prev => ({ ...prev, budget: budgetFilter }));
            console.log(`💰 Applied budget filter: ${budgetFilter} (from: ${budget})`);
          }

          // Apply rating filter based on wedding style
          let ratingFilter = '4.5'; // Default high rating
          const weddingStyle = preferences.theme?.selectedTheme;
          if (weddingStyle?.includes('luxury') || weddingStyle?.includes('royal') || weddingStyle?.includes('premium')) {
            ratingFilter = '4.5'; // Premium weddings need high-rated vendors
          } else if (weddingStyle?.includes('budget') || weddingStyle?.includes('simple')) {
            ratingFilter = '4.0'; // More flexible for budget weddings
          }

          setSelectedRating(ratingFilter);
          setAppliedFilters(prev => ({ ...prev, rating: ratingFilter }));
          console.log(`⭐ Applied rating filter: ${ratingFilter} (based on style: ${weddingStyle})`);

          // Store additional context for intelligent vendor matching
          const vendorMatchingContext = {
            weddingTheme: preferences.theme?.selectedTheme || '',
            venueType: preferences.venue?.venueType || '',
            guestCount: preferences.basicDetails?.guestCount || 100,
            weddingDate: preferences.basicDetails?.weddingDate || '',
            eventDuration: preferences.basicDetails?.eventDuration || '1',
            catering: {
              cuisine: preferences.catering?.cuisine || '',
              mealType: preferences.catering?.mealType || '',
              dietaryRestrictions: preferences.catering?.dietaryRestrictions || []
            },
            photography: {
              style: preferences.photography?.style || '',
              coverage: preferences.photography?.coverage || '',
              videography: preferences.photography?.videography?.required || false,
              multiDay: Object.values(preferences.photography?.multiDayCoverage || {}).some(Boolean)
            },
            priorities: preferences.basicDetails?.priorities?.slice(0, 3).map((p: any) => p.id) || []
          };

          localStorage.setItem('vendorMatchingContext', JSON.stringify(vendorMatchingContext));
          console.log('🔍 Stored vendor matching context:', vendorMatchingContext);

        } else {
          console.log('📝 No saved preferences found, using intelligent defaults');
          // Default to venues even without preferences
          setSelectedCategory('venues');
          setAppliedFilters(prev => ({ ...prev, category: 'venues' }));
        }
      } catch (error) {
        console.error('❌ Error loading preferences for vendor discovery:', error);
        // Default to venues on error
        setSelectedCategory('venues');
        setAppliedFilters(prev => ({ ...prev, category: 'venues' }));
      }
    };

    loadDefaultPreferences();
  }, []);

  useEffect(() => {
    try {
      searchVendors();
    } catch (error) {
      console.error('Error in searchVendors useEffect:', error);
      setHasError(true);
    }
  }, [searchVendors]);

  // Trigger search immediately when applied category changes
  useEffect(() => {
    if (appliedFilters.category) {
      try {
        searchVendors();
      } catch (error) {
        console.error('Error searching vendors on category change:', error);
        setHasError(true);
      }
    }
  }, [appliedFilters.category, searchVendors]);

  const handleFilterChange = (filterType: string, value: string) => {
    switch (filterType) {
      case 'category':
        setSelectedCategory(value);
        setAppliedFilters(prev => ({ ...prev, category: value }));
        setFiltersChanged(false); // Category changes are applied immediately
        break;
      case 'location':
        setSelectedLocation(value);
        setFiltersChanged(true);
        break;
      case 'budget':
        setSelectedBudget(value);
        setFiltersChanged(true);
        break;
      case 'rating':
        setSelectedRating(value);
        setFiltersChanged(true);
        break;
    }
  };

  const applyFilters = () => {
    setAppliedFilters({
      category: selectedCategory,
      location: selectedLocation,
      budget: selectedBudget,
      rating: selectedRating
    });
    setFiltersChanged(false);
    searchVendors();
  };

  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedLocation('');
    setSelectedBudget('');
    setSelectedRating('');
    setAppliedFilters({
      category: '',
      location: '',
      budget: '',
      rating: ''
    });
    setFiltersChanged(false);
  };

  const openVendorModal = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setShowVendorModal(true);
  };

  const closeVendorModal = () => {
    setSelectedVendor(null);
    setShowVendorModal(false);
  };

  // Show error state if there's a critical error
  if (hasError) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-8 bg-white rounded-2xl shadow-lg border border-red-100">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <span className="text-red-500 text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-4">
            {errorMessage || 'There was an error loading the vendor discovery page.'}
          </p>
          <div className="space-y-2">
            <button
              onClick={() => {
                setHasError(false);
                setErrorMessage('');
                searchVendors();
              }}
              className="w-full px-4 py-2 bg-salmon-pink text-white rounded-lg hover:shadow-lg transition-all duration-300"
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-300"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="bg-white rounded-2xl p-8 border shadow-lg" style={{ borderColor: '#FFB6C1' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#2F4F4F' }}>
                  <Search className="h-6 w-6" style={{ color: '#FFFFFF' }} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold" style={{ color: '#2F4F4F' }}>Vendor Discovery</h1>
                  <p className="text-gray-600">Find the perfect vendors for your wedding</p>
                </div>
              </div>
              <button
                onClick={() => setFiltersChanged(!filtersChanged)}
                className="px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 hover:opacity-90"
                style={{ backgroundColor: '#D29B9B', color: '#FFFFFF' }}
              >
                <Filter className="h-4 w-4" />
                Filters
              </button>
            </div>
          </div>

          {/* Vendor Search Tabs */}
          <div className="bg-white rounded-2xl p-6 border shadow-lg" style={{ borderColor: '#FFB6C1' }}>
            <div className="flex overflow-x-auto gap-2 pb-2">
              {categories.map((category) => {
                const Icon = category.icon;
                const isActive = selectedCategory === category.id;

                return (
                  <button
                    key={category.id}
                    onClick={() => handleFilterChange('category', category.id)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-300 whitespace-nowrap ${
                      isActive
                        ? 'bg-deep-navy text-white shadow-lg'
                        : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {Icon}
                    <span>{category.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preferences Summary */}
          {(() => {
            const savedPreferences = localStorage.getItem('weddingPreferences');
            const preferences = savedPreferences ? JSON.parse(savedPreferences) : null;

            if (preferences) {
              return (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border shadow-lg" style={{ borderColor: '#E6E6FA' }}>
                  <h2 className="text-lg font-bold mb-4" style={{ color: '#2F4F4F' }}>
                    🎯 Smart Matching Active
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    {preferences.basicDetails?.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-blue-600" />
                        <span className="text-gray-700">{preferences.basicDetails.location}</span>
                      </div>
                    )}
                    {preferences.theme?.selectedTheme && (
                      <div className="flex items-center gap-2">
                        <Palette className="h-4 w-4 text-purple-600" />
                        <span className="text-gray-700">{preferences.theme.selectedTheme.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</span>
                      </div>
                    )}
                    {preferences.basicDetails?.budgetRange && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="text-gray-700">{preferences.basicDetails.budgetRange}</span>
                      </div>
                    )}
                    {preferences.basicDetails?.guestCount && (
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-orange-600" />
                        <span className="text-gray-700">{preferences.basicDetails.guestCount} guests</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 text-xs text-gray-600">
                    💡 Vendors are automatically filtered and ranked based on your wedding preferences.
                    Higher match scores indicate better alignment with your choices.
                  </div>
                </div>
              );
            }
            return null;
          })()}

          {/* Search and Quick Filters */}
          <div className="bg-white rounded-2xl p-8 border shadow-lg space-y-6" style={{ borderColor: '#FFB6C1' }}>
            <h2 className="text-xl font-bold" style={{ color: '#2F4F4F' }}>
              {selectedCategory ? `${categories.find(c => c.id === selectedCategory)?.name} Search` : 'Vendor Search'}
            </h2>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder={`Search ${selectedCategory ? categories.find(c => c.id === selectedCategory)?.name.toLowerCase() : 'vendors'}, locations, or services...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white rounded-xl border border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-400/20 transition-all duration-300 text-gray-700 placeholder-gray-400"
              />
            </div>

            {/* Quick Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Location Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <select
                  value={selectedLocation}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-400/20 transition-all duration-300 text-gray-700"
                >
                  <option value="">All Locations</option>
                  <option value="mumbai">Mumbai</option>
                  <option value="delhi">Delhi</option>
                  <option value="bangalore">Bangalore</option>
                  <option value="pune">Pune</option>
                  <option value="hyderabad">Hyderabad</option>
                  <option value="chennai">Chennai</option>
                  <option value="kolkata">Kolkata</option>
                  <option value="ahmedabad">Ahmedabad</option>
                  <option value="jaipur">Jaipur</option>
                  <option value="udaipur">Udaipur</option>
                  <option value="goa">Goa</option>
                </select>
              </div>

              {/* Budget Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Budget Range</label>
                <select
                  value={selectedBudget}
                  onChange={(e) => handleFilterChange('budget', e.target.value)}
                  className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-400/20 transition-all duration-300 text-gray-700"
                >
                  <option value="">Any Budget</option>
                  <option value="budget">Budget Friendly</option>
                  <option value="standard">Standard</option>
                  <option value="premium">Premium</option>
                  <option value="luxury">Luxury</option>
                </select>
              </div>

              {/* Rating Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Rating</label>
                <select
                  value={selectedRating}
                  onChange={(e) => handleFilterChange('rating', e.target.value)}
                  className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-400/20 transition-all duration-300 text-gray-700"
                >
                  <option value="">Any Rating</option>
                  <option value="4.5">4.5+ Stars</option>
                  <option value="4.0">4.0+ Stars</option>
                  <option value="3.5">3.5+ Stars</option>
                </select>
              </div>
            </div>

            {/* Filter Action Buttons */}
            <div className="flex justify-center gap-4">
              {filtersChanged && (
                <button
                  onClick={() => {
                    applyFilters();
                    setFiltersChanged(false);
                  }}
                  className="px-8 py-3 rounded-xl font-semibold hover:opacity-90 transition-all duration-300 flex items-center gap-2"
                  style={{ backgroundColor: '#2F4F4F', color: '#FFFFFF' }}
                >
                  <Search className="h-4 w-4" />
                  Apply Filters
                </button>
              )}

              {(selectedCategory || selectedLocation || selectedBudget || selectedRating) && (
                <button
                  onClick={clearFilters}
                  className="px-6 py-3 rounded-xl font-medium hover:opacity-90 transition-all duration-300"
                  style={{ backgroundColor: '#D29B9B', color: '#FFFFFF' }}
                >
                  Clear All Filters
                </button>
              )}
            </div>
          </div>

          {/* Results */}
          <div className="bg-white rounded-2xl p-8 border shadow-lg space-y-6" style={{ borderColor: '#FFB6C1' }}>
            {/* Results Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold" style={{ color: '#2F4F4F' }}>
                  {filteredVendors.length} vendors found
                </h2>
                <p className="text-sm text-gray-600">
                  {searchQuery && `Searching for "${searchQuery}"`}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all duration-300 ${
                    viewMode === 'grid'
                      ? 'bg-gray-200 text-gray-700'
                      : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                  }`}
                >
                  <Grid className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all duration-300 ${
                    viewMode === 'list'
                      ? 'bg-gray-200 text-gray-700'
                      : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                  }`}
                >
                  <List className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#FFB6C1' }}></div>
                  <span className="text-gray-600">Searching vendors...</span>
                </div>
              </div>
            )}

            {/* Vendor Grid/List */}
            {!isLoading && (
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                {filteredVendors.map((vendor) => (
                  <div key={vendor.id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300">
                    {/* Vendor Images */}
                    <div className="h-40 relative overflow-hidden">
                      {vendor.images && vendor.images.length > 0 ? (
                        <img
                          src={vendor.images[0]}
                          alt={vendor.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400&h=300&fit=crop';
                          }}
                        />
                      ) : (
                        <div className="h-full bg-gray-100 flex items-center justify-center">
                          <Building2 className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                      {/* Favorite Button */}
                      <button
                        onClick={() => toggleFavorite(vendor.id)}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-white/80 hover:bg-white transition-colors"
                      >
                        <Heart className={`h-4 w-4 ${favorites.includes(vendor.id) ? 'text-red-500 fill-current' : 'text-gray-400'}`} />
                      </button>
                    </div>

                    {/* Compact Vendor Info */}
                    <div className="p-4">
                      <div className="mb-3">
                        <div className="flex items-start justify-between mb-1">
                          <h3 className="text-lg font-bold text-gray-800 line-clamp-1 flex-1">{vendor.name}</h3>
                          {/* Preference Match Indicator */}
                          {vendor.preferences_match_score && vendor.preferences_match_score >= 80 && (
                            <div className="ml-2 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full flex items-center gap-1">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              {vendor.preferences_match_score}% Match
                            </div>
                          )}
                          {vendor.preferences_match_score && vendor.preferences_match_score >= 60 && vendor.preferences_match_score < 80 && (
                            <div className="ml-2 px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full flex items-center gap-1">
                              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                              {vendor.preferences_match_score}% Match
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                          <MapPin className="h-4 w-4" />
                          <span className="line-clamp-1">{vendor.location}</span>
                        </div>
                        {/* Preference Insights */}
                        {vendor.preference_insights && vendor.preference_insights.length > 0 && (
                          <div className="mb-2">
                            <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                              {vendor.preference_insights[0]}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Rating & Price */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span className="text-sm font-medium">{vendor.rating}</span>
                          {vendor.compatibility_details?.priority_bonus > 0 && (
                            <div className="ml-1 text-xs text-purple-600 font-medium">
                              Priority
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-gray-600">
                          {vendor.price_range.split('(')[0].trim()}
                        </div>
                      </div>

                      {/* Brief Description */}
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {vendor.description}
                      </p>

                      {/* Action Buttons */}
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          {vendor.phone && (
                            <button
                              onClick={() => handlePhoneCall(vendor.phone)}
                              className="flex-1 px-3 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-1"
                            >
                              📞 Call
                            </button>
                          )}
                          {vendor.phone && (
                            <button
                              onClick={() => handleWhatsAppContact(vendor)}
                              className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-1"
                            >
                              💬 WhatsApp
                            </button>
                          )}
                        </div>

                        <div className="flex gap-2">
                          {vendor.email && (
                            <button
                              onClick={() => handleGmailContact(vendor)}
                              className="flex-1 px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-1"
                            >
                              ✉️ Gmail
                            </button>
                          )}
                          <button
                            onClick={() => handleScheduleMeeting(vendor)}
                            className="flex-1 px-3 py-2 bg-purple-500 text-white text-sm rounded-lg hover:bg-purple-600 transition-colors flex items-center justify-center gap-1"
                          >
                            📅 Schedule
                          </button>
                        </div>

                        <button
                          onClick={() => openVendorModal(vendor)}
                          className="w-full px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors font-medium"
                        >
                          Know More
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Error Message */}
            {!isLoading && errorMessage && !hasError && (
              <div className="text-center py-8">
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 max-w-md mx-auto">
                  <div className="w-12 h-12 mx-auto mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
                    <span className="text-yellow-600 text-xl">⚠️</span>
                  </div>
                  <h3 className="text-lg font-semibold text-yellow-800 mb-2">Search Error</h3>
                  <p className="text-yellow-700 mb-4 text-sm">{errorMessage}</p>
                  <button
                    onClick={() => {
                      setErrorMessage('');
                      searchVendors();
                    }}
                    className="px-6 py-2 rounded-lg font-medium bg-yellow-600 text-white hover:bg-yellow-700 transition-all duration-300"
                  >
                    Retry Search
                  </button>
                </div>
              </div>
            )}

            {/* No Results */}
            {!isLoading && !errorMessage && filteredVendors.length === 0 && (
              <div className="text-center py-12">
                <div className="bg-gray-50 rounded-xl p-8 max-w-md mx-auto">
                  <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">No vendors found</h3>
                  <p className="text-gray-600 mb-4">
                    Try adjusting your search criteria or filters to find more vendors.
                  </p>
                  <button
                    onClick={clearFilters}
                    className="px-6 py-2 rounded-lg font-medium hover:opacity-90 transition-all duration-300"
                    style={{ backgroundColor: '#D29B9B', color: '#FFFFFF' }}
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Vendor Details Modal */}
        {showVendorModal && selectedVendor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl overflow-hidden">
                      {selectedVendor.images && selectedVendor.images.length > 0 ? (
                        <img src={selectedVendor.images[0]} alt={selectedVendor.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <Building2 className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800">{selectedVendor.name}</h2>
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span>{selectedVendor.location}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={closeVendorModal}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Image Gallery */}
                {selectedVendor.images && selectedVendor.images.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {selectedVendor.images.map((image, index) => (
                      <div key={index} className="h-48 rounded-lg overflow-hidden">
                        <img src={image} alt={`${selectedVendor.name} ${index + 1}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Overview</h3>
                    <p className="text-gray-600 mb-4">{selectedVendor.description}</p>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-400" />
                        <span className="font-medium">{selectedVendor.rating}/5.0</span>
                        <span className="text-sm text-gray-500">({selectedVendor.contact_score}% response rate)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-500" />
                        <span>{selectedVendor.price_range}</span>
                      </div>
                      {selectedVendor.experience_years && (
                        <div className="flex items-center gap-2">
                          <Award className="h-4 w-4 text-blue-500" />
                          <span>{selectedVendor.experience_years} years experience</span>
                        </div>
                      )}
                      {selectedVendor.weddings_planned && (
                        <div className="flex items-center gap-2">
                          <Heart className="h-4 w-4 text-red-500" />
                          <span>{selectedVendor.weddings_planned} weddings completed</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Contact Information</h3>
                    <div className="space-y-3">
                      {selectedVendor.phone && (
                        <button
                          onClick={() => handlePhoneCall(selectedVendor.phone!)}
                          className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                        >
                          📞 {selectedVendor.phone}
                        </button>
                      )}

                      {selectedVendor.email && (
                        <button
                          onClick={() => handleEmailContact(selectedVendor)}
                          className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                        >
                          📧 {selectedVendor.email}
                        </button>
                      )}

                      <div className="flex gap-2">
                        {selectedVendor.website && (
                          <button
                            onClick={() => handleWebsite(selectedVendor.website!)}
                            className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center justify-center gap-2"
                          >
                            🌐 Website
                          </button>
                        )}
                        {selectedVendor.instagram && (
                          <button
                            onClick={() => handleInstagram(selectedVendor.name, selectedVendor.instagram)}
                            className="flex-1 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors flex items-center justify-center gap-2"
                          >
                            📸 Instagram
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Venue Specific Info */}
                {selectedVendor.category === 'venues' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {selectedVendor.capacity && (
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Capacity</h3>
                        <p className="text-2xl font-bold text-blue-600">{selectedVendor.capacity} guests</p>
                      </div>
                    )}

                    {selectedVendor.amenities && selectedVendor.amenities.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3">Amenities</h3>
                        <div className="grid grid-cols-1 gap-2">
                          {selectedVendor.amenities.map((amenity, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="text-sm">{amenity}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorDiscovery;