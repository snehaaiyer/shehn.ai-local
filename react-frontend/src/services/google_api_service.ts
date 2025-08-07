// Google API Integration Service for Wedding Planning
// Handles Google Calendar events and Gmail communications

import { GOOGLE_CONFIG } from '../config/google_config';

interface GoogleCalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  location?: string;
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted';
  }>;
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{
      method: 'email' | 'popup';
      minutes: number;
    }>;
  };
}

interface GmailMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  payload: {
    headers: Array<{
      name: string;
      value: string;
    }>;
    body?: {
      data?: string;
    };
    parts?: Array<{
      mimeType: string;
      body: {
        data?: string;
      };
    }>;
  };
}

interface WeddingEvent {
  id?: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  attendees: string[];
  eventType: 'ceremony' | 'reception' | 'rehearsal' | 'vendor-meeting' | 'other';
  reminders: {
    email: boolean;
    popup: boolean;
    minutes: number;
  };
}

interface EmailTemplate {
  subject: string;
  body: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
}

export class GoogleAPIService {
  private static readonly CLIENT_ID = GOOGLE_CONFIG.CLIENT_ID;
  private static readonly API_KEY = GOOGLE_CONFIG.API_KEY;
  private static readonly DISCOVERY_DOCS = GOOGLE_CONFIG.DISCOVERY_DOCS;
  private static readonly SCOPES = GOOGLE_CONFIG.SCOPES;

  private static gapi: any = null;
  private static isInitialized = false;
  private static isSignedIn = false;

  /**
   * Initialize Google API client
   */
  static async initialize(): Promise<boolean> {
    try {
      // Check if API keys are configured
      if (!this.API_KEY || !this.CLIENT_ID || this.API_KEY === '' || this.CLIENT_ID === '') {
        console.warn('Google API keys not configured. Google integration will be disabled.');
        return false;
      }

      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        console.warn('Not in browser environment. Google integration will be disabled.');
        return false;
      }

      // Load Google API script if not already loaded
      if (!window.gapi) {
        await this.loadGoogleAPIScript();
      }

      this.gapi = window.gapi;
      
      await this.gapi.load('client:auth2', async () => {
        await this.gapi.client.init({
          apiKey: this.API_KEY,
          clientId: this.CLIENT_ID,
          discoveryDocs: this.DISCOVERY_DOCS,
          scope: this.SCOPES
        });

        this.isInitialized = true;
        
        // Listen for sign-in state changes
        this.gapi.auth2.getAuthInstance().isSignedIn.listen((signedIn: boolean) => {
          this.isSignedIn = signedIn;
        });

        // Set initial sign-in state
        this.isSignedIn = this.gapi.auth2.getAuthInstance().isSignedIn.get();
      });

      return true;
    } catch (error) {
      console.error('Failed to initialize Google API:', error);
      return false;
    }
  }

  /**
   * Load Google API script dynamically
   */
  private static loadGoogleAPIScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        reject(new Error('Not in browser environment'));
        return;
      }

      if (window.gapi) {
        resolve();
        return;
      }

      try {
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Google API script'));
        document.head.appendChild(script);
      } catch (error) {
        reject(new Error(`Failed to create Google API script: ${error}`));
      }
    });
  }

  /**
   * Sign in to Google account
   */
  static async signIn(): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        const initialized = await this.initialize();
        if (!initialized) {
          console.warn('Google API not initialized. Cannot sign in.');
          return false;
        }
      }

      if (!this.gapi || !this.gapi.auth2) {
        console.error('Google API not properly loaded');
        return false;
      }

      const authInstance = this.gapi.auth2.getAuthInstance();
      if (!authInstance) {
        console.error('Google Auth instance not available');
        return false;
      }

      await authInstance.signIn();
      this.isSignedIn = true;
      return true;
    } catch (error) {
      console.error('Failed to sign in:', error);
      return false;
    }
  }

  /**
   * Sign out from Google account
   */
  static async signOut(): Promise<void> {
    try {
      if (this.gapi && this.gapi.auth2) {
        const authInstance = this.gapi.auth2.getAuthInstance();
        await authInstance.signOut();
        this.isSignedIn = false;
      }
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  }

  /**
   * Check if user is signed in
   */
  static isUserSignedIn(): boolean {
    return this.isSignedIn;
  }

  /**
   * Get user profile information
   */
  static async getUserProfile(): Promise<any> {
    try {
      if (!this.isSignedIn) {
        throw new Error('User not signed in');
      }

      const authInstance = this.gapi.auth2.getAuthInstance();
      const user = authInstance.currentUser.get();
      const profile = user.getBasicProfile();
      
      return {
        id: profile.getId(),
        name: profile.getName(),
        email: profile.getEmail(),
        imageUrl: profile.getImageUrl()
      };
    } catch (error) {
      console.error('Failed to get user profile:', error);
      throw error;
    }
  }

  // ==================== GOOGLE CALENDAR METHODS ====================

  /**
   * Create a wedding event in Google Calendar
   */
  static async createWeddingEvent(event: WeddingEvent): Promise<string> {
    try {
      if (!this.isSignedIn) {
        throw new Error('User not signed in');
      }

      const calendarEvent: GoogleCalendarEvent = {
        summary: event.title,
        description: event.description,
        start: {
          dateTime: event.startDate,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        end: {
          dateTime: event.endDate,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        location: event.location,
        attendees: event.attendees.map(email => ({ email })),
        reminders: {
          useDefault: false,
          overrides: [
            {
              method: event.reminders.email ? 'email' : 'popup',
              minutes: event.reminders.minutes
            }
          ]
        }
      };

      const response = await this.gapi.client.calendar.events.insert({
        calendarId: 'primary',
        resource: calendarEvent,
        sendUpdates: 'all'
      });

      return response.result.id;
    } catch (error) {
      console.error('Failed to create calendar event:', error);
      throw error;
    }
  }

  /**
   * Update an existing wedding event
   */
  static async updateWeddingEvent(eventId: string, event: WeddingEvent): Promise<void> {
    try {
      if (!this.isSignedIn) {
        throw new Error('User not signed in');
      }

      const calendarEvent: GoogleCalendarEvent = {
        summary: event.title,
        description: event.description,
        start: {
          dateTime: event.startDate,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        end: {
          dateTime: event.endDate,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        location: event.location,
        attendees: event.attendees.map(email => ({ email })),
        reminders: {
          useDefault: false,
          overrides: [
            {
              method: event.reminders.email ? 'email' : 'popup',
              minutes: event.reminders.minutes
            }
          ]
        }
      };

      await this.gapi.client.calendar.events.update({
        calendarId: 'primary',
        eventId: eventId,
        resource: calendarEvent,
        sendUpdates: 'all'
      });
    } catch (error) {
      console.error('Failed to update calendar event:', error);
      throw error;
    }
  }

  /**
   * Delete a wedding event
   */
  static async deleteWeddingEvent(eventId: string): Promise<void> {
    try {
      if (!this.isSignedIn) {
        throw new Error('User not signed in');
      }

      await this.gapi.client.calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId,
        sendUpdates: 'all'
      });
    } catch (error) {
      console.error('Failed to delete calendar event:', error);
      throw error;
    }
  }

  /**
   * Get all wedding events from calendar
   */
  static async getWeddingEvents(startDate?: string, endDate?: string): Promise<WeddingEvent[]> {
    try {
      if (!this.isSignedIn) {
        throw new Error('User not signed in');
      }

      const timeMin = startDate || new Date().toISOString();
      const timeMax = endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

      const response = await this.gapi.client.calendar.events.list({
        calendarId: 'primary',
        timeMin: timeMin,
        timeMax: timeMax,
        singleEvents: true,
        orderBy: 'startTime'
      });

      return response.result.items
        .filter((event: any) => 
          event.summary?.toLowerCase().includes('wedding') ||
          event.summary?.toLowerCase().includes('ceremony') ||
          event.summary?.toLowerCase().includes('reception') ||
          event.description?.toLowerCase().includes('wedding')
        )
        .map((event: any) => ({
          id: event.id,
          title: event.summary,
          description: event.description || '',
          startDate: event.start.dateTime || event.start.date,
          endDate: event.end.dateTime || event.end.date,
          location: event.location || '',
          attendees: event.attendees?.map((a: any) => a.email) || [],
          eventType: this.determineEventType(event.summary, event.description),
          reminders: {
            email: true,
            popup: true,
            minutes: 60
          }
        }));
    } catch (error) {
      console.error('Failed to get wedding events:', error);
      throw error;
    }
  }

  /**
   * Determine event type based on title and description
   */
  private static determineEventType(title: string, description: string): WeddingEvent['eventType'] {
    const text = `${title} ${description}`.toLowerCase();
    
    if (text.includes('ceremony')) return 'ceremony';
    if (text.includes('reception')) return 'reception';
    if (text.includes('rehearsal')) return 'rehearsal';
    if (text.includes('vendor') || text.includes('meeting')) return 'vendor-meeting';
    return 'other';
  }

  // ==================== GMAIL METHODS ====================

  /**
   * Send wedding invitation email
   */
  static async sendWeddingInvitation(template: EmailTemplate): Promise<string> {
    try {
      if (!this.isSignedIn) {
        throw new Error('User not signed in');
      }

      const message = this.createEmailMessage(template);
      
      const response = await this.gapi.client.gmail.users.messages.send({
        userId: 'me',
        resource: {
          raw: this.base64Encode(message)
        }
      });

      return response.result.id;
    } catch (error) {
      console.error('Failed to send wedding invitation:', error);
      throw error;
    }
  }

  /**
   * Send vendor communication email
   */
  static async sendVendorEmail(template: EmailTemplate): Promise<string> {
    try {
      if (!this.isSignedIn) {
        throw new Error('User not signed in');
      }

      const message = this.createEmailMessage(template);
      
      const response = await this.gapi.client.gmail.users.messages.send({
        userId: 'me',
        resource: {
          raw: this.base64Encode(message)
        }
      });

      return response.result.id;
    } catch (error) {
      console.error('Failed to send vendor email:', error);
      throw error;
    }
  }

  /**
   * Get wedding-related emails
   */
  static async getWeddingEmails(maxResults: number = 20): Promise<GmailMessage[]> {
    try {
      if (!this.isSignedIn) {
        throw new Error('User not signed in');
      }

      const response = await this.gapi.client.gmail.users.messages.list({
        userId: 'me',
        q: 'wedding OR ceremony OR reception OR invitation',
        maxResults: maxResults
      });

      const messages = response.result.messages || [];
      const detailedMessages = await Promise.all(
        messages.map(async (msg: any) => {
          const detailResponse = await this.gapi.client.gmail.users.messages.get({
            userId: 'me',
            id: msg.id
          });
          return detailResponse.result;
        })
      );

      return detailedMessages;
    } catch (error) {
      console.error('Failed to get wedding emails:', error);
      throw error;
    }
  }

  /**
   * Create email message in RFC 2822 format
   */
  private static createEmailMessage(template: EmailTemplate): string {
    const boundary = 'boundary_' + Math.random().toString(36).substring(2);
    const date = new Date().toUTCString();
    
    let message = '';
    message += `From: ${this.getUserEmail()}\r\n`;
    message += `To: ${template.to.join(', ')}\r\n`;
    if (template.cc) message += `Cc: ${template.cc.join(', ')}\r\n`;
    if (template.bcc) message += `Bcc: ${template.bcc.join(', ')}\r\n`;
    message += `Subject: ${template.subject}\r\n`;
    message += `Date: ${date}\r\n`;
    message += `MIME-Version: 1.0\r\n`;
    message += `Content-Type: multipart/alternative; boundary="${boundary}"\r\n\r\n`;
    
    message += `--${boundary}\r\n`;
    message += `Content-Type: text/plain; charset="UTF-8"\r\n\r\n`;
    message += `${template.body}\r\n\r\n`;
    
    message += `--${boundary}--\r\n`;
    
    return message;
  }

  /**
   * Get current user's email address
   */
  private static getUserEmail(): string {
    if (this.gapi && this.gapi.auth2) {
      const authInstance = this.gapi.auth2.getAuthInstance();
      const user = authInstance.currentUser.get();
      return user.getBasicProfile().getEmail();
    }
    return '';
  }

  /**
   * Base64 encode email message
   */
  private static base64Encode(message: string): string {
    return btoa(message).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  // ==================== WEDDING PLANNING SPECIFIC METHODS ====================

  /**
   * Create a complete wedding timeline with all events
   */
  static async createWeddingTimeline(weddingDate: string, events: WeddingEvent[]): Promise<string[]> {
    try {
      const eventIds: string[] = [];
      
      for (const event of events) {
        const eventId = await this.createWeddingEvent(event);
        eventIds.push(eventId);
      }
      
      return eventIds;
    } catch (error) {
      console.error('Failed to create wedding timeline:', error);
      throw error;
    }
  }

  /**
   * Send bulk wedding invitations
   */
  static async sendBulkInvitations(guestList: string[], weddingDetails: any): Promise<string[]> {
    try {
      const messageIds: string[] = [];
      
      for (const guestEmail of guestList) {
        const template: EmailTemplate = {
          subject: `You're Invited to Our Wedding!`,
          body: this.generateInvitationEmail(weddingDetails),
          to: [guestEmail]
        };
        
        const messageId = await this.sendWeddingInvitation(template);
        messageIds.push(messageId);
      }
      
      return messageIds;
    } catch (error) {
      console.error('Failed to send bulk invitations:', error);
      throw error;
    }
  }

  /**
   * Generate invitation email template
   */
  private static generateInvitationEmail(weddingDetails: any): string {
    return `
Dear ${weddingDetails.guestName || 'Guest'},

You are cordially invited to celebrate our wedding!

📅 Date: ${weddingDetails.date}
🕐 Time: ${weddingDetails.time}
📍 Venue: ${weddingDetails.venue}
📍 Address: ${weddingDetails.address}

Please RSVP by ${weddingDetails.rsvpDate || '2 weeks before the event'}.

We look forward to celebrating this special day with you!

Best regards,
${weddingDetails.coupleNames || 'The Happy Couple'}
    `.trim();
  }

  /**
   * Send vendor inquiry email
   */
  static async sendVendorInquiry(vendorEmail: string, inquiryDetails: any): Promise<string> {
    try {
      const template: EmailTemplate = {
        subject: `Wedding Vendor Inquiry - ${inquiryDetails.serviceType}`,
        body: this.generateVendorInquiryEmail(inquiryDetails),
        to: [vendorEmail]
      };
      
      return await this.sendVendorEmail(template);
    } catch (error) {
      console.error('Failed to send vendor inquiry:', error);
      throw error;
    }
  }

  /**
   * Generate vendor inquiry email template
   */
  private static generateVendorInquiryEmail(inquiryDetails: any): string {
    return `
Dear ${inquiryDetails.vendorName || 'Vendor'},

We are planning our wedding and would like to inquire about your ${inquiryDetails.serviceType} services.

📅 Wedding Date: ${inquiryDetails.weddingDate}
👥 Guest Count: ${inquiryDetails.guestCount}
📍 Location: ${inquiryDetails.location}
💰 Budget Range: ${inquiryDetails.budgetRange}

${inquiryDetails.additionalDetails || ''}

Please let us know your availability and pricing for our special day.

Thank you for your time!

Best regards,
${inquiryDetails.coupleNames || 'The Happy Couple'}
    `.trim();
  }
}

// Extend Window interface to include gapi
declare global {
  interface Window {
    gapi: any;
  }
} 