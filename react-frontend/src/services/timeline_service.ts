import { API_BASE, getAuthHeaders } from '../config/api_config';
import { TimelineEvent } from '../types/marketplace';

export class TimelineService {
  static async getTimeline(coupleId: number, opts?: { month?: string; upcoming?: boolean; limit?: number }): Promise<{ success: boolean; data?: TimelineEvent[]; error?: string }> {
    const params = new URLSearchParams({ couple_id: String(coupleId) });
    if (opts?.month) params.set('month', opts.month);
    if (opts?.upcoming) params.set('upcoming', 'true');
    if (opts?.limit) params.set('limit', String(opts.limit));
    const res = await fetch(`${API_BASE}/api/timeline?${params}`, { headers: getAuthHeaders() });
    return res.json();
  }

  static async createEvent(data: Partial<TimelineEvent>): Promise<{ success: boolean; data?: TimelineEvent; error?: string }> {
    const res = await fetch(`${API_BASE}/api/timeline`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(data) });
    return res.json();
  }

  static async updateEvent(id: number, data: Partial<TimelineEvent>): Promise<{ success: boolean; error?: string }> {
    const res = await fetch(`${API_BASE}/api/timeline/${id}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(data) });
    return res.json();
  }

  static async deleteEvent(id: number): Promise<{ success: boolean; error?: string }> {
    const res = await fetch(`${API_BASE}/api/timeline/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
    return res.json();
  }

  static async generateTimeline(data: { couple_id: number; wedding_date: string; events: string[] }): Promise<{ success: boolean; data?: TimelineEvent[]; error?: string }> {
    const res = await fetch(`${API_BASE}/api/timeline/generate`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(data) });
    return res.json();
  }
}
