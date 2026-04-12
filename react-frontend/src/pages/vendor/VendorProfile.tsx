import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Save, Eye, EyeOff, Plus, X, Star, MapPin, Briefcase, Loader2,
  CheckCircle, AlertCircle, Image as ImageIcon, Sparkles,
} from 'lucide-react';
import { VendorService } from '../../services/vendor_service';
import { useAppStore } from '../../store/useAppStore';
import { VendorProfile as VendorProfileType, VendorCategory } from '../../types/marketplace';

const CATEGORIES: { value: VendorCategory; label: string }[] = [
  { value: 'venue', label: 'Venue' },
  { value: 'photography', label: 'Photography' },
  { value: 'catering', label: 'Catering' },
  { value: 'decoration', label: 'Decoration' },
  { value: 'makeup', label: 'Makeup' },
  { value: 'entertainment', label: 'Entertainment' },
];

interface ServiceRow { name: string; base_price: number; price_unit: string }

function computeCompletion(p: Partial<VendorProfileType>): number {
  let pct = 0;
  if (p.name) pct += 10;
  if (p.category) pct += 10;
  if (p.business_description) pct += 15;
  if (p.operating_cities && p.operating_cities.length > 0) pct += 15;
  if (p.years_experience && p.years_experience > 0) pct += 10;
  if (p.services_offered && p.services_offered.length > 0) pct += 20;
  if (p.portfolio_images && p.portfolio_images.length > 0) pct += 20;
  return pct;
}

const VendorProfilePage: React.FC = () => {
  const { currentUserId } = useAppStore();

  const [profile, setProfile] = useState<VendorProfileType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Form state
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState<VendorCategory | ''>('');
  const [cityInput, setCityInput] = useState('');
  const [cities, setCities] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [yearsExperience, setYearsExperience] = useState(0);
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [portfolioUrls, setPortfolioUrls] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await VendorService.getProfile(currentUserId);
        if (res.success && res.data) {
          const p = res.data;
          setProfile(p);
          setBusinessName(p.name);
          setCategory(p.category);
          setCities(p.operating_cities || []);
          setDescription(p.business_description || '');
          setYearsExperience(p.years_experience || 0);
          setServices(p.services_offered?.length ? p.services_offered : [{ name: '', base_price: 0, price_unit: 'per event' }]);
          setPortfolioUrls(p.portfolio_images?.length ? p.portfolio_images.map((i) => i.url) : ['']);
        }
      } catch { /* ignore */ } finally {
        setLoading(false);
      }
    })();
  }, [currentUserId]);

  // City helpers
  const addCity = () => {
    const trimmed = cityInput.trim();
    if (trimmed && !cities.includes(trimmed)) setCities([...cities, trimmed]);
    setCityInput('');
  };
  const removeCity = (c: string) => setCities(cities.filter((x) => x !== c));

  // Service helpers
  const updateService = (idx: number, field: keyof ServiceRow, value: string | number) => {
    const copy = [...services]; (copy[idx] as any)[field] = value; setServices(copy);
  };
  const removeService = (idx: number) => setServices(services.filter((_, i) => i !== idx));
  const addService = () => setServices([...services, { name: '', base_price: 0, price_unit: 'per event' }]);

  // Portfolio helpers
  const updatePortfolio = (idx: number, val: string) => { const c = [...portfolioUrls]; c[idx] = val; setPortfolioUrls(c); };
  const removePortfolio = (idx: number) => setPortfolioUrls(portfolioUrls.filter((_, i) => i !== idx));
  const addPortfolio = () => setPortfolioUrls([...portfolioUrls, '']);

  // AI enhance description state
  const [aiEnhancing, setAiEnhancing] = useState(false);

  const handleAiEnhanceDescription = async () => {
    if (!description.trim() || !category) return;
    setAiEnhancing(true);
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Improve this wedding vendor description for SEO and appeal: "${description}". Category: ${category}. Keep it professional and under 200 words.`
        }),
      });
      const data = await res.json();
      const text = data.response || data.message || '';
      if (text.trim()) {
        // Strip quotes if the AI wraps it
        const cleaned = text.replace(/^["']|["']$/g, '').trim();
        setDescription(cleaned);
      }
    } catch { /* ignore */ } finally {
      setAiEnhancing(false);
    }
  };

  // Compute completion nudges
  const nudges: { icon: string; text: string }[] = [];
  if (!portfolioUrls.some((u) => u.trim())) nudges.push({ icon: '📸', text: 'Vendors with portfolios get 3x more inquiries — add photos!' });
  if (!services.some((s) => s.name.trim())) nudges.push({ icon: '💰', text: 'List your packages to help couples compare pricing' });
  if (description.length < 50) nudges.push({ icon: '📝', text: 'A detailed description helps you rank higher in search' });
  if (cities.length === 0) nudges.push({ icon: '📍', text: 'Add your operating cities so couples in your area can find you' });

  const currentData: Partial<VendorProfileType> = {
    name: businessName,
    category: category as VendorCategory,
    operating_cities: cities,
    business_description: description,
    years_experience: yearsExperience,
    services_offered: services.filter((s) => s.name.trim()),
    portfolio_images: portfolioUrls.filter((u) => u.trim()).map((url) => ({ url, caption: '' })),
  };
  const completion = computeCompletion(currentData);

  const handleSave = async () => {
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await VendorService.updateProfile(currentUserId, currentData);
      if (res.success) {
        setSuccessMsg('Profile saved successfully.');
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setErrorMsg(res.error || 'Save failed.');
      }
    } catch {
      setErrorMsg('Network error.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-rose-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  // ── Preview Mode ──
  if (previewMode) {
    const categoryLabel = category ? category.charAt(0).toUpperCase() + category.slice(1) : '';
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-900">Profile Preview</h1>
          <button onClick={() => setPreviewMode(false)}
            className="inline-flex items-center gap-2 text-sm text-rose-600 hover:text-rose-800 font-medium">
            <EyeOff className="h-4 w-4" /> Exit Preview
          </button>
        </div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-gray-100 bg-white shadow-lg p-8 space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{businessName || 'Business Name'}</h2>
              {category && (
                <span className="inline-block mt-1 rounded-full bg-rose-100 text-rose-700 text-xs font-medium px-3 py-1">
                  {categoryLabel}
                </span>
              )}
            </div>
            {yearsExperience > 0 && (
              <span className="flex items-center gap-1 text-sm text-gray-500">
                <Briefcase className="h-4 w-4" /> {yearsExperience} years
              </span>
            )}
          </div>

          {cities.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <MapPin className="h-4 w-4" /> {cities.join(', ')}
            </div>
          )}

          {description && <p className="text-gray-700 leading-relaxed">{description}</p>}

          {services.filter((s) => s.name.trim()).length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Services</h3>
              <div className="divide-y divide-gray-100">
                {services.filter((s) => s.name.trim()).map((s, i) => (
                  <div key={i} className="flex items-center justify-between py-2 text-sm">
                    <span className="text-gray-700">{s.name}</span>
                    <span className="text-gray-500">&#8377;{s.base_price.toLocaleString('en-IN')} / {s.price_unit}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {portfolioUrls.filter((u) => u.trim()).length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Portfolio</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {portfolioUrls.filter((u) => u.trim()).map((url, i) => (
                  <div key={i} className="aspect-video rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                    <img src={url} alt={`Portfolio ${i + 1}`} className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  // ── Edit Mode ──
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Edit Profile</h1>
        <button onClick={() => setPreviewMode(true)}
          className="inline-flex items-center gap-2 text-sm text-rose-600 hover:text-rose-800 font-medium">
          <Eye className="h-4 w-4" /> Preview
        </button>
      </div>

      {/* Completion meter */}
      <div className="rounded-xl bg-white border border-gray-100 shadow-sm p-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-gray-600 font-medium">Profile Completion</span>
          <span className="font-bold text-rose-600">{completion}%</span>
        </div>
        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-rose-500"
            initial={{ width: 0 }}
            animate={{ width: `${completion}%` }}
            transition={{ duration: 0.6 }}
          />
        </div>
      </div>

      {/* Completion Nudges */}
      {nudges.length > 0 && (
        <div className="space-y-2">
          {nudges.map((n, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg bg-rose-50 border border-rose-100 px-4 py-3 text-sm text-rose-800">
              <span className="text-base">{n.icon}</span>
              <span>{n.text}</span>
            </div>
          ))}
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2 rounded-lg bg-sage-50 border border-sage-200 p-3 text-sage-800 text-sm">
          <CheckCircle className="h-4 w-4 shrink-0" /> {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-200 p-3 text-rose-800 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" /> {errorMsg}
        </div>
      )}

      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6 space-y-6">
        {/* Business Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
          <input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-rose-300 focus:border-rose-400 outline-none" />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value as VendorCategory)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-rose-300 focus:border-rose-400 outline-none">
            <option value="">Select category</option>
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>

        {/* Operating Cities */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Operating Cities</label>
          <input type="text" value={cityInput} onChange={(e) => setCityInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCity(); } }}
            placeholder="Type city name and press Enter"
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-rose-300 focus:border-rose-400 outline-none" />
          {cities.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {cities.map((c) => (
                <span key={c} className="inline-flex items-center gap-1 rounded-full bg-rose-100 text-rose-700 px-3 py-1 text-sm">
                  {c} <button type="button" onClick={() => removeCity(c)} className="hover:text-rose-900"><X className="h-3.5 w-3.5" /></button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Description */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-gray-700">Business Description</label>
            <button
              type="button"
              onClick={handleAiEnhanceDescription}
              disabled={aiEnhancing || !description.trim() || !category}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-600 hover:text-rose-800 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {aiEnhancing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              {aiEnhancing ? 'Enhancing...' : 'AI Enhance Description'}
            </button>
          </div>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-rose-300 focus:border-rose-400 outline-none resize-none" />
        </div>

        {/* Years Experience */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
          <input type="number" min={0} value={yearsExperience} onChange={(e) => setYearsExperience(Number(e.target.value))}
            className="w-32 rounded-lg border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-rose-300 focus:border-rose-400 outline-none" />
        </div>

        {/* Services */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Services Offered</label>
          <div className="space-y-2">
            {services.map((s, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input type="text" placeholder="Service Name" value={s.name} onChange={(e) => updateService(idx, 'name', e.target.value)}
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-rose-300 outline-none" />
                <span className="text-gray-400 text-sm">&#8377;</span>
                <input type="number" min={0} placeholder="Price" value={s.base_price || ''} onChange={(e) => updateService(idx, 'base_price', Number(e.target.value))}
                  className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-rose-300 outline-none" />
                <input type="text" placeholder="Unit" value={s.price_unit} onChange={(e) => updateService(idx, 'price_unit', e.target.value)}
                  className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-rose-300 outline-none" />
                {services.length > 1 && (
                  <button type="button" onClick={() => removeService(idx)} className="text-gray-400 hover:text-rose-500"><X className="h-4 w-4" /></button>
                )}
              </div>
            ))}
          </div>
          <button type="button" onClick={addService} className="mt-2 inline-flex items-center gap-1 text-sm text-rose-600 hover:text-rose-800">
            <Plus className="h-4 w-4" /> Add Service
          </button>
        </div>

        {/* Portfolio */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Portfolio Images (URLs)</label>
          <div className="space-y-2">
            {portfolioUrls.map((url, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-gray-400 shrink-0" />
                <input type="url" placeholder="https://..." value={url} onChange={(e) => updatePortfolio(idx, e.target.value)}
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-rose-300 outline-none" />
                {portfolioUrls.length > 1 && (
                  <button type="button" onClick={() => removePortfolio(idx)} className="text-gray-400 hover:text-rose-500"><X className="h-4 w-4" /></button>
                )}
              </div>
            ))}
          </div>
          <button type="button" onClick={addPortfolio} className="mt-2 inline-flex items-center gap-1 text-sm text-rose-600 hover:text-rose-800">
            <Plus className="h-4 w-4" /> Add Image
          </button>
        </div>
      </div>

      {/* Save */}
      <motion.button
        onClick={handleSave}
        disabled={saving}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-rose-500 text-white font-semibold py-3 px-6 shadow-lg hover:bg-rose-600 hover:shadow-xl transition disabled:opacity-60"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {saving ? 'Saving...' : 'Save Profile'}
      </motion.button>
    </div>
  );
};

export default VendorProfilePage;
