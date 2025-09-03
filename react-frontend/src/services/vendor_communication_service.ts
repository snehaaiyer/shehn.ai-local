
interface CommunicationRequest {
  vendorInfo: {
    name: string;
    email?: string;
    phone?: string;
    category: string;
  };
  weddingInfo: {
    date: string;
    location: string;
    guestCount: number;
    coupleNames: string;
    contactEmail: string;
    contactNumber: string;
  };
  message: string;
  subject?: string;
}

interface CommunicationResponse {
  success: boolean;
  message_id?: string;
  vendor?: string;
  email?: string;
  phone?: string;
  error?: string;
  timestamp: string;
}

export class VendorCommunicationService {
  private static readonly API_BASE = process.env.REACT_APP_API_BASE || 'http://0.0.0.0:8001';

  /**
   * Send email to vendor
   */
  static async sendEmail(request: CommunicationRequest): Promise<CommunicationResponse> {
    try {
      const response = await fetch(`${this.API_BASE}/api/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: CommunicationResponse = await response.json();
      return data;

    } catch (error) {
      console.error('Email send error:', error);
      return {
        success: false,
        error: `Failed to send email: ${error}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Send WhatsApp message to vendor
   */
  static async sendWhatsApp(request: CommunicationRequest): Promise<CommunicationResponse> {
    try {
      const response = await fetch(`${this.API_BASE}/api/send-whatsapp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: CommunicationResponse = await response.json();
      return data;

    } catch (error) {
      console.error('WhatsApp send error:', error);
      return {
        success: false,
        error: `Failed to send WhatsApp message: ${error}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get communication history for a vendor
   */
  static async getCommunicationHistory(vendorId: string): Promise<any> {
    try {
      const response = await fetch(`${this.API_BASE}/api/vendor-communications/${vendorId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();

    } catch (error) {
      console.error('Error getting communication history:', error);
      return {
        success: false,
        error: `Failed to get communication history: ${error}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Format phone number for WhatsApp (international format)
   */
  static formatPhoneNumber(phone: string, countryCode: string = '+91'): string {
    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, '');
    
    // If it doesn't start with country code, add it
    if (!cleaned.startsWith(countryCode.replace('+', ''))) {
      return `${countryCode}${cleaned}`;
    }
    
    return `+${cleaned}`;
  }

  /**
   * Validate email format
   */
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone number format
   */
  static validatePhoneNumber(phone: string): boolean {
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(phone);
  }

  /**
   * Generate email template for vendor category
   */
  static generateEmailTemplate(category: string, vendorName: string, weddingDetails: any): string {
    const templates = {
      venues: `Dear ${vendorName},

I hope this email finds you well. We are planning our wedding for ${weddingDetails.date} and are interested in your venue services.

Event Details:
• Wedding Date: ${weddingDetails.date}
• Guest Count: ${weddingDetails.guestCount}
• Location Preference: ${weddingDetails.location}

We would appreciate information about:
• Availability for our date
• Venue packages and pricing
• Included amenities and services
• Decoration policies
• Catering arrangements

Thank you for your time. Looking forward to hearing from you.

Best regards,
${weddingDetails.coupleNames}
${weddingDetails.contactEmail}
${weddingDetails.contactNumber}`,

      catering: `Dear ${vendorName},

Greetings! We are planning our wedding celebration and would like to inquire about your catering services.

Wedding Details:
• Date: ${weddingDetails.date}
• Guest Count: ${weddingDetails.guestCount}
• Venue: ${weddingDetails.location}

Please provide information about:
• Menu options and packages
• Pricing per plate
• Service style options
• Dietary accommodation
• Tasting session availability

Thank you!

Best regards,
${weddingDetails.coupleNames}`,

      photography: `Dear ${vendorName},

We are planning our wedding for ${weddingDetails.date} and are looking for a talented photographer to capture our special day.

Event Details:
• Wedding Date: ${weddingDetails.date}
• Guest Count: ${weddingDetails.guestCount}
• Location: ${weddingDetails.location}

We would love to know about:
• Your photography style and packages
• Pricing and what's included
• Availability for our date
• Portfolio samples
• Pre-wedding shoot options

Looking forward to your response.

Best regards,
${weddingDetails.coupleNames}`,

      decoration: `Dear ${vendorName},

We are excited about our upcoming wedding on ${weddingDetails.date} and are interested in your decoration services.

Event Details:
• Wedding Date: ${weddingDetails.date}
• Guest Count: ${weddingDetails.guestCount}
• Venue: ${weddingDetails.location}

Please share details about:
• Decoration themes and styles
• Package options and pricing
• Setup and breakdown services
• Floral arrangements
• Lighting options

Thank you for your time.

Best regards,
${weddingDetails.coupleNames}`
    };

    return templates[category as keyof typeof templates] || templates.venues;
  }

  /**
   * Generate WhatsApp template for vendor category
   */
  static generateWhatsAppTemplate(category: string, vendorName: string, weddingDetails: any): string {
    const categoryIcon = {
      venues: '🏛️',
      catering: '🍽️',
      photography: '📸',
      decoration: '🎨',
      makeup: '💄'
    };

    const icon = categoryIcon[category as keyof typeof categoryIcon] || '🎉';

    return `${icon} Wedding Services Inquiry 💍

Hi ${vendorName}!

We're planning our wedding for ${weddingDetails.date} with ${weddingDetails.guestCount} guests in ${weddingDetails.location}.

Could you please share:
• Availability for our date
• Service packages & pricing
• Portfolio samples

Looking forward to hearing from you!

Best regards,
${weddingDetails.coupleNames}
📱 ${weddingDetails.contactNumber}`;
  }
}

export default VendorCommunicationService;
