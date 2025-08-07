import React from 'react';

export interface WeddingData {
  id?: string;
  yourName: string;
  partnerName: string;
  weddingDate: string;
  location: string;
  phoneNumber?: string;
  email?: string;
  budget?: number;
  guestCount?: number;
}

export interface WeddingPreferences {
  weddingTheme: string;
  photographyStyle: string;
  venueType: string;
  decorStyle: string;
  cuisineStyle?: string;
  floralStyle?: string;
  lightingStyle?: string;
  furnitureStyle?: string;
  musicPreferences?: string[];
  entertainmentPreferences?: string[];
  priorities?: string[];
  specialRequirements?: string;
  dateFlexibility?: string;
  season?: string;
}

export interface Vendor {
  id: string;
  name: string;
  category: string;
  location: string;
  phone?: string;
  email?: string;
  website?: string;
  rating: number;
  description?: string;
  images?: string[];
  price_range?: string;
  services?: string[];
  contact_score?: number;
  match_score?: number;
}

export interface BudgetAllocation {
  category: string;
  amount: number;
  percentage: number;
  spent: number;
  remaining: number;
}

export interface StatsCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  gradient?: boolean;
}

export interface SectionCardProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export interface ProgressRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export interface TimelineItem {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed';
  date?: string;
}

export interface VendorCategory {
  id: string;
  name: string;
  icon: string;
  count: number;
  vendors: Vendor[];
} 