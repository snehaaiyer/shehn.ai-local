import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import {
  BookOpen, ChevronRight, ChevronDown, Clock, Star,
  DollarSign, Camera, Utensils, Building2, Music,
  Palette, Heart, Users, Calendar, Sparkles,
  CheckCircle, ArrowRight, Scissors, MapPin
} from 'lucide-react';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
};

interface Guide {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  readTime: string;
  category: string;
  sections: { heading: string; content: string }[];
}

const GUIDES: Guide[] = [
  {
    id: 'budget-101',
    title: 'Wedding Budget 101',
    subtitle: 'How to plan, allocate, and stick to your budget',
    icon: <DollarSign className="w-5 h-5" />,
    color: 'from-emerald-500 to-teal-600',
    readTime: '8 min',
    category: 'Planning',
    sections: [
      { heading: 'Set Your Total Budget First', content: 'Before you start dreaming, decide on a realistic total number. In India, average wedding spend ranges from ₹10L to ₹50L+ depending on city and scale. Have an honest conversation with both families about contributions and limits.' },
      { heading: 'The 40-25-15 Rule', content: 'Allocate roughly 35-40% to venue & hospitality, 25-30% to catering & food, and 15% to decor & design. The remaining 15-20% covers photography, entertainment, makeup, and a contingency buffer.' },
      { heading: 'Build a 10% Buffer', content: 'Unexpected costs always come up — last-minute guest additions, weather contingencies, rush delivery fees. Keep 10% of your total budget untouched until the final month.' },
      { heading: 'Track Every Rupee', content: 'Use Shehn.AI\'s budget tracker to log advances, milestone payments, and final settlements. Categorize spending in real-time so you always know where you stand.' },
      { heading: 'Negotiate Smart', content: 'Most vendor prices in India have 10-20% negotiation room. Get 3+ quotes for every category, ask about off-season discounts, and bundle services (e.g., decor + florals) for package deals.' },
    ],
  },
  {
    id: 'venue-guide',
    title: 'Choosing the Perfect Venue',
    subtitle: 'Location, capacity, season, and negotiation tips',
    icon: <Building2 className="w-5 h-5" />,
    color: 'from-blue-500 to-indigo-600',
    readTime: '10 min',
    category: 'Vendors',
    sections: [
      { heading: 'Start 8-12 Months Early', content: 'Premium venues in cities like Mumbai, Delhi, and Jaipur get booked 12-18 months ahead for peak season (Oct-Feb). Start shortlisting early and lock in a date with an advance payment.' },
      { heading: 'Indoor vs Outdoor vs Both', content: 'Consider monsoon risk for outdoor venues (Jun-Sep). Many couples choose venues with both indoor and outdoor options for flexibility. Farmhouses outside city limits offer larger capacity at lower costs.' },
      { heading: 'Guest Count Drives Everything', content: 'A 200-guest wedding has fundamentally different venue needs than a 500+ celebration. Be realistic about your list — Indian weddings tend to grow 20-30% from initial estimates.' },
      { heading: 'Check the Fine Print', content: 'Ask about: corkage/outside catering permissions, generator backup, parking capacity, noise curfew times, accommodation for outstation guests, and additional charges for multiple events (mehndi, sangeet, wedding, reception).' },
      { heading: 'Destination Weddings', content: 'Rajasthan (Udaipur, Jaipur), Goa, and Kerala are popular choices. Factor in travel, accommodation for 2-3 days, and logistics costs. The per-plate saving can offset travel if guest lists are trimmed.' },
    ],
  },
  {
    id: 'photography-tips',
    title: 'Photography & Videography',
    subtitle: 'Capturing moments that last a lifetime',
    icon: <Camera className="w-5 h-5" />,
    color: 'from-amber-500 to-orange-600',
    readTime: '7 min',
    category: 'Vendors',
    sections: [
      { heading: 'Candid vs Traditional', content: 'Modern Indian couples often prefer 70% candid + 30% traditional posed shots. Discuss the ratio with your photographer upfront. Look at full wedding albums (not just highlights) to judge consistency.' },
      { heading: 'Pre-Wedding Shoots', content: 'Budget ₹30K-₹2L for a pre-wedding shoot. Popular locations include heritage sites, beaches, and urban backdrops. These photos work great for wedding invites and social media save-the-dates.' },
      { heading: 'Video is Non-Negotiable', content: 'A cinematic wedding film is the one thing couples say they\'re most glad they invested in. Budget ₹1L-₹5L depending on your city. Ask about drone coverage for outdoor venues.' },
      { heading: 'Same-Day Edits & Reels', content: 'Many photographers now offer same-day highlight reels for the reception. Factor this into the package — it adds ₹20K-₹50K but creates instant shareable content.' },
      { heading: 'Delivery Timeline & Rights', content: 'Confirm when you\'ll receive edited photos (4-8 weeks is standard) and whether you get full rights to print and share. Ensure you get high-resolution files, not just social-media-sized copies.' },
    ],
  },
  {
    id: 'catering-essentials',
    title: 'Catering & Menu Planning',
    subtitle: 'Food that delights every guest',
    icon: <Utensils className="w-5 h-5" />,
    color: 'from-rose-500 to-pink-600',
    readTime: '9 min',
    category: 'Vendors',
    sections: [
      { heading: 'Cuisine Variety Matters', content: 'Indian weddings typically feature multi-cuisine menus. Plan for regional specialties (North Indian, South Indian, Mughlai) plus continental and live counters. A tasting session is essential before finalizing.' },
      { heading: 'Per-Plate vs Package Pricing', content: 'Caterers charge ₹800-₹3,500+ per plate depending on the menu, city, and serving style. Buffet is standard for large weddings; sit-down service works for intimate gatherings under 150.' },
      { heading: 'Don\'t Forget the Sub-Events', content: 'Mehndi, sangeet, and haldi need their own menus. Light bites, chaat counters, and themed food stations (e.g., street food for sangeet) keep guests excited without blowing the budget.' },
      { heading: 'Dietary Accommodations', content: 'Always plan for vegetarian, Jain, vegan, and allergy-friendly options. Clearly label food stations. A good caterer handles this seamlessly — ask about their experience with diverse dietary needs.' },
      { heading: 'Bar & Beverages', content: 'If you\'re serving alcohol, decide between open bar, limited bar, or BYOB. Non-alcoholic stations with mocktails, fresh juices, and chaas are equally important. Late-night chai/coffee counters are always a hit.' },
    ],
  },
  {
    id: 'decor-themes',
    title: 'Decor & Theme Design',
    subtitle: 'Creating the visual story of your wedding',
    icon: <Palette className="w-5 h-5" />,
    color: 'from-purple-500 to-violet-600',
    readTime: '8 min',
    category: 'Planning',
    sections: [
      { heading: 'Pick a Cohesive Theme', content: 'Whether it\'s Royal Rajasthani, Rustic Boho, Pastel Elegance, or Modern Minimalist — pick one theme and carry it across all events. Consistency in color palette, materials, and motifs makes everything feel elevated.' },
      { heading: 'Mandap is the Centerpiece', content: 'The wedding mandap/stage is where all eyes focus. Allocate 25-30% of your decor budget here. Floral mandaps are timeless; consider phoolon ki chadar for the bride\'s entry.' },
      { heading: 'Lighting Sets the Mood', content: 'Good lighting transforms any space. Fairy lights, chandeliers, candle walls, and uplighting create warmth. For outdoor weddings, lanterns and string lights over the dining area create magic.' },
      { heading: 'Repurpose Across Events', content: 'Smart decorators reuse elements across mehndi → sangeet → wedding. Floral arrangements, drapes, and props can be repositioned. This saves 15-20% on total decor costs.' },
      { heading: 'DIY Elements Add Character', content: 'Photo walls, welcome signage, table numbers, and favor packaging are easy DIY projects. Pinterest and Instagram are great for inspiration. This personalizes the wedding and saves money.' },
    ],
  },
  {
    id: 'timeline-planning',
    title: 'Wedding Day Timeline',
    subtitle: 'Minute-by-minute planning for a stress-free day',
    icon: <Clock className="w-5 h-5" />,
    color: 'from-cyan-500 to-blue-600',
    readTime: '6 min',
    category: 'Planning',
    sections: [
      { heading: 'Work Backwards from the Muhurat', content: 'If your wedding muhurat is at 9:30 PM, work backwards: bride\'s makeup starts 4-5 hours before, baraat arrival 1 hour before, photographer on-site 2 hours early. Build the timeline around fixed rituals.' },
      { heading: 'Buffer Between Events', content: 'Always add 30-45 minute buffers between events. Indian weddings run late — that\'s cultural. But a buffer prevents cascading delays from ruining the reception timeline.' },
      { heading: 'Vendor Load-In Schedule', content: 'Coordinate vendor arrival times: decor team arrives 6-8 hours early, caterer 4-5 hours, photographer 2 hours, DJ/band 2 hours. Give each vendor a specific contact person on your side.' },
      { heading: 'Guest Communication', content: 'Share a clear schedule with guests (especially for destination weddings): which events, what to wear, transport arrangements. A WhatsApp group or printed itinerary card works well.' },
      { heading: 'Emergency Kit', content: 'Prepare a day-of kit: safety pins, sewing kit, pain relievers, antacids, stain remover, phone chargers, cash for tips, extra blouse hooks, and a copy of all vendor contracts with contact numbers.' },
    ],
  },
  {
    id: 'makeup-styling',
    title: 'Bridal Makeup & Styling',
    subtitle: 'Look your absolute best on every event',
    icon: <Scissors className="w-5 h-5" />,
    color: 'from-pink-500 to-rose-600',
    readTime: '7 min',
    category: 'Vendors',
    sections: [
      { heading: 'Book a Trial', content: 'Always do a makeup trial 4-6 weeks before the wedding. Bring your outfit fabric swatch, jewelry, and reference photos. A trial eliminates surprises and lets you adjust the look.' },
      { heading: 'Different Looks for Different Events', content: 'Mehndi calls for fresh, dewy looks; sangeet is bold and glamorous; the wedding day is traditional and elegant. Discuss a different look for each event with your MUA.' },
      { heading: 'Skin Prep Starts Early', content: 'Start a skincare routine 3-6 months before the wedding. Regular facials, hydration, and sun protection make a visible difference. Avoid trying new products in the final month.' },
      { heading: 'Hair Matters Too', content: 'Coordinate hairstyle with your dupatta/veil draping style and jewelry (especially maang tikka and jhumkas). Bring all accessories to the trial. Oiling and deep conditioning treatments help in the lead-up.' },
      { heading: 'Pricing & Packages', content: 'Bridal packages range from ₹15K to ₹1.5L+ in metros. This typically includes bride\'s makeup for 1-2 events. Additional looks, family makeup, and draping cost extra — clarify everything upfront.' },
    ],
  },
  {
    id: 'guest-management',
    title: 'Guest List & RSVP Management',
    subtitle: 'Managing invitations, seating, and logistics',
    icon: <Users className="w-5 h-5" />,
    color: 'from-teal-500 to-emerald-600',
    readTime: '6 min',
    category: 'Planning',
    sections: [
      { heading: 'Start with Family Splits', content: 'Divide the guest list: typically 40% bride\'s family, 40% groom\'s family, 20% mutual friends. Set a hard cap early and communicate it to both families to avoid the list spiraling.' },
      { heading: 'Digital RSVPs Save Time', content: 'Use Shehn.AI\'s RSVP feature to create shareable links. Track responses in real-time, send reminders, and get accurate headcounts for catering and seating without the phone-call marathon.' },
      { heading: 'Plan for +1s and Kids', content: 'Be explicit on invites about plus-ones and children. Indian families often assume the whole family is invited. A polite note on the invite ("We have reserved X seats in your name") sets expectations.' },
      { heading: 'Seating Strategy', content: 'For sit-down meals, seat families who know each other together. Keep both families\' VIPs (nana-nani, dada-dadi) close to the stage. A round-table layout encourages conversation better than long tables.' },
      { heading: 'Outstation Guest Logistics', content: 'For guests traveling from other cities: arrange hotel blocks at negotiated rates, airport/station pickups, and a welcome kit with the event schedule and local info. A dedicated coordinator helps immensely.' },
    ],
  },
  {
    id: 'entertainment-music',
    title: 'Entertainment & Music',
    subtitle: 'DJ, band, performers, and sangeet choreography',
    icon: <Music className="w-5 h-5" />,
    color: 'from-violet-500 to-purple-600',
    readTime: '5 min',
    category: 'Vendors',
    sections: [
      { heading: 'Sangeet Is the Star Event', content: 'Choreographed performances by family and friends are the highlight of most Indian weddings. Start planning and rehearsing 6-8 weeks out. Hire a choreographer (₹10K-₹50K) for polished group numbers.' },
      { heading: 'DJ vs Live Band vs Both', content: 'DJs are versatile and cost-effective (₹25K-₹1L). Live bands add energy (₹50K-₹3L). Many couples do a band for cocktails/dinner and a DJ for the dance floor. Discuss playlist and "do-not-play" list upfront.' },
      { heading: 'Cultural Performances', content: 'Consider dhol players for the baraat, classical dancers for the reception, or a folk performance that matches your regional theme. These add cultural depth and create memorable moments.' },
      { heading: 'Sound & Equipment', content: 'Venues often have noise restrictions after 10 PM. Confirm the sound system capacity, backup equipment, and whether the DJ/band brings their own setup or uses the venue\'s. Always do a sound check.' },
      { heading: 'Kids\' Entertainment', content: 'If many children are attending, set up a separate activity zone: games, a magician, craft station, or movie screening. This keeps kids happy and parents free to enjoy the celebration.' },
    ],
  },
];

const CATEGORIES = ['All', 'Planning', 'Vendors'];

const LearningHub: React.FC = () => {
  const { theme } = useAppStore();
  const isDark = theme === 'dark';
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [expandedGuide, setExpandedGuide] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const filtered = selectedCategory === 'All'
    ? GUIDES
    : GUIDES.filter(g => g.category === selectedCategory);

  const toggleSection = (guideId: string, idx: number) => {
    const key = `${guideId}-${idx}`;
    setExpandedSections(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  return (
    <motion.div
      className="px-4 sm:px-6 lg:px-8 py-6 max-w-5xl mx-auto"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* Header */}
      <motion.div variants={item} className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-lg">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Learning Hub
            </h1>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Expert guides to plan your perfect Indian wedding
            </p>
          </div>
        </div>
      </motion.div>

      {/* Category Filter */}
      <motion.div variants={item} className="flex gap-2 mb-6">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              selectedCategory === cat
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/25'
                : isDark
                  ? 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                  : 'bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-gray-200'
            }`}
          >
            {cat}
          </button>
        ))}
        <span className={`ml-auto flex items-center text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          {filtered.length} guide{filtered.length !== 1 ? 's' : ''}
        </span>
      </motion.div>

      {/* Guide Cards */}
      <div className="space-y-4">
        {filtered.map(guide => {
          const isExpanded = expandedGuide === guide.id;
          return (
            <motion.div
              key={guide.id}
              variants={item}
              className={`rounded-2xl border overflow-hidden transition-all duration-300 ${
                isDark
                  ? 'bg-gray-800/60 border-gray-700 hover:border-gray-600'
                  : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md'
              }`}
            >
              {/* Card Header */}
              <button
                onClick={() => setExpandedGuide(isExpanded ? null : guide.id)}
                className="w-full flex items-center gap-4 p-5 text-left group"
              >
                <div className={`p-3 rounded-xl bg-gradient-to-br ${guide.color} text-white shadow-lg flex-shrink-0`}>
                  {guide.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {guide.title}
                  </h3>
                  <p className={`text-sm mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {guide.subtitle}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                      isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                    }`}>
                      <Clock className="w-3 h-3" /> {guide.readTime}
                    </span>
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                      isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {guide.category}
                    </span>
                  </div>
                </div>
                <motion.div
                  animate={{ rotate: isExpanded ? 90 : 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex-shrink-0 ${isDark ? 'text-gray-500' : 'text-gray-400'} group-hover:text-rose-500`}
                >
                  <ChevronRight className="w-5 h-5" />
                </motion.div>
              </button>

              {/* Expanded Content */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <div className={`px-5 pb-5 border-t ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                      <div className="pt-4 space-y-2">
                        {guide.sections.map((section, idx) => {
                          const sKey = `${guide.id}-${idx}`;
                          const secOpen = expandedSections.has(sKey);
                          return (
                            <div
                              key={idx}
                              className={`rounded-xl border transition-all ${
                                isDark
                                  ? 'border-gray-700 bg-gray-800/40'
                                  : 'border-gray-100 bg-gray-50/50'
                              }`}
                            >
                              <button
                                onClick={() => toggleSection(guide.id, idx)}
                                className="w-full flex items-center gap-3 px-4 py-3 text-left"
                              >
                                <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold flex-shrink-0 ${
                                  isDark ? 'bg-gray-700 text-gray-300' : 'bg-rose-100 text-rose-600'
                                }`}>
                                  {idx + 1}
                                </span>
                                <span className={`flex-1 text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                                  {section.heading}
                                </span>
                                <motion.div
                                  animate={{ rotate: secOpen ? 180 : 0 }}
                                  transition={{ duration: 0.2 }}
                                  className={isDark ? 'text-gray-500' : 'text-gray-400'}
                                >
                                  <ChevronDown className="w-4 h-4" />
                                </motion.div>
                              </button>
                              <AnimatePresence>
                                {secOpen && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.25 }}
                                    className="overflow-hidden"
                                  >
                                    <p className={`px-4 pb-4 pl-[3.25rem] text-sm leading-relaxed ${
                                      isDark ? 'text-gray-400' : 'text-gray-600'
                                    }`}>
                                      {section.content}
                                    </p>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Footer CTA */}
      <motion.div
        variants={item}
        className={`mt-8 p-6 rounded-2xl text-center border ${
          isDark ? 'bg-gray-800/40 border-gray-700' : 'bg-rose-50/50 border-rose-100'
        }`}
      >
        <Sparkles className={`w-8 h-8 mx-auto mb-3 ${isDark ? 'text-rose-400' : 'text-rose-500'}`} />
        <h3 className={`text-lg font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Ready to start planning?
        </h3>
        <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Let Shehn.AI's AI planner create a personalized blueprint for your wedding
        </p>
        <a
          href="/plan"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white text-sm font-semibold shadow-lg shadow-rose-500/25 hover:shadow-xl hover:shadow-rose-500/30 transition-all"
        >
          Start AI Planner <ArrowRight className="w-4 h-4" />
        </a>
      </motion.div>
    </motion.div>
  );
};

export default LearningHub;
