import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Send, ChevronRight, MapPin, Users, Calendar, IndianRupee, Palette,
  Check, MessageSquare, FileText, Loader2, ArrowRight, RotateCcw, RefreshCw, X, ThumbsUp, ThumbsDown, Upload, History, Clock } from 'lucide-react';
import PDFUploadExtractor from '../components/PDFUploadExtractor';
import { useAppStore, BlueprintData } from '../store/useAppStore';
import { BlueprintService } from '../services/blueprint_service';
import { getThemeImage, VENUE_IMAGES } from '../config/theme_images';
import { API_BASE } from '../config/api_config';

// ── Intent Detection Types ──────────────────────────────────────────────────

type ChatIntent =
  | { type: 'add_event'; detected_events: string[]; raw: string }
  | { type: 'change_budget'; amount?: string; raw: string }
  | { type: 'change_city'; city?: string; raw: string }
  | { type: 'change_guests'; count?: string; raw: string }
  | { type: 'change_theme'; theme?: string; raw: string }
  | { type: 'change_duration'; days?: number; raw: string }
  | { type: 'show_planned_events'; raw: string }
  | { type: 'find_vendors'; category?: string; raw: string }
  | { type: 'show_blueprint'; raw: string }
  | { type: 'help_decide'; context: string; raw: string }
  | { type: 'open_ended'; raw: string };

const ALL_EVENTS = [
  { id: 'mehendi', label: 'Mehendi', emoji: '\uD83C\uDFA8' },
  { id: 'sangeet', label: 'Sangeet', emoji: '\uD83C\uDFB6' },
  { id: 'haldi', label: 'Haldi', emoji: '\uD83D\uDC9B' },
  { id: 'ceremony', label: 'Wedding Ceremony', emoji: '\uD83D\uDC92' },
  { id: 'reception', label: 'Reception', emoji: '\uD83C\uDF89' },
  { id: 'cocktail', label: 'Cocktail Night', emoji: '\uD83C\uDF78' },
  { id: 'engagement', label: 'Engagement', emoji: '\uD83D\uDC8D' },
  { id: 'vidaai', label: 'Vidaai', emoji: '\uD83C\uDF38' },
];

interface InteractiveData {
  type: 'event_checklist' | 'event_selector' | 'budget_input' | 'city_selector' | 'guest_input' | 'theme_selector' | 'confirm_changes';
  options?: any[];
  selected?: string[];
  confirmed?: boolean;
  changes?: Record<string, any>;
  inputValue?: string;
  culture?: string;
}

// ── Existing Types ──────────────────────────────────────────────────────────

interface PlanStep { step: string; title: string; summary: string; data?: any; }
interface PlanResult { success: boolean; steps: PlanStep[]; preferences?: any; blueprintId?: number; ai_summary?: string; }
interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai' | 'system';
  timestamp: Date;
  loading?: boolean;
  interactive?: InteractiveData;
  feedback?: 'helpful' | 'not_helpful' | null;
}

// ── Intent Detection ────────────────────────────────────────────────────────

function detectIntent(message: string, blueprint: BlueprintData | null): ChatIntent {
  const msg = message.toLowerCase().trim();

  // ── SHOW PLANNED EVENTS — "what events", "what's planned", "how many days", "what functions" ──
  // Must come BEFORE multi-detail guard since these are queries about current plan, not new details
  if (/what\s+(events?|functions?)\s+(are|is|have|do\s+i\s+have)\s+(planned|in\s+my|in\s+the|set|scheduled|lined|currently)|what.?s\s+planned|how\s+many\s+days|how\s+many\s+events|show\s+me\s+(my\s+)?(events?|functions?)|list\s+(my\s+)?(events?|functions?)|what\s+are\s+my\s+events/i.test(msg)) {
    // Check if they ALSO mention changing duration (e.g., "what events are planned? i am thinking 2 days")
    const daysMatch = msg.match(/(\d+)\s*days?|(\bone|two|three|four|five)\s*days?/i);
    if (daysMatch) {
      const dayNum = daysMatch[1] ? parseInt(daysMatch[1]) : { 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5 }[(daysMatch[2] || '').toLowerCase()] || 2;
      return { type: 'change_duration', days: dayNum, raw: message };
    }
    return { type: 'show_planned_events', raw: message };
  }

  // ── CHANGE DURATION — "2 days wedding", "make it a 3 day wedding", "thinking 2 days" ──
  if (/\b(thinking|want|make\s+it|change\s+to|set\s+to|prefer)\s+(a\s+)?(\d+|one|two|three|four|five)\s*days?/i.test(msg)
    || /\b(\d+)\s*days?\s*(wedding|celebration|event)/i.test(msg)
    || /\bduration\s*(to|of|is)?\s*(\d+)/i.test(msg)) {
    const daysMatch = msg.match(/(\d+)\s*days?/i) || msg.match(/(one|two|three|four|five)\s*days?/i);
    let dayNum = 2;
    if (daysMatch) {
      dayNum = parseInt(daysMatch[1]) || { 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5 }[(daysMatch[1] || '').toLowerCase()] || 2;
    }
    return { type: 'change_duration', days: dayNum, raw: message };
  }

  // ── MULTI-DETAIL GUARD ──
  // If the message contains 2+ wedding details (city, budget, guests, theme, venue type),
  // it's a rich planning message — NOT a single-field change. Send to Gemini.
  const detailSignals = [
    /\b(mumbai|delhi|bangalore|bengaluru|hyderabad|chennai|kolkata|pune|jaipur|udaipur|goa|lucknow|ahmedabad)\b/i.test(msg),
    /\d+\s*(lakh|lakhs|l\b|crore|cr|L)\b/i.test(msg) || /budget\s*(is|of)?\s*\d/i.test(msg),
    /\d+\s*(guests?|people|pax|invit)/i.test(msg),
    /\b(boho|bohemian|royal|minimalist|modern|traditional|rustic|elegant|vintage|destination|palace|classic)\b/i.test(msg),
    /\b(resort|beach|garden|farmhouse|hotel|banquet|outdoor|heritage|palace)\b/i.test(msg),
    /\b(one\s*day|single\s*day|reception\s*only|ceremony\s*only|just\s*(the\s*)?(reception|ceremony))\b/i.test(msg),
  ];
  const detailCount = detailSignals.filter(Boolean).length;
  if (detailCount >= 2) {
    // Rich planning message — extract all details and update blueprint, then ask Gemini
    return { type: 'open_ended', raw: message };
  }

  // ── SINGLE-INTENT DETECTION (only for focused, single-action messages) ──

  // Add event — catches both direct adds AND advisory questions about events
  if (/add\s+(an?\s+)?event|include\s+(an?\s+)?event|want\s+(a\s+)?event|add\s+(mehendi|sangeet|haldi|ceremony|reception|cocktail|engagement|vidaai)|i\s+want\s+(mehendi|sangeet|haldi|ceremony|reception|cocktail|engagement|vidaai)|include\s+(mehendi|sangeet|haldi|cocktail|engagement|vidaai)|which\s+events?\s+(should|can|do|to)|what\s+events?\s+(should|can|do|for|to)|suggest\s+events?|events?\s+for\s+(a\s+)?(marathi|punjabi|south\s+indian|bengali|gujarati|tamil|telugu|rajasthani|muslim|christian|north\s+indian|sikh)\s+(wedding|shaadi|ceremony)|help\s+me\s+with\s+(which\s+)?events?|what\s+functions?\s+(should|to|for)/i.test(msg)) {
    const detected = ALL_EVENTS.filter(e => msg.includes(e.id) || msg.includes(e.label.toLowerCase())).map(e => e.id);
    return { type: 'add_event', detected_events: detected, raw: message };
  }

  // Change budget — when it's clearly about changing budget amount
  if (/^(change|update|set|increase|decrease)\s+(my\s+)?(wedding\s+)?budget/i.test(msg) || /^budget\s+to\b/i.test(msg)
    || /\b(change|update|set)\s+(the\s+)?budget\s+to\b/i.test(msg)
    || /\bbudget\s+(should\s+be|is|to)\s+\d/i.test(msg)) {
    const amount = msg.match(/\u20B9?\s*(\d+\.?\d*)\s*(lakh|lakhs|l\b|crore|cr)/i);
    return { type: 'change_budget', amount: amount ? amount[0] : undefined, raw: message };
  }

  // Change city — when user mentions changing location/city/wedding venue location
  if (/^(change|move|shift|switch|update|set)\s+(my\s+)?(wedding\s+)?(city|location|venue\s+location|place)\s+to\b/i.test(msg)
    || /\b(change|move|shift)\s+(to|the\s+wedding\s+to)\s+(mumbai|delhi|bangalore|bengaluru|hyderabad|chennai|kolkata|pune|jaipur|udaipur|goa|lucknow|ahmedabad)\b/i.test(msg)
    || /\bwedding\s+(in|at|to)\s+(mumbai|delhi|bangalore|bengaluru|hyderabad|chennai|kolkata|pune|jaipur|udaipur|goa|lucknow|ahmedabad)\b/i.test(msg) && /\b(change|move|shift|switch|update|set)\b/i.test(msg)) {
    const cities = ['mumbai','delhi','bangalore','bengaluru','hyderabad','chennai','kolkata','pune','jaipur','udaipur','goa','lucknow','ahmedabad'];
    const city = cities.find(c => msg.includes(c));
    return { type: 'change_city', city: city, raw: message };
  }

  // Change guests — when it's clearly about guest count
  if (/^(change|update|set|increase|decrease)\s+(my\s+)?(wedding\s+)?guest/i.test(msg) || /^guest\s*(count|number)\s+to\b/i.test(msg)
    || /\b(change|update|set)\s+(the\s+)?guest\s*(count|number|list)?\s+to\b/i.test(msg)
    || /\b(\d{2,4})\s*(guests?|people|pax|invitees)\b/i.test(msg) && /\b(change|update|set|expecting|have|want)\b/i.test(msg)) {
    const count = msg.match(/(\d{2,4})\s*(guests?|people|pax)?/i);
    return { type: 'change_guests', count: count ? count[1] : undefined, raw: message };
  }

  // Change theme — when it's clearly about theme/style
  if (/^(change|update|set|switch)\s+(my\s+)?(wedding\s+)?theme/i.test(msg) || /^theme\s+to\b/i.test(msg)
    || /\b(change|update|set|switch)\s+(the\s+)?(wedding\s+)?theme\s+to\b/i.test(msg)
    || /\b(want|make)\s+(a|it)\s+(royal|minimalist|modern|traditional|bohemian|rustic|elegant|vintage|boho)\b/i.test(msg) && /\b(theme|style|wedding)\b/i.test(msg)) {
    const themes = ['royal','minimalist','modern','traditional','bohemian','rustic','elegant','vintage','destination','palace','boho'];
    const theme = themes.find(t => msg.includes(t));
    return { type: 'change_theme', theme: theme, raw: message };
  }

  // Find vendors
  if (/find\s+vendor|show\s+vendor|recommend\s+(vendor|caterer|photographer|venue|decorator|makeup|dj|entertainment)|search\s+vendor|find\s+(caterer|photographer|venue|decorator|makeup\s+artist|dj)|find\s+makeup/i.test(msg)) {
    const categories: Record<string, string> = { photographer: 'photography', photo: 'photography', caterer: 'catering', food: 'catering', venue: 'venue', decorator: 'decoration', decor: 'decoration', makeup: 'makeup', beauty: 'makeup', dj: 'entertainment', music: 'entertainment', band: 'entertainment' };
    const cat = Object.keys(categories).find(k => msg.includes(k));
    return { type: 'find_vendors', category: cat ? categories[cat] : undefined, raw: message };
  }

  // Show blueprint
  if (/show\s+(my\s+)?plan|view\s+blueprint|what.?s\s+my\s+plan|current\s+plan|my\s+blueprint/i.test(msg)) {
    return { type: 'show_blueprint', raw: message };
  }

  // Help decide
  if (/help\s+me\s+decide|you\s+decide|suggest\s+(for|to)\s+me|what\s+should\s+i\b/i.test(msg)) {
    return { type: 'help_decide', context: message, raw: message };
  }

  // Default: open-ended
  return { type: 'open_ended', raw: message };
}

// ── Constants ───────────────────────────────────────────────────────────────

const EXAMPLE_PROMPTS = [
  "Plan a royal palace wedding in Mumbai for 300 guests with \u20B950 lakh budget in December 2026",
  "Bohemian garden wedding in Goa for 150 guests, budget \u20B925 lakhs",
  "Traditional South Indian wedding in Chennai, 500 guests, \u20B970 lakh budget, February 2027",
  "Intimate minimalist wedding in Jaipur for 80 guests, \u20B912 lakh budget",
];
const QUICK_ACTIONS = [
  { label: "Change budget", icon: IndianRupee }, { label: "Add an event", icon: Calendar },
  { label: "Find makeup artists", icon: Users }, { label: "Re-plan from scratch", icon: RefreshCw },
];

const THEME_OPTIONS = ['Royal', 'Minimalist', 'Modern', 'Traditional', 'Bohemian', 'Rustic', 'Elegant', 'Vintage', 'Destination', 'Palace'];
const CITY_OPTIONS = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Jaipur', 'Udaipur', 'Goa', 'Lucknow', 'Ahmedabad'];

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Lightweight inline markdown to JSX renderer (no external deps). */
const renderMarkdown = (text: string, isDark?: boolean): React.ReactNode => {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let key = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) { elements.push(<br key={key++} />); continue; }

    const bulletMatch = trimmed.match(/^[\*\-\u2022]\s+(.*)$/);
    if (bulletMatch) {
      elements.push(
        <div key={key++} className="flex items-start gap-2 ml-2 my-0.5">
          <span className="text-rose-400 mt-1 text-xs">{'\u2022'}</span>
          <span>{inlineFormat(bulletMatch[1], isDark)}</span>
        </div>
      );
      continue;
    }

    const numMatch = trimmed.match(/^(\d+)[\.\)]\s+(.*)$/);
    if (numMatch) {
      elements.push(
        <div key={key++} className="flex items-start gap-2 ml-2 my-0.5">
          <span className="text-rose-500 font-semibold text-xs mt-0.5 min-w-[16px]">{numMatch[1]}.</span>
          <span>{inlineFormat(numMatch[2], isDark)}</span>
        </div>
      );
      continue;
    }

    elements.push(<p key={key++} className="my-1">{inlineFormat(trimmed, isDark)}</p>);
  }

  return <>{elements}</>;
};

/** Handle inline markdown: **bold**, *italic*, rupee highlights */
const inlineFormat = (text: string, isDark?: boolean): React.ReactNode => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className={`font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{part.slice(2, -2)}</strong>;
    }
    return part.split(/(\u20B9[\d,\.]+(?:\s*(?:L|lakh|lakhs|crore|crores|K))?)/gi).map((seg, j) =>
      /^\u20B9/.test(seg) ? <span key={`${i}-${j}`} className={`font-semibold ${isDark ? 'text-rose-400' : 'text-rose-600'}`}>{seg}</span> : seg
    );
  });
};

const hasGuestCount = (t: string) => /\d+\s*(guests?|people|attendees?|invitees?|pax)/i.test(t) || /for\s+\d{2,4}\b/i.test(t);
const hasDate = (t: string) => /\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/i.test(t)
  || /\b(jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\b/i.test(t) || /\b20[2-3]\d\b/.test(t)
  || /\b(next year|this year|next month|this winter|this summer|next winter|next summer)\b/i.test(t);
const fmtCur = (n: number) => n >= 100000 ? `\u20B9${(n / 100000).toFixed(1)}L` : `\u20B9${n.toLocaleString('en-IN')}`;
const STEP_ICONS: Record<string, React.ReactNode> = {
  preferences_extracted: <Palette className="w-5 h-5" />, blueprint_generated: <FileText className="w-5 h-5" />,
  vendors_matched: <Users className="w-5 h-5" />, messages_drafted: <MessageSquare className="w-5 h-5" />,
};

// ── Component ───────────────────────────────────────────────────────────────

const SmartPlanner: React.FC = () => {
  const navigate = useNavigate();
  const blueprintId = useAppStore(s => s.blueprintId);
  const setBlueprintId = useAppStore(s => s.setBlueprintId);
  const blueprint = useAppStore(s => s.blueprint);
  const setBlueprint = useAppStore(s => s.setBlueprint);
  const updateBlueprint = useAppStore(s => s.updateBlueprint);
  const weddingPreferences = useAppStore(s => s.weddingPreferences);
  const updateWeddingPreferences = useAppStore(s => s.updateWeddingPreferences);
  const setDraftVendorMessages = useAppStore(s => s.setDraftVendorMessages);
  const setPlanningStage = useAppStore(s => s.setPlanningStage);
  const theme = useAppStore(s => s.theme);
  const isDark = theme === 'dark';
  const plannerChatMessages = useAppStore(s => s.plannerChatMessages);
  const setPlannerChatMessages = useAppStore(s => s.setPlannerChatMessages);
  const clearPlannerChatMessages = useAppStore(s => s.clearPlannerChatMessages);

  const [mode, setMode] = useState<'plan' | 'chat'>(blueprintId ? 'chat' : 'plan');
  const [prompt, setPrompt] = useState('');
  const [isPlanning, setIsPlanning] = useState(false);
  const [planResult, setPlanResult] = useState<PlanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [missingDate, setMissingDate] = useState(false);
  const [missingGuests, setMissingGuests] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpGuests, setFollowUpGuests] = useState('');
  const [dateFlexibility, setDateFlexibility] = useState<'exact' | '2weeks' | '1month' | '3months'>('exact');
  // Hydrate from persisted store, converting ISO strings back to Date objects
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    if (plannerChatMessages.length > 0) {
      return plannerChatMessages.map(m => ({
        ...m,
        timestamp: new Date(m.timestamp),
      }));
    }
    return [];
  });
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [showPDFUploader, setShowPDFUploader] = useState(false);
  const [pastBlueprints, setPastBlueprints] = useState<Array<{id: number; title: string; status: string; created_at: string; wedding_summary: any}>>([]);
  const [showPastBlueprints, setShowPastBlueprints] = useState(false);

  // Load past blueprints on mount
  useEffect(() => {
    BlueprintService.listBlueprints().then(res => {
      if (res.success && res.data) {
        setPastBlueprints(res.data as any);
      }
    }).catch(() => {});
  }, [blueprintId]); // reload when blueprintId changes

  const loadPastBlueprint = (bp: any) => {
    setBlueprintId(bp.id);
    const ws = bp.wedding_summary || {};
    setBlueprint({
      city: ws.city || '', date: ws.date || '', guestCount: String(ws.guest_count || ''),
      budget: ws.budget ? `₹${(ws.budget / 100000).toFixed(0)} Lakhs` : '',
      theme: ws.theme || '', events: ws.events || [],
      budgetBreakdown: bp.budget_breakdown || {}, categorySpecs: bp.category_specs || {},
      timeline: bp.timeline || [], costSavingTips: bp.cost_saving_tips || [], aiSummary: '',
    });
    setMode('chat');
    setChatMessages([{
      id: 'restored', sender: 'ai', content: `Welcome back! I've loaded your "${bp.title}" blueprint. What would you like to update?`,
      timestamp: new Date(),
    }]);
    setShowPastBlueprints(false);
  };

  const handleFeedback = (messageId: string, feedback: 'helpful' | 'not_helpful') => {
    setChatMessages(prev => prev.map(m => {
      if (m.id !== messageId) return m;
      const newFeedback = m.feedback === feedback ? null : feedback;
      // Fire and forget to backend
      fetch(`${API_BASE}/api/ai/feedback`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message_id: messageId, feedback: newFeedback, message_content: m.content, timestamp: new Date().toISOString() }),
      }).catch(() => {});
      return { ...m, feedback: newFeedback };
    }));
  };

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const followUpRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Sync chat messages to persisted store (debounced — only non-loading messages)
  useEffect(() => {
    const persistable = chatMessages
      .filter(m => !m.loading)
      .map(m => ({
        id: m.id,
        content: m.content,
        sender: m.sender,
        timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : m.timestamp as unknown as string,
        interactive: m.interactive,
        feedback: m.feedback,
      }));
    setPlannerChatMessages(persistable);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatMessages]);

  useEffect(() => { if (mode === 'plan') inputRef.current?.focus(); }, [mode]);
  useEffect(() => { if (planResult) resultRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [planResult, activeStep]);
  useEffect(() => { if (showFollowUp) followUpRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [showFollowUp]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);

  const loadStoredPrefs = (): Record<string, any> | null => {
    try { const r = localStorage.getItem('weddingPreferences'); if (!r) return null; const p = JSON.parse(r); return p.basicDetails || p; }
    catch { return null; }
  };
  const getPrefsFlat = () => {
    const s = loadStoredPrefs() || {};
    return { city: weddingPreferences.city || s.location || s.city || '', guestCount: weddingPreferences.guestCount || s.guestCount || '',
      budget: weddingPreferences.budget || s.budgetRange || s.budget || '', weddingDate: weddingPreferences.weddingDate || s.weddingDate || '',
      weddingStyle: weddingPreferences.weddingStyle || s.selectedTheme || s.weddingStyle || '' };
  };
  const getSummaryBanner = () => {
    const p = getPrefsFlat(); if (!p.city && !p.budget) return null;
    const parts: string[] = []; if (p.weddingStyle) parts.push(p.weddingStyle);
    parts.push(p.city ? `wedding in ${p.city}` : 'wedding');
    if (p.guestCount) parts.push(`${p.guestCount} guests`); if (p.budget) parts.push(p.budget);
    return parts.join(' -- ');
  };

  useEffect(() => {
    if (mode === 'chat' && chatMessages.length === 0) {
      const p = getPrefsFlat();
      let msg = "Welcome! I'm your wedding planning assistant.\n\n";
      if (p.city && p.budget) { msg += `I have your plan loaded -- ${p.budget} wedding in ${p.city}${p.guestCount ? ` for ${p.guestCount} guests` : ''}.\n\n`; }
      msg += "Ask me anything about your wedding plan, vendors, budget, or timeline!";
      setChatMessages([{ id: '1', content: msg, sender: 'ai', timestamp: new Date() }]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // ── Helper: Add AI text message ───────────────────────────────────────────

  const addAIMessage = (content: string) => {
    setChatMessages(p => [...p, { id: Date.now().toString(), content, sender: 'ai', timestamp: new Date() }]);
  };

  const addInteractiveMessage = (type: InteractiveData['type'], options: any[], selected: string[], changes?: Record<string, any>) => {
    setChatMessages(p => [...p, {
      id: (Date.now() + 1).toString(),
      content: '',
      sender: 'system',
      timestamp: new Date(),
      interactive: { type, options, selected, confirmed: false, changes },
    }]);
  };

  // ── Format blueprint summary ──────────────────────────────────────────────

  const formatBlueprintSummary = (bp: BlueprintData): string => {
    const lines: string[] = ["Here's your current wedding plan:\n"];
    if (bp.city) lines.push(`**City:** ${bp.city}`);
    if (bp.budget) lines.push(`**Budget:** ${bp.budget}`);
    if (bp.guestCount) lines.push(`**Guests:** ${bp.guestCount}`);
    if (bp.theme) lines.push(`**Theme:** ${bp.theme}`);
    if (bp.date) lines.push(`**Date:** ${bp.date}`);
    if (bp.events && bp.events.length > 0) {
      const eventLabels = bp.events.map(eid => ALL_EVENTS.find(e => e.id === eid)?.label || eid);
      lines.push(`**Events:** ${eventLabels.join(', ')}`);
    }
    if (bp.budgetBreakdown && Object.keys(bp.budgetBreakdown).length > 0) {
      lines.push('\n**Budget Breakdown:**');
      Object.entries(bp.budgetBreakdown).forEach(([cat, amt]) => {
        lines.push(`- ${cat}: ${fmtCur(amt)}`);
      });
    }
    return lines.join('\n');
  };

  // ── Intent Handlers ───────────────────────────────────────────────────────

  const handleAddEventIntent = async (intent: Extract<ChatIntent, { type: 'add_event' }>) => {
    const currentEvents = blueprint?.events || [];

    // If user specifically named events (e.g., "add sangeet"), confirm directly
    if (intent.detected_events.length > 0) {
      const newEvents = intent.detected_events.filter(e => !currentEvents.includes(e));
      if (newEvents.length === 0) {
        addAIMessage("Those events are already in your plan! Let me show you what else you can add:");
      } else {
        const labels = newEvents.map(e => ALL_EVENTS.find(a => a.id === e)?.label).filter(Boolean).join(', ');
        addAIMessage(`Adding ${labels} to your plan — confirm below:`);
        addInteractiveMessage('confirm_changes', [], [], { events: [...currentEvents, ...newEvents] });
        return;
      }
    }

    // For all other event queries — fetch the adaptive priority checklist from backend
    setIsChatLoading(true);
    setChatMessages(p => [...p, { id: (Date.now() + 1).toString(), content: '', sender: 'ai', timestamp: new Date(), loading: true }]);

    try {
      const res = await fetch(`${API_BASE}/api/ai/suggest-events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city: blueprint?.city || getPrefsFlat().city || '',
          theme: blueprint?.theme || getPrefsFlat().weddingStyle || '',
          budget: blueprint?.budget || getPrefsFlat().budget || '',
          current_events: currentEvents,
          user_message: intent.raw,
        }),
      });
      const data = await res.json();

      if (data.success && data.data?.suggestions?.length > 0) {
        const { suggestions, detected_culture, in_plan_count, total_events } = data.data;
        const headerMsg = detected_culture !== 'Indian'
          ? `Here's a **${detected_culture} wedding** event checklist, tailored to your plan. ${in_plan_count > 0 ? `You already have ${in_plan_count} of ${total_events} events.` : 'Select the events you\'d like to include:'}`
          : `Here are the events for your wedding. ${in_plan_count > 0 ? `${in_plan_count} already in your plan.` : 'Pick the ones you want:'}`;

        setChatMessages(p => [...p.filter(m => !m.loading), {
          id: Date.now().toString(), content: headerMsg, sender: 'ai', timestamp: new Date(),
        }]);

        // Pre-select all "essential" events that aren't already in the plan
        const preSelected = suggestions
          .filter((s: any) => s.priority === 'essential' && !s.in_plan)
          .map((s: any) => s.id);

        addInteractiveMessage('event_checklist', suggestions, preSelected);
      } else {
        setChatMessages(p => [...p.filter(m => !m.loading)]);
        addAIMessage("Here are the events you can add:");
        const available = ALL_EVENTS.filter(e => !currentEvents.includes(e.id));
        addInteractiveMessage('event_checklist', available.map(e => ({
          id: e.id, label: e.label, desc: '', priority: 'optional', in_plan: false,
          estimated_cost: '', budget_pct: 0,
        })), []);
      }
    } catch {
      setChatMessages(p => [...p.filter(m => !m.loading)]);
      addAIMessage("Here are the events you can add:");
      const available = ALL_EVENTS.filter(e => !currentEvents.includes(e.id));
      addInteractiveMessage('event_selector', available, []);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleChangeBudgetIntent = (intent: Extract<ChatIntent, { type: 'change_budget' }>) => {
    if (intent.amount) {
      // Normalize the budget string
      const budgetStr = intent.amount.replace(/[₹,]/g, '').trim();
      const match = budgetStr.match(/(\d+\.?\d*)\s*(l|lakh|lakhs|crore|cr)/i);
      const displayBudget = match ? `₹${match[1]} ${match[2].toLowerCase().startsWith('c') ? 'Crore' : 'Lakhs'}` : `₹${budgetStr}`;
      updateBlueprint({ budget: displayBudget });
      addAIMessage(`Done! Budget updated to **${displayBudget}**. Category allocations will adjust proportionally.`);
    } else {
      addAIMessage("What would you like your new budget to be? Enter an amount (e.g., 30 lakhs):");
      addInteractiveMessage('budget_input', [], []);
    }
  };

  const handleChangeCityIntent = (intent: Extract<ChatIntent, { type: 'change_city' }>) => {
    if (intent.city) {
      const cityCapitalized = intent.city === 'bengaluru' ? 'Bangalore' : intent.city.charAt(0).toUpperCase() + intent.city.slice(1);
      // Auto-apply immediately — no confirmation needed for simple changes
      updateBlueprint({ city: cityCapitalized });
      addAIMessage(`Done! Your wedding location is now **${cityCapitalized}**. All vendor searches and recommendations will use this city.`);
    } else {
      addAIMessage("Which city would you like to move your wedding to? Pick one:");
      addInteractiveMessage('city_selector', CITY_OPTIONS.map(c => ({ id: c.toLowerCase(), label: c })), []);
    }
  };

  const handleChangeGuestsIntent = (intent: Extract<ChatIntent, { type: 'change_guests' }>) => {
    if (intent.count) {
      updateBlueprint({ guestCount: intent.count });
      addAIMessage(`Done! Guest count updated to **${intent.count}**. Budget per-head and venue capacity recommendations will adjust automatically.`);
    } else {
      addAIMessage("How many guests are you expecting? Enter a number:");
      addInteractiveMessage('guest_input', [], []);
    }
  };

  const handleChangeThemeIntent = (intent: Extract<ChatIntent, { type: 'change_theme' }>) => {
    if (intent.theme) {
      const themeCapitalized = intent.theme.charAt(0).toUpperCase() + intent.theme.slice(1);
      updateBlueprint({ theme: themeCapitalized });
      addAIMessage(`Done! Wedding theme updated to **${themeCapitalized}**. Decoration and ambiance recommendations will reflect this.`);
    } else {
      addAIMessage("What theme would you like for your wedding? Pick one:");
      addInteractiveMessage('theme_selector', THEME_OPTIONS.map(t => ({ id: t.toLowerCase(), label: t })), []);
    }
  };

  const handleHelpDecideIntent = async () => {
    // Route "help me decide" about events to the same adaptive checklist
    await handleAddEventIntent({ type: 'add_event', detected_events: [], raw: 'help me decide which events to add' });
  };

  const handleShowPlannedEventsIntent = () => {
    if (!blueprint || !blueprint.events || blueprint.events.length === 0) {
      addAIMessage("You don't have any events planned yet! Would you like to add some? I can suggest events based on your wedding style and culture.");
      return;
    }
    const eventLabels = blueprint.events.map(eid => {
      const ev = ALL_EVENTS.find(e => e.id === eid);
      return ev ? `${ev.emoji} ${ev.label}` : eid;
    });
    const days = blueprint.weddingDays || Math.ceil(blueprint.events.length / 3) || 1;
    let msg = `Here's what's currently planned for your wedding:\n\n`;
    msg += `**Events (${blueprint.events.length}):** ${eventLabels.join(', ')}\n`;
    msg += `**Duration:** ${days} day${days > 1 ? 's' : ''}\n`;
    if (blueprint.date) msg += `**Date:** ${blueprint.date}\n`;
    if (blueprint.city) msg += `**City:** ${blueprint.city}\n`;
    if (blueprint.guestCount) msg += `**Guests:** ${blueprint.guestCount}\n`;
    if (blueprint.budgetBreakdown && Object.keys(blueprint.budgetBreakdown).length > 0) {
      msg += `\n**Budget Allocation:**\n`;
      Object.entries(blueprint.budgetBreakdown).forEach(([cat, amt]) => {
        msg += `• ${cat.charAt(0).toUpperCase() + cat.slice(1)}: ${fmtCur(amt)}\n`;
      });
    }
    msg += `\nWould you like to add/remove events, change the duration, or adjust anything?`;
    addAIMessage(msg);
  };

  const handleChangeDurationIntent = (intent: Extract<ChatIntent, { type: 'change_duration' }>) => {
    const days = intent.days || 2;
    updateBlueprint({ weddingDays: days });

    // Show current events in context of the new duration
    const currentEvents = blueprint?.events || [];
    const eventLabels = currentEvents.map(eid => {
      const ev = ALL_EVENTS.find(e => e.id === eid);
      return ev ? `${ev.emoji} ${ev.label}` : eid;
    });

    let msg = `Updated! Your wedding is now a **${days}-day celebration**.\n\n`;
    if (currentEvents.length > 0) {
      msg += `**Currently planned events (${currentEvents.length}):**\n${eventLabels.map(l => `• ${l}`).join('\n')}\n\n`;

      // Suggest a day-wise arrangement
      if (days === 1) {
        msg += `**Suggested Day 1 schedule:**\n`;
        currentEvents.forEach(eid => {
          const ev = ALL_EVENTS.find(e => e.id === eid);
          if (ev) msg += `• ${ev.emoji} ${ev.label}\n`;
        });
      } else if (days === 2) {
        const half = Math.ceil(currentEvents.length / 2);
        const day1 = currentEvents.slice(0, half);
        const day2 = currentEvents.slice(half);
        msg += `**Suggested arrangement:**\n`;
        msg += `**Day 1:** ${day1.map(eid => ALL_EVENTS.find(e => e.id === eid)?.label || eid).join(', ')}\n`;
        msg += `**Day 2:** ${day2.map(eid => ALL_EVENTS.find(e => e.id === eid)?.label || eid).join(', ')}\n`;
      } else {
        const perDay = Math.ceil(currentEvents.length / days);
        for (let d = 0; d < days; d++) {
          const dayEvents = currentEvents.slice(d * perDay, (d + 1) * perDay);
          if (dayEvents.length > 0) {
            msg += `**Day ${d + 1}:** ${dayEvents.map(eid => ALL_EVENTS.find(e => e.id === eid)?.label || eid).join(', ')}\n`;
          }
        }
      }
      msg += `\nWould you like to rearrange events across days or add/remove any?`;
    } else {
      msg += `You haven't selected events yet. Would you like me to suggest events for a ${days}-day wedding?`;
    }
    addAIMessage(msg);

    // Persist to backend
    const bpId = useAppStore.getState().blueprintId;
    if (bpId) {
      BlueprintService.updateBlueprint(bpId, { wedding_summary: { wedding_days: days } as any }).catch(() => {});
    }
  };

  // ── Interactive Widget Handlers ───────────────────────────────────────────

  const toggleEventSelection = (messageId: string, eventId: string) => {
    setChatMessages(prev => prev.map(m => {
      if (m.id !== messageId || !m.interactive) return m;
      const selected = m.interactive.selected || [];
      const newSelected = selected.includes(eventId)
        ? selected.filter(s => s !== eventId)
        : [...selected, eventId];
      return { ...m, interactive: { ...m.interactive, selected: newSelected } };
    }));
  };

  const confirmEventSelection = (messageId: string) => {
    const msg = chatMessages.find(m => m.id === messageId);
    if (!msg?.interactive?.selected?.length) return;
    const currentEvents = blueprint?.events || [];
    const newEvents = [...currentEvents, ...msg.interactive.selected];
    applyChanges(messageId, { events: newEvents });
  };

  const toggleOptionSelection = (messageId: string, optionId: string) => {
    setChatMessages(prev => prev.map(m => {
      if (m.id !== messageId || !m.interactive) return m;
      return { ...m, interactive: { ...m.interactive, selected: [optionId] } };
    }));
  };

  const confirmOptionSelection = (messageId: string) => {
    const msg = chatMessages.find(m => m.id === messageId);
    if (!msg?.interactive?.selected?.length) return;
    const selected = msg.interactive.selected[0];
    const type = msg.interactive.type;

    if (type === 'city_selector') {
      const city = CITY_OPTIONS.find(c => c.toLowerCase() === selected) || selected;
      applyChanges(messageId, { city });
    } else if (type === 'theme_selector') {
      const theme = THEME_OPTIONS.find(t => t.toLowerCase() === selected) || selected;
      applyChanges(messageId, { theme });
    }
  };

  const handleInputSubmit = (messageId: string, value: string) => {
    const msg = chatMessages.find(m => m.id === messageId);
    if (!msg?.interactive || !value.trim()) return;

    if (msg.interactive.type === 'budget_input') {
      applyChanges(messageId, { budget: value.trim() });
    } else if (msg.interactive.type === 'guest_input') {
      applyChanges(messageId, { guestCount: value.trim() });
    }
  };

  const updateInteractiveInput = (messageId: string, value: string) => {
    setChatMessages(prev => prev.map(m => {
      if (m.id !== messageId || !m.interactive) return m;
      return { ...m, interactive: { ...m.interactive, inputValue: value } };
    }));
  };

  const applyChanges = (messageId: string, changes?: Record<string, any>) => {
    if (!changes) return;

    if (changes.events) {
      updateBlueprint({ events: changes.events });
      updateWeddingPreferences({ events: changes.events });
    }
    if (changes.budget) {
      updateBlueprint({ budget: changes.budget });
      updateWeddingPreferences({ basicDetails: { ...useAppStore.getState().weddingPreferences.basicDetails, budgetRange: changes.budget } });
    }
    if (changes.city) {
      updateBlueprint({ city: changes.city });
      updateWeddingPreferences({ basicDetails: { ...useAppStore.getState().weddingPreferences.basicDetails, location: changes.city } });
    }
    if (changes.guestCount) {
      updateBlueprint({ guestCount: changes.guestCount });
      updateWeddingPreferences({ basicDetails: { ...useAppStore.getState().weddingPreferences.basicDetails, guestCount: changes.guestCount } });
    }
    if (changes.theme) {
      updateBlueprint({ theme: changes.theme });
      updateWeddingPreferences({ theme: { selectedTheme: changes.theme } });
    }

    // Sync to localStorage
    localStorage.setItem('weddingPreferences', JSON.stringify(useAppStore.getState().weddingPreferences));

    // Mark the message as confirmed
    setChatMessages(prev => prev.map(m =>
      m.id === messageId ? { ...m, interactive: { ...m.interactive!, confirmed: true } } : m
    ));

    addAIMessage("Your plan has been updated! The changes are reflected in your blueprint. Anything else you'd like to adjust?");
  };

  const cancelChanges = (messageId: string) => {
    setChatMessages(prev => prev.map(m =>
      m.id === messageId ? { ...m, interactive: undefined, content: 'Changes cancelled.' } : m
    ));
  };

  // ── Gemini Chat (for open-ended messages) ─────────────────────────────────

  const callGeminiChat = async (msg: string) => {
    setIsChatLoading(true);
    setChatMessages(p => [...p, { id: (Date.now() + 1).toString(), content: '', sender: 'ai', timestamp: new Date(), loading: true }]);
    try {
      let ctx: Record<string, unknown> = {}; try { ctx = JSON.parse(localStorage.getItem('weddingPreferences') || '{}'); } catch {}
      // Inject full blueprint data so AI knows what's actually planned
      const currentBp = useAppStore.getState().blueprint;
      if (currentBp) {
        (ctx as any).blueprint = {
          city: currentBp.city, date: currentBp.date, guestCount: currentBp.guestCount,
          budget: currentBp.budget, theme: currentBp.theme, events: currentBp.events,
          weddingDays: currentBp.weddingDays,
          budgetBreakdown: currentBp.budgetBreakdown, categorySpecs: currentBp.categorySpecs,
          timeline: currentBp.timeline, costSavingTips: currentBp.costSavingTips,
        };
      }
      const res = await fetch(`${API_BASE}/api/ai/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, blueprintId: blueprintId || undefined, context: ctx }) });
      const r = await res.json(); const aiText = r.response || r.data?.response || 'Sorry, I could not process that request.';
      setChatMessages(p => [...p.filter(m => !m.loading), { id: Date.now().toString(), content: aiText, sender: 'ai', timestamp: new Date() }]);
    } catch {
      setChatMessages(p => [...p.filter(m => !m.loading), { id: Date.now().toString(), content: "I'm sorry, I couldn't process your request. Please try again.", sender: 'ai', timestamp: new Date() }]);
    } finally { setIsChatLoading(false); }
  };

  // ── Planning ──────────────────────────────────────────────────────────────

  const buildFinalPrompt = () => {
    let f = prompt.trim(); const extras: string[] = [];
    if (missingGuests && followUpGuests) extras.push(`for ${followUpGuests} guests`);
    if (missingDate && followUpDate) {
      const d = new Date(followUpDate + 'T00:00:00');
      const dateStr = `${d.toLocaleString('en-US', { month: 'long' })} ${d.getDate()}, ${d.getFullYear()}`;
      const flexMap = { exact: '', '2weeks': ' (flexible \u00B12 weeks)', '1month': ' (flexible \u00B11 month)', '3months': ' (flexible \u00B13 months)' };
      extras.push(`on ${dateStr}${flexMap[dateFlexibility]}`);
    }
    return extras.length ? f + ' ' + extras.join(' ') : f;
  };
  const callPlanAPI = async (finalPrompt: string) => {
    setIsPlanning(true); setError(null); setPlanResult(null); setShowFollowUp(false);
    try {
      const res = await fetch(`${API_BASE}/api/ai/plan-wedding`, { method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Role': 'couple', 'X-User-Id': '1' },
        body: JSON.stringify({ prompt: finalPrompt, dateFlexibility: dateFlexibility !== 'exact' ? dateFlexibility : undefined }) });
      const data = await res.json();
      if (data.success) {
        setPlanResult(data);
        const prefs = data.preferences || {};
        const basic = prefs.basicDetails || {};
        const bpStep = data.steps?.find((s: PlanStep) => s.step === 'blueprint_generated');
        setBlueprint({
          city: basic.location || prefs.city || '',
          date: basic.weddingDate || prefs.weddingDate || '',
          guestCount: basic.guestCount || prefs.guestCount || '',
          budget: basic.budgetRange || prefs.budget || '',
          theme: prefs.theme?.selectedTheme || '',
          events: prefs.events || [],
          budgetBreakdown: bpStep?.data?.budget_breakdown || {},
          categorySpecs: bpStep?.data?.category_specs || {},
          timeline: bpStep?.data?.timeline || [],
          costSavingTips: bpStep?.data?.cost_saving_tips || [],
          aiSummary: data.ai_summary || '',
        });
        if (data.blueprintId) setBlueprintId(data.blueprintId);
        setPlanningStage('blueprint');
        if (prefs) { updateWeddingPreferences(prefs); localStorage.setItem('weddingPreferences', JSON.stringify(prefs)); }
        const ms = data.steps?.find((s: PlanStep) => s.step === 'messages_drafted');
        if (ms?.data && Array.isArray(ms.data)) { setDraftVendorMessages(ms.data); localStorage.setItem('draftVendorMessages', JSON.stringify(ms.data)); }
        // Build a rich summary from the generated blueprint for the initial chat message
        const bpData = bpStep?.data || {};
        const ws = bpData.wedding_summary || {};
        const bb = bpData.budget_breakdown || {};
        const budgetLines = Object.entries(bb).map(([cat, amt]: [string, any]) => `- ${cat}: ₹${(Number(amt) / 100000).toFixed(1)}L`).join('\n');
        const summaryMsg = [
          `Your wedding plan is ready! Here's a summary:\n`,
          `**${ws.city || basic.location || 'Your'} Wedding** — ${basic.weddingDate || ws.date || 'Date TBD'}`,
          `**Guests:** ${ws.guest_count || basic.guestCount || '—'} | **Budget:** ₹${(Number(ws.budget || 0) / 100000).toFixed(0)}L`,
          ws.events?.length ? `**Events:** ${(ws.events || []).join(', ')}` : '',
          budgetLines ? `\n**Budget Breakdown:**\n${budgetLines}` : '',
          bpData.cost_saving_tips?.length ? `\n**Cost-Saving Tips:**\n${bpData.cost_saving_tips.slice(0, 3).map((t: string) => `- ${t}`).join('\n')}` : '',
          `\nAsk me to change anything — budget, city, events, theme — or go to **Blueprint** to review and publish!`,
        ].filter(Boolean).join('\n');
        setChatMessages([{ id: '1', content: summaryMsg, sender: 'ai', timestamp: new Date() }]);
        // Switch to chat mode so user can interact
        setMode('chat');
      } else { setError(data.error || 'Failed to plan wedding'); }
    } catch { setError('Something went wrong. Please try again.'); } finally { setIsPlanning(false); }
  };
  const handlePlan = async () => {
    if (!prompt.trim() || isPlanning) return;
    const needD = !hasDate(prompt), needG = !hasGuestCount(prompt);
    if (needD || needG) { setMissingDate(needD); setMissingGuests(needG); setFollowUpDate(''); setFollowUpGuests(''); setShowFollowUp(true); return; }
    await callPlanAPI(prompt.trim());
  };
  const handleFollowUpSubmit = async () => { if ((missingGuests && !followUpGuests) || (missingDate && !followUpDate)) return; await callPlanAPI(buildFinalPrompt()); };

  // ── Extract wedding details from rich messages and silently update blueprint ──

  const extractAndUpdateBlueprint = (msg: string) => {
    const lower = msg.toLowerCase();
    const changes: Partial<BlueprintData> = {};

    // Extract city
    const cityMap: Record<string, string> = {
      'mumbai': 'Mumbai', 'delhi': 'Delhi', 'bangalore': 'Bangalore', 'bengaluru': 'Bangalore',
      'hyderabad': 'Hyderabad', 'chennai': 'Chennai', 'kolkata': 'Kolkata', 'pune': 'Pune',
      'jaipur': 'Jaipur', 'udaipur': 'Udaipur', 'goa': 'Goa', 'lucknow': 'Lucknow', 'ahmedabad': 'Ahmedabad',
    };
    for (const [key, val] of Object.entries(cityMap)) {
      if (lower.includes(key)) { changes.city = val; break; }
    }

    // Extract budget — match patterns like "60L", "60 lakhs", "₹60 lakh", "budget is 30 lakhs"
    const budgetMatch = lower.match(/(\d+)\s*(l\b|lakh|lakhs|crore|cr)/i);
    if (budgetMatch) {
      const num = parseInt(budgetMatch[1]);
      const unit = budgetMatch[2].toLowerCase();
      if (unit.startsWith('cr')) {
        changes.budget = `₹${num} Crore`;
      } else {
        changes.budget = `₹${num} Lakhs`;
      }
    }

    // Extract guest count
    const guestMatch = lower.match(/(\d{2,4})\s*(guests?|people|pax|invit)/i);
    if (guestMatch) { changes.guestCount = guestMatch[1]; }

    // Extract theme
    const themeMap: Record<string, string> = {
      'boho': 'Bohemian', 'bohemian': 'Bohemian', 'royal': 'Royal', 'minimalist': 'Minimalist',
      'modern': 'Modern', 'traditional': 'Traditional', 'rustic': 'Rustic', 'elegant': 'Elegant',
      'vintage': 'Vintage', 'destination': 'Destination', 'palace': 'Royal Palace', 'classic': 'Classic',
    };
    for (const [key, val] of Object.entries(themeMap)) {
      if (lower.includes(key)) { changes.theme = val; break; }
    }

    // Extract events mentioned explicitly
    const eventKeywords: Record<string, string> = {
      'reception only': 'reception', 'just reception': 'reception', 'only reception': 'reception',
      'ceremony only': 'ceremony', 'just ceremony': 'ceremony',
      'reception': 'reception', 'ceremony': 'ceremony', 'sangeet': 'sangeet',
      'mehendi': 'mehendi', 'haldi': 'haldi', 'cocktail': 'cocktail',
    };
    const detectedEvents: string[] = [...(blueprint?.events || [])];
    for (const [key, val] of Object.entries(eventKeywords)) {
      if (lower.includes(key) && !detectedEvents.includes(val)) {
        detectedEvents.push(val);
      }
    }
    // "one day event only reception" — set events to just reception
    if (/only\s+(the\s+)?reception|reception\s+only|just\s+(the\s+)?reception/i.test(lower)) {
      changes.events = ['reception'];
    } else if (detectedEvents.length > (blueprint?.events || []).length) {
      changes.events = detectedEvents;
    }

    // Apply changes if any were found
    if (Object.keys(changes).length > 0) {
      updateBlueprint(changes);

      // Auto-persist to backend if we have a blueprintId
      const bpId = useAppStore.getState().blueprintId;
      if (bpId) {
        const currentBp = useAppStore.getState().blueprint;
        if (currentBp) {
          // Map store fields to API snake_case format
          const patch: any = {};
          const summaryChanges: any = {};
          if (changes.city) summaryChanges.city = changes.city;
          if (changes.budget) {
            // Convert display budget (e.g., "₹30 Lakhs") to numeric for backend
            const budgetNumMatch = changes.budget.match(/(\d+)/);
            if (budgetNumMatch) {
              const num = parseInt(budgetNumMatch[1]);
              summaryChanges.budget = changes.budget.toLowerCase().includes('crore') ? num * 10000000 : num * 100000;
            } else {
              summaryChanges.budget = changes.budget;
            }
          }
          if (changes.guestCount) summaryChanges.guest_count = Number(changes.guestCount);
          if (changes.theme) summaryChanges.theme = changes.theme;
          if (changes.events) summaryChanges.events = changes.events;
          if (changes.date) summaryChanges.date = changes.date;
          if (Object.keys(summaryChanges).length > 0) {
            patch.wedding_summary = summaryChanges;
          }
          if (changes.budgetBreakdown) {
            patch.budget_breakdown = { ...currentBp.budgetBreakdown, ...changes.budgetBreakdown };
          }
          if (Object.keys(patch).length > 0) {
            // Fire and forget — don't block the chat flow
            BlueprintService.updateBlueprint(bpId, patch).catch(() => {});
          }
        }
      }

      // Also update legacy stores
      const legacyUpdates: Record<string, any> = {};
      if (changes.city) legacyUpdates.basicDetails = { ...useAppStore.getState().weddingPreferences.basicDetails, location: changes.city };
      if (changes.budget) legacyUpdates.basicDetails = { ...(legacyUpdates.basicDetails || useAppStore.getState().weddingPreferences.basicDetails), budgetRange: changes.budget };
      if (changes.guestCount) legacyUpdates.basicDetails = { ...(legacyUpdates.basicDetails || useAppStore.getState().weddingPreferences.basicDetails), guestCount: changes.guestCount };
      if (changes.theme) legacyUpdates.theme = { selectedTheme: changes.theme };
      if (changes.events) legacyUpdates.events = changes.events;
      if (Object.keys(legacyUpdates).length > 0) {
        updateWeddingPreferences(legacyUpdates);
        localStorage.setItem('weddingPreferences', JSON.stringify(useAppStore.getState().weddingPreferences));
      }
    }
  };

  // ── Chat Send (intent-aware) ──────────────────────────────────────────────

  const sendChat = async (text?: string) => {
    const msg = text || chatInput.trim();
    if (!msg || isChatLoading) return;

    // Special: re-plan from scratch
    if (msg === 'Re-plan from scratch') {
      useAppStore.getState().clearPlan();
      clearPlannerChatMessages();
      setMode('plan'); setPlanResult(null); setChatMessages([]); setPrompt('');
      return;
    }

    // Add user message
    setChatMessages(p => [...p, { id: Date.now().toString(), content: msg, sender: 'user', timestamp: new Date() }]);
    setChatInput('');

    // Detect intent
    const intent = detectIntent(msg, blueprint);

    switch (intent.type) {
      case 'add_event':
        await handleAddEventIntent(intent);
        break;
      case 'change_budget':
        handleChangeBudgetIntent(intent);
        break;
      case 'change_city':
        handleChangeCityIntent(intent);
        break;
      case 'change_guests':
        handleChangeGuestsIntent(intent);
        break;
      case 'change_theme':
        handleChangeThemeIntent(intent);
        break;
      case 'change_duration':
        handleChangeDurationIntent(intent);
        break;
      case 'show_planned_events':
        handleShowPlannedEventsIntent();
        break;
      case 'find_vendors':
        navigate(intent.category ? `/vendors?category=${intent.category}` : '/vendors');
        addAIMessage(`Taking you to vendor discovery${intent.category ? ` for ${intent.category}` : ''}!`);
        break;
      case 'show_blueprint':
        if (blueprint) {
          addAIMessage(formatBlueprintSummary(blueprint));
        } else {
          addAIMessage("You don't have a blueprint yet. Tell me about your dream wedding to get started!");
        }
        break;
      case 'help_decide':
        await handleHelpDecideIntent();
        break;
      case 'open_ended':
      default:
        // Before calling Gemini, extract any wedding details and silently update blueprint
        extractAndUpdateBlueprint(msg);
        await callGeminiChat(msg);
        break;
    }
  };

  // ── Render Interactive Widgets ────────────────────────────────────────────

  const renderInteractiveWidget = (msg: ChatMessage) => {
    if (!msg.interactive) return null;
    const { type, options, selected, confirmed, changes, inputValue } = msg.interactive;

    if (confirmed) {
      return (
        <div className={`rounded-lg p-3 border mt-2 ${isDark ? 'bg-green-900/30 border-green-800' : 'bg-green-50 border-green-200'}`}>
          <div className={`flex items-center gap-2 text-sm font-medium ${isDark ? 'text-green-400' : 'text-green-700'}`}>
            <Check className="w-4 h-4" /> Changes applied to your plan
          </div>
        </div>
      );
    }

    switch (type) {
      case 'event_checklist': {
        const PRIORITY_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
          essential: { label: 'Essential', color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200' },
          recommended: { label: 'Recommended', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
          optional: { label: 'Optional', color: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-200' },
        };
        const groups: Record<string, any[]> = { essential: [], recommended: [], optional: [] };
        (options || []).forEach((evt: any) => {
          const group = groups[evt.priority] || groups.optional;
          group.push(evt);
        });
        const selectable = (options || []).filter((e: any) => !e.in_plan);
        const selectedCount = (selected || []).length;

        return (
          <div className="space-y-3 mt-2 max-w-lg">
            {Object.entries(groups).map(([priority, events]) => {
              if (events.length === 0) return null;
              const config = PRIORITY_CONFIG[priority];
              return (
                <div key={priority}>
                  <div className={`text-xs font-bold uppercase tracking-wider mb-1.5 ${config.color}`}>
                    {config.label}
                  </div>
                  <div className="space-y-1.5">
                    {events.map((evt: any) => {
                      const isSelected = (selected || []).includes(evt.id);
                      const emoji = ALL_EVENTS.find(e => e.id === evt.id)?.emoji || '';
                      return (
                        <button
                          key={evt.id}
                          disabled={evt.in_plan}
                          onClick={() => !evt.in_plan && toggleEventSelection(msg.id, evt.id)}
                          className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all ${
                            evt.in_plan
                              ? 'bg-green-50 border-green-200 opacity-70 cursor-default'
                              : isSelected
                                ? `${config.bg} ${config.border} ring-2 ring-rose-300`
                                : `bg-white border-gray-200 hover:${config.bg} hover:${config.border}`
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <div className={`mt-0.5 w-5 h-5 rounded flex-shrink-0 flex items-center justify-center border ${
                              evt.in_plan
                                ? 'bg-green-500 border-green-500 text-white'
                                : isSelected
                                  ? 'bg-rose-500 border-rose-500 text-white'
                                  : 'border-gray-300 bg-white'
                            }`}>
                              {(evt.in_plan || isSelected) && <Check className="w-3 h-3" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-gray-800">
                                  {emoji} {evt.label}
                                </span>
                                {evt.in_plan && (
                                  <span className="text-[10px] font-medium text-green-600 bg-green-100 px-1.5 py-0.5 rounded-full">In plan</span>
                                )}
                                {evt.estimated_cost && !evt.in_plan && (
                                  <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full ml-auto flex-shrink-0">{evt.estimated_cost}</span>
                                )}
                              </div>
                              {evt.desc && (
                                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{evt.desc}</p>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {selectedCount > 0 && (
              <button
                onClick={() => confirmEventSelection(msg.id)}
                className="w-full px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-all flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                Add {selectedCount} event{selectedCount > 1 ? 's' : ''} to blueprint
              </button>
            )}
            {selectedCount === 0 && selectable.length > 0 && (
              <p className="text-xs text-gray-400 text-center">Tap events to select, then add to your blueprint</p>
            )}
          </div>
        );
      }

      case 'event_selector':
        return (
          <div className="space-y-3 mt-2">
            <div className="flex flex-wrap gap-2">
              {(options || []).map((evt: any) => (
                <button
                  key={evt.id}
                  onClick={() => toggleEventSelection(msg.id, evt.id)}
                  className={`px-3 py-2 rounded-full text-sm font-medium transition-all ${
                    (selected || []).includes(evt.id)
                      ? 'bg-rose-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {evt.emoji} {evt.label}
                </button>
              ))}
            </div>
            {(selected || []).length > 0 && (
              <button
                onClick={() => confirmEventSelection(msg.id)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-all"
              >
                Add {(selected || []).length} event{(selected || []).length > 1 ? 's' : ''} to plan
              </button>
            )}
          </div>
        );

      case 'city_selector':
      case 'theme_selector':
        return (
          <div className="space-y-3 mt-2">
            <div className="flex flex-wrap gap-2">
              {(options || []).map((opt: any) => (
                <button
                  key={opt.id}
                  onClick={() => toggleOptionSelection(msg.id, opt.id)}
                  className={`px-3 py-2 rounded-full text-sm font-medium transition-all ${
                    (selected || []).includes(opt.id)
                      ? 'bg-rose-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {(selected || []).length > 0 && (
              <button
                onClick={() => confirmOptionSelection(msg.id)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-all"
              >
                Confirm selection
              </button>
            )}
          </div>
        );

      case 'budget_input':
      case 'guest_input':
        return (
          <div className="flex gap-2 mt-2">
            <input
              type="text"
              value={inputValue || ''}
              onChange={e => updateInteractiveInput(msg.id, e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleInputSubmit(msg.id, inputValue || ''); }}
              placeholder={type === 'budget_input' ? 'e.g., 30 lakhs' : 'e.g., 200'}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none"
            />
            <button
              onClick={() => handleInputSubmit(msg.id, inputValue || '')}
              disabled={!(inputValue || '').trim()}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Update
            </button>
          </div>
        );

      case 'confirm_changes':
        return (
          <div className="flex gap-2 mt-2">
            <button onClick={() => applyChanges(msg.id, changes)} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-all">
              <Check className="w-3 h-3 inline mr-1" /> Confirm
            </button>
            <button onClick={() => cancelChanges(msg.id)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-300 transition-all">
              <X className="w-3 h-3 inline mr-1" /> Cancel
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  // ── Step Content Renderer ─────────────────────────────────────────────────

  const renderStepContent = (step: PlanStep, prefs: any) => {
    if (step.step === 'preferences_extracted' && prefs) {
      const items = [
        { icon: <MapPin className="w-4 h-4" />, label: 'City', value: prefs.basicDetails?.location },
        { icon: <Users className="w-4 h-4" />, label: 'Guests', value: prefs.basicDetails?.guestCount },
        { icon: <IndianRupee className="w-4 h-4" />, label: 'Budget', value: prefs.basicDetails?.budgetRange },
        { icon: <Calendar className="w-4 h-4" />, label: 'Date', value: prefs.basicDetails?.weddingDate },
        { icon: <Palette className="w-4 h-4" />, label: 'Theme', value: prefs.theme?.selectedTheme },
        { icon: <Sparkles className="w-4 h-4" />, label: 'Events', value: prefs.events?.length + ' events' },
      ].filter(x => x.value);
      return (<div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {items.map((x, i) => (<div key={i} className="bg-gray-50 rounded-lg p-3 flex items-center gap-2">
          <div className="text-rose-500">{x.icon}</div><div><p className="text-xs text-gray-400">{x.label}</p><p className="text-sm font-medium text-gray-800">{x.value}</p></div>
        </div>))}
      </div>);
    }
    if (step.step === 'blueprint_generated' && step.data) {
      const catImages: Record<string, string> = {
        venue: VENUE_IMAGES[Object.keys(VENUE_IMAGES).find(k => k.includes((step.data?.category_specs?.venue?.requirements?.type || 'banquet').split('+')[0].trim().toLowerCase().replace(/\s/g, '-'))) || 'banquet-halls'] || '/images/venues/banquet.png',
        photography: '/vintage.png',
        catering: '/images/themes/traditional-cultural.jpg',
        decoration: getThemeImage(planResult?.preferences?.theme?.selectedTheme),
        makeup: '/images/themes/bollywood-sangeet.jpg',
        entertainment: '/bollywoodglamor.png',
      };
      return (<div className="space-y-4">
        {step.data.budget_breakdown && <div><h4 className="text-sm font-semibold text-gray-700 mb-2">Budget Breakdown</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">{Object.entries(step.data.budget_breakdown).map(([c, a]: [string, any]) => (
            <div key={c} className="bg-gray-50 rounded-lg overflow-hidden">
              {catImages[c] && <img src={catImages[c]} alt={c} className="w-full h-20 object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
              <div className="p-3 text-center"><p className="text-xs text-gray-500 capitalize">{c}</p><p className="text-lg font-bold text-gray-800">{fmtCur(a)}</p>
                {step.data.category_specs?.[c]?.requirements?.style && <p className="text-xs text-gray-400 mt-0.5">{step.data.category_specs[c].requirements.style}</p>}
              </div>
            </div>
          ))}</div></div>}
        {step.data.ai_insights?.length > 0 && <div className="bg-indigo-50 rounded-lg p-4"><h4 className="text-sm font-semibold text-indigo-700 mb-2">AI Insider Tips</h4>
          {step.data.ai_insights.map((t: string, i: number) => <p key={i} className="text-sm text-indigo-600 mb-1">{t}</p>)}</div>}
        {step.data.cost_saving_tips?.length > 0 && <div className="bg-green-50 rounded-lg p-4"><h4 className="text-sm font-semibold text-green-700 mb-2">Cost-Saving Tips</h4>
          {step.data.cost_saving_tips.slice(0, 4).map((t: string, i: number) => <p key={i} className="text-sm text-green-600 mb-1">{t}</p>)}</div>}
      </div>);
    }
    if (step.step === 'vendors_matched' && step.data) return (<div className="space-y-2">
      {step.data.map((v: any, i: number) => (<div key={i} className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
        <div><p className="text-sm font-medium text-gray-800 capitalize">{v.business_name || `${v.category} Vendor`}</p>
          <p className="text-xs text-gray-500">{v.ai_recommendation || v.match_reason || v.category}</p></div>
        <div className="text-right"><p className="text-sm font-bold text-gray-700">{fmtCur(v.budget_allocated)}</p>
          <p className="text-xs text-rose-500">{v.status === 'awaiting_vendor_bids' ? 'Awaiting bids' : 'Matched'}</p></div>
      </div>))}</div>);
    if (step.step === 'messages_drafted' && step.data) return (<div className="space-y-3">
      {step.data.map((m: any, i: number) => (<div key={i} className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2"><span className="text-xs font-semibold text-rose-600 uppercase">{m.category}</span>
          <span className="text-xs text-gray-400">{fmtCur(m.budget_allocated)}</span></div>
        <p className="text-sm text-gray-700 leading-relaxed">{m.message}</p>
        <div className="mt-2 flex justify-end"><span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Draft -- ready to send</span></div>
      </div>))}</div>);
    return null;
  };

  // ── Chat UI ───────────────────────────────────────────────────────────────

  const renderChat = () => (
    <div className={`rounded-2xl shadow-lg border overflow-hidden ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
      <div className={`px-4 sm:px-6 py-3 sm:py-4 border-b flex items-center justify-between ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-rose-500" /><h3 className={`font-semibold text-sm sm:text-base ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>Chat with ShehnAI</h3>
        </div>
        <button onClick={() => setShowPDFUploader(!showPDFUploader)}
          className={`flex items-center gap-1.5 text-xs px-2 sm:px-3 py-1.5 rounded-lg border transition-all ${
            showPDFUploader
              ? isDark ? 'bg-rose-900/30 border-rose-800 text-rose-400' : 'bg-rose-50 border-rose-200 text-rose-600'
              : isDark ? 'bg-gray-700 border-gray-600 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600'
          }`}>
          <Upload className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Upload PDF</span><span className="sm:hidden">PDF</span>
        </button>
      </div>
      {showPDFUploader && (
        <div className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
          <PDFUploadExtractor onClose={() => setShowPDFUploader(false)} />
        </div>
      )}
      <div className={`max-h-[50vh] sm:max-h-[60vh] overflow-y-auto p-3 sm:p-4 space-y-3 ${isDark ? 'bg-gray-800' : ''}`}>
        {chatMessages.map(msg => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.loading ? (
              <div className={`flex items-center gap-2 px-4 py-3 rounded-2xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <Loader2 className="w-4 h-4 animate-spin text-rose-400" /><span className="text-sm text-gray-400">Thinking...</span>
              </div>
            ) : msg.sender === 'user' ? (
              <div className="px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl max-w-[85%] sm:max-w-xs lg:max-w-lg xl:max-w-2xl bg-rose-500 text-white"><p className="text-sm">{msg.content}</p></div>
            ) : msg.sender === 'system' || msg.interactive ? (
              <div className="flex items-start gap-2 max-w-[90%] sm:max-w-sm lg:max-w-xl xl:max-w-3xl">
                <div className={`p-1.5 rounded-full flex-shrink-0 mt-0.5 ${isDark ? 'bg-rose-900/40' : 'bg-rose-100'}`}><Sparkles className="w-3 h-3 text-rose-500" /></div>
                <div className={`px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl text-sm leading-relaxed ${isDark ? 'bg-gray-700 border border-gray-600 text-gray-200' : 'bg-gray-50 border border-gray-100 text-gray-800'}`}>
                  {msg.content && renderMarkdown(msg.content, isDark)}
                  {renderInteractiveWidget(msg)}
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2 max-w-[90%] sm:max-w-sm lg:max-w-xl xl:max-w-3xl">
                <div className={`p-1.5 rounded-full flex-shrink-0 mt-0.5 ${isDark ? 'bg-rose-900/40' : 'bg-rose-100'}`}><Sparkles className="w-3 h-3 text-rose-500" /></div>
                <div>
                  <div className={`px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl text-sm leading-relaxed ${isDark ? 'bg-gray-700 border border-gray-600 text-gray-200' : 'bg-gray-50 border border-gray-100 text-gray-800'}`}>{renderMarkdown(msg.content, isDark)}</div>
                  <div className="flex items-center gap-1 mt-1 ml-1">
                    <button onClick={() => handleFeedback(msg.id, 'helpful')} title="Helpful"
                      className={`p-1 rounded transition-all ${msg.feedback === 'helpful' ? 'text-green-500' : isDark ? 'text-gray-500 hover:text-green-400' : 'text-gray-300 hover:text-green-400'}`}>
                      <ThumbsUp className="w-3.5 h-3.5" fill={msg.feedback === 'helpful' ? 'currentColor' : 'none'} />
                    </button>
                    <button onClick={() => handleFeedback(msg.id, 'not_helpful')} title="Not helpful"
                      className={`p-1 rounded transition-all ${msg.feedback === 'not_helpful' ? 'text-red-500' : isDark ? 'text-gray-500 hover:text-red-400' : 'text-gray-300 hover:text-red-400'}`}>
                      <ThumbsDown className="w-3.5 h-3.5" fill={msg.feedback === 'not_helpful' ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
      <div className={`px-3 sm:px-4 py-2 flex flex-wrap gap-1.5 sm:gap-2 border-t ${isDark ? 'border-gray-700' : 'border-gray-50'}`}>
        {QUICK_ACTIONS.map(({ label, icon: Icon }) => (
          <button key={label} onClick={() => sendChat(label)} className={`flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5 border rounded-full transition-all ${
            isDark ? 'bg-rose-900/30 border-rose-800 text-rose-400 hover:bg-rose-900/50' : 'bg-rose-50 border-rose-100 text-rose-600 hover:bg-rose-100'
          }`}>
            <Icon className="w-3 h-3" />{label}</button>
        ))}
      </div>
      <div className={`p-3 sm:p-4 border-t flex gap-2 sm:gap-3 ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
        <textarea value={chatInput} onChange={e => setChatInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(); } }}
          placeholder={planResult ? "Have questions about your plan?" : "Ask about your wedding plan..."}
          className={`flex-1 p-2.5 sm:p-3 border rounded-xl text-sm resize-none outline-none transition-all ${
            isDark ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-900/50' : 'border-gray-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100'
          }`} rows={2} />
        <button onClick={() => sendChat()} disabled={!chatInput.trim() || isChatLoading}
          className="px-3 sm:px-4 rounded-xl bg-rose-500 text-white hover:bg-rose-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
          <Send className="w-4 h-4" /></button>
      </div>
    </div>
  );

  // ── Full-screen chat (fills available space) ─────────────────────────────
  const renderChatFullScreen = () => (
    <div className={`rounded-2xl shadow-lg border flex flex-col h-full overflow-hidden ${
      isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
    }`}>
      <div className={`px-3 sm:px-5 py-3 border-b flex items-center justify-between flex-shrink-0 ${
        isDark ? 'border-gray-700' : 'border-gray-100'
      }`}>
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-rose-500" /><h3 className={`font-semibold text-sm sm:text-base ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>Chat with ShehnAI</h3>
        </div>
        <button onClick={() => setShowPDFUploader(!showPDFUploader)}
          className={`flex items-center gap-1.5 text-xs px-2 sm:px-3 py-1.5 rounded-lg border transition-all ${
            showPDFUploader
              ? isDark ? 'bg-rose-900/30 border-rose-800 text-rose-400' : 'bg-rose-50 border-rose-200 text-rose-600'
              : isDark ? 'bg-gray-700 border-gray-600 text-gray-400 hover:bg-rose-900/20 hover:border-rose-800 hover:text-rose-400' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600'
          }`}>
          <Upload className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Upload PDF</span><span className="sm:hidden">PDF</span>
        </button>
      </div>
      {showPDFUploader && (
        <div className={`border-b flex-shrink-0 ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
          <PDFUploadExtractor onClose={() => setShowPDFUploader(false)} />
        </div>
      )}
      <div className={`flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 ${isDark ? 'bg-gray-800' : ''}`}>
        {chatMessages.map(msg => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.loading ? (
              <div className={`flex items-center gap-2 px-4 py-3 rounded-2xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <Loader2 className="w-4 h-4 animate-spin text-rose-400" /><span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-400'}`}>Thinking...</span>
              </div>
            ) : msg.sender === 'user' ? (
              <div className="px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl max-w-[85%] sm:max-w-xs md:max-w-sm lg:max-w-lg xl:max-w-2xl bg-rose-500 text-white">
                <p className="text-sm">{msg.content}</p>
              </div>
            ) : msg.sender === 'system' || msg.interactive ? (
              <div className="flex items-start gap-2 max-w-[90%] sm:max-w-sm md:max-w-xl lg:max-w-2xl">
                <div className={`p-1.5 rounded-full flex-shrink-0 mt-0.5 ${isDark ? 'bg-rose-900/40' : 'bg-rose-100'}`}><Sparkles className="w-3 h-3 text-rose-500" /></div>
                <div className={`px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl text-sm leading-relaxed ${
                  isDark ? 'bg-gray-700 border border-gray-600 text-gray-200' : 'bg-gray-50 border border-gray-100 text-gray-800'
                }`}>
                  {msg.content && renderMarkdown(msg.content, isDark)}
                  {renderInteractiveWidget(msg)}
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2 max-w-[90%] sm:max-w-sm md:max-w-xl lg:max-w-2xl">
                <div className={`p-1.5 rounded-full flex-shrink-0 mt-0.5 ${isDark ? 'bg-rose-900/40' : 'bg-rose-100'}`}><Sparkles className="w-3 h-3 text-rose-500" /></div>
                <div>
                  <div className={`px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl text-sm leading-relaxed ${
                    isDark ? 'bg-gray-700 border border-gray-600 text-gray-200' : 'bg-gray-50 border border-gray-100 text-gray-800'
                  }`}>{renderMarkdown(msg.content, isDark)}</div>
                  <div className="flex items-center gap-1 mt-1 ml-1">
                    <button onClick={() => handleFeedback(msg.id, 'helpful')} title="Helpful"
                      className={`p-1 rounded transition-all ${msg.feedback === 'helpful' ? 'text-green-500' : isDark ? 'text-gray-500 hover:text-green-400' : 'text-gray-300 hover:text-green-400'}`}>
                      <ThumbsUp className="w-3.5 h-3.5" fill={msg.feedback === 'helpful' ? 'currentColor' : 'none'} />
                    </button>
                    <button onClick={() => handleFeedback(msg.id, 'not_helpful')} title="Not helpful"
                      className={`p-1 rounded transition-all ${msg.feedback === 'not_helpful' ? 'text-red-500' : isDark ? 'text-gray-500 hover:text-red-400' : 'text-gray-300 hover:text-red-400'}`}>
                      <ThumbsDown className="w-3.5 h-3.5" fill={msg.feedback === 'not_helpful' ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
      <div className={`px-3 sm:px-4 py-2 flex flex-wrap gap-1.5 sm:gap-2 border-t flex-shrink-0 ${
        isDark ? 'border-gray-700' : 'border-gray-50'
      }`}>
        {QUICK_ACTIONS.map(({ label, icon: Icon }) => (
          <button key={label} onClick={() => sendChat(label)} className={`flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5 border rounded-full transition-all ${
            isDark ? 'bg-rose-900/30 border-rose-800 text-rose-400 hover:bg-rose-900/50' : 'bg-rose-50 border-rose-100 text-rose-600 hover:bg-rose-100'
          }`}>
            <Icon className="w-3 h-3" />{label}</button>
        ))}
      </div>
      <div className={`p-3 sm:p-4 border-t flex gap-2 sm:gap-3 flex-shrink-0 ${
        isDark ? 'border-gray-700' : 'border-gray-100'
      }`}>
        <textarea value={chatInput} onChange={e => setChatInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(); } }}
          placeholder="Ask about your wedding plan..."
          className={`flex-1 p-2.5 sm:p-3 border rounded-xl text-sm resize-none outline-none transition-all ${
            isDark ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-900/50' : 'border-gray-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100'
          }`} rows={2} />
        <button onClick={() => sendChat()} disabled={!chatInput.trim() || isChatLoading}
          className="px-3 sm:px-5 rounded-xl bg-rose-500 text-white hover:bg-rose-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
          <Send className="w-4 h-4" /></button>
      </div>
    </div>
  );

  // ── Chat-only mode (blueprintId exists, no fresh plan result) ─────────────

  if (mode === 'chat' && !planResult) {
    const banner = getSummaryBanner();
    return (
      <div className={`h-[100dvh] flex flex-col overflow-hidden ${
        isDark ? 'bg-gray-900' : 'bg-gradient-to-br from-rose-50 via-white to-sage-50'
      }`}>
        {banner && (
          <div className="relative h-11 sm:h-14 flex-shrink-0 overflow-hidden mx-2 sm:mx-3 mt-2 sm:mt-3 rounded-xl">
            <img src={getThemeImage(getPrefsFlat().weddingStyle)} alt="Wedding theme" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = '/classic contemporary.png'; }} />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/40" />
            <div className="absolute inset-0 px-3 sm:px-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Sparkles className="w-4 sm:w-5 h-4 sm:h-5 flex-shrink-0" />
                <span className="font-medium text-xs sm:text-sm truncate">Your {banner}</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                <button onClick={() => navigate('/blueprint')} className="text-[10px] sm:text-xs bg-white/20 hover:bg-white/30 px-2 sm:px-3 py-1 rounded-lg transition-all backdrop-blur-sm">Blueprint</button>
                <button onClick={() => { setBlueprintId(null); setMode('plan'); setChatMessages([]); clearPlannerChatMessages(); setPrompt(''); }}
                  className="text-[10px] sm:text-xs text-white/60 hover:text-white/90 transition-all flex items-center gap-1">
                  <RotateCcw className="w-3 h-3" /> New</button>
              </div>
            </div>
          </div>
        )}
        <div className="flex-1 min-h-0 mx-2 sm:mx-3 mb-2 sm:mb-3 mt-1.5 sm:mt-2">
          {renderChatFullScreen()}
        </div>
      </div>
    );
  }

  // ── Planning mode ─────────────────────────────────────────────────────────

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gradient-to-br from-rose-50 via-white to-sage-50'}`}>
      <div className="max-w-6xl mx-auto px-3 sm:px-4 pt-4 sm:pt-8 pb-4 sm:pb-8">
        {!planResult && (<>
          <div className="text-center mb-6 sm:mb-10">
            <div className={`inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium mb-3 sm:mb-4 ${
              isDark ? 'bg-rose-900/30 text-rose-400' : 'bg-rose-100 text-rose-700'
            }`}>
              <Sparkles className="w-3.5 sm:w-4 h-3.5 sm:h-4" />AI-Powered Wedding Planner</div>
            <h1 className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Plan Your Dream Wedding<br /><span className="text-rose-500">in One Sentence</span></h1>
            <p className={`text-sm sm:text-base lg:text-lg max-w-2xl mx-auto ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Tell us about your dream wedding and our AI will create a complete plan — budget breakdown, vendor requirements, timeline, and draft messages — all instantly.</p>
            {pastBlueprints.length > 0 && (
              <div className="mt-3 sm:mt-4">
                <button onClick={() => setShowPastBlueprints(!showPastBlueprints)}
                  className={`inline-flex items-center gap-2 text-xs sm:text-sm transition-all ${isDark ? 'text-gray-500 hover:text-rose-400' : 'text-gray-500 hover:text-rose-600'}`}>
                  <History className="w-4 h-4" />
                  {pastBlueprints.length} past blueprint{pastBlueprints.length > 1 ? 's' : ''} — resume where you left off
                </button>
                {showPastBlueprints && (
                  <div className="mt-3 max-w-xl mx-auto space-y-2">
                    {pastBlueprints.map(bp => {
                      const ws = bp.wedding_summary || {} as any;
                      return (
                        <button key={bp.id} onClick={() => loadPastBlueprint(bp)}
                          className={`w-full text-left border rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 hover:shadow-sm transition-all ${
                            isDark ? 'bg-gray-800 border-gray-700 hover:border-rose-700' : 'bg-white border-gray-200 hover:border-rose-300'
                          }`}>
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <span className={`text-sm font-semibold truncate block ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{bp.title}</span>
                              <div className={`flex items-center gap-2 sm:gap-3 mt-0.5 text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                {ws.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{ws.city}</span>}
                                {ws.guest_count && <span className="flex items-center gap-1"><Users className="w-3 h-3" />{ws.guest_count} guests</span>}
                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(bp.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full flex-shrink-0 ${
                              bp.status === 'published'
                                ? isDark ? 'bg-green-900/40 text-green-400' : 'bg-green-100 text-green-700'
                                : bp.status === 'closed'
                                  ? isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'
                                  : isDark ? 'bg-amber-900/40 text-amber-400' : 'bg-amber-100 text-amber-700'
                            }`}>{bp.status}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className={`rounded-2xl shadow-xl border p-4 sm:p-6 mb-4 sm:mb-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
            <div className="relative">
              <textarea ref={inputRef} value={prompt} onChange={e => setPrompt(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handlePlan(); } }}
                placeholder="Describe your dream wedding... e.g., 'Royal palace wedding in Mumbai for 300 guests, \u20B950 lakh budget, December 2026'"
                className={`w-full min-h-[70px] sm:min-h-[100px] p-3 sm:p-4 pr-14 text-sm sm:text-base lg:text-lg border-2 rounded-xl outline-none resize-none transition-all ${
                  isDark ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-900/50' : 'border-gray-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100'
                }`}
                disabled={isPlanning} />
              <button onClick={handlePlan} disabled={!prompt.trim() || isPlanning}
                className="absolute bottom-3 sm:bottom-4 right-3 sm:right-4 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-rose-500 text-white flex items-center justify-center hover:bg-rose-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl">
                {isPlanning ? <Loader2 className="w-4 sm:w-5 h-4 sm:h-5 animate-spin" /> : <Send className="w-4 sm:w-5 h-4 sm:h-5" />}</button>
            </div>
            {!isPlanning && <div className="mt-3 sm:mt-4"><p className={`text-xs mb-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Try an example:</p>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">{EXAMPLE_PROMPTS.map((ex, i) => (
                <button key={i} onClick={() => setPrompt(ex)} className={`text-[11px] sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5 border rounded-full transition-all ${
                  isDark ? 'bg-gray-700 border-gray-600 text-gray-400 hover:bg-rose-900/20 hover:border-rose-800 hover:text-rose-400' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700'
                }`}>
                  {ex.length > 50 ? ex.slice(0, 50) + '...' : ex}</button>
              ))}</div></div>}
          </div>

          {showFollowUp && !isPlanning && (
            <div ref={followUpRef} className={`rounded-2xl shadow-lg border p-4 sm:p-6 mb-4 sm:mb-6 animate-in fade-in ${
              isDark ? 'bg-gray-800 border-rose-900/50' : 'bg-white border-rose-100'
            }`}>
              <h3 className={`text-sm sm:text-base font-semibold mb-3 sm:mb-4 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>Just a couple more details to perfect your plan...</h3>
              <div className="flex flex-col sm:flex-row gap-4 mb-5">
                {missingDate && <div className="flex-1">
                  <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}><Calendar className="w-4 h-4 inline mr-1 text-rose-400" />When's the big day?</label>
                  <input type="date" value={followUpDate} onChange={e => setFollowUpDate(e.target.value)} min={new Date().toISOString().split('T')[0]}
                    className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 border-2 rounded-xl outline-none transition-all mb-2 ${
                      isDark ? 'bg-gray-700 border-gray-600 text-gray-200 focus:border-rose-500' : 'border-gray-200 text-gray-700 focus:border-rose-400 focus:ring-2 focus:ring-rose-100'
                    }`} />
                  <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Date flexibility</label>
                  <div className="flex gap-1.5 flex-wrap">
                    {([['exact', 'Exact date'], ['2weeks', '\u00B1 2 weeks'], ['1month', '\u00B1 1 month'], ['3months', '\u00B1 3 months']] as const).map(([val, label]) => (
                      <button key={val} type="button" onClick={() => setDateFlexibility(val)}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-all ${dateFlexibility === val ? 'bg-rose-500 text-white border-rose-500' : isDark ? 'bg-gray-700 text-gray-400 border-gray-600 hover:border-rose-700' : 'bg-white text-gray-600 border-gray-200 hover:border-rose-300'}`}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>}
                {missingGuests && <div className="flex-1"><label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}><Users className="w-4 h-4 inline mr-1 text-rose-400" />How many guests?</label>
                  <input type="number" value={followUpGuests} onChange={e => setFollowUpGuests(e.target.value)} placeholder="e.g. 200" min={1} max={10000}
                    className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 border-2 rounded-xl outline-none transition-all ${
                      isDark ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500 focus:border-rose-500' : 'border-gray-200 text-gray-700 focus:border-rose-400 focus:ring-2 focus:ring-rose-100'
                    }`} /></div>}
              </div>
              <div className="flex items-center gap-3">
                <button onClick={handleFollowUpSubmit} disabled={(missingDate && !followUpDate) || (missingGuests && !followUpGuests)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-rose-500 text-white rounded-xl font-semibold hover:bg-rose-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md">
                  Continue Planning <ArrowRight className="w-4 h-4" /></button>
                <button onClick={() => setShowFollowUp(false)} className="text-sm text-gray-400 hover:text-gray-600 transition-all">Cancel</button>
              </div>
            </div>
          )}

          {isPlanning && (
            <div className={`rounded-2xl shadow-lg border p-6 sm:p-8 text-center ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
              <div className={`w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${isDark ? 'bg-rose-900/30' : 'bg-rose-100'}`}><Sparkles className="w-7 sm:w-8 h-7 sm:h-8 text-rose-500 animate-pulse" /></div>
              <h3 className={`text-lg sm:text-xl font-bold mb-2 ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>Planning Your Dream Wedding...</h3>
              <p className={`text-sm sm:text-base mb-4 sm:mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Our AI is extracting preferences, creating your blueprint, matching vendors, and drafting messages</p>
              <div className={`flex flex-wrap justify-center gap-3 sm:gap-8 text-xs sm:text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                {['Extracting details', 'Building blueprint', 'Matching vendors', 'Drafting messages'].map((s, i) => (
                  <div key={i} className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-rose-300 animate-pulse" style={{ animationDelay: `${i * 0.3}s` }} />{s}</div>
                ))}</div>
            </div>
          )}
          {error && <div className={`rounded-xl p-4 ${isDark ? 'bg-red-900/30 border border-red-800 text-red-400' : 'bg-red-50 border border-red-200 text-red-700'}`}>{error}</div>}
        </>)}

        {planResult && (
          <div ref={resultRef} className="space-y-6">
            {planResult.ai_summary && (
              <div className="relative rounded-2xl overflow-hidden shadow-lg">
                <img src={getThemeImage(planResult.preferences?.theme?.selectedTheme)} alt="Wedding theme"
                  className="w-full h-48 object-cover" onError={(e) => { (e.target as HTMLImageElement).src = '/classic contemporary.png'; }} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <div className="flex items-start gap-3"><Sparkles className="w-6 h-6 flex-shrink-0 mt-0.5" />
                    <div><h3 className="font-bold text-lg mb-1">Your Wedding Plan is Ready!</h3><p className="text-white/90 leading-relaxed text-sm">{planResult.ai_summary}</p></div>
                  </div>
                </div>
              </div>
            )}

            <div className={`rounded-2xl shadow-lg border overflow-hidden ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
              <div className={`flex border-b overflow-x-auto ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                {planResult.steps.map((step, i) => (
                  <button key={i} onClick={() => setActiveStep(i)}
                    className={`flex-1 min-w-0 px-2 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium transition-all ${
                      activeStep === i
                        ? isDark ? 'text-rose-400 border-b-2 border-rose-500 bg-rose-900/20' : 'text-rose-600 border-b-2 border-rose-500 bg-rose-50'
                        : isDark ? 'text-gray-500 hover:text-gray-300 hover:bg-gray-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}>
                    <div className="flex items-center justify-center gap-1 sm:gap-1.5">
                      {STEP_ICONS[step.step] || <Check className="w-4 h-4" />}
                      <span className="hidden md:inline truncate">{step.title.replace(/[^\w\s]/g, '').trim()}</span>
                      <span className="md:hidden truncate">{step.title.replace(/[^\w\s]/g, '').trim().split(' ')[0]}</span>
                    </div></button>
                ))}</div>
              <div className="p-4 sm:p-6">
                {planResult.steps[activeStep] && (<div>
                  <h3 className={`text-base sm:text-lg font-bold mb-1 ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>{planResult.steps[activeStep].title}</h3>
                  <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{planResult.steps[activeStep].summary}</p>
                  {renderStepContent(planResult.steps[activeStep], planResult.preferences)}
                </div>)}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 sm:gap-3 justify-center">
              {planResult.blueprintId && <button onClick={() => navigate('/blueprint')}
                className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-rose-500 text-white rounded-xl text-sm sm:text-base font-semibold hover:bg-rose-600 transition-all shadow-md">
                View Blueprint <ArrowRight className="w-4 h-4" /></button>}
              <button onClick={() => navigate('/preferences')} className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 border-2 rounded-xl text-sm sm:text-base font-semibold transition-all ${
                isDark ? 'bg-gray-800 border-gray-600 text-gray-300 hover:border-rose-700 hover:text-rose-400' : 'bg-white border-gray-200 text-gray-700 hover:border-rose-300 hover:text-rose-600'
              }`}>
                Preferences <ChevronRight className="w-4 h-4" /></button>
              <button onClick={() => navigate('/quotes')} className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 border-2 rounded-xl text-sm sm:text-base font-semibold transition-all ${
                isDark ? 'bg-gray-800 border-gray-600 text-gray-300 hover:border-rose-700 hover:text-rose-400' : 'bg-white border-gray-200 text-gray-700 hover:border-rose-300 hover:text-rose-600'
              }`}>
                Quotes <ChevronRight className="w-4 h-4" /></button>
              <button onClick={() => { setPlanResult(null); setPrompt(''); setChatMessages([]); clearPlannerChatMessages(); setBlueprintId(null); }}
                className="flex items-center gap-2 px-6 py-3 text-gray-500 hover:text-gray-700 transition-all">Start Over</button>
            </div>
            <div className="mt-6">{renderChat()}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartPlanner;
