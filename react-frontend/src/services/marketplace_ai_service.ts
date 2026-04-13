import { API_BASE, getAuthHeaders } from '../config/api_config';
import { Quote, WeddingSummary, CategorySpec, VendorCategory } from '../types/marketplace';

export class MarketplaceAIService {
  // ── Couple-facing ──

  static async analyzeQuote(
    quote: Quote,
    budgetAllocated: number,
    weddingSummary: WeddingSummary
  ): Promise<{ success: boolean; data?: QuoteAnalysis; error?: string }> {
    const res = await fetch(`${API_BASE}/api/ai/analyze-quote`, {
      method: 'POST', headers: getAuthHeaders(),
      body: JSON.stringify({ quote, budget_allocated: budgetAllocated, category: quote.category, wedding_summary: weddingSummary })
    });
    return res.json();
  }

  static async matchVendors(
    quotes: Quote[],
    categorySpec: CategorySpec,
    budgetAllocated: number
  ): Promise<{ success: boolean; data?: VendorMatch[]; error?: string }> {
    const res = await fetch(`${API_BASE}/api/ai/match-vendors`, {
      method: 'POST', headers: getAuthHeaders(),
      body: JSON.stringify({ quotes, category_spec: categorySpec, budget_allocated: budgetAllocated })
    });
    return res.json();
  }

  static async optimizeBudget(
    budgetBreakdown: Record<string, number>,
    quotesByCategory: Record<string, Quote[]>,
    weddingSummary: WeddingSummary
  ): Promise<{ success: boolean; data?: BudgetOptimization; error?: string }> {
    const res = await fetch(`${API_BASE}/api/ai/optimize-budget`, {
      method: 'POST', headers: getAuthHeaders(),
      body: JSON.stringify({ budget_breakdown: budgetBreakdown, quotes_by_category: quotesByCategory, wedding_summary: weddingSummary })
    });
    return res.json();
  }

  static async suggestMessage(
    role: 'couple' | 'vendor',
    context: string,
    conversationHistory: Array<{ sender_role: string; content: string }>,
    quoteInfo?: Partial<Quote>
  ): Promise<{ success: boolean; data?: { message: string; tone: string }; error?: string }> {
    const res = await fetch(`${API_BASE}/api/ai/suggest-message`, {
      method: 'POST', headers: getAuthHeaders(),
      body: JSON.stringify({ role, context, conversation_history: conversationHistory, quote_info: quoteInfo || {} })
    });
    return res.json();
  }

  // ── Negotiation ──

  static async negotiateQuote(
    quoteId: number,
    role: 'couple' | 'vendor',
    message: string
  ): Promise<{ success: boolean; data?: NegotiationSuggestion; error?: string }> {
    const res = await fetch(`${API_BASE}/api/ai/negotiate-quote`, {
      method: 'POST', headers: getAuthHeaders(),
      body: JSON.stringify({ quote_id: quoteId, role, message })
    });
    return res.json();
  }

  // ── Vendor-facing ──

  static async getBidAssistance(
    category: VendorCategory,
    blueprintSummary: WeddingSummary,
    budgetAllocated: number,
    existingBidCount: number,
    vendorServices: Array<{ name: string; base_price: number }>
  ): Promise<{ success: boolean; data?: BidSuggestion; error?: string }> {
    const res = await fetch(`${API_BASE}/api/ai/bid-assistant`, {
      method: 'POST', headers: getAuthHeaders(),
      body: JSON.stringify({ category, blueprint_summary: blueprintSummary, budget_allocated: budgetAllocated, existing_bid_count: existingBidCount, vendor_services: vendorServices })
    });
    return res.json();
  }

  static async getListingInsights(
    category: VendorCategory,
    weddingSummary: WeddingSummary,
    categorySpec: CategorySpec,
    bidCount: number
  ): Promise<{ success: boolean; data?: ListingInsight; error?: string }> {
    const res = await fetch(`${API_BASE}/api/ai/listing-insights`, {
      method: 'POST', headers: getAuthHeaders(),
      body: JSON.stringify({ category, wedding_summary: weddingSummary, category_spec: categorySpec, bid_count: bidCount })
    });
    return res.json();
  }

  // ── Blueprint Generation ──

  static async generateBlueprint(preferences: {
    city: string;
    guest_count: number;
    budget: string;
    wedding_date: string;
    wedding_type: string;
    events: string[];
    priorities: string[];
    special_requirements?: string;
  }): Promise<{ success: boolean; data?: any; error?: string }> {
    const res = await fetch(`${API_BASE}/api/ai/generate-blueprint`, {
      method: 'POST', headers: getAuthHeaders(),
      body: JSON.stringify(preferences)
    });
    return res.json();
  }
}

// ── Types ──

export interface QuoteAnalysis {
  value_rating: 'good' | 'fair' | 'expensive';
  market_comparison: string;
  strengths: string[];
  concerns: string[];
  negotiation_tip: string;
  budget_impact: string;
}

export interface VendorMatch {
  vendor_name: string;
  match_score: number;
  reason: string;
}

export interface BudgetOptimization {
  suggestions: string[];
  recommended_reallocation: Record<string, number>;
  potential_savings: string;
  priority_spend: string;
}

export interface BidSuggestion {
  suggested_total: number;
  pricing_strategy: string;
  per_unit_suggestion: string;
  differentiators: string[];
  package_tip: string;
}

export interface ListingInsight {
  couple_priorities: string[];
  winning_approach: string;
  red_flags: string[];
  opportunity_score: string;
}

export interface NegotiationSuggestion {
  suggestion: string;
  talking_points: string[];
  revised_pricing: {
    adjusted_total: number | null;
    adjustment_reason: string;
    per_plate_change: number | null;
    added_inclusions: string[];
    removed_items: string[];
  };
  tone_advice: string;
}
