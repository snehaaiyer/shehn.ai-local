import { API_BASE, getAuthHeaders } from '../config/api_config';
import { Quote, QuoteStatus } from '../types/marketplace';

export class QuoteService {
  static async getQuotesForBlueprint(blueprintId: number): Promise<{ success: boolean; data?: Quote[]; error?: string }> {
    const res = await fetch(`${API_BASE}/api/blueprints/${blueprintId}/quotes`, { headers: getAuthHeaders() });
    return res.json();
  }

  static async getQuoteCount(blueprintId: number): Promise<{ success: boolean; data?: { count: number }; error?: string }> {
    const res = await fetch(`${API_BASE}/api/blueprints/${blueprintId}/quotes/count`, { headers: getAuthHeaders() });
    return res.json();
  }

  static async submitQuote(blueprintId: number, quote: Partial<Quote>): Promise<{ success: boolean; data?: Quote; error?: string }> {
    const res = await fetch(`${API_BASE}/api/blueprints/${blueprintId}/quotes`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(quote) });
    return res.json();
  }

  static async updateQuoteStatus(quoteId: number, status: QuoteStatus): Promise<{ success: boolean; error?: string }> {
    const res = await fetch(`${API_BASE}/api/quotes/${quoteId}/status`, { method: 'PATCH', headers: getAuthHeaders(), body: JSON.stringify({ status }) });
    return res.json();
  }
}
