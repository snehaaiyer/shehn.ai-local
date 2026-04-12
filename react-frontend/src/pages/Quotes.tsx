import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Inbox, Building2, Camera, UtensilsCrossed, Flower2,
  Sparkles, Music, Filter, SortAsc, ArrowUpDown
} from 'lucide-react';
import { QuoteService } from '../services/quote_service';
import { MessagingService } from '../services/messaging_service';
import { MarketplaceAIService, QuoteAnalysis, VendorMatch } from '../services/marketplace_ai_service';
import { Quote, VendorCategory, QuoteStatus } from '../types/marketplace';
import { useAppStore } from '../store/useAppStore';
import QuoteCard from '../components/QuoteCard';
import PlanningJourney from '../components/PlanningJourney';

// ── Constants ──

const ALL_CATEGORIES: Array<{ key: VendorCategory | 'all'; label: string; icon: React.ElementType }> = [
  { key: 'all', label: 'All', icon: Filter },
  { key: 'venue', label: 'Venue', icon: Building2 },
  { key: 'photography', label: 'Photography', icon: Camera },
  { key: 'catering', label: 'Catering', icon: UtensilsCrossed },
  { key: 'decoration', label: 'Decoration', icon: Flower2 },
  { key: 'makeup', label: 'Makeup', icon: Sparkles },
  { key: 'entertainment', label: 'Entertainment', icon: Music },
];

type SortKey = 'newest' | 'price_low' | 'price_high' | 'rating';

const SORT_OPTIONS: Array<{ key: SortKey; label: string }> = [
  { key: 'newest', label: 'Newest first' },
  { key: 'price_low', label: 'Price: Low to High' },
  { key: 'price_high', label: 'Price: High to Low' },
  { key: 'rating', label: 'Highest rated' },
];

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

// ── Component ──

const Quotes: React.FC = () => {
  const navigate = useNavigate();
  const blueprintId = useAppStore((s) => s.blueprintId);
  const currentUserId = useAppStore((s) => s.currentUserId);

  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<VendorCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortKey>('newest');
  const [showSort, setShowSort] = useState(false);

  // Budget by category (loaded alongside quotes or defaulted)
  const [budgetByCategory, setBudgetByCategory] = useState<Record<VendorCategory, number>>({
    venue: 0,
    photography: 0,
    catering: 0,
    decoration: 0,
    makeup: 0,
    entertainment: 0,
  });

  // AI state
  const [aiAnalysis, setAiAnalysis] = useState<Record<number, QuoteAnalysis>>({});
  const [vendorRankings, setVendorRankings] = useState<VendorMatch[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [showRankings, setShowRankings] = useState(false);
  const [analyzingQuoteId, setAnalyzingQuoteId] = useState<number | null>(null);

  // Inline toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  }, []);

  // ── Load quotes ──
  useEffect(() => {
    if (!blueprintId) {
      setLoading(false);
      return;
    }
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const res = await QuoteService.getQuotesForBlueprint(blueprintId);
        if (!cancelled && res.success && res.data) {
          setQuotes(res.data);
        }
      } catch {
        // silently handle
      }
      if (!cancelled) setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [blueprintId]);

  // Try to load budget from blueprint
  useEffect(() => {
    if (!blueprintId) return;
    let cancelled = false;

    (async () => {
      try {
        // Use dynamic import to avoid circular deps -- BlueprintService is lightweight
        const { BlueprintService } = await import('../services/blueprint_service');
        const res = await BlueprintService.getBlueprint(blueprintId);
        if (!cancelled && res.success && res.data?.budget_breakdown) {
          setBudgetByCategory((prev) => ({ ...prev, ...res.data!.budget_breakdown }));
        }
      } catch {
        // keep defaults
      }
    })();

    return () => { cancelled = true; };
  }, [blueprintId]);

  // ── Filter & sort ──
  const filteredQuotes = quotes
    .filter((q) => activeCategory === 'all' || q.category === activeCategory)
    .sort((a, b) => {
      switch (sortBy) {
        case 'price_low':
          return a.total_estimated_price - b.total_estimated_price;
        case 'price_high':
          return b.total_estimated_price - a.total_estimated_price;
        case 'rating':
          return (b.vendor_rating ?? 0) - (a.vendor_rating ?? 0);
        case 'newest':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  // Category counts
  const countByCategory = quotes.reduce<Record<string, number>>((acc, q) => {
    acc[q.category] = (acc[q.category] || 0) + 1;
    return acc;
  }, {});

  // ── Actions ──
  const handleAction = useCallback(async (quoteId: number, status: QuoteStatus) => {
    try {
      const res = await QuoteService.updateQuoteStatus(quoteId, status);
      if (res.success) {
        setQuotes((prev) => prev.map((q) => (q.id === quoteId ? { ...q, status } : q)));
        const labels: Record<string, string> = {
          shortlisted: 'Quote shortlisted',
          accepted: 'Quote accepted',
          rejected: 'Quote rejected',
        };
        showToast(labels[status] || 'Updated');
      }
    } catch {
      showToast('Failed to update quote');
    }
  }, [showToast]);

  const handleChat = useCallback(async (quote: Quote) => {
    if (!blueprintId) return;
    try {
      await MessagingService.createConversation({
        couple_id: currentUserId,
        vendor_id: quote.vendor_id,
        blueprint_id: blueprintId,
        subject: 'Re: Quote',
        initial_message: "Hi, I'd like to discuss your quote.",
      });
      navigate('/messages');
    } catch {
      showToast('Failed to start conversation');
    }
  }, [blueprintId, currentUserId, navigate, showToast]);

  // ── AI Actions ──
  const handleAnalyzeQuote = useCallback(async (quote: Quote) => {
    if (aiAnalysis[quote.id]) {
      // Toggle off if already analyzed
      setAiAnalysis((prev) => { const next = { ...prev }; delete next[quote.id]; return next; });
      return;
    }
    setAnalyzingQuoteId(quote.id);
    try {
      const res = await MarketplaceAIService.analyzeQuote(
        quote,
        budgetByCategory[quote.category] ?? 0,
        { city: '', guest_count: 0, budget: 0, date: '', theme: '', events: [] }
      );
      if (res.success && res.data) {
        setAiAnalysis((prev) => ({ ...prev, [quote.id]: res.data! }));
      } else {
        showToast(res.error || 'AI analysis failed');
      }
    } catch {
      showToast('AI analysis failed');
    }
    setAnalyzingQuoteId(null);
  }, [aiAnalysis, budgetByCategory, showToast]);

  const handleRankVendors = useCallback(async () => {
    const categoryQuotes = activeCategory === 'all' ? filteredQuotes : filteredQuotes.filter((q) => q.category === activeCategory);
    if (categoryQuotes.length === 0) { showToast('No quotes to rank'); return; }
    setAiLoading(true);
    setShowRankings(true);
    try {
      const cat = activeCategory === 'all' ? categoryQuotes[0].category : activeCategory;
      const res = await MarketplaceAIService.matchVendors(
        categoryQuotes,
        { budget_allocated: budgetByCategory[cat] ?? 0, requirements: {}, notes: '' },
        budgetByCategory[cat] ?? 0
      );
      if (res.success && res.data) {
        setVendorRankings(res.data);
      } else {
        showToast(res.error || 'AI ranking failed');
      }
    } catch {
      showToast('AI ranking failed');
    }
    setAiLoading(false);
  }, [activeCategory, filteredQuotes, budgetByCategory, showToast]);

  // ── Render ──

  if (!blueprintId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center max-w-md">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-800 mb-2">No blueprint found</h2>
          <p className="text-sm text-gray-500 mb-4">Create and publish a blueprint to start receiving vendor quotes.</p>
          <a
            href="/preferences"
            className="inline-block px-5 py-2 rounded-lg bg-rose-500 text-white text-sm font-medium hover:bg-rose-600 transition-colors"
          >
            Go to Preferences
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Planning Journey */}
      <PlanningJourney compact />

      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-6 right-6 z-50 bg-gray-900 text-white text-sm px-4 py-2 rounded-lg shadow-lg">
          {toastMsg}
        </div>
      )}

      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Incoming Quotes</h1>
          <p className="text-sm text-gray-500 mt-1">
            {quotes.length} {quotes.length === 1 ? 'quote' : 'quotes'} received
          </p>
        </div>
        {/* AI Rank + Sort */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleRankVendors}
            disabled={aiLoading}
            className="flex items-center gap-1.5 text-sm font-medium text-rose-600 border border-rose-200 rounded-lg px-3 py-1.5 hover:bg-rose-50 transition-colors disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {aiLoading ? 'Ranking...' : 'AI Rank Vendors'}
          </button>
        <div className="relative">
          <button
            onClick={() => setShowSort(!showSort)}
            className="flex items-center gap-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            {SORT_OPTIONS.find((o) => o.key === sortBy)?.label}
          </button>
          {showSort && (
            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[180px]">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => { setSortBy(opt.key); setShowSort(false); }}
                  className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${sortBy === opt.key ? 'text-rose-600 font-medium' : 'text-gray-700'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
        </div>
      </motion.div>

      {/* ── AI Vendor Rankings Panel ── */}
      <AnimatePresence>
        {showRankings && vendorRankings.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-xl border border-rose-100 shadow-sm p-4 overflow-hidden"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-rose-500" /> AI Vendor Rankings
              </h3>
              <button onClick={() => setShowRankings(false)} className="text-xs text-gray-400 hover:text-gray-600">Dismiss</button>
            </div>
            <div className="space-y-2">
              {vendorRankings.map((v, idx) => {
                const scoreColor = v.match_score >= 80 ? 'bg-gray-700' : v.match_score >= 60 ? 'bg-gray-400' : 'bg-rose-400';
                return (
                  <div key={idx} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                    <div className={`w-10 h-10 rounded-full ${scoreColor} text-white text-sm font-bold flex items-center justify-center shrink-0`}>
                      {v.match_score}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{v.vendor_name}</p>
                      <p className="text-xs text-gray-500 truncate">{v.reason}</p>
                    </div>
                    <span className="text-xs text-gray-400 font-medium">#{idx + 1}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Category Tabs ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {ALL_CATEGORIES.map(({ key, label, icon: TabIcon }) => {
            const isActive = activeCategory === key;
            const count = key === 'all' ? quotes.length : (countByCategory[key] || 0);
            return (
              <button
                key={key}
                onClick={() => setActiveCategory(key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-rose-500 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <TabIcon className="w-3.5 h-3.5" />
                {label}
                {count > 0 && (
                  <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${isActive ? 'bg-rose-400 text-white' : 'bg-gray-200 text-gray-500'}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* ── Quote Grid ── */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-rose-300 border-t-rose-500 rounded-full animate-spin" />
        </div>
      ) : filteredQuotes.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <Inbox className="w-10 h-10 text-gray-300" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No quotes yet</h3>
          <p className="text-sm text-gray-500 max-w-sm">
            {activeCategory !== 'all'
              ? `No quotes in the ${activeCategory} category yet. Try checking other categories.`
              : 'Publish your blueprint to start receiving vendor quotes.'}
          </p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-4"
        >
          <AnimatePresence mode="popLayout">
            {filteredQuotes.map((quote) => (
              <div key={quote.id} className="space-y-0">
                <QuoteCard
                  quote={quote}
                  budgetAllocated={budgetByCategory[quote.category] ?? 0}
                  onAction={(status: QuoteStatus) => handleAction(quote.id, status)}
                  onChat={() => handleChat(quote)}
                />
                {/* AI Analysis Button */}
                <div className="px-1 -mt-1">
                  <button
                    onClick={() => handleAnalyzeQuote(quote)}
                    disabled={analyzingQuoteId === quote.id}
                    className="text-xs font-medium text-rose-500 hover:text-rose-600 flex items-center gap-1 py-1 disabled:opacity-50"
                  >
                    <Sparkles className="w-3 h-3" />
                    {analyzingQuoteId === quote.id ? 'Analyzing...' : aiAnalysis[quote.id] ? 'Hide AI Analysis' : 'AI Analysis'}
                  </button>
                </div>
                {/* AI Analysis Panel */}
                {aiAnalysis[quote.id] && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 space-y-3 overflow-hidden"
                  >
                    {/* Value Rating Badge */}
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase ${
                        aiAnalysis[quote.id].value_rating === 'good' ? 'bg-gray-100 text-gray-700'
                        : aiAnalysis[quote.id].value_rating === 'fair' ? 'bg-rose-50 text-rose-600'
                        : 'bg-rose-100 text-rose-700'
                      }`}>
                        {aiAnalysis[quote.id].value_rating} value
                      </span>
                      <span className="text-xs text-gray-500">{aiAnalysis[quote.id].market_comparison}</span>
                    </div>
                    {/* Strengths */}
                    {aiAnalysis[quote.id].strengths.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">Strengths</p>
                        <ul className="space-y-0.5">
                          {aiAnalysis[quote.id].strengths.map((s, i) => (
                            <li key={i} className="text-xs text-gray-700 flex items-start gap-1.5">
                              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0" />{s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {/* Concerns */}
                    {aiAnalysis[quote.id].concerns.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">Concerns</p>
                        <ul className="space-y-0.5">
                          {aiAnalysis[quote.id].concerns.map((c, i) => (
                            <li key={i} className="text-xs text-rose-600 flex items-start gap-1.5">
                              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />{c}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {/* Negotiation Tip */}
                    <div className="bg-rose-50 border border-rose-200 rounded-lg p-2.5">
                      <p className="text-xs font-medium text-gray-800">Negotiation Tip</p>
                      <p className="text-xs text-gray-700 mt-0.5">{aiAnalysis[quote.id].negotiation_tip}</p>
                    </div>
                    {/* Budget Impact */}
                    <p className="text-xs text-gray-500">{aiAnalysis[quote.id].budget_impact}</p>
                  </motion.div>
                )}
              </div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ── Summary bar ── */}
      {!loading && filteredQuotes.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center justify-between text-sm"
        >
          <div className="flex items-center gap-6 text-gray-500">
            <span>
              <strong className="text-gray-900">{filteredQuotes.filter((q) => q.status === 'shortlisted').length}</strong> shortlisted
            </span>
            <span>
              <strong className="text-gray-900">{filteredQuotes.filter((q) => q.status === 'accepted').length}</strong> accepted
            </span>
            <span>
              <strong className="text-gray-900">{filteredQuotes.filter((q) => q.status === 'submitted').length}</strong> pending
            </span>
          </div>
          <div className="text-gray-500">
            Avg quote:{' '}
            <strong className="text-gray-900">
              {formatCurrency(
                Math.round(filteredQuotes.reduce((s, q) => s + q.total_estimated_price, 0) / filteredQuotes.length)
              )}
            </strong>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Quotes;
