import { API_BASE, getAuthHeaders } from '../config/api_config';
import { VendorProfile } from '../types/marketplace';

export class VendorService {
  static async register(data: Partial<VendorProfile>): Promise<{ success: boolean; data?: VendorProfile; error?: string }> {
    const res = await fetch(`${API_BASE}/api/vendors/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    return res.json();
  }

  static async getProfile(vendorId: number): Promise<{ success: boolean; data?: VendorProfile; error?: string }> {
    const res = await fetch(`${API_BASE}/api/vendor-profile/${vendorId}`, { headers: getAuthHeaders() });
    return res.json();
  }

  static async updateProfile(vendorId: number, data: Partial<VendorProfile>): Promise<{ success: boolean; error?: string }> {
    const res = await fetch(`${API_BASE}/api/vendor-profile/${vendorId}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(data) });
    return res.json();
  }

  static async getMarketplaceListings(params: { category?: string; city?: string }): Promise<{ success: boolean; data?: any[]; error?: string }> {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    const res = await fetch(`${API_BASE}/api/marketplace?${query}`, { headers: getAuthHeaders() });
    return res.json();
  }
}
