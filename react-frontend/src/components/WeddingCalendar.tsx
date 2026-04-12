import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, MapPin, Phone, Video, User, Bell, Plus, Sparkles, Loader2, X } from 'lucide-react';
import { TimelineService } from '../services/timeline_service';
import { TimelineEvent } from '../types/marketplace';
import { useAppStore } from '../store/useAppStore';

interface WeddingCalendarProps {
  onEventClick?: (event: TimelineEvent) => void;
}

/* ── Inline form for creating a new event ── */
interface NewEventForm {
  title: string;
  event_type: TimelineEvent['event_type'];
  start_datetime: string;
  priority: TimelineEvent['priority'];
  location: string;
}

const EMPTY_FORM: NewEventForm = {
  title: '',
  event_type: 'custom',
  start_datetime: '',
  priority: 'medium',
  location: '',
};

export const WeddingCalendar: React.FC<WeddingCalendarProps> = ({ onEventClick }) => {
  const { currentUserId, blueprint } = useAppStore();

  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<NewEventForm>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  /* ── Fetch events ── */
  const loadEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await TimelineService.getTimeline(currentUserId, { upcoming: true });
      if (res.success && res.data) {
        setEvents(res.data);
      } else {
        setError(res.error || 'Failed to load events');
      }
    } catch (err) {
      console.error('Failed to load timeline events:', err);
      setError('Could not reach the server');
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  /* ── Create event ── */
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.start_datetime) return;

    try {
      const endDatetime = new Date(new Date(formData.start_datetime).getTime() + 60 * 60 * 1000).toISOString();
      const res = await TimelineService.createEvent({
        couple_id: currentUserId,
        title: formData.title,
        event_type: formData.event_type,
        start_datetime: formData.start_datetime,
        end_datetime: endDatetime,
        priority: formData.priority,
        location: formData.location,
        status: 'upcoming',
        color: '',
        vendor_id: null,
      });
      if (res.success) {
        setFormData(EMPTY_FORM);
        setShowForm(false);
        await loadEvents();
      } else {
        setError(res.error || 'Failed to create event');
      }
    } catch (err) {
      console.error('Failed to create event:', err);
      setError('Could not create event');
    }
  };

  /* ── AI Generate ── */
  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const weddingDate = blueprint?.date || '';
      const weddingEvents = blueprint?.events || [];

      if (!weddingDate) {
        setError('Set your wedding date in Preferences first');
        setIsGenerating(false);
        return;
      }

      const res = await TimelineService.generateTimeline({
        couple_id: currentUserId,
        wedding_date: weddingDate,
        events: weddingEvents,
      });
      if (res.success) {
        await loadEvents();
      } else {
        setError(res.error || 'Failed to generate timeline');
      }
    } catch (err) {
      console.error('Failed to generate timeline:', err);
      setError('Could not generate timeline');
    } finally {
      setIsGenerating(false);
    }
  };

  /* ── Helpers ── */
  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'vendor_meeting': return <User className="h-4 w-4" />;
      case 'deadline': return <Clock className="h-4 w-4" />;
      case 'ceremony':
      case 'reception':
      case 'rehearsal':
        return <Calendar className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getEventTypeColor = (type: string, priority: string) => {
    if (priority === 'high') return 'bg-rose-500';
    const colors: Record<string, string> = {
      vendor_meeting: 'bg-gray-500',
      ceremony: 'bg-rose-400',
      reception: 'bg-rose-400',
      rehearsal: 'bg-amber-500',
      deadline: 'bg-red-500',
      custom: 'bg-gray-400',
    };
    return colors[type] || 'bg-gray-400';
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      high: 'bg-rose-100 text-rose-800',
      medium: 'bg-gray-100 text-gray-800',
      low: 'bg-green-100 text-green-800',
    };
    return colors[priority] || colors.medium;
  };

  const formatDate = (datetime: string) => {
    const date = new Date(datetime);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return date.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatTime = (datetime: string) => {
    const date = new Date(datetime);
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  const getRelativeTime = (datetime: string) => {
    const eventDate = new Date(datetime);
    const now = new Date();
    const diffMs = eventDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
      if (diffHours <= 0) return 'Now';
      if (diffHours === 1) return 'In 1 hour';
      return `In ${diffHours} hours`;
    }
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays <= 7) return `In ${diffDays} days`;
    return `In ${Math.ceil(diffDays / 7)} weeks`;
  };

  const upcomingEvents = events
    .filter(ev => ev.status === 'upcoming')
    .sort((a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime());

  /* ── Loading skeleton ── */
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-rose-100 rounded-lg">
              <Calendar className="h-5 w-5 text-rose-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Wedding Timeline</h3>
              <p className="text-sm text-gray-600">Upcoming events and vendor meetings</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              <span>{isGenerating ? 'Generating...' : 'AI Generate'}</span>
            </button>
            <button
              onClick={() => setShowForm(prev => !prev)}
              className="flex items-center space-x-2 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
            >
              {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              <span>{showForm ? 'Cancel' : 'Add Event'}</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}
      </div>

      {/* Inline create form */}
      {showForm && (
        <form onSubmit={handleCreateEvent} className="p-6 border-b border-gray-200 bg-gray-50 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Event title *"
              value={formData.title}
              onChange={e => setFormData(f => ({ ...f, title: e.target.value }))}
              required
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            />
            <select
              value={formData.event_type}
              onChange={e => setFormData(f => ({ ...f, event_type: e.target.value as TimelineEvent['event_type'] }))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            >
              <option value="custom">Custom</option>
              <option value="ceremony">Ceremony</option>
              <option value="reception">Reception</option>
              <option value="rehearsal">Rehearsal</option>
              <option value="vendor_meeting">Vendor Meeting</option>
              <option value="deadline">Deadline</option>
            </select>
            <input
              type="datetime-local"
              value={formData.start_datetime}
              onChange={e => setFormData(f => ({ ...f, start_datetime: e.target.value }))}
              required
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            />
            <select
              value={formData.priority}
              onChange={e => setFormData(f => ({ ...f, priority: e.target.value as TimelineEvent['priority'] }))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            >
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
            <input
              type="text"
              placeholder="Location (optional)"
              value={formData.location}
              onChange={e => setFormData(f => ({ ...f, location: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors text-sm font-medium"
            >
              Create Event
            </button>
          </div>
        </form>
      )}

      {/* Generating overlay */}
      {isGenerating && (
        <div className="p-6 border-b border-gray-200 bg-purple-50 flex items-center space-x-3">
          <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
          <span className="text-sm text-purple-700">AI is generating your wedding timeline... This may take a moment.</span>
        </div>
      )}

      {/* Event list */}
      <div className="p-6">
        <div className="space-y-4">
          {upcomingEvents.map((event) => (
            <div
              key={event.id}
              className="relative p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer group"
              onClick={() => onEventClick?.(event)}
            >
              {/* Type indicator bar */}
              <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg ${getEventTypeColor(event.event_type, event.priority)}`} />

              <div className="ml-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className={`p-1.5 rounded-lg text-white ${getEventTypeColor(event.event_type, event.priority)}`}>
                        {getEventTypeIcon(event.event_type)}
                      </div>
                      <h4 className="font-medium text-gray-900 group-hover:text-rose-600 transition-colors">
                        {event.title}
                      </h4>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityBadge(event.priority)}`}>
                        {event.priority}
                      </span>
                    </div>

                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(event.start_datetime)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{formatTime(event.start_datetime)}</span>
                      </div>
                      {event.location && (
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-4 w-4" />
                          <span className="truncate max-w-32">{event.location}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right ml-4">
                    <div className="text-sm font-medium text-rose-600">
                      {getRelativeTime(event.start_datetime)}
                    </div>
                    {event.color && (
                      <div className="mt-1 w-3 h-3 rounded-full ml-auto" style={{ backgroundColor: event.color }} />
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {upcomingEvents.length === 0 && !isGenerating && (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h4 className="text-sm font-medium text-gray-900 mb-2">No upcoming events</h4>
            <p className="text-sm text-gray-600 mb-4">Your wedding timeline will appear here</p>
            <div className="flex items-center justify-center space-x-3">
              <button
                onClick={() => setShowForm(true)}
                className="text-rose-600 hover:text-rose-700 text-sm font-medium"
              >
                Add your first event
              </button>
              <span className="text-gray-300">or</span>
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="text-purple-600 hover:text-purple-700 text-sm font-medium"
              >
                Generate with AI
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
