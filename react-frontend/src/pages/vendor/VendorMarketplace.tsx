import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Calendar, Users, IndianRupee, ChevronDown, ChevronUp, Flame,
  SlidersHorizontal, ArrowUpDown, X, Send, Loader2, Sparkles,
} from 'lucide-react';
import { VendorService } from '../../services/vendor_service';
import { QuoteService } from '../../services/quote_service';
import { MarketplaceAIService, BidSuggestion, ListingInsight } from '../../services/marketplace_ai_service';
import { useAppStore } from '../../store/useAppStore';
import { VendorProfile, VendorCategory, Quote } from '../../types/marketplace';
import { getThemeImage } from '../../config/theme_images';

// Lazy-import QuoteFormModal (created separately as a shared component)
let QuoteFormModal: React.FC<{
  blueprintId: number;
  category: VendorCategory;
  vendorId: number;
  onClose: () => void;
  onSubmitted: () => void;
}> | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  QuoteFormModal = require('../../components/QuoteFormModal').default;
} catch {
  // component not yet created — inline fallback below
}

const COMMON_CITIES = ['All Cities', 'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Kolkata', 'Pune', 'Jaipur', 'Lucknow', 'Goa'];
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'budget_desc', label: 'Budget High-Low' },
  { value: 'guests', label: 'Guest Count' },
];

const VendorMarketplace: React.FC = () => {
  const { currentUserId } = useAppStore();

  const [vendorProfile, setVendorProfile] = useState<VendorProfile | null>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedListing, setSelectedListing] = useState<any | null>(null);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [cityFilter, setCityFilter] = useState('All Cities');
  const [sortBy, setSortBy] = useState('newest');
  const [submitSuccess, setSubmitSuccess] = useState('');

  // AI state
  const [listingInsights, setListingInsights] = useState<Record<number, ListingInsight>>({});
  const [bidSuggestion, setBidSuggestion] = useState<BidSuggestion | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Load vendor profile first
  useEffect(() => {
    (async () => {
      try {
        const res = await VendorService.getProfile(currentUserId);
        if (res.success && res.data) setVendorProfile(res.data);
      } catch { /* ignore */ }
    })();
  }, [currentUserId]);

  // Load listings when profile or filters change
  const loadListings = useCallback(async () => {
    if (!vendorProfile) return;
    setLoading(true);
    try {
      const params: any = { category: vendorProfile.category };
      if (cityFilter !== 'All Cities') params.city = cityFilter;
      const res = await VendorService.getMarketplaceListings(params);
      if (res.success && res.data) {
        let sorted = [...res.data];
        if (sortBy === 'budget_desc') sorted.sort((a, b) => (b.wedding_summary?.budget || 0) - (a.wedding_summary?.budget || 0));
        else if (sortBy === 'guests') sorted.sort((a, b) => (b.wedding_summary?.guest_count || 0) - (a.wedding_summary?.guest_count || 0));
        setListings(sorted);
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [vendorProfile, cityFilter, sortBy]);

  useEffect(() => { loadListings(); }, [loadListings]);

  const vendorCategory = vendorProfile?.category || 'venue';
  const categoryLabel = vendorCategory.charAt(0).toUpperCase() + vendorCategory.slice(1);

  const toggleListing = (listing: any) => {
    setSelectedListing(selectedListing?.id === listing.id ? null : listing);
    setShowQuoteForm(false);
  };

  const handleQuoteSubmitted = () => {
    setShowQuoteForm(false);
    setSubmitSuccess('Quote submitted successfully!');
    setTimeout(() => setSubmitSuccess(''), 4000);
    loadListings();
  };

  // ── AI handlers ──
  const fetchListingInsights = async (listing: any) => {
    const lid = listing.id || listing.blueprint_id;
    if (listingInsights[lid]) return; // already fetched
    setAiLoading(true);
    try {
      const catSpec = listing.category_specs?.[vendorCategory];
      const res = await MarketplaceAIService.getListingInsights(
        vendorCategory as VendorCategory,
        listing.wedding_summary || {},
        catSpec || {},
        listing.bid_count || 0
      );
      if (res.success && res.data) {
        setListingInsights((prev) => ({ ...prev, [lid]: res.data! }));
      }
    } catch { /* ignore */ } finally {
      setAiLoading(false);
    }
  };

  const fetchBidSuggestion = async (listing: any) => {
    setBidSuggestion(null);
    setAiLoading(true);
    try {
      const catSpec = listing.category_specs?.[vendorCategory];
      const res = await MarketplaceAIService.getBidAssistance(
        vendorCategory as VendorCategory,
        listing.wedding_summary || {},
        catSpec?.budget_allocated || 0,
        listing.bid_count || 0,
        (vendorProfile as any)?.services || []
      );
      if (res.success && res.data) {
        setBidSuggestion(res.data);
      }
    } catch { /* ignore */ } finally {
      setAiLoading(false);
    }
  };

  // ── Quote templates from localStorage ──
  const getQuoteTemplates = (): Array<{ name: string; packagePrice: string; packageDesc: string; inclusions: string }> => {
    try {
      return JSON.parse(localStorage.getItem('vendorQuoteTemplates') || '[]');
    } catch { return []; }
  };

  const saveQuoteTemplate = (template: { name: string; packagePrice: string; packageDesc: string; inclusions: string }) => {
    const existing = getQuoteTemplates();
    existing.push(template);
    localStorage.setItem('vendorQuoteTemplates', JSON.stringify(existing));
  };

  // ── Inline simple quote form fallback when QuoteFormModal component not available ──
  const InlineQuoteForm: React.FC<{ listing: any }> = ({ listing }) => {
    const [packagePrice, setPackagePrice] = useState('');
    const [packageDesc, setPackageDesc] = useState('');
    const [inclusions, setInclusions] = useState('');
    const [validUntil, setValidUntil] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [aiPrefilling, setAiPrefilling] = useState(false);
    const [aiPrefilled, setAiPrefilled] = useState(false);
    const [templateSaved, setTemplateSaved] = useState(false);
    const templates = getQuoteTemplates();

    // Auto-trigger AI pre-fill when form opens
    React.useEffect(() => {
      const prefill = async () => {
        setAiPrefilling(true);
        try {
          const catSpec = listing.category_specs?.[vendorCategory];
          const res = await MarketplaceAIService.getBidAssistance(
            vendorCategory as VendorCategory,
            listing.wedding_summary || {},
            catSpec?.budget_allocated || 0,
            listing.bid_count || 0,
            (vendorProfile as any)?.services || []
          );
          if (res.success && res.data) {
            setPackagePrice(String(res.data.suggested_total));
            setPackageDesc(res.data.pricing_strategy || '');
            setInclusions(res.data.differentiators?.join(', ') || '');
            setAiPrefilled(true);
          }
        } catch { /* ignore */ } finally {
          setAiPrefilling(false);
        }
      };
      prefill();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const applyTemplate = (idx: number) => {
      const t = templates[idx];
      if (t) {
        setPackagePrice(t.packagePrice);
        setPackageDesc(t.packageDesc);
        setInclusions(t.inclusions);
      }
    };

    const submit = async () => {
      if (!packagePrice) return;
      setSubmitting(true);
      try {
        const blueprintId = listing.id || listing.blueprint_id;
        const res = await QuoteService.submitQuote(blueprintId, {
          vendor_id: currentUserId,
          category: vendorCategory as VendorCategory,
          package_price: Number(packagePrice),
          package_description: packageDesc,
          total_estimated_price: Number(packagePrice),
          inclusions,
          exclusions: '',
          payment_terms: '',
          valid_until: validUntil,
          portfolio_links: [],
        });
        if (res.success) {
          handleQuoteSubmitted();
        }
      } catch { /* ignore */ } finally {
        setSubmitting(false);
      }
    };

    const handleSaveTemplate = () => {
      const name = `Template ${templates.length + 1} — ${new Date().toLocaleDateString('en-IN')}`;
      saveQuoteTemplate({ name, packagePrice, packageDesc, inclusions });
      setTemplateSaved(true);
      setTimeout(() => setTemplateSaved(false), 3000);
    };

    return (
      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
        className="mt-4 rounded-xl border border-rose-200 bg-rose-50/50 p-5 space-y-4">
        <h4 className="font-semibold text-gray-800">Submit Your Quote</h4>

        {/* AI pre-fill note */}
        {aiPrefilling && (
          <div className="flex items-center gap-2 text-sm text-rose-600">
            <Loader2 className="h-4 w-4 animate-spin" /> AI is pre-filling your quote...
          </div>
        )}
        {aiPrefilled && !aiPrefilling && (
          <div className="flex items-center gap-2 text-xs text-rose-600 bg-rose-100/60 rounded-lg px-3 py-2 border border-rose-200">
            <Sparkles className="h-3.5 w-3.5" /> AI pre-filled based on listing requirements — edit as needed
          </div>
        )}

        {/* Template selector */}
        {templates.length > 0 && (
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500">Use Template:</label>
            <select onChange={(e) => applyTemplate(Number(e.target.value))} defaultValue=""
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs bg-white focus:ring-2 focus:ring-rose-300 outline-none">
              <option value="" disabled>Select a saved template</option>
              {templates.map((t, i) => <option key={i} value={i}>{t.name}</option>)}
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Package Price (&#8377;) *</label>
            <input type="number" value={packagePrice} onChange={(e) => setPackagePrice(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-rose-300 outline-none" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Valid Until</label>
            <input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-rose-300 outline-none" />
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Package Description</label>
          <textarea value={packageDesc} onChange={(e) => setPackageDesc(e.target.value)} rows={2}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-rose-300 outline-none resize-none" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Inclusions</label>
          <textarea value={inclusions} onChange={(e) => setInclusions(e.target.value)} rows={2}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-rose-300 outline-none resize-none" />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={handleSaveTemplate} disabled={!packagePrice}
              className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40">
              {templateSaved ? <><Sparkles className="h-3.5 w-3.5 text-rose-500" /> Saved!</> : 'Save as Template'}
            </button>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowQuoteForm(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
            <button onClick={submit} disabled={submitting || !packagePrice}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium shadow hover:shadow-md disabled:opacity-50">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {submitting ? 'Submitting...' : 'Submit Quote'}
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Wedding Marketplace — {categoryLabel}</h1>
        <p className="text-gray-500 text-sm mt-1">Browse published wedding blueprints and submit your quotes.</p>
      </div>

      {/* Success toast */}
      <AnimatePresence>
        {submitSuccess && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="rounded-lg bg-gray-50 border border-gray-200 p-3 text-gray-800 text-sm font-medium">
            {submitSuccess}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <SlidersHorizontal className="h-4 w-4" />
          <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-rose-300 outline-none">
            {COMMON_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <ArrowUpDown className="h-4 w-4" />
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-rose-300 outline-none">
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {/* Listings */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin h-8 w-8 border-4 border-rose-400 border-t-transparent rounded-full" />
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">No listings found for your category and filters.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {listings.map((listing) => {
            const summary = listing.wedding_summary || {};
            const catSpec = listing.category_specs?.[vendorCategory];
            const isExpanded = selectedListing?.id === listing.id;
            const bidCount = listing.bid_count || 0;

            return (
              <motion.div
                key={listing.id || listing.blueprint_id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden"
              >
                {/* Card header with theme image */}
                <button
                  onClick={() => toggleListing(listing)}
                  className="w-full text-left hover:bg-gray-50/50 transition"
                >
                  {/* Theme banner */}
                  <div className="relative h-28 overflow-hidden">
                    <img
                      src={getThemeImage(summary.theme)}
                      alt={summary.theme || 'Wedding'}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = '/classic contemporary.png'; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 to-transparent" />
                    <div className="absolute bottom-2 left-4 text-white">
                      <span className="text-xs font-medium opacity-80 capitalize">{summary.theme || 'Classic'} Theme</span>
                    </div>
                  </div>
                  <div className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4 text-gray-400" /> {summary.city || 'N/A'}</span>
                      <span className="inline-flex items-center gap-1"><Calendar className="h-4 w-4 text-gray-400" /> {summary.date || 'TBD'}</span>
                      <span className="inline-flex items-center gap-1"><Users className="h-4 w-4 text-gray-400" /> {summary.guest_count || '?'} guests</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {bidCount > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 bg-rose-50 rounded-full px-2.5 py-1">
                          <Flame className="h-3.5 w-3.5" /> {bidCount} vendors quoted
                        </span>
                      )}
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
                    <span className="inline-flex items-center gap-1 text-gray-700">
                      <IndianRupee className="h-3.5 w-3.5" />
                      Budget: {summary.budget ? `${(summary.budget / 100000).toFixed(1)}L` : 'N/A'}
                    </span>
                    {summary.theme && (
                      <span className="text-gray-500">Theme: {summary.theme}</span>
                    )}
                  </div>

                  {/* Category-specific snippet */}
                  {catSpec && (
                    <div className="mt-3 border-t border-gray-100 pt-3">
                      <p className="text-xs font-semibold text-rose-600 uppercase tracking-wide mb-1">
                        Your Category — {categoryLabel}
                      </p>
                      <p className="text-sm text-gray-600 line-clamp-2">{catSpec.notes || JSON.stringify(catSpec.requirements).slice(0, 120)}</p>
                      {catSpec.budget_allocated > 0 && (
                        <p className="text-xs text-gray-400 mt-1">
                          Category budget: <span className="font-medium text-gray-600">&#8377;{catSpec.budget_allocated.toLocaleString('en-IN')}</span>
                        </p>
                      )}
                    </div>
                  )}
                  </div>
                </button>

                {/* Expanded detail */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-gray-100"
                    >
                      <div className="p-5 space-y-4">
                        {/* Full wedding summary */}
                        <div>
                          <h3 className="text-sm font-semibold text-gray-700 mb-2">Wedding Summary</h3>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm text-gray-600">
                            <div><span className="text-gray-400 text-xs block">Date</span>{summary.date || 'TBD'}</div>
                            <div><span className="text-gray-400 text-xs block">City</span>{summary.city || 'N/A'}</div>
                            <div><span className="text-gray-400 text-xs block">Guests</span>{summary.guest_count || '?'}</div>
                            <div><span className="text-gray-400 text-xs block">Total Budget</span>&#8377;{summary.budget?.toLocaleString('en-IN') || 'N/A'}</div>
                          </div>
                          {summary.events?.length > 0 && (
                            <div className="mt-2">
                              <span className="text-gray-400 text-xs">Events: </span>
                              <span className="text-sm text-gray-600">{summary.events.join(', ')}</span>
                            </div>
                          )}
                        </div>

                        {/* Full category requirements */}
                        {catSpec && (
                          <div>
                            <h3 className="text-sm font-semibold text-gray-700 mb-2">{categoryLabel} Requirements</h3>
                            {catSpec.notes && <p className="text-sm text-gray-600 mb-2">{catSpec.notes}</p>}
                            {Object.keys(catSpec.requirements || {}).length > 0 && (
                              <ul className="space-y-1">
                                {Object.entries(catSpec.requirements).map(([k, v]) => (
                                  <li key={k} className="text-sm text-gray-600">
                                    <span className="font-medium text-gray-700">{k}:</span> {String(v)}
                                  </li>
                                ))}
                              </ul>
                            )}
                            {catSpec.budget_allocated > 0 && (
                              <p className="mt-2 text-sm font-medium text-gray-700">
                                Allocated budget: &#8377;{catSpec.budget_allocated.toLocaleString('en-IN')}
                              </p>
                            )}
                          </div>
                        )}

                        {/* AI Listing Insights */}
                        <div>
                          {!listingInsights[listing.id || listing.blueprint_id] ? (
                            <button
                              onClick={() => fetchListingInsights(listing)}
                              disabled={aiLoading}
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 text-sm font-medium hover:bg-gray-100 transition disabled:opacity-50"
                            >
                              {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                              AI Insights
                            </button>
                          ) : (
                            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                                  <Sparkles className="h-4 w-4" /> AI Insights
                                </h4>
                                {(() => {
                                  const score = listingInsights[listing.id || listing.blueprint_id].opportunity_score?.toLowerCase() || '';
                                  const color = score.includes('high') ? 'bg-gray-100 text-gray-700' : score.includes('medium') ? 'bg-rose-50 text-rose-600' : 'bg-rose-100 text-rose-700';
                                  return <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${color}`}>{listingInsights[listing.id || listing.blueprint_id].opportunity_score}</span>;
                                })()}
                              </div>
                              {listingInsights[listing.id || listing.blueprint_id].couple_priorities?.length > 0 && (
                                <div>
                                  <p className="text-xs text-gray-500 mb-1">Couple Priorities</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {listingInsights[listing.id || listing.blueprint_id].couple_priorities.map((p, i) => (
                                      <span key={i} className="text-xs bg-white border border-gray-200 text-gray-700 px-2 py-0.5 rounded-full">{p}</span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {listingInsights[listing.id || listing.blueprint_id].winning_approach && (
                                <div className="rounded-lg bg-white/70 border border-gray-200 p-3">
                                  <p className="text-xs font-semibold text-gray-700 mb-0.5">Winning Approach</p>
                                  <p className="text-sm text-gray-700">{listingInsights[listing.id || listing.blueprint_id].winning_approach}</p>
                                </div>
                              )}
                              {listingInsights[listing.id || listing.blueprint_id].red_flags?.length > 0 && (
                                <div>
                                  <p className="text-xs font-semibold text-rose-600 mb-0.5">Red Flags</p>
                                  <ul className="space-y-0.5">
                                    {listingInsights[listing.id || listing.blueprint_id].red_flags.map((rf, i) => (
                                      <li key={i} className="text-sm text-rose-600">{rf}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Submit Quote button + AI Bid Assistant */}
                        {!showQuoteForm && (
                          <div className="flex flex-wrap items-center gap-3">
                            <button
                              onClick={() => setShowQuoteForm(true)}
                              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-medium shadow hover:shadow-md transition"
                            >
                              <Send className="h-4 w-4" /> Submit Quote
                            </button>
                            <button
                              onClick={() => fetchBidSuggestion(listing)}
                              disabled={aiLoading}
                              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 font-medium hover:bg-gray-100 transition disabled:opacity-50"
                            >
                              {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                              AI Suggest Pricing
                            </button>
                          </div>
                        )}

                        {/* AI Bid Suggestion */}
                        {bidSuggestion && !showQuoteForm && (
                          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                            className="rounded-xl border border-gray-200 bg-gray-50 p-5 space-y-3">
                            <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                              <Sparkles className="h-4 w-4" /> AI Pricing Suggestion
                            </h4>
                            <p className="text-2xl font-bold text-gray-900">&#8377;{bidSuggestion.suggested_total.toLocaleString('en-IN')}</p>
                            <p className="text-sm text-gray-700">{bidSuggestion.pricing_strategy}</p>
                            <p className="text-sm text-gray-600"><span className="font-medium">Per-unit:</span> {bidSuggestion.per_unit_suggestion}</p>
                            {bidSuggestion.differentiators?.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-gray-500 mb-1">Differentiators</p>
                                <ul className="space-y-1">
                                  {bidSuggestion.differentiators.map((d, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                      <span className="text-gray-400 mt-0.5">&#10003;</span> {d}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {bidSuggestion.package_tip && (
                              <div className="rounded-lg bg-rose-50 border border-rose-200 p-3">
                                <p className="text-xs font-semibold text-rose-700 mb-0.5">Package Tip</p>
                                <p className="text-sm text-gray-800">{bidSuggestion.package_tip}</p>
                              </div>
                            )}
                          </motion.div>
                        )}

                        {/* Quote form */}
                        <AnimatePresence>
                          {showQuoteForm && (
                            QuoteFormModal ? (
                              <QuoteFormModal
                                blueprintId={listing.id || listing.blueprint_id}
                                category={vendorCategory as VendorCategory}
                                vendorId={currentUserId}
                                onClose={() => setShowQuoteForm(false)}
                                onSubmitted={handleQuoteSubmitted}
                              />
                            ) : (
                              <InlineQuoteForm listing={listing} />
                            )
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default VendorMarketplace;
