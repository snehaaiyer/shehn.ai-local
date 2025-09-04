
export class GoogleMapsService {
  private static readonly API_KEY = process.env.REACT_APP_GOOGLE_API_KEY || 'REDACTED_GOOGLE_MAPS_KEY';
  private static readonly PLACES_API_URL = 'https://maps.googleapis.com/maps/api/place';

  /**
   * Search for wedding venues near a location
   */
  static async searchWeddingVenues(location: string, radius: number = 50000) {
    try {
      // First, geocode the location
      const geocodeResponse = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${this.API_KEY}`
      );
      
      if (!geocodeResponse.ok) {
        throw new Error('Geocoding failed');
      }
      
      const geocodeData = await geocodeResponse.json();
      
      if (geocodeData.status !== 'OK' || !geocodeData.results.length) {
        throw new Error('Location not found');
      }
      
      const { lat, lng } = geocodeData.results[0].geometry.location;
      
      // Search for wedding venues
      const placesResponse = await fetch(
        `${this.PLACES_API_URL}/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=wedding_venue|banquet_hall|hotel&key=${this.API_KEY}`
      );
      
      if (!placesResponse.ok) {
        throw new Error('Places search failed');
      }
      
      const placesData = await placesResponse.json();
      
      return {
        success: true,
        venues: placesData.results.map((place: any) => ({
          name: place.name,
          address: place.vicinity,
          rating: place.rating,
          priceLevel: place.price_level,
          photos: place.photos || [],
          placeId: place.place_id,
          location: place.geometry.location
        }))
      };
      
    } catch (error) {
      console.error('Error searching wedding venues:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get detailed place information
   */
  static async getPlaceDetails(placeId: string) {
    try {
      const response = await fetch(
        `${this.PLACES_API_URL}/details/json?place_id=${placeId}&fields=name,formatted_address,formatted_phone_number,website,opening_hours,photos,reviews&key=${this.API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error('Place details request failed');
      }
      
      const data = await response.json();
      
      if (data.status !== 'OK') {
        throw new Error('Place details not found');
      }
      
      return {
        success: true,
        place: data.result
      };
      
    } catch (error) {
      console.error('Error getting place details:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Generate Google Maps embed URL
   */
  static generateMapEmbedUrl(location: string): string {
    const encodedLocation = encodeURIComponent(location);
    return `https://www.google.com/maps/embed/v1/place?key=${this.API_KEY}&q=${encodedLocation}&zoom=15`;
  }

  /**
   * Calculate distance between two locations
   */
  static async calculateDistance(origin: string, destination: string) {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&key=${this.API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error('Distance calculation failed');
      }
      
      const data = await response.json();
      
      if (data.status !== 'OK' || !data.rows.length) {
        throw new Error('Distance calculation failed');
      }
      
      const element = data.rows[0].elements[0];
      
      if (element.status !== 'OK') {
        throw new Error('Route not found');
      }
      
      return {
        success: true,
        distance: element.distance.text,
        duration: element.duration.text,
        distanceValue: element.distance.value,
        durationValue: element.duration.value
      };
      
    } catch (error) {
      console.error('Error calculating distance:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
