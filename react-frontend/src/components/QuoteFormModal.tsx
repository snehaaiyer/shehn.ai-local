import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Loader2, Plus, Trash2, ChevronDown, ChevronUp, IndianRupee, AlertTriangle, Check } from 'lucide-react';
import { VendorCategory } from '../types/marketplace';
import { API_BASE, getAuthHeaders } from '../config/api_config';
import { QuoteService } from '../services/quote_service';

// ── Types ──────────────────────────────────────────────────────────────────

interface MenuItem { name: string; qty?: number; price?: number; }
interface MenuSection { name: string; items: MenuItem[]; included_in_base: boolean; }
interface AddOn { name: string; price: number; selected: boolean; }
interface QuoteFormModalProps {
  blueprintId: number;
  category: VendorCategory;
  vendorId: number;
  onClose: () => void;
  onSubmitted: () => void;
}

// ── Helpers ────────────────────────────────────────────────────────────────

const fmtINR = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const GST_RATE = 0.05; // 5% GST for catering/events

// ── Component ──────────────────────────────────────────────────────────────

const QuoteFormModal: React.FC<QuoteFormModalProps> = ({ blueprintId, category, vendorId, onClose, onSubmitted }) => {
  // State
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'form' | 'preview'>('form');
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set([0, 1]));

  // Blueprint context
  const [blueprintSummary, setBlueprintSummary] = useState<any>({});
  const [categoryBudget, setCategoryBudget] = useState(0);

  // Quote data
  const [menuSections, setMenuSections] = useState<MenuSection[]>([]);
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [basePerPlateVeg, setBasePerPlateVeg] = useState(0);
  const [basePerPlateNonveg, setBasePerPlateNonveg] = useState(0);
  const [guestCount, setGuestCount] = useState(200);
  const [includeGST, setIncludeGST] = useState(true);
  const [paymentTerms, setPaymentTerms] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [inclusions, setInclusions] = useState('');
  const [exclusions, setExclusions] = useState('');
  const [serviceDetails, setServiceDetails] = useState<Record<string, string>>({});
  const [vendorHighlights, setVendorHighlights] = useState<string[]>([]);

  // Load blueprint data on mount
  useEffect(() => {
    const loadBlueprint = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/blueprints/${blueprintId}`, { headers: getAuthHeaders() });
        const data = await res.json();
        if (data.success && data.data) {
          const bp = data.data;
          const ws = bp.wedding_summary || {};
          setBlueprintSummary(ws);
          setGuestCount(ws.guest_count || 200);
          // Get category budget
          const catKey = category === 'venue' ? 'venue' : category;
          const budget = bp.budget_breakdown?.[catKey] || bp.category_specs?.[catKey]?.budget_allocated || 0;
          setCategoryBudget(budget);
          // Set default valid_until to 30 days from now
          const d = new Date(); d.setDate(d.getDate() + 30);
          setValidUntil(d.toISOString().split('T')[0]);
        }
      } catch (e) { console.error('Failed to load blueprint:', e); }
    };
    loadBlueprint();
  }, [blueprintId, category]);

  // ── Pricing Calculations ─────────────────────────────────────────────────

  const pricing = useMemo(() => {
    const avgPerPlate = basePerPlateNonveg > 0
      ? Math.round((basePerPlateVeg * 0.6 + basePerPlateNonveg * 0.4)) // weighted avg
      : basePerPlateVeg;
    const baseTotal = avgPerPlate * guestCount;
    const selectedAddOns = addOns.filter(a => a.selected);
    const addOnsTotal = selectedAddOns.reduce((sum, a) => sum + a.price, 0);
    const subtotal = baseTotal + addOnsTotal;
    const gstAmount = includeGST ? Math.round(subtotal * GST_RATE) : 0;
    const grandTotal = subtotal + gstAmount;
    const withinBudget = categoryBudget > 0 ? grandTotal <= categoryBudget : true;
    const utilizationPct = categoryBudget > 0 ? Math.round((grandTotal / categoryBudget) * 100) : 0;

    return { avgPerPlate, baseTotal, selectedAddOns, addOnsTotal, subtotal, gstAmount, grandTotal, withinBudget, utilizationPct };
  }, [basePerPlateVeg, basePerPlateNonveg, guestCount, addOns, includeGST, categoryBudget]);

  // ── AI Quote Builder ─────────────────────────────────────────────────────

  const buildQuoteWithAI = useCallback(async () => {
    setIsLoadingAI(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/ai/build-quote`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ vendor_id: vendorId, blueprint_id: blueprintId, category }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        const q = data.data;
        // Populate menu sections
        if (q.menu_sections?.length > 0) {
          setMenuSections(q.menu_sections.map((s: any) => ({
            name: s.name,
            items: (s.items || []).map((item: any) => ({
              name: item.name || item, qty: item.qty || 1, price: item.price || 0,
            })),
            included_in_base: s.included_in_base !== false,
          })));
        }
        // Populate pricing
        if (q.pricing) {
          setBasePerPlateVeg(q.pricing.base_per_plate_veg || 0);
          setBasePerPlateNonveg(q.pricing.base_per_plate_nonveg || 0);
          if (q.pricing.guest_count) setGuestCount(q.pricing.guest_count);
          if (q.pricing.add_ons?.length > 0) {
            setAddOns(q.pricing.add_ons.map((a: any) => ({
              name: a.name, price: a.price || 0, selected: true,
            })));
          }
        }
        // Populate service details
        if (q.service_details) setServiceDetails(q.service_details);
        // Populate terms
        if (q.terms) {
          setPaymentTerms(q.terms.payment_schedule || '');
          if (q.terms.valid_until) setValidUntil(q.terms.valid_until);
        }
        // Populate highlights
        if (q.vendor_highlights) setVendorHighlights(q.vendor_highlights);
        // Build inclusions/exclusions text
        if (q.service_details) {
          const incl = Object.entries(q.service_details)
            .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`).join('\n');
          setInclusions(incl);
        }
      } else {
        setError(data.error || 'Failed to generate quote');
      }
    } catch (e) {
      setError('Failed to connect to AI service');
    } finally {
      setIsLoadingAI(false);
    }
  }, [vendorId, blueprintId, category]);

  // ── Submit Quote ─────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (pricing.grandTotal <= 0) { setError('Please set pricing before submitting'); return; }
    setIsSubmitting(true);
    setError(null);
    try {
      const quoteData = {
        category,
        vendor_category: category,
        category_pricing: {
          base_per_plate_veg: basePerPlateVeg,
          base_per_plate_nonveg: basePerPlateNonveg,
          guest_count: guestCount,
          menu_sections: menuSections,
          add_ons: addOns.filter(a => a.selected),
          gst_included: includeGST,
          gst_amount: pricing.gstAmount,
        },
        total_estimated_price: pricing.grandTotal,
        package_price: pricing.grandTotal,
        package_description: menuSections.length > 0
          ? `${menuSections.reduce((c, s) => c + s.items.length, 0)} items across ${menuSections.length} courses with ${addOns.filter(a => a.selected).length} add-ons`
          : undefined,
        inclusions,
        exclusions,
        payment_terms: paymentTerms,
        valid_until: validUntil,
        portfolio_links: [],
        service_details: serviceDetails,
        vendor_highlights: vendorHighlights,
      };
      const res = await QuoteService.submitQuote(blueprintId, quoteData);
      if (res.success) {
        onSubmitted();
      } else {
        setError(res.error || 'Failed to submit quote');
      }
    } catch (e) {
      setError('Failed to submit quote');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Menu Section Handlers ────────────────────────────────────────────────

  const toggleSection = (idx: number) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const addMenuItem = (sectionIdx: number) => {
    setMenuSections(prev => prev.map((s, i) =>
      i === sectionIdx ? { ...s, items: [...s.items, { name: '', qty: 1 }] } : s
    ));
  };

  const updateMenuItem = (sectionIdx: number, itemIdx: number, field: string, value: any) => {
    setMenuSections(prev => prev.map((s, i) =>
      i === sectionIdx ? {
        ...s, items: s.items.map((item, j) => j === itemIdx ? { ...item, [field]: value } : item)
      } : s
    ));
  };

  const removeMenuItem = (sectionIdx: number, itemIdx: number) => {
    setMenuSections(prev => prev.map((s, i) =>
      i === sectionIdx ? { ...s, items: s.items.filter((_, j) => j !== itemIdx) } : s
    ));
  };

  const addSection = () => {
    setMenuSections(prev => [...prev, { name: 'New Section', items: [], included_in_base: true }]);
    setExpandedSections(prev => new Set(Array.from(prev).concat(menuSections.length)));
  };

  const addAddOn = () => {
    setAddOns(prev => [...prev, { name: '', price: 0, selected: true }]);
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white w-full sm:max-w-2xl sm:rounded-xl rounded-t-xl max-h-[92vh] flex flex-col shadow-xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 capitalize">
                {step === 'form' ? `Build ${category} Quote` : 'Review & Submit'}
              </h2>
              <p className="text-xs text-gray-500">
                {blueprintSummary.city} • {guestCount} guests • {blueprintSummary.events?.length || 0} events
              </p>
            </div>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100"><X className="w-5 h-5 text-gray-500" /></button>
          </div>

          {/* Budget context bar */}
          {categoryBudget > 0 && (
            <div className={`px-5 py-2 text-sm flex items-center justify-between ${
              pricing.withinBudget ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              <span>Category Budget: <strong>{fmtINR(categoryBudget)}</strong> (max)</span>
              <span className="flex items-center gap-1">
                {pricing.grandTotal > 0 && (
                  <>
                    Your quote: <strong>{fmtINR(pricing.grandTotal)}</strong>
                    {!pricing.withinBudget && <AlertTriangle className="w-4 h-4" />}
                    {pricing.withinBudget && <Check className="w-4 h-4" />}
                    <span className="text-xs">({pricing.utilizationPct}%)</span>
                  </>
                )}
              </span>
            </div>
          )}

          {/* Main content */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
            {error && (
              <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg">{error}</div>
            )}

            {step === 'form' && (
              <>
                {/* AI Build Button */}
                <button
                  onClick={buildQuoteWithAI}
                  disabled={isLoadingAI}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-violet-500 to-rose-500 text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
                >
                  {isLoadingAI ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> AI is building your quote...</>
                  ) : (
                    <><Sparkles className="w-5 h-5" /> Auto-Build Quote with AI</>
                  )}
                </button>

                {/* Base Pricing */}
                <fieldset className="space-y-3">
                  <legend className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                    <IndianRupee className="w-4 h-4" /> Base Pricing
                  </legend>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Per Plate (Veg) *</label>
                      <input type="number" value={basePerPlateVeg || ''} onChange={e => setBasePerPlateVeg(Number(e.target.value))}
                        placeholder="e.g. 900" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-rose-300" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Per Plate (Non-Veg)</label>
                      <input type="number" value={basePerPlateNonveg || ''} onChange={e => setBasePerPlateNonveg(Number(e.target.value))}
                        placeholder="e.g. 1300" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-rose-300" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Guest Count</label>
                      <input type="number" value={guestCount} onChange={e => setGuestCount(Number(e.target.value))}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-rose-300" />
                    </div>
                    <div className="flex items-end pb-1">
                      <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input type="checkbox" checked={includeGST} onChange={e => setIncludeGST(e.target.checked)}
                          className="w-4 h-4 rounded border-gray-300 text-rose-500" />
                        Include 5% GST
                      </label>
                    </div>
                  </div>
                  {basePerPlateVeg > 0 && (
                    <div className="text-xs text-gray-500 bg-gray-50 rounded p-2">
                      Base: {fmtINR(pricing.avgPerPlate)} avg/plate × {guestCount} guests = <strong>{fmtINR(pricing.baseTotal)}</strong>
                    </div>
                  )}
                </fieldset>

                {/* Menu Sections */}
                <fieldset className="space-y-2">
                  <div className="flex items-center justify-between">
                    <legend className="text-sm font-semibold text-gray-800">Menu Sections</legend>
                    <button type="button" onClick={addSection} className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1">
                      <Plus className="w-3 h-3" /> Add Section
                    </button>
                  </div>
                  {menuSections.map((section, si) => (
                    <div key={si} className="border border-gray-200 rounded-lg overflow-hidden">
                      <button type="button" onClick={() => toggleSection(si)}
                        className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 text-sm font-medium text-gray-700">
                        <div className="flex items-center gap-2">
                          <input value={section.name} onClick={e => e.stopPropagation()}
                            onChange={e => setMenuSections(prev => prev.map((s, i) => i === si ? { ...s, name: e.target.value } : s))}
                            className="bg-transparent border-none p-0 text-sm font-medium text-gray-700 focus:ring-0 focus:outline-none"
                          />
                          <span className="text-xs text-gray-400">({section.items.length} items)</span>
                        </div>
                        {expandedSections.has(si) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      {expandedSections.has(si) && (
                        <div className="p-3 space-y-2">
                          {section.items.map((item, ii) => (
                            <div key={ii} className="flex items-center gap-2">
                              <input value={item.name} onChange={e => updateMenuItem(si, ii, 'name', e.target.value)}
                                placeholder="Item name" className="flex-1 rounded border border-gray-200 px-2 py-1 text-sm" />
                              {!section.included_in_base && (
                                <input type="number" value={item.price || ''} onChange={e => updateMenuItem(si, ii, 'price', Number(e.target.value))}
                                  placeholder="₹" className="w-20 rounded border border-gray-200 px-2 py-1 text-sm" />
                              )}
                              <button type="button" onClick={() => removeMenuItem(si, ii)} className="text-gray-400 hover:text-red-500">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                          <button type="button" onClick={() => addMenuItem(si)}
                            className="text-xs text-gray-500 hover:text-rose-600 flex items-center gap-1 mt-1">
                            <Plus className="w-3 h-3" /> Add item
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                  {menuSections.length === 0 && (
                    <p className="text-sm text-gray-400 italic text-center py-4">
                      Click "Auto-Build Quote with AI" to generate menu sections, or add them manually.
                    </p>
                  )}
                </fieldset>

                {/* Add-ons */}
                <fieldset className="space-y-2">
                  <div className="flex items-center justify-between">
                    <legend className="text-sm font-semibold text-gray-800">Add-Ons & Extras</legend>
                    <button type="button" onClick={addAddOn} className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1">
                      <Plus className="w-3 h-3" /> Add
                    </button>
                  </div>
                  {addOns.map((addon, ai) => (
                    <div key={ai} className="flex items-center gap-2">
                      <input type="checkbox" checked={addon.selected}
                        onChange={e => setAddOns(prev => prev.map((a, i) => i === ai ? { ...a, selected: e.target.checked } : a))}
                        className="w-4 h-4 rounded border-gray-300 text-rose-500" />
                      <input value={addon.name}
                        onChange={e => setAddOns(prev => prev.map((a, i) => i === ai ? { ...a, name: e.target.value } : a))}
                        placeholder="Add-on name" className="flex-1 rounded border border-gray-200 px-2 py-1 text-sm" />
                      <div className="flex items-center">
                        <span className="text-xs text-gray-400 mr-1">₹</span>
                        <input type="number" value={addon.price || ''}
                          onChange={e => setAddOns(prev => prev.map((a, i) => i === ai ? { ...a, price: Number(e.target.value) } : a))}
                          placeholder="0" className="w-24 rounded border border-gray-200 px-2 py-1 text-sm" />
                      </div>
                      <button type="button" onClick={() => setAddOns(prev => prev.filter((_, i) => i !== ai))}
                        className="text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  ))}
                </fieldset>

                {/* Terms & Details */}
                <fieldset className="space-y-3 border-t border-gray-100 pt-4">
                  <legend className="text-sm font-semibold text-gray-800">Terms & Details</legend>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Inclusions *</label>
                    <textarea value={inclusions} onChange={e => setInclusions(e.target.value)} rows={3}
                      placeholder="What's included in the base price..." className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-rose-300 resize-none" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Exclusions</label>
                    <textarea value={exclusions} onChange={e => setExclusions(e.target.value)} rows={2}
                      placeholder="What's NOT included..." className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-rose-300 resize-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Payment Terms *</label>
                      <textarea value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} rows={2}
                        placeholder="30% advance, 40% 1 week before, 30% event day" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-rose-300 resize-none" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Valid Until *</label>
                      <input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-rose-300" />
                    </div>
                  </div>
                </fieldset>

                {/* Vendor Highlights */}
                {vendorHighlights.length > 0 && (
                  <div className="bg-violet-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-violet-700 mb-1">Your Highlights (visible to couple):</p>
                    <ul className="text-xs text-violet-600 space-y-0.5">
                      {vendorHighlights.map((h, i) => <li key={i}>• {h}</li>)}
                    </ul>
                  </div>
                )}
              </>
            )}

            {step === 'preview' && (
              <>
                {/* Quote Preview */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-800">Quote Summary</h3>

                  {/* Menu preview */}
                  {menuSections.length > 0 && (
                    <div className="space-y-2">
                      {menuSections.map((section, si) => (
                        <div key={si} className="bg-gray-50 rounded-lg p-3">
                          <h4 className="text-sm font-medium text-gray-700 mb-1">{section.name}</h4>
                          <div className="flex flex-wrap gap-1">
                            {section.items.map((item, ii) => (
                              <span key={ii} className="text-xs bg-white px-2 py-0.5 rounded border border-gray-200">
                                {item.name}{item.price ? ` (${fmtINR(item.price)})` : ''}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Pricing breakdown */}
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Base ({fmtINR(pricing.avgPerPlate)}/plate × {guestCount})</span>
                      <span className="font-medium">{fmtINR(pricing.baseTotal)}</span>
                    </div>
                    {pricing.selectedAddOns.map((a, i) => (
                      <div key={i} className="flex justify-between text-sm text-gray-600">
                        <span>+ {a.name}</span>
                        <span>{fmtINR(a.price)}</span>
                      </div>
                    ))}
                    {pricing.addOnsTotal > 0 && (
                      <div className="flex justify-between text-sm border-t border-gray-200 pt-1">
                        <span>Subtotal</span>
                        <span className="font-medium">{fmtINR(pricing.subtotal)}</span>
                      </div>
                    )}
                    {includeGST && (
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>GST (5%)</span>
                        <span>{fmtINR(pricing.gstAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-base font-bold border-t border-gray-300 pt-2">
                      <span>Grand Total</span>
                      <span className={pricing.withinBudget ? 'text-green-700' : 'text-red-700'}>
                        {fmtINR(pricing.grandTotal)}
                      </span>
                    </div>
                    {categoryBudget > 0 && (
                      <div className={`text-xs mt-1 ${pricing.withinBudget ? 'text-green-600' : 'text-red-600'}`}>
                        {pricing.withinBudget
                          ? `✅ Within budget (${pricing.utilizationPct}% of ${fmtINR(categoryBudget)})`
                          : `⚠️ Over budget by ${fmtINR(pricing.grandTotal - categoryBudget)}`}
                      </div>
                    )}
                  </div>

                  {/* Terms */}
                  {paymentTerms && (
                    <div className="text-sm">
                      <p className="font-medium text-gray-700 mb-1">Payment Terms:</p>
                      <p className="text-gray-600">{paymentTerms}</p>
                    </div>
                  )}
                  {inclusions && (
                    <div className="text-sm">
                      <p className="font-medium text-gray-700 mb-1">Inclusions:</p>
                      <p className="text-gray-600 whitespace-pre-line">{inclusions}</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-5 py-3 bg-gray-50 rounded-b-xl">
            {/* Live total */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-600">
                {step === 'form' ? 'Live Total' : 'Final Quote'}
              </span>
              <span className={`text-xl font-bold ${pricing.withinBudget ? 'text-gray-900' : 'text-red-600'}`}>
                {fmtINR(pricing.grandTotal)}
              </span>
            </div>
            <div className="flex gap-3">
              {step === 'form' ? (
                <>
                  <button type="button" onClick={onClose}
                    className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-100">
                    Cancel
                  </button>
                  <button type="button" onClick={() => setStep('preview')}
                    disabled={pricing.grandTotal <= 0}
                    className="flex-1 px-4 py-2.5 rounded-lg bg-rose-500 text-white text-sm font-medium hover:bg-rose-600 disabled:opacity-50">
                    Preview Quote →
                  </button>
                </>
              ) : (
                <>
                  <button type="button" onClick={() => setStep('form')}
                    className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-100">
                    ← Edit
                  </button>
                  <button type="button" onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2.5 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2">
                    {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : 'Submit Quote ✓'}
                  </button>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default QuoteFormModal;
