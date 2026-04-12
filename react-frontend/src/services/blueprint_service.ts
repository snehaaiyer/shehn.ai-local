import { API_BASE, getAuthHeaders } from '../config/api_config';
import { Blueprint } from '../types/marketplace';

export class BlueprintService {
  static async createBlueprint(data: Partial<Blueprint>): Promise<{ success: boolean; data?: Blueprint; error?: string }> {
    const res = await fetch(`${API_BASE}/api/blueprints`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(data) });
    return res.json();
  }

  static async getBlueprint(id: number): Promise<{ success: boolean; data?: Blueprint; error?: string }> {
    const res = await fetch(`${API_BASE}/api/blueprints/${id}`, { headers: getAuthHeaders() });
    return res.json();
  }

  static async updateBlueprint(id: number, data: Partial<Blueprint>): Promise<{ success: boolean; error?: string }> {
    const res = await fetch(`${API_BASE}/api/blueprints/${id}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(data) });
    return res.json();
  }

  static async publishBlueprint(id: number): Promise<{ success: boolean; error?: string }> {
    const res = await fetch(`${API_BASE}/api/blueprints/${id}/publish`, { method: 'PATCH', headers: getAuthHeaders() });
    return res.json();
  }

  static async unpublishBlueprint(id: number): Promise<{ success: boolean; error?: string }> {
    const res = await fetch(`${API_BASE}/api/blueprints/${id}/unpublish`, { method: 'PATCH', headers: getAuthHeaders() });
    return res.json();
  }
}
