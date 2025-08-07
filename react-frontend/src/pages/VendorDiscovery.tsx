import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, Filter, MapPin, Star, DollarSign, 
  Building2, Camera, Utensils, Palette, Music, Sparkles, Hotel, Home, Castle,
  Award, Grid, List, Heart
} from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { VendorDiscoveryService } from '../services/vendor_discovery_service';

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

const VendorDiscovery: React.FC = () => {
  // Add error boundary for this component
  const [hasError, setHasError] = useState(false);
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const navigate = useNavigate();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [vendors, setVendors] = useState<Vendor[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [priceRange, setPriceRange] = useState('all');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [rating, setRating] = useState('all');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [availability, setAvailability] = useState('all');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [location, setLocation] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loading, setLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [favorites, setFavorites] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState('grid');
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedBudget, setSelectedBudget] = useState('');
  const [selectedRating, setSelectedRating] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState({
    category: '',
    location: '',
    budget: '',
    rating: ''
  });
  const [filtersChanged, setFiltersChanged] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const categories = [
    { id: 'venues', name: 'Venues', icon: <Building2 className="h-5 w-5" /> },
    { id: 'photography', name: 'Photography', icon: <Camera className="h-5 w-5" /> },
    { id: 'catering', name: 'Catering', icon: <Utensils className="h-5 w-5" /> },
    { id: 'decoration', name: 'Decoration', icon: <Palette className="h-5 w-5" /> },
    { id: 'entertainment', name: 'Entertainment', icon: <Music className="h-5 w-5" /> },
    { id: 'beauty', name: 'Beauty & Makeup', icon: <Sparkles className="h-5 w-5" /> },
    { id: 'planners', name: 'Wedding Planners', icon: <Award className="h-5 w-5" /> }
  ];

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const venueTypes = [
    { id: 'all', name: 'All Venues', icon: <Building2 className="h-4 w-4" /> },
    { id: 'hotels', name: 'Hotels', icon: <Hotel className="h-4 w-4" /> },
    { id: 'banquet', name: 'Banquet Halls', icon: <Building2 className="h-4 w-4" /> },
    { id: 'resorts', name: 'Resorts', icon: <Home className="h-4 w-4" /> },
    { id: 'palaces', name: 'Palaces', icon: <Castle className="h-4 w-4" /> },
    { id: 'gardens', name: 'Garden Venues', icon: <Home className="h-4 w-4" /> },
    { id: 'farmhouses', name: 'Farmhouses', icon: <Home className="h-4 w-4" /> }
  ];

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const priceRanges = [
    { id: 'all', name: 'All Prices' },
    { id: 'budget', name: 'Budget (< ₹50K)' },
    { id: 'mid', name: 'Mid-Range (₹50K - ₹2L)' },
    { id: 'premium', name: 'Premium (> ₹2L)' }
  ];

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const ratings = [
    { id: 'all', name: 'All Ratings' },
    { id: '4.5', name: '4.5+ Stars' },
    { id: '4.0', name: '4.0+ Stars' },
    { id: '3.5', name: '3.5+ Stars' }
  ];

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const availabilityOptions = [
    { id: 'all', name: 'All Availability' },
    { id: 'available', name: 'Available Now' },
    { id: 'weekend', name: 'Weekend Only' },
    { id: 'flexible', name: 'Flexible Dates' }
  ];

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const toggleFavorite = (vendorId: string) => {
    setFavorites(prev => 
      prev.includes(vendorId) 
        ? prev.filter(id => id !== vendorId)
        : [...prev, vendorId]
    );
  };

  // Contact action handlers
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handlePhoneCall = (phone: string) => {
    window.open(`tel:${phone}`, '_self');
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleWhatsApp = (phone: string, vendorName: string) => {
    const message = `Hi, I'm interested in your services for my wedding. Could you please provide more information about ${vendorName}?`;
    const whatsappUrl = `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleGoogleMaps = (vendorName: string, location: string) => {
    const searchQuery = `${vendorName} ${location}`;
    const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}`;
    window.open(mapsUrl, '_blank');
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleInstagram = (vendorName: string, instagramHandle?: string) => {
    if (instagramHandle) {
      // Remove @ symbol if present and open direct profile
      const handle = instagramHandle.replace('@', '');
      const instagramUrl = `https://www.instagram.com/${handle}`;
      window.open(instagramUrl, '_blank');
    } else {
      // Fallback: search Instagram for the vendor name
      const instagramUrl = `https://www.instagram.com/explore/tags/${encodeURIComponent(vendorName.replace(/\s+/g, ''))}`;
      window.open(instagramUrl, '_blank');
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleWebsite = (website: string) => {
    const url = website.startsWith('http') ? website : `https://${website}`;
    window.open(url, '_blank');
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleEmail = (email: string, vendorName: string) => {
    const subject = `Inquiry about ${vendorName} services`;
    const body = `Hi,\n\nI'm interested in your wedding services and would like to know more about your packages and availability.\n\nThank you!`;
    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl, '_self');
  };

  // AI scoring function for vendor ranking
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const calculateAIScore = (vendor: Vendor, searchTerm: string): number => {
    let score = 0;
    
    // Base score from rating
    score += vendor.rating * 10;
    
    // Search term matching
    const searchLower = searchTerm.toLowerCase();
    if (vendor.name.toLowerCase().includes(searchLower)) score += 50;
    if (vendor.description.toLowerCase().includes(searchLower)) score += 30;
    if (vendor.category.toLowerCase().includes(searchLower)) score += 20;
    
    // Special fields for different categories
    if (vendor.photography_styles?.some(style => 
      style.toLowerCase().includes(searchLower))) score += 25;
    
    if (vendor.services_offered?.some(service => 
      service.toLowerCase().includes(searchLower))) score += 25;
    
    if (vendor.specialties?.some(specialty => 
      specialty.toLowerCase().includes(searchLower))) score += 25;
    
    // Contact score bonus
    score += vendor.contact_score * 0.5;
    
    return score;
  };



  const searchVendors = useCallback(async () => {
    setLoading(true);
    try {
      const searchParams = {
        category: appliedFilters.category || selectedCategory,
        location: appliedFilters.location || selectedLocation,
        priceRange: appliedFilters.budget || selectedBudget,
        rating: appliedFilters.rating || selectedRating,
        searchTerm: searchQuery
      };

      const response = await VendorDiscoveryService.searchVendors(searchParams);
      
      if (response.success && response.vendors) {
        setVendors(response.vendors);
        setFilteredVendors(response.vendors);
      } else {
        console.error('Error searching vendors:', response.error);
        setVendors([]);
        setFilteredVendors([]);
      }
    } catch (error) {
      console.error('Error fetching vendors:', error);
      setVendors([]);
      setFilteredVendors([]);
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, selectedCategory, selectedLocation, selectedBudget, selectedRating, searchQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  const generateVenueVendors = (location: string): Vendor[] => {
    const venueData = [
      {
        name: 'Taj Palace Hotel',
        venue_type: 'hotels',
        rating: 4.9,
        price_range: 'Premium (> ₹2L)',
        description: 'Luxury 5-star hotel with grand ballrooms and world-class amenities. Perfect for extravagant weddings with international standards.',
        contact_score: 98,
        phone: '+91 98765 43210',
        email: 'events@tajpalace.com',
        website: 'www.tajpalace.com',
        instagram: '@tajpalaceweddings',
        capacity: 500,
        amenities: ['Grand Ballroom', 'Garden Area', 'In-house Catering', 'Valet Parking', 'Luxury Accommodation'],
        experience_years: 25,
        weddings_planned: 1200,
        awards: [
          'Best Luxury Wedding Venue 2023 - Wedding Wire',
          '5-Star Hotel Excellence Award',
          'International Wedding Venue Recognition',
          'Luxury Hospitality Award'
        ],
        testimonials: [
          {
            name: 'Priya & Arjun',
            date: 'March 2024',
            rating: 5,
            text: 'Taj Palace exceeded all expectations! The grand ballroom was perfect for our 500-guest wedding. The service was impeccable.',
            wedding_type: 'Luxury Traditional Wedding'
          },
          {
            name: 'Sarah & Michael',
            date: 'January 2024',
            rating: 5,
            text: 'International guests were amazed by the luxury and service. The garden area for our ceremony was absolutely magical.',
            wedding_type: 'International Destination Wedding'
          }
        ],
        insights: [
          {
            title: 'Luxury Standards',
            description: 'World-class amenities and international hospitality standards for premium wedding experiences.',
            icon: 'Crown'
          },
          {
            title: 'Grand Scale Events',
            description: 'Perfect for large-scale weddings with capacity for 500+ guests in elegant ballrooms.',
            icon: 'Users'
          }
        ],
        images: [
          'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400&h=300&fit=crop'
        ]
      },
      {
        name: 'Garden Palace Resort',
        venue_type: 'resorts',
        rating: 4.7,
        price_range: 'Mid-Range (₹50K - ₹2L)',
        description: 'Beautiful resort surrounded by lush gardens and scenic views. Ideal for nature-loving couples seeking a peaceful wedding experience.',
        contact_score: 92,
        phone: '+91 87654 32109',
        email: 'weddings@gardenpalace.com',
        website: 'www.gardenpalace.com',
        instagram: '@gardenpalaceresort',
        capacity: 300,
        amenities: ['Garden Venue', 'Swimming Pool', 'Spa Services', 'Outdoor Catering', 'Accommodation'],
        experience_years: 15,
        weddings_planned: 450,
        awards: [
          'Best Garden Wedding Venue 2023',
          'Eco-Friendly Resort Award',
          'Nature Wedding Excellence',
          'Sustainable Tourism Award'
        ],
        testimonials: [
          {
            name: 'Maya & Dev',
            date: 'February 2024',
            rating: 5,
            text: 'The garden setting was absolutely magical! Our outdoor ceremony was perfect, and the resort staff made everything seamless.',
            wedding_type: 'Garden Wedding'
          },
          {
            name: 'Anjali & Raj',
            date: 'December 2023',
            rating: 5,
            text: 'Peaceful and beautiful venue. The spa services for our guests were a wonderful touch. Highly recommend!',
            wedding_type: 'Intimate Resort Wedding'
          }
        ],
        insights: [
          {
            title: 'Natural Beauty',
            description: 'Lush gardens and scenic views create a peaceful, nature-inspired wedding atmosphere.',
            icon: 'Trees'
          },
          {
            title: 'Wellness Focus',
            description: 'Spa services and wellness amenities for a relaxing wedding experience.',
            icon: 'Heart'
          }
        ],
        images: [
          'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop'
        ]
      },
      {
        name: 'Royal Banquet Hall',
        venue_type: 'banquet',
        rating: 4.5,
        price_range: 'Mid-Range (₹50K - ₹2L)',
        description: 'Elegant banquet hall with modern facilities and professional event management services. Perfect for traditional Indian weddings.',
        contact_score: 88,
        phone: '+91 76543 21098',
        email: 'info@royalbanquet.com',
        website: 'www.royalbanquet.com',
        instagram: '@royalbanquethall',
        capacity: 400,
        amenities: ['Grand Hall', 'Dance Floor', 'Stage Setup', 'Audio-Visual Equipment', 'Parking'],
        experience_years: 20,
        weddings_planned: 800,
        awards: [
          'Best Banquet Hall 2023 - Event Management',
          'Traditional Wedding Venue Excellence',
          'Customer Service Award',
          'Event Management Recognition'
        ],
        testimonials: [
          {
            name: 'Riya & Aman',
            date: 'January 2024',
            rating: 5,
            text: 'Perfect venue for our traditional wedding! The hall accommodated all our guests comfortably, and the staff was very professional.',
            wedding_type: 'Traditional Indian Wedding'
          },
          {
            name: 'Lisa & Tom',
            date: 'November 2023',
            rating: 5,
            text: 'Great value for money. The modern facilities and professional service made our wedding day perfect.',
            wedding_type: 'Modern Indian Wedding'
          }
        ],
        insights: [
          {
            title: 'Traditional Excellence',
            description: 'Specialized in traditional Indian weddings with modern amenities and professional service.',
            icon: 'Building2'
          },
          {
            title: 'Event Management',
            description: 'Professional event management services ensure smooth execution of wedding ceremonies.',
            icon: 'Users'
          }
        ],
        images: [
          'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400&h=300&fit=crop'
        ]
      },
      {
        name: 'Heritage Palace',
        venue_type: 'palaces',
        rating: 4.8,
        price_range: 'Premium (> ₹2L)',
        description: 'Historic palace with royal architecture and traditional charm. Perfect for royal-themed weddings with authentic heritage experience.',
        contact_score: 95,
        phone: '+91 65432 10987',
        email: 'royal@heritagepalace.com',
        website: 'www.heritagepalace.com',
        instagram: '@heritagepalace',
        capacity: 600,
        amenities: ['Royal Courtyard', 'Heritage Rooms', 'Traditional Décor', 'Cultural Performances', 'Royal Treatment'],
        experience_years: 30,
        weddings_planned: 950,
        awards: [
          'Heritage Wedding Venue of the Year 2023',
          'Cultural Preservation Award',
          'Royal Wedding Excellence',
          'Historical Venue Recognition'
        ],
        testimonials: [
          {
            name: 'Emma & James',
            date: 'December 2023',
            rating: 5,
            text: 'A truly royal experience! The heritage palace made our wedding feel like a fairy tale. The cultural performances were amazing.',
            wedding_type: 'Royal Heritage Wedding'
          },
          {
            name: 'Aisha & Zain',
            date: 'October 2023',
            rating: 5,
            text: 'The palace\'s royal charm and heritage rooms created the perfect backdrop for our traditional wedding. Absolutely magical!',
            wedding_type: 'Traditional Palace Wedding'
          }
        ],
        insights: [
          {
            title: 'Royal Heritage',
            description: 'Authentic royal architecture and heritage rooms provide a majestic wedding experience.',
            icon: 'Crown'
          },
          {
            title: 'Cultural Experience',
            description: 'Traditional cultural performances and royal treatment for an authentic heritage wedding.',
            icon: 'Palette'
          }
        ],
        images: [
          'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400&h=300&fit=crop'
        ]
      },
      {
        name: 'Green Valley Farmhouse',
        venue_type: 'farmhouses',
        rating: 4.4,
        price_range: 'Budget (< ₹50K)',
        description: 'Rustic farmhouse with natural beauty and affordable pricing. Great for intimate weddings with a countryside charm.',
        contact_score: 85,
        phone: '+91 54321 09876',
        email: 'contact@greenvalley.com',
        website: 'www.greenvalley.com',
        instagram: '@greenvalleyfarmhouse',
        capacity: 150,
        amenities: ['Open Air Venue', 'Natural Setting', 'Basic Facilities', 'Parking', 'Camping Option'],
        experience_years: 8,
        weddings_planned: 200,
        awards: [
          'Best Budget Wedding Venue 2023',
          'Eco-Friendly Venue Award',
          'Rustic Wedding Excellence',
          'Affordable Wedding Recognition'
        ],
        testimonials: [
          {
            name: 'Sophie & Alex',
            date: 'November 2023',
            rating: 5,
            text: 'Perfect for our intimate wedding! The rustic charm and natural setting were exactly what we wanted. Great value for money.',
            wedding_type: 'Intimate Farmhouse Wedding'
          },
          {
            name: 'Riya & Aman',
            date: 'September 2023',
            rating: 5,
            text: 'Beautiful countryside venue with a peaceful atmosphere. The camping option was a unique touch for our guests.',
            wedding_type: 'Rustic Countryside Wedding'
          }
        ],
        insights: [
          {
            title: 'Rustic Charm',
            description: 'Natural countryside setting with rustic charm for intimate, budget-friendly weddings.',
            icon: 'Trees'
          },
          {
            title: 'Eco-Friendly',
            description: 'Sustainable venue with natural beauty and minimal environmental impact.',
            icon: 'Leaf'
          }
        ],
        images: [
          'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400&h=300&fit=crop'
        ]
      }
    ];

    return venueData.map((venue, index) => ({
      id: `venue-${index + 1}`,
      category: 'venues',
      location: location,
      ...venue
    }));
  };

  const generateCateringVendors = (location: string): Vendor[] => {
    const cateringData = [
      {
        name: 'Royal Feast Catering',
        rating: 4.9,
        price_range: 'Premium (> ₹2L)',
        description: 'Luxury catering service specializing in multi-cuisine wedding feasts with international standards and personalized menus.',
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
          'Live Cooking Stations',
          'Dietary Accommodations'
        ],
        services_offered: [
          'Wedding Feast Catering',
          'Pre-Wedding Functions',
          'Live Cooking Stations',
          'Beverage Services',
          'Table Service',
          'Buffet Setup',
          'Special Dietary Menus',
          'Wedding Cake Services'
        ],
        awards: [
          'Best Wedding Caterer 2023 - Food Awards',
          'International Cuisine Excellence',
          'Hygiene & Safety Award',
          'Customer Choice Award'
        ],
        testimonials: [
          {
            name: 'Priya & Arjun',
            date: 'March 2024',
            rating: 5,
            text: 'Royal Feast created the most amazing wedding feast! The multi-cuisine spread was incredible, and all our guests were impressed.',
            wedding_type: 'Luxury Multi-Cuisine Wedding'
          },
          {
            name: 'Sarah & Michael',
            date: 'January 2024',
            rating: 5,
            text: 'The live cooking stations were a huge hit! The food was fresh, delicious, and beautifully presented. Highly recommend!',
            wedding_type: 'International Fusion Wedding'
          }
        ],
        insights: [
          {
            title: 'Multi-Cuisine Excellence',
            description: 'Specialized in diverse cuisines with international standards and personalized menu design.',
            icon: 'Utensils'
          },
          {
            title: 'Live Experience',
            description: 'Interactive live cooking stations and personalized service for memorable dining experiences.',
            icon: 'ChefHat'
          }
        ],
        images: [
          'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=300&fit=crop'
        ]
      },
      {
        name: 'Traditional Taste Caterers',
        rating: 4.7,
        price_range: 'Mid-Range (₹50K - ₹2L)',
        description: 'Authentic traditional Indian catering with family recipes passed down through generations. Perfect for cultural weddings.',
        contact_score: 92,
        phone: '+91 87654 32109',
        email: 'traditional@tastecaterers.com',
        website: 'www.tastecaterers.com',
        instagram: '@traditionaltastecaterers',
        experience_years: 25,
        weddings_planned: 800,
        specialties: [
          'Traditional Indian Cuisine',
          'Regional Specialties',
          'Family Recipes',
          'Cultural Wedding Menus',
          'Vegetarian Excellence'
        ],
        services_offered: [
          'Traditional Wedding Feasts',
          'Regional Cuisine',
          'Vegetarian & Non-Vegetarian',
          'Wedding Thali Services',
          'Traditional Sweets',
          'Cultural Menu Planning',
          'Family Style Service',
          'Wedding Ritual Food'
        ],
        awards: [
          'Traditional Catering Excellence 2023',
          'Regional Cuisine Award',
          'Cultural Heritage Recognition',
          'Family Business Award'
        ],
        testimonials: [
          {
            name: 'Maya & Dev',
            date: 'February 2024',
            rating: 5,
            text: 'The traditional taste was exactly what we wanted! Our families loved the authentic regional cuisine and traditional sweets.',
            wedding_type: 'Traditional Indian Wedding'
          },
          {
            name: 'Anjali & Raj',
            date: 'December 2023',
            rating: 5,
            text: 'Perfect blend of traditional and modern. The family recipes tasted just like home. Highly recommended!',
            wedding_type: 'Cultural Fusion Wedding'
          }
        ],
        insights: [
          {
            title: 'Cultural Heritage',
            description: 'Authentic traditional Indian cuisine with family recipes and cultural wedding menus.',
            icon: 'Heart'
          },
          {
            title: 'Regional Excellence',
            description: 'Specialized in regional specialties and traditional wedding feast preparations.',
            icon: 'MapPin'
          }
        ],
        images: [
          'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=300&fit=crop'
        ]
      },
      {
        name: 'Modern Fusion Kitchen',
        rating: 4.6,
        price_range: 'Mid-Range (₹50K - ₹2L)',
        description: 'Contemporary fusion catering combining traditional flavors with modern presentation and innovative culinary techniques.',
        contact_score: 89,
        phone: '+91 76543 21098',
        email: 'fusion@modernkitchen.com',
        website: 'www.modernkitchen.com',
        instagram: '@modernfusionkitchen',
        experience_years: 12,
        weddings_planned: 450,
        specialties: [
          'Fusion Cuisine',
          'Modern Indian',
          'International Fusion',
          'Molecular Gastronomy',
          'Artistic Presentation'
        ],
        services_offered: [
          'Fusion Wedding Menus',
          'Modern Indian Cuisine',
          'International Fusion',
          'Artistic Food Presentation',
          'Interactive Food Stations',
          'Custom Fusion Dishes',
          'Wedding Dessert Bars',
          'Cocktail Pairing'
        ],
        awards: [
          'Fusion Cuisine Innovation 2023',
          'Modern Catering Excellence',
          'Culinary Innovation Award',
          'Presentation Excellence'
        ],
        testimonials: [
          {
            name: 'Riya & Aman',
            date: 'January 2024',
            rating: 5,
            text: 'The fusion menu was absolutely creative! Modern presentation with traditional flavors. Our guests were amazed!',
            wedding_type: 'Modern Fusion Wedding'
          },
          {
            name: 'Lisa & Tom',
            date: 'November 2023',
            rating: 5,
            text: 'Perfect blend of cultures through food. The artistic presentation and fusion flavors were outstanding.',
            wedding_type: 'Cultural Fusion Wedding'
          }
        ],
        insights: [
          {
            title: 'Culinary Innovation',
            description: 'Creative fusion cuisine combining traditional flavors with modern presentation and techniques.',
            icon: 'Sparkles'
          },
          {
            title: 'Artistic Presentation',
            description: 'Modern food presentation with interactive stations and artistic culinary experiences.',
            icon: 'Palette'
          }
        ],
        images: [
          'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop'
        ]
      },
      {
        name: 'Budget Bites Catering',
        rating: 4.3,
        price_range: 'Budget (< ₹50K)',
        description: 'Affordable catering services without compromising on taste and quality. Perfect for budget-conscious couples.',
        contact_score: 85,
        phone: '+91 65432 10987',
        email: 'budget@bitescatering.com',
        website: 'www.bitescatering.com',
        instagram: '@budgetbitescatering',
        experience_years: 8,
        weddings_planned: 300,
        specialties: [
          'Budget-Friendly Menus',
          'Quality Catering',
          'Vegetarian Options',
          'Simple & Tasty',
          'Large Group Catering'
        ],
        services_offered: [
          'Budget Wedding Catering',
          'Vegetarian & Non-Vegetarian',
          'Simple Wedding Menus',
          'Large Group Catering',
          'Basic Beverage Services',
          'Buffet Setup',
          'Wedding Sweets',
          'Economical Packages'
        ],
        awards: [
          'Best Budget Caterer 2023',
          'Value for Money Award',
          'Customer Satisfaction',
          'Affordable Excellence'
        ],
        testimonials: [
          {
            name: 'Sophie & Alex',
            date: 'December 2023',
            rating: 5,
            text: 'Great value for money! The food was delicious and the service was excellent. Perfect for our budget wedding.',
            wedding_type: 'Budget-Friendly Wedding'
          },
          {
            name: 'Riya & Aman',
            date: 'October 2023',
            rating: 5,
            text: 'Affordable yet tasty! They accommodated our large guest list perfectly within our budget.',
            wedding_type: 'Large Family Wedding'
          }
        ],
        insights: [
          {
            title: 'Budget Excellence',
            description: 'Quality catering services at affordable prices without compromising on taste and service.',
            icon: 'DollarSign'
          },
          {
            title: 'Large Scale',
            description: 'Specialized in large group catering with efficient service and budget-friendly packages.',
            icon: 'Users'
          }
        ],
        images: [
          'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=300&fit=crop'
        ]
      }
    ];

    return cateringData.map((caterer, index) => ({
      id: `caterer-${index + 1}`,
      category: 'catering',
      location: location,
      ...caterer
    }));
  };

  const generateDecorationVendors = (location: string): Vendor[] => {
    // Placeholder - will be enhanced later
    return [];
  };

  const generateEntertainmentVendors = (location: string): Vendor[] => {
    // Placeholder - will be enhanced later
    return [];
  };

  const generateBeautyVendors = (location: string): Vendor[] => {
    // Placeholder - will be enhanced later
    return [];
  };

  const generateOtherVendors = (category: string, location: string): Vendor[] => {
    if (category === 'photography') {
      return generatePhotographyVendors(location);
    }
    if (category === 'catering') {
      return generateCateringVendors(location);
    }
    if (category === 'decoration') {
      return generateDecorationVendors(location);
    }
    if (category === 'entertainment') {
      return generateEntertainmentVendors(location);
    }
    if (category === 'beauty') {
      return generateBeautyVendors(location);
    }
    
    const categoryImages = {
      photography: [
        'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=300&fit=crop'
      ],
      catering: [
        'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop'
      ],
      decoration: [
        'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400&h=300&fit=crop'
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

    const vendors: Vendor[] = [
      {
        id: '1',
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
      },
      {
        id: '2',
        name: `Royal ${category.charAt(0).toUpperCase() + category.slice(1)} Studio`,
        category: category,
        location: location,
        rating: 4.6,
        price_range: 'Mid-Range (₹50K - ₹2L)',
        description: `Creative ${category} solutions for your special day. Known for innovative approaches and personalized service.`,
        contact_score: 88,
        phone: '+91 87654 32109',
        email: `info@royal${category}.com`,
        website: `www.royal${category}.com`,
        images: categoryImages[category as keyof typeof categoryImages] || []
      },
      {
        id: '3',
        name: `Classic ${category.charAt(0).toUpperCase() + category.slice(1)} Co.`,
        category: category,
        location: location,
        rating: 4.4,
        price_range: 'Budget (< ₹50K)',
        description: `Affordable ${category} services without compromising on quality. Perfect for budget-conscious couples.`,
        contact_score: 82,
        phone: '+91 76543 21098',
        email: `hello@classic${category}.com`,
        website: `www.classic${category}.com`,
        images: categoryImages[category as keyof typeof categoryImages] || []
      },
      {
        id: '4',
        name: `Modern ${category.charAt(0).toUpperCase() + category.slice(1)} Experts`,
        category: category,
        location: location,
        rating: 4.7,
        price_range: 'Premium (> ₹2L)',
        description: `Contemporary ${category} with a modern twist. Featured in multiple wedding magazines for outstanding work.`,
        contact_score: 91,
        phone: '+91 65432 10987',
        email: `team@modern${category}.com`,
        website: `www.modern${category}.com`,
        images: categoryImages[category as keyof typeof categoryImages] || []
      },
      {
        id: '5',
        name: `Traditional ${category.charAt(0).toUpperCase() + category.slice(1)} House`,
        category: category,
        location: location,
        rating: 4.5,
        price_range: 'Mid-Range (₹50K - ₹2L)',
        description: `Preserving traditional ${category} styles with authentic cultural elements. Family-owned business since 1995.`,
        contact_score: 86,
        phone: '+91 54321 09876',
        email: `contact@traditional${category}.com`,
        website: `www.traditional${category}.com`,
        images: categoryImages[category as keyof typeof categoryImages] || []
      }
    ];
    
    return vendors;
  };

  const generatePhotographyVendors = (location: string): Vendor[] => {
    const photographyData = [
      {
        name: 'Elite Wedding Photography Studio',
        rating: 4.9,
        price_range: 'Premium (> ₹2L)',
        description: 'Award-winning photography studio specializing in artistic and cinematic wedding photography. Known for creating stunning visual narratives and capturing authentic moments.',
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
          'Documentary/Photojournalistic',
          'Pre-Wedding Photography',
          'Drone Photography & Videography'
        ],
        services_offered: [
          'Full Day Coverage',
          'Pre-Wedding Shoots',
          'Cinematic Videos',
          'Drone Coverage',
          'Photo Albums',
          'Digital Gallery',
          'Engagement Shoots',
          'Wedding Films'
        ],
        awards: [
          'Best Wedding Photographer 2023 - Wedding Wire',
          'Artistic Excellence Award - Photography Association',
          'Cinematic Videography Award',
          'Top 10 Photographers - Bridal Guide'
        ],
        testimonials: [
          {
            name: 'Priya & Arjun',
            date: 'March 2024',
            rating: 5,
            text: 'Elite Photography captured our wedding like a fairy tale! The artistic shots and cinematic video are absolutely breathtaking. Every moment was captured beautifully.',
            wedding_type: 'Traditional Indian Wedding'
          },
          {
            name: 'Sarah & Michael',
            date: 'January 2024',
            rating: 5,
            text: 'The drone shots of our palace wedding were incredible! They created a cinematic masterpiece that tells our love story perfectly.',
            wedding_type: 'Destination Palace Wedding'
          }
        ],
        insights: [
          {
            title: 'Artistic Vision',
            description: 'Create stunning visual narratives with unique compositions, dramatic lighting, and artistic effects.',
            icon: 'Camera'
          },
          {
            title: 'Cinematic Storytelling',
            description: 'Transform your wedding into a film-like story with slow-motion, creative angles, and emotional music.',
            icon: 'Video'
          }
        ],
        images: [
          'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400&h=300&fit=crop'
        ]
      },
      {
        name: 'Candid Moments Photography',
        rating: 4.8,
        price_range: 'Mid-Range (₹50K - ₹2L)',
        description: 'Specialists in candid and documentary wedding photography. We capture authentic emotions and spontaneous moments that tell your unique love story.',
        contact_score: 95,
        phone: '+91 87654 32109',
        email: 'capture@candidmoments.com',
        website: 'www.candidmoments.com',
        instagram: '@candidmomentsphotography',
        experience_years: 8,
        weddings_planned: 320,
        photography_styles: [
          'Candid Wedding Photography',
          'Documentary/Photojournalistic',
          'Traditional Wedding Photography',
          'Portrait Wedding Photography',
          'Pre-Wedding Photography'
        ],
        services_offered: [
          'Candid Coverage',
          'Traditional Portraits',
          'Documentary Style',
          'Family Portraits',
          'Digital Gallery',
          'Photo Albums',
          'Engagement Sessions'
        ],
        awards: [
          'Candid Photography Excellence Award 2023',
          'Documentary Style Recognition',
          'Customer Choice Award',
          'Best Storytelling Photography'
        ],
        testimonials: [
          {
            name: 'Maya & Dev',
            date: 'February 2024',
            rating: 5,
            text: 'Candid Moments captured every genuine emotion and laughter. Their documentary style tells our wedding story so naturally and beautifully.',
            wedding_type: 'Intimate Garden Wedding'
          },
          {
            name: 'Anjali & Raj',
            date: 'December 2023',
            rating: 5,
            text: 'They were so unobtrusive yet captured every important moment. The candid shots of our families are absolutely priceless.',
            wedding_type: 'Traditional Indian Wedding'
          }
        ],
        insights: [
          {
            title: 'Authentic Moments',
            description: 'Capture spontaneous, unscripted moments—emotions, laughter, and real reactions as they happen.',
            icon: 'Heart'
          },
          {
            title: 'Storytelling Approach',
            description: 'Create narrative, storytelling albums that feel authentic and lively without any posing or direction.',
            icon: 'BookOpen'
          }
        ],
        images: [
          'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop'
        ]
      },
      {
        name: 'Traditional Wedding Photographers',
        rating: 4.7,
        price_range: 'Mid-Range (₹50K - ₹2L)',
        description: 'Dedicated to capturing classic, posed group photos and key ritual highlights. We ensure all essential moments are covered in a timeless way.',
        contact_score: 92,
        phone: '+91 76543 21098',
        email: 'classic@traditionalphotography.com',
        website: 'www.traditionalphotography.com',
        instagram: '@traditionalweddingphotographers',
        experience_years: 15,
        weddings_planned: 600,
        photography_styles: [
          'Traditional Wedding Photography',
          'Portrait Wedding Photography',
          'Family Group Photography',
          'Ritual Documentation',
          'Classic Posed Photography'
        ],
        services_offered: [
          'Traditional Coverage',
          'Family Portraits',
          'Ritual Documentation',
          'Group Photos',
          'Classic Albums',
          'Digital Copies',
          'Extended Family Shoots'
        ],
        awards: [
          'Traditional Photography Excellence 2023',
          'Family Portrait Award',
          'Ritual Documentation Recognition',
          'Heritage Photography Award'
        ],
        testimonials: [
          {
            name: 'Riya & Aman',
            date: 'December 2023',
            rating: 5,
            text: 'They captured every important ritual and family moment perfectly. The traditional group photos are exactly what we wanted for our families.',
            wedding_type: 'Traditional Indian Wedding'
          },
          {
            name: 'Lisa & Tom',
            date: 'October 2023',
            rating: 5,
            text: 'Perfect for capturing all the family traditions and group photos. They made sure no important moment was missed.',
            wedding_type: 'Cultural Fusion Wedding'
          }
        ],
        insights: [
          {
            title: 'Classic Coverage',
            description: 'Focus on classic, posed group photos and key ritual highlights in a straightforward, timeless way.',
            icon: 'Users'
          },
          {
            title: 'Family Focus',
            description: 'Ensure all essential moments like exchanging garlands, family portraits, and rituals are covered.',
            icon: 'Heart'
          }
        ],
        images: [
          'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400&h=300&fit=crop'
        ]
      },
      {
        name: 'Destination Wedding Photography',
        rating: 4.8,
        price_range: 'Premium (> ₹2L)',
        description: 'Specialists in destination wedding photography, capturing both the couple and scenic venues at exotic locations worldwide.',
        contact_score: 96,
        phone: '+91 65432 10987',
        email: 'travel@destinationphotography.com',
        website: 'www.destinationphotography.com',
        instagram: '@destinationweddingphotography',
        experience_years: 10,
        weddings_planned: 280,
        photography_styles: [
          'Destination Wedding Photography',
          'Pre-Wedding Photography',
          'Candid Wedding Photography',
          'Artistic/Creative Photography',
          'Drone Photography & Videography',
          'Cinematic Wedding Videography'
        ],
        services_offered: [
          'Destination Coverage',
          'Pre-Wedding Shoots',
          'Travel Photography',
          'Drone Coverage',
          'Cinematic Videos',
          'Location Scouting',
          'Multi-Day Coverage',
          'International Travel'
        ],
        awards: [
          'Destination Photography Award 2023',
          'International Wedding Coverage',
          'Travel Photography Excellence',
          'Best Destination Photographer'
        ],
        testimonials: [
          {
            name: 'Emma & James',
            date: 'January 2024',
            rating: 5,
            text: 'They traveled to our destination wedding and captured both us and the stunning venue perfectly. The drone shots of the beach ceremony are incredible!',
            wedding_type: 'Beach Destination Wedding'
          },
          {
            name: 'Aisha & Zain',
            date: 'November 2023',
            rating: 5,
            text: 'Amazing destination coverage! They captured the essence of both our love story and the beautiful location. Worth every penny.',
            wedding_type: 'Mountain Destination Wedding'
          }
        ],
        insights: [
          {
            title: 'Global Coverage',
            description: 'Specialize in covering weddings at exotic locations with emphasis on both couple and scenic venue.',
            icon: 'Globe'
          },
          {
            title: 'Travel Expertise',
            description: 'Experience in international destinations with location scouting and multi-day coverage.',
            icon: 'MapPin'
          }
        ],
        images: [
          'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400&h=300&fit=crop'
        ]
      },
      {
        name: 'Vintage & Editorial Photography',
        rating: 4.6,
        price_range: 'Mid-Range (₹50K - ₹2L)',
        description: 'Specialized vintage and editorial photography with themed shoots, recreating nostalgic vibes through post-processing and styling.',
        contact_score: 90,
        phone: '+91 54321 09876',
        email: 'vintage@editorialphotography.com',
        website: 'www.editorialphotography.com',
        instagram: '@vintageeditorialphotography',
        experience_years: 6,
        weddings_planned: 180,
        photography_styles: [
          'Editorial/Vintage/Styled Shoots',
          'Artistic/Creative Photography',
          'Pre-Wedding Photography',
          'Portrait Wedding Photography',
          'Themed Photography'
        ],
        services_offered: [
          'Vintage Styled Shoots',
          'Editorial Photography',
          'Themed Pre-Wedding',
          'Vintage Post-Processing',
          'Styling Consultation',
          'Prop Coordination',
          'Fashion Photography',
          'Creative Concepts'
        ],
        awards: [
          'Vintage Photography Award 2023',
          'Editorial Excellence',
          'Creative Styling Award',
          'Artistic Photography Recognition'
        ],
        testimonials: [
          {
            name: 'Sophie & Alex',
            date: 'December 2023',
            rating: 5,
            text: 'They created the most beautiful vintage-themed shoot for us! The editorial style and vintage processing are absolutely stunning.',
            wedding_type: 'Vintage-Themed Wedding'
          },
          {
            name: 'Riya & Aman',
            date: 'September 2023',
            rating: 5,
            text: 'The editorial approach and vintage styling made our wedding photos look like they came from a magazine. Simply beautiful!',
            wedding_type: 'Editorial Style Wedding'
          }
        ],
        insights: [
          {
            title: 'Vintage Aesthetic',
            description: 'Recreate editorial or nostalgic vibes through specialized post-processing and vintage styling.',
            icon: 'Palette'
          },
          {
            title: 'Creative Concepts',
            description: 'Themed shoots with props, decor, and artistic flair for unique visual storytelling.',
            icon: 'Sparkles'
          }
        ],
        images: [
          'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop'
        ]
      }
    ];

    return photographyData.map((photographer, index) => ({
      id: `photographer-${index + 1}`,
      category: 'photography',
      location: location,
      ...photographer
    }));
  };

  const generateWeddingPlanners = (location: string): Vendor[] => {
    const plannerData = [
      {
        name: 'Elite Wedding Creations',
        rating: 4.9,
        price_range: 'Premium (> ₹2L)',
        description: 'Award-winning wedding planning studio with 15+ years of experience creating magical celebrations. Featured in Vogue, Wedding Wire, and multiple bridal magazines.',
        contact_score: 98,
        phone: '+91 98765 43210',
        email: 'hello@eliteweddingcreations.com',
        website: 'www.eliteweddingcreations.com',
        experience_years: 15,
        weddings_planned: 500,
        awards: [
          'Best Wedding Planner 2023 - Wedding Wire',
          'Excellence Award - Vogue Weddings',
          'Top 10 Planners - Bridal Guide India',
          'Customer Choice Award - The Knot'
        ],
        specialties: [
          'Luxury Destination Weddings',
          'Multi-day Celebrations',
          'Cultural Fusion Weddings',
          'Intimate Elopements',
          'Corporate Events'
        ],
        testimonials: [
          {
            name: 'Priya & Arjun',
            date: 'March 2024',
            rating: 5,
            text: 'Elite Wedding Creations made our dream wedding a reality! From the initial consultation to the final dance, every detail was perfect. They handled everything with such professionalism and creativity.',
            wedding_type: 'Luxury Destination Wedding'
          },
          {
            name: 'Sarah & Michael',
            date: 'January 2024',
            rating: 5,
            text: 'As international clients, we were worried about planning from abroad. The team made everything seamless and our wedding was beyond our expectations. Highly recommend!',
            wedding_type: 'International Wedding'
          },
          {
            name: 'Anjali & Raj',
            date: 'December 2023',
            rating: 5,
            text: 'They transformed our vision into a magical celebration. The attention to detail and personalized service was incredible. Our guests are still talking about how perfect everything was.',
            wedding_type: 'Traditional Indian Wedding'
          }
        ],
        insights: [
          {
            title: 'Personalized Planning',
            description: 'Every wedding is unique. We create custom timelines and checklists tailored to your specific needs and preferences.',
            icon: 'CheckCircle'
          },
          {
            title: 'Vendor Network',
            description: 'Access to exclusive vendors and venues through our extensive network of trusted professionals.',
            icon: 'Users2'
          },
          {
            title: 'Stress-Free Experience',
            description: 'Handle all logistics, coordination, and day-of management so you can enjoy your special day.',
            icon: 'Clock'
          }
        ],
        images: [
          'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop'
        ]
      },
      {
        name: 'Dream Weavers Events',
        rating: 4.8,
        price_range: 'Mid-Range (₹50K - ₹2L)',
        description: 'Creative wedding planning studio specializing in unique and personalized celebrations. Known for innovative themes and seamless execution.',
        contact_score: 95,
        phone: '+91 87654 32109',
        email: 'dreams@dreamweavers.com',
        website: 'www.dreamweavers.com',
        experience_years: 12,
        weddings_planned: 350,
        awards: [
          'Creative Excellence Award 2023',
          'Best Theme Wedding Planner',
          'Rising Star Award - Wedding Industry',
          'Innovation in Events Award'
        ],
        specialties: [
          'Theme Weddings',
          'Garden & Outdoor Events',
          'Boho & Rustic Celebrations',
          'Weekend Getaway Weddings',
          'Sustainable Weddings'
        ],
        testimonials: [
          {
            name: 'Maya & Dev',
            date: 'February 2024',
            rating: 5,
            text: 'Dream Weavers created the most magical boho wedding for us! Their creativity and attention to detail was amazing. They made our vision come to life perfectly.',
            wedding_type: 'Boho Garden Wedding'
          },
          {
            name: 'Lisa & Tom',
            date: 'November 2023',
            rating: 5,
            text: 'The team was incredibly creative and professional. They transformed our simple garden into a fairy tale setting. Everything was executed flawlessly.',
            wedding_type: 'Garden Wedding'
          }
        ],
        insights: [
          {
            title: 'Creative Vision',
            description: 'Transform your ideas into stunning reality with our creative design and planning expertise.',
            icon: 'Palette'
          },
          {
            title: 'Budget Management',
            description: 'Maximize your budget with smart planning and vendor negotiations.',
            icon: 'DollarSign'
          },
          {
            title: 'Timeline Coordination',
            description: 'Perfect timing for every moment with our detailed timeline management.',
            icon: 'Calendar'
          }
        ],
        images: [
          'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400&h=300&fit=crop'
        ]
      },
      {
        name: 'Royal Wedding Consultants',
        rating: 4.7,
        price_range: 'Premium (> ₹2L)',
        description: 'Luxury wedding planning service specializing in grand celebrations and royal-style weddings. Creating unforgettable experiences for discerning clients.',
        contact_score: 93,
        phone: '+91 76543 21098',
        email: 'royal@royalweddingconsultants.com',
        website: 'www.royalweddingconsultants.com',
        experience_years: 18,
        weddings_planned: 600,
        awards: [
          'Luxury Wedding Planner of the Year 2023',
          'Royal Excellence Award',
          'Best High-End Wedding Service',
          'International Wedding Planning Award'
        ],
        specialties: [
          'Luxury Palace Weddings',
          'International Destination Weddings',
          'Celebrity Weddings',
          'Multi-Cultural Celebrations',
          'Exclusive Venue Access'
        ],
        testimonials: [
          {
            name: 'Aisha & Zain',
            date: 'January 2024',
            rating: 5,
            text: 'Royal Wedding Consultants orchestrated our palace wedding perfectly. Every detail was luxurious and elegant. They made us feel like royalty throughout the entire process.',
            wedding_type: 'Palace Wedding'
          },
          {
            name: 'Emma & James',
            date: 'October 2023',
            rating: 5,
            text: 'Planning our destination wedding from the UK was seamless thanks to their international expertise. The wedding was absolutely perfect and exceeded all expectations.',
            wedding_type: 'International Destination'
          }
        ],
        insights: [
          {
            title: 'Luxury Experience',
            description: 'Access to exclusive venues and premium vendors for the ultimate luxury wedding experience.',
            icon: 'Award'
          },
          {
            title: 'International Expertise',
            description: 'Global network and experience in planning weddings across different cultures and countries.',
            icon: 'Globe'
          },
          {
            title: 'VIP Treatment',
            description: 'Personalized service and attention that makes every couple feel like royalty.',
            icon: 'Star'
          }
        ],
        images: [
          'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400&h=300&fit=crop'
        ]
      },
      {
        name: 'Bridal Bliss Planners',
        rating: 4.6,
        price_range: 'Mid-Range (₹50K - ₹2L)',
        description: 'Dedicated wedding planning service focused on creating stress-free, beautiful celebrations. Specializing in intimate and meaningful weddings.',
        contact_score: 90,
        phone: '+91 65432 10987',
        email: 'bliss@bridalblissplanners.com',
        website: 'www.bridalblissplanners.com',
        experience_years: 10,
        weddings_planned: 280,
        awards: [
          'Best Customer Service Award 2023',
          'Stress-Free Wedding Planner',
          'Bridal Choice Award',
          'Excellence in Communication'
        ],
        specialties: [
          'Intimate Weddings',
          'Stress-Free Planning',
          'Budget-Friendly Options',
          'Last-Minute Weddings',
          'Family-Oriented Celebrations'
        ],
        testimonials: [
          {
            name: 'Riya & Aman',
            date: 'December 2023',
            rating: 5,
            text: 'Bridal Bliss made our intimate wedding perfect! They handled everything so professionally and we were completely stress-free. Highly recommend for couples who want a personal touch.',
            wedding_type: 'Intimate Wedding'
          },
          {
            name: 'Sophie & Alex',
            date: 'September 2023',
            rating: 5,
            text: 'We planned our wedding in just 3 months and they made it look like we had been planning for a year! Amazing service and attention to detail.',
            wedding_type: 'Quick Planning Wedding'
          }
        ],
        insights: [
          {
            title: 'Stress-Free Planning',
            description: 'Comprehensive planning services that eliminate wedding stress and ensure a smooth experience.',
            icon: 'CheckCircle'
          },
          {
            title: 'Personal Touch',
            description: 'Personalized service that makes every couple feel special and heard.',
            icon: 'Heart'
          },
          {
            title: 'Budget Optimization',
            description: 'Smart planning strategies to maximize your budget without compromising on quality.',
            icon: 'DollarSign'
          }
        ],
        images: [
          'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop'
        ]
      }
    ];

    return plannerData.map((planner, index) => ({
      id: `planner-${index + 1}`,
      category: 'planners',
      location: location,
      ...planner
    }));
  };

  // Filter vendors based on search criteria with AI enhancement
  const filterVendors = useCallback(async () => {
    setIsLoading(true);
    try {
      const searchParams = {
        category: selectedCategory,
        location: location,
        priceRange: selectedBudget,
        rating: selectedRating,
        searchTerm: searchQuery
      };

      const response = await VendorDiscoveryService.searchVendors(searchParams);
      
      if (response.success && response.vendors) {
        setVendors(response.vendors);
        setFilteredVendors(response.vendors);
      } else {
        console.error('Error searching vendors:', response.error);
        setVendors([]);
        setFilteredVendors([]);
      }
    } catch (error) {
      console.error('Error fetching vendors:', error);
      setVendors([]);
      setFilteredVendors([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, location, selectedBudget, selectedRating, searchQuery]);

  // Apply filters whenever any filter changes
  useEffect(() => {
    try {
      filterVendors();
    } catch (error) {
      console.error('Error in filterVendors useEffect:', error);
      setHasError(true);
    }
  }, [filterVendors]);

  // Load default preferences and set initial filters
  useEffect(() => {
    const loadDefaultPreferences = () => {
      try {
        const savedPreferences = localStorage.getItem('weddingPreferences');
        if (savedPreferences) {
          const preferences = JSON.parse(savedPreferences);
          
          // Set default location from preferences
          if (preferences.basicDetails?.location) {
            const location = preferences.basicDetails.location.toLowerCase();
            setSelectedLocation(location);
            setAppliedFilters(prev => ({ ...prev, location }));
          }
          
          // Set default venue type as category if available
          if (preferences.venue?.venueType) {
            const venueType = preferences.venue.venueType.toLowerCase();
            // Map venue types to vendor categories
            const categoryMapping: { [key: string]: string } = {
              'heritage palaces': 'venues',
              'luxury hotels': 'venues',
              'heritage havelis': 'venues',
              'royal forts': 'venues',
              'beach resorts': 'venues',
              'mountain resorts': 'venues',
              'garden venues': 'venues',
              'lakefront resorts': 'venues',
              'banquet halls': 'venues',
              'temple complexes': 'venues',
              'community halls': 'venues',
              'gurudwara grounds': 'venues',
              'rooftop venues': 'venues',
              'farmhouses': 'venues',
              'luxury villas': 'venues',
              'industrial venues': 'venues'
            };
            
            const category = categoryMapping[venueType] || 'venues';
            setSelectedCategory(category);
            setAppliedFilters(prev => ({ ...prev, category }));
          }
          
          // Set default budget from preferences
          if (preferences.basicDetails?.budgetRange) {
            const budget = preferences.basicDetails.budgetRange.toLowerCase();
            // Map budget ranges to filter options
            const budgetMapping: { [key: string]: string } = {
              'budget-5-15l': 'budget',
              'premium-15-30l': 'premium',
              'luxury-30-50l': 'luxury',
              'ultra-luxury-50l+': 'luxury'
            };
            
            const budgetFilter = budgetMapping[budget] || 'standard';
            setSelectedBudget(budgetFilter);
            setAppliedFilters(prev => ({ ...prev, budget: budgetFilter }));
          }
          
          // Set default rating to 4.5+ for quality vendors
          setSelectedRating('4.5');
          setAppliedFilters(prev => ({ ...prev, rating: '4.5' }));
        }
      } catch (error) {
        console.error('Error loading default preferences:', error);
      }
    };
    
    loadDefaultPreferences();
  }, []);

  // Trigger initial search after default preferences are loaded
  useEffect(() => {
    if (appliedFilters.location || appliedFilters.category) {
      searchVendors();
    }
  }, [appliedFilters.location, appliedFilters.category, searchVendors]);

  useEffect(() => {
    try {
      searchVendors();
    } catch (error) {
      console.error('Error in searchVendors useEffect:', error);
      setHasError(true);
    }
  }, [searchVendors]);

  const handleFilterChange = (filterType: string, value: string) => {
    setFiltersChanged(true);
    switch (filterType) {
      case 'category':
        setSelectedCategory(value);
        break;
      case 'location':
        setSelectedLocation(value);
        break;
      case 'budget':
        setSelectedBudget(value);
        break;
      case 'rating':
        setSelectedRating(value);
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
    
    // Trigger vendor search with new filters
    searchVendors();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setPriceRange('all');
    setRating('all');
    setAvailability('all');
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

  // Show error state if there's an error
  if (hasError) {
    return (
      <div className="min-h-screen bg-soft-beige flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-deep-navy mb-4">Something went wrong</h2>
          <p className="text-gray-600 mb-4">There was an error loading the vendor discovery page.</p>
          <button
            onClick={() => setHasError(false)}
            className="px-4 py-2 bg-salmon-pink text-white rounded-lg hover:shadow-lg transition-all duration-300"
          >
            Try Again
          </button>
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
                onClick={() => setShowFilters(!showFilters)}
                className="px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 hover:opacity-90"
                style={{ backgroundColor: '#D29B9B', color: '#FFFFFF' }}
              >
                <Filter className="h-4 w-4" />
                Filters
              </button>
            </div>
          </div>
                  {/* Search and Filters */}
          <div className="bg-white rounded-2xl p-8 border shadow-lg space-y-6" style={{ borderColor: '#FFB6C1' }}>
            <h2 className="text-xl font-bold" style={{ color: '#2F4F4F' }}>Search & Filters</h2>
            
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search vendors, locations, or services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white rounded-xl border border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-400/20 transition-all duration-300 text-gray-700 placeholder-gray-400"
              />
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-400/20 transition-all duration-300 text-gray-700"
                >
                  <option value="">All Categories</option>
                  <option value="venues">Venues</option>
                  <option value="photography">Photography</option>
                  <option value="catering">Catering</option>
                  <option value="decoration">Decoration</option>
                  <option value="entertainment">Entertainment</option>
                  <option value="beauty">Beauty & Wellness</option>
                  <option value="planners">Wedding Planners</option>
                </select>
              </div>

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
                <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
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
                  onClick={applyFilters}
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

            {/* Applied Filters Display */}
            {(appliedFilters.category || appliedFilters.location || appliedFilters.budget || appliedFilters.rating) && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Applied Filters:</h4>
                <div className="flex flex-wrap gap-2">
                  {appliedFilters.category && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      Category: {appliedFilters.category}
                    </span>
                  )}
                  {appliedFilters.location && (
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      Location: {appliedFilters.location}
                    </span>
                  )}
                  {appliedFilters.budget && (
                    <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                      Budget: {appliedFilters.budget}
                    </span>
                  )}
                  {appliedFilters.rating && (
                    <span className="px-3 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                      Rating: {appliedFilters.rating}+ Stars
                    </span>
                  )}
                </div>
              </div>
            )}
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
                    <div className="h-48 relative overflow-hidden">
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
                          <Building2 className="h-16 w-16 text-gray-400" />
                        </div>
                      )}
                      {/* Favorite Button */}
                      <button
                        onClick={() => toggleFavorite(vendor.id)}
                        className="absolute top-3 right-3 p-2 rounded-full bg-white/80 hover:bg-white transition-colors"
                      >
                        <Heart 
                          className={`h-5 w-5 ${favorites.includes(vendor.id) ? 'text-red-500 fill-current' : 'text-gray-400'}`} 
                        />
                      </button>
                    </div>

                    {/* Vendor Info */}
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-800 mb-1">{vendor.name}</h3>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                            <MapPin className="h-4 w-4" />
                            {vendor.location}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            {vendor.experience_years && (
                              <span>• {vendor.experience_years} years experience</span>
                            )}
                            {vendor.weddings_planned && (
                              <span>• {vendor.weddings_planned} weddings</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Rating & Price */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span className="text-sm font-medium">{vendor.rating}</span>
                          <span className="text-xs text-gray-500">({vendor.contact_score}% response rate)</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <DollarSign className="h-4 w-4" />
                          <span>{vendor.price_range}</span>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {vendor.description}
                      </p>

                      {/* Specialties/Services */}
                      {vendor.specialties && vendor.specialties.length > 0 && (
                        <div className="mb-4">
                          <div className="flex flex-wrap gap-1">
                            {vendor.specialties.slice(0, 3).map((specialty, index) => (
                              <span key={index} className="px-2 py-1 bg-gray-100 text-xs text-gray-600 rounded-full">
                                {specialty}
                              </span>
                            ))}
                            {vendor.specialties.length > 3 && (
                              <span className="px-2 py-1 bg-gray-100 text-xs text-gray-600 rounded-full">
                                +{vendor.specialties.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Contact Actions */}
                      <div className="space-y-3">
                        {/* Primary CTA */}
                        <div className="flex gap-2">
                          {vendor.phone && (
                            <button
                              onClick={() => handlePhoneCall(vendor.phone!)}
                              className="flex-1 px-3 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-1"
                            >
                              <span>📞</span> Call
                            </button>
                          )}
                          {vendor.phone && (
                            <button
                              onClick={() => handleWhatsApp(vendor.phone!, vendor.name)}
                              className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-1"
                            >
                              <span>💬</span> WhatsApp
                            </button>
                          )}
                        </div>

                        {/* Secondary Actions */}
                        <div className="flex gap-2">
                          {vendor.email && (
                            <button
                              onClick={() => handleEmail(vendor.email!, vendor.name)}
                              className="flex-1 px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-1"
                            >
                              <span>📧</span> Email
                            </button>
                          )}
                          {vendor.website && (
                            <button
                              onClick={() => handleWebsite(vendor.website!)}
                              className="flex-1 px-3 py-2 bg-purple-500 text-white text-sm rounded-lg hover:bg-purple-600 transition-colors flex items-center justify-center gap-1"
                            >
                              <span>🌐</span> Website
                            </button>
                          )}
                        </div>

                        {/* Social & Location */}
                        <div className="flex gap-2">
                          {vendor.instagram && (
                            <button
                              onClick={() => handleInstagram(vendor.name, vendor.instagram)}
                              className="flex-1 px-3 py-2 bg-pink-500 text-white text-sm rounded-lg hover:bg-pink-600 transition-colors flex items-center justify-center gap-1"
                            >
                              <span>📸</span> Instagram
                            </button>
                          )}
                          <button
                            onClick={() => handleGoogleMaps(vendor.name, vendor.location)}
                            className="flex-1 px-3 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-1"
                          >
                            <span>📍</span> Location
                          </button>
                        </div>
                      </div>

                      {/* Awards & Recognition */}
                      {vendor.awards && vendor.awards.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-gray-100">
                          <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                            <Award className="h-3 w-3" />
                            <span>Awards & Recognition</span>
                          </div>
                          <div className="text-xs text-gray-600 line-clamp-1">
                            {vendor.awards[0]}
                            {vendor.awards.length > 1 && ` +${vendor.awards.length - 1} more`}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* No Results */}
            {!isLoading && filteredVendors.length === 0 && (
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
      </div>
    </div>
  );
};

export default VendorDiscovery; 