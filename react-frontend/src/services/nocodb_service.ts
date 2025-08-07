interface NocoDBConfig {
  baseUrl: string;
  apiToken: string;
  projectId: string;
  tableIds: {
    couples: string;
    preferences: string;
    venues: string;
    vendors: string;
  };
}

interface PreferencesData {
  basicDetails: {
    guestCount: number;
    weddingDate: string;
    location: string;
    budgetRange: string;
    yourName: string;
    partnerName: string;
    contactNumber: string;
  };
  theme: {
    selectedTheme: string;
    generatedImages: string[];
    isGeneratingImages: boolean;
  };
  venue: {
    selectedVenue: string;
    venueType: string;
    capacity: number;
  };
  catering: {
    cuisine: string;
    mealType: string;
    dietaryRestrictions: string[];
  };
  photography: {
    style: string;
    coverage: string;
    specialRequests: string;
  };
}

export class NocoDBService {
  private static config: NocoDBConfig = {
    baseUrl: 'http://localhost:8080',
    apiToken: '-h-Q9hbkAgU2DsSqXsRligOG1Qzpgb4OAx_QGwHk',
    projectId: 'p2manqkz6afk3ma',
    tableIds: {
      couples: 'mcv14lxgtp3rwa5',
      preferences: 'mx7nrptxiiqbsty',
      venues: 'm8o47zj6gmkmguz',
      vendors: 'mpw9em3omtlqlsg'
    }
  };

  private static getHeaders() {
    return {
      'xc-token': this.config.apiToken,
      'Content-Type': 'application/json'
    };
  }

  private static getApiUrl(tableName: keyof NocoDBConfig['tableIds']) {
    const tableId = this.config.tableIds[tableName];
    return `${this.config.baseUrl}/api/v2/tables/${tableId}/records`;
  }

  /**
   * Save preferences to NocoDB
   */
  static async savePreferences(preferences: PreferencesData): Promise<{ success: boolean; error?: string; recordId?: string }> {
    try {
      console.log('Saving preferences to NocoDB:', preferences);

      // Map preferences to NocoDB format
      const nocodbData = {
        "Event Theme": preferences.theme.selectedTheme,
        "Style Preference": preferences.photography.style,
        "Venue Location": preferences.venue.venueType,
        "Design Style": preferences.catering.cuisine,
        "Color Theme": JSON.stringify(preferences.theme.generatedImages),
        "Cultural Notes": JSON.stringify({
          guestCount: preferences.basicDetails.guestCount,
          budgetRange: preferences.basicDetails.budgetRange,
          location: preferences.basicDetails.location,
          venueCapacity: preferences.venue.capacity,
          mealType: preferences.catering.mealType,
          dietaryRestrictions: preferences.catering.dietaryRestrictions,
          photographyCoverage: preferences.photography.coverage,
          specialRequests: preferences.photography.specialRequests
        }),
        "Special Notes": `Created by ${preferences.basicDetails.yourName} and ${preferences.basicDetails.partnerName}`
      };

      const response = await fetch(this.getApiUrl('preferences'), {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(nocodbData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Preferences saved to NocoDB:', result);
        return {
          success: true,
          recordId: result.Id || result.id
        };
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to save preferences:', response.status, errorText);
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorText}`
        };
      }
    } catch (error) {
      console.error('❌ Error saving preferences:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get preferences from NocoDB
   */
  static async getPreferences(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await fetch(this.getApiUrl('preferences'), {
        headers: this.getHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Retrieved preferences from NocoDB:', data);
        return {
          success: true,
          data: data.list || data
        };
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to get preferences:', response.status, errorText);
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorText}`
        };
      }
    } catch (error) {
      console.error('❌ Error getting preferences:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Save couple data to NocoDB
   */
  static async saveCoupleData(coupleData: {
    yourName: string;
    partnerName: string;
    contactNumber: string;
    weddingDate: string;
    location: string;
    guestCount: number;
    budgetRange: string;
  }): Promise<{ success: boolean; error?: string; recordId?: string }> {
    try {
      console.log('Saving couple data to NocoDB:', coupleData);

      const nocodbData = {
        "Partner1 Name": coupleData.yourName,
        "Partner2 Name": coupleData.partnerName,
        "Wedding Date": coupleData.weddingDate,
        "City": coupleData.location,
        "Budget": coupleData.budgetRange,
        "Guest Count": coupleData.guestCount.toString(),
        "Wedding Type": "Traditional",
        "Wedding Days": 1,
        "Status": "Active",
        "Created At": new Date().toISOString()
      };

      const response = await fetch(this.getApiUrl('couples'), {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(nocodbData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Couple data saved to NocoDB:', result);
        return {
          success: true,
          recordId: result.Id || result.id
        };
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to save couple data:', response.status, errorText);
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorText}`
        };
      }
    } catch (error) {
      console.error('❌ Error saving couple data:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test NocoDB connection
   */
  static async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/db/meta/projects/`, {
        headers: this.getHeaders()
      });
      return response.ok;
    } catch (error) {
      console.error('❌ NocoDB connection test failed:', error);
      return false;
    }
  }
} 