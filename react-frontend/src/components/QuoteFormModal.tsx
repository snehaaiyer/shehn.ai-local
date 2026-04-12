import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { VendorCategory, WeddingSummary } from '../types/marketplace';

interface QuoteFormModalProps {
  category: VendorCategory;
  blueprintSummary: WeddingSummary;
  onSubmit: (data: any) => void;
  onClose: () => void;
}

type FieldType = 'number' | 'text' | 'checkbox' | 'textarea' | 'date' | 'select';

interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  options?: string[];
  required?: boolean;
}

const categoryFields: Record<VendorCategory, FieldDef[]> = {
  venue: [
    { key: 'price_per_plate_veg', label: 'Price per plate (Veg)', type: 'number', required: true },
    { key: 'price_per_plate_nonveg', label: 'Price per plate (Non-veg)', type: 'number' },
    { key: 'venue_rental_per_function', label: 'Venue rental per function', type: 'number', required: true },
    { key: 'min_guest_count', label: 'Min guest count', type: 'number' },
    { key: 'max_guest_count', label: 'Max guest count', type: 'number' },
    { key: 'catering_included', label: 'Catering included', type: 'checkbox' },
    { key: 'ac_available', label: 'AC available', type: 'checkbox' },
    { key: 'parking_capacity', label: 'Parking capacity', type: 'number' },
  ],
  photography: [
    { key: 'price_per_day', label: 'Price per day', type: 'number', required: true },
    { key: 'num_photographers', label: 'Number of photographers', type: 'number' },
    { key: 'num_videographers', label: 'Number of videographers', type: 'number' },
    { key: 'pre_wedding_shoot', label: 'Pre-wedding shoot', type: 'checkbox' },
    { key: 'drone_coverage', label: 'Drone coverage', type: 'checkbox' },
    { key: 'same_day_edit', label: 'Same day edit', type: 'checkbox' },
    { key: 'delivery_timeline_days', label: 'Delivery timeline (days)', type: 'number' },
  ],
  catering: [
    { key: 'price_per_plate_veg', label: 'Price per plate (Veg)', type: 'number', required: true },
    { key: 'price_per_plate_nonveg', label: 'Price per plate (Non-veg)', type: 'number' },
    { key: 'min_plate_count', label: 'Min plate count', type: 'number' },
    { key: 'num_courses', label: 'Number of courses', type: 'number' },
    { key: 'live_counters', label: 'Live counters', type: 'number' },
    { key: 'service_staff_included', label: 'Service staff included', type: 'checkbox' },
  ],
  decoration: [
    { key: 'price_mehendi', label: 'Mehendi decor price', type: 'number' },
    { key: 'price_sangeet', label: 'Sangeet decor price', type: 'number' },
    { key: 'price_wedding', label: 'Wedding decor price', type: 'number', required: true },
    { key: 'price_reception', label: 'Reception decor price', type: 'number' },
    { key: 'flower_type', label: 'Flower type', type: 'select', options: ['fresh', 'artificial', 'mixed'] },
    { key: 'mandap_included', label: 'Mandap included', type: 'checkbox' },
    { key: 'lighting_included', label: 'Lighting included', type: 'checkbox' },
  ],
  makeup: [
    { key: 'bridal_look_price', label: 'Bridal look price', type: 'number', required: true },
    { key: 'makeup_type', label: 'Makeup type', type: 'select', options: ['HD', 'airbrush', 'traditional'] },
    { key: 'party_look_price', label: 'Party look price', type: 'number' },
    { key: 'num_looks_offered', label: 'Number of looks offered', type: 'number' },
    { key: 'trial_session', label: 'Trial session', type: 'checkbox' },
    { key: 'trial_price', label: 'Trial price', type: 'number' },
    { key: 'family_makeup_available', label: 'Family makeup available', type: 'checkbox' },
  ],
  entertainment: [
    { key: 'entertainment_type', label: 'Entertainment type', type: 'select', options: ['dj', 'live_band', 'singer', 'dj_band_combo'] },
    { key: 'price_per_event', label: 'Price per event', type: 'number', required: true },
    { key: 'duration_hours', label: 'Duration (hours)', type: 'number' },
    { key: 'sound_system_included', label: 'Sound system included', type: 'checkbox' },
    { key: 'emcee_included', label: 'Emcee included', type: 'checkbox' },
  ],
};

const commonFields: FieldDef[] = [
  { key: 'inclusions', label: 'Inclusions', type: 'textarea', required: true },
  { key: 'exclusions', label: 'Exclusions', type: 'textarea' },
  { key: 'package_price', label: 'Package price (optional)', type: 'number' },
  { key: 'package_description', label: 'Package description (optional)', type: 'textarea' },
  { key: 'payment_terms', label: 'Payment terms', type: 'textarea', required: true },
  { key: 'valid_until', label: 'Valid until', type: 'date', required: true },
  { key: 'portfolio_links', label: 'Portfolio links (comma-separated)', type: 'text' },
];

const formatINR = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const QuoteFormModal: React.FC<QuoteFormModalProps> = ({ category, blueprintSummary, onSubmit, onClose }) => {
  const allFields = useMemo(() => [...categoryFields[category], ...commonFields], [category]);
  const [values, setValues] = useState<Record<string, any>>({});

  const set = (key: string, val: any) => setValues((prev) => ({ ...prev, [key]: val }));

  const estimatedTotal = useMemo(() => {
    let total = 0;
    const v = values;
    const guests = blueprintSummary.guest_count || 200;
    const numEvents = blueprintSummary.events?.length || 3;

    switch (category) {
      case 'venue':
        total += (Number(v.price_per_plate_veg) || 0) * guests;
        total += (Number(v.venue_rental_per_function) || 0) * numEvents;
        break;
      case 'photography':
        total += (Number(v.price_per_day) || 0) * numEvents;
        break;
      case 'catering':
        total += (Number(v.price_per_plate_veg) || 0) * guests;
        break;
      case 'decoration':
        total += Number(v.price_mehendi) || 0;
        total += Number(v.price_sangeet) || 0;
        total += Number(v.price_wedding) || 0;
        total += Number(v.price_reception) || 0;
        break;
      case 'makeup':
        total += Number(v.bridal_look_price) || 0;
        total += (Number(v.party_look_price) || 0) * Math.max(numEvents - 1, 0);
        break;
      case 'entertainment':
        total += (Number(v.price_per_event) || 0) * numEvents;
        break;
    }

    if (v.package_price) total = Number(v.package_price);
    return total;
  }, [values, category, blueprintSummary]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: Record<string, any> = { ...values, total_estimated_price: estimatedTotal };
    if (values.portfolio_links) {
      data.portfolio_links = String(values.portfolio_links).split(',').map((s: string) => s.trim()).filter(Boolean);
    }
    onSubmit(data);
  };

  const renderField = (field: FieldDef) => {
    const val = values[field.key] ?? '';

    if (field.type === 'checkbox') {
      return (
        <label key={field.key} className="flex items-center gap-2 py-1">
          <input
            type="checkbox"
            checked={!!values[field.key]}
            onChange={(e) => set(field.key, e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-rose-500 focus:ring-rose-400"
          />
          <span className="text-sm text-gray-700">{field.label}</span>
        </label>
      );
    }

    if (field.type === 'select') {
      return (
        <div key={field.key}>
          <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
          <select
            value={val}
            onChange={(e) => set(field.key, e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-rose-300 focus:border-transparent"
          >
            <option value="">Select...</option>
            {field.options?.map((opt) => (
              <option key={opt} value={opt}>{opt.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>
      );
    }

    if (field.type === 'textarea') {
      return (
        <div key={field.key}>
          <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
          <textarea
            value={val}
            onChange={(e) => set(field.key, e.target.value)}
            rows={3}
            required={field.required}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-rose-300 focus:border-transparent resize-none"
          />
        </div>
      );
    }

    return (
      <div key={field.key}>
        <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
        <input
          type={field.type}
          value={val}
          onChange={(e) => set(field.key, field.type === 'number' ? e.target.value : e.target.value)}
          required={field.required}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-rose-300 focus:border-transparent"
        />
      </div>
    );
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white w-full sm:max-w-lg sm:rounded-xl rounded-t-xl max-h-[90vh] flex flex-col shadow-xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 capitalize">
              Submit {category} Quote
            </h2>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Context banner */}
          <div className="px-5 py-2 bg-rose-50 text-sm text-rose-700 flex gap-4 flex-wrap">
            <span>{blueprintSummary.guest_count} guests</span>
            <span>{blueprintSummary.events?.length || 0} events</span>
            <span>{blueprintSummary.city}</span>
            <span>{blueprintSummary.date}</span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {/* Category-specific fields */}
            <fieldset>
              <legend className="text-sm font-semibold text-gray-800 mb-2 capitalize">{category} Pricing</legend>
              <div className="grid grid-cols-2 gap-3">
                {categoryFields[category].map((f) =>
                  f.type === 'checkbox' ? renderField(f) : renderField(f)
                )}
              </div>
            </fieldset>

            {/* Common fields */}
            <fieldset className="border-t border-gray-100 pt-4 space-y-3">
              <legend className="text-sm font-semibold text-gray-800 mb-2">General Details</legend>
              {commonFields.map(renderField)}
            </fieldset>
          </form>

          {/* Footer with estimated total */}
          <div className="border-t border-gray-200 px-5 py-4 bg-gray-50 rounded-b-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-600">Estimated Total</span>
              <span className="text-xl font-bold text-gray-900">{formatINR(estimatedTotal)}</span>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                className="flex-1 px-4 py-2.5 rounded-lg bg-rose-500 text-white text-sm font-medium hover:bg-rose-600 transition-colors"
              >
                Submit Quote
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default QuoteFormModal;
