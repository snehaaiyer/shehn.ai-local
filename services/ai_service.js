// AI Service for Wedding Planning System
import { API_CONFIG, QUERY_NAMES } from '../config/api_config.js';

export const AIService = {
  NOCODB_BASE_URL: API_CONFIG.NOCODB_BASE_URL,
  API_TOKEN: API_CONFIG.API_TOKEN,
  tables: API_CONFIG.TABLE_IDS,

  headers: {
    'content-type': 'application/json',
    'xc-token': API_CONFIG.API_TOKEN
  },

  async _get(url) {
    try {
      const response = await fetch(url, { headers: this.headers });
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      return response.json();
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  },

  async _post(url, data) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      return response.json();
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  },

  _toQuery(obj = {}) {
    return Object.keys(obj).length
      ? "?" +
          Object.entries(obj)
            .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
            .join("&")
      : "";
  },

  // Vendor Recommendations
  async getVendorSuggestions(preferences) {
    const queryStr = this._toQuery(preferences);
    const url = `${this.NOCODB_BASE_URL}/${this.tables.vendors}/records${queryStr}`;
    return this._get(url);
  },

  // Venue Recommendations
  async getVenueSuggestions(preferences) {
    const queryStr = this._toQuery(preferences);
    const url = `${this.NOCODB_BASE_URL}/${this.tables.venues}/records${queryStr}`;
    return this._get(url);
  },

  // Preference Analysis
  async analyzePreferences(weddingId) {
    const url = `${this.NOCODB_BASE_URL}/${this.tables.preferences}/records?where=(WeddingId,eq,${weddingId})`;
    return this._get(url);
  },

  // Style Matching
  async getStyleMatches(style) {
    const queryStr = this._toQuery({ style });
    const url = `${this.NOCODB_BASE_URL}/${this.tables.preferences}/records${queryStr}`;
    return this._get(url);
  }
}; 