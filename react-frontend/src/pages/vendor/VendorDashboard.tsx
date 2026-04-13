import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Gavel, CheckCircle, ListFilter, MessageSquare, ChevronRight, MapPin,
  Calendar, Users, IndianRupee, Clock, AlertTriangle, Lightbulb, Send, Sparkles, Star,
} from 'lucide-react';
import { VendorService } from '../../services/vendor_service';
import { QuoteService } from '../../services/quote_service';
import { MessagingService } from '../../services/messaging_service';
import { useAppStore } from '../../store/useAppStore';
import { VendorProfile, Quote, Conversation } from '../../types/marketplace';
import { getThemeImage } from '../../config/theme_images';

const VendorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { currentUserId, currentRole, unreadMessageCount } = useAppStore();

  const [vendorProfile, setVendorProfile] = useState<VendorProfile | null>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [vendorQuotes, setVendorQuotes] = useState<Quote[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [profileRes, quotesRes, convoRes] = await Promise.all([
          VendorService.getProfile(currentUserId),
          QuoteService.getVendorQuotes(currentUserId),
          MessagingService.getConversations({ vendor_id: currentUserId }),
        ]);

        if (profileRes.success && profileRes.data) {
          setVendorProfile(profileRes.data);
          const listRes = await VendorService.getMarketplaceListings({ category: profileRes.data.category });
          if (listRes.success && listRes.data) {
            setListings(listRes.data.slice(0, 5));
          }
        }
        if (quotesRes.success && quotesRes.data) {
          setVendorQuotes(quotesRes.data);
        }
        if (convoRes.success && convoRes.data) {
          setConversations(convoRes.data);
        }
      } catch {
        // profile load failed
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [currentUserId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-rose-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!vendorProfile || vendorProfile.approval_status === 'pending') {
    return (
      <div className="max-w-3xl mx-auto mt-12 px-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center">
          <AlertTriangle className="h-10 w-10 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-rose-800 mb-2">Awaiting Approval</h2>
          <p className="text-rose-700">Your vendor profile is currently under review. You will be notified once it is approved.</p>
        </motion.div>
      </div>
    );
  }

  const shortlistedQuotes = vendorQuotes.filter((q) => q.status === 'shortlisted');
  const acceptedQuotes = vendorQuotes.filter((q) => q.status === 'accepted');
  const activeQuotes = vendorQuotes.filter((q) => q.status === 'submitted');
  const unreadConvos = conversations.filter((c) => (c.unread_count || 0) > 0).length;

  const stats = [
    { label: 'Shortlisted', value: shortlistedQuotes.length, icon: Star, color: 'bg-amber-50 text-amber-600' },
    { label: 'Accepted Quotes', value: acceptedQuotes.length, icon: CheckCircle, color: 'bg-gray-100 text-gray-700' },
    { label: 'Active Bids', value: activeQuotes.length, icon: Gavel, color: 'bg-rose-50 text-rose-600' },
    { label: 'Conversations', value: conversations.length, icon: MessageSquare, color: 'bg-gray-100 text-gray-700' },
  ];

  // Category-specific business tips
  const CATEGORY_TIPS: Record<string, string[]> = {
    photography: [
      'Winter wedding season peaks in Nov-Feb — update your portfolio with recent work.',
      'Offering pre-wedding shoot packages can increase bookings by 40%.',
      'Couples value candid shots — highlight your photojournalistic style.',
      'Quick response to inquiries doubles your conversion rate.',
    ],
    venue: [
      'Offer virtual venue tours to attract out-of-city couples.',
      'Flexible date pricing (weekday discounts) fills off-peak slots faster.',
      'Couples love all-inclusive packages — bundle catering and decor.',
      'Highlight unique spaces like terraces and gardens for intimate events.',
    ],
    catering: [
      'Regional cuisine specialization helps you stand out in your city.',
      'Offering tasting sessions converts 60% more inquiries into bookings.',
      'Couples increasingly request live counters — add them to your menu.',
      'Highlight dietary accommodations (Jain, vegan, halal) in your profile.',
    ],
    decoration: [
      'Trending: sustainable and reusable decor — highlight eco-friendly options.',
      'Theme mood boards in your portfolio help couples visualize your work.',
      'Offer package tiers (essential, premium, luxury) for different budgets.',
      'Quick turnaround on decor proposals wins more bids.',
    ],
    makeup: [
      'Before/after portfolio shots dramatically increase inquiry rates.',
      'Offering bridal trial sessions builds trust and drives conversions.',
      'Airbrush and HD makeup are trending — mention if you offer them.',
      'Family package add-ons (bridesmaids, mother of bride) boost revenue.',
    ],
    entertainment: [
      'Video clips of live performances convert much better than photos alone.',
      'Customizable setlists for sangeet, mehendi, and reception appeal to couples.',
      'Offering emcee services alongside music creates a premium package.',
      'Early booking discounts for peak season dates fill your calendar faster.',
    ],
  };

  const vendorTips = CATEGORY_TIPS[vendorProfile.category] || CATEGORY_TIPS.photography!;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Welcome header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome, {vendorProfile.name}!
        </h1>
        <p className="text-gray-500 mt-1">Here is what is happening in your marketplace.</p>
      </motion.div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl border border-gray-100 bg-white shadow-sm p-5"
            >
              <div className={`inline-flex items-center justify-center h-9 w-9 rounded-lg ${s.color} mb-3`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-sm text-gray-500">{s.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Shortlisted Quotes — high priority */}
      {shortlistedQuotes.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-500" /> Shortlisted by Couples
            </h2>
            <button onClick={() => navigate('/vendor/inbox')} className="text-sm text-rose-600 hover:underline flex items-center gap-1">
              Open Inbox <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {shortlistedQuotes.map((q) => (
              <motion.div
                key={q.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-xl border-2 border-amber-200 bg-amber-50/50 shadow-sm p-4 hover:shadow-md transition cursor-pointer"
                onClick={() => navigate('/vendor/inbox')}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full uppercase">
                    ⭐ Shortlisted
                  </span>
                  <span className="text-xs text-gray-400">{new Date(q.created_at).toLocaleDateString('en-IN')}</span>
                </div>
                <p className="text-sm font-medium text-gray-900 mb-1">
                  {q.category.charAt(0).toUpperCase() + q.category.slice(1)} Quote
                </p>
                <p className="text-lg font-bold text-gray-900">
                  ₹{q.total_estimated_price?.toLocaleString('en-IN') || q.package_price?.toLocaleString('en-IN') || '—'}
                </p>
                <p className="text-xs text-gray-500 mt-2 line-clamp-2">{q.inclusions || q.package_description || 'View details in inbox'}</p>
                <div className="mt-3 flex items-center gap-1 text-xs text-rose-600 font-medium">
                  <MessageSquare className="h-3.5 w-3.5" /> Respond to couple →
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Recent Marketplace Listings */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Marketplace Listings</h2>
          <button onClick={() => navigate('/vendor/marketplace')} className="text-sm text-rose-600 hover:underline flex items-center gap-1">
            View all <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {listings.length === 0 ? (
          <p className="text-gray-400 text-sm">No listings matching your category yet.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {listings.map((l: any) => (
              <motion.div
                key={l.id || l.blueprint_id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden hover:shadow-md transition cursor-pointer"
                onClick={() => navigate('/vendor/marketplace')}
              >
                <div className="relative h-24 overflow-hidden">
                  <img
                    src={getThemeImage(l.wedding_summary?.theme)}
                    alt={l.wedding_summary?.theme || 'Wedding'}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/classic contemporary.png'; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900/50 to-transparent" />
                  <div className="absolute bottom-2 left-3 text-white text-xs font-medium capitalize opacity-90">
                    {l.wedding_summary?.theme || 'Classic'} Theme
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-3 text-sm text-gray-500 mb-2">
                    <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {l.wedding_summary?.city || l.city || 'N/A'}</span>
                    <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {l.wedding_summary?.date || l.date || 'TBD'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-500 mb-3">
                    <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {l.wedding_summary?.guest_count || l.guest_count || '?'} guests</span>
                    {l.budget_allocated > 0 && (
                      <span className="inline-flex items-center gap-1"><IndianRupee className="h-3.5 w-3.5" /> Category: ₹{(l.budget_allocated / 100000).toFixed(1)}L</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 line-clamp-2 mb-3">
                    {l.category_specs?.[vendorProfile.category]?.notes || 'View requirements'}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 font-medium">{l.bid_count || 0} vendors quoted</span>
                    <span className="text-xs text-rose-600 font-semibold flex items-center gap-1">
                      View & Quote <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Quick Quote */}
      {listings.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Quote</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {listings.slice(0, 2).map((l: any) => (
              <div key={l.id || l.blueprint_id} className="rounded-xl border border-gray-100 bg-white shadow-sm p-4">
                <div className="flex items-center gap-3 text-sm text-gray-500 mb-2">
                  <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {l.wedding_summary?.city || 'N/A'}</span>
                  <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {l.wedding_summary?.guest_count || '?'} guests</span>
                  {l.budget_allocated > 0 && (
                    <span className="inline-flex items-center gap-1"><IndianRupee className="h-3.5 w-3.5" /> Category: ₹{(l.budget_allocated / 100000).toFixed(1)}L</span>
                  )}
                </div>
                <p className="text-xs text-gray-400 line-clamp-2 mb-3">
                  {l.category_specs?.[vendorProfile.category]?.notes || 'View listing requirements'}
                </p>
                <button onClick={() => navigate('/vendor/marketplace')}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium shadow-sm transition">
                  <Send className="h-3.5 w-3.5" /> Quick Bid
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* AI Business Tips */}
      <section>
        <div className="rounded-xl border border-gray-100 bg-gradient-to-br from-gray-50 to-rose-50/30 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-rose-500" /> AI Business Tips
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            {vendorTips.map((tip, i) => (
              <div key={i} className="flex items-start gap-3 bg-white rounded-lg p-3 border border-gray-100">
                <Sparkles className="h-4 w-4 text-rose-400 mt-0.5 shrink-0" />
                <p className="text-sm text-gray-700">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Messages */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Messages</h2>
          <button onClick={() => navigate('/vendor/inbox')} className="text-sm text-rose-600 hover:underline flex items-center gap-1">
            View all messages <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        {conversations.length > 0 ? (
          <div className="space-y-2">
            {conversations.slice(0, 3).map((c) => (
              <div
                key={c.id}
                onClick={() => navigate('/vendor/inbox')}
                className="rounded-xl border border-gray-100 bg-white shadow-sm p-4 hover:bg-gray-50 transition cursor-pointer flex items-center gap-3"
              >
                <div className="h-9 w-9 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 font-bold text-sm shrink-0">
                  {(c.other_party_name || c.subject || 'C').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 truncate">{c.subject || c.other_party_name || 'Conversation'}</p>
                    {c.last_message_at && (
                      <span className="text-xs text-gray-400 shrink-0 ml-2">
                        {new Date(c.last_message_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate">{c.last_message || 'Start chatting...'}</p>
                </div>
                {(c.unread_count || 0) > 0 && (
                  <span className="h-5 w-5 rounded-full bg-rose-500 text-white text-xs flex items-center justify-center shrink-0">
                    {c.unread_count}
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-gray-100 bg-white shadow-sm p-6 text-center text-gray-400 text-sm">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            No conversations yet. Shortlisted quotes will appear here.
            <br />
            <button onClick={() => navigate('/vendor/inbox')} className="mt-2 text-rose-600 hover:underline text-sm">
              Open Inbox
            </button>
          </div>
        )}
      </section>
    </div>
  );
};

export default VendorDashboard;
