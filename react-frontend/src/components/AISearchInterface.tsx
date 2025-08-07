import React, { useState, useEffect } from 'react';
import { 
  Search, Sparkles, Filter, TrendingUp, Lightbulb, 
  Clock, Star, MapPin, DollarSign, Users, Camera,
  Building2, Utensils, Music, Flower, Car, Loader2
} from 'lucide-react';

interface AISearchResult {
  id: number;
  name: string;
  rating: number;
  price: string;
  location: string;
  category: string;
  ai_score?: number;
  ai_insights?: string;
}

interface AISearchInterfaceProps {
  onVendorSelect?: (vendor: AISearchResult) => void;
}

const AISearchInterface: React.FC<AISearchInterfaceProps> = ({ onVendorSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<AISearchResult[]>([]);
  const [aiInsights, setAiInsights] = useState<string>('');
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showAiAnalysis, setShowAiAnalysis] = useState(false);

  // Mock AI search function (in real app, this calls our backend)
  const performAISearch = async (query: string) => {
    setIsSearching(true);
    setShowAiAnalysis(true);

    // Simulate AI processing steps
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock results based on query
    const mockResults: AISearchResult[] = generateMockResults(query);
    
    // Simulate AI ranking and insights
    const aiRankedResults = mockResults.map(vendor => ({
      ...vendor,
      ai_score: Math.random() * 100,
      ai_insights: generateAIInsights(vendor, query)
    })).sort((a, b) => (b.ai_score || 0) - (a.ai_score || 0));

    setSearchResults(aiRankedResults);
    setAiInsights(generateOverallInsights(aiRankedResults, query));
    setSearchSuggestions(generateSearchSuggestions(query));
    setIsSearching(false);
  };

  const generateMockResults = (query: string): AISearchResult[] => {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('photographer')) {
      return [
        { id: 1, name: "Elite Wedding Photography", rating: 4.8, price: "₹2-3L", location: "Mumbai", category: "photography", ai_score: 95 },
        { id: 2, name: "Candid Moments Studio", rating: 4.6, price: "₹1.5-2.5L", location: "Mumbai", category: "photography", ai_score: 92 },
        { id: 3, name: "Traditional Wedding Photos", rating: 4.4, price: "₹1-2L", location: "Mumbai", category: "photography", ai_score: 88 },
        { id: 4, name: "Mumbai Wedding Lens", rating: 4.7, price: "₹2.5-4L", location: "Mumbai", category: "photography", ai_score: 90 },
        { id: 5, name: "Heritage Photography", rating: 4.3, price: "₹1.2-2L", location: "Mumbai", category: "photography", ai_score: 85 }
      ];
    } else if (lowerQuery.includes('venue')) {
      return [
        { id: 1, name: "Taj Palace Mumbai", rating: 4.9, price: "₹5-8L", location: "Mumbai", category: "venue", ai_score: 98 },
        { id: 2, name: "Grand Hyatt", rating: 4.7, price: "₹4-6L", location: "Mumbai", category: "venue", ai_score: 94 },
        { id: 3, name: "ITC Maratha", rating: 4.6, price: "₹3-5L", location: "Mumbai", category: "venue", ai_score: 91 },
        { id: 4, name: "Leela Palace", rating: 4.8, price: "₹6-10L", location: "Mumbai", category: "venue", ai_score: 96 },
        { id: 5, name: "JW Marriott", rating: 4.5, price: "₹3-4L", location: "Mumbai", category: "venue", ai_score: 89 }
      ];
    } else {
      return [
        { id: 1, name: "Sample Vendor 1", rating: 4.5, price: "₹2-3L", location: "Mumbai", category: "general", ai_score: 87 },
        { id: 2, name: "Sample Vendor 2", rating: 4.3, price: "₹1.5-2L", location: "Mumbai", category: "general", ai_score: 84 },
        { id: 3, name: "Sample Vendor 3", rating: 4.7, price: "₹3-4L", location: "Mumbai", category: "general", ai_score: 93 }
      ];
    }
  };

  const generateAIInsights = (vendor: AISearchResult, query: string): string => {
    const insights = [
      "Perfect match for your style",
      "Great value for money",
      "Highly rated by couples",
      "Excellent location",
      "Premium quality service"
    ];
    return insights[Math.floor(Math.random() * insights.length)];
  };

  const generateOverallInsights = (results: AISearchResult[], query: string): string => {
    const avgRating = results.reduce((sum, r) => sum + r.rating, 0) / results.length;
    const priceRange = `${results[0]?.price} - ${results[results.length - 1]?.price}`;
    
    return `Found ${results.length} vendors with ${avgRating.toFixed(1)}⭐ avg rating. Price range: ${priceRange}`;
  };

  const generateSearchSuggestions = (query: string): string[] => {
    const suggestions = [
      `More ${query.split(' ')[0]} options`,
      `Budget-friendly ${query.split(' ')[0]}`,
      `Top-rated ${query.split(' ')[0]}`,
      `Luxury ${query.split(' ')[0]}`,
      `Traditional ${query.split(' ')[0]}`
    ];
    return suggestions.slice(0, 3);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setSearchHistory(prev => [searchQuery, ...prev.slice(0, 4)]);
    await performAISearch(searchQuery);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    performAISearch(suggestion);
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      photography: Camera,
      venue: Building2,
      catering: Utensils,
      entertainment: Music,
      decoration: Flower,
      transport: Car
    };
    return icons[category as keyof typeof icons] || Building2;
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* AI Search Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Sparkles className="h-8 w-8 text-purple-600" />
          <h1 className="text-3xl font-bold text-gray-900">AI-Powered Vendor Search</h1>
        </div>
        <p className="text-gray-600">Get intelligent recommendations based on your preferences</p>
      </div>

      {/* Search Input */}
      <div className="mb-8">
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search for photographers, venues, caterers..."
            className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
          />
          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
          >
            {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
          </button>
        </div>
      </div>

      {/* AI Analysis Panel */}
      {showAiAnalysis && (
        <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <h3 className="font-semibold text-gray-900">AI Analysis</h3>
          </div>
          {isSearching ? (
            <div className="flex items-center gap-2 text-gray-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>AI is analyzing your search...</span>
            </div>
          ) : (
            <p className="text-gray-700">{aiInsights}</p>
          )}
        </div>
      )}

      {/* Search History */}
      {searchHistory.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Recent Searches</h3>
          <div className="flex flex-wrap gap-2">
            {searchHistory.map((query, index) => (
              <button
                key={index}
                onClick={() => setSearchQuery(query)}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
              >
                {query}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Results List */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">AI-Ranked Results</h3>
            <div className="space-y-4">
              {searchResults.map((vendor, index) => {
                const CategoryIcon = getCategoryIcon(vendor.category);
                return (
                  <div
                    key={vendor.id}
                    onClick={() => onVendorSelect?.(vendor)}
                    className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <CategoryIcon className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{vendor.name}</h4>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-yellow-500" />
                              <span>{vendor.rating}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              <span>{vendor.location}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4" />
                              <span>{vendor.price}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-purple-600">
                          AI Score: {vendor.ai_score?.toFixed(0)}%
                        </div>
                        <div className="text-xs text-gray-500">#{index + 1}</div>
                      </div>
                    </div>
                    {vendor.ai_insights && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Lightbulb className="h-4 w-4 text-yellow-500" />
                        <span>{vendor.ai_insights}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Suggestions */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Suggestions</h3>
            <div className="space-y-3">
              {searchSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left p-4 bg-white rounded-xl border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                    <span className="text-gray-700">{suggestion}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Quick Filters */}
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Quick Filters</h4>
              <div className="grid grid-cols-2 gap-2">
                {['Budget-friendly', 'Top-rated', 'Luxury', 'Traditional'].map((filter) => (
                  <button
                    key={filter}
                    className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isSearching && searchResults.length === 0 && showAiAnalysis && (
        <div className="text-center py-12">
          <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No vendors found</h3>
          <p className="text-gray-600">Try adjusting your search terms or browse categories</p>
        </div>
      )}
    </div>
  );
};

export default AISearchInterface; 