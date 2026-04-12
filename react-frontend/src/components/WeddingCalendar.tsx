import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Phone, Video, User, Bell, Plus } from 'lucide-react';

interface WeddingEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  type: 'vendor_meeting' | 'reminder' | 'deadline' | 'wedding_event';
  vendor?: {
    name: string;
    category: string;
    contact?: string;
  };
  location?: string;
  description?: string;
  priority: 'high' | 'medium' | 'low';
  status: 'upcoming' | 'in_progress' | 'completed' | 'cancelled';
  isGoogleEvent?: boolean;
}

interface WeddingCalendarProps {
  weddingId?: string;
  onEventClick?: (event: WeddingEvent) => void;
  onAddEvent?: () => void;
}

export const WeddingCalendar: React.FC<WeddingCalendarProps> = ({
  weddingId,
  onEventClick,
  onAddEvent
}) => {
  const [events, setEvents] = useState<WeddingEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadWeddingEvents();
  }, [weddingId]);

  const loadWeddingEvents = async () => {
    setIsLoading(true);
    try {
      // Mock data - replace with actual API call
      const mockEvents: WeddingEvent[] = [
        {
          id: '1',
          title: 'Venue Site Visit',
          date: '2024-01-15',
          time: '14:00',
          type: 'vendor_meeting',
          vendor: {
            name: 'The Grand Palace',
            category: 'venues',
            contact: '+91-9876543210'
          },
          location: 'Juhu, Mumbai',
          description: 'Final venue walkthrough and contract discussion',
          priority: 'high',
          status: 'upcoming'
        },
        {
          id: '2',
          title: 'Catering Tasting Session',
          date: '2024-01-18',
          time: '12:00',
          type: 'vendor_meeting',
          vendor: {
            name: 'Royal Caterers',
            category: 'catering',
            contact: '+91-9876543211'
          },
          location: 'Bandra, Mumbai',
          description: 'Menu tasting and final selection',
          priority: 'high',
          status: 'upcoming'
        },
        {
          id: '3',
          title: 'Photography Meeting',
          date: '2024-01-20',
          time: '16:00',
          type: 'vendor_meeting',
          vendor: {
            name: 'Moments Studio',
            category: 'photography',
            contact: '+91-9876543212'
          },
          location: 'Virtual Meeting',
          description: 'Discuss shot list and timeline',
          priority: 'medium',
          status: 'upcoming'
        },
        {
          id: '4',
          title: 'Vendor Contract Deadline',
          date: '2024-01-22',
          time: '23:59',
          type: 'deadline',
          description: 'Final date to submit all vendor contracts',
          priority: 'high',
          status: 'upcoming'
        },
        {
          id: '5',
          title: 'Wedding Rehearsal',
          date: '2024-02-14',
          time: '18:00',
          type: 'wedding_event',
          location: 'The Grand Palace, Juhu',
          description: 'Full wedding rehearsal with all vendors',
          priority: 'high',
          status: 'upcoming'
        }
      ];

      setEvents(mockEvents);
    } catch (error) {
      console.error('Failed to load wedding events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'vendor_meeting': return <User className="h-4 w-4" />;
      case 'reminder': return <Bell className="h-4 w-4" />;
      case 'deadline': return <Clock className="h-4 w-4" />;
      case 'wedding_event': return <Calendar className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  const getEventTypeColor = (type: string, priority: string) => {
    const baseColors = {
      vendor_meeting: priority === 'high' ? 'bg-gray-500' : 'bg-gray-400',
      reminder: 'bg-rose-500',
      deadline: 'bg-rose-500',
      wedding_event: 'bg-rose-500'
    };
    return baseColors[type as keyof typeof baseColors] || 'bg-gray-500';
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      high: 'bg-rose-100 text-rose-800',
      medium: 'bg-gray-100 text-gray-800',
      low: 'bg-sage-100 text-sage-800'
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };

  const getUpcomingEvents = () => {
    const today = new Date();
    return events
      .filter(event => new Date(event.date) >= today && event.status === 'upcoming')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-IN', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const getRelativeTime = (dateString: string, timeString: string) => {
    const eventDate = new Date(`${dateString}T${timeString}`);
    const now = new Date();
    const diffMs = eventDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
      if (diffHours <= 0) {
        return 'Now';
      } else if (diffHours === 1) {
        return 'In 1 hour';
      } else {
        return `In ${diffHours} hours`;
      }
    } else if (diffDays === 1) {
      return 'Tomorrow';
    } else if (diffDays <= 7) {
      return `In ${diffDays} days`;
    } else {
      return `In ${Math.ceil(diffDays / 7)} weeks`;
    }
  };

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
          
          {onAddEvent && (
            <button
              onClick={onAddEvent}
              className="flex items-center space-x-2 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Add Event</span>
            </button>
          )}
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="p-6">
        <div className="space-y-4">
          {getUpcomingEvents().map((event) => (
            <div
              key={event.id}
              className="relative p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer group"
              onClick={() => onEventClick && onEventClick(event)}
            >
              {/* Event Type Indicator */}
              <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg ${getEventTypeColor(event.type, event.priority)}`}></div>
              
              <div className="ml-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className={`p-1.5 rounded-lg ${getEventTypeColor(event.type, event.priority).replace('bg-', 'bg-opacity-10 bg-')} text-white`}>
                        {getEventTypeIcon(event.type)}
                      </div>
                      <h4 className="font-medium text-gray-900 group-hover:text-rose-600 transition-colors">
                        {event.title}
                      </h4>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityBadge(event.priority)}`}>
                        {event.priority}
                      </span>
                    </div>
                    
                    {event.vendor && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                        <User className="h-4 w-4" />
                        <span>{event.vendor.name}</span>
                        <span className="text-gray-400">•</span>
                        <span className="capitalize">{event.vendor.category}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(event.date)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{event.time}</span>
                      </div>
                      {event.location && (
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-4 w-4" />
                          <span className="truncate max-w-32">{event.location}</span>
                        </div>
                      )}
                    </div>
                    
                    {event.description && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                        {event.description}
                      </p>
                    )}
                  </div>
                  
                  <div className="text-right ml-4">
                    <div className="text-sm font-medium text-rose-600">
                      {getRelativeTime(event.date, event.time)}
                    </div>
                    {event.isGoogleEvent && (
                      <div className="mt-1 text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
                        Google Calendar
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Quick Actions */}
                {event.vendor && (
                  <div className="flex items-center space-x-2 mt-3 pt-3 border-t border-gray-100">
                    {event.vendor.contact && (
                      <button className="flex items-center space-x-1 px-3 py-1 text-xs text-sage-600 bg-sage-50 rounded-full hover:bg-sage-100 transition-colors">
                        <Phone className="h-3 w-3" />
                        <span>Call</span>
                      </button>
                    )}
                    {event.location === 'Virtual Meeting' && (
                      <button className="flex items-center space-x-1 px-3 py-1 text-xs text-gray-600 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors">
                        <Video className="h-3 w-3" />
                        <span>Join</span>
                      </button>
                    )}
                    <button className="flex items-center space-x-1 px-3 py-1 text-xs text-gray-600 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors">
                      <Bell className="h-3 w-3" />
                      <span>Remind</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {getUpcomingEvents().length === 0 && (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h4 className="text-sm font-medium text-gray-900 mb-2">No upcoming events</h4>
            <p className="text-sm text-gray-600">Your wedding timeline will appear here</p>
            {onAddEvent && (
              <button
                onClick={onAddEvent}
                className="mt-4 text-rose-600 hover:text-rose-700 text-sm font-medium"
              >
                Add your first event
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
