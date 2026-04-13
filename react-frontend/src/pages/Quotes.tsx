import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Inbox, Building2, Camera, UtensilsCrossed, Flower2,
  Sparkles, Music, Filter, ArrowUpDown, Upload, X, MessageSquare,
  Send, Loader2, TrendingDown, Lightbulb, ChevronRight
} from 'lucide-react';
import PDFUploadExtractor from '../components/PDFUploadExtractor';
import { QuoteService } from '../services/quote_service';
import { MessagingService } from '../services/messaging_service';
import { MarketplaceAIService, QuoteAnalysis, VendorMatch, NegotiationSuggestion } from '../services/marketplace_ai_service';
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

// ── Negotiation Panel ──

interface NegotiationPanelProps {
  quote: Quote;
  onClose: () => void;
  onStartChat: (quote: Quote, initialMessage: string) => void;
}

const NegotiationPanel: React.FC<NegotiationPanelProps> = ({ quote, onClose, onStartChat }) => {
  const themeVal = useAppStore((s) => s.theme);
  const isDark = themeVal === 'dark';
  const [userMessage, setUserMessage] = useState('');
  const [suggestion, setSuggestion] = useState<NegotiationSuggestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const quickPrompts = [
    'I want to negotiate 10% off the total',
    'Can we get more inclusions for the same price?',
    'We have a tighter budget — what can we work with?',
    'Can you bundle a discount for multiple events?',
    'What if we pay a higher advance for a discount?',
  ];

  const handleNegotiate = async (message: string) => {
    if (!message.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await MarketplaceAIService.negotiateQuote(quote.id, 'couple', message);
      if (res.success && res.data) {
        setSuggestion(res.data);
      } else {
        setError(res.error || 'Failed to get negotiation advice');
      }
    } catch {
      setError('Failed to connect to AI service');
    }
    setLoading(false);
  };

  const handleSendToVendor = () => {
    if (!suggestion) return;
    // Build a well-crafted message from the AI suggestion
    const talkingPoints = suggestion.talking_points.map(tp => `• ${tp}`).join('\n');
    const msg = `Hi ${quote.vendor_name},\n\n${suggestion.suggestion}\n\nHere are some points for discussion:\n${talkingPoints}\n\nLooking forward to working this out!`;
    onStartChat(quote, msg);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={`rounded-xl border shadow-lg overflow-hidden ${isDark ? 'bg-gray-800 border-violet-900' : 'bg-white border-violet-100'}`}
    >
      {/* Header */}
      <div className={`px-5 py-3 flex items-center justify-between border-b ${isDark ? 'bg-gradient-to-r from-violet-900/30 to-rose-900/30 border-violet-800' : 'bg-gradient-to-r from-violet-50 to-rose-50 border-violet-100'}`}>
        <div>
          <h3 className={`text-sm font-semibold flex items-center gap-2 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
            <TrendingDown className="w-4 h-4 text-violet-500" />
            Negotiate with {quote.vendor_name}
          </h3>
          <p className="text-xs text-gray-500">Current quote: {formatCurrency(quote.total_estimated_price)}</p>
        </div>
        <button onClick={onClose} className="p-1 rounded-full hover:bg-white/60">
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Quick prompts */}
        {!suggestion && !loading && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-500">Quick negotiation strategies:</p>
            <div className="flex flex-wrap gap-1.5">
              {quickPrompts.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => { setUserMessage(prompt); handleNegotiate(prompt); }}
                  className={`text-xs px-2.5 py-1.5 rounded-lg transition-colors text-left border ${isDark ? 'text-violet-300 bg-violet-900/30 hover:bg-violet-900/50 border-violet-800' : 'text-violet-700 bg-violet-50 hover:bg-violet-100 border-violet-100'}`}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Custom message input */}
        {!suggestion && (
          <div className="flex gap-2">
            <input
              value={userMessage}
              onChange={e => setUserMessage(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleNegotiate(userMessage); }}
              placeholder="Tell AI what you want to negotiate..."
              className={`flex-1 rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-violet-200 focus:border-violet-300 ${isDark ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500' : 'border-gray-200'}`}
            />
            <button
              onClick={() => handleNegotiate(userMessage)}
              disabled={loading || !userMessage.trim()}
              className="px-4 py-2 rounded-lg bg-violet-500 text-white text-sm font-medium hover:bg-violet-600 disabled:opacity-50 flex items-center gap-1.5"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Advise
            </button>
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-600 text-xs px-3 py-2 rounded-lg">{error}</div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-6 gap-2 text-violet-500">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">AI is crafting your negotiation strategy...</span>
          </div>
        )}

        {/* AI Suggestion */}
        {suggestion && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            {/* Main suggestion */}
            <div className={`rounded-lg p-3 border ${isDark ? 'bg-violet-900/30 border-violet-800' : 'bg-violet-50 border-violet-100'}`}>
              <div className="flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-violet-500 mt-0.5 shrink-0" />
                <p className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{suggestion.suggestion}</p>
              </div>
            </div>

            {/* Talking points */}
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1.5">Key talking points:</p>
              <ul className="space-y-1">
                {suggestion.talking_points.map((tp, i) => (
                  <li key={i} className={`text-xs flex items-start gap-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    <ChevronRight className="w-3 h-3 text-violet-400 mt-0.5 shrink-0" />
                    {tp}
                  </li>
                ))}
              </ul>
            </div>

            {/* Revised pricing */}
            {suggestion.revised_pricing?.adjusted_total && (
              <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-700">Suggested revised total</span>
                  <span className="text-sm font-bold text-green-700">
                    {formatCurrency(suggestion.revised_pricing.adjusted_total)}
                  </span>
                </div>
                <p className="text-xs text-gray-600">{suggestion.revised_pricing.adjustment_reason}</p>
                {suggestion.revised_pricing.added_inclusions.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {suggestion.revised_pricing.added_inclusions.map((incl, i) => (
                      <span key={i} className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">+ {incl}</span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tone advice */}
            <div className={`text-xs text-gray-500 italic rounded-lg p-2.5 border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-100'}`}>
              💡 {suggestion.tone_advice}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleSendToVendor}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-rose-500 text-white text-sm font-medium hover:bg-rose-600 transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                Send to Vendor via Chat
              </button>
              <button
                onClick={() => { setSuggestion(null); setUserMessage(''); }}
                className={`px-3 py-2 text-sm border rounded-lg ${isDark ? 'text-gray-400 hover:text-gray-300 border-gray-600 hover:bg-gray-700' : 'text-gray-500 hover:text-gray-700 border-gray-200 hover:bg-gray-50'}`}
              >
                Try Again
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

// ── Main Component ──

const Quotes: React.FC = () => {
  const navigate = useNavigate();
  const blueprintId = useAppStore((s) => s.blueprintId);
  const currentUserId = useAppStore((s) => s.currentUserId);
  const theme = useAppStore((s) => s.theme);
  const isDark = theme === 'dark';

  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<VendorCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortKey>('newest');
  const [showSort, setShowSort] = useState(false);

  // Budget by category
  const [budgetByCategory, setBudgetByCategory] = useState<Record<VendorCategory, number>>({
    venue: 0, photography: 0, catering: 0, decoration: 0, makeup: 0, entertainment: 0,
  });

  // AI state
  const [aiAnalysis, setAiAnalysis] = useState<Record<number, QuoteAnalysis>>({});
  const [vendorRankings, setVendorRankings] = useState<VendorMatch[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [showRankings, setShowRankings] = useState(false);
  const [analyzingQuoteId, setAnalyzingQuoteId] = useState<number | null>(null);

  // Negotiation state
  const [negotiatingQuoteId, setNegotiatingQuoteId] = useState<number | null>(null);

  // Expanded card state
  const [expandedQuoteId, setExpandedQuoteId] = useState<number | null>(null);

  // PDF upload
  const [showPDFUploader, setShowPDFUploader] = useState(false);

  // Inline toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  }, []);

  // ── Load quotes ──
  useEffect(() => {
    if (!blueprintId) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await QuoteService.getQuotesForBlueprint(blueprintId);
        if (!cancelled && res.success && res.data) setQuotes(res.data);
      } catch { /* silently handle */ }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [blueprintId]);

  // Load budget from blueprint
  useEffect(() => {
    if (!blueprintId) return;
    let cancelled = false;
    (async () => {
      try {
        const { BlueprintService } = await import('../services/blueprint_service');
        const res = await BlueprintService.getBlueprint(blueprintId);
        if (!cancelled && res.success && res.data?.budget_breakdown) {
          setBudgetByCategory((prev) => ({ ...prev, ...res.data!.budget_breakdown }));
        }
      } catch { /* keep defaults */ }
    })();
    return () => { cancelled = true; };
  }, [blueprintId]);

  // ── Filter & sort ──
  const filteredQuotes = quotes
    .filter((q) => activeCategory === 'all' || q.category === activeCategory)
    .sort((a, b) => {
      switch (sortBy) {
        case 'price_low': return a.total_estimated_price - b.total_estimated_price;
        case 'price_high': return b.total_estimated_price - a.total_estimated_price;
        case 'rating': return (b.vendor_rating ?? 0) - (a.vendor_rating ?? 0);
        default: return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

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
        const labels: Record<string, string> = { shortlisted: 'Quote shortlisted', accepted: 'Quote accepted!', rejected: 'Quote rejected' };
        showToast(labels[status] || 'Updated');
      }
    } catch { showToast('Failed to update quote'); }
  }, [showToast]);

  const handleChat = useCallback(async (quote: Quote, initialMessage?: string) => {
    if (!blueprintId) return;
    try {
      await MessagingService.createConversation({
        couple_id: currentUserId,
        vendor_id: quote.vendor_id,
        blueprint_id: blueprintId,
        subject: `Re: ${quote.category} Quote`,
        initial_message: initialMessage || "Hi, I'd like to discuss your quote.",
      });
      navigate('/messages');
    } catch { showToast('Failed to start conversation'); }
  }, [blueprintId, currentUserId, navigate, showToast]);

  // ── AI Actions ──
  const handleAnalyzeQuote = useCallback(async (quote: Quote) => {
    if (aiAnalysis[quote.id]) {
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
    } catch { showToast('AI analysis failed'); }
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
      if (res.success && res.data) setVendorRankings(res.data);
      else showToast(res.error || 'AI ranking failed');
    } catch { showToast('AI ranking failed'); }
    setAiLoading(false);
  }, [activeCategory, filteredQuotes, budgetByCategory, showToast]);

  // ── Render ──

  if (!blueprintId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className={`rounded-xl border shadow-sm p-8 text-center max-w-md ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <FileText className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-gray-500' : 'text-gray-300'}`} />
          <h2 className={`text-lg font-semibold mb-2 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>No blueprint found</h2>
          <p className="text-sm text-gray-500 mb-4">Create and publish a blueprint to start receiving vendor quotes.</p>
          <a href="/preferences" className="inline-block px-5 py-2 rounded-lg bg-rose-500 text-white text-sm font-medium hover:bg-rose-600 transition-colors">
            Go to Preferences
          </a>
        </div>
      </div>
    );
  }

  const negotiatingQuote = negotiatingQuoteId ? quotes.find(q => q.id === negotiatingQuoteId) : null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Planning Journey */}
      <PlanningJourney compact />

      {/* Toast */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-6 right-6 z-50 bg-gray-900 text-white text-sm px-4 py-2 rounded-lg shadow-lg"
          >
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className={`text-xl sm:text-2xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Incoming Quotes</h1>
          <p className="text-sm text-gray-500 mt-1">
            {quotes.length} {quotes.length === 1 ? 'quote' : 'quotes'} received
            {quotes.filter(q => q.status === 'shortlisted').length > 0 && (
              <> · <span className="text-amber-600">{quotes.filter(q => q.status === 'shortlisted').length} shortlisted</span></>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPDFUploader(!showPDFUploader)}
            className={`flex items-center gap-1.5 text-sm font-medium border rounded-lg px-3 py-1.5 transition-colors ${
              showPDFUploader
                ? isDark ? 'text-rose-400 border-rose-700 bg-rose-900/30' : 'text-rose-600 border-rose-200 bg-rose-50'
                : isDark ? 'text-gray-400 border-gray-600 hover:bg-rose-900/30 hover:border-rose-700 hover:text-rose-400' : 'text-gray-600 border-gray-200 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Upload PDF
          </button>
          <button
            onClick={handleRankVendors}
            disabled={aiLoading}
            className={`flex items-center gap-1.5 text-sm font-medium rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50 border ${isDark ? 'text-rose-400 border-rose-700 hover:bg-rose-900/30' : 'text-rose-600 border-rose-200 hover:bg-rose-50'}`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            {aiLoading ? 'Ranking...' : 'AI Rank'}
          </button>
          <div className="relative">
            <button
              onClick={() => setShowSort(!showSort)}
              className={`flex items-center gap-1.5 text-sm border rounded-lg px-3 py-1.5 transition-colors ${isDark ? 'text-gray-400 border-gray-600 hover:bg-gray-700' : 'text-gray-600 border-gray-200 hover:bg-gray-50'}`}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              {SORT_OPTIONS.find((o) => o.key === sortBy)?.label}
            </button>
            {showSort && (
              <div className={`absolute right-0 top-full mt-1 border rounded-lg shadow-lg z-20 min-w-[180px] ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => { setSortBy(opt.key); setShowSort(false); }}
                    className={`block w-full text-left px-4 py-2 text-sm ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} ${sortBy === opt.key ? 'text-rose-600 font-medium' : isDark ? 'text-gray-300' : 'text-gray-700'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── PDF Upload Panel ── */}
      <AnimatePresence>
        {showPDFUploader && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className={`rounded-xl border shadow-sm overflow-hidden ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <PDFUploadExtractor onClose={() => setShowPDFUploader(false)} defaultContext="vendor_quote" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── AI Vendor Rankings Panel ── */}
      <AnimatePresence>
        {showRankings && vendorRankings.length > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className={`rounded-xl border shadow-sm p-4 overflow-hidden ${isDark ? 'bg-gray-800 border-rose-800' : 'bg-white border-rose-100'}`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className={`text-sm font-semibold flex items-center gap-2 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                <Sparkles className="w-4 h-4 text-rose-500" /> AI Vendor Rankings
              </h3>
              <button onClick={() => setShowRankings(false)} className="text-xs text-gray-400 hover:text-gray-600">Dismiss</button>
            </div>
            <div className="space-y-2">
              {vendorRankings.map((v, idx) => {
                const scoreColor = v.match_score >= 80 ? 'bg-gray-700' : v.match_score >= 60 ? 'bg-gray-400' : 'bg-rose-400';
                return (
                  <div key={idx} className={`flex items-center gap-3 p-2 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                    <div className={`w-10 h-10 rounded-full ${scoreColor} text-white text-sm font-bold flex items-center justify-center shrink-0`}>
                      {v.match_score}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{v.vendor_name}</p>
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
                  isActive ? 'bg-rose-500 text-white shadow-sm' : isDark ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <TabIcon className="w-3.5 h-3.5" />
                {label}
                {count > 0 && (
                  <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${isActive ? 'bg-rose-400 text-white' : isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-500'}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* ── Quote Grid + Negotiation Panel ── */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-rose-300 border-t-rose-500 rounded-full animate-spin" />
        </div>
      ) : filteredQuotes.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20 text-center">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <Inbox className={`w-10 h-10 ${isDark ? 'text-gray-500' : 'text-gray-300'}`} />
          </div>
          <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>No quotes yet</h3>
          <p className="text-sm text-gray-500 max-w-sm">
            {activeCategory !== 'all'
              ? `No quotes in the ${activeCategory} category yet. Try checking other categories.`
              : 'Publish your blueprint to start receiving vendor quotes.'}
          </p>
        </motion.div>
      ) : (
        <div className={`grid gap-4 ${negotiatingQuote ? 'grid-cols-1 lg:grid-cols-5' : 'grid-cols-1 lg:grid-cols-2'}`}>
          {/* Quote cards */}
          <div className={`space-y-4 ${negotiatingQuote ? 'lg:col-span-3' : 'lg:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-4'}`}>
            <AnimatePresence mode="popLayout">
              {filteredQuotes.map((quote) => (
                <div key={quote.id} className="space-y-0">
                  <QuoteCard
                    quote={quote}
                    budgetAllocated={budgetByCategory[quote.category] ?? 0}
                    onAction={(status: QuoteStatus) => handleAction(quote.id, status)}
                    onChat={() => handleChat(quote)}
                    onNegotiate={() => setNegotiatingQuoteId(negotiatingQuoteId === quote.id ? null : quote.id)}
                    expanded={expandedQuoteId === quote.id}
                    onToggleExpand={() => setExpandedQuoteId(expandedQuoteId === quote.id ? null : quote.id)}
                  />
                  {/* AI Analysis Button */}
                  <div className="px-1 -mt-1 flex items-center gap-3">
                    <button
                      onClick={() => handleAnalyzeQuote(quote)}
                      disabled={analyzingQuoteId === quote.id}
                      className="text-xs font-medium text-rose-500 hover:text-rose-600 flex items-center gap-1 py-1 disabled:opacity-50"
                    >
                      <Sparkles className="w-3 h-3" />
                      {analyzingQuoteId === quote.id ? 'Analyzing...' : aiAnalysis[quote.id] ? 'Hide Analysis' : 'AI Analysis'}
                    </button>
                    {negotiatingQuoteId === quote.id && (
                      <span className="text-xs text-violet-500 flex items-center gap-1">
                        <TrendingDown className="w-3 h-3" /> Negotiating →
                      </span>
                    )}
                  </div>
                  {/* AI Analysis Panel */}
                  <AnimatePresence>
                    {aiAnalysis[quote.id] && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className={`rounded-lg border shadow-sm p-4 space-y-3 overflow-hidden ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase ${
                            aiAnalysis[quote.id].value_rating === 'good' ? 'bg-green-50 text-green-700 border border-green-200'
                            : aiAnalysis[quote.id].value_rating === 'fair' ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {aiAnalysis[quote.id].value_rating} value
                          </span>
                          <span className="text-xs text-gray-500">{aiAnalysis[quote.id].market_comparison}</span>
                        </div>
                        {aiAnalysis[quote.id].strengths.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-gray-500 mb-1">Strengths</p>
                            <ul className="space-y-0.5">
                              {aiAnalysis[quote.id].strengths.map((s, i) => (
                                <li key={i} className="text-xs text-gray-700 flex items-start gap-1.5">
                                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />{s}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
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
                        <div className={`rounded-lg p-2.5 border ${isDark ? 'bg-violet-900/30 border-violet-800' : 'bg-violet-50 border-violet-200'}`}>
                          <p className={`text-xs font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>Negotiation Tip</p>
                          <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{aiAnalysis[quote.id].negotiation_tip}</p>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-500">{aiAnalysis[quote.id].budget_impact}</p>
                          {quote.status !== 'rejected' && quote.status !== 'accepted' && (
                            <button
                              onClick={() => setNegotiatingQuoteId(quote.id)}
                              className="text-xs font-medium text-violet-600 hover:text-violet-700 flex items-center gap-1"
                            >
                              <TrendingDown className="w-3 h-3" /> Start negotiation
                            </button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </AnimatePresence>
          </div>

          {/* Negotiation Panel (sticky sidebar) */}
          <AnimatePresence>
            {negotiatingQuote && (
              <div className="lg:col-span-2 lg:sticky lg:top-8 lg:self-start">
                <NegotiationPanel
                  quote={negotiatingQuote}
                  onClose={() => setNegotiatingQuoteId(null)}
                  onStartChat={(q, msg) => { handleChat(q, msg); setNegotiatingQuoteId(null); }}
                />
              </div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ── Summary bar ── */}
      {!loading && filteredQuotes.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className={`rounded-xl border shadow-sm p-4 flex items-center justify-between text-sm flex-wrap gap-3 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
        >
          <div className="flex items-center gap-6 text-gray-500">
            <span><strong className={isDark ? 'text-gray-100' : 'text-gray-900'}>{filteredQuotes.filter((q) => q.status === 'shortlisted').length}</strong> shortlisted</span>
            <span><strong className={isDark ? 'text-gray-100' : 'text-gray-900'}>{filteredQuotes.filter((q) => q.status === 'accepted').length}</strong> accepted</span>
            <span><strong className={isDark ? 'text-gray-100' : 'text-gray-900'}>{filteredQuotes.filter((q) => q.status === 'submitted').length}</strong> pending</span>
          </div>
          <div className="flex items-center gap-4 text-gray-500">
            <span>
              Avg quote: <strong className={isDark ? 'text-gray-100' : 'text-gray-900'}>
                {formatCurrency(Math.round(filteredQuotes.reduce((s, q) => s + q.total_estimated_price, 0) / filteredQuotes.length))}
              </strong>
            </span>
            {activeCategory !== 'all' && budgetByCategory[activeCategory] > 0 && (
              <span>
                Budget: <strong className={isDark ? 'text-gray-100' : 'text-gray-900'}>{formatCurrency(budgetByCategory[activeCategory])}</strong>
              </span>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Quotes;
