import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  FileText, Edit3, Check, ChevronDown, ChevronUp, Globe, Lock, Users,
  MapPin, Calendar, IndianRupee, Sparkles, Building2, Camera,
  UtensilsCrossed, Flower2, Music
} from 'lucide-react';
import { BlueprintService } from '../services/blueprint_service';
import { MarketplaceAIService, BudgetOptimization } from '../services/marketplace_ai_service';
import { Blueprint, VendorCategory, CategorySpec } from '../types/marketplace';
import { useAppStore } from '../store/useAppStore';
import { getThemeImage } from '../config/theme_images';

// ── Helpers ──

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

const categoryIcons: Record<VendorCategory, React.ElementType> = {
  venue: Building2,
  photography: Camera,
  catering: UtensilsCrossed,
  decoration: Flower2,
  makeup: Sparkles,
  entertainment: Music,
};

const categoryLabels: Record<VendorCategory, string> = {
  venue: 'Venue',
  photography: 'Photography',
  catering: 'Catering',
  decoration: 'Decoration',
  makeup: 'Makeup',
  entertainment: 'Entertainment',
};

const statusBadge: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  published: 'bg-sage-100 text-sage-700',
  closed: 'bg-rose-100 text-rose-600',
};

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

// ── Component ──

const BlueprintReview: React.FC = () => {
  const blueprintId = useAppStore((s) => s.blueprintId);
  const setBlueprintId = useAppStore((s) => s.setBlueprintId);
  const weddingPreferences = useAppStore((s) => s.weddingPreferences);
  const theme = useAppStore((s) => s.theme);
  const isDark = theme === 'dark';

  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  // AI state
  const [budgetOptimization, setBudgetOptimization] = useState<BudgetOptimization | null>(null);
  const [optimizing, setOptimizing] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Inline toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  }, []);

  // ── Load blueprint ──
  useEffect(() => {
    if (!blueprintId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const res = await BlueprintService.getBlueprint(blueprintId);
      if (!cancelled && res.success && res.data) setBlueprint(res.data);
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [blueprintId]);

  // ── Inline edit helpers ──
  const startEdit = (field: string) => setEditingField(field);

  const saveField = useCallback(async (field: string, value: any) => {
    if (!blueprint) return;
    const patch: any = {};

    // Determine where the field lives
    if (['date', 'city', 'guest_count', 'theme', 'budget'].includes(field)) {
      patch.wedding_summary = { ...blueprint.wedding_summary, [field]: value };
    } else if (field.startsWith('budget_')) {
      const cat = field.replace('budget_', '') as VendorCategory;
      patch.budget_breakdown = { ...blueprint.budget_breakdown, [cat]: Number(value) };
      patch.category_specs = {
        ...blueprint.category_specs,
        [cat]: { ...blueprint.category_specs[cat], budget_allocated: Number(value) },
      };
    }

    const res = await BlueprintService.updateBlueprint(blueprint.id, patch);
    if (res.success) {
      setBlueprint((prev) => (prev ? { ...prev, ...patch } : prev));
      showToast('Saved');
    }
    setEditingField(null);
  }, [blueprint, showToast]);

  // ── Publish / Unpublish ──
  const handlePublishToggle = useCallback(async () => {
    if (!blueprint) return;
    const action = blueprint.status === 'published' ? 'unpublish' : 'publish';
    if (!window.confirm(`Are you sure you want to ${action} this blueprint?`)) return;

    setIsPublishing(true);
    const res = action === 'publish'
      ? await BlueprintService.publishBlueprint(blueprint.id)
      : await BlueprintService.unpublishBlueprint(blueprint.id);

    if (res.success) {
      setBlueprint((prev) =>
        prev
          ? {
              ...prev,
              status: action === 'publish' ? 'published' : 'draft',
              published_at: action === 'publish' ? new Date().toISOString() : null,
            }
          : prev
      );
      showToast(action === 'publish' ? 'Blueprint published to marketplace!' : 'Blueprint unpublished');
    }
    setIsPublishing(false);
  }, [blueprint, showToast]);

  // ── Toggle category accordion ──
  const toggleCategory = (cat: string) =>
    setExpandedCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));

  // ── AI: Optimize Budget ──
  const handleOptimizeBudget = useCallback(async () => {
    if (!blueprint) return;
    setOptimizing(true);
    try {
      const res = await MarketplaceAIService.optimizeBudget(
        blueprint.budget_breakdown,
        {},
        blueprint.wedding_summary
      );
      if (res.success && res.data) {
        setBudgetOptimization(res.data);
      } else {
        showToast(res.error || 'Budget optimization failed');
      }
    } catch {
      showToast('Budget optimization failed');
    }
    setOptimizing(false);
  }, [blueprint, showToast]);

  const handleApplyRecommended = useCallback(async () => {
    if (!blueprint || !budgetOptimization?.recommended_reallocation) return;
    const patch = {
      budget_breakdown: { ...blueprint.budget_breakdown, ...budgetOptimization.recommended_reallocation },
    };
    const res = await BlueprintService.updateBlueprint(blueprint.id, patch);
    if (res.success) {
      setBlueprint((prev) => (prev ? { ...prev, ...patch } : prev));
      showToast('Budget updated with AI recommendations');
      setBudgetOptimization(null);
    }
  }, [blueprint, budgetOptimization, showToast]);

  // ── AI: Generate / Update Blueprint ──
  const handleGenerateBlueprint = useCallback(async () => {
    setGenerating(true);
    try {
      if (blueprintId && blueprint) {
        // Partial update — only send changed preferences, don't regenerate from scratch
        const patch: Partial<Blueprint> = {
          wedding_summary: {
            ...blueprint.wedding_summary,
            city: weddingPreferences.city || blueprint.wedding_summary.city,
            guest_count: Number(weddingPreferences.guestCount) || blueprint.wedding_summary.guest_count,
            budget: Number(weddingPreferences.budget) || blueprint.wedding_summary.budget,
            date: weddingPreferences.weddingDate || blueprint.wedding_summary.date,
            theme: (weddingPreferences as any).theme || blueprint.wedding_summary.theme,
            events: weddingPreferences.events?.length ? weddingPreferences.events : blueprint.wedding_summary.events,
          },
        };
        const res = await BlueprintService.updateBlueprint(blueprintId, patch);
        if (res.success) {
          setBlueprint((prev) => (prev ? { ...prev, ...patch } : prev));
          showToast('Blueprint updated successfully!');
        } else {
          showToast(res.error || 'Blueprint update failed');
        }
      } else {
        // Full generation — no existing blueprint
        const res = await MarketplaceAIService.generateBlueprint({
          city: weddingPreferences.city || 'Mumbai',
          guest_count: Number(weddingPreferences.guestCount) || 200,
          budget: weddingPreferences.budget || '2000000',
          wedding_date: weddingPreferences.weddingDate || '',
          wedding_type: weddingPreferences.weddingType || 'Hindu',
          events: weddingPreferences.events || [],
          priorities: weddingPreferences.priorities || [],
          special_requirements: weddingPreferences.specialRequirements || undefined,
        });
        if (res.success && res.data?.id) {
          setBlueprintId(res.data.id);
          showToast('Blueprint generated successfully!');
        } else {
          showToast(res.error || 'Blueprint generation failed');
        }
      }
    } catch {
      showToast(blueprintId ? 'Blueprint update failed' : 'Blueprint generation failed');
    }
    setGenerating(false);
  }, [weddingPreferences, blueprintId, blueprint, setBlueprintId, showToast]);

  // ── Budget total ──
  const budgetTotal = blueprint
    ? Object.values(blueprint.budget_breakdown).reduce((s, v) => s + v, 0)
    : 0;

  // ── Render ──

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-rose-300 border-t-rose-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!blueprintId || !blueprint) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className={`rounded-xl border shadow-sm p-8 text-center max-w-md ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <FileText className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-gray-500' : 'text-gray-300'}`} />
          <h2 className={`text-lg font-semibold mb-2 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>No blueprint yet</h2>
          <p className="text-sm text-gray-500 mb-4">Go to Preferences to generate one, or let AI create one for you.</p>
          <div className="flex items-center gap-3 justify-center">
            <a
              href="/preferences"
              className="inline-block px-5 py-2 rounded-lg bg-rose-500 text-white text-sm font-medium hover:bg-rose-600 transition-colors"
            >
              Go to Preferences
            </a>
            <button
              onClick={handleGenerateBlueprint}
              disabled={generating}
              className={`inline-flex items-center gap-1.5 px-5 py-2 rounded-lg border text-sm font-medium transition-colors disabled:opacity-50 ${isDark ? 'border-rose-700 text-rose-400 hover:bg-rose-900/30' : 'border-rose-300 text-rose-600 hover:bg-rose-50'}`}
            >
              <Sparkles className="w-4 h-4" />
              {generating ? 'Generating...' : 'Generate with AI'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const ws = blueprint.wedding_summary || { date: '', city: '', guest_count: 0, budget: 0, theme: '', events: [] };
  const categories = blueprint.budget_breakdown ? (Object.keys(blueprint.budget_breakdown) as VendorCategory[]) : [];

  return (
    <div className={`max-w-4xl mx-auto px-4 py-8 space-y-8`}>
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-6 right-6 z-50 bg-gray-900 text-white text-sm px-4 py-2 rounded-lg shadow-lg animate-fade-in">
          {toastMsg}
        </div>
      )}

      {/* ── Header ── */}
      <motion.div variants={sectionVariants} initial="hidden" animate="visible" className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className={`text-xl sm:text-2xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>My Wedding Blueprint</h1>
          <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full capitalize ${statusBadge[blueprint.status]}`}>
            {blueprint.status}
          </span>
        </div>
        <div className="flex items-center gap-2">
        <button
          onClick={handleGenerateBlueprint}
          disabled={generating}
          className={`flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg border transition-colors disabled:opacity-50 ${isDark ? 'border-rose-700 text-rose-400 hover:bg-rose-900/30' : 'border-rose-300 text-rose-600 hover:bg-rose-50'}`}
        >
          <Sparkles className="w-4 h-4" />
          {generating ? 'Updating...' : 'Update Blueprint'}
        </button>
        <button
          onClick={handlePublishToggle}
          disabled={isPublishing}
          className={`flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50 ${
            blueprint.status === 'published'
              ? isDark ? 'border border-gray-600 text-gray-300 hover:bg-gray-700' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
              : 'bg-rose-500 text-white hover:bg-rose-600'
          }`}
        >
          {blueprint.status === 'published' ? (
            <>
              <Lock className="w-4 h-4" /> Unpublish
            </>
          ) : (
            <>
              <Globe className="w-4 h-4" /> Publish to Marketplace
            </>
          )}
        </button>
        </div>
      </motion.div>

      {/* ── Theme Hero Image ── */}
      <motion.div variants={sectionVariants} initial="hidden" animate="visible" transition={{ delay: 0.03 }}
        className="relative rounded-xl overflow-hidden h-48 sm:h-56">
        <img
          src={getThemeImage(ws.theme)}
          alt={ws.theme || 'Wedding theme'}
          className="w-full h-full object-cover"
          onError={(e) => { (e.target as HTMLImageElement).src = '/classic contemporary.png'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/70 via-gray-900/20 to-transparent" />
        <div className="absolute bottom-4 left-5 right-5 text-white">
          <p className="text-xs font-medium uppercase tracking-wider opacity-80">Wedding Theme</p>
          <h2 className="text-xl font-bold capitalize">{ws.theme || 'Classic'}</h2>
          <p className="text-sm opacity-80 mt-0.5">{ws.city} &middot; {ws.events?.length || 0} events &middot; {ws.guest_count} guests</p>
        </div>
      </motion.div>

      {/* ── Wedding Summary ── */}
      <motion.div variants={sectionVariants} initial="hidden" animate="visible" transition={{ delay: 0.05 }} className={`rounded-xl border shadow-sm p-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Wedding Summary</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Date */}
          <SummaryCell
            icon={<Calendar className="w-4 h-4 text-rose-400" />}
            label="Date"
            value={ws.date || 'TBD'}
            isEditing={editingField === 'date'}
            onStartEdit={() => startEdit('date')}
            onSave={(v) => saveField('date', v)}
            inputType="date"
            isDark={isDark}
          />
          {/* City */}
          <SummaryCell
            icon={<MapPin className="w-4 h-4 text-rose-400" />}
            label="City"
            value={ws.city || 'TBD'}
            isEditing={editingField === 'city'}
            onStartEdit={() => startEdit('city')}
            onSave={(v) => saveField('city', v)}
            isDark={isDark}
          />
          {/* Guests */}
          <SummaryCell
            icon={<Users className="w-4 h-4 text-rose-400" />}
            label="Guests"
            value={String(ws.guest_count || 0)}
            isEditing={editingField === 'guest_count'}
            onStartEdit={() => startEdit('guest_count')}
            onSave={(v) => saveField('guest_count', Number(v))}
            inputType="number"
            isDark={isDark}
          />
          {/* Theme */}
          <SummaryCell
            icon={<Sparkles className="w-4 h-4 text-rose-400" />}
            label="Theme"
            value={ws.theme || 'Classic'}
            isEditing={editingField === 'theme'}
            onStartEdit={() => startEdit('theme')}
            onSave={(v) => saveField('theme', v)}
            isDark={isDark}
          />
          {/* Budget */}
          <SummaryCell
            icon={<IndianRupee className="w-4 h-4 text-rose-400" />}
            label="Budget"
            value={formatCurrency(ws.budget || 0)}
            isEditing={editingField === 'budget'}
            onStartEdit={() => startEdit('budget')}
            onSave={(v) => saveField('budget', Number(v))}
            inputType="number"
            rawValue={String(ws.budget || 0)}
            isDark={isDark}
          />
          {/* Events */}
          <div className="flex items-start gap-3">
            <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-rose-900/30' : 'bg-rose-50'}`}>
              <FileText className="w-4 h-4 text-rose-400" />
            </div>
            <div>
              <span className="text-xs text-gray-400 font-medium">Events</span>
              <p className={`text-sm font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{ws.events?.length ?? 0} events</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Budget Breakdown ── */}
      <motion.div variants={sectionVariants} initial="hidden" animate="visible" transition={{ delay: 0.1 }} className={`rounded-xl border shadow-sm p-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Budget Breakdown</h2>
          <button
            onClick={handleOptimizeBudget}
            disabled={optimizing}
            className={`flex items-center gap-1.5 text-xs font-medium rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50 ${isDark ? 'text-rose-400 border border-rose-700 hover:bg-rose-900/30' : 'text-rose-600 border border-rose-200 hover:bg-rose-50'}`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            {optimizing ? 'Optimizing...' : 'AI Budget Optimizer'}
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => {
            const Icon = categoryIcons[cat] || FileText;
            const amount = blueprint.budget_breakdown[cat] ?? 0;
            const isEdit = editingField === `budget_${cat}`;
            return (
              <div
                key={cat}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors group cursor-pointer ${isDark ? 'border-gray-700 hover:border-gray-600' : 'border-gray-100 hover:border-gray-200'}`}
                onClick={() => !isEdit && startEdit(`budget_${cat}`)}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${isDark ? 'bg-rose-900/30' : 'bg-rose-50'}`}>
                  <Icon className="w-4 h-4 text-rose-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-gray-400 font-medium capitalize">{categoryLabels[cat]}</span>
                  {isEdit ? (
                    <input
                      autoFocus
                      type="number"
                      defaultValue={amount}
                      className={`block w-full text-sm font-semibold border-b border-rose-300 outline-none bg-transparent ${isDark ? 'text-gray-100' : 'text-gray-900'}`}
                      onBlur={(e) => saveField(`budget_${cat}`, e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                    />
                  ) : (
                    <p className={`text-sm font-semibold flex items-center gap-1 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                      {formatCurrency(amount)}
                      <Edit3 className="w-3 h-3 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className={`mt-4 pt-3 border-t flex items-center justify-between ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
          <span className="text-sm text-gray-500 font-medium">Total Allocated</span>
          <span className={`text-lg font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{formatCurrency(budgetTotal)}</span>
        </div>

        {/* AI Budget Optimization Results */}
        {budgetOptimization && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-4 p-4 border rounded-xl space-y-3 ${isDark ? 'bg-rose-900/30 border-rose-800' : 'bg-rose-50 border-rose-100'}`}
          >
            <div className="flex items-center justify-between">
              <h3 className={`text-sm font-semibold flex items-center gap-2 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                <Sparkles className="w-4 h-4 text-rose-500" /> AI Optimization Results
              </h3>
              <button onClick={() => setBudgetOptimization(null)} className="text-xs text-gray-400 hover:text-gray-600">Dismiss</button>
            </div>
            {/* Suggestions */}
            <ul className="space-y-1">
              {budgetOptimization.suggestions.map((s, i) => (
                <li key={i} className={`text-sm flex items-start gap-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />{s}
                </li>
              ))}
            </ul>
            {/* Potential Savings */}
            <div className="bg-sage-50 border border-sage-200 rounded-lg p-2.5">
              <p className="text-sm font-medium text-sage-700">Potential Savings: {budgetOptimization.potential_savings}</p>
            </div>
            {/* Priority Spend */}
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}><strong>Priority:</strong> {budgetOptimization.priority_spend}</p>
            {/* Apply Button */}
            {budgetOptimization.recommended_reallocation && Object.keys(budgetOptimization.recommended_reallocation).length > 0 && (
              <button
                onClick={handleApplyRecommended}
                className="w-full mt-1 py-2 text-sm font-medium text-white bg-rose-500 rounded-lg hover:bg-rose-600 transition-colors"
              >
                Apply Recommended Reallocation
              </button>
            )}
          </motion.div>
        )}
      </motion.div>

      {/* ── Category Requirements ── */}
      <motion.div variants={sectionVariants} initial="hidden" animate="visible" transition={{ delay: 0.15 }} className={`rounded-xl border shadow-sm p-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Category Requirements</h2>
        <div className="space-y-2">
          {categories.map((cat) => {
            const spec: CategorySpec | undefined = blueprint.category_specs?.[cat];
            const isOpen = !!expandedCategories[cat];
            const Icon = categoryIcons[cat] || FileText;
            const reqs = spec?.requirements || {};
            const reqEntries = Object.entries(reqs);

            return (
              <div key={cat} className={`border rounded-lg overflow-hidden ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                <button
                  onClick={() => toggleCategory(cat)}
                  className={`w-full flex items-center justify-between px-4 py-3 transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-rose-400" />
                    <span className={`text-sm font-semibold capitalize ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{categoryLabels[cat]}</span>
                    {reqEntries.length > 0 && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>{reqEntries.length} specs</span>
                    )}
                  </div>
                  <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </motion.div>
                </button>
                {isOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-4 pb-4">
                    {reqEntries.length > 0 ? (
                      <div className="space-y-2">
                        {reqEntries.map(([key, val]) => (
                          <div key={key} className="flex items-start gap-2 text-sm">
                            <span className="text-gray-500 font-medium min-w-[120px] capitalize">{key.replace(/_/g, ' ')}:</span>
                            <span className={isDark ? 'text-gray-200' : 'text-gray-800'}>{typeof val === 'object' ? JSON.stringify(val) : String(val)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 italic">No specific requirements set</p>
                    )}
                    {spec?.notes && (
                      <div className={`mt-3 p-3 rounded-lg ${isDark ? 'bg-rose-900/30' : 'bg-rose-50'}`}>
                        <p className={`text-xs font-medium mb-1 ${isDark ? 'text-rose-400' : 'text-rose-700'}`}>Notes</p>
                        <p className={`text-sm ${isDark ? 'text-rose-300' : 'text-rose-800'}`}>{spec.notes}</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* ── Timeline ── */}
      {blueprint.timeline && blueprint.timeline.length > 0 && (
        <motion.div variants={sectionVariants} initial="hidden" animate="visible" transition={{ delay: 0.2 }} className={`rounded-xl border shadow-sm p-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Timeline</h2>
          <ul className="space-y-3">
            {blueprint.timeline.map((item: any, idx: number) => (
              <li key={idx} className="flex items-start gap-3">
                <div className="mt-1 w-2 h-2 rounded-full bg-rose-400 shrink-0" />
                <div>
                  <p className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{item.title || item.event || item}</p>
                  {item.date && <p className="text-xs text-gray-400">{item.date}</p>}
                  {item.description && <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>}
                </div>
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* ── Cost-Saving Tips ── */}
      {blueprint.cost_saving_tips && blueprint.cost_saving_tips.length > 0 && (
        <motion.div variants={sectionVariants} initial="hidden" animate="visible" transition={{ delay: 0.25 }} className={`rounded-xl border shadow-sm p-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-rose-400" /> Cost-Saving Tips
          </h2>
          <ul className="space-y-2">
            {blueprint.cost_saving_tips.map((tip, idx) => (
              <li key={idx} className={`flex items-start gap-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                <Check className="w-4 h-4 text-sage-500 shrink-0 mt-0.5" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}
    </div>
  );
};

// ── Inline-editable Summary Cell ──

interface SummaryCellProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  isEditing: boolean;
  onStartEdit: () => void;
  onSave: (value: string) => void;
  inputType?: string;
  rawValue?: string;
  isDark?: boolean;
}

const SummaryCell: React.FC<SummaryCellProps> = ({ icon, label, value, isEditing, onStartEdit, onSave, inputType = 'text', rawValue, isDark }) => (
  <div className="flex items-start gap-3 cursor-pointer group" onClick={() => !isEditing && onStartEdit()}>
    <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-rose-900/30' : 'bg-rose-50'}`}>{icon}</div>
    <div className="flex-1 min-w-0">
      <span className="text-xs text-gray-400 font-medium">{label}</span>
      {isEditing ? (
        <input
          autoFocus
          type={inputType}
          defaultValue={rawValue || value}
          className={`block w-full text-sm font-semibold border-b border-rose-300 outline-none bg-transparent ${isDark ? 'text-gray-100' : 'text-gray-900'}`}
          onBlur={(e) => onSave(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
        />
      ) : (
        <p className={`text-sm font-semibold flex items-center gap-1 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
          {value}
          <Edit3 className="w-3 h-3 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
        </p>
      )}
    </div>
  </div>
);

export default BlueprintReview;
