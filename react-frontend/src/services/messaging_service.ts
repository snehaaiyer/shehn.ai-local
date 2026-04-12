import { API_BASE, getAuthHeaders } from '../config/api_config';
import { Conversation, Message } from '../types/marketplace';

export class MessagingService {
  static async createConversation(data: {
    couple_id: number;
    vendor_id: number;
    blueprint_id?: number;
    subject: string;
    initial_message: string;
  }): Promise<{ success: boolean; data?: Conversation; error?: string }> {
    const res = await fetch(`${API_BASE}/api/conversations`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(data) });
    return res.json();
  }

  static async getConversations(params: { couple_id?: number; vendor_id?: number }): Promise<{ success: boolean; data?: Conversation[]; error?: string }> {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    const res = await fetch(`${API_BASE}/api/conversations?${query}`, { headers: getAuthHeaders() });
    return res.json();
  }

  static async getConversation(id: number): Promise<{ success: boolean; data?: { conversation: Conversation; messages: Message[] }; error?: string }> {
    const res = await fetch(`${API_BASE}/api/conversations/${id}`, { headers: getAuthHeaders() });
    return res.json();
  }

  static async sendMessage(conversationId: number, msg: {
    sender_role: string;
    sender_id: number;
    content: string;
    message_type?: string;
    metadata?: Record<string, any>;
  }): Promise<{ success: boolean; data?: Message; error?: string }> {
    const res = await fetch(`${API_BASE}/api/conversations/${conversationId}/messages`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(msg) });
    return res.json();
  }

  static async markAsRead(messageId: number): Promise<{ success: boolean; error?: string }> {
    const res = await fetch(`${API_BASE}/api/messages/${messageId}/read`, { method: 'PATCH', headers: getAuthHeaders() });
    return res.json();
  }
}
