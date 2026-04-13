import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import {
  Calendar, Users, DollarSign, CheckCircle, Clock,
  Building2, Camera, Utensils, Palette, Music, Scissors, Sparkles,
  MessageCircle, ArrowRight, FileText, IndianRupee,
  ChevronRight, Eye, Send, BarChart3, Mail, TrendingUp
} from 'lucide-react';
import { getThemeImage } from '../config/theme_images';
import { API_BASE } from '../config/api_config';
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
  venue: <Building2 className="w-4 h-4" />, photography: <Camera className="w-4 h-4" />,
  catering: <Utensils className="w-4 h-4" />, decoration: <Palette className="w-4 h-4" />,
  makeup: <Scissors className="w-4 h-4" />, entertainment: <Music className="w-4 h-4" />,
};

const CAT_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  venue: { bg: 'bg-blue-50', text: 'text-blue-700', icon: 'text-blue-500' },
  photography: { bg: 'bg-amber-50', text: 'text-amber-700', icon: 'text-amber-500' },
  catering: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: 'text-emerald-500' },
  decoration: { bg: 'bg-rose-50', text: 'text-rose-700', icon: 'text-rose-500' },
  makeup: { bg: 'bg-pink-50', text: 'text-pink-700', icon: 'text-pink-500' },
  entertainment: { bg: 'bg-purple-50', text: 'text-purple-700', icon: 'text-purple-500' },
};

/* ── Stagger Animation ── */
const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
};

/* ── Component ── */
const Index: React.FC = () => {
  const { blueprintId, weddingPreferences, theme: appTheme } = useAppStore();
  const isDark = appTheme === 'dark';
  const navigate = useNavigate();
  const [blueprintData, setBlueprintData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Load blueprint data
  useEffect(() => {
    const load = async () => {
      try {
        if (blueprintId) {
          try {
            const res = await fetch(`${API_BASE}/api/blueprints/${blueprintId}`, { headers: { 'X-User-Role': 'couple', 'X-User-Id': '1', 'Content-Type': 'application/json' } });
            if (res.ok) { const json = await res.json(); if (json.success && json.data) setBlueprintData(json.data); else setBlueprintData(json); }
          } catch { /* fallback below */ }
        }
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

  const nextActions = useMemo(() => {
    const actions: Array<{ title: string; desc: string; href: string; icon: React.ReactNode; priority: 'high' | 'medium' | 'low' }> = [];
    if (!blueprintId) {
      actions.push({ title: 'Create your wedding blueprint', desc: 'Tell AI about your dream wedding in one sentence', href: '/plan', icon: <Sparkles className="w-5 h-5" />, priority: 'high' });
    } else {
      if (shortlisted.length === 0) {
        actions.push({ title: 'Review AI-matched vendors', desc: `${categoriesWithBudget.length} categories need vendors`, href: '/vendors', icon: <Users className="w-5 h-5" />, priority: 'high' });
      }
      if (draftMessages.length > 0) {
        actions.push({ title: `Send ${draftMessages.length} draft messages`, desc: 'AI-drafted inquiry messages ready to send', href: '/messages', icon: <Send className="w-5 h-5" />, priority: 'high' });
      }
      actions.push({ title: 'Check incoming quotes', desc: 'Review and compare vendor proposals', href: '/quotes', icon: <IndianRupee className="w-5 h-5" />, priority: 'medium' });
      actions.push({ title: 'Fine-tune your budget', desc: `${fmtCur(totalBudget)} allocated across ${categoriesWithBudget.length} categories`, href: '/budget', icon: <BarChart3 className="w-5 h-5" />, priority: 'low' });
    }
    return actions;
  }, [blueprintId, shortlisted, draftMessages, categoriesWithBudget, totalBudget]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <div className={`w-10 h-10 border-[3px] rounded-full animate-spin mx-auto mb-4 ${isDark ? 'border-gray-700 border-t-rose-400' : 'border-rose-200 border-t-rose-500'}`} />
          <p className={`text-sm font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Loading dashboard...</p>
        </motion.div>
      </div>
    );
  }

  /* ── No Blueprint State ── */
  if (!blueprintId && !Object.keys(budgetBreakdown).length) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-3 sm:px-6 py-4 sm:py-8 max-w-5xl space-y-6 sm:space-y-8">
          <PlanningJourney />
          {/* No-blueprint hero */}

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="relative rounded-3xl overflow-hidden shadow-elevated">
            <img src={getThemeImage(null)} alt="Start planning" className="w-full h-72 object-cover"
              onError={(e) => { (e.target as HTMLImageElement).src = '/classic contemporary.png'; }} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome to Shehn.AI</h1>
                <p className="text-white/70 text-base mb-5 max-w-md">Your AI wedding planner. Describe your dream wedding and we'll handle the rest.</p>
                <button onClick={() => navigate('/plan')}
                  className="btn-primary px-7 py-3 text-base flex items-center gap-2.5 shadow-lg">
                  <Sparkles className="w-5 h-5" /> Start Planning <ArrowRight className="w-4 h-4 ml-1" />
                </button>
              </motion.div>
            </div>
          </motion.div>

          <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            {[
              { title: 'AI Plans Everything', desc: 'Budget, vendors, timeline — generated from one sentence', icon: <Sparkles className="w-7 h-7 text-rose-500" /> },
              { title: 'Vendors Come to You', desc: 'Publish your blueprint and receive competitive quotes', icon: <Users className="w-7 h-7 text-rose-500" /> },
              { title: 'Compare & Book', desc: 'Side-by-side quote comparison with AI analysis', icon: <CheckCircle className="w-7 h-7 text-rose-500" /> },
            ].map((f, i) => (
              <motion.div key={i} variants={item}
                className={`p-6 text-center group cursor-pointer rounded-2xl border shadow-soft transition-all duration-250 hover:shadow-card ${
                  isDark ? 'bg-gray-800 border-gray-700 hover:border-gray-600' : 'bg-white border-gray-100 hover:border-gray-200'
                }`}
                onClick={() => navigate('/plan')}>
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform ${isDark ? 'bg-rose-900/30' : 'bg-rose-50'}`}>{f.icon}</div>
                <h3 className={`font-semibold mb-1.5 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{f.title}</h3>
                <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    );
  }

  /* ── Blueprint Exists — Full Dashboard ── */
  const daysLeft = summary.date ? daysUntil(summary.date) : null;

  return (
    <div className="min-h-screen">
      <motion.div variants={container} initial="hidden" animate="show"
        className="container mx-auto px-3 sm:px-6 py-4 sm:py-6 max-w-7xl space-y-4 sm:space-y-5">

        {/* Planning Progress */}
        <motion.div variants={item}>
          <PlanningJourney />
        </motion.div>

        {/* Hero Banner */}
        <motion.div variants={item} className="relative rounded-3xl overflow-hidden shadow-elevated">
          <img src={getThemeImage(theme)} alt="Wedding theme"
            className="w-full h-48 object-cover"
            onError={(e) => { (e.target as HTMLImageElement).src = '/classic contemporary.png'; }} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="flex items-end justify-between">
              <div className="text-white">
                <h1 className="text-2xl font-bold tracking-tight mb-1.5">
                  {summary.city ? `Wedding in ${summary.city}` : 'Your Wedding'}
                </h1>
                <div className="flex items-center gap-3 flex-wrap">
                  {summary.date && (
                    <span className="inline-flex items-center gap-1.5 text-white/80 text-sm bg-white/10 backdrop-blur-sm rounded-lg px-2.5 py-1">
                      <Calendar className="w-3.5 h-3.5" /> {summary.date}
                      {daysLeft !== null && <span className="text-white/60">· {daysLeft}d</span>}
                    </span>
                  )}
                  {summary.guest_count && (
                    <span className="inline-flex items-center gap-1.5 text-white/80 text-sm bg-white/10 backdrop-blur-sm rounded-lg px-2.5 py-1">
                      <Users className="w-3.5 h-3.5" /> {summary.guest_count}
                    </span>
                  )}
                  {totalBudget > 0 && (
                    <span className="inline-flex items-center gap-1.5 text-white/80 text-sm bg-white/10 backdrop-blur-sm rounded-lg px-2.5 py-1">
                      <IndianRupee className="w-3.5 h-3.5" /> {fmtCur(totalBudget)}
                    </span>
                  )}
                </div>
              </div>
              <Link to="/plan" className="hidden sm:flex items-center gap-1.5 px-4 py-2 bg-white/15 backdrop-blur-sm text-white rounded-xl text-sm font-medium hover:bg-white/25 transition-all border border-white/10">
                <Sparkles className="w-4 h-4" /> AI Planner
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Stats Row */}
        {daysLeft !== null && (
          <motion.div variants={item} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Days Left', value: `${daysLeft}`, icon: <Clock className="w-4 h-4" />, color: 'text-rose-500' },
              { label: 'Guests', value: `${summary.guest_count || '—'}`, icon: <Users className="w-4 h-4" />, color: 'text-blue-500' },
              { label: 'Budget', value: fmtCur(totalBudget), icon: <IndianRupee className="w-4 h-4" />, color: 'text-emerald-500' },
              { label: 'Categories', value: `${categoriesWithBudget.length}`, icon: <BarChart3 className="w-4 h-4" />, color: 'text-purple-500' },
            ].map((stat, i) => (
              <div key={i} className={`p-4 flex items-center gap-3 rounded-2xl border shadow-soft ${
                isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
              }`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${stat.color} ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  {stat.icon}
                </div>
                <div>
                  <p className={`text-lg font-bold leading-none ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{stat.value}</p>
                  <p className={`text-[11px] font-medium mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{stat.label}</p>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* What's Next */}
        <motion.div variants={item} className={`p-5 rounded-2xl border shadow-card ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
        }`}>
          <h2 className={`text-lg font-semibold tracking-tight flex items-center gap-2 mb-4 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
            <Sparkles className="w-5 h-5 text-rose-500" /> What's Next
          </h2>
          <div className="space-y-2">
            {nextActions.slice(0, 3).map((action, i) => (
              <motion.div key={i}
                whileHover={{ x: 4 }}
                onClick={() => navigate(action.href)}
                className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all group ${
                  isDark
                    ? 'border-gray-700 hover:border-gray-600 hover:bg-gray-700/50'
                    : 'border-gray-100 hover:border-rose-100 hover:bg-rose-50/20'
                }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    action.priority === 'high'
                      ? isDark ? 'bg-rose-900/30 text-rose-400' : 'bg-rose-50 text-rose-500'
                      : action.priority === 'medium'
                      ? isDark ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-50 text-amber-500'
                      : isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-50 text-gray-400'
                  }`}>{action.icon}</div>
                  <div>
                    <h3 className={`text-sm font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{action.title}</h3>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{action.desc}</p>
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 transition-colors ${isDark ? 'text-gray-600 group-hover:text-rose-400' : 'text-gray-300 group-hover:text-rose-400'}`} />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Budget Breakdown */}
        {categoriesWithBudget.length > 0 && (
          <motion.div variants={item} className={`p-5 rounded-2xl border shadow-card ${
            isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-lg font-semibold tracking-tight ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Budget Breakdown</h2>
              <Link to="/budget" className="text-xs font-medium text-rose-500 hover:text-rose-600 flex items-center gap-1 transition-colors">
                Manage <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {/* Total bar */}
            <div className={`mb-4 p-4 rounded-xl border ${
              isDark ? 'bg-gray-700/50 border-gray-600' : 'bg-gradient-to-r from-gray-50 to-rose-50/30 border-gray-100'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Total Allocated</span>
                <span className={`text-lg font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{fmtCur(totalBudget)}</span>
              </div>
              <div className="w-full bg-gray-200/50 rounded-full h-1.5">
                <div className="h-1.5 rounded-full bg-gradient-to-r from-rose-400 to-rose-500" style={{ width: '100%' }} />
              </div>
            </div>
            {/* Category cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
              {categoriesWithBudget.map(([cat, amount]: [string, any]) => {
                const pct = totalBudget > 0 ? ((Number(amount) / totalBudget) * 100).toFixed(0) : '0';
                const hasShortlisted = shortlisted.some((v: any) => typeof v === 'object' ? v.category === cat : false);
                const colors = CAT_COLORS[cat] || { bg: 'bg-gray-50', text: 'text-gray-700', icon: 'text-gray-500' };
                return (
                  <div key={cat} className={`rounded-2xl p-4 text-center border transition-all hover:shadow-soft cursor-pointer ${
                    hasShortlisted
                      ? isDark ? 'border-sage-700 bg-sage-900/30' : 'border-sage-200 bg-sage-50'
                      : isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-100 bg-white'
                  }`} onClick={() => navigate('/budget')}>
                    <div className={`w-9 h-9 mx-auto mb-2 rounded-xl ${isDark ? 'bg-gray-700' : colors.bg} ${colors.icon} flex items-center justify-center`}>
                      {CAT_ICONS[cat] || <FileText className="w-4 h-4" />}
                    </div>
                    <p className={`text-[11px] capitalize font-medium mb-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{cat}</p>
                    <p className={`text-sm font-bold ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>{fmtCur(Number(amount))}</p>
                    <p className={`text-[10px] font-medium ${isDark ? 'text-gray-600' : 'text-gray-300'}`}>{pct}%</p>
                    {hasShortlisted && <CheckCircle className="w-3.5 h-3.5 text-sage-500 mx-auto mt-1" />}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Two-column: Vendor Status + Quick Actions */}
        <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Vendor Status */}
          <div className={`p-5 rounded-2xl border shadow-card ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-lg font-semibold tracking-tight ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Vendor Status</h2>
              <Link to="/vendors" className="text-xs font-medium text-rose-500 hover:text-rose-600 flex items-center gap-1">
                View All <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-2">
              {categoriesWithBudget.slice(0, 6).map(([cat, amount]: [string, any]) => {
                const spec = categorySpecs[cat];
                const shortlistedCount = shortlisted.filter((v: any) => typeof v === 'object' ? v.category === cat : false).length;
                const status = shortlistedCount > 0 ? 'shortlisted' : draftMessages.some((m: any) => m.category === cat) ? 'contacted' : 'pending';
                const colors = CAT_COLORS[cat] || { bg: 'bg-gray-50', text: 'text-gray-700', icon: 'text-gray-500' };
                return (
                  <div key={cat} className={`flex items-center justify-between p-3 rounded-xl transition-colors ${
                    isDark ? 'bg-gray-700/40 hover:bg-gray-700/60' : 'bg-gray-50/70 hover:bg-gray-50'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg ${isDark ? 'bg-gray-700' : colors.bg} ${colors.icon} flex items-center justify-center`}>
                        {CAT_ICONS[cat] || <FileText className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className={`text-sm font-medium capitalize ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{cat}</p>
                        <p className={`text-[11px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{fmtCur(Number(amount))}{spec?.requirements?.style ? ` · ${spec.requirements.style}` : ''}</p>
                      </div>
                    </div>
                    <span className={`badge text-[10px] ${
                      status === 'shortlisted' ? 'badge-sage' :
                      status === 'contacted' ? 'badge-amber' :
                      'bg-gray-100 text-gray-400 border border-gray-200'
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
          <div className={`p-5 rounded-2xl border shadow-card ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
            <h2 className={`text-lg font-semibold tracking-tight mb-4 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Quick Actions</h2>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { title: 'AI Planner', desc: 'Chat & modify plan', href: '/plan', icon: <Sparkles className="w-5 h-5" />, color: 'bg-rose-50 text-rose-500' },
                { title: 'Find Vendors', desc: 'AI-matched for you', href: '/vendors', icon: <Users className="w-5 h-5" />, color: 'bg-blue-50 text-blue-500' },
                { title: 'View Quotes', desc: 'Compare proposals', href: '/quotes', icon: <IndianRupee className="w-5 h-5" />, color: 'bg-amber-50 text-amber-500' },
                { title: 'Messages', desc: `${draftMessages.length > 0 ? `${draftMessages.length} drafts` : 'Inbox'}`, href: '/messages', icon: <MessageCircle className="w-5 h-5" />, color: 'bg-emerald-50 text-emerald-500' },
                { title: 'Budget', desc: fmtCur(totalBudget), href: '/budget', icon: <DollarSign className="w-5 h-5" />, color: 'bg-purple-50 text-purple-500' },
                { title: 'Invites', desc: 'RSVP & events', href: '/wedding-invites', icon: <Mail className="w-5 h-5" />, color: 'bg-cyan-50 text-cyan-500' },
              ].map((a, i) => (
                <Link key={i} to={a.href}
                  className={`flex items-center gap-3 p-3.5 group rounded-2xl border shadow-soft transition-all duration-250 hover:shadow-card ${
                    isDark ? 'bg-gray-800/50 border-gray-700 hover:border-gray-600' : 'bg-white border-gray-100 hover:border-gray-200'
                  }`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-gray-700' : ''} ${a.color} transition-transform group-hover:scale-105`}>{a.icon}</div>
                  <div>
                    <p className={`text-sm font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{a.title}</p>
                    <p className={`text-[11px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{a.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Cost-Saving Tips */}
        {blueprintData?.cost_saving_tips?.length > 0 && (
          <motion.div variants={item} className="bg-gradient-to-r from-sage-50 to-emerald-50/50 rounded-2xl border border-sage-100 p-5">
            <h2 className="section-header text-sage-700 flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-sage-500" /> AI Cost-Saving Tips
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {blueprintData.cost_saving_tips.slice(0, 4).map((tip: string, i: number) => (
                <div key={i} className="flex items-start gap-2.5 bg-white/60 rounded-xl p-3">
                  <CheckCircle className="w-4 h-4 text-sage-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-700 leading-relaxed">{tip}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default Index;
