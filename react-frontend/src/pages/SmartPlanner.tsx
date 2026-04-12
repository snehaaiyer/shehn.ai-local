import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Send, ChevronRight, MapPin, Users, Calendar, IndianRupee, Palette,
  Check, MessageSquare, FileText, Loader2, ArrowRight, RotateCcw, RefreshCw, X } from 'lucide-react';
import { useAppStore, BlueprintData } from '../store/useAppStore';
import { getThemeImage, VENUE_IMAGES } from '../config/theme_images';

// ── Intent Detection Types ──────────────────────────────────────────────────

type ChatIntent =
  | { type: 'add_event'; detected_events: string[]; raw: string }
  | { type: 'change_budget'; amount?: string; raw: string }
  | { type: 'change_city'; city?: string; raw: string }
  | { type: 'change_guests'; count?: string; raw: string }
  | { type: 'change_theme'; theme?: string; raw: string }
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
}

// ── Intent Detection ────────────────────────────────────────────────────────

function detectIntent(message: string, blueprint: BlueprintData | null): ChatIntent {
  const msg = message.toLowerCase().trim();

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

  // Change budget — only when it's clearly a single change request
  if (/^(change|update|set|increase|decrease)\s+(my\s+)?budget/i.test(msg) || /^budget\s+to\b/i.test(msg)) {
    const amount = msg.match(/\u20B9?\s*(\d+)\s*(lakh|lakhs|l\b|crore|cr)/i);
    return { type: 'change_budget', amount: amount ? amount[0] : undefined, raw: message };
  }

  // Change city — only when it's clearly a relocation request
  if (/^(change|move|shift|switch)\s+(my\s+)?(city|location|wedding)\s+to\b/i.test(msg)) {
    const cities = ['mumbai','delhi','bangalore','bengaluru','hyderabad','chennai','kolkata','pune','jaipur','udaipur','goa','lucknow','ahmedabad'];
    const city = cities.find(c => msg.includes(c));
    return { type: 'change_city', city: city, raw: message };
  }

  // Change guests — only when it's clearly about guest count
  if (/^(change|update|set|increase|decrease)\s+(my\s+)?guest/i.test(msg) || /^guest\s*(count|number)\s+to\b/i.test(msg)) {
    const count = msg.match(/(\d+)\s*(guests?|people|pax)?/i);
    return { type: 'change_guests', count: count ? count[1] : undefined, raw: message };
  }

  // Change theme — only when it's clearly about theme
  if (/^(change|update|set|switch)\s+(my\s+)?theme/i.test(msg) || /^theme\s+to\b/i.test(msg)) {
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
const renderMarkdown = (text: string): React.ReactNode => {
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
          <span>{inlineFormat(bulletMatch[1])}</span>
        </div>
      );
      continue;
    }

    const numMatch = trimmed.match(/^(\d+)[\.\)]\s+(.*)$/);
    if (numMatch) {
      elements.push(
        <div key={key++} className="flex items-start gap-2 ml-2 my-0.5">
          <span className="text-rose-500 font-semibold text-xs mt-0.5 min-w-[16px]">{numMatch[1]}.</span>
          <span>{inlineFormat(numMatch[2])}</span>
        </div>
      );
      continue;
    }

    elements.push(<p key={key++} className="my-1">{inlineFormat(trimmed)}</p>);
  }

  return <>{elements}</>;
};

/** Handle inline markdown: **bold**, *italic*, rupee highlights */
const inlineFormat = (text: string): React.ReactNode => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>;
    }
    return part.split(/(\u20B9[\d,\.]+(?:\s*(?:L|lakh|lakhs|crore|crores|K))?)/gi).map((seg, j) =>
      /^\u20B9/.test(seg) ? <span key={`${i}-${j}`} className="font-semibold text-rose-600">{seg}</span> : seg
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
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const followUpRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

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
      const res = await fetch('/api/ai/suggest-events', {
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
      addAIMessage(`I'll update your budget to ${intent.amount}. This will recalculate your category allocations.`);
      addInteractiveMessage('confirm_changes', [], [], { budget: intent.amount });
    } else {
      addAIMessage("What would you like your new budget to be? Enter an amount (e.g., 30 lakhs):");
      addInteractiveMessage('budget_input', [], []);
    }
  };

  const handleChangeCityIntent = (intent: Extract<ChatIntent, { type: 'change_city' }>) => {
    if (intent.city) {
      const cityCapitalized = intent.city.charAt(0).toUpperCase() + intent.city.slice(1);
      addAIMessage(`I'll move your wedding to ${cityCapitalized}. This may affect venue and vendor availability.`);
      addInteractiveMessage('confirm_changes', [], [], { city: cityCapitalized });
    } else {
      addAIMessage("Which city would you like to move your wedding to? Pick one:");
      addInteractiveMessage('city_selector', CITY_OPTIONS.map(c => ({ id: c.toLowerCase(), label: c })), []);
    }
  };

  const handleChangeGuestsIntent = (intent: Extract<ChatIntent, { type: 'change_guests' }>) => {
    if (intent.count) {
      addAIMessage(`I'll update your guest count to ${intent.count}. This will adjust your per-head budget calculations.`);
      addInteractiveMessage('confirm_changes', [], [], { guestCount: intent.count });
    } else {
      addAIMessage("How many guests are you expecting? Enter a number:");
      addInteractiveMessage('guest_input', [], []);
    }
  };

  const handleChangeThemeIntent = (intent: Extract<ChatIntent, { type: 'change_theme' }>) => {
    if (intent.theme) {
      const themeCapitalized = intent.theme.charAt(0).toUpperCase() + intent.theme.slice(1);
      addAIMessage(`I'll change your wedding theme to ${themeCapitalized}. This will update your decoration style and ambiance.`);
      addInteractiveMessage('confirm_changes', [], [], { theme: themeCapitalized });
    } else {
      addAIMessage("What theme would you like for your wedding? Pick one:");
      addInteractiveMessage('theme_selector', THEME_OPTIONS.map(t => ({ id: t.toLowerCase(), label: t })), []);
    }
  };

  const handleHelpDecideIntent = async () => {
    // Route "help me decide" about events to the same adaptive checklist
    await handleAddEventIntent({ type: 'add_event', detected_events: [], raw: 'help me decide which events to add' });
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
      const res = await fetch('/api/ai/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' },
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
      const res = await fetch('/api/ai/plan-wedding', { method: 'POST',
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
        setChatMessages([{ id: '1', content: "Your plan is ready! Ask me anything about your wedding -- budget, vendors, timeline, or request changes.", sender: 'ai', timestamp: new Date() }]);
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
        <div className="bg-green-50 rounded-lg p-3 border border-green-200 mt-2">
          <div className="flex items-center gap-2 text-green-700 text-sm font-medium">
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
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-rose-500" /><h3 className="font-semibold text-gray-800">Chat with ShehnAI</h3>
      </div>
      <div className="max-h-96 overflow-y-auto p-4 space-y-3">
        {chatMessages.map(msg => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.loading ? (
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-2xl"><Loader2 className="w-4 h-4 animate-spin text-rose-400" /><span className="text-sm text-gray-400">Thinking...</span></div>
            ) : msg.sender === 'user' ? (
              <div className="px-4 py-3 rounded-2xl max-w-xs lg:max-w-md bg-rose-500 text-white"><p className="text-sm">{msg.content}</p></div>
            ) : msg.sender === 'system' || msg.interactive ? (
              <div className="flex items-start gap-2 max-w-sm lg:max-w-lg">
                <div className="p-1.5 rounded-full bg-rose-100 flex-shrink-0 mt-0.5"><Sparkles className="w-3 h-3 text-rose-500" /></div>
                <div className="bg-gray-50 border border-gray-100 px-4 py-3 rounded-2xl text-sm text-gray-800 leading-relaxed">
                  {msg.content && renderMarkdown(msg.content)}
                  {renderInteractiveWidget(msg)}
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2 max-w-sm lg:max-w-lg">
                <div className="p-1.5 rounded-full bg-rose-100 flex-shrink-0 mt-0.5"><Sparkles className="w-3 h-3 text-rose-500" /></div>
                <div className="bg-gray-50 border border-gray-100 px-4 py-3 rounded-2xl text-sm text-gray-800 leading-relaxed">{renderMarkdown(msg.content)}</div>
              </div>
            )}
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
      <div className="px-4 py-2 flex flex-wrap gap-2 border-t border-gray-50">
        {QUICK_ACTIONS.map(({ label, icon: Icon }) => (
          <button key={label} onClick={() => sendChat(label)} className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-rose-50 border border-rose-100 rounded-full text-rose-600 hover:bg-rose-100 transition-all">
            <Icon className="w-3 h-3" />{label}</button>
        ))}
      </div>
      <div className="p-4 border-t border-gray-100 flex gap-3">
        <textarea value={chatInput} onChange={e => setChatInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(); } }}
          placeholder={planResult ? "Have questions about your plan? Ask me anything..." : "Ask about your wedding plan..."}
          className="flex-1 p-3 border border-gray-200 rounded-xl text-sm resize-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none" rows={2} />
        <button onClick={() => sendChat()} disabled={!chatInput.trim() || isChatLoading}
          className="px-4 rounded-xl bg-rose-500 text-white hover:bg-rose-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
          <Send className="w-4 h-4" /></button>
      </div>
    </div>
  );

  // ── Chat-only mode (blueprintId exists, no fresh plan result) ─────────────

  if (mode === 'chat' && !planResult) {
    const banner = getSummaryBanner();
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-sage-50">
        <div className="max-w-4xl mx-auto px-4 pt-8 pb-8 space-y-4">
          {banner && (
            <div className="relative rounded-2xl overflow-hidden">
              <img src={getThemeImage(getPrefsFlat().weddingStyle)} alt="Wedding theme" className="w-full h-32 object-cover" onError={(e) => { (e.target as HTMLImageElement).src = '/classic contemporary.png'; }} />
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/40" />
              <div className="absolute inset-0 px-6 py-4 text-white flex items-center justify-between">
                <div className="flex items-center gap-2"><Sparkles className="w-5 h-5" /><span className="font-medium">Your {banner}</span></div>
                <button onClick={() => navigate('/blueprint')} className="text-sm bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg transition-all backdrop-blur-sm">View Blueprint</button>
              </div>
            </div>
          )}
          {renderChat()}
          <div className="flex justify-center">
            <button onClick={() => { setBlueprintId(null); setMode('plan'); setChatMessages([]); setPrompt(''); }}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-all">
              <RotateCcw className="w-4 h-4" /> Start a new plan</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Planning mode ─────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-sage-50">
      <div className="max-w-4xl mx-auto px-4 pt-12 pb-8">
        {!planResult && (<>
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-rose-100 rounded-full text-rose-700 text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4" />AI-Powered Wedding Planner</div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Plan Your Dream Wedding<br /><span className="text-rose-500">in One Sentence</span></h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">Tell us about your dream wedding and our AI will create a complete plan -- budget breakdown, vendor requirements, timeline, and draft messages -- all instantly.</p>
          </div>
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-6">
            <div className="relative">
              <textarea ref={inputRef} value={prompt} onChange={e => setPrompt(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handlePlan(); } }}
                placeholder="Describe your dream wedding... e.g., 'Royal palace wedding in Mumbai for 300 guests, \u20B950 lakh budget, December 2026'"
                className="w-full min-h-[100px] p-4 pr-14 text-lg border-2 border-gray-200 rounded-xl focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none resize-none transition-all"
                disabled={isPlanning} />
              <button onClick={handlePlan} disabled={!prompt.trim() || isPlanning}
                className="absolute bottom-4 right-4 w-12 h-12 rounded-full bg-rose-500 text-white flex items-center justify-center hover:bg-rose-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl">
                {isPlanning ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}</button>
            </div>
            {!isPlanning && <div className="mt-4"><p className="text-xs text-gray-400 mb-2">Try an example:</p>
              <div className="flex flex-wrap gap-2">{EXAMPLE_PROMPTS.map((ex, i) => (
                <button key={i} onClick={() => setPrompt(ex)} className="text-xs px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-gray-600 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700 transition-all">
                  {ex.length > 60 ? ex.slice(0, 60) + '...' : ex}</button>
              ))}</div></div>}
          </div>

          {showFollowUp && !isPlanning && (
            <div ref={followUpRef} className="bg-white rounded-2xl shadow-lg border border-rose-100 p-6 mb-6 animate-in fade-in">
              <h3 className="text-base font-semibold text-gray-800 mb-4">Just a couple more details to perfect your plan...</h3>
              <div className="flex flex-col sm:flex-row gap-4 mb-5">
                {missingDate && <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-600 mb-1.5"><Calendar className="w-4 h-4 inline mr-1 text-rose-400" />When's the big day?</label>
                  <input type="date" value={followUpDate} onChange={e => setFollowUpDate(e.target.value)} min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-gray-700 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none transition-all mb-2" />
                  <label className="block text-xs font-medium text-gray-500 mb-1">Date flexibility</label>
                  <div className="flex gap-1.5 flex-wrap">
                    {([['exact', 'Exact date'], ['2weeks', '\u00B1 2 weeks'], ['1month', '\u00B1 1 month'], ['3months', '\u00B1 3 months']] as const).map(([val, label]) => (
                      <button key={val} type="button" onClick={() => setDateFlexibility(val)}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-all ${dateFlexibility === val ? 'bg-rose-500 text-white border-rose-500' : 'bg-white text-gray-600 border-gray-200 hover:border-rose-300'}`}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>}
                {missingGuests && <div className="flex-1"><label className="block text-sm font-medium text-gray-600 mb-1.5"><Users className="w-4 h-4 inline mr-1 text-rose-400" />How many guests?</label>
                  <input type="number" value={followUpGuests} onChange={e => setFollowUpGuests(e.target.value)} placeholder="e.g. 200" min={1} max={10000}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-gray-700 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none transition-all" /></div>}
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
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-100 flex items-center justify-center"><Sparkles className="w-8 h-8 text-rose-500 animate-pulse" /></div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Planning Your Dream Wedding...</h3>
              <p className="text-gray-500 mb-6">Our AI is extracting preferences, creating your blueprint, matching vendors, and drafting messages</p>
              <div className="flex justify-center gap-8 text-sm text-gray-400">
                {['Extracting details', 'Building blueprint', 'Matching vendors', 'Drafting messages'].map((s, i) => (
                  <div key={i} className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-rose-300 animate-pulse" style={{ animationDelay: `${i * 0.3}s` }} />{s}</div>
                ))}</div>
            </div>
          )}
          {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">{error}</div>}
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

            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="flex border-b border-gray-100">
                {planResult.steps.map((step, i) => (
                  <button key={i} onClick={() => setActiveStep(i)}
                    className={`flex-1 px-4 py-3 text-sm font-medium transition-all ${activeStep === i ? 'text-rose-600 border-b-2 border-rose-500 bg-rose-50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
                    <div className="flex items-center justify-center gap-1.5">
                      {STEP_ICONS[step.step] || <Check className="w-4 h-4" />}
                      <span className="hidden md:inline">{step.title.replace(/[^\w\s]/g, '').trim()}</span>
                      <span className="md:hidden">{step.title.replace(/[^\w\s]/g, '').trim().split(' ')[0]}</span>
                    </div></button>
                ))}</div>
              <div className="p-6">
                {planResult.steps[activeStep] && (<div>
                  <h3 className="text-lg font-bold text-gray-800 mb-1">{planResult.steps[activeStep].title}</h3>
                  <p className="text-sm text-gray-500 mb-4">{planResult.steps[activeStep].summary}</p>
                  {renderStepContent(planResult.steps[activeStep], planResult.preferences)}
                </div>)}
              </div>
            </div>

            <div className="flex flex-wrap gap-3 justify-center">
              {planResult.blueprintId && <button onClick={() => navigate('/blueprint')}
                className="flex items-center gap-2 px-6 py-3 bg-rose-500 text-white rounded-xl font-semibold hover:bg-rose-600 transition-all shadow-md">
                View Full Blueprint <ArrowRight className="w-4 h-4" /></button>}
              <button onClick={() => navigate('/preferences')} className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:border-rose-300 hover:text-rose-600 transition-all">
                Fine-tune Preferences <ChevronRight className="w-4 h-4" /></button>
              <button onClick={() => navigate('/quotes')} className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:border-rose-300 hover:text-rose-600 transition-all">
                View Vendor Quotes <ChevronRight className="w-4 h-4" /></button>
              <button onClick={() => { setPlanResult(null); setPrompt(''); setChatMessages([]); setBlueprintId(null); }}
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
