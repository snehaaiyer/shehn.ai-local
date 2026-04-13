import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Pencil, Plus, X, Check, ChevronRight, Loader2,
  CheckCircle, AlertCircle, MapPin, Briefcase, Award, Users,
  Globe, Tag, IndianRupee, Link, MessageSquare,
} from 'lucide-react';
import { VendorService } from '../../services/vendor_service';
import { VendorCategory } from '../../types/marketplace';
import { useAppStore } from '../../store/useAppStore';
import { API_BASE } from '../../config/api_config';

const CATEGORIES: { value: VendorCategory; label: string }[] = [
  { value: 'venue', label: 'Venue' },
  { value: 'photography', label: 'Photography' },
  { value: 'catering', label: 'Catering' },
  { value: 'decoration', label: 'Decoration' },
  { value: 'makeup', label: 'Makeup' },
  { value: 'entertainment', label: 'Entertainment' },
];

interface ServiceRow { name: string; base_price: number; price_unit: string }

type Step = 'converse' | 'review' | 'success';

const CUSTOM_FIELD_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  team_size: { label: 'Team Size', icon: <Users className="h-4 w-4" /> },
  discounts: { label: 'Current Offers', icon: <Tag className="h-4 w-4" /> },
  awards: { label: 'Awards / Certifications', icon: <Award className="h-4 w-4" /> },
  languages: { label: 'Languages Spoken', icon: <MessageSquare className="h-4 w-4" /> },
  travel_radius: { label: 'Travel Willingness', icon: <Globe className="h-4 w-4" /> },
  min_booking: { label: 'Minimum Booking Value', icon: <IndianRupee className="h-4 w-4" /> },
};

const VendorRegister: React.FC = () => {
  const navigate = useNavigate();
  const setRole = useAppStore((s) => s.setRole);

  // Step
  const [step, setStep] = useState<Step>('converse');

  // Conversational input
  const [rawInput, setRawInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Profile fields
  const [businessName, setBusinessName] = useState('');
  const [categories, setCategories] = useState<VendorCategory[]>([]);
  const [description, setDescription] = useState('');
  const [cities, setCities] = useState<string[]>([]);
  const [cityInput, setCityInput] = useState('');
  const [yearsExperience, setYearsExperience] = useState<number>(0);
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [portfolioUrls, setPortfolioUrls] = useState<string[]>([]);
  const [customFields, setCustomFields] = useState<Record<string, any>>({});

  // Editing state: which section is being inline-edited
  const [editing, setEditing] = useState<Record<string, boolean>>({});

  // AI-detected badges
  const [aiFilledFields, setAiFilledFields] = useState<Set<string>>(new Set());

  // Submit state
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // AI enhance loading
  const [enhancing, setEnhancing] = useState(false);

  // -- Profile completeness --
  const completeness = useMemo(() => {
    let filled = 0;
    let total = 7;
    if (businessName.trim()) filled++;
    if (categories.length) filled++;
    if (description.trim()) filled++;
    if (cities.length) filled++;
    if (yearsExperience > 0) filled++;
    if (services.some((s) => s.name.trim())) filled++;
    if (portfolioUrls.some((u) => u.trim())) filled++;
    return Math.round((filled / total) * 100);
  }, [businessName, categories, description, cities, yearsExperience, services, portfolioUrls]);

  // -- Step 1: AI onboard assist --
  const handleConversationalSubmit = async () => {
    if (!rawInput.trim()) return;
    setAiLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`${API_BASE}/api/ai/vendor-onboard-assist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw_input: rawInput }),
      });
      if (!res.ok) throw new Error('AI service unavailable');
      const data = await res.json();
      const parsed = data.profile || data;
      applyAiProfile(parsed);
      setStep('review');
    } catch {
      // Fallback: try the general AI chat endpoint
      try {
        const prompt = `Extract vendor profile data from this text. Respond ONLY with JSON, no markdown:\n{"business_name":"","categories":["photography"],"description":"","cities":[],"years_experience":0,"services":[{"name":"","base_price":0,"price_unit":"per event"}],"custom_fields":{"team_size":null,"discounts":null,"awards":null,"languages":null,"travel_radius":null,"min_booking":null}}\n\nText: "${rawInput}"`;
        const res = await fetch(`${API_BASE}/api/ai/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: prompt }),
        });
        const data = await res.json();
        const text = data.response || data.message || '';
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          applyAiProfile(JSON.parse(jsonMatch[0]));
          setStep('review');
        } else {
          setErrorMsg('Could not parse AI response. Please try again.');
        }
      } catch {
        setErrorMsg('AI service is unavailable. You can still fill in your profile manually.');
        setStep('review');
      }
    } finally {
      setAiLoading(false);
    }
  };

  const applyAiProfile = (parsed: any) => {
    const filled = new Set<string>();
    if (parsed.business_name) { setBusinessName(parsed.business_name); filled.add('businessName'); }
    if (parsed.categories?.length) {
      const valid = parsed.categories.filter((c: string) => CATEGORIES.some((cat) => cat.value === c));
      if (valid.length) { setCategories(valid); filled.add('categories'); }
    } else if (parsed.category) {
      const match = CATEGORIES.find((c) => c.value === parsed.category || c.label.toLowerCase() === String(parsed.category).toLowerCase());
      if (match) { setCategories([match.value]); filled.add('categories'); }
    }
    if (parsed.description) { setDescription(parsed.description); filled.add('description'); }
    if (parsed.cities?.length) { setCities(parsed.cities); filled.add('cities'); }
    if (parsed.years_experience && parsed.years_experience > 0) { setYearsExperience(parsed.years_experience); filled.add('yearsExperience'); }
    if (parsed.services?.length) { setServices(parsed.services); filled.add('services'); }
    // Custom fields
    const cf: Record<string, any> = {};
    const cfSource = parsed.custom_fields || parsed;
    if (cfSource.team_size) { cf.team_size = cfSource.team_size; filled.add('team_size'); }
    if (cfSource.discounts) { cf.discounts = cfSource.discounts; filled.add('discounts'); }
    if (cfSource.awards) { cf.awards = cfSource.awards; filled.add('awards'); }
    if (cfSource.languages) { cf.languages = cfSource.languages; filled.add('languages'); }
    if (cfSource.travel_radius) { cf.travel_radius = cfSource.travel_radius; filled.add('travel_radius'); }
    if (cfSource.min_booking) { cf.min_booking = cfSource.min_booking; filled.add('min_booking'); }
    if (Object.keys(cf).length) setCustomFields(cf);
    setAiFilledFields(filled);
  };

  // -- AI Enhance description --
  const handleAiEnhance = async () => {
    if (!description.trim()) return;
    setEnhancing(true);
    try {
      const prompt = `Rewrite this Indian wedding vendor business description to be more professional, compelling, and SEO-friendly. Keep it under 150 words. Return ONLY the improved text, no quotes or preamble.\n\n"${description}"`;
      const res = await fetch(`${API_BASE}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt }),
      });
      const data = await res.json();
      const text = data.response || data.message || '';
      if (text.trim()) setDescription(text.trim().replace(/^["']|["']$/g, ''));
    } catch { /* silent */ }
    setEnhancing(false);
  };

  // -- Helpers --
  const toggleEdit = (field: string) => setEditing((p) => ({ ...p, [field]: !p[field] }));
  const addCity = () => { const t = cityInput.trim(); if (t && !cities.includes(t)) setCities([...cities, t]); setCityInput(''); };
  const removeCity = (c: string) => setCities(cities.filter((x) => x !== c));
  const updateService = (i: number, f: keyof ServiceRow, v: string | number) => {
    const c = [...services]; (c[i] as any)[f] = v; setServices(c);
  };
  const removeService = (i: number) => setServices(services.filter((_, idx) => idx !== i));
  const addService = () => setServices([...services, { name: '', base_price: 0, price_unit: 'per event' }]);
  const updatePortfolio = (i: number, v: string) => { const c = [...portfolioUrls]; c[i] = v; setPortfolioUrls(c); };
  const removePortfolio = (i: number) => setPortfolioUrls(portfolioUrls.filter((_, idx) => idx !== i));
  const addPortfolio = () => setPortfolioUrls([...portfolioUrls, '']);
  const toggleCategory = (cat: VendorCategory) => {
    setCategories((prev) => prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]);
  };
  const updateCustomField = (key: string, value: any) => setCustomFields((p) => ({ ...p, [key]: value }));
  const removeCustomField = (key: string) => setCustomFields((p) => { const n = { ...p }; delete n[key]; return n; });

  const aiBadge = (field: string) =>
    aiFilledFields.has(field) ? (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-rose-600 bg-rose-50 border border-rose-200 rounded-full px-2 py-0.5 ml-2">
        <Sparkles className="h-2.5 w-2.5" /> AI detected
      </span>
    ) : null;

  // -- Submit --
  const handleSubmit = async () => {
    if (!businessName.trim() || !categories.length || !description.trim()) {
      setErrorMsg('Please fill in business name, category, and description.');
      return;
    }
    setSubmitting(true);
    setErrorMsg('');
    try {
      const res = await VendorService.register({
        name: businessName,
        category: categories[0],
        operating_cities: cities,
        business_description: description,
        years_experience: yearsExperience,
        services_offered: services.filter((s) => s.name.trim()),
        portfolio_images: portfolioUrls.filter((u) => u.trim()).map((url) => ({ url, caption: '' })),
      });
      if (res.success && res.data) {
        localStorage.setItem('shehnai_vendor_id', String(res.data.id));
        setRole('vendor');
        setStep('success');
      } else {
        setErrorMsg(res.error || 'Registration failed. Please try again.');
      }
    } catch {
      setErrorMsg('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ───────── RENDER ─────────
  const inputClasses = 'w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-rose-300 focus:border-rose-400 outline-none text-sm';
  const cardClasses = 'rounded-xl border border-gray-200 bg-white p-5 space-y-3';
  const sectionHeader = (label: string, field: string) => (
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-semibold text-gray-800 flex items-center">
        {label} {aiBadge(field)}
      </h3>
      <button type="button" onClick={() => toggleEdit(field)} className="text-gray-400 hover:text-rose-500 transition">
        <Pencil className="h-3.5 w-3.5" />
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-gray-50 flex items-start justify-center py-8 px-4">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-2xl">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center shrink-0">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Join Shehn.AI as a Vendor</h1>
            <p className="text-sm text-gray-500">AI-powered profile builder</p>
          </div>
        </div>

        {/* Step Tabs */}
        {step !== 'success' && (
          <div className="flex gap-2 mb-6">
            {(['converse', 'review'] as const).map((s, i) => (
              <button
                key={s}
                onClick={() => setStep(s)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                  step === s
                    ? 'bg-rose-500 text-white shadow-md'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-rose-300'
                }`}
              >
                <span className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
                  {step === s ? <Check className="h-3 w-3" /> : i + 1}
                </span>
                {s === 'converse' ? 'Tell Us' : 'Review & Edit'}
              </button>
            ))}
          </div>
        )}

        {/* Error */}
        <AnimatePresence>
          {errorMsg && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mb-4 flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-200 p-4 text-rose-800 text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" /> {errorMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── STEP 1: CONVERSATIONAL ─── */}
        {step === 'converse' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={cardClasses}>
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-gray-900">Welcome! Tell us about your business</h2>
              <p className="text-sm text-gray-500">
                Describe your business naturally -- your name, what you do, which cities you serve, your experience,
                pricing, and anything else. Our AI will extract your profile automatically.
              </p>
            </div>
            <div className="bg-rose-50/60 rounded-lg p-3 border border-rose-100">
              <p className="text-xs font-medium text-rose-600 mb-1">Example</p>
              <p className="text-xs text-gray-600 italic">
                "I'm Arun from Royal Lens Photography, based in Mumbai and Pune. We specialize in candid wedding photography
                and cinematic films, with 8 years of experience. Our team of 5 photographers offers full-day coverage
                starting at 50,000 and pre-wedding shoots from 25,000. We offer 20% off for weekday weddings and travel
                across India."
              </p>
            </div>
            <textarea
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              rows={6}
              placeholder="Tell us about your business..."
              className={`${inputClasses} resize-none`}
            />
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep('review')}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Skip, I'll fill it in manually
              </button>
              <button
                type="button"
                onClick={handleConversationalSubmit}
                disabled={aiLoading || !rawInput.trim()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 text-white font-semibold text-sm shadow-md hover:shadow-lg transition disabled:opacity-50"
              >
                {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {aiLoading ? 'Extracting profile...' : 'AI Auto-fill'}
              </button>
            </div>
          </motion.div>
        )}

        {/* ─── STEP 2: REVIEW & EDIT ─── */}
        {step === 'review' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">

            {/* Business Name */}
            <div className={cardClasses}>
              {sectionHeader('Business Name', 'businessName')}
              {editing.businessName ? (
                <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} className={inputClasses} autoFocus />
              ) : (
                <p className="text-gray-700">{businessName || <span className="text-gray-400 italic">Not set</span>}</p>
              )}
            </div>

            {/* Category */}
            <div className={cardClasses}>
              {sectionHeader('Category', 'categories')}
              {editing.categories ? (
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((c) => (
                    <button key={c.value} type="button" onClick={() => toggleCategory(c.value)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition ${
                        categories.includes(c.value)
                          ? 'bg-rose-500 text-white border-rose-500'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-rose-300'
                      }`}>
                      {c.label}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {categories.length ? categories.map((c) => (
                    <span key={c} className="px-3 py-1 rounded-full bg-rose-100 text-rose-700 text-sm font-medium">
                      {CATEGORIES.find((cat) => cat.value === c)?.label || c}
                    </span>
                  )) : <span className="text-gray-400 italic text-sm">Not set</span>}
                </div>
              )}
            </div>

            {/* Description */}
            <div className={cardClasses}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-800 flex items-center">
                  Description {aiBadge('description')}
                </h3>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={handleAiEnhance} disabled={enhancing || !description.trim()}
                    className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 hover:text-rose-700 disabled:opacity-40">
                    {enhancing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                    AI Enhance
                  </button>
                  <button type="button" onClick={() => toggleEdit('description')} className="text-gray-400 hover:text-rose-500">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              {editing.description ? (
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className={`${inputClasses} resize-none`} autoFocus />
              ) : (
                <p className="text-gray-700 text-sm leading-relaxed">{description || <span className="text-gray-400 italic">Not set</span>}</p>
              )}
            </div>

            {/* Operating Cities */}
            <div className={cardClasses}>
              {sectionHeader('Operating Cities', 'cities')}
              <div className="flex flex-wrap gap-2">
                {cities.map((c) => (
                  <span key={c} className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 px-3 py-1 text-sm">
                    <MapPin className="h-3 w-3" /> {c}
                    <button type="button" onClick={() => removeCity(c)} className="hover:text-rose-900 ml-0.5"><X className="h-3 w-3" /></button>
                  </span>
                ))}
                {!cities.length && !editing.cities && <span className="text-gray-400 italic text-sm">None added</span>}
              </div>
              {editing.cities && (
                <div className="flex gap-2">
                  <input value={cityInput} onChange={(e) => setCityInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCity(); } }}
                    placeholder="Type city and press Enter" className={`flex-1 ${inputClasses}`} autoFocus />
                </div>
              )}
            </div>

            {/* Years of Experience */}
            <div className={cardClasses}>
              {sectionHeader('Years of Experience', 'yearsExperience')}
              {editing.yearsExperience ? (
                <input type="number" min={0} value={yearsExperience} onChange={(e) => setYearsExperience(Number(e.target.value))}
                  className={`w-32 ${inputClasses}`} autoFocus />
              ) : (
                <p className="text-gray-700 flex items-center gap-1.5">
                  <Briefcase className="h-4 w-4 text-gray-400" />
                  {yearsExperience > 0 ? `${yearsExperience} years` : <span className="text-gray-400 italic">Not set</span>}
                </p>
              )}
            </div>

            {/* Services */}
            <div className={cardClasses}>
              {sectionHeader('Services Offered', 'services')}
              {services.length > 0 ? (
                <div className="space-y-2">
                  {services.map((s, i) => (
                    <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg p-3">
                      {editing.services ? (
                        <>
                          <input value={s.name} onChange={(e) => updateService(i, 'name', e.target.value)}
                            placeholder="Service name" className="flex-1 bg-white rounded-lg border border-gray-200 px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-rose-300" />
                          <div className="flex items-center gap-1">
                            <span className="text-gray-400 text-sm">&#8377;</span>
                            <input type="number" value={s.base_price || ''} onChange={(e) => updateService(i, 'base_price', Number(e.target.value))}
                              className="w-24 bg-white rounded-lg border border-gray-200 px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-rose-300" />
                          </div>
                          <input value={s.price_unit} onChange={(e) => updateService(i, 'price_unit', e.target.value)}
                            className="w-24 bg-white rounded-lg border border-gray-200 px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-rose-300" />
                          <button type="button" onClick={() => removeService(i)} className="text-gray-400 hover:text-rose-500"><X className="h-4 w-4" /></button>
                        </>
                      ) : (
                        <>
                          <span className="flex-1 text-sm font-medium text-gray-700">{s.name || 'Unnamed'}</span>
                          <span className="text-sm text-gray-500">&#8377;{(s.base_price || 0).toLocaleString('en-IN')}</span>
                          <span className="text-xs text-gray-400">/ {s.price_unit}</span>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 italic text-sm">No services added</p>
              )}
              {editing.services && (
                <button type="button" onClick={addService} className="inline-flex items-center gap-1 text-sm text-rose-600 hover:text-rose-700">
                  <Plus className="h-4 w-4" /> Add Service
                </button>
              )}
            </div>

            {/* Portfolio URLs */}
            <div className={cardClasses}>
              {sectionHeader('Portfolio', 'portfolio')}
              {portfolioUrls.length > 0 ? (
                <div className="space-y-2">
                  {portfolioUrls.map((url, i) => (
                    <div key={i} className="flex items-center gap-2">
                      {editing.portfolio ? (
                        <>
                          <Link className="h-4 w-4 text-gray-400 shrink-0" />
                          <input value={url} onChange={(e) => updatePortfolio(i, e.target.value)} placeholder="https://..."
                            className={`flex-1 ${inputClasses}`} />
                          <button type="button" onClick={() => removePortfolio(i)} className="text-gray-400 hover:text-rose-500"><X className="h-4 w-4" /></button>
                        </>
                      ) : (
                        <span className="text-sm text-rose-600 flex items-center gap-1.5 truncate">
                          <Link className="h-3.5 w-3.5 shrink-0" /> {url || 'Empty'}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 italic text-sm">No portfolio links</p>
              )}
              {editing.portfolio && (
                <button type="button" onClick={addPortfolio} className="inline-flex items-center gap-1 text-sm text-rose-600 hover:text-rose-700">
                  <Plus className="h-4 w-4" /> Add Link
                </button>
              )}
            </div>

            {/* Custom Fields (AI Detected) */}
            {Object.keys(customFields).length > 0 && (
              <div className={cardClasses}>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-gray-800">AI Detected Fields</h3>
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-rose-600 bg-rose-50 border border-rose-200 rounded-full px-2 py-0.5">
                    <Sparkles className="h-2.5 w-2.5" /> Smart
                  </span>
                </div>
                <div className="space-y-2">
                  {Object.entries(customFields).map(([key, value]) => {
                    const meta = CUSTOM_FIELD_LABELS[key] || { label: key, icon: <Tag className="h-4 w-4" /> };
                    return (
                      <div key={key} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">{meta.icon}</span>
                          <span className="text-sm font-medium text-gray-700">{meta.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {editing[`cf_${key}`] ? (
                            <input value={String(value)} onChange={(e) => updateCustomField(key, e.target.value)}
                              className="w-40 rounded-lg border border-gray-200 px-3 py-1 text-sm outline-none focus:ring-1 focus:ring-rose-300" autoFocus />
                          ) : (
                            <span className="text-sm text-gray-600">{String(value)}</span>
                          )}
                          <button type="button" onClick={() => toggleEdit(`cf_${key}`)} className="text-gray-400 hover:text-rose-500">
                            <Pencil className="h-3 w-3" />
                          </button>
                          <button type="button" onClick={() => removeCustomField(key)} className="text-gray-400 hover:text-rose-500">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Add custom field */}
                <AddCustomFieldButton existing={Object.keys(customFields)} onAdd={(key) => updateCustomField(key, '')} />
              </div>
            )}

            {/* If no custom fields yet, offer to add */}
            {Object.keys(customFields).length === 0 && (
              <div className={cardClasses}>
                <h3 className="text-sm font-semibold text-gray-800">Additional Details</h3>
                <p className="text-xs text-gray-500">Add optional fields like team size, awards, languages, and more.</p>
                <AddCustomFieldButton existing={[]} onAdd={(key) => updateCustomField(key, '')} />
              </div>
            )}

            {/* Profile Completeness */}
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-800">Profile Completeness</span>
                <span className={`text-sm font-bold ${completeness >= 80 ? 'text-green-600' : completeness >= 50 ? 'text-amber-600' : 'text-gray-500'}`}>
                  {completeness}%
                </span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${completeness}%` }}
                  transition={{ duration: 0.6 }}
                  className={`h-full rounded-full ${completeness >= 80 ? 'bg-green-500' : completeness >= 50 ? 'bg-amber-500' : 'bg-gray-400'}`}
                />
              </div>
            </div>

            {/* Submit */}
            <motion.button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-rose-500 text-white font-semibold py-3.5 px-6 shadow-lg hover:bg-rose-600 hover:shadow-xl transition disabled:opacity-60"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              {submitting ? 'Submitting...' : 'Submit for Review'}
            </motion.button>
          </motion.div>
        )}

        {/* ─── SUCCESS ─── */}
        {step === 'success' && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={`${cardClasses} text-center`}>
            <div className="flex justify-center mb-2">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Registration Submitted!</h2>
            <p className="text-sm text-gray-600 max-w-md mx-auto">
              Your vendor profile is now pending review. Here's what happens next:
            </p>
            <div className="text-left bg-gray-50 rounded-lg p-4 space-y-2 text-sm text-gray-600">
              <p className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500 shrink-0" /> Our team reviews your profile (usually within 24 hours)</p>
              <p className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500 shrink-0" /> Once approved, your profile goes live on the marketplace</p>
              <p className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500 shrink-0" /> Couples will be able to discover and invite you to bid on their weddings</p>
            </div>
            <div className="flex gap-3 justify-center pt-2">
              <button onClick={() => navigate('/vendor/dashboard')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-500 text-white font-semibold text-sm hover:bg-rose-600 transition">
                Go to Dashboard <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Footer */}
        {step !== 'success' && (
          <p className="mt-6 text-center text-sm text-gray-500">
            Already registered?{' '}
            <button onClick={() => { setRole('vendor'); navigate('/vendor/dashboard'); }} className="text-rose-600 hover:underline font-medium">
              Switch to vendor view
            </button>
          </p>
        )}
      </motion.div>
    </div>
  );
};

// ── Sub-component: Add Custom Field Button ──
const AddCustomFieldButton: React.FC<{ existing: string[]; onAdd: (key: string) => void }> = ({ existing, onAdd }) => {
  const [open, setOpen] = useState(false);
  const available = Object.keys(CUSTOM_FIELD_LABELS).filter((k) => !existing.includes(k));
  if (!available.length) return null;
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1 text-sm text-rose-600 hover:text-rose-700">
        <Plus className="h-4 w-4" /> Add Field
      </button>
      {open && (
        <div className="absolute z-10 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 w-56">
          {available.map((key) => {
            const meta = CUSTOM_FIELD_LABELS[key];
            return (
              <button key={key} type="button"
                onClick={() => { onAdd(key); setOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-rose-50 text-left">
                <span className="text-gray-400">{meta.icon}</span> {meta.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default VendorRegister;
