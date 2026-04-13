import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Link, Users, Plus, Copy, QrCode, Check, X } from 'lucide-react';
import { RSVPService } from '../services/rsvp_service';
import { WeddingEvent, RSVPInvite, RSVPResponse } from '../types/marketplace';
import { useAppStore } from '../store/useAppStore';

type Tab = 'events' | 'links' | 'tracker';

const WeddingInvites: React.FC = () => {
  const currentUserId = useAppStore((s) => s.currentUserId);
  const theme = useAppStore(s => s.theme);
  const isDark = theme === 'dark';

  const [activeTab, setActiveTab] = useState<Tab>('events');
  const [events, setEvents] = useState<WeddingEvent[]>([]);
  const [invites, setInvites] = useState<RSVPInvite[]>([]);
  const [responses, setResponses] = useState<RSVPResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Create event form state
  const [form, setForm] = useState({
    title: '',
    event_date: '',
    event_time: '',
    end_time: '',
    venue_name: '',
    venue_address: '',
    dress_code: '',
    meal_included: false,
  });

  // Stats from RSVP responses
  const [stats, setStats] = useState({ yes: 0, no: 0, maybe: 0, totalGuests: 0 });

  // Load events
  const loadEvents = async () => {
    setLoading(true);
    try {
      const res = await RSVPService.getEvents(currentUserId);
      if (res.success && res.data) setEvents(res.data);
    } catch { /* noop */ }
    setLoading(false);
  };

  // Load responses for tracker
  const loadResponses = async (eventId?: number) => {
    setLoading(true);
    try {
      const res = await RSVPService.getRSVPResponses(currentUserId, eventId ?? undefined);
      if (res.success && res.data) {
        setResponses(res.data.responses || []);
        if (res.data.stats) {
          setStats(res.data.stats);
        } else {
          const r = res.data.responses || [];
          setStats({
            yes: r.filter((x: RSVPResponse) => x.attending === 'yes').length,
            no: r.filter((x: RSVPResponse) => x.attending === 'no').length,
            maybe: r.filter((x: RSVPResponse) => x.attending === 'maybe').length,
            totalGuests: r.reduce((sum: number, x: RSVPResponse) => sum + 1 + (x.plus_ones || 0), 0),
          });
        }
      }
    } catch { /* noop */ }
    setLoading(false);
  };

  useEffect(() => {
    if (activeTab === 'events' || activeTab === 'links') loadEvents();
    if (activeTab === 'tracker') loadResponses(selectedEventId ?? undefined);
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'tracker') loadResponses(selectedEventId ?? undefined);
  }, [selectedEventId]);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await RSVPService.createEvent({ ...form, couple_id: currentUserId } as any);
    if (res.success && res.data) {
      setEvents((prev) => [...prev, res.data!]);
      setShowCreateForm(false);
      setForm({ title: '', event_date: '', event_time: '', end_time: '', venue_name: '', venue_address: '', dress_code: '', meal_included: false });
    }
  };

  const handleGenerateLink = async (eventId: number) => {
    const res = await RSVPService.generateInviteLink({ couple_id: currentUserId, event_id: eventId });
    if (res.success && res.data) {
      setInvites((prev) => [...prev, res.data!]);
    }
  };

  const copyToClipboard = async (invite: RSVPInvite) => {
    const url = `shehn.ai/rsvp/${invite.invite_code}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(invite.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'events', label: 'Events', icon: <Calendar className="w-4 h-4" /> },
    { key: 'links', label: 'Invite Links', icon: <Link className="w-4 h-4" /> },
    { key: 'tracker', label: 'RSVP Tracker', icon: <Users className="w-4 h-4" /> },
  ];

  const attendingColor = (status: string) =>
    status === 'yes' ? (isDark ? 'bg-sage-900/30 text-sage-400' : 'bg-sage-100 text-sage-700')
    : status === 'no' ? (isDark ? 'bg-rose-900/30 text-rose-400' : 'bg-rose-100 text-rose-700')
    : (isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700');

  return (
    <div className={`min-h-screen p-4 sm:p-6 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className={`text-xl sm:text-2xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Wedding Invites & RSVP</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-rose-500 text-white shadow-md'
                  : isDark ? 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {loading && <div className={`text-center py-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Loading...</div>}

        {/* ─── Tab 1: Events ─── */}
        {activeTab === 'events' && !loading && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="flex items-center gap-2 px-4 py-2 bg-rose-500 text-white text-sm font-medium rounded-lg hover:bg-rose-600 transition-colors"
              >
                <Plus className="w-4 h-4" /> Create Event
              </button>
            </div>

            {/* Inline Create Form */}
            {showCreateForm && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                onSubmit={handleCreateEvent}
                className={`rounded-xl border p-5 space-y-4 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
              >
                <h3 className={`font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>New Event</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input type="text" required placeholder="Event title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={`border rounded-lg px-3 py-2 text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500' : 'border-gray-300'}`} />
                  <input type="date" required value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} className={`border rounded-lg px-3 py-2 text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-gray-200' : 'border-gray-300'}`} />
                  <input type="time" required placeholder="Start time" value={form.event_time} onChange={(e) => setForm({ ...form, event_time: e.target.value })} className={`border rounded-lg px-3 py-2 text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-gray-200' : 'border-gray-300'}`} />
                  <input type="time" placeholder="End time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} className={`border rounded-lg px-3 py-2 text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-gray-200' : 'border-gray-300'}`} />
                  <input type="text" required placeholder="Venue name" value={form.venue_name} onChange={(e) => setForm({ ...form, venue_name: e.target.value })} className={`border rounded-lg px-3 py-2 text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500' : 'border-gray-300'}`} />
                  <input type="text" placeholder="Venue address" value={form.venue_address} onChange={(e) => setForm({ ...form, venue_address: e.target.value })} className={`border rounded-lg px-3 py-2 text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500' : 'border-gray-300'}`} />
                  <input type="text" placeholder="Dress code" value={form.dress_code} onChange={(e) => setForm({ ...form, dress_code: e.target.value })} className={`border rounded-lg px-3 py-2 text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500' : 'border-gray-300'}`} />
                  <label className={`flex items-center gap-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    <input type="checkbox" checked={form.meal_included} onChange={(e) => setForm({ ...form, meal_included: e.target.checked })} className="rounded" />
                    Meal included
                  </label>
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="px-4 py-2 bg-rose-500 text-white text-sm font-medium rounded-lg hover:bg-rose-600">Save Event</button>
                  <button type="button" onClick={() => setShowCreateForm(false)} className={`px-4 py-2 text-sm ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}>Cancel</button>
                </div>
              </motion.form>
            )}

            {/* Event Cards */}
            {events.length === 0 ? (
              <div className={`text-center py-12 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>No events yet. Create your first event above.</div>
            ) : (
              events.map((evt, idx) => (
                <motion.div
                  key={evt.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`rounded-xl border p-5 shadow-sm ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className={`text-lg font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{evt.title}</h3>
                      <div className={`flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{evt.event_date}</span>
                        <span>{evt.event_time}{evt.end_time ? ` - ${evt.end_time}` : ''}</span>
                        <span>{evt.venue_name}</span>
                      </div>
                      <div className="flex gap-2 mt-2">
                        {evt.dress_code && <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>{evt.dress_code}</span>}
                        {evt.meal_included && <span className="text-xs bg-sage-100 text-sage-700 px-2 py-0.5 rounded-full">Meal included</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => handleGenerateLink(evt.id)}
                      className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${isDark ? 'text-rose-400 border border-rose-800 hover:bg-rose-900/30' : 'text-rose-600 border border-rose-200 hover:bg-rose-50'}`}
                    >
                      <Link className="w-4 h-4" /> Generate Invite Link
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}

        {/* ─── Tab 2: Invite Links ─── */}
        {activeTab === 'links' && !loading && (
          <div className="space-y-4">
            {invites.length === 0 ? (
              <div className={`text-center py-12 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>No invite links yet. Generate one from the Events tab.</div>
            ) : (
              invites.map((invite, idx) => {
                const event = events.find((e) => e.id === invite.event_id);
                const url = `shehn.ai/rsvp/${invite.invite_code}`;
                return (
                  <motion.div
                    key={invite.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`rounded-xl border p-5 shadow-sm flex items-center justify-between ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
                  >
                    <div>
                      <p className={`text-sm font-medium ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{event?.title ?? `Event #${invite.event_id}`}</p>
                      <p className={`text-sm mt-0.5 font-mono ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{url}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${invite.is_active ? (isDark ? 'bg-sage-900/30 text-sage-400' : 'bg-sage-100 text-sage-700') : (isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500')}`}>
                        {invite.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <button
                        onClick={() => copyToClipboard(invite)}
                        className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border rounded-lg transition-colors ${isDark ? 'border-gray-700 hover:bg-gray-700 text-gray-300' : 'border-gray-200 hover:bg-gray-50'}`}
                      >
                        {copiedId === invite.id ? (
                          <><Check className="w-4 h-4 text-sage-600" /> <span className="text-sage-600">Copied!</span></>
                        ) : (
                          <><Copy className="w-4 h-4 text-gray-500" /> Copy</>
                        )}
                      </button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        )}

        {/* ─── Tab 3: RSVP Tracker ─── */}
        {activeTab === 'tracker' && !loading && (
          <div className="space-y-6">
            {/* Event Selector */}
            <select
              value={selectedEventId ?? ''}
              onChange={(e) => setSelectedEventId(e.target.value ? Number(e.target.value) : null)}
              className={`border rounded-lg px-3 py-2 text-sm w-full max-w-xs ${isDark ? 'bg-gray-700 border-gray-600 text-gray-200' : 'border-gray-300'}`}
            >
              <option value="">All events</option>
              {events.map((evt) => (
                <option key={evt.id} value={evt.id}>{evt.title}</option>
              ))}
            </select>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className={`rounded-xl p-4 text-center ${isDark ? 'bg-sage-900/30' : 'bg-sage-50'}`}>
                <p className={`text-2xl font-bold ${isDark ? 'text-sage-400' : 'text-sage-700'}`}>{stats.yes}</p>
                <p className={`text-xs ${isDark ? 'text-sage-400' : 'text-sage-600'}`}>Yes</p>
              </div>
              <div className={`rounded-xl p-4 text-center ${isDark ? 'bg-rose-900/30' : 'bg-rose-50'}`}>
                <p className={`text-2xl font-bold ${isDark ? 'text-rose-400' : 'text-rose-700'}`}>{stats.no}</p>
                <p className={`text-xs ${isDark ? 'text-rose-400' : 'text-rose-600'}`}>No</p>
              </div>
              <div className={`rounded-xl p-4 text-center ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <p className={`text-2xl font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{stats.maybe}</p>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Maybe</p>
              </div>
              <div className={`rounded-xl p-4 text-center ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <p className={`text-2xl font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{stats.totalGuests}</p>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Total Guests</p>
              </div>
            </div>

            {/* Response Table */}
            {responses.length === 0 ? (
              <div className={`text-center py-12 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>No RSVP responses yet.</div>
            ) : (
              <div className={`rounded-xl border shadow-sm overflow-hidden ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <table className="w-full">
                  <thead>
                    <tr className={`border-b ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                      <th className={`text-left px-5 py-3 text-xs font-semibold uppercase ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Guest</th>
                      <th className={`text-left px-5 py-3 text-xs font-semibold uppercase ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Status</th>
                      <th className={`text-left px-5 py-3 text-xs font-semibold uppercase ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Plus ones</th>
                      <th className={`text-left px-5 py-3 text-xs font-semibold uppercase ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Dietary</th>
                      <th className={`text-left px-5 py-3 text-xs font-semibold uppercase ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {responses.map((r, idx) => (
                      <tr key={r.id ?? idx} className={idx % 2 === 0 ? (isDark ? 'bg-gray-800' : 'bg-white') : (isDark ? 'bg-gray-750' : 'bg-gray-50')}>
                        <td className={`px-5 py-3 text-sm font-medium ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{r.guest_name}</td>
                        <td className="px-5 py-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${attendingColor(r.attending)}`}>
                            {r.attending.charAt(0).toUpperCase() + r.attending.slice(1)}
                          </span>
                        </td>
                        <td className={`px-5 py-3 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{r.plus_ones}</td>
                        <td className={`px-5 py-3 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{r.dietary_notes || '-'}</td>
                        <td className={`px-5 py-3 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{r.message || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WeddingInvites;
