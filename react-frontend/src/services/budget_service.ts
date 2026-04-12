import { API_BASE, getAuthHeaders } from '../config/api_config';

export interface BudgetTransaction {
  id: number;
  couple_id: number;
  category: string;
  description: string;
  amount: number;
  type: 'expense' | 'income';
  date: string;
  created_at: string;
}

export class BudgetService {
  static async getTransactions(coupleId: number): Promise<{ success: boolean; data?: BudgetTransaction[]; error?: string }> {
    const params = new URLSearchParams({ couple_id: String(coupleId) });
    const res = await fetch(`${API_BASE}/api/budget-transactions?${params}`, { headers: getAuthHeaders() });
    return res.json();
  }

  static async createTransaction(data: { couple_id: number; category: string; description: string; amount: number; type: 'expense' | 'income' }): Promise<{ success: boolean; data?: BudgetTransaction; error?: string }> {
    const res = await fetch(`${API_BASE}/api/budget-transactions`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(data) });
    return res.json();
  }

  static async deleteTransaction(txId: number): Promise<{ success: boolean; error?: string }> {
    const res = await fetch(`${API_BASE}/api/budget-transactions/${txId}`, { method: 'DELETE', headers: getAuthHeaders() });
    return res.json();
  }
}
