import { API_BASE, getAuthHeaders } from '../config/api_config';

export class AdminService {
  static async getVendors(status?: string): Promise<{ success: boolean; data?: any[]; error?: string }> {
    const query = status ? `?status=${status}` : '';
    const res = await fetch(`${API_BASE}/api/admin/vendors${query}`, { headers: getAuthHeaders() });
    return res.json();
  }

  static async approveVendor(vendorId: number): Promise<{ success: boolean; error?: string }> {
    const res = await fetch(`${API_BASE}/api/admin/vendors/${vendorId}/approve`, { method: 'PATCH', headers: getAuthHeaders() });
    return res.json();
  }

  static async rejectVendor(vendorId: number, reason: string): Promise<{ success: boolean; error?: string }> {
    const res = await fetch(`${API_BASE}/api/admin/vendors/${vendorId}/reject`, { method: 'PATCH', headers: getAuthHeaders(), body: JSON.stringify({ reason }) });
    return res.json();
  }

  static async getUsers(): Promise<{ success: boolean; data?: any[]; error?: string }> {
    const res = await fetch(`${API_BASE}/api/admin/users`, { headers: getAuthHeaders() });
    return res.json();
  }
}
