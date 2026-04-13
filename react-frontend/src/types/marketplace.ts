// ── Blueprint ──
export type BlueprintStatus = 'draft' | 'published' | 'closed';
export type VendorCategory = 'venue' | 'photography' | 'catering' | 'decoration' | 'makeup' | 'entertainment';

export interface WeddingSummary {
  date: string;
  city: string;
  guest_count: number;
  budget: number;
  theme: string;
  events: string[];
  wedding_days?: number;
}

export interface CategorySpec {
  budget_allocated: number;
  requirements: Record<string, any>;
  notes: string;
}

export interface Blueprint {
  id: number;
  couple_id: number;
  title: string;
  status: BlueprintStatus;
  wedding_summary: WeddingSummary;
  category_specs: Record<VendorCategory, CategorySpec>;
  budget_breakdown: Record<VendorCategory, number>;
  timeline: any[];
  cost_saving_tips: string[];
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

// ── Quotes ──
export type QuoteStatus = 'submitted' | 'shortlisted' | 'accepted' | 'rejected' | 'withdrawn';

export interface Quote {
  id: number;
  blueprint_id: number;
  vendor_id: number;
  category: VendorCategory;
  category_pricing: Record<string, any>;
  package_price: number | null;
  package_description: string | null;
  total_estimated_price: number;
  inclusions: string;
  exclusions: string;
  payment_terms: string;
  valid_until: string;
  portfolio_links: string[];
  status: QuoteStatus;
  vendor_name?: string;
  vendor_rating?: number;
  vendor_experience?: number;
  created_at: string;
}

// ── Messaging ──
export interface Conversation {
  id: number;
  couple_id: number;
  vendor_id: number;
  blueprint_id: number | null;
  subject: string;
  status: 'active' | 'archived' | 'closed';
  other_party_name: string;
  other_party_category?: VendorCategory;
  last_message?: string;
  last_message_at?: string;
  unread_count: number;
  created_at: string;
}

export interface Message {
  id: number;
  conversation_id: number;
  sender_role: 'couple' | 'vendor' | 'system';
  sender_id: number;
  content: string;
  message_type: 'text' | 'quote_revision' | 'system';
  metadata?: Record<string, any>;
  read_at: string | null;
  created_at: string;
}

// ── RSVP ──
export interface WeddingEvent {
  id: number;
  couple_id: number;
  title: string;
  event_date: string;
  event_time: string;
  end_time: string;
  venue_name: string;
  venue_address: string;
  dress_code: string;
  meal_included: boolean;
}

export interface RSVPInvite {
  id: number;
  couple_id: number;
  event_id: number;
  invite_code: string;
  is_active: boolean;
  created_at: string;
}

export interface RSVPResponse {
  id: number;
  invite_code: string;
  event_id: number;
  guest_name: string;
  guest_email: string;
  attending: 'yes' | 'no' | 'maybe';
  plus_ones: number;
  dietary_notes: string;
  message: string;
  submitted_at: string;
}

// ── Timeline ──
export type TimelineEventType = 'ceremony' | 'reception' | 'rehearsal' | 'vendor_meeting' | 'deadline' | 'custom';

export interface TimelineEvent {
  id: number;
  couple_id: number;
  title: string;
  event_type: TimelineEventType;
  start_datetime: string;
  end_datetime: string;
  location: string;
  vendor_id: number | null;
  priority: 'high' | 'medium' | 'low';
  status: 'upcoming' | 'completed' | 'cancelled';
  color: string;
}

// ── Vendor Profile ──
export interface VendorProfile {
  id: number;
  name: string;
  category: VendorCategory;
  business_description: string;
  operating_cities: string[];
  services_offered: Array<{ name: string; base_price: number; price_unit: string }>;
  portfolio_images: Array<{ url: string; caption: string }>;
  years_experience: number;
  rating: number;
  approval_status: 'pending' | 'approved' | 'rejected';
  profile_completion: number;
  // FAQ key-value store — category-relevant attributes for semantic matching
  faq_data?: Record<string, string | number | boolean | string[]>;
}
