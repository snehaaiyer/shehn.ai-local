import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import {
  Calendar, Users, DollarSign, CheckCircle, Clock,
  Building2, Camera, Utensils, Palette, Music, Scissors, Sparkles,
  MessageCircle, ArrowRight, FileText, IndianRupee,
  ChevronRight, Eye, Send, BarChart3, Mail
} from 'lucide-react';
import { getThemeImage } from '../config/theme_images';
import PlanningJourney from '../components/PlanningJourney';

/* ── Helpers ── */
const fmtCur = (n: number) => n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : `₹${n.toLocaleString('en-IN')}`;
const daysUntil = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    const diff = Math.ceil((d.getTime() - Date.now()) / 86400000);
    return diff > 0 ? diff : 0;
  } catch { return 0; }
};

const CAT_ICONS: Record<string, React.ReactNode> = {
  venue: <Building2 className="w-5 h-5" />, photography: <Camera className="w-5 h-5" />,
  catering: <Utensils className="w-5 h-5" />, decoration: <Palette className="w-5 h-5" />,
  makeup: <Scissors className="w-5 h-5" />, entertainment: <Music className="w-5 h-5" />,
};

/* ── Component ── */
const Index: React.FC = () => {
  const { blueprintId, weddingPreferences } = useAppStore();
  const navigate = useNavigate();
  const [blueprintData, setBlueprintData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Load blueprint data
  useEffect(() => {
    const load = async () => {
      try {
        // Try API first
        if (blueprintId) {
          try {
            const res = await fetch(`/api/blueprint/${blueprintId}`);
            if (res.ok) { setBlueprintData(await res.json()); }
          } catch { /* fallback below */ }
        }
        // Fallback: localStorage preferences
        if (!blueprintData) {
          const saved = localStorage.getItem('weddingPreferences');
          if (saved) {
            const prefs = JSON.parse(saved);
            setBlueprintData({
              wedding_summary: {
                city: prefs.basicDetails?.location || prefs.city,
                guest_count: prefs.basicDetails?.guestCount || prefs.guestCount,
                budget: prefs.basicDetails?.budgetRange || prefs.budget,
                date: prefs.basicDetails?.weddingDate || prefs.weddingDate,
              },
              budget_breakdown: prefs.budget_breakdown || {},
              category_specs: prefs.category_specs || {},
              preferences: prefs,
            });
          }
        }
      } finally { setLoading(false); }
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blueprintId]);

  // Derive data from blueprint
  const summary = blueprintData?.wedding_summary || blueprintData?.preferences?.basicDetails || {};
  const budgetBreakdown = blueprintData?.budget_breakdown || {};
  const categorySpecs = blueprintData?.category_specs || {};
  const theme = blueprintData?.preferences?.theme?.selectedTheme || summary.theme || '';
  const shortlisted = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('shortlistedVendors') || '[]'); } catch { return []; }
  }, []);
  const draftMessages = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('draftVendorMessages') || '[]'); } catch { return []; }
  }, []);
  const totalBudget = Object.values(budgetBreakdown).reduce((s: number, v: any) => s + (Number(v) || 0), 0);
  const categoriesWithBudget = Object.entries(budgetBreakdown).filter(([, v]) => Number(v) > 0);

  // Compute "What's Next" actions based on actual state
  const nextActions = useMemo(() => {
    const actions: Array<{ title: string; desc: string; href: string; icon: React.ReactNode; priority: 'high' | 'medium' | 'low' }> = [];
    if (!blueprintId) {
      actions.push({ title: 'Create your wedding blueprint', desc: 'Tell AI about your dream wedding in one sentence', href: '/plan', icon: <Sparkles className="w-5 h-5" />, priority: 'high' });
    } else {
      if (shortlisted.length === 0) {
        actions.push({ title: 'Review AI-matched vendors', desc: `${categoriesWithBudget.length} categories need vendors`, href: '/vendors', icon: <Users className="w-5 h-5" />, priority: 'high' });
      }
      if (draftMessages.length > 0) {
        actions.push({ title: `Send ${draftMessages.length} draft vendor messages`, desc: 'AI-drafted inquiry messages ready to send', href: '/messages', icon: <Send className="w-5 h-5" />, priority: 'high' });
      }
      const quotesExist = false; // TODO: check from API
      if (!quotesExist && shortlisted.length > 0) {
        actions.push({ title: 'Check incoming quotes', desc: 'Review and compare vendor proposals', href: '/quotes', icon: <IndianRupee className="w-5 h-5" />, priority: 'medium' });
      }
      actions.push({ title: 'Fine-tune your budget', desc: `${fmtCur(totalBudget)} allocated across ${categoriesWithBudget.length} categories`, href: '/budget', icon: <BarChart3 className="w-5 h-5" />, priority: 'low' });
    }
    return actions;
  }, [blueprintId, shortlisted, draftMessages, categoriesWithBudget, totalBudget]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
          <div className="w-12 h-12 border-3 border-rose-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500">Loading your dashboard...</p>
        </motion.div>
      </div>
    );
  }

  /* ── No Blueprint State ── */
  if (!blueprintId && !Object.keys(budgetBreakdown).length) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-6 py-8 max-w-5xl space-y-8">
          <PlanningJourney />

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="relative rounded-2xl overflow-hidden shadow-lg">
            <img src={getThemeImage(null)} alt="Start planning" className="w-full h-64 object-cover"
              onError={(e) => { (e.target as HTMLImageElement).src = '/classic contemporary.png'; }} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
              <h1 className="text-3xl font-bold mb-2">Welcome to Shehnai</h1>
              <p className="text-white/80 mb-4">Your AI wedding planner. Describe your dream wedding and we'll handle the rest.</p>
              <button onClick={() => navigate('/plan')}
                className="px-6 py-3 bg-rose-500 text-white rounded-xl font-semibold hover:bg-rose-600 transition-colors flex items-center gap-2">
                <Sparkles className="w-5 h-5" /> Start Planning <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { title: 'AI Plans Everything', desc: 'Budget, vendors, timeline — generated from one sentence', icon: <Sparkles className="w-8 h-8 text-rose-500" /> },
              { title: 'Vendors Come to You', desc: 'Publish your blueprint and receive competitive quotes', icon: <Users className="w-8 h-8 text-rose-500" /> },
              { title: 'Compare & Book', desc: 'Side-by-side quote comparison with AI analysis', icon: <CheckCircle className="w-8 h-8 text-rose-500" /> },
            ].map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="bg-white border border-gray-200 rounded-2xl p-6 text-center">
                <div className="mx-auto mb-3">{f.icon}</div>
                <h3 className="font-semibold text-gray-800 mb-1">{f.title}</h3>
                <p className="text-sm text-gray-500">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ── Blueprint Exists — Full Dashboard ── */
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-6 py-8 max-w-7xl space-y-6">
        {/* Planning Progress */}
        <PlanningJourney />

        {/* Hero Banner with real data */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="relative rounded-2xl overflow-hidden shadow-lg">
          <img src={getThemeImage(theme)} alt="Wedding theme"
            className="w-full h-52 object-cover"
            onError={(e) => { (e.target as HTMLImageElement).src = '/classic contemporary.png'; }} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="flex items-end justify-between">
              <div className="text-white">
                <h1 className="text-2xl font-bold mb-1">
                  {summary.city ? `Wedding in ${summary.city}` : 'Your Wedding Dashboard'}
                </h1>
                <div className="flex items-center gap-4 text-white/80 text-sm">
                  {summary.date && <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {summary.date} ({daysUntil(summary.date)} days)</span>}
                  {summary.guest_count && <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {summary.guest_count} guests</span>}
                  {totalBudget > 0 && <span className="flex items-center gap-1"><IndianRupee className="w-4 h-4" /> {fmtCur(totalBudget)}</span>}
                </div>
              </div>
              <Link to="/plan" className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg text-sm hover:bg-white/30 transition-colors flex items-center gap-1">
                <Sparkles className="w-4 h-4" /> Chat with AI
              </Link>
            </div>
          </div>
        </motion.div>

        {/* What's Next — AI-driven action items */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-rose-500" /> What's Next
          </h2>
          <div className="space-y-3">
            {nextActions.slice(0, 3).map((action, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => navigate(action.href)}
                className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-rose-200 hover:bg-rose-50/30 cursor-pointer transition-all group">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    action.priority === 'high' ? 'bg-rose-100 text-rose-600' :
                    action.priority === 'medium' ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-500'
                  }`}>{action.icon}</div>
                  <div>
                    <h3 className="font-medium text-gray-800">{action.title}</h3>
                    <p className="text-sm text-gray-500">{action.desc}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-rose-400 transition-colors" />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Budget Breakdown — from real blueprint data */}
        {categoriesWithBudget.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">Budget Breakdown</h2>
              <Link to="/budget" className="text-sm text-rose-500 hover:text-rose-600 flex items-center gap-1">
                Manage <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {/* Total bar */}
            <div className="mb-4 p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Total Allocated</span>
                <span className="font-bold text-gray-800">{fmtCur(totalBudget)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="h-2 rounded-full bg-rose-400" style={{ width: '100%' }} />
              </div>
            </div>
            {/* Category cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {categoriesWithBudget.map(([cat, amount]: [string, any]) => {
                const pct = totalBudget > 0 ? ((Number(amount) / totalBudget) * 100).toFixed(0) : '0';
                const hasShortlisted = shortlisted.some((v: any) => typeof v === 'object' ? v.category === cat : false);
                return (
                  <div key={cat} className={`rounded-xl p-4 text-center border transition-all ${
                    hasShortlisted ? 'border-green-200 bg-green-50' : 'border-gray-100 bg-gray-50'
                  }`}>
                    <div className="w-8 h-8 mx-auto mb-2 rounded-lg bg-rose-100 text-rose-500 flex items-center justify-center">
                      {CAT_ICONS[cat] || <FileText className="w-5 h-5" />}
                    </div>
                    <p className="text-xs text-gray-500 capitalize mb-1">{cat}</p>
                    <p className="text-sm font-bold text-gray-800">{fmtCur(Number(amount))}</p>
                    <p className="text-xs text-gray-400">{pct}%</p>
                    {hasShortlisted && <CheckCircle className="w-3 h-3 text-green-500 mx-auto mt-1" />}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Two-column: Vendor Status + Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Vendor Status */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">Vendor Status</h2>
              <Link to="/vendors" className="text-sm text-rose-500 hover:text-rose-600 flex items-center gap-1">
                View All <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-3">
              {categoriesWithBudget.slice(0, 6).map(([cat, amount]: [string, any]) => {
                const spec = categorySpecs[cat];
                const shortlistedCount = shortlisted.filter((v: any) => typeof v === 'object' ? v.category === cat : false).length;
                const status = shortlistedCount > 0 ? 'shortlisted' : draftMessages.some((m: any) => m.category === cat) ? 'contacted' : 'pending';
                return (
                  <div key={cat} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-500 flex items-center justify-center">
                        {CAT_ICONS[cat] || <FileText className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800 capitalize">{cat}</p>
                        <p className="text-xs text-gray-400">{fmtCur(Number(amount))}{spec?.requirements?.style ? ` · ${spec.requirements.style}` : ''}</p>
                      </div>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      status === 'shortlisted' ? 'bg-green-100 text-green-700' :
                      status === 'contacted' ? 'bg-amber-100 text-amber-700' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {status === 'shortlisted' ? `${shortlistedCount} shortlisted` :
                       status === 'contacted' ? 'Draft ready' : 'Pending'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Navigation */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { title: 'AI Planner', desc: 'Chat & modify plan', href: '/plan', icon: <Sparkles className="w-5 h-5" />, color: 'bg-rose-50 text-rose-500' },
                { title: 'Find Vendors', desc: 'AI-matched for you', href: '/vendors', icon: <Users className="w-5 h-5" />, color: 'bg-indigo-50 text-indigo-500' },
                { title: 'View Quotes', desc: 'Compare proposals', href: '/quotes', icon: <IndianRupee className="w-5 h-5" />, color: 'bg-amber-50 text-amber-500' },
                { title: 'Messages', desc: `${draftMessages.length > 0 ? `${draftMessages.length} drafts` : 'Inbox'}`, href: '/messages', icon: <MessageCircle className="w-5 h-5" />, color: 'bg-green-50 text-green-500' },
                { title: 'Budget', desc: fmtCur(totalBudget), href: '/budget', icon: <DollarSign className="w-5 h-5" />, color: 'bg-purple-50 text-purple-500' },
                { title: 'Invites', desc: 'RSVP & events', href: '/wedding-invites', icon: <Mail className="w-5 h-5" />, color: 'bg-cyan-50 text-cyan-500' },
              ].map((a, i) => (
                <Link key={i} to={a.href}
                  className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${a.color}`}>{a.icon}</div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{a.title}</p>
                    <p className="text-xs text-gray-400">{a.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Cost-Saving Tips from AI */}
        {blueprintData?.cost_saving_tips?.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-green-800 mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5" /> AI Cost-Saving Tips
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {blueprintData.cost_saving_tips.slice(0, 4).map((tip: string, i: number) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-green-700">{tip}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
