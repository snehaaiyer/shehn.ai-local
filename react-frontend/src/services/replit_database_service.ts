
/**
 * Replit Database Service for Frontend
 * Connects to unified_wedding_server.py which uses PostgreSQL
 * Replaces NocoDB dependency
 */

interface DatabaseResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  record_id?: string | number;
}

interface CoupleData {
  partner1_name: string;
  partner2_name: string;
  wedding_date: string;
  contact_email: string;
  contact_phone: string;
}

interface PreferencesData {
  couple_id: number;
  wedding_style: string;
  budget_range: string;
  guest_count: number;
  venue_type?: string;
  preferred_date?: string;
  cultural_notes?: string;
  special_notes?: string;
}

export class ReplitDatabaseService {
  private static baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://your-repl-name.your-username.repl.co/api'
    : 'http://localhost:8001/api';

  private static async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<DatabaseResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP ${response.status}`
        };
      }

      return {
        success: true,
        data: data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Save couple data to PostgreSQL via backend
   */
  static async saveCoupleData(coupleData: {
    yourName: string;
    partnerName: string;
    contactNumber: string;
    weddingDate: string;
    location: string;
    guestCount: number;
    budgetRange: string;
  }): Promise<DatabaseResponse> {
    const dbData = {
      partner1_name: coupleData.yourName,
      partner2_name: coupleData.partnerName,
      wedding_date: coupleData.weddingDate,
      contact_email: `${coupleData.yourName.toLowerCase().replace(' ', '.')}@example.com`,
      contact_phone: coupleData.contactNumber,
      city: coupleData.location,
      budget: coupleData.budgetRange,
      guest_count: coupleData.guestCount
    };

    return this.makeRequest('/wedding-data', {
      method: 'POST',
      body: JSON.stringify(dbData)
    });
  }

  /**
   * Save comprehensive preferences
   */
  static async savePreferences(preferences: any): Promise<DatabaseResponse> {
    // Transform preferences to match backend format
    const preferencesData = {
      couple_id: preferences.coupleId || 1, // You'll need to track this
      wedding_style: preferences.theme?.selectedTheme || 'Traditional',
      budget_range: preferences.basicDetails?.budgetRange || '',
      guest_count: preferences.basicDetails?.guestCount || 0,
      venue_type: preferences.venue?.venueType || '',
      preferred_date: preferences.basicDetails?.weddingDate || '',
      cultural_notes: JSON.stringify({
        photography: preferences.photography || {},
        catering: preferences.catering || {},
        venue: preferences.venue || {}
      }),
      special_notes: `Preferences for ${preferences.basicDetails?.yourName || ''} and ${preferences.basicDetails?.partnerName || ''}`
    };

    return this.makeRequest('/preferences', {
      method: 'POST',
      body: JSON.stringify(preferencesData)
    });
  }

  /**
   * Search for vendors using backend PostgreSQL
   */
  static async searchVendors(category: string, location: string, preferences: any = {}): Promise<DatabaseResponse<any[]>> {
    const searchParams = {
      category,
      location,
      ...preferences
    };

    return this.makeRequest(`/vendor-data/${category}`, {
      method: 'POST',
      body: JSON.stringify(searchParams)
    });
  }

  /**
   * Get budget analysis
   */
  static async getBudgetAnalysis(budgetRange: string): Promise<DatabaseResponse> {
    return this.makeRequest('/budget-analysis', {
      method: 'POST',
      body: JSON.stringify({ budget_range: budgetRange })
    });
  }

  /**
   * Generate vendor communication message
   */
  static async generateMessage(vendorInfo: any, weddingInfo: any): Promise<DatabaseResponse> {
    return this.makeRequest('/generate-message', {
      method: 'POST',
      body: JSON.stringify({
        vendor_info: vendorInfo,
        wedding_info: weddingInfo,
        message_type: 'inquiry'
      })
    });
  }

  /**
   * Test connection to backend and database
   */
  static async testConnection(): Promise<boolean> {
    try {
      const response = await this.makeRequest('/health');
      return response.success;
    } catch {
      return false;
    }
  }
}

// Export for use in components
export default ReplitDatabaseService;
