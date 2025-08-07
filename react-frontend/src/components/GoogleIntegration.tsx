import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Mail, 
  Users, 
  Clock, 
  MapPin, 
  Plus, 
  Edit, 
  Trash2, 
  Send, 
  Loader2,
  LogIn,
  LogOut
} from 'lucide-react';
import { GoogleAPIService } from '../services/google_api_service';
import { ErrorBoundary } from './ErrorBoundary';

interface WeddingEvent {
  id?: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  attendees: string[];
  eventType: 'ceremony' | 'reception' | 'rehearsal' | 'vendor-meeting' | 'other';
  reminders: {
    email: boolean;
    popup: boolean;
    minutes: number;
  };
}

interface EmailTemplate {
  subject: string;
  body: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
}

const GoogleIntegration: React.FC = () => {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [events, setEvents] = useState<WeddingEvent[]>([]);
  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'calendar' | 'email'>('calendar');
  const [showEventForm, setShowEventForm] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<WeddingEvent | null>(null);
  const [guestList, setGuestList] = useState<string[]>([]);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Form states
  const [eventForm, setEventForm] = useState<WeddingEvent>({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    location: '',
    attendees: [],
    eventType: 'other',
    reminders: {
      email: true,
      popup: true,
      minutes: 60
    }
  });

  const [emailForm, setEmailForm] = useState<EmailTemplate>({
    subject: '',
    body: '',
    to: [],
    cc: [],
    bcc: []
  });

  useEffect(() => {
    const initAPI = async () => {
      try {
        await initializeGoogleAPI();
      } catch (error) {
        console.error('Failed to initialize Google API:', error);
        setIsDemoMode(true);
      }
    };
    
    initAPI();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const initializeGoogleAPI = async () => {
    try {
      const initialized = await GoogleAPIService.initialize();
      if (initialized) {
        setIsSignedIn(GoogleAPIService.isUserSignedIn());
        if (GoogleAPIService.isUserSignedIn()) {
          loadUserProfile();
          loadEvents();
          loadEmails();
        }
      } else {
        console.log('Google API not available - running in demo mode');
        setIsDemoMode(true);
      }
    } catch (error) {
      console.error('Failed to initialize Google API:', error);
      setIsDemoMode(true);
    }
  };

  const handleSignIn = async () => {
    try {
      setLoading(true);
      const success = await GoogleAPIService.signIn();
      if (success) {
        setIsSignedIn(true);
        await loadUserProfile();
        await loadEvents();
        await loadEmails();
      }
    } catch (error) {
      console.error('Sign in failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await GoogleAPIService.signOut();
      setIsSignedIn(false);
      setUserProfile(null);
      setEvents([]);
      setEmails([]);
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  const loadUserProfile = async () => {
    try {
      const profile = await GoogleAPIService.getUserProfile();
      setUserProfile(profile);
    } catch (error) {
      console.error('Failed to load user profile:', error);
    }
  };

  const loadEvents = async () => {
    try {
      setLoading(true);
      const weddingEvents = await GoogleAPIService.getWeddingEvents();
      setEvents(weddingEvents);
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEmails = async () => {
    try {
      setLoading(true);
      const weddingEmails = await GoogleAPIService.getWeddingEmails();
      setEmails(weddingEmails);
    } catch (error) {
      console.error('Failed to load emails:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async () => {
    try {
      setLoading(true);
      const eventId = await GoogleAPIService.createWeddingEvent(eventForm);
      setEvents([...events, { ...eventForm, id: eventId }]);
      setShowEventForm(false);
      resetEventForm();
    } catch (error) {
      console.error('Failed to create event:', error);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleUpdateEvent = async () => {
    if (!editingEvent?.id) return;
    
    try {
      setLoading(true);
      await GoogleAPIService.updateWeddingEvent(editingEvent.id, editingEvent);
      setEvents(events.map(e => e.id === editingEvent.id ? editingEvent : e));
      setEditingEvent(null);
    } catch (error) {
      console.error('Failed to update event:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      setLoading(true);
      await GoogleAPIService.deleteWeddingEvent(eventId);
      setEvents(events.filter(e => e.id !== eventId));
    } catch (error) {
      console.error('Failed to delete event:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async () => {
    try {
      setLoading(true);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const messageId = await GoogleAPIService.sendWeddingInvitation(emailForm);
      setShowEmailForm(false);
      resetEmailForm();
      await loadEmails(); // Refresh email list
    } catch (error) {
      console.error('Failed to send email:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkInvitations = async () => {
    try {
      setLoading(true);
      const weddingDetails = {
        date: eventForm.startDate,
        time: new Date(eventForm.startDate).toLocaleTimeString(),
        venue: eventForm.location,
        address: eventForm.location,
        coupleNames: userProfile?.name || 'The Happy Couple'
      };
      
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const messageIds = await GoogleAPIService.sendBulkInvitations(guestList, weddingDetails);
      setGuestList([]);
      await loadEmails();
    } catch (error) {
      console.error('Failed to send bulk invitations:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetEventForm = () => {
    setEventForm({
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      location: '',
      attendees: [],
      eventType: 'other',
      reminders: {
        email: true,
        popup: true,
        minutes: 60
      }
    });
  };

  const resetEmailForm = () => {
    setEmailForm({
      subject: '',
      body: '',
      to: [],
      cc: [],
      bcc: []
    });
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'ceremony': return '💒';
      case 'reception': return '🍾';
      case 'rehearsal': return '🎭';
      case 'vendor-meeting': return '🤝';
      default: return '📅';
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'ceremony': return 'bg-red-100 text-red-800';
      case 'reception': return 'bg-green-100 text-green-800';
      case 'rehearsal': return 'bg-blue-100 text-blue-800';
      case 'vendor-meeting': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 shadow-xl max-w-md w-full">
          <div className="text-center">
                          <div className="bg-gradient-to-r from-green-600 to-blue-700 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <Calendar className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              {isDemoMode ? 'Google Integration (Demo Mode)' : 'Connect Your Google Account'}
            </h2>
            <p className="text-gray-600 mb-6">
              {isDemoMode 
                ? 'Google API keys are not configured. This is a demo view showing how the integration would work.'
                : 'Sign in with Google to manage your wedding calendar and send invitations'
              }
            </p>
            {isDemoMode ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-yellow-800 text-sm">
                  To enable full Google integration, please configure your Google API keys in the environment variables.
                </p>
              </div>
            ) : (
              <button
                onClick={handleSignIn}
                disabled={loading}
                className="w-full bg-gradient-to-r from-green-600 to-blue-700 text-white py-3 px-6 rounded-xl font-semibold hover:from-green-700 hover:to-blue-800 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <LogIn className="w-5 h-5" />
                )}
                Sign in with Google
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-green-600 to-blue-700 p-2 rounded-lg">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Google Integration</h1>
                <p className="text-sm text-gray-600">
                  Manage calendar & emails for {userProfile?.name}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {userProfile && (
                <div className="flex items-center space-x-2">
                  <img 
                    src={userProfile.imageUrl} 
                    alt={userProfile.name}
                    className="w-8 h-8 rounded-full"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {userProfile.name}
                  </span>
                </div>
              )}
              <button
                onClick={handleSignOut}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Tab Navigation */}
          <div className="bg-white rounded-2xl p-2 mb-8 shadow-lg">
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveTab('calendar')}
                className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                  activeTab === 'calendar'
                    ? 'bg-gradient-to-r from-green-600 to-blue-700 text-white'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Calendar className="w-5 h-5" />
                Calendar Events
              </button>
              <button
                onClick={() => setActiveTab('email')}
                className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                  activeTab === 'email'
                    ? 'bg-gradient-to-r from-green-600 to-blue-700 text-white'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Mail className="w-5 h-5" />
                Email Management
              </button>
            </div>
          </div>

          {/* Calendar Tab */}
          {activeTab === 'calendar' && (
            <div className="space-y-8">
              {/* Quick Actions */}
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-800">Wedding Events</h2>
                  <button
                    onClick={() => setShowEventForm(true)}
                    className="bg-gradient-to-r from-green-600 to-blue-700 text-white px-4 py-2 rounded-lg hover:from-green-700 hover:to-blue-800 transition-all duration-300 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Event
                  </button>
                </div>

                {loading ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto mb-2" />
                    <p className="text-gray-600">Loading events...</p>
                  </div>
                ) : events.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No wedding events found</p>
                    <p className="text-sm text-gray-500">Create your first event to get started</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {events.map((event) => (
                      <div key={event.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4">
                            <div className="text-2xl">{getEventTypeIcon(event.eventType)}</div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <h3 className="font-semibold text-gray-800">{event.title}</h3>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEventTypeColor(event.eventType)}`}>
                                  {event.eventType}
                                </span>
                              </div>
                              <p className="text-gray-600 text-sm mb-2">{event.description}</p>
                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <div className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {new Date(event.startDate).toLocaleDateString()} {new Date(event.startDate).toLocaleTimeString()}
                                </div>
                                {event.location && (
                                  <div className="flex items-center gap-1">
                                    <MapPin className="w-4 h-4" />
                                    {event.location}
                                  </div>
                                )}
                                {event.attendees.length > 0 && (
                                  <div className="flex items-center gap-1">
                                    <Users className="w-4 h-4" />
                                    {event.attendees.length} attendees
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => setEditingEvent(event)}
                              className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => event.id && handleDeleteEvent(event.id)}
                              className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Email Tab */}
          {activeTab === 'email' && (
            <div className="space-y-8">
              {/* Quick Actions */}
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-800">Email Management</h2>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setShowEmailForm(true)}
                      className="bg-gradient-to-r from-green-600 to-blue-700 text-white px-4 py-2 rounded-lg hover:from-green-700 hover:to-blue-800 transition-all duration-300 flex items-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      Send Email
                    </button>
                  </div>
                </div>

                {/* Bulk Invitations */}
                <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-6 mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Bulk Invitations</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Guest List (one email per line)
                      </label>
                      <textarea
                        value={guestList.join('\n')}
                        onChange={(e) => setGuestList(e.target.value.split('\n').filter(email => email.trim()))}
                        placeholder="guest1@example.com&#10;guest2@example.com&#10;guest3@example.com"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-green-300 focus:ring-2 focus:ring-green-300/20 transition-all duration-300 min-h-[100px]"
                      />
                    </div>
                    <button
                      onClick={handleBulkInvitations}
                      disabled={loading || guestList.length === 0}
                      className="bg-gradient-to-r from-green-500 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-green-600 hover:to-blue-700 transition-all duration-300 disabled:opacity-50 flex items-center gap-2"
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      Send Invitations ({guestList.length} guests)
                    </button>
                  </div>
                </div>

                {/* Email List */}
                {loading ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto mb-2" />
                    <p className="text-gray-600">Loading emails...</p>
                  </div>
                ) : emails.length === 0 ? (
                  <div className="text-center py-8">
                    <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No wedding emails found</p>
                    <p className="text-sm text-gray-500">Send your first email to get started</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {emails.map((email) => (
                      <div key={email.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-800 mb-1">
                              {email.payload?.headers?.find((h: any) => h.name === 'Subject')?.value || 'No Subject'}
                            </h3>
                            <p className="text-gray-600 text-sm mb-2">{email.snippet}</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span>
                                From: {email.payload?.headers?.find((h: any) => h.name === 'From')?.value || 'Unknown'}
                              </span>
                              <span>
                                To: {email.payload?.headers?.find((h: any) => h.name === 'To')?.value || 'Unknown'}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-400">
                              {new Date(parseInt(email.internalDate)).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Event Form Modal */}
      {showEventForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Add Wedding Event</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Event Title</label>
                <input
                  type="text"
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-pink-300 focus:ring-2 focus:ring-pink-300/20 transition-all duration-300"
                  placeholder="Wedding Ceremony"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-pink-300 focus:ring-2 focus:ring-pink-300/20 transition-all duration-300 min-h-[100px]"
                  placeholder="Event description..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date & Time</label>
                  <input
                    type="datetime-local"
                    value={eventForm.startDate}
                    onChange={(e) => setEventForm({ ...eventForm, startDate: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-pink-300 focus:ring-2 focus:ring-pink-300/20 transition-all duration-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date & Time</label>
                  <input
                    type="datetime-local"
                    value={eventForm.endDate}
                    onChange={(e) => setEventForm({ ...eventForm, endDate: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-pink-300 focus:ring-2 focus:ring-pink-300/20 transition-all duration-300"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <input
                  type="text"
                  value={eventForm.location}
                  onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-pink-300 focus:ring-2 focus:ring-pink-300/20 transition-all duration-300"
                  placeholder="Venue address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Event Type</label>
                <select
                  value={eventForm.eventType}
                  onChange={(e) => setEventForm({ ...eventForm, eventType: e.target.value as any })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-pink-300 focus:ring-2 focus:ring-pink-300/20 transition-all duration-300"
                >
                  <option value="ceremony">Ceremony</option>
                  <option value="reception">Reception</option>
                  <option value="rehearsal">Rehearsal</option>
                  <option value="vendor-meeting">Vendor Meeting</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Attendees (comma-separated emails)</label>
                <input
                  type="text"
                  value={eventForm.attendees.join(', ')}
                  onChange={(e) => setEventForm({ ...eventForm, attendees: e.target.value.split(',').map(email => email.trim()).filter(Boolean) })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-pink-300 focus:ring-2 focus:ring-pink-300/20 transition-all duration-300"
                  placeholder="guest1@example.com, guest2@example.com"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => setShowEventForm(false)}
                className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateEvent}
                disabled={loading || !eventForm.title || !eventForm.startDate}
                className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all duration-300 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Event'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Form Modal */}
      {showEmailForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Send Email</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                <input
                  type="text"
                  value={emailForm.subject}
                  onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-pink-300 focus:ring-2 focus:ring-pink-300/20 transition-all duration-300"
                  placeholder="Email subject"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">To (comma-separated emails)</label>
                <input
                  type="text"
                  value={emailForm.to.join(', ')}
                  onChange={(e) => setEmailForm({ ...emailForm, to: e.target.value.split(',').map(email => email.trim()).filter(Boolean) })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-pink-300 focus:ring-2 focus:ring-pink-300/20 transition-all duration-300"
                  placeholder="recipient@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">CC (optional)</label>
                <input
                  type="text"
                  value={emailForm.cc?.join(', ') || ''}
                  onChange={(e) => setEmailForm({ ...emailForm, cc: e.target.value.split(',').map(email => email.trim()).filter(Boolean) })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-pink-300 focus:ring-2 focus:ring-pink-300/20 transition-all duration-300"
                  placeholder="cc@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                <textarea
                  value={emailForm.body}
                  onChange={(e) => setEmailForm({ ...emailForm, body: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-pink-300 focus:ring-2 focus:ring-pink-300/20 transition-all duration-300 min-h-[200px]"
                  placeholder="Email message..."
                />
              </div>
            </div>
            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => setShowEmailForm(false)}
                className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendEmail}
                disabled={loading || !emailForm.subject || !emailForm.to.length || !emailForm.body}
                className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all duration-300 disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Email'}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </ErrorBoundary>
  );
};

export default GoogleIntegration; 