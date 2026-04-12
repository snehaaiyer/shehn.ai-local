import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Star } from 'lucide-react';
import { Quote, QuoteStatus } from '../types/marketplace';

interface QuoteCardProps {
  quote: Quote;
  budgetAllocated: number;
  onAction: (action: QuoteStatus) => void;
  onChat: () => void;
}

const formatINR = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

function pricingSummary(pricing: Record<string, any>): string {
  const entries = Object.entries(pricing).slice(0, 3);
  return entries.map(([k, v]) => {
    const label = k.replace(/_/g, ' ');
    const val = typeof v === 'number' ? formatINR(v) : String(v);
    return `${label}: ${val}`;
  }).join(' | ');
}

const QuoteCard: React.FC<QuoteCardProps> = ({ quote, budgetAllocated, onAction, onChat }) => {
  const total = quote.total_estimated_price;
  const pct = budgetAllocated > 0 ? (total / budgetAllocated) * 100 : 0;

  let barColor = 'bg-gray-400';
  if (pct > 120) barColor = 'bg-rose-500';
  else if (pct > 100) barColor = 'bg-rose-300';

  const barWidth = Math.min(pct, 150);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className="px-5 pt-4 pb-3 flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">{quote.vendor_name || 'Vendor'}</h3>
          <div className="flex items-center gap-2 mt-0.5 text-sm text-gray-500">
            {quote.vendor_rating != null && (
              <span className="flex items-center gap-0.5">
                <Star className="w-3.5 h-3.5 text-rose-400 fill-rose-400" /> {quote.vendor_rating}
              </span>
            )}
            {quote.vendor_experience != null && (
              <span>{quote.vendor_experience} yrs exp</span>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-gray-900">{formatINR(total)}</p>
          {quote.package_price != null && (
            <p className="text-xs text-gray-400">Package: {formatINR(quote.package_price)}</p>
          )}
        </div>
      </div>

      <div className="px-5 space-y-3 pb-4">
        {/* Category pricing summary */}
        <p className="text-xs text-gray-500">{pricingSummary(quote.category_pricing)}</p>

        {/* Budget bar */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-gray-500">Budget comparison</span>
            <span className={`font-medium ${pct > 120 ? 'text-rose-600' : pct > 100 ? 'text-rose-500' : 'text-gray-600'}`}>
              {Math.round(pct)}% of budget
            </span>
          </div>
          <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
            <div className={`h-full rounded-full ${barColor} transition-all`} style={{ width: `${Math.min(barWidth / 1.5, 100)}%` }} />
          </div>
        </div>

        {/* Inclusions */}
        {quote.inclusions && (
          <p className="text-xs text-gray-600">
            <span className="font-medium">Includes: </span>
            {quote.inclusions.length > 100 ? quote.inclusions.slice(0, 100) + '...' : quote.inclusions}
          </p>
        )}

        {/* Valid until */}
        <p className="text-[11px] text-gray-400">
          Valid until {new Date(quote.valid_until).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          {quote.status === 'shortlisted' ? (
            <span className="text-sm font-medium text-gray-700 bg-gray-100 px-3 py-1.5 rounded-lg">Shortlisted</span>
          ) : (
            <button
              onClick={() => onAction('shortlisted')}
              className="text-sm font-medium px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Shortlist
            </button>
          )}
          {quote.status !== 'rejected' && (
            <button
              onClick={() => onAction('rejected')}
              className="text-sm font-medium px-3 py-1.5 rounded-lg border border-rose-300 text-rose-500 hover:bg-rose-50 transition-colors"
            >
              Reject
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
