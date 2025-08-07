// Define the interface locally since it's not exported from WeddingPreferences
interface WeddingPreferencesData {
  basicDetails: {
    guestCount: number;
    weddingDate: string;
    location: string;
    budgetRange: string;
    yourName: string;
    partnerName: string;
  };
  theme: {
    selectedTheme: string;
    style: string;
    colors: string;
    season: string;
    venueType: string;
    decorStyle: string;
    cuisineStyle: string;
    photographyBudget: string;
  };
  ceremony: {
    type: string;
    duration: number;
    receptionType: string;
    receptionDuration: number;
  };
  catering: {
    cuisine: string;
    dietaryRestrictions: string;
    mealType: string;
    beverages: string;
  };
  services: {
    photography: boolean;
    music: boolean;
    decoration: boolean;
    transportation: boolean;
  };
  photographyPreferences: string[];
  musicPreferences: string[];
  entertainmentPreferences: string[];
}

// Google API Configuration
const GOOGLE_API_KEY = process.env.REACT_APP_GOOGLE_API_KEY || '';
const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY || '';

// Mock mode for testing without API keys
const MOCK_MODE = !GOOGLE_API_KEY || !GEMINI_API_KEY;

interface TaskContext {
  userPreferences: WeddingPreferencesData;
  currentDate: string;
  weddingDate: string;
  location: string;
  budget: string;
}

interface TaskResult {
  success: boolean;
  action: string;
  data?: any;
  message: string;
  nextSteps?: string[];
}

interface CalendarEvent {
  summary: string;
  description: string;
  startTime: string;
  endTime: string;
  location?: string;
  attendees?: string[];
}

interface VendorContact {
  name: string;
  email: string;
  phone: string;
  category: string;
  message: string;
}

class AIAssistantService {
  private userPreferences: WeddingPreferencesData | null = null;

  // Initialize with user preferences
  initialize(preferences: WeddingPreferencesData) {
    this.userPreferences = preferences;
  }

  // Get user preferences context
  private getContext(): TaskContext | null {
    if (!this.userPreferences) return null;

    return {
      userPreferences: this.userPreferences,
      currentDate: new Date().toISOString(),
      weddingDate: this.userPreferences.basicDetails.weddingDate,
      location: this.userPreferences.basicDetails.location,
      budget: this.userPreferences.basicDetails.budgetRange,
    };
  }

  // Main AI assistant function that handles user requests
  async processUserRequest(userMessage: string): Promise<TaskResult> {
    const context = this.getContext();
    if (!context) {
      return {
        success: false,
        action: 'error',
        message: 'User preferences not loaded. Please set up your wedding preferences first.',
      };
    }

    // If in mock mode, use mock responses
    if (MOCK_MODE) {
      return await this.processMockRequest(userMessage, context);
    }

    // Analyze user intent using Gemini API
    const intent = await this.analyzeIntent(userMessage, context);
    
    // Execute appropriate action based on intent
    switch (intent.action) {
      case 'schedule_meeting':
        return await this.scheduleMeeting(intent.data, context);
      
      case 'find_vendors':
        return await this.findVendors(intent.data, context);
      
      case 'send_email':
        return await this.sendEmail(intent.data, context);
      
      case 'get_directions':
        return await this.getDirections(intent.data, context);
      
      case 'create_timeline':
        return await this.createTimeline(context);
      
      case 'budget_analysis':
        return await this.analyzeBudget(context);
      
      case 'vendor_communication':
        return await this.communicateWithVendor(intent.data, context);
      
      default:
        return await this.getGeneralResponse(userMessage, context);
    }
  }

  // Mock request processor for testing without API keys
  private async processMockRequest(userMessage: string, context: TaskContext): Promise<TaskResult> {
    const lowerMessage = userMessage.toLowerCase();
    
    // Simple keyword-based intent detection
    if (lowerMessage.includes('schedule') || lowerMessage.includes('meeting')) {
      return await this.mockScheduleMeeting(context);
    } else if (lowerMessage.includes('find') || lowerMessage.includes('vendor')) {
      return await this.mockFindVendors(context);
    } else if (lowerMessage.includes('email') || lowerMessage.includes('send')) {
      return await this.mockSendEmail(context);
    } else if (lowerMessage.includes('direction') || lowerMessage.includes('map')) {
      return await this.mockGetDirections(context);
    } else if (lowerMessage.includes('timeline')) {
      return await this.createTimeline(context);
    } else if (lowerMessage.includes('budget')) {
      return await this.analyzeBudget(context);
    } else {
      return await this.mockGeneralResponse(userMessage, context);
    }
  }

  // Mock implementations
  private async mockScheduleMeeting(context: TaskContext): Promise<TaskResult> {
    return {
      success: true,
      action: 'schedule_meeting',
      data: {
        id: 'mock_event_123',
        summary: 'Wedding Planning Meeting',
        start: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
      message: '✅ Mock: Meeting scheduled successfully! (Demo mode - no actual calendar event created)',
      nextSteps: [
        'Check your Google Calendar for the event',
        'Send calendar invite to attendees',
        'Prepare agenda for the meeting',
      ],
    };
  }

  private async mockFindVendors(context: TaskContext): Promise<TaskResult> {
    const mockVendors = [
      {
        name: 'Elite Wedding Photography',
        address: '123 Main St, ' + context.location,
        rating: 4.8,
        types: ['photography', 'wedding'],
        place_id: 'mock_place_1',
      },
      {
        name: 'Royal Palace Venues',
        address: '456 Palace Rd, ' + context.location,
        rating: 4.6,
        types: ['venue', 'wedding'],
        place_id: 'mock_place_2',
      },
      {
        name: 'Gourmet Catering Services',
        address: '789 Food Ave, ' + context.location,
        rating: 4.7,
        types: ['catering', 'food'],
        place_id: 'mock_place_3',
      },
    ];

    return {
      success: true,
      action: 'find_vendors',
      data: mockVendors,
      message: `✅ Mock: Found ${mockVendors.length} vendors near ${context.location} (Demo mode - using sample data)`,
      nextSteps: [
        'Review vendor details and ratings',
        'Contact vendors for quotes',
        'Schedule site visits',
        'Check vendor availability',
      ],
    };
  }

  private async mockSendEmail(context: TaskContext): Promise<TaskResult> {
    return {
      success: true,
      action: 'send_email',
      data: {
        to: 'vendor@example.com',
        subject: 'Wedding Planning Inquiry',
        body: 'Sample email content',
      },
      message: '✅ Mock: Email sent successfully! (Demo mode - no actual email sent)',
      nextSteps: [
        'Follow up in 2-3 days if no response',
        'Save vendor contact information',
        'Track communication in your planner',
      ],
    };
  }

  private async mockGetDirections(context: TaskContext): Promise<TaskResult> {
    return {
      success: true,
      action: 'get_directions',
      data: {
        distance: '15.2 km',
        duration: '25 mins',
        steps: ['Take Main St', 'Turn right on Palace Rd', 'Destination on your left'],
        mapUrl: 'https://maps.google.com/mock-directions',
      },
      message: '✅ Mock: Directions found: 15.2 km in 25 mins (Demo mode - using sample data)',
      nextSteps: [
        'Open Google Maps for turn-by-turn navigation',
        'Share directions with family members',
        'Plan travel time for wedding day',
      ],
    };
  }

  private async mockGeneralResponse(userMessage: string, context: TaskContext): Promise<TaskResult> {
    const responses = [
      `I understand you're asking about "${userMessage}". Based on your ${context.budget} wedding in ${context.location}, I can help you with that!`,
      `Great question! For your wedding in ${context.location}, here's what I recommend...`,
      `Based on your preferences, I can suggest some options for "${userMessage}".`,
      `I'd be happy to help with "${userMessage}" for your ${context.budget} wedding!`,
    ];

    const randomResponse = responses[Math.floor(Math.random() * responses.length)];

    return {
      success: true,
      action: 'general_response',
      data: { response: randomResponse },
      message: randomResponse + '\n\n💡 Tip: This is demo mode. Add API keys for full functionality!',
    };
  }

  // Analyze user intent using Gemini API
  private async analyzeIntent(message: string, context: TaskContext): Promise<{action: string, data?: any}> {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Analyze this wedding planning request and return the intent in JSON format:
              
              User Message: "${message}"
              
              Wedding Context:
              - Date: ${context.weddingDate}
              - Location: ${context.location}
              - Budget: ${context.budget}
              - Photography Styles: ${context.userPreferences.photographyPreferences.join(', ')}
              - Venue Type: ${context.userPreferences.theme.venueType}
              
              Available Actions:
              - schedule_meeting: Schedule meetings with vendors
              - find_vendors: Find vendors based on preferences
              - send_email: Send emails to vendors
              - get_directions: Get directions to venues
              - create_timeline: Create wedding timeline
              - budget_analysis: Analyze budget
              - vendor_communication: Communicate with vendors
              
              Return JSON: {"action": "action_name", "data": {...}}`
            }]
          }]
        })
      });

      const result = await response.json();
      const content = result.candidates[0].content.parts[0].text;
      
      // Extract JSON from response
      const jsonMatch = content.match(/\{.*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return { action: 'general_response' };
    } catch (error) {
      console.error('Error analyzing intent:', error);
      return { action: 'general_response' };
    }
  }

  // Schedule meeting using Google Calendar API
  private async scheduleMeeting(data: any, context: TaskContext): Promise<TaskResult> {
    try {
      const event: CalendarEvent = {
        summary: data.title || 'Wedding Planning Meeting',
        description: data.description || 'Meeting with wedding vendor',
        startTime: data.startTime,
        endTime: data.endTime,
        location: data.location,
        attendees: data.attendees || [],
      };

      // Call Google Calendar API
      const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?key=${GOOGLE_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getGoogleAccessToken()}`,
        },
        body: JSON.stringify({
          summary: event.summary,
          description: event.description,
          start: { dateTime: event.startTime, timeZone: 'Asia/Kolkata' },
          end: { dateTime: event.endTime, timeZone: 'Asia/Kolkata' },
          location: event.location,
          attendees: event.attendees?.map(email => ({ email })) || [],
        }),
      });

      if (response.ok) {
        const result = await response.json();
        return {
          success: true,
          action: 'schedule_meeting',
          data: result,
          message: `✅ Meeting scheduled successfully! Event ID: ${result.id}`,
          nextSteps: [
            'Check your Google Calendar for the event',
            'Send calendar invite to attendees',
            'Prepare agenda for the meeting',
          ],
        };
      } else {
        throw new Error('Failed to schedule meeting');
      }
    } catch (error) {
      return {
        success: false,
        action: 'schedule_meeting',
        message: `❌ Failed to schedule meeting: ${error}`,
      };
    }
  }

  // Find vendors based on preferences
  private async findVendors(data: any, context: TaskContext): Promise<TaskResult> {
    try {
      const searchQuery = data.query || 'wedding vendors';
      const location = context.location;
      
      // Use Google Places API to find vendors
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery + ' ' + location)}&key=${GOOGLE_API_KEY}`
      );

      const result = await response.json();
      
      if (result.results && result.results.length > 0) {
        const vendors = result.results.slice(0, 5).map((place: any) => ({
          name: place.name,
          address: place.formatted_address,
          rating: place.rating,
          types: place.types,
          place_id: place.place_id,
        }));

        return {
          success: true,
          action: 'find_vendors',
          data: vendors,
          message: `✅ Found ${vendors.length} vendors near ${location}`,
          nextSteps: [
            'Review vendor details and ratings',
            'Contact vendors for quotes',
            'Schedule site visits',
            'Check vendor availability',
          ],
        };
      } else {
        return {
          success: false,
          action: 'find_vendors',
          message: '❌ No vendors found in the specified location',
        };
      }
    } catch (error) {
      return {
        success: false,
        action: 'find_vendors',
        message: `❌ Error finding vendors: ${error}`,
      };
    }
  }

  // Send email using Gmail API
  private async sendEmail(data: VendorContact, context: TaskContext): Promise<TaskResult> {
    try {
      const emailContent = {
        to: data.email,
        subject: `Wedding Planning Inquiry - ${data.category}`,
        body: data.message,
      };

      // Call Gmail API
      const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/send?key=${GOOGLE_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getGoogleAccessToken()}`,
        },
        body: JSON.stringify({
          raw: btoa(`To: ${emailContent.to}\r\nSubject: ${emailContent.subject}\r\n\r\n${emailContent.body}`),
        }),
      });

      if (response.ok) {
        return {
          success: true,
          action: 'send_email',
          data: emailContent,
          message: `✅ Email sent successfully to ${data.name}`,
          nextSteps: [
            'Follow up in 2-3 days if no response',
            'Save vendor contact information',
            'Track communication in your planner',
          ],
        };
      } else {
        throw new Error('Failed to send email');
      }
    } catch (error) {
      return {
        success: false,
        action: 'send_email',
        message: `❌ Failed to send email: ${error}`,
      };
    }
  }

  // Get directions using Google Maps API
  private async getDirections(data: any, context: TaskContext): Promise<TaskResult> {
    try {
      const origin = data.origin || context.location;
      const destination = data.destination;
      
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&key=${GOOGLE_API_KEY}`
      );

      const result = await response.json();
      
      if (result.routes && result.routes.length > 0) {
        const route = result.routes[0];
        const directions = {
          distance: route.legs[0].distance.text,
          duration: route.legs[0].duration.text,
          steps: route.legs[0].steps.map((step: any) => step.html_instructions),
          mapUrl: `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`,
        };

        return {
          success: true,
          action: 'get_directions',
          data: directions,
          message: `✅ Directions found: ${directions.distance} in ${directions.duration}`,
          nextSteps: [
            'Open Google Maps for turn-by-turn navigation',
            'Share directions with family members',
            'Plan travel time for wedding day',
          ],
        };
      } else {
        return {
          success: false,
          action: 'get_directions',
          message: '❌ No route found between the specified locations',
        };
      }
    } catch (error) {
      return {
        success: false,
        action: 'get_directions',
        message: `❌ Error getting directions: ${error}`,
      };
    }
  }

  // Create wedding timeline
  private async createTimeline(context: TaskContext): Promise<TaskResult> {
    try {
      const weddingDate = new Date(context.weddingDate);
      const currentDate = new Date();
      const daysUntilWedding = Math.ceil((weddingDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));

      const timeline = this.generateTimeline(daysUntilWedding, context);

      return {
        success: true,
        action: 'create_timeline',
        data: timeline,
        message: `✅ Wedding timeline created! ${daysUntilWedding} days until your wedding`,
        nextSteps: [
          'Review and customize timeline',
          'Set reminders for important dates',
          'Share timeline with vendors',
          'Update timeline as plans progress',
        ],
      };
    } catch (error) {
      return {
        success: false,
        action: 'create_timeline',
        message: `❌ Error creating timeline: ${error}`,
      };
    }
  }

  // Analyze budget
  private async analyzeBudget(context: TaskContext): Promise<TaskResult> {
    try {
      const budget = context.userPreferences.basicDetails.budgetRange;
      const analysis = this.generateBudgetAnalysis(budget, context);

      return {
        success: true,
        action: 'budget_analysis',
        data: analysis,
        message: `✅ Budget analysis completed for ${budget} budget`,
        nextSteps: [
          'Review budget breakdown',
          'Adjust allocations if needed',
          'Track actual spending',
          'Set up budget alerts',
        ],
      };
    } catch (error) {
      return {
        success: false,
        action: 'budget_analysis',
        message: `❌ Error analyzing budget: ${error}`,
      };
    }
  }

  // Communicate with vendor
  private async communicateWithVendor(data: any, context: TaskContext): Promise<TaskResult> {
    try {
      const vendorContact: VendorContact = {
        name: data.vendorName,
        email: data.email,
        phone: data.phone,
        category: data.category,
        message: data.message,
      };

      // Send email and/or SMS
      const emailResult = await this.sendEmail(vendorContact, context);
      
      // If phone number provided, could also send SMS
      if (vendorContact.phone) {
        // SMS functionality would go here
        console.log('SMS would be sent to:', vendorContact.phone);
      }

      return {
        success: emailResult.success,
        action: 'vendor_communication',
        data: vendorContact,
        message: emailResult.success 
          ? `✅ Communication initiated with ${vendorContact.name}`
          : `❌ Failed to communicate with ${vendorContact.name}`,
        nextSteps: [
          'Follow up in 2-3 days',
          'Document communication in planner',
          'Schedule follow-up meeting if needed',
        ],
      };
    } catch (error) {
      return {
        success: false,
        action: 'vendor_communication',
        message: `❌ Error communicating with vendor: ${error}`,
      };
    }
  }

  // Get general response from Gemini
  private async getGeneralResponse(message: string, context: TaskContext): Promise<TaskResult> {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are a wedding planning assistant. Help with this request:

              User Message: "${message}"
              
              Wedding Context:
              - Date: ${context.weddingDate}
              - Location: ${context.location}
              - Budget: ${context.budget}
              - Photography Styles: ${context.userPreferences.photographyPreferences.join(', ')}
              - Venue Type: ${context.userPreferences.theme.venueType}
              
              Provide helpful, actionable advice based on their wedding context.`
            }]
          }]
        })
      });

      const result = await response.json();
      const content = result.candidates[0].content.parts[0].text;

      return {
        success: true,
        action: 'general_response',
        data: { response: content },
        message: content,
      };
    } catch (error) {
      return {
        success: false,
        action: 'general_response',
        message: `❌ Error getting response: ${error}`,
      };
    }
  }

  // Helper methods
  private async getGoogleAccessToken(): Promise<string> {
    // This would integrate with Google OAuth
    // For now, return a placeholder
    return 'placeholder_token';
  }

  private generateTimeline(daysUntilWedding: number, context: TaskContext): any {
    const timeline = {
      '12 months before': [
        'Set wedding budget',
        'Choose wedding date',
        'Book ceremony and reception venues',
        'Hire wedding planner (optional)',
      ],
      '9 months before': [
        'Choose and book photographer',
        'Choose and book videographer',
        'Book entertainment (band/DJ)',
        'Start dress shopping',
      ],
      '6 months before': [
        'Book caterer',
        'Book florist',
        'Book transportation',
        'Send save-the-dates',
      ],
      '3 months before': [
        'Order wedding cake',
        'Book hair and makeup',
        'Plan honeymoon',
        'Buy wedding rings',
      ],
      '1 month before': [
        'Final dress fitting',
        'Finalize timeline',
        'Confirm all vendors',
        'Plan rehearsal dinner',
      ],
      '1 week before': [
        'Final vendor meetings',
        'Pack for honeymoon',
        'Prepare wedding day emergency kit',
        'Relax and enjoy!',
      ],
    };

    return timeline;
  }

  private generateBudgetAnalysis(budget: string, context: TaskContext): any {
    const budgetRanges = {
      '₹5-10L': {
        venue: '40%',
        catering: '25%',
        photography: '15%',
        decoration: '10%',
        entertainment: '5%',
        miscellaneous: '5%',
      },
      '₹10-20L': {
        venue: '35%',
        catering: '20%',
        photography: '20%',
        decoration: '15%',
        entertainment: '5%',
        miscellaneous: '5%',
      },
      '₹20L+': {
        venue: '30%',
        catering: '15%',
        photography: '25%',
        decoration: '20%',
        entertainment: '5%',
        miscellaneous: '5%',
      },
    };

    return {
      totalBudget: budget,
      breakdown: budgetRanges[budget as keyof typeof budgetRanges] || budgetRanges['₹5-10L'],
      recommendations: [
        'Consider package deals for better value',
        'Negotiate with vendors for better rates',
        'Track all expenses in a spreadsheet',
        'Set aside 10% for unexpected costs',
      ],
    };
  }
}

// Export singleton instance
export const aiAssistant = new AIAssistantService(); 