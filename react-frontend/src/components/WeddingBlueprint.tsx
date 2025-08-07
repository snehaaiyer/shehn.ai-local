import React, { useState } from 'react';

import { Heart, DollarSign, Camera, Utensils, Palette, Loader2, Sparkles, Clock, TrendingUp, FileText, Building2 } from 'lucide-react';
import { WeddingBlueprintService } from '../services/wedding_blueprint_service';

// Venue Categories Data
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

// Wedding Themes Data
const themes = [
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
  }
];

interface WeddingBlueprintProps {
  preferences: any;
  onClose: () => void;
}

interface BlueprintData {
  summary: string;
  venueImage: string;
  themeImage: string;
  photographyImage: string;
  recommendations: {
    venue: string[];
    catering: string[];
    photography: string[];
    decor: string[];
  };
  timeline: string[];
  budgetBreakdown: {
    venue: number;
    catering: number;
    photography: number;
    
    decor: number;
    total: number;
  };
}

const WeddingBlueprint: React.FC<WeddingBlueprintProps> = ({ preferences, onClose }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [blueprint, setBlueprint] = useState<BlueprintData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateBlueprint = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await WeddingBlueprintService.generateWeddingBlueprint(preferences);
      
      if (response.success && response.blueprint) {
        setBlueprint(response.blueprint);
      } else {
        setError(response.error || 'Failed to generate wedding blueprint');
      }
    } catch (err) {
      setError('An unexpected error occurred while generating the blueprint');
      console.error('Error generating blueprint:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (amount: number, total: number) => {
    return Math.round((amount / total) * 100);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#2F4F4F' }}>
                <Sparkles className="w-6 h-6" style={{ color: '#FFFFFF' }} />
              </div>
              <div>
                <h1 className="text-2xl font-bold" style={{ color: '#2F4F4F' }}>Wedding Blueprint</h1>
                <p className="text-gray-600">Your AI-generated wedding vision</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {!blueprint && !isGenerating && (
            <div className="text-center py-12">
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-pink-100 to-purple-100 flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-10 h-10 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Generate Your Wedding Blueprint</h2>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Create a comprehensive wedding blueprint with AI-generated images and personalized recommendations based on your preferences.
              </p>
              <button
                onClick={generateBlueprint}
                className="px-8 py-3 rounded-xl font-semibold transition-all duration-300 hover:opacity-90 flex items-center mx-auto"
                style={{ 
                  background: 'linear-gradient(90deg, #F5EADB 0%, #EFAFAB 100%)',
                  color: '#8B4513'
                }}
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Generate Blueprint
              </button>
            </div>
          )}

          {isGenerating && (
            <div className="text-center py-12">
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-pink-100 to-purple-100 flex items-center justify-center mx-auto mb-6">
                <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Creating Your Wedding Blueprint</h2>
              <p className="text-gray-600 mb-4">Generating images and recommendations...</p>
              <div className="flex justify-center space-x-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
                <span className="text-red-600 text-2xl">⚠️</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Generation Failed</h2>
              <p className="text-gray-600 mb-8">{error}</p>
              <button
                onClick={generateBlueprint}
                className="px-6 py-2 rounded-xl font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {blueprint && (
            <div className="space-y-8">
              {/* Executive Summary */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-gray-200 shadow-lg">
                <div className="flex items-center mb-4">
                  <FileText className="w-6 h-6 text-blue-600 mr-2" />
                  <h2 className="text-xl font-bold text-gray-800">Executive Summary</h2>
                </div>
                
                {/* Wedding Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-white rounded-lg p-4">
                    <h4 className="font-medium text-gray-800 mb-2">Wedding Details</h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div><span className="font-medium">Location:</span> {preferences.basicDetails?.location || 'TBD'}</div>
                      <div><span className="font-medium">Date:</span> {preferences.basicDetails?.weddingDate || 'TBD'}</div>
                      <div><span className="font-medium">Guests:</span> {preferences.basicDetails?.guestCount || 0}</div>
                      <div><span className="font-medium">Budget:</span> {preferences.basicDetails?.budgetRange || 'TBD'}</div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <h4 className="font-medium text-gray-800 mb-2">Selected Theme</h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div><span className="font-medium">Theme:</span> {preferences.theme?.selectedTheme || 'TBD'}</div>
                      <div><span className="font-medium">Venue Type:</span> {preferences.venue?.venueType || 'TBD'}</div>
                      <div><span className="font-medium">Photography:</span> {preferences.photography?.style || 'TBD'}</div>
                      <div><span className="font-medium">Cuisine:</span> {preferences.catering?.cuisine || 'TBD'}</div>
                    </div>
                  </div>
                </div>
                
                {/* AI-Generated Vision */}
                <div className="bg-white rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 mb-3">AI-Generated Vision</h4>
                  <div className="prose prose-sm max-w-none">
                    {blueprint.summary ? (
                      <div className="text-gray-700 leading-relaxed text-sm space-y-3">
                        {blueprint.summary.split('\n\n').map((paragraph, index) => (
                          <p key={index} className="mb-3">
                            {paragraph}
                          </p>
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-600 italic">
                        <p className="mb-2">✨ <strong>Your Dream Wedding Vision</strong></p>
                        <p className="mb-2">
                          Based on your selections, we envision a celebration that perfectly blends your chosen venue, theme, and photography style. 
                          This will be a day filled with love, joy, and unforgettable moments.
                        </p>
                        <p>
                          The AI will generate a detailed vision once you click "Generate Blueprint" above.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Selected Images & Visual Elements */}
              <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl p-6 border border-gray-200 shadow-lg">
                <div className="flex items-center mb-6">
                  <Palette className="w-6 h-6 text-purple-600 mr-2" />
                  <h2 className="text-xl font-bold text-gray-800">Selected Visual Elements</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Selected Venue Image */}
                  <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                    <div className="flex items-center mb-3">
                      <Building2 className="w-5 h-5 text-blue-600 mr-2" />
                      <h3 className="font-semibold text-gray-800 text-sm">Selected Venue</h3>
                    </div>
                    {(() => {
                      const selectedVenue = venueCategories?.flatMap(cat => cat.venues)?.find(v => v.id === preferences.venue?.venueType);
                      return selectedVenue?.image ? (
                        <img
                          src={selectedVenue.image}
                          alt={selectedVenue.name}
                          className="w-full h-32 object-cover rounded-lg mb-2"
                        />
                      ) : (
                        <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center mb-2">
                          <span className="text-gray-500 text-xs">No venue selected</span>
                        </div>
                      );
                    })()}
                    <p className="text-xs text-gray-600 text-center font-medium">
                      {(() => {
                        const selectedVenue = venueCategories?.flatMap(cat => cat.venues)?.find(v => v.id === preferences.venue?.venueType);
                        return selectedVenue?.name || 'Venue not selected';
                      })()}
                    </p>
                  </div>

                  {/* Selected Theme Image */}
                  <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                    <div className="flex items-center mb-3">
                      <Heart className="w-5 h-5 text-red-600 mr-2" />
                      <h3 className="font-semibold text-gray-800 text-sm">Selected Theme</h3>
                    </div>
                    {(() => {
                      const selectedTheme = themes?.find(t => t.id === preferences.theme?.selectedTheme);
                      return selectedTheme?.image ? (
                        <img
                          src={selectedTheme.image}
                          alt={selectedTheme.name}
                          className="w-full h-32 object-cover rounded-lg mb-2"
                        />
                      ) : (
                        <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center mb-2">
                          <span className="text-gray-500 text-xs">No theme selected</span>
                        </div>
                      );
                    })()}
                    <p className="text-xs text-gray-600 text-center font-medium">
                      {(() => {
                        const selectedTheme = themes?.find(t => t.id === preferences.theme?.selectedTheme);
                        return selectedTheme?.name || 'Theme not selected';
                      })()}
                    </p>
                  </div>

                  {/* Photography Style */}
                  <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                    <div className="flex items-center mb-3">
                      <Camera className="w-5 h-5 text-green-600 mr-2" />
                      <h3 className="font-semibold text-gray-800 text-sm">Photography Style</h3>
                    </div>
                    <div className="w-full h-32 bg-gradient-to-br from-green-100 to-blue-100 rounded-lg flex items-center justify-center mb-2">
                      <div className="text-center">
                        <Camera className="w-8 h-8 text-green-600 mx-auto mb-1" />
                        <span className="text-xs text-gray-700 font-medium">
                          {preferences.photography?.style || 'Style not selected'}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 text-center">
                      {preferences.photography?.coverage || 'Coverage details'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Strategic Recommendations */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6 border border-gray-200 shadow-lg">
                <div className="flex items-center mb-6">
                  <TrendingUp className="w-6 h-6 text-green-600 mr-2" />
                  <h2 className="text-xl font-bold text-gray-800">Strategic Recommendations</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg p-4">
                    <div className="flex items-center mb-3">
                      <Building2 className="w-5 h-5 text-blue-600 mr-2" />
                      <h3 className="font-semibold text-gray-800">Venue Strategy</h3>
                    </div>
                    <ul className="space-y-2">
                      {blueprint.recommendations.venue.map((rec, index) => (
                        <li key={index} className="flex items-start text-sm">
                          <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                          <span className="text-gray-700">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-white rounded-lg p-4">
                    <div className="flex items-center mb-3">
                      <Utensils className="w-5 h-5 text-orange-600 mr-2" />
                      <h3 className="font-semibold text-gray-800">Catering Strategy</h3>
                    </div>
                    <ul className="space-y-2">
                      {blueprint.recommendations.catering.map((rec, index) => (
                        <li key={index} className="flex items-start text-sm">
                          <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                          <span className="text-gray-700">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-white rounded-lg p-4">
                    <div className="flex items-center mb-3">
                      <Camera className="w-5 h-5 text-green-600 mr-2" />
                      <h3 className="font-semibold text-gray-800">Photography Strategy</h3>
                    </div>
                    <ul className="space-y-2">
                      {blueprint.recommendations.photography.map((rec, index) => (
                        <li key={index} className="flex items-start text-sm">
                          <div className="w-2 h-2 bg-green-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                          <span className="text-gray-700">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-white rounded-lg p-4">
                    <div className="flex items-center mb-3">
                      <Palette className="w-5 h-5 text-purple-600 mr-2" />
                      <h3 className="font-semibold text-gray-800">Decor Strategy</h3>
                    </div>
                    <ul className="space-y-2">
                      {blueprint.recommendations.decor.map((rec, index) => (
                        <li key={index} className="flex items-start text-sm">
                          <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                          <span className="text-gray-700">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Operational Planning */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 border border-gray-200 shadow-lg">
                <div className="flex items-center mb-6">
                  <Clock className="w-6 h-6 text-indigo-600 mr-2" />
                  <h2 className="text-xl font-bold text-gray-800">Operational Planning</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Timeline */}
                  <div className="bg-white rounded-lg p-4">
                    <div className="flex items-center mb-3">
                      <Clock className="w-5 h-5 text-indigo-600 mr-2" />
                      <h3 className="font-semibold text-gray-800">Wedding Day Timeline</h3>
                    </div>
                    <div className="space-y-2">
                      {blueprint.timeline.map((item, index) => (
                        <div key={index} className="flex items-start">
                          <div className="w-2 h-2 bg-indigo-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                          <span className="text-gray-700 text-sm">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Budget Breakdown */}
                  <div className="bg-white rounded-lg p-4">
                    <div className="flex items-center mb-3">
                      <DollarSign className="w-5 h-5 text-green-600 mr-2" />
                      <h3 className="font-semibold text-gray-800">Budget Allocation</h3>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 text-sm">Venue & Setup</span>
                        <div className="text-right">
                          <div className="font-semibold text-gray-800 text-sm">{formatCurrency(blueprint.budgetBreakdown.venue)}</div>
                          <div className="text-xs text-gray-500">{formatPercentage(blueprint.budgetBreakdown.venue, blueprint.budgetBreakdown.total)}%</div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 text-sm">Catering & Service</span>
                        <div className="text-right">
                          <div className="font-semibold text-gray-800 text-sm">{formatCurrency(blueprint.budgetBreakdown.catering)}</div>
                          <div className="text-xs text-gray-500">{formatPercentage(blueprint.budgetBreakdown.catering, blueprint.budgetBreakdown.total)}%</div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 text-sm">Photography & Media</span>
                        <div className="text-right">
                          <div className="font-semibold text-gray-800 text-sm">{formatCurrency(blueprint.budgetBreakdown.photography)}</div>
                          <div className="text-xs text-gray-500">{formatPercentage(blueprint.budgetBreakdown.photography, blueprint.budgetBreakdown.total)}%</div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 text-sm">Decor & Styling</span>
                        <div className="text-right">
                          <div className="font-semibold text-gray-800 text-sm">{formatCurrency(blueprint.budgetBreakdown.decor)}</div>
                          <div className="text-xs text-gray-500">{formatPercentage(blueprint.budgetBreakdown.decor, blueprint.budgetBreakdown.total)}%</div>
                        </div>
                      </div>
                      <div className="border-t pt-2 mt-2">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-gray-800 text-sm">Total Investment</span>
                          <div className="font-bold text-base" style={{ color: '#2F4F4F' }}>
                            {formatCurrency(blueprint.budgetBreakdown.total)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-center space-x-4 pt-6">
                <button
                  onClick={generateBlueprint}
                  className="px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:opacity-90 flex items-center"
                  style={{ 
                    background: 'linear-gradient(90deg, #F5EADB 0%, #EFAFAB 100%)',
                    color: '#8B4513'
                  }}
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Regenerate Blueprint
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-3 rounded-xl font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WeddingBlueprint; 