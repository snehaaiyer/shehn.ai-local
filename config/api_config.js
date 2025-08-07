// API Configuration for Wedding Planning System

export const API_CONFIG = {
  // OpenAI Configuration
  openai: {
    baseURL: 'https://api.openai.com/v1',
    models: {
      gpt4: 'gpt-4-turbo-preview',  // For advanced planning suggestions
      gpt35: 'gpt-3.5-turbo'        // For basic interactions
    },
    maxRetries: 3,
    timeout: 30000 // 30 seconds
  },
  
  // Environment-specific settings
  environment: {
    development: {
      apiKeyName: 'OPENAI_API_KEY_DEV',
      debug: true
    },
    production: {
      apiKeyName: 'OPENAI_API_KEY_PROD',
      debug: false
    }
  },

  NOCODB_BASE_URL: "http://localhost:8080/api/v2/tables",
  API_TOKEN: "-h-Q9hbkAgU2DsSqXsRligOG1Qzpgb4OAx_QGwHk",
  TABLE_IDS: {
    couples: "mcv14lxgtp3rwa5",
    weddings: "mslkrxqymrbe01d",
    preferences: "mx7nrptxiiqbsty",
    venues: "m8o47zj6gmkmguz",
    vendors: "mpw9em3omtlqlsg"
  }
};

// Query names mapping for consistent usage across handlers
export const QUERY_NAMES = {
  // Couples
  GET_COUPLES: "GetCouples",
  CREATE_COUPLE: "CreateCouple",
  UPDATE_COUPLE: "UpdateCouple",
  
  // Weddings
  GET_WEDDING: "GetWedding",
  CREATE_WEDDING: "CreateWedding",
  UPDATE_WEDDING: "UpdateWedding",
  
  // Preferences
  GET_PREFERENCES: "GetPreferences",
  CREATE_PREFERENCE: "CreatePreference",
  UPDATE_PREFERENCE: "UpdatePreference",
  
  // Venues
  GET_VENUES: "GetVenues",
  GET_VENUES_BY_CITY: "GetVenuesByCity",
  GET_VENUE_SUGGESTIONS: "GetVenueSuggestions",
  
  // Vendors
  GET_VENDORS: "GetVendors",
  GET_VENDOR_SUGGESTIONS: "GetVendorSuggestions",
  GET_VENDORS_BY_CATEGORY: "GetVendorsByCategory"
};

// Utility function to get current environment
export function getCurrentEnvironment() {
  return process.env.NODE_ENV || 'development';
}

// Get API configuration for current environment
export function getAPIConfig() {
  const env = getCurrentEnvironment();
  return {
    ...API_CONFIG.openai,
    ...API_CONFIG.environment[env]
  };
} 