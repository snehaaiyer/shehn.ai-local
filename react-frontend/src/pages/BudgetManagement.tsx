import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign, TrendingUp, TrendingDown, Plus, Eye, BarChart3, MapPin,
  Star, CheckCircle, AlertTriangle, Sparkles, Trash2, IndianRupee,
  Camera, UtensilsCrossed, Flower2, Music, Building2, FileText, ArrowRight,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { BudgetService, BudgetTransaction } from '../services/budget_service';
import { QuoteService } from '../services/quote_service';
import { BlueprintService } from '../services/blueprint_service';
import { Quote, VendorCategory } from '../types/marketplace';
import PlanningJourney from '../components/PlanningJourney';

// ── Helpers ──

const formatINR = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

const formatLakhs = (amount: number) => {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount}`;
};

const CATEGORY_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  venue:         { label: 'Venue & Location',        icon: Building2,       color: '#3B82F6' },
  photography:   { label: 'Photography & Video',     icon: Camera,          color: '#F59E0B' },
  catering:      { label: 'Catering & Food',         icon: UtensilsCrossed, color: '#10B981' },
  decoration:    { label: 'Decoration & Flowers',    icon: Flower2,         color: '#EF4444' },
  makeup:        { label: 'Makeup & Beauty',         icon: Sparkles,        color: '#EC4899' },
  entertainment: { label: 'Music & Entertainment',   icon: Music,           color: '#8B5CF6' },
};

// ── Component ──

const BudgetManagement: React.FC = () => {
  const navigate = useNavigate();
  const blueprintId = useAppStore((s) => s.blueprintId);
  const blueprint = useAppStore((s) => s.blueprint);
  const currentUserId = useAppStore((s) => s.currentUserId);
  const planningStage = useAppStore((s) => s.planningStage);
  const theme = useAppStore((s) => s.theme);
  const isDark = theme === 'dark';

  // Data state
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [transactions, setTransactions] = useState<BudgetTransaction[]>([]);
  const [budgetBreakdown, setBudgetBreakdown] = useState<Record<string, number>>({});
  const [confirmedVendors, setConfirmedVendors] = useState<Record<string, any>>({});
  const [costSavingTips, setCostSavingTips] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // UI state
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'vendors' | 'transactions'>('overview');
  const [newTx, setNewTx] = useState({ category: '', description: '', amount: 0, type: 'expense' as 'expense' | 'income' });

  // ── Load data ──
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // Load transactions
        const txRes = await BudgetService.getTransactions(currentUserId);
        if (txRes.success && txRes.data) setTransactions(txRes.data);

        // Load blueprint data from API (more complete than Zustand store)
        if (blueprintId) {
          const bpRes = await BlueprintService.getBlueprint(blueprintId);
          if (bpRes.success && bpRes.data) {
            setBudgetBreakdown(bpRes.data.budget_breakdown || {});
            setConfirmedVendors((bpRes.data as any).confirmed_vendors || {});
            setCostSavingTips(bpRes.data.cost_saving_tips || []);
          }

          // Load quotes
          const qRes = await QuoteService.getQuotesForBlueprint(blueprintId);
          if (qRes.success && qRes.data) setQuotes(qRes.data);
        } else if (blueprint?.budgetBreakdown) {
          // Fallback to Zustand store data
          setBudgetBreakdown(blueprint.budgetBreakdown);
          setCostSavingTips(blueprint.costSavingTips || []);
        }
      } catch (err) {
        console.error('Budget load failed:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [blueprintId, currentUserId, blueprint]);

  // ── Computed values ──
  const categories = Object.entries(budgetBreakdown).filter(([, amt]) => amt > 0);
  const totalBudget = categories.reduce((sum, [, amt]) => sum + amt, 0);

  // Spending: accepted quotes
  const acceptedQuotes = quotes.filter((q) => q.status === 'accepted');
  const totalCommitted = acceptedQuotes.reduce((sum, q) => sum + q.total_estimated_price, 0);

  // Shortlisted quotes (projected but not committed)
  const shortlistedQuotes = quotes.filter((q) => q.status === 'shortlisted');
  const totalShortlisted = shortlistedQuotes.reduce((sum, q) => sum + q.total_estimated_price, 0);

  // Manual transactions
  const totalManualSpent = transactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const totalIncome = transactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);

  const totalSpent = totalCommitted + totalManualSpent;
  const totalProjected = totalSpent + totalShortlisted;
  const remaining = totalBudget - totalProjected;
  const utilizationPct = totalBudget > 0 ? (totalProjected / totalBudget) * 100 : 0;

  // Per-category data
  const getCategoryData = (cat: string) => {
    const allocated = budgetBreakdown[cat] || 0;
    const catAccepted = acceptedQuotes.filter((q) => q.category === cat);
    const catShortlisted = shortlistedQuotes.filter((q) => q.category === cat);
    const committed = catAccepted.reduce((s, q) => s + q.total_estimated_price, 0);
    const projected = catShortlisted.reduce((s, q) => s + q.total_estimated_price, 0);
    const confirmedVendor = confirmedVendors[cat];
    return { allocated, committed, projected, catAccepted, catShortlisted, confirmedVendor };
  };

  // ── Actions ──
  const addTransaction = useCallback(async () => {
    if (!newTx.category || !newTx.description || newTx.amount <= 0) return;
    try {
      await BudgetService.createTransaction({
        couple_id: currentUserId,
        category: newTx.category,
        description: newTx.description,
        amount: newTx.amount,
        type: newTx.type,
      });
      const res = await BudgetService.getTransactions(currentUserId);
      if (res.success && res.data) setTransactions(res.data);
      setNewTx({ category: '', description: '', amount: 0, type: 'expense' });
      setShowAddTransaction(false);
    } catch (err) {
      console.error('Failed to create transaction:', err);
    }
  }, [newTx, currentUserId]);

  const deleteTransaction = useCallback(async (txId: number) => {
    try {
      await BudgetService.deleteTransaction(txId);
      const res = await BudgetService.getTransactions(currentUserId);
      if (res.success && res.data) setTransactions(res.data);
    } catch (err) {
      console.error('Failed to delete transaction:', err);
    }
  }, [currentUserId]);

  // ── No blueprint state ──
  if (!blueprintId && !blueprint?.budgetBreakdown) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <PlanningJourney compact />
        <div className={`mt-8 rounded-2xl border shadow-sm p-10 text-center ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <BarChart3 className={`w-8 h-8 ${isDark ? 'text-gray-500' : 'text-gray-300'}`} />
          </div>
          <h2 className={`text-lg sm:text-xl font-bold mb-2 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>No Budget Data Yet</h2>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Create a wedding blueprint in the AI Planner to get a smart budget breakdown tailored to your preferences.
          </p>
          <button
            onClick={() => navigate('/plan')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-rose-500 text-white font-medium rounded-xl hover:bg-rose-600 transition"
          >
            <Sparkles className="w-4 h-4" /> Go to AI Planner
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-rose-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <PlanningJourney compact />

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-xl sm:text-2xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Budget Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            {blueprint?.city && blueprint?.date
              ? `${blueprint.city} · ${blueprint.date} · ${blueprint.guestCount || '—'} guests`
              : 'Track and manage your wedding expenses'}
          </p>
        </div>
        <button
          onClick={() => setShowAddTransaction(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-rose-500 text-white rounded-xl text-sm font-medium hover:bg-rose-600 transition shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Expense
        </button>
      </div>

      {/* ── Overview Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Budget */}
        <div className={`rounded-xl border shadow-sm p-5 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Budget</p>
            <div className={`p-2 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <IndianRupee className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
            </div>
          </div>
          <p className={`text-xl sm:text-2xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{formatLakhs(totalBudget)}</p>
          <p className="text-xs text-gray-400 mt-1">{categories.length} categories</p>
        </div>

        {/* Committed (accepted quotes + manual expenses) */}
        <div className={`rounded-xl border shadow-sm p-5 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Committed</p>
            <div className={`p-2 rounded-lg ${isDark ? 'bg-rose-900/30' : 'bg-rose-50'}`}>
              <TrendingDown className="w-4 h-4 text-rose-500" />
            </div>
          </div>
          <p className={`text-xl sm:text-2xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{formatLakhs(totalSpent)}</p>
          <p className="text-xs text-gray-400 mt-1">
            {acceptedQuotes.length > 0 && `${acceptedQuotes.length} vendor${acceptedQuotes.length > 1 ? 's' : ''} booked`}
            {acceptedQuotes.length > 0 && totalManualSpent > 0 && ' + '}
            {totalManualSpent > 0 && `${formatINR(totalManualSpent)} manual`}
            {acceptedQuotes.length === 0 && totalManualSpent === 0 && 'No spending yet'}
          </p>
        </div>

        {/* Projected (includes shortlisted) */}
        <div className={`rounded-xl border shadow-sm p-5 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Projected</p>
            <div className={`p-2 rounded-lg ${isDark ? 'bg-amber-900/30' : 'bg-amber-50'}`}>
              <Eye className="w-4 h-4 text-amber-500" />
            </div>
          </div>
          <p className={`text-xl sm:text-2xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{formatLakhs(totalProjected)}</p>
          <p className="text-xs text-gray-400 mt-1">
            {shortlistedQuotes.length > 0 ? `incl. ${shortlistedQuotes.length} shortlisted` : 'Same as committed'}
          </p>
        </div>

        {/* Remaining */}
        <div className={`rounded-xl border shadow-sm p-5 ${isDark ? (remaining < 0 ? 'bg-gray-800 border-rose-700' : 'bg-gray-800 border-gray-700') : (remaining < 0 ? 'bg-white border-rose-200' : 'bg-white border-gray-100')}`}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Remaining</p>
            <div className={`p-2 rounded-lg ${remaining < 0 ? (isDark ? 'bg-rose-900/30' : 'bg-rose-50') : (isDark ? 'bg-emerald-900/30' : 'bg-emerald-50')}`}>
              <TrendingUp className={`w-4 h-4 ${remaining < 0 ? 'text-rose-500' : 'text-emerald-500'}`} />
            </div>
          </div>
          <p className={`text-xl sm:text-2xl font-bold ${remaining < 0 ? 'text-rose-600' : (isDark ? 'text-gray-100' : 'text-gray-900')}`}>
            {formatLakhs(Math.abs(remaining))}
            {remaining < 0 && <span className="text-sm font-normal text-rose-500 ml-1">over</span>}
          </p>
          <p className="text-xs text-gray-400 mt-1">{(100 - utilizationPct).toFixed(0)}% available</p>
        </div>
      </div>

      {/* ── Budget utilization bar ── */}
      <div className={`rounded-xl border shadow-sm p-5 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
        <div className="flex items-center justify-between mb-3">
          <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Budget Utilization</p>
          <p className="text-sm text-gray-500">{utilizationPct.toFixed(1)}%</p>
        </div>
        <div className={`w-full rounded-full h-3 overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
          {/* Committed portion */}
          <div className="h-full flex">
            <div
              className="h-full bg-rose-400 transition-all duration-500"
              style={{ width: `${Math.min((totalSpent / totalBudget) * 100, 100)}%` }}
            />
            {/* Shortlisted portion */}
            <div
              className="h-full bg-amber-300 transition-all duration-500"
              style={{ width: `${Math.min((totalShortlisted / totalBudget) * 100, 100 - (totalSpent / totalBudget) * 100)}%` }}
            />
          </div>
        </div>
        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-400" /> Committed</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-300" /> Shortlisted</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-100" /> Available</span>
        </div>
      </div>

      {/* ── Tab Navigation ── */}
      <div className={`flex gap-1 p-1 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
        {(['overview', 'vendors', 'transactions'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors capitalize ${
              activeTab === tab
                ? isDark ? 'bg-gray-700 text-gray-100 shadow-sm' : 'bg-white text-gray-900 shadow-sm'
                : isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'overview' ? 'Category Breakdown' : tab === 'vendors' ? `Vendor Quotes (${quotes.length})` : `Transactions (${transactions.length})`}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}

      {/* TAB: Category Breakdown */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {categories.length === 0 ? (
            <div className={`rounded-xl border p-8 text-center ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <FileText className={`w-10 h-10 mx-auto mb-3 ${isDark ? 'text-gray-500' : 'text-gray-300'}`} />
              <p className="text-gray-500">No budget categories found. Generate a blueprint to see your budget breakdown.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categories.map(([cat, allocated]) => {
                const meta = CATEGORY_META[cat] || { label: cat.charAt(0).toUpperCase() + cat.slice(1), icon: DollarSign, color: '#6B7280' };
                const Icon = meta.icon;
                const data = getCategoryData(cat);
                const usedPct = allocated > 0 ? ((data.committed + data.projected) / allocated) * 100 : 0;
                const isOverBudget = data.committed + data.projected > allocated;

                return (
                  <div key={cat} className={`rounded-xl border shadow-sm p-5 ${isDark ? (isOverBudget ? 'bg-gray-800 border-rose-700' : 'bg-gray-800 border-gray-700') : (isOverBudget ? 'bg-white border-rose-200' : 'bg-white border-gray-100')}`}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: meta.color }}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className={`font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{meta.label}</h3>
                        <p className="text-xs text-gray-500">Allocated: {formatINR(allocated)}</p>
                      </div>
                      {data.confirmedVendor && (
                        <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">
                          ✅ Booked
                        </span>
                      )}
                      {data.catShortlisted.length > 0 && !data.confirmedVendor && (
                        <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-1 rounded-full">
                          ⭐ {data.catShortlisted.length} shortlisted
                        </span>
                      )}
                    </div>

                    {/* Progress bar */}
                    <div className={`w-full rounded-full h-2 mb-2 overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <div className="h-full flex">
                        <div className="h-full bg-rose-400 transition-all" style={{ width: `${Math.min((data.committed / allocated) * 100, 100)}%` }} />
                        <div className="h-full bg-amber-300 transition-all" style={{ width: `${Math.min((data.projected / allocated) * 100, 100 - (data.committed / allocated) * 100)}%` }} />
                      </div>
                    </div>

                    <div className="flex justify-between text-xs text-gray-500">
                      <span>
                        {data.committed > 0 && <><span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{formatINR(data.committed)}</span> booked</>}
                        {data.committed > 0 && data.projected > 0 && ' · '}
                        {data.projected > 0 && <><span className="font-medium text-amber-600">{formatINR(data.projected)}</span> shortlisted</>}
                        {data.committed === 0 && data.projected === 0 && 'No quotes yet'}
                      </span>
                      <span className={isOverBudget ? 'text-rose-500 font-medium' : ''}>
                        {usedPct.toFixed(0)}% used
                      </span>
                    </div>

                    {/* Confirmed vendor name */}
                    {data.confirmedVendor && (
                      <div className={`mt-3 pt-3 border-t text-xs ${isDark ? 'border-gray-700 text-gray-400' : 'border-gray-100 text-gray-600'}`}>
                        <span className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{data.confirmedVendor.vendor_name}</span>
                        {' · '}{formatINR(data.confirmedVendor.total_estimated_price)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Cost-saving tips */}
          {costSavingTips.length > 0 && (
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 p-5">
              <h3 className="text-sm font-semibold text-emerald-900 flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4" /> AI Cost-Saving Tips
              </h3>
              <ul className="space-y-1.5">
                {costSavingTips.map((tip, i) => (
                  <li key={i} className="text-sm text-emerald-800 flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* TAB: Vendor Quotes */}
      {activeTab === 'vendors' && (
        <div className="space-y-4">
          {quotes.length === 0 ? (
            <div className={`rounded-xl border p-10 text-center ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <IndianRupee className={`w-8 h-8 ${isDark ? 'text-gray-500' : 'text-gray-300'}`} />
              </div>
              <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>No vendor quotes yet</h3>
              <p className="text-sm text-gray-500 mb-4 max-w-sm mx-auto">
                {planningStage === 'published'
                  ? 'Your blueprint is published. Vendors will start sending quotes soon!'
                  : 'Publish your blueprint to start receiving vendor quotes.'}
              </p>
              {planningStage !== 'published' && (
                <button
                  onClick={() => navigate('/blueprint')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-500 text-white text-sm font-medium rounded-xl hover:bg-rose-600 transition"
                >
                  <FileText className="w-4 h-4" /> Go to Blueprint <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Accepted vendors */}
              {acceptedQuotes.length > 0 && (
                <div>
                  <h3 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    <CheckCircle className="w-4 h-4 text-emerald-500" /> Booked Vendors ({acceptedQuotes.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {acceptedQuotes.map((q) => (
                      <VendorQuoteRow key={q.id} quote={q} type="accepted" budgetAllocated={budgetBreakdown[q.category] || 0} />
                    ))}
                  </div>
                </div>
              )}

              {/* Shortlisted vendors */}
              {shortlistedQuotes.length > 0 && (
                <div>
                  <h3 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    <Star className="w-4 h-4 text-amber-500" /> Shortlisted ({shortlistedQuotes.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {shortlistedQuotes.map((q) => (
                      <VendorQuoteRow key={q.id} quote={q} type="shortlisted" budgetAllocated={budgetBreakdown[q.category] || 0} />
                    ))}
                  </div>
                </div>
              )}

              {/* Pending / submitted */}
              {quotes.filter((q) => q.status === 'submitted').length > 0 && (
                <div>
                  <h3 className={`text-sm font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Pending Review ({quotes.filter((q) => q.status === 'submitted').length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {quotes.filter((q) => q.status === 'submitted').map((q) => (
                      <VendorQuoteRow key={q.id} quote={q} type="submitted" budgetAllocated={budgetBreakdown[q.category] || 0} />
                    ))}
                  </div>
                </div>
              )}

              {/* Summary */}
              <div className={`rounded-xl border p-4 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-gray-500">Total Committed</p>
                    <p className={`text-lg font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{formatINR(totalCommitted)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Shortlisted Total</p>
                    <p className="text-lg font-bold text-amber-600">{formatINR(totalShortlisted)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">vs Budget</p>
                    <p className={`text-lg font-bold ${totalProjected > totalBudget ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {totalProjected <= totalBudget ? `${formatINR(totalBudget - totalProjected)} under` : `${formatINR(totalProjected - totalBudget)} over`}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB: Transactions */}
      {activeTab === 'transactions' && (
        <div className="space-y-4">
          {transactions.length === 0 ? (
            <div className={`rounded-xl border p-10 text-center ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <DollarSign className={`w-10 h-10 mx-auto mb-3 ${isDark ? 'text-gray-500' : 'text-gray-300'}`} />
              <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>No transactions yet</h3>
              <p className="text-sm text-gray-500 mb-4">Track your wedding expenses and payments here.</p>
              <button
                onClick={() => setShowAddTransaction(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-500 text-white text-sm font-medium rounded-xl hover:bg-rose-600 transition"
              >
                <Plus className="w-4 h-4" /> Add First Transaction
              </button>
            </div>
          ) : (
            <div className={`rounded-xl border shadow-sm ${isDark ? 'bg-gray-800 border-gray-700 divide-y divide-gray-700' : 'bg-white border-gray-100 divide-y divide-gray-100'}`}>
              {transactions.map((tx) => (
                <div key={tx.id} className={`flex items-center justify-between px-5 py-3.5 transition ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${tx.type === 'expense' ? (isDark ? 'bg-rose-900/30' : 'bg-rose-50') : (isDark ? 'bg-emerald-900/30' : 'bg-emerald-50')}`}>
                      {tx.type === 'expense' ? <TrendingDown className="w-4 h-4 text-rose-500" /> : <TrendingUp className="w-4 h-4 text-emerald-500" />}
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{tx.description}</p>
                      <p className="text-xs text-gray-500">{tx.category} · {tx.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-bold ${tx.type === 'expense' ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {tx.type === 'expense' ? '-' : '+'}{formatINR(tx.amount)}
                    </span>
                    <button
                      onClick={() => deleteTransaction(tx.id)}
                      className="p-1.5 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Add Transaction Modal ── */}
      {showAddTransaction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowAddTransaction(false)}>
          <div className={`rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl ${isDark ? 'bg-gray-800' : 'bg-white'}`} onClick={(e) => e.stopPropagation()}>
            <h3 className={`text-lg font-bold mb-5 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Add Transaction</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Category</label>
                <select
                  value={newTx.category}
                  onChange={(e) => setNewTx({ ...newTx, category: e.target.value })}
                  className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-rose-200 focus:border-rose-300 outline-none ${isDark ? 'bg-gray-700 border-gray-600 text-gray-200' : 'border-gray-200'}`}
                >
                  <option value="">Select category</option>
                  {categories.map(([cat]) => (
                    <option key={cat} value={cat}>
                      {CATEGORY_META[cat]?.label || cat}
                    </option>
                  ))}
                  <option value="miscellaneous">Miscellaneous</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Description</label>
                <input
                  type="text"
                  value={newTx.description}
                  onChange={(e) => setNewTx({ ...newTx, description: e.target.value })}
                  className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-rose-200 focus:border-rose-300 outline-none ${isDark ? 'bg-gray-700 border-gray-600 text-gray-200' : 'border-gray-200'}`}
                  placeholder="e.g., Venue booking advance"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Amount (₹)</label>
                  <input
                    type="number"
                    value={newTx.amount || ''}
                    onChange={(e) => setNewTx({ ...newTx, amount: Number(e.target.value) })}
                    className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-rose-200 focus:border-rose-300 outline-none ${isDark ? 'bg-gray-700 border-gray-600 text-gray-200' : 'border-gray-200'}`}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Type</label>
                  <select
                    value={newTx.type}
                    onChange={(e) => setNewTx({ ...newTx, type: e.target.value as 'expense' | 'income' })}
                    className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-rose-200 focus:border-rose-300 outline-none ${isDark ? 'bg-gray-700 border-gray-600 text-gray-200' : 'border-gray-200'}`}
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income / Gift</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddTransaction(false)}
                className={`flex-1 px-4 py-2.5 border rounded-xl text-sm font-medium transition ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}
              >
                Cancel
              </button>
              <button
                onClick={addTransaction}
                disabled={!newTx.category || !newTx.description || newTx.amount <= 0}
                className="flex-1 px-4 py-2.5 bg-rose-500 text-white rounded-xl text-sm font-medium hover:bg-rose-600 transition disabled:opacity-40"
              >
                Add Transaction
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Vendor Quote Row Component ──

const VendorQuoteRow: React.FC<{ quote: Quote; type: 'accepted' | 'shortlisted' | 'submitted'; budgetAllocated: number }> = ({ quote, type, budgetAllocated }) => {
  const themeVal = useAppStore((s) => s.theme);
  const dk = themeVal === 'dark';
  const meta = CATEGORY_META[quote.category] || { label: quote.category, icon: DollarSign, color: '#6B7280' };
  const Icon = meta.icon;
  const overBudget = budgetAllocated > 0 && quote.total_estimated_price > budgetAllocated;

  const statusStyles = dk ? {
    accepted: 'border-emerald-700 bg-emerald-900/30',
    shortlisted: 'border-amber-700 bg-amber-900/30',
    submitted: 'border-gray-700 bg-gray-800',
  } : {
    accepted: 'border-emerald-200 bg-emerald-50/30',
    shortlisted: 'border-amber-200 bg-amber-50/30',
    submitted: 'border-gray-200 bg-white',
  };

  const statusBadge = {
    accepted: <span className="text-xs font-medium text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Booked</span>,
    shortlisted: <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">Shortlisted</span>,
    submitted: <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${dk ? 'text-gray-400 bg-gray-700' : 'text-gray-600 bg-gray-100'}`}>Pending</span>,
  };

  return (
    <div className={`rounded-xl border p-4 ${statusStyles[type]}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: meta.color }}>
            <Icon className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className={`text-sm font-semibold ${dk ? 'text-gray-100' : 'text-gray-900'}`}>{quote.vendor_name || `Vendor #${quote.vendor_id}`}</p>
            <p className="text-xs text-gray-500">{meta.label}</p>
          </div>
        </div>
        {statusBadge[type]}
      </div>

      <div className="flex items-end justify-between mt-3">
        <div>
          <p className={`text-lg font-bold ${dk ? 'text-gray-100' : 'text-gray-900'}`}>{formatINR(quote.total_estimated_price)}</p>
          {budgetAllocated > 0 && (
            <p className={`text-xs mt-0.5 ${overBudget ? 'text-rose-500' : 'text-gray-400'}`}>
              vs {formatINR(budgetAllocated)} allocated
              {overBudget && (
                <span className="ml-1 font-medium">
                  ({formatINR(quote.total_estimated_price - budgetAllocated)} over)
                </span>
              )}
            </p>
          )}
        </div>
        {quote.vendor_rating && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
            {quote.vendor_rating}
          </div>
        )}
      </div>

      {quote.inclusions && (
        <p className="text-xs text-gray-500 mt-2 line-clamp-1">{quote.inclusions}</p>
      )}
    </div>
  );
};

export default BudgetManagement;
