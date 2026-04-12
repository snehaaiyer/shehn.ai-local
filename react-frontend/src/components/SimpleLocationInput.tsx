import React, { useState, useRef } from 'react';
import { MapPin, Search } from 'lucide-react';

interface LocationSuggestion {
  name: string;
  address: string;
  type: string;
}

interface SimpleLocationInputProps {
  label: string;
  value: string;
  onChange: (location: string) => void;
  placeholder?: string;
  type?: 'wedding' | 'vendor' | 'guest';
}

export const SimpleLocationInput: React.FC<SimpleLocationInputProps> = ({
  label,
  value,
  onChange,
  placeholder = "Start typing location...",
  type = 'wedding'
}) => {
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Popular Indian wedding destinations and venues
  const popularLocations: LocationSuggestion[] = [
    // Major Cities
    { name: "Mumbai", address: "Mumbai, Maharashtra, India", type: "city" },
    { name: "Delhi", address: "Delhi, India", type: "city" },
    { name: "Bangalore", address: "Bangalore, Karnataka, India", type: "city" },
    { name: "Pune", address: "Pune, Maharashtra, India", type: "city" },
    { name: "Chennai", address: "Chennai, Tamil Nadu, India", type: "city" },
    { name: "Hyderabad", address: "Hyderabad, Telangana, India", type: "city" },
    { name: "Kolkata", address: "Kolkata, West Bengal, India", type: "city" },
    { name: "Ahmedabad", address: "Ahmedabad, Gujarat, India", type: "city" },
    
    // Wedding Destinations
    { name: "Goa", address: "Goa, India", type: "destination" },
    { name: "Udaipur", address: "Udaipur, Rajasthan, India", type: "destination" },
    { name: "Jaipur", address: "Jaipur, Rajasthan, India", type: "destination" },
    { name: "Rishikesh", address: "Rishikesh, Uttarakhand, India", type: "destination" },
    { name: "Shimla", address: "Shimla, Himachal Pradesh, India", type: "destination" },
    { name: "Manali", address: "Manali, Himachal Pradesh, India", type: "destination" },
    { name: "Ooty", address: "Ooty, Tamil Nadu, India", type: "destination" },
    { name: "Mysore", address: "Mysore, Karnataka, India", type: "destination" },
    
    // Mumbai Venues
    { name: "The Taj Mahal Palace Mumbai", address: "Apollo Bunder, Colaba, Mumbai, Maharashtra", type: "venue" },
    { name: "The Leela Palace Mumbai", address: "Sahar, Andheri East, Mumbai, Maharashtra", type: "venue" },
    { name: "JW Marriott Mumbai Juhu", address: "Juhu Tara Road, Mumbai, Maharashtra", type: "venue" },
    { name: "The St. Regis Mumbai", address: "Lower Parel, Mumbai, Maharashtra", type: "venue" },
    { name: "Grand Hyatt Mumbai", address: "Santa Cruz East, Mumbai, Maharashtra", type: "venue" },
    
    // Delhi Venues
    { name: "The Imperial New Delhi", address: "Janpath, New Delhi", type: "venue" },
    { name: "The Leela Palace New Delhi", address: "Chanakyapuri, New Delhi", type: "venue" },
    { name: "Taj Palace New Delhi", address: "Sardar Patel Marg, New Delhi", type: "venue" },
    { name: "The Oberoi New Delhi", address: "Dr. Zakir Hussain Marg, New Delhi", type: "venue" },
    
    // Goa Venues
    { name: "Taj Exotica Resort & Spa Goa", address: "Benaulim, South Goa", type: "venue" },
    { name: "The Leela Goa", address: "Mobor Beach, Cavelossim, Goa", type: "venue" },
    { name: "Grand Hyatt Goa", address: "Bambolim, North Goa", type: "venue" },
    
    // Udaipur Venues
    { name: "The Oberoi Udaivilas", address: "Haridasji Ki Magri, Udaipur, Rajasthan", type: "venue" },
    { name: "Taj Lake Palace", address: "Lake Pichola, Udaipur, Rajasthan", type: "venue" },
    { name: "The Leela Palace Udaipur", address: "Lake Pichola, Udaipur, Rajasthan", type: "venue" },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    if (newValue.length > 1) {
      const filtered = popularLocations.filter(location => 
        location.name.toLowerCase().includes(newValue.toLowerCase()) ||
        location.address.toLowerCase().includes(newValue.toLowerCase())
      ).slice(0, 8);
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: LocationSuggestion) => {
    onChange(suggestion.address);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const getLocationTypeIcon = () => {
    switch (type) {
      case 'wedding': return '💒';
      case 'vendor': return '🏢';
      case 'guest': return '🏨';
      default: return '📍';
    }
  };

  const getTypeIcon = (locationType: string) => {
    switch (locationType) {
      case 'city': return '🌆';
      case 'destination': return '🏔️';
      case 'venue': return '🏛️';
      default: return '📍';
    }
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {getLocationTypeIcon()} {label}
      </label>
      
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MapPin className="h-5 w-5 text-gray-400" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
          onFocus={() => value.length > 1 && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        />
        
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <div className="flex items-start space-x-3">
                <div className="text-2xl">{getTypeIcon(suggestion.type)}</div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {suggestion.name}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">
                    {suggestion.address}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                      {suggestion.type === 'city' ? 'City' : 
                       suggestion.type === 'destination' ? 'Destination' : 'Venue'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Helpful hint */}
      <p className="text-xs text-gray-500 mt-2">
        💡 Type to search popular Indian wedding destinations and venues
      </p>
    </div>
  );
};

export default SimpleLocationInput;
