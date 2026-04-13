import { API_BASE, getAuthHeaders } from '../config/api_config';

export interface VendorBooking {
  id: number;
  vendor_id: number;
  event_date: string;
  end_date: string;
  booking_type: 'booked' | 'blocked' | 'tentative';
  couple_id?: number;
  couple_name: string;
  blueprint_id?: number;
  event_title: string;
  location: string;
  notes: string;
  created_at: string;
}

export interface AvailabilityResult {
  vendor_id: number;
  vendor_name: string;
  category: string;
  available: boolean;
  conflicts: VendorBooking[];
  rating: number;
}

export interface DateSuggestion {
  date: string;
  day_of_week: string;
  score: number;
  vendor_availability: string;
  vendor_availability_pct: number;
  season: 'peak' | 'off-peak' | 'shoulder';
  price_impact: 'higher' | 'lower' | 'moderate';
  reasons: string[];
}

export class VendorCalendarService {
  static async getVendorCalendar(vendorId: number, month?: string): Promise<{ success: boolean; data?: { bookings: VendorBooking[]; accepted_quotes: any[] }; error?: string }> {
    const params = month ? `?month=${month}` : '';
    const res = await fetch(`${API_BASE}/api/vendor-calendar/${vendorId}${params}`, { headers: getAuthHeaders() });
    return res.json();
  }

  static async addBooking(data: Partial<VendorBooking>): Promise<{ success: boolean; data?: VendorBooking; error?: string }> {
    const res = await fetch(`${API_BASE}/api/vendor-calendar`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(data) });
    return res.json();
  }

  static async updateBooking(bookingId: number, data: Partial<VendorBooking>): Promise<{ success: boolean; data?: VendorBooking; error?: string }> {
    const res = await fetch(`${API_BASE}/api/vendor-calendar/${bookingId}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(data) });
    return res.json();
  }

  static async deleteBooking(bookingId: number): Promise<{ success: boolean; error?: string }> {
    const res = await fetch(`${API_BASE}/api/vendor-calendar/${bookingId}`, { method: 'DELETE', headers: getAuthHeaders() });
    return res.json();
  }

  static async checkAvailability(data: { vendor_ids?: number[]; date: string; end_date?: string; category?: string }): Promise<{ success: boolean; data?: { results: AvailabilityResult[]; available_count: number; total_checked: number } }> {
    const res = await fetch(`${API_BASE}/api/vendor-calendar/check-availability`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(data) });
    return res.json();
  }

  static async suggestDates(data: { couple_id?: number; preferred_month?: string; city?: string; vendor_ids?: number[]; category?: string; flexibility_days?: number; budget_tier?: string }): Promise<{ success: boolean; data?: { suggestions: DateSuggestion[]; ai_summary: string; total_candidates_scored: number } }> {
    const res = await fetch(`${API_BASE}/api/ai/suggest-dates`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(data) });
    return res.json();
  }
}
