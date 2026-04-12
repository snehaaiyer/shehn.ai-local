import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, Filter, MapPin, Star, DollarSign, Building2, Camera, Utensils, Palette, Music, Sparkles,
  Award, Grid, List, Heart, Users, ChevronDown, ChevronUp, Check, X, Undo2, Share2
} from "lucide-react";
import { motion } from 'framer-motion';
import { VendorDiscoveryService } from '../services/vendor_discovery_service';
import { useAppStore } from '../store/useAppStore';
import { getThemeImage } from '../config/theme_images';
// TODO: Replace with MessagingService once built (Phase 3)

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
  contact?: {
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
};

/** Generate an AI match reason for a vendor based on blueprint/preferences context */
function getAIMatchReason(vendor: Vendor, blueprintData: any, preferences: any): string {
  const reasons: string[] = [];

  // Theme match
  const theme = blueprintData?.wedding_summary?.theme || preferences?.theme?.selectedTheme;
  if (theme) {
    const themeLabel = theme.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    reasons.push(`Matches your ${themeLabel} theme`);
  }

  // Budget match
  if (vendor.price_range) {
    const catKey = vendor.category === 'venues' ? 'venue' : vendor.category;
    const spec = blueprintData?.category_specs?.[catKey] || blueprintData?.category_specs?.[vendor.category];
    if (spec?.budget_allocated) {
      const formatted = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(spec.budget_allocated);
      reasons.push(`Within ${formatted} budget`);
    }
  }

  // Rating match
  if (vendor.rating >= 4.5) {
    const city = vendor.location || blueprintData?.wedding_summary?.city || '';
    reasons.push(`${vendor.rating}★ in ${city}`);
  }

  // Preference insights
  if (vendor.preference_insights && vendor.preference_insights.length > 0) {
    reasons.push(vendor.preference_insights[0]);
  }

  return reasons.length > 0 ? reasons[0] : 'Top-rated in your area';
}

/** Extract highlight badges from vendor description */
const extractHighlights = (vendor: any): string[] => {
  const desc = (vendor.description || vendor.business_description || '').toLowerCase();
  const highlights: string[] = [];
  if (/award|featured|top \d+/i.test(desc)) highlights.push('Award-winning');
  if (/celebrity|bollywood|film/i.test(desc)) highlights.push('Celebrity portfolio');
  if (/\d{2,}\+?\s*year/i.test(desc)) { const m = desc.match(/(\d{2,})\+?\s*year/); if (m) highlights.push(`${m[1]}+ years exp`); }
  if (/budget|affordable|value/i.test(desc)) highlights.push('Budget-friendly');
  if (/premium|luxury|5.star/i.test(desc)) highlights.push('Premium');
  if (/jain|vegan|organic/i.test(desc)) highlights.push('Dietary specialist');
  if (/drone|cinematic|aerial/i.test(desc)) highlights.push('Drone coverage');
  if (vendor.rating >= 4.8) highlights.push(`★ ${vendor.rating} rated`);
  return highlights.slice(0, 3);
};

/** Badge config for top 3 positions */
const TOP_MATCH_BADGES = [
  { label: 'TOP MATCH', emoji: '\uD83E\uDD47', gradient: 'from-yellow-400 to-amber-500', border: 'border-yellow-300', bg: 'bg-yellow-50' },
  { label: 'RUNNER UP', emoji: '\uD83E\uDD48', gradient: 'from-gray-300 to-gray-400', border: 'border-gray-300', bg: 'bg-gray-50' },
  { label: 'GREAT FIT', emoji: '\uD83E\uDD49', gradient: 'from-orange-300 to-orange-500', border: 'border-orange-300', bg: 'bg-orange-50' },
];

const VendorDiscovery: React.FC = () => {
  // Core state
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('venues');
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

  // Blueprint integration
  const blueprintId = useAppStore((state) => state.blueprintId);
  const [blueprintData, setBlueprintData] = useState<any>(null);

  // Approve-don't-explore state
  const [shortlistedVendors, setShortlistedVendors] = useState<string[]>([]);
  const [skippedVendors, setSkippedVendors] = useState<string[]>([]);
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  // Load shortlisted vendors from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('shortlistedVendors');
      if (saved) setShortlistedVendors(JSON.parse(saved));
    } catch { /* ignore parse errors */ }
  }, []);

  // Persist shortlisted vendors to localStorage
  useEffect(() => {
    localStorage.setItem('shortlistedVendors', JSON.stringify(shortlistedVendors));
  }, [shortlistedVendors]);

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

  const shortlistVendor = (vendorId: string) => {
    setShortlistedVendors(prev =>
      prev.includes(vendorId) ? prev : [...prev, vendorId]
    );
    setSkippedVendors(prev => prev.filter(id => id !== vendorId));
  };

  const skipVendor = (vendorId: string) => {
    setSkippedVendors(prev =>
      prev.includes(vendorId) ? prev : [...prev, vendorId]
    );
  };

  const undoSkip = (vendorId: string) => {
    setSkippedVendors(prev => prev.filter(id => id !== vendorId));
  };

  const handlePhoneCall = (phone: string) => {
    window.open(`tel:${phone}`, '_self');
  };

  const handleInquiry = (vendor: Vendor) => {
    setNotification({
      type: 'success',
      message: `Inquiry sent to ${vendor.name}! (On-platform messaging coming soon)`
    });
  };

  const handleWebsite = (website: string) => {
    const url = website.startsWith('http') ? website : `https://${website}`;
    window.open(url, '_blank');
  };

  const handleEmailContact = async (vendor: Vendor) => {
    handleInquiry(vendor);
    setContactingVendor(null);
  };

  const shareBlueprintWithVendor = (vendor: Vendor) => {
    try {
      const existing = JSON.parse(localStorage.getItem('sharedBlueprints') || '[]');
      if (!existing.some((v: any) => v.id === vendor.id)) {
        existing.push({ id: vendor.id, name: vendor.name, category: vendor.category, sharedAt: new Date().toISOString() });
        localStorage.setItem('sharedBlueprints', JSON.stringify(existing));
      }
      setNotification({ type: 'success', message: `Blueprint shared with ${vendor.name}!` });
    } catch {
      setNotification({ type: 'error', message: 'Failed to share blueprint. Please try again.' });
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
    window.open(`/messages?${params.toString()}`, '_blank');
  };

  const handleScheduleMeeting = (vendor: Vendor) => {
    const params = new URLSearchParams({
      action: 'calendar',
      vendorName: vendor.name,
      vendorEmail: vendor.contact?.email || '',
      vendorCategory: vendor.category,
      eventType: 'vendor-meeting'
    });
    window.open(`/messages?${params.toString()}`, '_blank');
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

      console.log('Searching vendors with params:', searchParams);

      const response = await VendorDiscoveryService.searchVendors(searchParams);

      if (response.success && response.vendors) {
        setFilteredVendors(response.vendors);
        console.log(`Found ${response.vendors.length} vendors`);
      } else {
        console.error('Error searching vendors:', response.error);
        setErrorMessage(response.error || 'Failed to search vendors');
        setFilteredVendors([]);
      }
    } catch (error) {
      console.error('Critical error fetching vendors:', error);
      setHasError(true);
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error occurred');
      setFilteredVendors([]);
    } finally {
      setIsLoading(false);
    }
  }, [appliedFilters, selectedCategory, selectedLocation, selectedBudget, selectedRating, searchQuery]);

  // Fetch blueprint data when blueprintId is available
  useEffect(() => {
    if (!blueprintId) return;
    const fetchBlueprint = async () => {
      try {
        const response = await fetch(`/api/blueprint/${blueprintId}`);
        if (response.ok) {
          const data = await response.json();
          console.log('Blueprint data loaded for vendor discovery:', data);
          setBlueprintData(data);

          const city = data.wedding_summary?.city;
          if (city) {
            const cityLower = city.toLowerCase();
            setSelectedLocation(cityLower);
            setAppliedFilters(prev => ({ ...prev, location: cityLower }));
          }

          const specs = data.category_specs;
          if (specs) {
            const catKey = selectedCategory === 'venues' ? 'venue' : selectedCategory;
            const catSpec = specs[catKey] || specs[selectedCategory];
            if (catSpec?.budget_allocated) {
              const allocated = catSpec.budget_allocated;
              let budgetFilter = 'standard';
              if (allocated < 200000) budgetFilter = 'budget';
              else if (allocated < 500000) budgetFilter = 'standard';
              else if (allocated < 1500000) budgetFilter = 'premium';
              else budgetFilter = 'luxury';
              setSelectedBudget(budgetFilter);
              setAppliedFilters(prev => ({ ...prev, budget: budgetFilter }));
            }
          }
        }
      } catch (error) {
        console.error('Error fetching blueprint for vendor discovery:', error);
      }
    };
    fetchBlueprint();
  }, [blueprintId]);

  // Load comprehensive preferences and apply intelligent defaults + AUTO-SEARCH
  useEffect(() => {
    const loadDefaultPreferences = async () => {
      try {
        const savedPreferences = localStorage.getItem('weddingPreferences');
        if (savedPreferences) {
          const preferences = JSON.parse(savedPreferences);
          console.log('Loading comprehensive wedding preferences for vendor discovery:', preferences);

          if (preferences.basicDetails?.location) {
            const location = preferences.basicDetails.location.toLowerCase();
            setSelectedLocation(location);
            setAppliedFilters(prev => ({ ...prev, location }));
          }

          let initialCategory = 'venues';
          if (preferences.basicDetails?.priorities && preferences.basicDetails.priorities.length > 0) {
            const topPriority = preferences.basicDetails.priorities[0];
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
            console.log(`Setting initial category to '${initialCategory}' based on top priority: ${topPriority.name}`);
          }

          setSelectedCategory(initialCategory);

          console.log('Auto-searching vendors based on saved preferences...');
          setIsLoading(true);

          try {
            const searchParams = {
              category: initialCategory,
              location: preferences.basicDetails?.location || 'Bangalore',
              priceRange: preferences.basicDetails?.budgetRange || 'Standard',
              rating: '4.0+',
              capacity: preferences.basicDetails?.guestCount || 200
            };

            console.log('Auto-search params:', searchParams);
            const result = await VendorDiscoveryService.searchVendors(searchParams);

            if (result.success) {
              console.log('Auto-loaded vendors:', result.vendors?.length || 0);
              setFilteredVendors(result.vendors || []);
              setAppliedFilters({
                category: initialCategory,
                location: searchParams.location.toLowerCase(),
                budget: searchParams.priceRange,
                rating: searchParams.rating
              });
            } else {
              console.error('Auto-search failed:', result.error);
              setHasError(true);
              setErrorMessage(result.error || 'Failed to load vendors automatically');
            }
          } catch (error) {
            console.error('Auto-search error:', error);
            setHasError(true);
            setErrorMessage('Unable to load vendors. Please try refreshing.');
          } finally {
            setIsLoading(false);
          }

          if (preferences.basicDetails?.budgetRange) {
            const budget = preferences.basicDetails.budgetRange;
            const budgetMapping: { [key: string]: string } = {
              '₹5-15 Lakhs': 'budget',
              '₹15-30 Lakhs': 'standard',
              '₹30-50 Lakhs': 'premium',
              '₹50+ Lakhs': 'luxury',
              'budget-5-15l': 'budget',
              'premium-15-30l': 'standard',
              'luxury-30-50l': 'premium',
              'ultra-luxury-50l+': 'luxury'
            };

            const budgetFilter = budgetMapping[budget] || 'standard';
            setSelectedBudget(budgetFilter);
            setAppliedFilters(prev => ({ ...prev, budget: budgetFilter }));
            console.log(`Applied budget filter: ${budgetFilter} (from: ${budget})`);
          }

          let ratingFilter = '4.5';
          const weddingStyle = preferences.theme?.selectedTheme;
          if (weddingStyle?.includes('luxury') || weddingStyle?.includes('royal') || weddingStyle?.includes('premium')) {
            ratingFilter = '4.5';
          } else if (weddingStyle?.includes('budget') || weddingStyle?.includes('simple')) {
            ratingFilter = '4.0';
          }

          setSelectedRating(ratingFilter);
          setAppliedFilters(prev => ({ ...prev, rating: ratingFilter }));
          console.log(`Applied rating filter: ${ratingFilter} (based on style: ${weddingStyle})`);

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
          console.log('Stored vendor matching context:', vendorMatchingContext);

        } else {
          console.log('No saved preferences found, using intelligent defaults');
          setSelectedCategory('venues');
          setAppliedFilters(prev => ({ ...prev, category: 'venues' }));
        }
      } catch (error) {
        console.error('Error loading preferences for vendor discovery:', error);
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
        setFiltersChanged(false);
        if (blueprintData?.category_specs) {
          const catKey = value === 'venues' ? 'venue' : value;
          const spec = blueprintData.category_specs[catKey] || blueprintData.category_specs[value];
          if (spec?.budget_allocated) {
            const allocated = spec.budget_allocated;
            let budgetFilter = 'standard';
            if (allocated < 200000) budgetFilter = 'budget';
            else if (allocated < 500000) budgetFilter = 'standard';
            else if (allocated < 1500000) budgetFilter = 'premium';
            else budgetFilter = 'luxury';
            setSelectedBudget(budgetFilter);
            setAppliedFilters(prev => ({ ...prev, budget: budgetFilter }));
          }
        }
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

  // Compute category-level stats for the horizontal nav
  const getCategoryStats = (catId: string) => {
    const matchCount = filteredVendors.filter(v => v.category === catId || selectedCategory === catId).length;
    const hasShortlisted = shortlistedVendors.some(sid =>
      filteredVendors.some(v => v.id === sid && (v.category === catId || selectedCategory === catId))
    );
    return { matchCount: selectedCategory === catId ? filteredVendors.length : 0, hasShortlisted };
  };

  // Parsed preferences for display
  const savedPrefs = (() => {
    try {
      const raw = localStorage.getItem('weddingPreferences');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  })();

  // Show error state if there's a critical error
  if (hasError) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-8 bg-white rounded-2xl shadow-lg border border-red-100">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <span className="text-red-500 text-2xl">!</span>
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

  // Determine mode
  const hasBlueprintContext = !!blueprintId;

  const blueprintCity = blueprintData?.wedding_summary?.city || savedPrefs?.basicDetails?.location || '';
  const blueprintGuests = blueprintData?.wedding_summary?.guest_count || savedPrefs?.basicDetails?.guestCount || '';
  const blueprintBudget = blueprintData?.wedding_summary?.total_budget
    ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(blueprintData.wedding_summary.total_budget)
    : savedPrefs?.basicDetails?.budgetRange || '';

  // Render a single vendor card
  const renderVendorCard = (vendor: Vendor) => {
    const isSkipped = skippedVendors.includes(vendor.id);
    const isShortlisted = shortlistedVendors.includes(vendor.id);
    const matchReason = hasBlueprintContext ? getAIMatchReason(vendor, blueprintData, savedPrefs) : '';

    return (
      <div
        key={vendor.id}
        className={`bg-white rounded-xl shadow-lg border overflow-hidden transition-all duration-300 ${
          isSkipped ? 'opacity-50 border-gray-300' : isShortlisted ? 'border-green-300 ring-2 ring-green-100' : 'border-gray-200 hover:shadow-xl'
        }`}
      >
        {/* Vendor Images */}
        <div className="h-40 relative overflow-hidden">
          {vendor.images && vendor.images.length > 0 ? (
            <img
              src={vendor.images[0]}
              alt={vendor.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = `${process.env.PUBLIC_URL}/images/venues/luxury hotel.png`;
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

          {/* AI Match Badge (blueprint mode only) */}
          {hasBlueprintContext && matchReason && !isSkipped && (
            <div className="absolute bottom-2 left-2 right-10 px-2 py-1 bg-indigo-600/90 text-white text-xs font-medium rounded-lg backdrop-blur-sm truncate">
              AI Match: {matchReason}
            </div>
          )}
        </div>

        {/* Compact Vendor Info */}
        <div className="p-4">
          <div className="mb-3">
            <div className="flex items-start justify-between mb-1">
              <h3 className="text-lg font-bold text-gray-800 line-clamp-1 flex-1">{vendor.name}</h3>
              {vendor.preferences_match_score && vendor.preferences_match_score >= 80 && (
                <div className="ml-2 px-2 py-1 bg-sage-100 text-sage-700 text-xs font-medium rounded-full flex items-center gap-1">
                  <div className="w-2 h-2 bg-sage-500 rounded-full"></div>
                  {vendor.preferences_match_score}% Match
                </div>
              )}
              {vendor.preferences_match_score && vendor.preferences_match_score >= 60 && vendor.preferences_match_score < 80 && (
                <div className="ml-2 px-2 py-1 bg-rose-100 text-rose-700 text-xs font-medium rounded-full flex items-center gap-1">
                  <div className="w-2 h-2 bg-rose-500 rounded-full"></div>
                  {vendor.preferences_match_score}% Match
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <MapPin className="h-4 w-4" />
              <span className="line-clamp-1">{vendor.location}</span>
            </div>
            {!hasBlueprintContext && vendor.preference_insights && vendor.preference_insights.length > 0 && (
              <div className="mb-2">
                <div className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
                  {vendor.preference_insights[0]}
                </div>
              </div>
            )}
          </div>

          {/* Rating & Price */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 text-rose-400 fill-current" />
              <span className="text-sm font-medium">{vendor.rating}</span>
              {(vendor.compatibility_details?.priority_bonus ?? 0) > 0 && (
                <div className="ml-1 text-xs text-rose-600 font-medium">
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

          {/* Action Buttons -- Approve/Skip in blueprint mode, original in explore mode */}
          {hasBlueprintContext ? (
            <div className="space-y-2">
              {isSkipped ? (
                <button
                  onClick={() => undoSkip(vendor.id)}
                  className="w-full px-3 py-2 bg-gray-100 text-gray-600 text-sm rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 font-medium"
                >
                  <Undo2 className="h-4 w-4" />
                  Undo Skip
                </button>
              ) : (
                <>
                  <div className="flex gap-2">
                    <button
                      onClick={() => shortlistVendor(vendor.id)}
                      className={`flex-1 px-3 py-2.5 text-sm rounded-lg transition-colors flex items-center justify-center gap-1.5 font-semibold ${
                        isShortlisted
                          ? 'bg-green-100 text-green-700 border border-green-300'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      <Check className="h-4 w-4" />
                      {isShortlisted ? 'Shortlisted' : 'Shortlist'}
                    </button>
                    <button
                      onClick={() => skipVendor(vendor.id)}
                      className="flex-1 px-3 py-2.5 bg-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center gap-1.5 font-semibold"
                    >
                      <X className="h-4 w-4" />
                      Skip
                    </button>
                  </div>
                  <button
                    onClick={() => openVendorModal(vendor)}
                    className="w-full px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  >
                    Know More
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                {vendor.phone && (
                  <button
                    onClick={() => handlePhoneCall(vendor.phone!)}
                    className="flex-1 px-3 py-2 bg-sage-500 text-white text-sm rounded-lg hover:bg-sage-600 transition-colors flex items-center justify-center gap-1"
                  >
                    Call
                  </button>
                )}
                {vendor.phone && (
                  <button
                    onClick={() => handleInquiry(vendor)}
                    className="flex-1 px-3 py-2 bg-sage-600 text-white text-sm rounded-lg hover:bg-sage-700 transition-colors flex items-center justify-center gap-1"
                  >
                    Send Inquiry
                  </button>
                )}
              </div>

              <div className="flex gap-2">
                {vendor.email && (
                  <button
                    onClick={() => handleGmailContact(vendor)}
                    className="flex-1 px-3 py-2 bg-gray-500 text-white text-sm rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center gap-1"
                  >
                    Email
                  </button>
                )}
                <button
                  onClick={() => handleScheduleMeeting(vendor)}
                  className="flex-1 px-3 py-2 bg-rose-500 text-white text-sm rounded-lg hover:bg-rose-600 transition-colors flex items-center justify-center gap-1"
                >
                  Schedule
                </button>
              </div>

              <button
                onClick={() => openVendorModal(vendor)}
                className="w-full px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Know More
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Reusable filters section
  const renderFilters = () => (
    <div className="space-y-6">
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

      <div className="flex justify-center gap-4">
        {filtersChanged && (
          <button
            onClick={() => {
              applyFilters();
              setFiltersChanged(false);
            }}
            className="px-8 py-3 rounded-xl font-semibold hover:opacity-90 transition-all duration-300 flex items-center gap-2"
            style={{ backgroundColor: '#3D5A3D', color: '#FFFFFF' }}
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
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium transition-all duration-300 ${
          notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        }`}>
          {notification.message}
          <button onClick={() => setNotification(null)} className="ml-3 text-white/80 hover:text-white">x</button>
        </div>
      )}

      {/* Floating Shortlist Badge */}
      {shortlistedVendors.length > 0 && (
        <div className="fixed bottom-6 right-6 z-40 bg-green-600 text-white px-4 py-3 rounded-full shadow-xl flex items-center gap-2 cursor-default">
          <Check className="h-5 w-5" />
          <span className="font-semibold">{shortlistedVendors.length} Shortlisted</span>
        </div>
      )}

      <div className="container mx-auto px-6 py-8">
        <div className="max-w-7xl mx-auto space-y-8">

          {/* ====== BLUEPRINT MODE: Approve-don't-explore ====== */}
          {hasBlueprintContext ? (
            <>
              {/* AI-Matched Header */}
              <div className="bg-white rounded-2xl p-8 border shadow-lg" style={{ borderColor: '#FFB6C1' }}>
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-indigo-600">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold" style={{ color: '#3D5A3D' }}>AI-Matched Vendors for Your Wedding</h1>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mt-1 flex-wrap">
                      {blueprintCity && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" /> {blueprintCity}
                        </span>
                      )}
                      {blueprintGuests && (
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" /> {blueprintGuests} guests
                        </span>
                      )}
                      {blueprintBudget && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3.5 w-3.5" /> {blueprintBudget}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-500">
                  Review vendors matched to your blueprint. Shortlist the ones you like, skip the rest. Your selections are saved automatically.
                </p>
              </div>

              {/* Category Horizontal Scroll with Completion Indicators */}
              <div className="bg-white rounded-2xl p-4 border shadow-lg" style={{ borderColor: '#FFB6C1' }}>
                <div className="flex overflow-x-auto gap-2 pb-1">
                  {categories.map((category) => {
                    const Icon = category.icon;
                    const isActive = selectedCategory === category.id;
                    const stats = getCategoryStats(category.id);
                    const catShortlisted = isActive && shortlistedVendors.some(sid =>
                      filteredVendors.some(v => v.id === sid)
                    );

                    return (
                      <button
                        key={category.id}
                        onClick={() => handleFilterChange('category', category.id)}
                        className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-300 whitespace-nowrap ${
                          isActive
                            ? 'bg-deep-navy text-white shadow-lg'
                            : catShortlisted
                              ? 'bg-green-50 text-green-700 border border-green-300'
                              : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {Icon}
                        <span>{category.name}</span>
                        {isActive && filteredVendors.length > 0 && (
                          <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                            isActive ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
                          }`}>
                            {filteredVendors.length}
                          </span>
                        )}
                        {catShortlisted && !isActive && (
                          <Check className="h-4 w-4 text-green-600" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Blueprint Requirements Card */}
              {blueprintData?.category_specs && (() => {
                const catKey = selectedCategory === 'venues' ? 'venue' : selectedCategory;
                const spec = blueprintData.category_specs[catKey] || blueprintData.category_specs[selectedCategory];
                if (!spec) return null;

                const reqEntries = spec.requirements
                  ? Object.entries(spec.requirements).filter(([, v]) => v)
                  : [];

                return (
                  <div className="bg-indigo-50 rounded-2xl p-6 border shadow-lg" style={{ borderColor: '#E6E6FA' }}>
                    <h2 className="text-lg font-bold mb-3" style={{ color: '#3D5A3D' }}>
                      Blueprint Requirements &mdash; {categories.find(c => c.id === selectedCategory)?.name}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      {spec.budget_allocated != null && (
                        <div className="bg-white rounded-xl p-3 border border-indigo-100">
                          <div className="text-xs text-gray-500 mb-1">Budget Allocated</div>
                          <div className="font-semibold text-gray-800">
                            {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(spec.budget_allocated)}
                          </div>
                        </div>
                      )}
                      {reqEntries.length > 0 && (
                        <div className="bg-white rounded-xl p-3 border border-indigo-100">
                          <div className="text-xs text-gray-500 mb-1">Style / Requirements</div>
                          <div className="space-y-1">
                            {reqEntries.map(([key, value]) => (
                              <div key={key} className="text-gray-700">
                                <span className="font-medium capitalize">{key.replace(/_/g, ' ')}:</span>{' '}
                                {String(value)}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {spec.notes && (
                        <div className="bg-white rounded-xl p-3 border border-indigo-100">
                          <div className="text-xs text-gray-500 mb-1">Notes</div>
                          <div className="text-gray-700">{spec.notes}</div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Collapsible Refine Filters */}
              <div className="bg-white rounded-2xl border shadow-lg overflow-hidden" style={{ borderColor: '#FFB6C1' }}>
                <button
                  onClick={() => setFiltersExpanded(!filtersExpanded)}
                  className="w-full px-6 py-4 flex items-center justify-between text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <span className="font-medium text-sm">Refine Filters</span>
                    {(selectedLocation || selectedBudget || selectedRating) && (
                      <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                        {[selectedLocation, selectedBudget, selectedRating].filter(Boolean).length} active
                      </span>
                    )}
                  </div>
                  {filtersExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                {filtersExpanded && (
                  <div className="px-6 pb-6 border-t border-gray-100 pt-4">
                    {renderFilters()}
                  </div>
                )}
              </div>

              {/* ====== TOP 3 AI MATCH CARDS ====== */}
              {!isLoading && filteredVendors.length >= 1 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Sparkles className="h-5 w-5 text-indigo-600" />
                    <h2 className="text-xl font-bold" style={{ color: '#3D5A3D' }}>
                      Top {Math.min(3, filteredVendors.length)} AI Matches
                    </h2>
                  </div>

                  {/* Desktop: 3 cards side by side | Mobile: swipeable */}
                  <div className="hidden md:grid md:grid-cols-3 gap-6">
                    {filteredVendors.slice(0, 3).map((vendor, index) => {
                      const badge = TOP_MATCH_BADGES[index];
                      const isShortlisted = shortlistedVendors.includes(vendor.id);
                      const matchReason = getAIMatchReason(vendor, blueprintData, savedPrefs);
                      const highlights = extractHighlights(vendor);
                      const vendorImage = (vendor.images && vendor.images.length > 0)
                        ? vendor.images[0]
                        : getThemeImage(blueprintData?.wedding_summary?.theme || savedPrefs?.theme?.selectedTheme);
                      const usp = vendor.specialties?.join(', ') || vendor.description?.slice(0, 80) + '...';

                      return (
                        <div
                          key={vendor.id}
                          className={`bg-white rounded-2xl border-2 shadow-xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${badge.border} ${
                            isShortlisted ? 'ring-2 ring-green-300' : ''
                          }`}
                        >
                          {/* Badge */}
                          <div className={`bg-gradient-to-r ${badge.gradient} px-4 py-2 flex items-center gap-2`}>
                            <span className="text-lg">{badge.emoji}</span>
                            <span className="text-white font-bold text-sm tracking-wider">{badge.label}</span>
                          </div>

                          {/* Image */}
                          <div className="h-44 relative overflow-hidden">
                            <img
                              src={vendorImage}
                              alt={vendor.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = `${process.env.PUBLIC_URL}/classic contemporary.png`;
                              }}
                            />
                            {highlights.length > 0 && (
                              <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                                {highlights.map((h, i) => (
                                  <span key={i} className="px-2 py-0.5 bg-white/90 text-xs font-medium text-gray-700 rounded-full backdrop-blur-sm">
                                    {h}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="p-5 space-y-3">
                            <div>
                              <h3 className="text-lg font-bold text-gray-800 line-clamp-1">{vendor.name}</h3>
                              <div className="flex items-center gap-2 mt-1">
                                <Star className="h-4 w-4 text-rose-400 fill-current" />
                                <span className="text-sm font-semibold">{vendor.rating}</span>
                                <span className="text-xs text-gray-500">({vendor.contact_score || 0} reviews)</span>
                              </div>
                            </div>

                            <div className="text-sm font-medium text-gray-700">
                              {vendor.price_range.split('(')[0].trim()}
                            </div>

                            {/* USP */}
                            <div className="bg-gray-50 rounded-lg p-3">
                              <div className="text-xs font-semibold text-gray-500 uppercase mb-1">USP</div>
                              <p className="text-sm text-gray-700 line-clamp-2">{usp}</p>
                            </div>

                            {/* Match Reason */}
                            <div className="bg-indigo-50 rounded-lg p-3">
                              <div className="text-xs font-semibold text-indigo-500 uppercase mb-1">Why Matched</div>
                              <p className="text-sm text-indigo-700 line-clamp-2">{matchReason}</p>
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-2 pt-1">
                              <button
                                onClick={() => shortlistVendor(vendor.id)}
                                className={`w-full px-3 py-2.5 text-sm rounded-lg transition-colors flex items-center justify-center gap-1.5 font-semibold ${
                                  isShortlisted
                                    ? 'bg-green-100 text-green-700 border border-green-300'
                                    : 'bg-green-600 text-white hover:bg-green-700'
                                }`}
                              >
                                <Heart className={`h-4 w-4 ${isShortlisted ? 'fill-current' : ''}`} />
                                {isShortlisted ? 'Shortlisted' : 'Shortlist'}
                              </button>
                              <button
                                onClick={() => shareBlueprintWithVendor(vendor)}
                                className="w-full px-3 py-2 bg-indigo-100 text-indigo-700 text-sm rounded-lg hover:bg-indigo-200 transition-colors flex items-center justify-center gap-1.5 font-medium"
                              >
                                <Share2 className="h-4 w-4" />
                                Share Blueprint
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Mobile: swipeable cards */}
                  <div className="md:hidden overflow-hidden">
                    <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory -mx-2 px-2">
                      {filteredVendors.slice(0, 3).map((vendor, index) => {
                        const badge = TOP_MATCH_BADGES[index];
                        const isShortlisted = shortlistedVendors.includes(vendor.id);
                        const matchReason = getAIMatchReason(vendor, blueprintData, savedPrefs);
                        const highlights = extractHighlights(vendor);
                        const vendorImage = (vendor.images && vendor.images.length > 0)
                          ? vendor.images[0]
                          : getThemeImage(blueprintData?.wedding_summary?.theme || savedPrefs?.theme?.selectedTheme);
                        const usp = vendor.specialties?.join(', ') || vendor.description?.slice(0, 80) + '...';

                        return (
                          <motion.div
                            key={vendor.id}
                            drag="x"
                            dragConstraints={{ left: 0, right: 0 }}
                            dragElastic={0.1}
                            className={`flex-shrink-0 w-[85vw] max-w-[340px] snap-center bg-white rounded-2xl border-2 shadow-xl overflow-hidden ${badge.border} ${
                              isShortlisted ? 'ring-2 ring-green-300' : ''
                            }`}
                          >
                            {/* Badge */}
                            <div className={`bg-gradient-to-r ${badge.gradient} px-4 py-2 flex items-center gap-2`}>
                              <span className="text-lg">{badge.emoji}</span>
                              <span className="text-white font-bold text-sm tracking-wider">{badge.label}</span>
                            </div>

                            {/* Image */}
                            <div className="h-40 relative overflow-hidden">
                              <img
                                src={vendorImage}
                                alt={vendor.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = `${process.env.PUBLIC_URL}/classic contemporary.png`;
                                }}
                              />
                              {highlights.length > 0 && (
                                <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                                  {highlights.map((h, i) => (
                                    <span key={i} className="px-2 py-0.5 bg-white/90 text-xs font-medium text-gray-700 rounded-full backdrop-blur-sm">
                                      {h}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Content */}
                            <div className="p-4 space-y-3">
                              <div>
                                <h3 className="text-lg font-bold text-gray-800 line-clamp-1">{vendor.name}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                  <Star className="h-4 w-4 text-rose-400 fill-current" />
                                  <span className="text-sm font-semibold">{vendor.rating}</span>
                                  <span className="text-xs text-gray-500">({vendor.contact_score || 0} reviews)</span>
                                </div>
                              </div>

                              <div className="text-sm font-medium text-gray-700">
                                {vendor.price_range.split('(')[0].trim()}
                              </div>

                              <div className="bg-gray-50 rounded-lg p-3">
                                <div className="text-xs font-semibold text-gray-500 uppercase mb-1">USP</div>
                                <p className="text-sm text-gray-700 line-clamp-2">{usp}</p>
                              </div>

                              <div className="bg-indigo-50 rounded-lg p-3">
                                <div className="text-xs font-semibold text-indigo-500 uppercase mb-1">Why Matched</div>
                                <p className="text-sm text-indigo-700 line-clamp-2">{matchReason}</p>
                              </div>

                              <div className="space-y-2 pt-1">
                                <button
                                  onClick={() => shortlistVendor(vendor.id)}
                                  className={`w-full px-3 py-2.5 text-sm rounded-lg transition-colors flex items-center justify-center gap-1.5 font-semibold ${
                                    isShortlisted
                                      ? 'bg-green-100 text-green-700 border border-green-300'
                                      : 'bg-green-600 text-white hover:bg-green-700'
                                  }`}
                                >
                                  <Heart className={`h-4 w-4 ${isShortlisted ? 'fill-current' : ''}`} />
                                  {isShortlisted ? 'Shortlisted' : 'Shortlist'}
                                </button>
                                <button
                                  onClick={() => shareBlueprintWithVendor(vendor)}
                                  className="w-full px-3 py-2 bg-indigo-100 text-indigo-700 text-sm rounded-lg hover:bg-indigo-200 transition-colors flex items-center justify-center gap-1.5 font-medium"
                                >
                                  <Share2 className="h-4 w-4" />
                                  Share Blueprint
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                    <div className="flex justify-center gap-1.5 mt-2">
                      {filteredVendors.slice(0, 3).map((_, i) => (
                        <div key={i} className="w-2 h-2 rounded-full bg-gray-300" />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ====== MORE VENDORS (compact list after top 3) ====== */}
              {!isLoading && filteredVendors.length > 3 && (
                <div className="bg-white rounded-2xl p-6 border shadow-lg space-y-4" style={{ borderColor: '#FFB6C1' }}>
                  <h2 className="text-lg font-bold" style={{ color: '#3D5A3D' }}>
                    More Vendors ({filteredVendors.length - 3})
                  </h2>
                  <div className="divide-y divide-gray-100">
                    {filteredVendors.slice(3).map((vendor) => {
                      const isShortlisted = shortlistedVendors.includes(vendor.id);
                      const isSkipped = skippedVendors.includes(vendor.id);
                      const highlights = extractHighlights(vendor);
                      const firstHighlight = highlights.length > 0 ? highlights[0] : null;
                      const descSnippet = vendor.description?.slice(0, 100) + (vendor.description?.length > 100 ? '...' : '');

                      return (
                        <div
                          key={vendor.id}
                          className={`flex items-center gap-4 py-4 transition-opacity ${isSkipped ? 'opacity-50' : ''}`}
                        >
                          {/* Mini info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-gray-800 truncate">{vendor.name}</h3>
                              {firstHighlight && (
                                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full whitespace-nowrap">
                                  {firstHighlight}
                                </span>
                              )}
                              {isShortlisted && (
                                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full whitespace-nowrap flex items-center gap-1">
                                  <Check className="h-3 w-3" /> Shortlisted
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Star className="h-3.5 w-3.5 text-rose-400 fill-current" />
                                {vendor.rating}
                              </span>
                              <span>{vendor.price_range.split('(')[0].trim()}</span>
                              <span className="hidden sm:inline truncate max-w-[200px]">{descSnippet}</span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {isSkipped ? (
                              <button
                                onClick={() => undoSkip(vendor.id)}
                                className="px-3 py-1.5 text-xs bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1"
                              >
                                <Undo2 className="h-3 w-3" /> Undo
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => shortlistVendor(vendor.id)}
                                  className={`px-3 py-1.5 text-xs rounded-lg transition-colors flex items-center gap-1 font-medium ${
                                    isShortlisted
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-green-600 text-white hover:bg-green-700'
                                  }`}
                                >
                                  <Check className="h-3 w-3" />
                                  {isShortlisted ? 'Done' : 'Shortlist'}
                                </button>
                                <button
                                  onClick={() => skipVendor(vendor.id)}
                                  className="px-3 py-1.5 text-xs bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition-colors"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => openVendorModal(vendor)}
                              className="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                            >
                              View Details
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* ====== EXPLORE MODE: No blueprint ====== */
            <>
              {/* CTA Banner to start with AI Planner */}
              <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-200 shadow-lg">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-indigo-600">
                      <Sparkles className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-indigo-900">Get personalized vendor recommendations</h2>
                      <p className="text-sm text-indigo-700">Let AI match vendors to your wedding style, budget, and preferences.</p>
                    </div>
                  </div>
                  <a
                    href="/plan"
                    className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors text-sm"
                  >
                    Start with AI Planner
                  </a>
                </div>
              </div>

              {/* Original Header */}
              <div className="bg-white rounded-2xl p-8 border shadow-lg" style={{ borderColor: '#FFB6C1' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#3D5A3D' }}>
                      <Search className="h-6 w-6" style={{ color: '#FFFFFF' }} />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold" style={{ color: '#3D5A3D' }}>Vendor Discovery</h1>
                      <p className="text-gray-600">Find the perfect vendors for your wedding</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
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
              </div>

              {/* Category Tabs */}
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
              {savedPrefs && (
                <div className="bg-rose-50 rounded-2xl p-6 border shadow-lg" style={{ borderColor: '#E6E6FA' }}>
                  <h2 className="text-lg font-bold mb-4" style={{ color: '#3D5A3D' }}>
                    Smart Matching Active
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    {savedPrefs.basicDetails?.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-600" />
                        <span className="text-gray-700">{savedPrefs.basicDetails.location}</span>
                      </div>
                    )}
                    {savedPrefs.theme?.selectedTheme && (
                      <div className="flex items-center gap-2">
                        <Palette className="h-4 w-4 text-rose-600" />
                        <span className="text-gray-700">{savedPrefs.theme.selectedTheme.split('-').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</span>
                      </div>
                    )}
                    {savedPrefs.basicDetails?.budgetRange && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-sage-600" />
                        <span className="text-gray-700">{savedPrefs.basicDetails.budgetRange}</span>
                      </div>
                    )}
                    {savedPrefs.basicDetails?.guestCount && (
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-rose-600" />
                        <span className="text-gray-700">{savedPrefs.basicDetails.guestCount} guests</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 text-xs text-gray-600">
                    Vendors are automatically filtered and ranked based on your wedding preferences.
                    Higher match scores indicate better alignment with your choices.
                  </div>
                </div>
              )}

              {/* Search and Quick Filters (always visible in explore mode) */}
              <div className="bg-white rounded-2xl p-8 border shadow-lg space-y-6" style={{ borderColor: '#FFB6C1' }}>
                <h2 className="text-xl font-bold" style={{ color: '#3D5A3D' }}>
                  {selectedCategory ? `${categories.find(c => c.id === selectedCategory)?.name} Search` : 'Vendor Search'}
                </h2>
                {renderFilters()}
              </div>
            </>
          )}

          {/* ====== RESULTS SECTION (shared) ====== */}
          <div className="bg-white rounded-2xl p-8 border shadow-lg space-y-6" style={{ borderColor: '#FFB6C1' }}>
            {/* Results Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold" style={{ color: '#3D5A3D' }}>
                  {hasBlueprintContext
                    ? `${filteredVendors.length} AI-matched vendors`
                    : `${filteredVendors.length} vendors found`
                  }
                </h2>
                <p className="text-sm text-gray-600">
                  {searchQuery && `Searching for "${searchQuery}"`}
                  {hasBlueprintContext && !searchQuery && filteredVendors.length > 0 && (
                    <span>
                      {skippedVendors.filter(sid => filteredVendors.some(v => v.id === sid)).length} skipped
                      {' / '}
                      {shortlistedVendors.filter(sid => filteredVendors.some(v => v.id === sid)).length} shortlisted
                    </span>
                  )}
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
              <div className="flex flex-col items-center justify-center py-16">
                <div className="relative mb-6">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-transparent" style={{ borderTopColor: '#FFB6C1' }}></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Search className="h-6 w-6" style={{ color: '#FFB6C1' }} />
                  </div>
                </div>
                <div className="text-center space-y-3">
                  <h3 className="text-lg font-semibold" style={{ color: '#3D5A3D' }}>
                    {hasBlueprintContext ? 'Matching Vendors to Your Blueprint' : 'Finding Perfect Vendors for You'}
                  </h3>
                  <p className="text-gray-600 max-w-md">
                    Searching {selectedCategory} in {selectedLocation || 'your location'} based on your wedding preferences...
                  </p>
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 rounded-full bg-rose-300 animate-pulse"></div>
                      <div className="w-2 h-2 rounded-full bg-rose-300 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 rounded-full bg-rose-300 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Vendor Grid/List */}
            {!isLoading && (
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                {filteredVendors.map((vendor) => renderVendorCard(vendor))}
              </div>
            )}

            {/* Error Message */}
            {!isLoading && errorMessage && !hasError && (
              <div className="text-center py-8">
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 max-w-md mx-auto">
                  <div className="w-12 h-12 mx-auto mb-4 bg-rose-100 rounded-full flex items-center justify-center">
                    <span className="text-rose-600 text-xl">!</span>
                  </div>
                  <h3 className="text-lg font-semibold text-rose-800 mb-2">Search Error</h3>
                  <p className="text-rose-700 mb-4 text-sm">{errorMessage}</p>
                  <button
                    onClick={() => {
                      setErrorMessage('');
                      searchVendors();
                    }}
                    className="px-6 py-2 rounded-lg font-medium bg-rose-600 text-white hover:bg-rose-700 transition-all duration-300"
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
                    {hasBlueprintContext
                      ? 'No AI-matched vendors in this category yet. Try expanding filters or check another category.'
                      : 'Try adjusting your search criteria or filters to find more vendors.'}
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
                    <X className="h-5 w-5 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* AI Match reason in modal (blueprint mode) */}
                {hasBlueprintContext && (
                  <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-center gap-3">
                    <Sparkles className="h-5 w-5 text-indigo-600 flex-shrink-0" />
                    <div>
                      <div className="text-sm font-semibold text-indigo-900">AI Match Reason</div>
                      <div className="text-sm text-indigo-700">
                        {getAIMatchReason(selectedVendor, blueprintData, savedPrefs)}
                      </div>
                    </div>
                  </div>
                )}

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
                        <Star className="h-4 w-4 text-rose-400" />
                        <span className="font-medium">{selectedVendor.rating}/5.0</span>
                        <span className="text-sm text-gray-500">({selectedVendor.contact_score}% response rate)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-sage-500" />
                        <span>{selectedVendor.price_range}</span>
                      </div>
                      {selectedVendor.experience_years && (
                        <div className="flex items-center gap-2">
                          <Award className="h-4 w-4 text-gray-500" />
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
                          className="w-full px-4 py-2 bg-sage-500 text-white rounded-lg hover:bg-sage-600 transition-colors flex items-center justify-center gap-2"
                        >
                          {selectedVendor.phone}
                        </button>
                      )}

                      {selectedVendor.email && (
                        <button
                          onClick={() => handleEmailContact(selectedVendor)}
                          className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
                        >
                          {selectedVendor.email}
                        </button>
                      )}

                      <div className="flex gap-2">
                        {selectedVendor.website && (
                          <button
                            onClick={() => handleWebsite(selectedVendor.website!)}
                            className="flex-1 px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors flex items-center justify-center gap-2"
                          >
                            Website
                          </button>
                        )}
                        {selectedVendor.instagram && (
                          <button
                            onClick={() => handleInstagram(selectedVendor.name, selectedVendor.instagram)}
                            className="flex-1 px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors flex items-center justify-center gap-2"
                          >
                            Instagram
                          </button>
                        )}
                      </div>

                      {/* Shortlist/Skip in modal (blueprint mode) */}
                      {hasBlueprintContext && (
                        <div className="flex gap-2 pt-2 border-t border-gray-200">
                          <button
                            onClick={() => {
                              shortlistVendor(selectedVendor.id);
                              closeVendorModal();
                            }}
                            className={`flex-1 px-4 py-2.5 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors ${
                              shortlistedVendors.includes(selectedVendor.id)
                                ? 'bg-green-100 text-green-700 border border-green-300'
                                : 'bg-green-600 text-white hover:bg-green-700'
                            }`}
                          >
                            <Check className="h-4 w-4" />
                            {shortlistedVendors.includes(selectedVendor.id) ? 'Shortlisted' : 'Shortlist'}
                          </button>
                          <button
                            onClick={() => {
                              skipVendor(selectedVendor.id);
                              closeVendorModal();
                            }}
                            className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-600 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-gray-300 transition-colors"
                          >
                            <X className="h-4 w-4" />
                            Skip
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Venue Specific Info */}
                {selectedVendor.category === 'venues' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {selectedVendor.capacity && (
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Capacity</h3>
                        <p className="text-2xl font-bold text-gray-600">{selectedVendor.capacity} guests</p>
                      </div>
                    )}

                    {selectedVendor.amenities && selectedVendor.amenities.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3">Amenities</h3>
                        <div className="grid grid-cols-1 gap-2">
                          {selectedVendor.amenities.map((amenity, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-sage-500 rounded-full"></div>
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
