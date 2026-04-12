// Google Maps Configuration (only Maps/Places — Gmail, Calendar, OAuth removed)

export const GOOGLE_CONFIG = {
  MAPS: {
    API_KEY: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || process.env.REACT_APP_GOOGLE_API_KEY || '',
    LIBRARIES: ['places', 'geometry'],
    DEFAULT_CENTER: { lat: 19.0760, lng: 72.8777 }, // Mumbai
    DEFAULT_ZOOM: 12
  }
};

export const GOOGLE_ENDPOINTS = {
  MAPS: {
    GEOCODING: 'https://maps.googleapis.com/maps/api/geocode/json',
    PLACES: 'https://maps.googleapis.com/maps/api/place',
    DIRECTIONS: 'https://maps.googleapis.com/maps/api/directions/json',
    DISTANCE_MATRIX: 'https://maps.googleapis.com/maps/api/distancematrix/json'
  }
};
