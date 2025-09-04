
// Google Maps API Integration Service for Wedding Planning
// Handles location search, venue mapping, and route planning

import { GOOGLE_CONFIG } from '../config/google_config';

interface Location {
  lat: number;
  lng: number;
}

interface Place {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: Location;
  };
  types: string[];
  rating?: number;
  photos?: Array<{
    photo_reference: string;
  }>;
}

interface VenueLocation {
  id: string;
  name: string;
  address: string;
  location: Location;
  distance?: string;
  duration?: string;
  rating?: number;
  photoUrl?: string;
}

export class GoogleMapsService {
  private static readonly API_KEY = GOOGLE_CONFIG.MAPS.API_KEY;
  private static map: google.maps.Map | null = null;
  private static isLoaded = false;

  /**
   * Load Google Maps JavaScript API
   */
  static async loadMapsAPI(): Promise<boolean> {
    try {
      if (this.isLoaded) {
        return true;
      }

      // Check if API key is configured
      if (!this.API_KEY || this.API_KEY === '') {
        console.warn('Google Maps API key not configured');
        return false;
      }

      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        console.warn('Not in browser environment');
        return false;
      }

      // Load Google Maps script if not already loaded
      if (!window.google?.maps) {
        await this.loadMapsScript();
      }

      this.isLoaded = true;
      return true;
    } catch (error) {
      console.error('Failed to load Google Maps API:', error);
      return false;
    }
  }

  /**
   * Load Google Maps script dynamically
   */
  private static loadMapsScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${this.API_KEY}&libraries=${GOOGLE_CONFIG.MAPS.LIBRARIES.join(',')}`;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Google Maps script'));
        document.head.appendChild(script);
      } catch (error) {
        reject(new Error(`Failed to create Google Maps script: ${error}`));
      }
    });
  }

  /**
   * Initialize map in a container
   */
  static async initializeMap(containerId: string, center?: Location): Promise<google.maps.Map | null> {
    try {
      const loaded = await this.loadMapsAPI();
      if (!loaded) {
        return null;
      }

      const container = document.getElementById(containerId);
      if (!container) {
        console.error(`Map container ${containerId} not found`);
        return null;
      }

      const mapCenter = center || GOOGLE_CONFIG.MAPS.DEFAULT_CENTER;
      
      this.map = new google.maps.Map(container, {
        center: mapCenter,
        zoom: GOOGLE_CONFIG.MAPS.DEFAULT_ZOOM,
        styles: [
          {
            featureType: 'poi.business',
            elementType: 'labels',
            stylers: [{ visibility: 'on' }]
          }
        ]
      });

      return this.map;
    } catch (error) {
      console.error('Failed to initialize map:', error);
      return null;
    }
  }

  /**
   * Search for wedding venues near a location
   */
  static async searchWeddingVenues(location: string, radius: number = 25000): Promise<VenueLocation[]> {
    try {
      const loaded = await this.loadMapsAPI();
      if (!loaded) {
        return [];
      }

      // First, geocode the location
      const geocodedLocation = await this.geocodeLocation(location);
      if (!geocodedLocation) {
        return [];
      }

      // Search for wedding venues
      const service = new google.maps.places.PlacesService(document.createElement('div'));
      
      return new Promise((resolve) => {
        const request = {
          location: geocodedLocation,
          radius: radius,
          type: 'establishment',
          keyword: 'wedding venue banquet hall'
        };

        service.nearbySearch(request, (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            const venues = results.map(place => ({
              id: place.place_id || Math.random().toString(),
              name: place.name || 'Unknown Venue',
              address: place.vicinity || place.formatted_address || '',
              location: {
                lat: place.geometry?.location?.lat() || 0,
                lng: place.geometry?.location?.lng() || 0
              },
              rating: place.rating,
              photoUrl: place.photos?.[0] ? 
                `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${this.API_KEY}` 
                : undefined
            }));
            resolve(venues);
          } else {
            console.error('Places search failed:', status);
            resolve([]);
          }
        });
      });
    } catch (error) {
      console.error('Failed to search wedding venues:', error);
      return [];
    }
  }

  /**
   * Get detailed venue information
   */
  static async getVenueDetails(placeId: string): Promise<any> {
    try {
      const loaded = await this.loadMapsAPI();
      if (!loaded) {
        return null;
      }

      const service = new google.maps.places.PlacesService(document.createElement('div'));
      
      return new Promise((resolve) => {
        const request = {
          placeId: placeId,
          fields: ['name', 'formatted_address', 'formatted_phone_number', 'website', 'rating', 'reviews', 'photos', 'opening_hours']
        };

        service.getDetails(request, (place, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && place) {
            resolve({
              name: place.name,
              address: place.formatted_address,
              phone: place.formatted_phone_number,
              website: place.website,
              rating: place.rating,
              reviews: place.reviews,
              photos: place.photos?.map(photo => 
                `https://maps.googleapis.com/maps/api/place/photo?maxwidth=600&photoreference=${photo.photo_reference}&key=${this.API_KEY}`
              ),
              hours: place.opening_hours?.weekday_text
            });
          } else {
            resolve(null);
          }
        });
      });
    } catch (error) {
      console.error('Failed to get venue details:', error);
      return null;
    }
  }

  /**
   * Geocode a location string to coordinates
   */
  static async geocodeLocation(address: string): Promise<Location | null> {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${this.API_KEY}`
      );
      
      const data = await response.json();
      
      if (data.status === 'OK' && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        return {
          lat: location.lat,
          lng: location.lng
        };
      }
      
      return null;
    } catch (error) {
      console.error('Geocoding failed:', error);
      return null;
    }
  }

  /**
   * Calculate distance between venues
   */
  static async calculateDistances(origin: Location, destinations: VenueLocation[]): Promise<VenueLocation[]> {
    try {
      if (destinations.length === 0) return destinations;

      const service = new google.maps.DistanceMatrixService();
      
      return new Promise((resolve) => {
        service.getDistanceMatrix({
          origins: [origin],
          destinations: destinations.map(venue => venue.location),
          travelMode: google.maps.TravelMode.DRIVING,
          unitSystem: google.maps.UnitSystem.METRIC,
          avoidHighways: false,
          avoidTolls: false
        }, (response, status) => {
          if (status === google.maps.DistanceMatrixStatus.OK && response) {
            const results = response.rows[0].elements;
            
            const venuesWithDistance = destinations.map((venue, index) => {
              const element = results[index];
              if (element.status === 'OK') {
                return {
                  ...venue,
                  distance: element.distance?.text,
                  duration: element.duration?.text
                };
              }
              return venue;
            });
            
            // Sort by distance
            venuesWithDistance.sort((a, b) => {
              const distanceA = a.distance ? parseInt(a.distance.replace(/[^\d]/g, '')) : Infinity;
              const distanceB = b.distance ? parseInt(b.distance.replace(/[^\d]/g, '')) : Infinity;
              return distanceA - distanceB;
            });
            
            resolve(venuesWithDistance);
          } else {
            resolve(destinations);
          }
        });
      });
    } catch (error) {
      console.error('Failed to calculate distances:', error);
      return destinations;
    }
  }

  /**
   * Add markers to map for venues
   */
  static addVenueMarkers(map: google.maps.Map, venues: VenueLocation[]): google.maps.Marker[] {
    try {
      const markers: google.maps.Marker[] = [];

      venues.forEach(venue => {
        const marker = new google.maps.Marker({
          position: venue.location,
          map: map,
          title: venue.name,
          icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
            scaledSize: new google.maps.Size(32, 32)
          }
        });

        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="max-width: 200px;">
              <h3 style="margin: 0 0 8px 0; font-size: 14px;">${venue.name}</h3>
              <p style="margin: 0 0 4px 0; font-size: 12px;">${venue.address}</p>
              ${venue.rating ? `<p style="margin: 0 0 4px 0; font-size: 12px;">Rating: ${venue.rating}⭐</p>` : ''}
              ${venue.distance ? `<p style="margin: 0; font-size: 12px;">Distance: ${venue.distance}</p>` : ''}
            </div>
          `
        });

        marker.addListener('click', () => {
          infoWindow.open(map, marker);
        });

        markers.push(marker);
      });

      return markers;
    } catch (error) {
      console.error('Failed to add venue markers:', error);
      return [];
    }
  }

  /**
   * Clear all markers from map
   */
  static clearMarkers(markers: google.maps.Marker[]): void {
    markers.forEach(marker => {
      marker.setMap(null);
    });
  }

  /**
   * Auto-complete places search
   */
  static async initializeAutocomplete(inputElement: HTMLInputElement, callback?: (place: any) => void): Promise<google.maps.places.Autocomplete | null> {
    try {
      const loaded = await this.loadMapsAPI();
      if (!loaded) {
        return null;
      }

      const autocomplete = new google.maps.places.Autocomplete(inputElement, {
        types: ['establishment', 'geocode'],
        componentRestrictions: { country: 'IN' } // Restrict to India
      });

      if (callback) {
        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          callback(place);
        });
      }

      return autocomplete;
    } catch (error) {
      console.error('Failed to initialize autocomplete:', error);
      return null;
    }
  }
}

// Extend Window interface to include Google Maps
declare global {
  interface Window {
    google: typeof google;
  }
}
