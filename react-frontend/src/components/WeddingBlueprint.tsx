import React, { useState } from 'react';

import { Heart, DollarSign, Camera, Utensils, Palette, Loader2, Sparkles, Clock, TrendingUp, FileText, Building2 } from 'lucide-react';

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
    image: '/images/themes/heritage-palace-wedding.jpg',
    features: ['Historical Venue', 'Cultural Decor', 'Traditional Cuisine', 'Heritage Experience']
  },
  {
    id: 'luxury-hotel-grandeur',
    name: 'Luxury Hotel Grandeur',
    description: 'Five-star celebrations with modern amenities and world-class service',
    color: '#8B5CF6',
    image: '/images/themes/luxury-hotel-grandeur.jpg',
    features: ['Premium Service', 'Modern Amenities', 'International Cuisine', 'Luxury Accommodations']
  },
  {
    id: 'heritage-haveli-celebration',
    name: 'Heritage Haveli Celebration',
    description: 'Regional charm with cultural authenticity in traditional havelis',
    color: '#F59E0B',
    image: '/images/themes/heritage-haveli-celebration.jpg',
    features: ['Regional Architecture', 'Cultural Decor', 'Traditional Cuisine', 'Local Experience']
  },
  {
    id: 'beach-destination-luxury',
    name: 'Beach Destination Luxury',
    description: 'Luxurious beachside celebrations with ocean views and tropical charm',
    color: '#06B6D4',
    image: '/images/themes/beach-destination-luxury.jpg',
    features: ['Ocean Views', 'Beach Setup', 'Seafood Menu', 'Sunset Ceremony']
  },
  {
    id: 'mountain-retreat-celebration',
    name: 'Mountain Retreat Celebration',
    description: 'Scenic mountain celebrations with breathtaking views and peaceful atmosphere',
    color: '#059669',
    image: '/images/themes/mountain-retreat-celebration.jpg',
    features: ['Mountain Views', 'Natural Setting', 'Peaceful Atmosphere', 'Adventure Activities']
  },
  {
    id: 'garden-palace-affair',
    name: 'Garden Palace Affair',
    description: 'Natural elegance with outdoor charm in garden palace settings',
    color: '#10B981',
    image: '/images/themes/garden-palace-affair.jpg',
    features: ['Garden Setting', 'Natural Beauty', 'Outdoor Celebration', 'Floral Decor']
  },
  {
    id: 'lakefront-wedding',
    name: 'Lakefront Wedding',
    description: 'Serene lakefront celebrations with water views and tranquil atmosphere',
    color: '#3B82F6',
    image: '/images/themes/lakefront-wedding.jpg',
    features: ['Lake Views', 'Waterfront Setting', 'Tranquil Atmosphere', 'Boat Ceremonies']
  },
  {
    id: 'traditional-hindu-grandeur',
    name: 'Traditional Hindu Grandeur',
    description: 'Sacred ceremonies with Vedic rituals, mandap decorations, and traditional customs',
    color: '#DC2626',
    image: '/images/themes/traditional-hindu-grandeur.jpg',
    features: ['Mandap Setup', 'Vedic Rituals', 'Traditional Attire', 'Sacred Fire Ceremony']
  },
  {
    id: 'sikh-anand-karaj',
    name: 'Sikh Anand Karaj',
    description: 'Sacred Sikh wedding ceremonies with religious significance and cultural richness',
    color: '#F59E0B',
    image: '/images/themes/sikh-anand-karaj.jpg',
    features: ['Gurudwara Ceremony', 'Religious Rituals', 'Traditional Music', 'Community Celebration']
  }
];

interface WeddingBlueprintProps {
  preferences?: any;
  onClose?: () => void;
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

const WeddingBlueprint: React.FC<WeddingBlueprintProps> = ({ preferences: weddingData, onClose }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [blueprintData, setBlueprintData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  const handleGenerateBlueprint = async () => {
    if (!weddingData?.basicDetails?.yourName || !weddingData?.theme?.selectedTheme) {
      setError('Please complete basic details and theme selection first');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      console.log('🤖 Generating AI-powered wedding blueprint...');

      const requestBody = {
        basicDetails: {
          guestCount: parseInt(weddingData.basicDetails.guestCount) || 200,
          weddingDate: weddingData.basicDetails.weddingDate || new Date().toISOString(),
          location: weddingData.basicDetails.location || 'Mumbai',
          budgetRange: weddingData.basicDetails.budgetRange || '₹50-70 Lakhs',
          yourName: weddingData.basicDetails.yourName || 'Bride',
          partnerName: weddingData.basicDetails.partnerName || 'Groom'
        },
        theme: {
          selectedTheme: weddingData.theme.selectedTheme || 'Traditional'
        },
        venue: {
          venueType: weddingData.venue?.venueType || 'Luxury Hotel',
          capacity: parseInt(weddingData.basicDetails.guestCount) || 200
        },
        catering: {
          cuisine: weddingData.catering?.cuisineType || 'Multi-Cuisine',
          mealType: weddingData.catering?.serviceStyle || 'Buffet'
        },
        photography: {
          style: weddingData.photography?.style || 'Traditional',
          coverage: weddingData.photography?.services?.join(', ') || 'Photography & Videography'
        }
      };

      const res = await fetch('/api/ai/generate-blueprint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      const result = await res.json();

      if (result.success && result.data) {
        const data = result.data;
        setSavedId(data.id || Date.now().toString());

        // Map backend blueprint format to display format
        const ws = data.wedding_summary || {};
        const bb = data.budget_breakdown || {};
        const cs = data.category_specs || {};
        const formatINR = (n: number) => `₹${(n / 100000).toFixed(1)}L`;

        const makeRecs = (cat: string, icon: string) => {
          const spec = cs[cat];
          if (!spec) return [];
          return [{
            name: `${icon} ${cat.charAt(0).toUpperCase() + cat.slice(1)} — ${formatINR(spec.budget_allocated)}`,
            description: Object.entries(spec.requirements || {}).map(([k, v]) => `${k}: ${v}`).join(' • '),
            price: spec.notes || ''
          }];
        };

        setBlueprintData({
          images: data.images || [],
          generatedDescription: `${data.title || 'Your Wedding'} — ${ws.city || ''}, ${ws.date || ''} — ${ws.guest_count || 0} guests, Budget: ${formatINR(ws.budget || 0)}, Theme: ${ws.theme || ''}`,
          timestamp: new Date().toISOString(),
          budgetBreakdown: bb,
          costSavingTips: data.cost_saving_tips || [],
          timeline: data.timeline || [],
          budgetHealth: ws.budget_health || 'moderate',
          budgetWarning: ws.budget_warning || null,
          perGuest: ws.per_guest_budget || 0,
          cityTier: ws.city_tier || '',
          aiInsights: data.ai_insights || [],
          aiContent: {
            weddingSummary: `${data.title}`,
            recommendations: {
              venue: makeRecs('venue', '🏛️'),
              catering: makeRecs('catering', '🍽️'),
              photography: makeRecs('photography', '📸'),
              decoration: makeRecs('decoration', '🌸')
            }
          }
        });
        console.log('✅ AI Blueprint generated successfully!');
      } else {
        throw new Error(result.error || 'Failed to generate AI wedding blueprint');
      }
    } catch (error) {
      console.error('Blueprint generation error:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate AI blueprint');
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
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#3D5A3D' }}>
                <Sparkles className="w-6 h-6" style={{ color: '#FFFFFF' }} />
              </div>
              <div>
                <h1 className="text-2xl font-bold" style={{ color: '#3D5A3D' }}>Wedding Blueprint</h1>
                <p className="text-gray-600">Your AI-generated wedding vision</p>
              </div>
            </div>
            <button
              onClick={() => onClose?.()}
              className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {!blueprintData && !isGenerating && (
            <div className="text-center py-12">
              <div className="w-20 h-20 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-10 h-10 text-rose-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Generate Your Wedding Blueprint</h2>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Create a comprehensive wedding blueprint with AI-generated images and personalized recommendations based on your preferences.
              </p>
              <button
                onClick={handleGenerateBlueprint}
                disabled={isGenerating}
                className="bg-rose-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-rose-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Generating AI Blueprint...</span>
                  </div>
                ) : (
                  '🤖 Generate AI Blueprint'
                )}
              </button>
            </div>
          )}

          {isGenerating && (
            <div className="text-center py-12">
              <div className="w-20 h-20 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-6">
                <Loader2 className="w-10 h-10 text-rose-600 animate-spin" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Creating Your Wedding Blueprint</h2>
              <p className="text-gray-600 mb-4">Generating images and recommendations...</p>
              <div className="flex justify-center space-x-2">
                <div className="w-2 h-2 bg-rose-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
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
                onClick={handleGenerateBlueprint}
                className="px-6 py-2 rounded-xl font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {savedId && (
            <div className="mt-4 p-4 bg-sage-50 border border-sage-200 rounded-lg">
              <h4 className="font-semibold text-sage-800 mb-2">✅ Blueprint Generated Successfully!</h4>
              <p className="text-sage-700 text-sm">
                AI-powered recommendations for venues, catering, photography & decoration
              </p>
            </div>
          )}


          {blueprintData && (
            <div className="mt-8 space-y-6">
              <h3 className="text-2xl font-bold text-gray-800">🤖 Your AI-Generated Wedding Blueprint</h3>

              {blueprintData.generatedDescription && (
                <div className="bg-rose-50 p-6 rounded-lg border border-rose-200">
                  <h4 className="font-semibold text-rose-800 mb-2">Wedding Vision Summary</h4>
                  <p className="text-rose-700">{blueprintData.generatedDescription}</p>
                  {blueprintData.perGuest > 0 && (
                    <div className="mt-3 flex items-center gap-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        blueprintData.budgetHealth === 'comfortable' ? 'bg-green-100 text-green-700' :
                        blueprintData.budgetHealth === 'moderate' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {blueprintData.budgetHealth === 'comfortable' ? '✅ Comfortable budget' :
                         blueprintData.budgetHealth === 'moderate' ? '⚠️ Moderate budget' :
                         '🔴 Tight budget'}
                      </span>
                      <span className="text-rose-600">₹{blueprintData.perGuest.toLocaleString('en-IN')}/guest</span>
                      {blueprintData.cityTier && <span className="text-gray-500">• {blueprintData.cityTier} city rates</span>}
                    </div>
                  )}
                </div>
              )}

              {blueprintData.budgetWarning && (
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                  <p className="text-amber-800 text-sm">{blueprintData.budgetWarning}</p>
                </div>
              )}

              {blueprintData.aiInsights && blueprintData.aiInsights.length > 0 && (
                <div className="bg-indigo-50 p-6 rounded-lg border border-indigo-200">
                  <h4 className="font-semibold text-indigo-800 mb-3">🧠 AI Insider Tips</h4>
                  <ul className="space-y-2">
                    {blueprintData.aiInsights.map((insight: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-indigo-700">
                        <span className="text-indigo-500 mt-0.5">💡</span>
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {blueprintData.aiContent && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Venue Recommendations */}
                  <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                    <h4 className="font-semibold text-gray-800 mb-3">🏛️ Venue Recommendations</h4>
                    <div className="space-y-2">
                      {blueprintData.aiContent.recommendations.venue.map((item: any, index: number) => (
                        <div key={index} className="bg-white p-3 rounded border border-gray-100">
                          <h5 className="font-medium text-gray-900">{item.name}</h5>
                          <p className="text-gray-700 text-sm">{item.description}</p>
                          <p className="text-gray-600 text-xs font-medium">{item.price}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Catering Recommendations */}
                  <div className="bg-sage-50 p-6 rounded-lg border border-sage-200">
                    <h4 className="font-semibold text-sage-800 mb-3">🍽️ Catering Recommendations</h4>
                    <div className="space-y-2">
                      {blueprintData.aiContent.recommendations.catering.map((item: any, index: number) => (
                        <div key={index} className="bg-white p-3 rounded border border-sage-100">
                          <h5 className="font-medium text-sage-900">{item.name}</h5>
                          <p className="text-sage-700 text-sm">{item.description}</p>
                          <p className="text-sage-600 text-xs font-medium">{item.price}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Photography Recommendations */}
                  <div className="bg-rose-50 p-6 rounded-lg border border-rose-200">
                    <h4 className="font-semibold text-rose-800 mb-3">📸 Photography Recommendations</h4>
                    <div className="space-y-2">
                      {blueprintData.aiContent.recommendations.photography.map((item: any, index: number) => (
                        <div key={index} className="bg-white p-3 rounded border border-rose-100">
                          <h5 className="font-medium text-rose-900">{item.name}</h5>
                          <p className="text-rose-700 text-sm">{item.description}</p>
                          <p className="text-rose-600 text-xs font-medium">{item.price}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Decoration Recommendations */}
                  <div className="bg-rose-50 p-6 rounded-lg border border-rose-200">
                    <h4 className="font-semibold text-rose-800 mb-3">🌸 Decoration Recommendations</h4>
                    <div className="space-y-2">
                      {blueprintData.aiContent.recommendations.decoration.map((item: any, index: number) => (
                        <div key={index} className="bg-white p-3 rounded border border-rose-100">
                          <h5 className="font-medium text-rose-900">{item.name}</h5>
                          <p className="text-rose-700 text-sm">{item.description}</p>
                          <p className="text-rose-600 text-xs font-medium">{item.price}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Budget Breakdown */}
              {blueprintData.budgetBreakdown && Object.keys(blueprintData.budgetBreakdown).length > 0 && (
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-gray-800 mb-4">💰 Budget Breakdown</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.entries(blueprintData.budgetBreakdown).map(([cat, amount]: [string, any]) => (
                      <div key={cat} className="bg-gray-50 p-3 rounded-lg text-center">
                        <p className="text-sm text-gray-500 capitalize">{cat}</p>
                        <p className="text-lg font-bold text-gray-800">₹{(amount / 100000).toFixed(1)}L</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Timeline */}
              {blueprintData.timeline && blueprintData.timeline.length > 0 && (
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-gray-800 mb-3">📅 Event Timeline</h4>
                  <div className="space-y-3">
                    {blueprintData.timeline.map((item: any, i: number) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-rose-100 flex-shrink-0 flex items-center justify-center text-rose-600 text-sm font-bold">{i + 1}</div>
                        <div>
                          <p className="text-gray-800 font-medium">
                            {typeof item === 'string' ? item : item.event}
                            {item.date && <span className="text-gray-500 text-sm ml-2">— {item.date}</span>}
                          </p>
                          {item.description && <p className="text-gray-500 text-sm mt-0.5">{item.description}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cost Saving Tips */}
              {blueprintData.costSavingTips && blueprintData.costSavingTips.length > 0 && (
                <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-green-800 mb-3">💡 Cost-Saving Tips</h4>
                  <ul className="space-y-2">
                    {blueprintData.costSavingTips.map((tip: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-green-700">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {blueprintData.images && blueprintData.images.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-800">AI-Generated Wedding Images</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {blueprintData.images.map((image: string, index: number) => (
                      <div key={index} className="relative group">
                        <img
                          src={image}
                          alt={`AI Wedding Blueprint ${index + 1}`}
                          className="w-full h-64 object-cover rounded-lg shadow-md group-hover:shadow-lg transition-shadow duration-300"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity duration-300 rounded-lg flex items-center justify-center">
                          <button className="opacity-0 group-hover:opacity-100 bg-white text-gray-800 px-4 py-2 rounded-lg font-medium transition-opacity duration-300">
                            View Full Size
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center text-sm text-gray-500 border-t pt-4">
                <span>Generated on: {new Date(blueprintData.timestamp).toLocaleString()}</span>
                <span className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-sage-500 rounded-full"></span>
                  <span>AI-Powered & Saved</span>
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WeddingBlueprint;