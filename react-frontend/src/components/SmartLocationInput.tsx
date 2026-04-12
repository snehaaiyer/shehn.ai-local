import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Search, Star, Navigation, Clock } from 'lucide-react';

interface LocationSuggestion {
  place_id: string;
  name: string;
  address: string;
  rating?: number;
  photos?: string[];
  types: string[];
  distance?: string;
  travel_time?: string;
}

interface SmartLocationInputProps {
  label: string;
  value: string;
  onChange: (location: string, placeDetails?: LocationSuggestion) => void;
  placeholder?: string;
  type?: 'wedding' | 'vendor' | 'guest';
  guestLocation?: string; // For calculating convenience
  showMap?: boolean; // Whether to show embedded map
  mapHeight?: string; // Height of the map container
}

export const SmartLocationInput: React.FC<SmartLocationInputProps> = ({
  label,
  value,
  onChange,
  placeholder = "Start typing location...",
  type = 'wedding',
  guestLocation,
  showMap = false,
  mapHeight = '300px'
}) => {
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<LocationSuggestion | null>(null);
  const [map, setMap] = useState<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  // Load Google Maps API when component mounts
  useEffect(() => {
    if (!window.google) {
      loadGoogleMapsAPI();
    } else {
      setGoogleMapsLoaded(true);
    }
  }, []);

  // Initialize map when Google Maps loads and showMap is true
  useEffect(() => {
    if (googleMapsLoaded && showMap && mapRef.current && !map) {
      initializeMap();
    }
  }, [googleMapsLoaded, showMap, map]);

  // Update map when selected place changes
  useEffect(() => {
    if (map && selectedPlace) {
      updateMapWithPlace(selectedPlace);
    }
  }, [map, selectedPlace]);

  // Cleanup function to prevent DOM manipulation errors
  useEffect(() => {
    return () => {
      // Clear any pending intervals
      if (map) {
        // Clear map listeners to prevent memory leaks
        window.google?.maps?.event?.clearInstanceListeners?.(map);
      }
      // Clear any timeouts/intervals that might be running
      setMap(null);
      setGoogleMapsLoaded(false);
    };
  }, [map]);

  const loadGoogleMapsAPI = () => {
    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      setGoogleMapsLoaded(true);
      return;
    }

    // Check if script is already loading
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      // Script is already loaded or loading, wait for it
      const checkGoogle = setInterval(() => {
        if (window.google && window.google.maps) {
          clearInterval(checkGoogle);
          setGoogleMapsLoaded(true);
        }
      }, 100);
      return;
    }

    // Create and load the script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_API_KEY || ''}&libraries=places`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      setGoogleMapsLoaded(true);
    };
    
    script.onerror = () => {
      console.error('Failed to load Google Maps API');
    };
    
    // Only append if not already exists
    if (!document.querySelector('script[src*="maps.googleapis.com"]')) {
      document.head.appendChild(script);
    }
  };

  const initializeMap = () => {
    if (!mapRef.current || !window.google || !window.google.maps) {
      console.log('Map initialization skipped: missing requirements');
      return;
    }

    try {
      // Default location (India center) if no location specified
      const defaultLocation = { lat: 20.5937, lng: 78.9629 };
      
      const mapInstance = new window.google.maps.Map(mapRef.current, {
        zoom: 6,
        center: defaultLocation,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        zoomControl: true,
        styles: [
          {
            featureType: 'poi.business',
            elementType: 'labels',
            stylers: [{ visibility: 'on' }]
          }
        ]
      });

      setMap(mapInstance);

      // Add click listener to map for location selection
      mapInstance.addListener('click', (event: any) => {
        if (event.latLng && window.google && window.google.maps) {
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode({ location: event.latLng }, (results: any[], status: any) => {
            if (status === 'OK' && results && results[0]) {
              const place = results[0];
              const newLocation: LocationSuggestion = {
                place_id: place.place_id || '',
                name: place.formatted_address || '',
                address: place.formatted_address || '',
                types: place.types || []
              };
              handleSuggestionClick(newLocation);
            }
          });
        }
      });

      // If there's already a value, try to center the map on it
      if (value) {
        geocodeAndCenterMap(value);
      }
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  };

  const updateMapWithPlace = (place: LocationSuggestion) => {
    if (!map) return;

    // Clear existing markers
    // Note: In a real implementation, you'd want to keep track of markers
    
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: place.address }, (results: any[], status: any) => {
      if (status === 'OK' && results && results[0]) {
        const location = results[0].geometry.location;
        
        // Center map on the location
        map.setCenter(location);
        map.setZoom(15);

        // Add marker
        const marker = new window.google.maps.Marker({
          position: location,
          map: map,
          title: place.name,
          animation: window.google.maps.Animation.DROP
        });

        // Add info window
        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 8px;">
              <h3 style="margin: 0 0 4px 0; font-size: 14px; font-weight: bold;">${place.name}</h3>
              <p style="margin: 0; font-size: 12px; color: #666;">${place.address}</p>
              ${place.rating ? `<div style="margin-top: 4px; font-size: 12px;">⭐ ${place.rating}</div>` : ''}
            </div>
          `
        });

        marker.addListener('click', () => {
          infoWindow.open(map, marker);
        });

        // Auto-open info window
        infoWindow.open(map, marker);
      }
    });
  };

  const geocodeAndCenterMap = (address: string) => {
    if (!map || !address) return;

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address }, (results: any[], status: any) => {
      if (status === 'OK' && results && results[0]) {
        const location = results[0].geometry.location;
        map.setCenter(location);
        map.setZoom(13);

        // Add marker for current location
        new window.google.maps.Marker({
          position: location,
          map: map,
          title: address
        });
      }
    });
  };

  const searchPlaces = async (query: string) => {
    if (!googleMapsLoaded || !query.trim() || !window.google || !window.google.maps || !window.google.maps.places) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);

    try {
      // Create a temporary div for PlacesService
      const serviceDiv = document.createElement('div');
      const service = new window.google.maps.places.PlacesService(serviceDiv);

      // Define search types based on input type
      const searchTypes = {
        wedding: ['wedding_venue', 'banquet_hall', 'event_venue', 'hotel'],
        vendor: ['store', 'establishment'],
        guest: ['lodging', 'airport', 'transit_station']
      };

      const request = {
        query: query,
        type: searchTypes[type],
        fields: [
          'place_id', 
          'name', 
          'formatted_address', 
          'rating', 
          'photos', 
          'types',
          'geometry'
        ]
      };

      service.textSearch(request, async (results: any[], status: any) => {
        if (status === 'OK' && results) {
          const enhancedResults = await Promise.all(
            results.slice(0, 5).map(async (place: any) => {
              const suggestion: LocationSuggestion = {
                place_id: place.place_id!,
                name: place.name!,
                address: place.formatted_address!,
                rating: place.rating,
                photos: place.photos?.map((photo: any) => 
                  photo.getUrl({ maxWidth: 300, maxHeight: 200 })
                ),
                types: place.types || []
              };

              // Calculate distance and travel time if guest location provided
              if (guestLocation && place.geometry?.location) {
                try {
                  const distanceData = await calculateDistance(
                    guestLocation, 
                    place.formatted_address!
                  );
                  suggestion.distance = distanceData.distance;
                  suggestion.travel_time = distanceData.duration;
                } catch (error) {
                  console.log('Distance calculation failed:', error);
                }
              }

              return suggestion;
            })
          );

          setSuggestions(enhancedResults);
        }
        setIsLoading(false);
      });
    } catch (error) {
      console.error('Places search failed:', error);
      setIsLoading(false);
    }
  };

  const calculateDistance = async (origin: string, destination: string) => {
    return new Promise<{ distance: string; duration: string }>((resolve) => {
      const service = new window.google.maps.DistanceMatrixService();
      service.getDistanceMatrix({
        origins: [origin],
        destinations: [destination],
        travelMode: 'DRIVING',
        avoidHighways: false,
        avoidTolls: false
      }, (response: any, status: any) => {
        if (status === 'OK' && response) {
          const element = response.rows[0].elements[0];
          resolve({
            distance: element.distance?.text || 'N/A',
            duration: element.duration?.text || 'N/A'
          });
        } else {
          resolve({ distance: 'N/A', duration: 'N/A' });
        }
      });
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    if (newValue.length > 2) {
      searchPlaces(newValue);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: LocationSuggestion) => {
    onChange(suggestion.address, suggestion);
    setSelectedPlace(suggestion);
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
          onFocus={() => value.length > 2 && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        />
        
        {isLoading && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-rose-500"></div>
          </div>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.place_id}
              className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <div className="flex items-start space-x-3">
                {suggestion.photos && suggestion.photos[0] && (
                  <img
                    src={suggestion.photos[0]}
                    alt={suggestion.name}
                    className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                  />
                )}
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {suggestion.name}
                    </h4>
                    {suggestion.rating && (
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-rose-400 fill-current" />
                        <span className="text-sm text-gray-600">{suggestion.rating}</span>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-500 truncate">
                    {suggestion.address}
                  </p>
                  
                  {(suggestion.distance || suggestion.travel_time) && (
                    <div className="flex items-center space-x-4 mt-1">
                      {suggestion.distance && (
                        <div className="flex items-center space-x-1">
                          <Navigation className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-500">{suggestion.distance}</span>
                        </div>
                      )}
                      {suggestion.travel_time && (
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-500">{suggestion.travel_time}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Google Maps Container */}
      {showMap && (
        <div className="mt-4 border border-gray-300 rounded-lg overflow-hidden">
          <div 
            ref={mapRef} 
            style={{ height: mapHeight, width: '100%' }}
            className="bg-gray-100"
          >
            {!googleMapsLoaded && (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500 mx-auto mb-2"></div>
                  <div className="text-sm text-gray-500">Loading Google Maps...</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {!googleMapsLoaded && !showMap && (
        <div className="mt-2 text-sm text-gray-500">
          Loading Google Maps integration...
        </div>
      )}
    </div>
  );
};
