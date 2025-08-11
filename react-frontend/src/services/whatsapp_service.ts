
import { SANDBOX_CONFIG } from '../config/google_config';

interface WhatsAppMessage {
  phoneNumber: string;
  message: string;
  vendorName?: string;
  weddingDate?: string;
  eventType?: string;
}

interface WhatsAppResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  sandboxMode?: boolean;
}

export class WhatsAppService {
  private static readonly API_BASE = process.env.REACT_APP_WHATSAPP_API_BASE || 'http://localhost:8000/api';
  private static readonly SANDBOX_MODE = SANDBOX_CONFIG.SANDBOX_MODE;

  /**
   * Send vendor inquiry via WhatsApp
   */
  static async sendVendorInquiry(
    vendorPhone: string,
    vendorName: string,
    weddingDetails: any
  ): Promise<WhatsAppResponse> {
    try {
      const message = this.generateVendorMessage(vendorName, weddingDetails);
      
      if (this.SANDBOX_MODE) {
        return this.sandboxSend(vendorPhone, message, 'vendor_inquiry');
      }

      const response = await fetch(`${this.API_BASE}/whatsapp/send-vendor-inquiry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: vendorPhone,
          message: message,
          vendorName: vendorName,
          weddingDate: weddingDetails.date,
          eventType: 'vendor_inquiry'
        })
      });

      const data = await response.json();
      return {
        success: data.success,
        messageId: data.messageId,
        error: data.error
      };

    } catch (error) {
      console.error('WhatsApp send error:', error);
      return {
        success: false,
        error: `Failed to send WhatsApp message: ${error}`
      };
    }
  }

  /**
   * Send guest invitation via WhatsApp
   */
  static async sendGuestInvitation(
    guestPhone: string,
    guestName: string,
    weddingDetails: any
  ): Promise<WhatsAppResponse> {
    try {
      const message = this.generateInvitationMessage(guestName, weddingDetails);
      
      if (this.SANDBOX_MODE) {
        return this.sandboxSend(guestPhone, message, 'guest_invitation');
      }

      const response = await fetch(`${this.API_BASE}/whatsapp/send-guest-invitation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: guestPhone,
          message: message,
          guestName: guestName,
          weddingDate: weddingDetails.date,
          eventType: 'guest_invitation'
        })
      });

      const data = await response.json();
      return {
        success: data.success,
        messageId: data.messageId,
        error: data.error
      };

    } catch (error) {
      console.error('WhatsApp send error:', error);
      return {
        success: false,
        error: `Failed to send WhatsApp message: ${error}`
      };
    }
  }

  /**
   * Send RSVP reminder via WhatsApp
   */
  static async sendRSVPReminder(
    guestPhone: string,
    guestName: string,
    weddingDetails: any
  ): Promise<WhatsAppResponse> {
    try {
      const message = this.generateRSVPMessage(guestName, weddingDetails);
      
      if (this.SANDBOX_MODE) {
        return this.sandboxSend(guestPhone, message, 'rsvp_reminder');
      }

      const response = await fetch(`${this.API_BASE}/whatsapp/send-rsvp-reminder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: guestPhone,
          message: message,
          guestName: guestName,
          weddingDate: weddingDetails.date,
          eventType: 'rsvp_reminder'
        })
      });

      const data = await response.json();
      return {
        success: data.success,
        messageId: data.messageId,
        error: data.error
      };

    } catch (error) {
      console.error('WhatsApp send error:', error);
      return {
        success: false,
        error: `Failed to send WhatsApp message: ${error}`
      };
    }
  }

  /**
   * Sandbox mode - simulates sending without actual WhatsApp API
   */
  private static async sandboxSend(
    phoneNumber: string,
    message: string,
    messageType: string
  ): Promise<WhatsAppResponse> {
    console.log('🧪 SANDBOX MODE - WhatsApp Message Simulation');
    console.log('📱 To:', phoneNumber);
    console.log('💬 Message Type:', messageType);
    console.log('📝 Message:');
    console.log(message);
    console.log('---');

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      success: true,
      messageId: `sandbox_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sandboxMode: true
    };
  }

  /**
   * Generate vendor inquiry message
   */
  private static generateVendorMessage(vendorName: string, weddingDetails: any): string {
    return `🌸 Wedding Services Inquiry 💍

Hi ${vendorName}!

We're planning our wedding and interested in your services:

📅 Date: ${weddingDetails.date || 'TBD'}
👥 Guests: ${weddingDetails.guestCount || 'TBD'}
📍 Location: ${weddingDetails.location || 'TBD'}
🎯 Service: ${weddingDetails.category || 'Wedding Services'}

Could you please share:
• Availability for our date
• Service packages & pricing
• Portfolio samples

Looking forward to hearing from you!

Best regards,
${weddingDetails.coupleNames || 'The Wedding Couple'}
📱 ${weddingDetails.contactNumber || SANDBOX_CONFIG.TEST_PHONE}`;
  }

  /**
   * Generate guest invitation message
   */
  private static generateInvitationMessage(guestName: string, weddingDetails: any): string {
    return `💍 You're Invited to Our Wedding! 🌸

Dear ${guestName},

${weddingDetails.coupleNames || 'We'} would love to have you celebrate our special day with us!

📅 Date: ${weddingDetails.date || 'Coming Soon'}
🕐 Time: ${weddingDetails.time || 'TBD'}
📍 Venue: ${weddingDetails.venue || 'Details to follow'}
📱 RSVP: ${weddingDetails.rsvpLink || 'Please confirm via this number'}

Your presence would make our celebration complete!

With love,
${weddingDetails.coupleNames || 'The Happy Couple'} 💕`;
  }

  /**
   * Generate RSVP reminder message
   */
  private static generateRSVPMessage(guestName: string, weddingDetails: any): string {
    return `🔔 RSVP Reminder - Wedding Invitation 💍

Hi ${guestName}!

This is a friendly reminder to RSVP for our wedding:

📅 Date: ${weddingDetails.date}
📱 Please confirm your attendance by replying to this message

We're excited to celebrate with you!

Best regards,
${weddingDetails.coupleNames || 'The Wedding Couple'} 🌸`;
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
   * Validate phone number format
   */
  static validatePhoneNumber(phone: string): boolean {
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(phone);
  }
}
