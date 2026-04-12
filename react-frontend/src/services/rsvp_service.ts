import { API_BASE, getAuthHeaders } from '../config/api_config';
import { WeddingEvent, RSVPInvite, RSVPResponse } from '../types/marketplace';

export class RSVPService {
  static async createEvent(data: Partial<WeddingEvent>): Promise<{ success: boolean; data?: WeddingEvent; error?: string }> {
    const res = await fetch(`${API_BASE}/api/events`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(data) });
    return res.json();
  }

  static async getEvents(coupleId: number): Promise<{ success: boolean; data?: WeddingEvent[]; error?: string }> {
    const res = await fetch(`${API_BASE}/api/events?couple_id=${coupleId}`, { headers: getAuthHeaders() });
    return res.json();
  }

  static async generateInviteLink(data: { couple_id: number; event_id: number }): Promise<{ success: boolean; data?: RSVPInvite; error?: string }> {
    const res = await fetch(`${API_BASE}/api/rsvp-invites`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(data) });
    return res.json();
  }

  static async getPublicEventDetails(inviteCode: string): Promise<{ success: boolean; data?: any; error?: string }> {
    const res = await fetch(`${API_BASE}/api/rsvp/${inviteCode}`);
    return res.json();
  }

  static async submitRSVP(inviteCode: string, response: Partial<RSVPResponse>): Promise<{ success: boolean; error?: string }> {
    const res = await fetch(`${API_BASE}/api/rsvp/${inviteCode}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(response) });
    return res.json();
  }

  static async getRSVPResponses(coupleId: number, eventId?: number): Promise<{ success: boolean; data?: { responses: RSVPResponse[]; stats: any }; error?: string }> {
    const query = eventId ? `couple_id=${coupleId}&event_id=${eventId}` : `couple_id=${coupleId}`;
    const res = await fetch(`${API_BASE}/api/rsvp-responses?${query}`, { headers: getAuthHeaders() });
    return res.json();
  }
}
