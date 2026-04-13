import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Star, ChevronDown, ChevronUp, IndianRupee, UtensilsCrossed, Check, X as XIcon } from 'lucide-react';
import { Quote, QuoteStatus } from '../types/marketplace';

interface QuoteCardProps {
  quote: Quote;
  budgetAllocated: number;
  onAction: (action: QuoteStatus) => void;
  onChat: () => void;
  onNegotiate?: () => void;
  expanded?: boolean;
  onToggleExpand?: () => void;
}

const formatINR = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

// ── Structured pricing display ──

interface MenuSection { name: string; items: Array<{ name: string; qty?: number; price?: number }>; included_in_base: boolean; }
interface AddOn { name: string; price: number; selected: boolean; }

function hasStructuredPricing(pricing: Record<string, any>): boolean {
  return !!(pricing?.menu_sections?.length > 0 || pricing?.add_ons?.length > 0 || pricing?.base_per_plate_veg);
}

function flatPricingSummary(pricing: Record<string, any>): string {
  const entries = Object.entries(pricing)
    .filter(([k]) => !['menu_sections', 'add_ons', 'gst_included', 'gst_amount', 'guest_count'].includes(k))
    .slice(0, 3);
  return entries.map(([k, v]) => {
    const label = k.replace(/_/g, ' ');
    const val = typeof v === 'number' ? formatINR(v) : String(v);
    return `${label}: ${val}`;
  }).join(' · ');
}

// ── Component ──

const QuoteCard: React.FC<QuoteCardProps> = ({ quote, budgetAllocated, onAction, onChat, onNegotiate, expanded, onToggleExpand }) => {
  const [localExpanded, setLocalExpanded] = useState(false);
  const isExpanded = expanded !== undefined ? expanded : localExpanded;
  const toggleExpand = onToggleExpand || (() => setLocalExpanded(p => !p));

  const total = quote.total_estimated_price;
  const pricing = quote.category_pricing || {};
  const pct = budgetAllocated > 0 ? (total / budgetAllocated) * 100 : 0;
  const structured = hasStructuredPricing(pricing);

  let barColor = 'bg-gray-400';
  let budgetLabel = 'Within budget';
  if (pct > 120) { barColor = 'bg-rose-500'; budgetLabel = 'Over budget'; }
  else if (pct > 100) { barColor = 'bg-rose-300'; budgetLabel = 'Slightly over'; }

  const barWidth = Math.min(pct, 150);

  // Extract structured data
  const menuSections: MenuSection[] = pricing.menu_sections || [];
  const addOns: AddOn[] = (pricing.add_ons || []).filter((a: any) => a.selected !== false);
  const gstIncluded = pricing.gst_included;
  const gstAmount = pricing.gst_amount || 0;
  const baseVeg = pricing.base_per_plate_veg || 0;
  const baseNonveg = pricing.base_per_plate_nonveg || 0;
  const guestCount = pricing.guest_count || 0;

  const statusColors: Record<string, string> = {
    submitted: 'bg-blue-50 text-blue-600 border-blue-200',
    shortlisted: 'bg-amber-50 text-amber-700 border-amber-200',
    accepted: 'bg-green-50 text-green-700 border-green-200',
    rejected: 'bg-gray-50 text-gray-400 border-gray-200',
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className="px-5 pt-4 pb-3 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">{quote.vendor_name || 'Vendor'}</h3>
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${statusColors[quote.status] || statusColors.submitted}`}>
              {quote.status}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5 text-sm text-gray-500">
            {quote.vendor_rating != null && (
              <span className="flex items-center gap-0.5">
                <Star className="w-3.5 h-3.5 text-rose-400 fill-rose-400" /> {quote.vendor_rating}
              </span>
            )}
            {quote.vendor_experience != null && (
              <span>{quote.vendor_experience} yrs exp</span>
            )}
            <span className="capitalize text-gray-400">{quote.category}</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-gray-900">{formatINR(total)}</p>
          {gstIncluded && gstAmount > 0 && (
            <p className="text-[10px] text-gray-400">incl. {formatINR(gstAmount)} GST</p>
          )}
          {quote.package_price != null && quote.package_price !== total && (
            <p className="text-xs text-gray-400">Package: {formatINR(quote.package_price)}</p>
          )}
        </div>
      </div>

      <div className="px-5 space-y-3 pb-4">
        {/* Quick pricing summary (always shown) */}
        {structured ? (
          <div className="flex flex-wrap gap-2 text-xs">
            {baseVeg > 0 && (
              <span className="bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                <IndianRupee className="w-3 h-3 inline -mt-0.5" />{baseVeg.toLocaleString('en-IN')}/plate veg
              </span>
            )}
            {baseNonveg > 0 && (
              <span className="bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                <IndianRupee className="w-3 h-3 inline -mt-0.5" />{baseNonveg.toLocaleString('en-IN')}/plate NV
              </span>
            )}
            {guestCount > 0 && (
              <span className="bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                {guestCount} guests
              </span>
            )}
            {menuSections.length > 0 && (
              <span className="bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                <UtensilsCrossed className="w-3 h-3 inline -mt-0.5" /> {menuSections.reduce((c, s) => c + s.items.length, 0)} items
              </span>
            )}
            {addOns.length > 0 && (
              <span className="bg-rose-50 px-2 py-1 rounded-md border border-rose-100 text-rose-600">
                +{addOns.length} add-ons
              </span>
            )}
          </div>
        ) : (
          <p className="text-xs text-gray-500">{flatPricingSummary(pricing)}</p>
        )}

        {/* Budget bar */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-gray-500">vs Budget: {budgetAllocated > 0 ? formatINR(budgetAllocated) : 'Not set'}</span>
            <span className={`font-medium ${pct > 120 ? 'text-rose-600' : pct > 100 ? 'text-rose-500' : 'text-gray-600'}`}>
              {budgetAllocated > 0 ? `${Math.round(pct)}% — ${budgetLabel}` : '—'}
            </span>
          </div>
          {budgetAllocated > 0 && (
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
              <div className={`h-full rounded-full ${barColor} transition-all`} style={{ width: `${Math.min(barWidth / 1.5, 100)}%` }} />
            </div>
          )}
        </div>

        {/* Expand/collapse for structured quote details */}
        {structured && (
          <button
            onClick={toggleExpand}
            className="flex items-center gap-1 text-xs font-medium text-rose-500 hover:text-rose-600 transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {isExpanded ? 'Hide details' : 'View full breakdown'}
          </button>
        )}

        {/* Expanded structured breakdown */}
        <AnimatePresence>
          {isExpanded && structured && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden space-y-3"
            >
              {/* Pricing Table */}
              <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Pricing Breakdown</h4>
                <table className="w-full text-xs">
                  <tbody>
                    {baseVeg > 0 && (
                      <tr className="border-b border-gray-100">
                        <td className="py-1.5 text-gray-600">Veg per plate × {guestCount}</td>
                        <td className="py-1.5 text-right font-medium text-gray-800">{formatINR(baseVeg * guestCount)}</td>
                      </tr>
                    )}
                    {baseNonveg > 0 && (
                      <tr className="border-b border-gray-100">
                        <td className="py-1.5 text-gray-600">Non-veg per plate × {guestCount}</td>
                        <td className="py-1.5 text-right font-medium text-gray-800">{formatINR(baseNonveg * guestCount)}</td>
                      </tr>
                    )}
                    {addOns.map((addon, i) => (
                      <tr key={i} className="border-b border-gray-100">
                        <td className="py-1.5 text-gray-600">+ {addon.name}</td>
                        <td className="py-1.5 text-right font-medium text-gray-800">{formatINR(addon.price)}</td>
                      </tr>
                    ))}
                    {gstIncluded && gstAmount > 0 && (
                      <tr className="border-b border-gray-100">
                        <td className="py-1.5 text-gray-500">GST (5%)</td>
                        <td className="py-1.5 text-right text-gray-500">{formatINR(gstAmount)}</td>
                      </tr>
                    )}
                    <tr>
                      <td className="py-2 font-semibold text-gray-900">Grand Total</td>
                      <td className="py-2 text-right font-bold text-gray-900">{formatINR(total)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Menu Sections */}
              {menuSections.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Menu</h4>
                  {menuSections.map((section, si) => (
                    <div key={si} className="border border-gray-100 rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700 flex items-center justify-between">
                        <span>{section.name}</span>
                        <span className="text-gray-400">{section.items.length} items</span>
                      </div>
                      <div className="px-3 py-2">
                        <div className="flex flex-wrap gap-1.5">
                          {section.items.map((item, ii) => (
                            <span key={ii} className="text-[11px] text-gray-600 bg-white border border-gray-100 px-2 py-0.5 rounded-full">
                              {item.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add-ons list */}
              {addOns.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">Add-ons Included</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {addOns.map((addon, i) => (
                      <span key={i} className="text-[11px] bg-rose-50 text-rose-700 border border-rose-100 px-2 py-0.5 rounded-full">
                        {addon.name} — {formatINR(addon.price)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Inclusions (shown when not expanded or non-structured) */}
        {!isExpanded && quote.inclusions && (
          <p className="text-xs text-gray-600">
            <span className="font-medium">Includes: </span>
            {quote.inclusions.length > 120 ? quote.inclusions.slice(0, 120) + '...' : quote.inclusions}
          </p>
        )}

        {/* Expanded: show full inclusions + exclusions */}
        {isExpanded && (
          <div className="space-y-2">
            {quote.inclusions && (
              <div>
                <h4 className="text-xs font-semibold text-gray-700 mb-0.5 flex items-center gap-1">
                  <Check className="w-3 h-3 text-green-500" /> Inclusions
                </h4>
                <p className="text-xs text-gray-600 whitespace-pre-line">{quote.inclusions}</p>
              </div>
            )}
            {quote.exclusions && (
              <div>
                <h4 className="text-xs font-semibold text-gray-700 mb-0.5 flex items-center gap-1">
                  <XIcon className="w-3 h-3 text-rose-400" /> Exclusions
                </h4>
                <p className="text-xs text-gray-600 whitespace-pre-line">{quote.exclusions}</p>
              </div>
            )}
            {quote.payment_terms && (
              <div>
                <h4 className="text-xs font-semibold text-gray-700 mb-0.5">Payment Terms</h4>
                <p className="text-xs text-gray-600">{quote.payment_terms}</p>
              </div>
            )}
          </div>
        )}

        {/* Valid until */}
        <p className="text-[11px] text-gray-400">
          Valid until {new Date(quote.valid_until).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1 flex-wrap">
          {quote.status === 'submitted' && (
            <>
              <button
                onClick={() => onAction('shortlisted')}
                className="text-sm font-medium px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Shortlist
              </button>
              <button
                onClick={() => onAction('rejected')}
                className="text-sm font-medium px-3 py-1.5 rounded-lg border border-rose-200 text-rose-500 hover:bg-rose-50 transition-colors"
              >
                Reject
              </button>
            </>
          )}
          {quote.status === 'shortlisted' && (
            <>
              <button
                onClick={() => onAction('accepted')}
                className="text-sm font-medium px-3 py-1.5 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors"
              >
                Accept
              </button>
              <button
                onClick={() => onAction('rejected')}
                className="text-sm font-medium px-3 py-1.5 rounded-lg border border-rose-200 text-rose-500 hover:bg-rose-50 transition-colors"
              >
                Reject
              </button>
            </>
          )}
          {quote.status === 'accepted' && (
            <span className="text-sm font-medium text-green-700 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">
              ✓ Accepted
            </span>
          )}
          {quote.status === 'rejected' && (
            <span className="text-sm font-medium text-gray-400 bg-gray-50 px-3 py-1.5 rounded-lg">
              Rejected
            </span>
          )}
          {onNegotiate && quote.status !== 'rejected' && quote.status !== 'accepted' && (
            <button
              onClick={onNegotiate}
              className="text-sm font-medium px-3 py-1.5 rounded-lg border border-violet-200 text-violet-600 hover:bg-violet-50 transition-colors"
            >
              Negotiate
            </button>
          )}
          <button
            onClick={onChat}
            className="ml-auto text-sm font-medium px-4 py-1.5 rounded-lg bg-rose-500 text-white hover:bg-rose-600 transition-colors flex items-center gap-1.5"
          >
            <MessageSquare className="w-3.5 h-3.5" /> Chat
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default QuoteCard;
