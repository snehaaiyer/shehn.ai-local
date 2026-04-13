import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Clock, MapPin, Plus, X, ChevronDown, ChevronUp, Printer,
  Sparkles, RotateCcw, Edit3, Check, Trash2, GripVertical, Sun, Moon,
  Flower2, Music, Heart, PartyPopper, Camera, Utensils, Users, Star
} from 'lucide-react';
import { useAppStore, BlueprintData } from '../store/useAppStore';

/* ══════════════════════════════════════════════════════════════════════════
   TYPES
   ══════════════════════════════════════════════════════════════════════ */

interface ItineraryItem {
  id: string;
  time: string;       // "HH:mm" 24-hr
  duration: number;   // minutes
  title: string;
  notes?: string;
  icon?: string;      // emoji or lucide key
  category?: 'prep' | 'ceremony' | 'food' | 'photo' | 'entertainment' | 'transit' | 'custom';
}

interface WeddingDay {
  id: string;
  label: string;           // "Day 1 — Mehendi"
  date: string;            // "2026-12-13"
  emoji: string;
  color: string;           // tailwind color key e.g. "emerald"
  items: ItineraryItem[];
  collapsed?: boolean;
}

/* ══════════════════════════════════════════════════════════════════════════
   DEFAULT INDIAN WEDDING ITINERARY TEMPLATES
   ══════════════════════════════════════════════════════════════════════ */

const uid = () => Math.random().toString(36).slice(2, 9);

const MEHENDI_TEMPLATE: ItineraryItem[] = [
  { id: uid(), time: '10:00', duration: 60, title: 'Venue setup & decor check', category: 'prep', notes: 'Ensure mehendi seating, cushions, and flower arrangements are in place' },
  { id: uid(), time: '11:00', duration: 30, title: 'Mehendi artists arrive & setup', category: 'prep', notes: 'Coordinate design catalogue, confirm bridal design timing' },
  { id: uid(), time: '11:30', duration: 60, title: 'Welcome drinks & light snacks', category: 'food', notes: 'Chaat counter, nimbu pani, mocktails — keep it light' },
  { id: uid(), time: '12:30', duration: 180, title: 'Bridal mehendi begins', category: 'ceremony', notes: 'Bride seated in decorated spot. Mehendi artist works on both hands + feet. Expect 2.5-3 hrs for full bridal.' },
  { id: uid(), time: '12:30', duration: 120, title: 'Guest mehendi sessions', category: 'ceremony', notes: 'Multiple artists serve guests simultaneously. Queue management needed.' },
  { id: uid(), time: '13:00', duration: 30, title: 'Photographer coverage begins', category: 'photo', notes: 'Candid shots of mehendi application, guest interactions, close-ups of designs' },
  { id: uid(), time: '14:00', duration: 60, title: 'Lunch service', category: 'food', notes: 'Light Indian lunch — chole bhature, pav bhaji, dahi vada, sweets. Buffer style or live counters.' },
  { id: uid(), time: '15:00', duration: 60, title: 'Music & entertainment', category: 'entertainment', notes: 'Mehendi songs playlist, dholak, or live folk musicians. Bollywood mehendi hits.' },
  { id: uid(), time: '16:00', duration: 30, title: 'Games & fun activities', category: 'entertainment', notes: 'Mehendi competitions, "find groom name" game, photo booth with props' },
  { id: uid(), time: '16:30', duration: 60, title: 'Evening snacks & tea', category: 'food', notes: 'Samosa, pakora, masala chai station' },
  { id: uid(), time: '17:30', duration: 30, title: 'Group photos', category: 'photo', notes: 'Bride with bridesmaids, both families, group mehendi display shots' },
  { id: uid(), time: '18:00', duration: 30, title: 'Wind down & cleanup', category: 'prep', notes: 'Guests depart, bride rests with mehendi drying. Venue teardown.' },
];

const SANGEET_TEMPLATE: ItineraryItem[] = [
  { id: uid(), time: '14:00', duration: 120, title: 'Venue setup — stage, lights, sound check', category: 'prep', notes: 'LED screen, DJ booth, dance floor, themed decor. Sound check for performances.' },
  { id: uid(), time: '16:00', duration: 60, title: 'Bride & family get ready', category: 'prep', notes: 'Hair, makeup, outfit. Coordinate matching accessories for family performances.' },
  { id: uid(), time: '17:00', duration: 30, title: 'Photographer & videographer arrive', category: 'photo', notes: 'Pre-event B-roll, venue shots, couple getting ready coverage' },
  { id: uid(), time: '17:30', duration: 30, title: 'Guest arrival & welcome drinks', category: 'food', notes: 'Mocktail counter, welcome snacks. Background music sets the mood.' },
  { id: uid(), time: '18:00', duration: 15, title: 'Couple entrance', category: 'ceremony', notes: 'Grand entry — coordinated with DJ, sparklers or flower shower' },
  { id: uid(), time: '18:15', duration: 15, title: 'Welcome speech & emcee intro', category: 'entertainment', notes: 'Host/emcee welcomes guests, introduces the evening program' },
  { id: uid(), time: '18:30', duration: 90, title: 'Family performances & choreography', category: 'entertainment', notes: 'Bride side, groom side, friends. 6-8 performances, 8-12 min each. Mix of Bollywood, regional, funny skits.' },
  { id: uid(), time: '20:00', duration: 60, title: 'Dinner service', category: 'food', notes: 'Full multi-cuisine dinner — starters, mains, live counters, desserts. Guests eat in shifts during DJ.' },
  { id: uid(), time: '20:00', duration: 15, title: 'Couple\'s special performance', category: 'entertainment', notes: 'Surprise dance by the couple — choreographed Bollywood number' },
  { id: uid(), time: '20:15', duration: 15, title: 'Parents\' dance / emotional moment', category: 'entertainment', notes: 'Parents dance with the couple or a special tribute video' },
  { id: uid(), time: '20:30', duration: 120, title: 'Open dance floor — DJ takes over', category: 'entertainment', notes: 'Bollywood hits, Punjabi bhangra, regional tracks. Dhol players optional.' },
  { id: uid(), time: '22:30', duration: 30, title: 'Cake cutting or sweet ceremony', category: 'ceremony', notes: 'Optional engagement-style cake cutting with family' },
  { id: uid(), time: '23:00', duration: 30, title: 'After-party & wind down', category: 'entertainment', notes: 'Slow songs, group photos, goodbye. Guests depart.' },
  { id: uid(), time: '23:30', duration: 30, title: 'Venue cleanup & pack up', category: 'prep', notes: 'Collect decorations, personal items. Vendor equipment pickup.' },
];

const HALDI_TEMPLATE: ItineraryItem[] = [
  { id: uid(), time: '08:00', duration: 60, title: 'Venue setup — haldi mandap & seating', category: 'prep', notes: 'Marigold & banana leaf decor, haldi paste bowls, tarpaulin on floor. Yellow theme.' },
  { id: uid(), time: '09:00', duration: 60, title: 'Bride/Groom gets ready', category: 'prep', notes: 'Wear old/yellow outfit (will get messy!). Minimal makeup — will be reapplied.' },
  { id: uid(), time: '09:30', duration: 30, title: 'Photographer arrives', category: 'photo', notes: 'Pre-ceremony setup shots, yellow decor details, haldi paste close-ups' },
  { id: uid(), time: '10:00', duration: 15, title: 'Puja & prayers', category: 'ceremony', notes: 'Pandit ji begins with Ganesh puja. Family gathers around the mandap.' },
  { id: uid(), time: '10:15', duration: 45, title: 'Haldi application — family elders', category: 'ceremony', notes: 'Parents, grandparents, aunts/uncles apply haldi. Emotional & sacred.' },
  { id: uid(), time: '11:00', duration: 30, title: 'Haldi application — friends', category: 'ceremony', notes: 'Friends join in. This is where it gets fun & messy! Water guns, colours.' },
  { id: uid(), time: '11:30', duration: 30, title: 'Fun haldi games', category: 'entertainment', notes: 'Haldi smearing competition, tug of war, Bollywood song guessing' },
  { id: uid(), time: '12:00', duration: 30, title: 'Cleanup & change clothes', category: 'prep', notes: 'Quick shower, change into fresh outfit for lunch. Mehendi touch-up if needed.' },
  { id: uid(), time: '12:30', duration: 60, title: 'Festive lunch', category: 'food', notes: 'Traditional home-style meal or catered thali. Poori, halwa, chana, kheer.' },
  { id: uid(), time: '13:30', duration: 30, title: 'Group photos & candids', category: 'photo', notes: 'Yellow-themed group photos, candids of haldi-smeared faces, family portraits' },
  { id: uid(), time: '14:00', duration: 30, title: 'Rest & prepare for evening', category: 'prep', notes: 'Bride/groom rests before sangeet or other events later in the day' },
];

const WEDDING_CEREMONY_TEMPLATE: ItineraryItem[] = [
  { id: uid(), time: '06:00', duration: 60, title: 'Wake up & morning chai', category: 'prep', notes: 'Early start! Light breakfast — idli, poha, or paratha. Keep it easy on the stomach.' },
  { id: uid(), time: '07:00', duration: 180, title: 'Bridal hair, makeup & draping', category: 'prep', notes: 'MUA arrives. Full bridal look: HD/airbrush makeup, hairstyling, saree/lehenga draping. Allow 3 hours minimum.' },
  { id: uid(), time: '07:00', duration: 90, title: 'Groom gets ready', category: 'prep', notes: 'Sherwani fitting, safa/pagdi tying, accessories. Groom\'s makeup if opted.' },
  { id: uid(), time: '09:00', duration: 60, title: 'Venue setup — mandap, entrance, decor final check', category: 'prep', notes: 'Decorator confirms mandap flowers, entrance gate, aisle, seating. Sound check.' },
  { id: uid(), time: '10:00', duration: 30, title: 'Photographer arrives — pre-ceremony coverage', category: 'photo', notes: 'Bride getting ready shots (chura ceremony, kalire). Groom sehra tying. Venue B-roll.' },
  { id: uid(), time: '10:30', duration: 30, title: 'Pandit ji setup & puja preparations', category: 'ceremony', notes: 'Havan kund setup, puja thali, coconut, moli. Confirm sequence with pandit ji.' },
  { id: uid(), time: '11:00', duration: 60, title: 'Baraat procession', category: 'ceremony', notes: 'Groom on ghodi/vintage car. Band baja, dhol, dancing relatives. Matka fod (optional). Milni at entrance.' },
  { id: uid(), time: '12:00', duration: 30, title: 'Milni ceremony & welcome', category: 'ceremony', notes: 'Garland exchange between family elders. Bride\'s family welcomes groom\'s side. Aarti.' },
  { id: uid(), time: '12:30', duration: 15, title: 'Jai mala (Varmala)', category: 'ceremony', notes: 'Bride & groom exchange garlands. Iconic moment — photographer positioned for the shot.' },
  { id: uid(), time: '12:45', duration: 15, title: 'Groom arrives at mandap', category: 'ceremony', notes: 'Kanyadaan rituals begin. Bride\'s father gives her hand to the groom.' },
  { id: uid(), time: '13:00', duration: 30, title: 'Kanyadaan & main rituals', category: 'ceremony', notes: 'Sacred giving-away ceremony. Father, mother, and maternal uncle participate.' },
  { id: uid(), time: '13:30', duration: 45, title: 'Pheras (Saat Phere)', category: 'ceremony', notes: 'The seven sacred vows around the holy fire. Most important ritual. 30-45 min.' },
  { id: uid(), time: '14:15', duration: 15, title: 'Sindoor, Mangalsutra & Gath Bandhan', category: 'ceremony', notes: 'Groom applies sindoor, ties mangalsutra. Officially married!' },
  { id: uid(), time: '14:30', duration: 30, title: 'Ashirwaad — blessings from elders', category: 'ceremony', notes: 'Newlyweds seek blessings from parents, grandparents, and elders. Emotional moment.' },
  { id: uid(), time: '15:00', duration: 60, title: 'Wedding lunch', category: 'food', notes: 'Grand lunch for all guests. Veg & non-veg buffet, live counters, desserts. Peak catering moment.' },
  { id: uid(), time: '15:00', duration: 60, title: 'Post-ceremony couple photos', category: 'photo', notes: 'Couple portraits at mandap, venue highlights. Family group photos. Bridal party shots.' },
  { id: uid(), time: '16:00', duration: 60, title: 'Rest & outfit change for reception', category: 'prep', notes: 'Quick rest, touch-up makeup, change into reception outfit if same day.' },
  { id: uid(), time: '17:00', duration: 60, title: 'Vidaai ceremony', category: 'ceremony', notes: 'Emotional farewell. Bride throws rice, leaves parents\' home. Most emotional moment of the wedding.' },
];

const RECEPTION_TEMPLATE: ItineraryItem[] = [
  { id: uid(), time: '15:00', duration: 120, title: 'Venue setup — stage, lighting, table settings', category: 'prep', notes: 'Reception decor distinct from ceremony. Stage backdrop, LED screens, table centerpieces.' },
  { id: uid(), time: '17:00', duration: 90, title: 'Couple gets ready — reception look', category: 'prep', notes: 'Fresh outfit: lehenga/gown for bride, suit/indo-western for groom. Glam reception makeup.' },
  { id: uid(), time: '18:00', duration: 30, title: 'Photographer & DJ arrive', category: 'photo', notes: 'Venue shots, lighting check, DJ sound test. Photo booth setup.' },
  { id: uid(), time: '18:30', duration: 30, title: 'Guest arrival & welcome drinks', category: 'food', notes: 'Cocktail hour: mocktails/cocktails, starters on trays, chaat counter. Background music.' },
  { id: uid(), time: '19:00', duration: 15, title: 'Couple\'s grand entrance', category: 'ceremony', notes: 'Choreographed entry with confetti/sparklers/dry ice. DJ announces the couple.' },
  { id: uid(), time: '19:15', duration: 30, title: 'Welcome speech & cake cutting', category: 'ceremony', notes: 'Father of bride/groom speech. Couple cuts the wedding cake. Toast.' },
  { id: uid(), time: '19:45', duration: 15, title: 'First dance', category: 'entertainment', notes: 'Couple\'s first dance as married pair. Bollywood romantic or classical.' },
  { id: uid(), time: '20:00', duration: 90, title: 'Dinner service — grand buffet', category: 'food', notes: 'Full dinner: starters, live counters (biryani, pasta, dosa), mains, breads, desserts, paan counter.' },
  { id: uid(), time: '20:00', duration: 120, title: 'Guest interactions & photo ops', category: 'photo', notes: 'Couple meets each table. Stage photos with guests. Candid coverage throughout.' },
  { id: uid(), time: '21:30', duration: 90, title: 'Dance floor opens — DJ party', category: 'entertainment', notes: 'Full Bollywood party. Bhangra, garba if Gujarati, dandiya. Dhol welcome.' },
  { id: uid(), time: '23:00', duration: 30, title: 'Bouquet/sweet toss', category: 'entertainment', notes: 'Fun tradition — bouquet toss or mithai toss for unmarried friends' },
  { id: uid(), time: '23:30', duration: 30, title: 'Thank you speech & send off', category: 'ceremony', notes: 'Couple thanks guests, parents. Fireworks/sparkler send-off.' },
  { id: uid(), time: '00:00', duration: 30, title: 'Pack up & venue handover', category: 'prep', notes: 'Collect gifts, personal items. Final vendor payments. Venue cleanup.' },
];

function buildDefaultDays(blueprint: BlueprintData | null): WeddingDay[] {
  const baseDate = blueprint?.date ? new Date(blueprint.date) : new Date('2026-12-15');
  const events = blueprint?.events || ['mehendi', 'sangeet', 'haldi', 'wedding ceremony', 'reception'];

  const dayConfigs: Array<{
    key: string; label: string; emoji: string; color: string;
    template: ItineraryItem[]; dayOffset: number;
  }> = [];

  let dayIndex = 0;
  const lowerEvents = events.map(e => e.toLowerCase());

  if (lowerEvents.some(e => e.includes('mehendi'))) {
    dayConfigs.push({ key: 'mehendi', label: 'Mehendi', emoji: '\u{1F338}', color: 'emerald', template: MEHENDI_TEMPLATE, dayOffset: dayIndex });
    dayIndex++;
  }
  if (lowerEvents.some(e => e.includes('haldi'))) {
    dayConfigs.push({ key: 'haldi', label: 'Haldi', emoji: '\u{1F33B}', color: 'amber', template: HALDI_TEMPLATE, dayOffset: dayIndex });
    dayIndex++;
  }
  if (lowerEvents.some(e => e.includes('sangeet'))) {
    dayConfigs.push({ key: 'sangeet', label: 'Sangeet', emoji: '\u{1F3B6}', color: 'violet', template: SANGEET_TEMPLATE, dayOffset: dayIndex });
    dayIndex++;
  }
  if (lowerEvents.some(e => e.includes('ceremon') || e.includes('wedding'))) {
    dayConfigs.push({ key: 'ceremony', label: 'Wedding Ceremony', emoji: '\u{1F54A}', color: 'rose', template: WEDDING_CEREMONY_TEMPLATE, dayOffset: dayIndex });
    dayIndex++;
  }
  if (lowerEvents.some(e => e.includes('reception'))) {
    dayConfigs.push({ key: 'reception', label: 'Reception', emoji: '\u{1F389}', color: 'blue', template: RECEPTION_TEMPLATE, dayOffset: dayIndex });
  }

  // If no events matched, show full default
  if (dayConfigs.length === 0) {
    dayConfigs.push(
      { key: 'mehendi', label: 'Mehendi', emoji: '\u{1F338}', color: 'emerald', template: MEHENDI_TEMPLATE, dayOffset: 0 },
      { key: 'haldi', label: 'Haldi', emoji: '\u{1F33B}', color: 'amber', template: HALDI_TEMPLATE, dayOffset: 1 },
      { key: 'sangeet', label: 'Sangeet', emoji: '\u{1F3B6}', color: 'violet', template: SANGEET_TEMPLATE, dayOffset: 2 },
      { key: 'ceremony', label: 'Wedding Ceremony', emoji: '\u{1F54A}', color: 'rose', template: WEDDING_CEREMONY_TEMPLATE, dayOffset: 3 },
      { key: 'reception', label: 'Reception', emoji: '\u{1F389}', color: 'blue', template: RECEPTION_TEMPLATE, dayOffset: 4 },
    );
  }

  return dayConfigs.map((cfg, i) => {
    const d = new Date(baseDate);
    d.setDate(d.getDate() - (dayConfigs.length - 1 - i)); // ceremony day = baseDate
    return {
      id: cfg.key,
      label: `Day ${i + 1} \u2014 ${cfg.label}`,
      date: d.toISOString().slice(0, 10),
      emoji: cfg.emoji,
      color: cfg.color,
      items: cfg.template.map(item => ({ ...item, id: uid() })),
    };
  });
}

/* ══════════════════════════════════════════════════════════════════════════
   HELPERS
   ══════════════════════════════════════════════════════════════════════ */

const addMinutes = (time: string, mins: number): string => {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + mins;
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
};

const formatTime12 = (time: string): string => {
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
};

const formatDuration = (mins: number): string => {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

const CATEGORY_STYLES: Record<string, { bg: string; darkBg: string; icon: React.ReactNode; label: string }> = {
  prep: { bg: 'bg-gray-100 text-gray-600', darkBg: 'bg-gray-700 text-gray-300', icon: <Clock className="w-3.5 h-3.5" />, label: 'Prep' },
  ceremony: { bg: 'bg-rose-100 text-rose-700', darkBg: 'bg-rose-900/30 text-rose-400', icon: <Heart className="w-3.5 h-3.5" />, label: 'Ceremony' },
  food: { bg: 'bg-amber-100 text-amber-700', darkBg: 'bg-amber-900/30 text-amber-400', icon: <Utensils className="w-3.5 h-3.5" />, label: 'Food' },
  photo: { bg: 'bg-blue-100 text-blue-700', darkBg: 'bg-blue-900/30 text-blue-400', icon: <Camera className="w-3.5 h-3.5" />, label: 'Photo' },
  entertainment: { bg: 'bg-violet-100 text-violet-700', darkBg: 'bg-violet-900/30 text-violet-400', icon: <Music className="w-3.5 h-3.5" />, label: 'Entertainment' },
  transit: { bg: 'bg-cyan-100 text-cyan-700', darkBg: 'bg-cyan-900/30 text-cyan-400', icon: <MapPin className="w-3.5 h-3.5" />, label: 'Transit' },
  custom: { bg: 'bg-gray-100 text-gray-600', darkBg: 'bg-gray-700 text-gray-300', icon: <Star className="w-3.5 h-3.5" />, label: 'Custom' },
};

const DAY_COLORS: Record<string, { light: string; dark: string; accent: string; border: string }> = {
  emerald: { light: 'bg-emerald-50', dark: 'bg-emerald-900/20', accent: 'text-emerald-600', border: 'border-emerald-200' },
  amber: { light: 'bg-amber-50', dark: 'bg-amber-900/20', accent: 'text-amber-600', border: 'border-amber-200' },
  violet: { light: 'bg-violet-50', dark: 'bg-violet-900/20', accent: 'text-violet-600', border: 'border-violet-200' },
  rose: { light: 'bg-rose-50', dark: 'bg-rose-900/20', accent: 'text-rose-600', border: 'border-rose-200' },
  blue: { light: 'bg-blue-50', dark: 'bg-blue-900/20', accent: 'text-blue-600', border: 'border-blue-200' },
};

/* ══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════════════ */

const Timeline: React.FC = () => {
  const { theme, blueprint } = useAppStore();
  const isDark = theme === 'dark';

  const [days, setDays] = useState<WeddingDay[]>(() => buildDefaultDays(blueprint));
  const [activeDay, setActiveDay] = useState<string>(days[0]?.id || '');
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ItineraryItem>>({});
  const [addingToDay, setAddingToDay] = useState<string | null>(null);
  const [newItem, setNewItem] = useState<Partial<ItineraryItem>>({ time: '12:00', duration: 30, title: '', category: 'custom', notes: '' });

  const currentDay = useMemo(() => days.find(d => d.id === activeDay), [days, activeDay]);

  /* ── Handlers ── */
  const updateItem = useCallback((dayId: string, itemId: string, updates: Partial<ItineraryItem>) => {
    setDays(prev => prev.map(d =>
      d.id === dayId
        ? { ...d, items: d.items.map(it => it.id === itemId ? { ...it, ...updates } : it) }
        : d
    ));
  }, []);

  const removeItem = useCallback((dayId: string, itemId: string) => {
    setDays(prev => prev.map(d =>
      d.id === dayId ? { ...d, items: d.items.filter(it => it.id !== itemId) } : d
    ));
  }, []);

  const addItem = useCallback((dayId: string) => {
    if (!newItem.title?.trim()) return;
    const item: ItineraryItem = {
      id: uid(),
      time: newItem.time || '12:00',
      duration: newItem.duration || 30,
      title: newItem.title!.trim(),
      notes: newItem.notes || '',
      category: (newItem.category as ItineraryItem['category']) || 'custom',
    };
    setDays(prev => prev.map(d =>
      d.id === dayId
        ? { ...d, items: [...d.items, item].sort((a, b) => a.time.localeCompare(b.time)) }
        : d
    ));
    setNewItem({ time: '12:00', duration: 30, title: '', category: 'custom', notes: '' });
    setAddingToDay(null);
  }, [newItem]);

  const resetDay = useCallback((dayId: string) => {
    const defaults = buildDefaultDays(blueprint);
    const defaultDay = defaults.find(d => d.id === dayId);
    if (defaultDay) {
      setDays(prev => prev.map(d => d.id === dayId ? { ...d, items: defaultDay.items } : d));
    }
  }, [blueprint]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const startEdit = (item: ItineraryItem) => {
    setEditingItem(item.id);
    setEditForm({ time: item.time, duration: item.duration, title: item.title, notes: item.notes, category: item.category });
  };

  const saveEdit = (dayId: string, itemId: string) => {
    updateItem(dayId, itemId, editForm);
    setEditingItem(null);
    setEditForm({});
  };

  const weddingDate = blueprint?.date || days.find(d => d.id === 'ceremony')?.date || '';

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-[#FAFAF8]'}`}>
      <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-4 sm:space-y-6">

        {/* ── Header ── */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl border p-4 sm:p-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 shadow-soft'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className={`text-xl sm:text-2xl font-bold tracking-tight ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                Wedding Itinerary
              </h1>
              <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {weddingDate
                  ? `${days.length}-day celebration \u2022 ${new Date(weddingDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`
                  : `${days.length}-day celebration \u2022 Set your wedding date in preferences`}
              </p>
            </div>
            <button onClick={handlePrint}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all print:hidden ${
                isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>
              <Printer className="w-4 h-4" /> Print Itinerary
            </button>
          </div>
        </motion.div>

        {/* ── Day Tabs ── */}
        <div className="flex gap-2 overflow-x-auto pb-1 print:hidden scrollbar-hide">
          {days.map((day) => {
            const colors = DAY_COLORS[day.color] || DAY_COLORS.rose;
            const isActive = day.id === activeDay;
            return (
              <button key={day.id} onClick={() => setActiveDay(day.id)}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                  isActive
                    ? isDark
                      ? `${colors.dark} ${colors.accent} border-current`
                      : `${colors.light} ${colors.accent} ${colors.border}`
                    : isDark
                      ? 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-600'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                }`}>
                <span className="text-base">{day.emoji}</span>
                <span className="whitespace-nowrap">{day.label}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  isActive
                    ? isDark ? 'bg-white/10' : 'bg-black/5'
                    : isDark ? 'bg-gray-700' : 'bg-gray-100'
                }`}>{day.items.length}</span>
              </button>
            );
          })}
        </div>

        {/* ── Day Header + Actions ── */}
        {currentDay && (
          <motion.div key={currentDay.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="space-y-3">
            <div className={`flex items-center justify-between rounded-xl px-4 py-3 ${
              isDark ? DAY_COLORS[currentDay.color]?.dark || 'bg-gray-800' : DAY_COLORS[currentDay.color]?.light || 'bg-gray-50'
            }`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{currentDay.emoji}</span>
                <div>
                  <h2 className={`font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{currentDay.label}</h2>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {new Date(currentDay.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    {' \u2022 '}{currentDay.items.length} activities
                  </p>
                </div>
              </div>
              <div className="flex gap-2 print:hidden">
                <button onClick={() => setAddingToDay(addingToDay === currentDay.id ? null : currentDay.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                  }`}>
                  {addingToDay === currentDay.id ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  {addingToDay === currentDay.id ? 'Cancel' : 'Add'}
                </button>
                <button onClick={() => { if (window.confirm('Reset this day to default?')) resetDay(currentDay.id); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                  }`}>
                  <RotateCcw className="w-3.5 h-3.5" /> Reset
                </button>
              </div>
            </div>

            {/* ── Add Item Form ── */}
            <AnimatePresence>
              {addingToDay === currentDay.id && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className={`rounded-xl border p-4 space-y-3 print:hidden ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <input type="time" value={newItem.time} onChange={e => setNewItem(n => ({ ...n, time: e.target.value }))}
                      className={`px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-gray-50 border-gray-200 text-gray-800'}`} />
                    <select value={newItem.duration} onChange={e => setNewItem(n => ({ ...n, duration: Number(e.target.value) }))}
                      className={`px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-gray-50 border-gray-200 text-gray-800'}`}>
                      {[15, 30, 45, 60, 90, 120, 180].map(m => <option key={m} value={m}>{formatDuration(m)}</option>)}
                    </select>
                    <select value={newItem.category} onChange={e => setNewItem(n => ({ ...n, category: e.target.value as ItineraryItem['category'] }))}
                      className={`px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-gray-50 border-gray-200 text-gray-800'}`}>
                      {Object.entries(CATEGORY_STYLES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                    <button onClick={() => addItem(currentDay.id)}
                      className="px-4 py-2 bg-rose-500 text-white rounded-lg text-sm font-medium hover:bg-rose-600 transition-colors">
                      Add
                    </button>
                  </div>
                  <input type="text" placeholder="Activity title *" value={newItem.title}
                    onChange={e => setNewItem(n => ({ ...n, title: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && addItem(currentDay.id)}
                    className={`w-full px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400'}`} />
                  <input type="text" placeholder="Notes (optional)" value={newItem.notes}
                    onChange={e => setNewItem(n => ({ ...n, notes: e.target.value }))}
                    className={`w-full px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400'}`} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Itinerary Items ── */}
            <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 shadow-soft'}`}>
              {currentDay.items.map((item, idx) => {
                const endTime = addMinutes(item.time, item.duration);
                const catStyle = CATEGORY_STYLES[item.category || 'custom'] || CATEGORY_STYLES.custom;
                const isEditing = editingItem === item.id;

                return (
                  <div key={item.id}
                    className={`group relative ${idx > 0 ? (isDark ? 'border-t border-gray-700' : 'border-t border-gray-100') : ''}`}>

                    {/* Timeline connector line */}
                    {idx < currentDay.items.length - 1 && (
                      <div className={`absolute left-[52px] sm:left-[68px] top-12 bottom-0 w-0.5 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`} />
                    )}

                    <div className="flex items-start gap-3 sm:gap-4 px-4 sm:px-5 py-3 sm:py-4">
                      {/* Time column */}
                      <div className="flex-shrink-0 w-[60px] sm:w-[80px] text-right pt-0.5">
                        {isEditing ? (
                          <input type="time" value={editForm.time} onChange={e => setEditForm(f => ({ ...f, time: e.target.value }))}
                            className={`w-full text-xs px-1 py-0.5 rounded border ${isDark ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-gray-50 border-gray-200'}`} />
                        ) : (
                          <>
                            <div className={`text-sm font-semibold ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                              {formatTime12(item.time)}
                            </div>
                            <div className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                              {formatDuration(item.duration)}
                            </div>
                          </>
                        )}
                      </div>

                      {/* Dot on timeline */}
                      <div className={`flex-shrink-0 w-3 h-3 rounded-full mt-1.5 ring-2 ${
                        isDark ? 'ring-gray-800' : 'ring-white'
                      } ${
                        item.category === 'ceremony' ? 'bg-rose-400' :
                        item.category === 'food' ? 'bg-amber-400' :
                        item.category === 'photo' ? 'bg-blue-400' :
                        item.category === 'entertainment' ? 'bg-violet-400' :
                        isDark ? 'bg-gray-500' : 'bg-gray-300'
                      }`} />

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {isEditing ? (
                          <div className="space-y-2">
                            <input type="text" value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                              className={`w-full px-2 py-1 rounded-lg border text-sm font-medium ${isDark ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-gray-50 border-gray-200'}`} />
                            <div className="flex gap-2">
                              <select value={editForm.duration} onChange={e => setEditForm(f => ({ ...f, duration: Number(e.target.value) }))}
                                className={`px-2 py-1 rounded border text-xs ${isDark ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-gray-50 border-gray-200'}`}>
                                {[15, 30, 45, 60, 90, 120, 180, 240].map(m => <option key={m} value={m}>{formatDuration(m)}</option>)}
                              </select>
                              <select value={editForm.category} onChange={e => setEditForm(f => ({ ...f, category: e.target.value as any }))}
                                className={`px-2 py-1 rounded border text-xs ${isDark ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-gray-50 border-gray-200'}`}>
                                {Object.entries(CATEGORY_STYLES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                              </select>
                            </div>
                            <input type="text" value={editForm.notes || ''} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                              placeholder="Notes"
                              className={`w-full px-2 py-1 rounded-lg border text-xs ${isDark ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500' : 'bg-gray-50 border-gray-200 placeholder-gray-400'}`} />
                            <div className="flex gap-2">
                              <button onClick={() => saveEdit(currentDay.id, item.id)}
                                className="px-3 py-1 bg-rose-500 text-white rounded-lg text-xs font-medium hover:bg-rose-600">
                                <Check className="w-3 h-3 inline mr-1" />Save
                              </button>
                              <button onClick={() => setEditingItem(null)}
                                className={`px-3 py-1 rounded-lg text-xs ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2 mb-0.5">
                              <h4 className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>{item.title}</h4>
                              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium ${isDark ? catStyle.darkBg : catStyle.bg}`}>
                                {catStyle.icon} {catStyle.label}
                              </span>
                            </div>
                            <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                              {formatTime12(item.time)} \u2013 {formatTime12(endTime)}
                            </div>
                            {item.notes && (
                              <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{item.notes}</p>
                            )}
                          </>
                        )}
                      </div>

                      {/* Actions */}
                      {!isEditing && (
                        <div className="flex-shrink-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity print:hidden">
                          <button onClick={() => startEdit(item)}
                            className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700 text-gray-500' : 'hover:bg-gray-100 text-gray-400'}`}>
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => removeItem(currentDay.id, item.id)}
                            className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-red-900/30 text-gray-500 hover:text-red-400' : 'hover:bg-red-50 text-gray-400 hover:text-red-500'}`}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {currentDay.items.length === 0 && (
                <div className="p-12 text-center">
                  <Calendar className={`w-10 h-10 mx-auto mb-3 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
                  <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No activities yet</p>
                  <button onClick={() => setAddingToDay(currentDay.id)}
                    className="text-rose-500 text-sm font-medium mt-2 hover:text-rose-600">
                    + Add your first activity
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── Print footer ── */}
        <div className="hidden print:block text-center text-xs text-gray-400 mt-8 pt-4 border-t border-gray-200">
          Generated by Shehn.AI \u2022 Your AI Wedding Planner
        </div>
      </div>
    </div>
  );
};

export default Timeline;
