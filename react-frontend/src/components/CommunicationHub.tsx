
import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Mail, 
  MessageCircle, 
  Phone, 
  Send, 
  Users, 
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Settings
} from 'lucide-react';
import { GoogleAPIService } from '../services/google_api_service';
import { WhatsAppService } from '../services/whatsapp_service';
import { SANDBOX_CONFIG } from '../config/google_config';

interface CommunicationRequest {
  id: string;
  type: 'vendor_inquiry' | 'guest_invitation' | 'rsvp_reminder';
  recipient: {
    name: string;
    email?: string;
    phone?: string;
  };
  status: 'pending' | 'sent' | 'failed';
  method: 'email' | 'whatsapp' | 'both';
  timestamp: string;
  message?: string;
}

const CommunicationHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'send' | 'history' | 'calendar'>('send');
  const [communicationRequests, setCommunicationRequests] = useState<CommunicationRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [sandboxMode, setSandboxMode] = useState(SANDBOX_CONFIG.SANDBOX_MODE);
  
  // Form states
  const [selectedType, setSelectedType] = useState<'vendor_inquiry' | 'guest_invitation' | 'rsvp_reminder'>('vendor_inquiry');
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState(SANDBOX_CONFIG.TEST_EMAIL);
  const [recipientPhone, setRecipientPhone] = useState(SANDBOX_CONFIG.TEST_PHONE);
  const [communicationMethod, setCommunicationMethod] = useState<'email' | 'whatsapp' | 'both'>('both');
  const [customMessage, setCustomMessage] = useState('');

  // Wedding details for context
  const [weddingDetails] = useState({
    coupleNames: 'John & Jane Doe',
    date: '2024-12-15',
    time: '6:00 PM',
    venue: 'Grand Ballroom, City Hotel',
    location: 'Mumbai, India',
    guestCount: '150',
    contactNumber: SANDBOX_CONFIG.TEST_PHONE,
    category: 'Photography'
  });

  useEffect(() => {
    // Load communication history from localStorage
    const savedRequests = localStorage.getItem('communicationHistory');
    if (savedRequests) {
      setCommunicationRequests(JSON.parse(savedRequests));
    }
  }, []);

  const saveCommunicationHistory = (requests: CommunicationRequest[]) => {
    setCommunicationRequests(requests);
    localStorage.setItem('communicationHistory', JSON.stringify(requests));
  };

  const handleSendCommunication = async () => {
    if (!recipientName || (!recipientEmail && !recipientPhone)) {
      alert('Please fill in recipient details');
      return;
    }

    setLoading(true);

    const newRequest: CommunicationRequest = {
      id: `comm_${Date.now()}`,
      type: selectedType,
      recipient: {
        name: recipientName,
        email: recipientEmail || undefined,
        phone: recipientPhone || undefined
      },
      status: 'pending',
      method: communicationMethod,
      timestamp: new Date().toISOString(),
      message: customMessage
    };

    const updatedRequests = [...communicationRequests, newRequest];
    saveCommunicationHistory(updatedRequests);

    try {
      let emailSuccess = false;
      let whatsappSuccess = false;

      // Send via Email (Gmail)
      if (communicationMethod === 'email' || communicationMethod === 'both') {
        if (recipientEmail) {
          try {
            const emailTemplate = {
              subject: getEmailSubject(selectedType),
              body: customMessage || generateEmailBody(selectedType, recipientName, weddingDetails),
              to: [recipientEmail]
            };

            if (sandboxMode) {
              console.log('🧪 SANDBOX - Email would be sent:', emailTemplate);
              emailSuccess = true;
            } else {
              const messageId = await GoogleAPIService.sendWeddingInvitation(emailTemplate);
              emailSuccess = !!messageId;
            }
          } catch (error) {
            console.error('Email send error:', error);
          }
        }
      }

      // Send via WhatsApp
      if (communicationMethod === 'whatsapp' || communicationMethod === 'both') {
        if (recipientPhone) {
          try {
            const formattedPhone = WhatsAppService.formatPhoneNumber(recipientPhone);
            let response;

            switch (selectedType) {
              case 'vendor_inquiry':
                response = await WhatsAppService.sendVendorInquiry(
                  formattedPhone, 
                  recipientName, 
                  weddingDetails
                );
                break;
              case 'guest_invitation':
                response = await WhatsAppService.sendGuestInvitation(
                  formattedPhone, 
                  recipientName, 
                  weddingDetails
                );
                break;
              case 'rsvp_reminder':
                response = await WhatsAppService.sendRSVPReminder(
                  formattedPhone, 
                  recipientName, 
                  weddingDetails
                );
                break;
            }

            whatsappSuccess = response?.success || false;
          } catch (error) {
            console.error('WhatsApp send error:', error);
          }
        }
      }

      // Update request status
      const finalStatus = (
        (communicationMethod === 'email' && emailSuccess) ||
        (communicationMethod === 'whatsapp' && whatsappSuccess) ||
        (communicationMethod === 'both' && (emailSuccess || whatsappSuccess))
      ) ? 'sent' : 'failed';

      const finalRequests = updatedRequests.map(req => 
        req.id === newRequest.id 
          ? { ...req, status: finalStatus as 'sent' | 'failed' }
          : req
      );

      saveCommunicationHistory(finalRequests);

      // Reset form
      setRecipientName('');
      setRecipientEmail(SANDBOX_CONFIG.TEST_EMAIL);
      setRecipientPhone(SANDBOX_CONFIG.TEST_PHONE);
      setCustomMessage('');

      alert(finalStatus === 'sent' ? 'Communication sent successfully!' : 'Communication failed. Check console for details.');

    } catch (error) {
      console.error('Communication error:', error);
      const errorRequests = updatedRequests.map(req => 
        req.id === newRequest.id 
          ? { ...req, status: 'failed' as const }
          : req
      );
      saveCommunicationHistory(errorRequests);
      alert('Communication failed. Check console for details.');
    }

    setLoading(false);
  };

  const handleCreateCalendarEvent = async () => {
    try {
      setLoading(true);
      
      if (sandboxMode) {
        console.log('🧪 SANDBOX - Calendar event would be created:', weddingDetails);
        alert('Sandbox Mode: Calendar event simulation logged to console');
        return;
      }

      const weddingEvent = {
        title: `Wedding: ${weddingDetails.coupleNames}`,
        description: `Wedding ceremony and celebration`,
        startDate: `${weddingDetails.date}T18:00:00`,
        endDate: `${weddingDetails.date}T23:00:00`,
        location: weddingDetails.venue,
        attendees: recipientEmail ? [recipientEmail] : [],
        eventType: 'ceremony' as const,
        reminders: {
          email: true,
          popup: true,
          minutes: 60
        }
      };

      const eventId = await GoogleAPIService.createWeddingEvent(weddingEvent);
      alert(`Calendar event created successfully! Event ID: ${eventId}`);

    } catch (error) {
      console.error('Calendar event error:', error);
      alert('Failed to create calendar event. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const getEmailSubject = (type: string) => {
    switch (type) {
      case 'vendor_inquiry':
        return `Wedding ${weddingDetails.category} Inquiry - ${weddingDetails.date}`;
      case 'guest_invitation':
        return `You're Invited! Wedding of ${weddingDetails.coupleNames}`;
      case 'rsvp_reminder':
        return `RSVP Reminder - ${weddingDetails.coupleNames} Wedding`;
      default:
        return 'Wedding Communication';
    }
  };

  const generateEmailBody = (type: string, name: string, details: any) => {
    switch (type) {
      case 'vendor_inquiry':
        return `Dear ${name},

We are planning our wedding and would like to inquire about your ${details.category} services.

Wedding Details:
• Date: ${details.date}
• Venue: ${details.venue}
• Guest Count: ${details.guestCount}
• Couple: ${details.coupleNames}

We would appreciate if you could share your availability, packages, and pricing.

Best regards,
${details.coupleNames}
Contact: ${details.contactNumber}`;

      case 'guest_invitation':
        return `Dear ${name},

You are cordially invited to celebrate the wedding of ${details.coupleNames}!

Details:
• Date: ${details.date}
• Time: ${details.time}
• Venue: ${details.venue}

Your presence would make our celebration complete.

Please RSVP at your earliest convenience.

With love,
${details.coupleNames}`;

      case 'rsvp_reminder':
        return `Dear ${name},

This is a friendly reminder to RSVP for the wedding of ${details.coupleNames}.

Wedding Date: ${details.date}
Venue: ${details.venue}

Please let us know if you'll be able to join us for this special celebration.

Thank you!
${details.coupleNames}`;

      default:
        return `Hello ${name},\n\nThis is a message regarding the wedding of ${details.coupleNames}.\n\nBest regards,\n${details.coupleNames}`;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'vendor_inquiry':
        return <Phone className="w-4 h-4" />;
      case 'guest_invitation':
        return <Mail className="w-4 h-4" />;
      case 'rsvp_reminder':
        return <Users className="w-4 h-4" />;
      default:
        return <MessageCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-green-600 to-blue-700 p-2 rounded-lg">
                <MessageCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Communication Hub</h1>
                <p className="text-sm text-gray-600">
                  {sandboxMode ? '🧪 Sandbox Mode - Safe Testing' : 'Live Communication System'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Settings className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {sandboxMode ? 'Testing Mode' : 'Live Mode'}
                </span>
              </div>
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
                onClick={() => setActiveTab('send')}
                className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                  activeTab === 'send'
                    ? 'bg-gradient-to-r from-green-600 to-blue-700 text-white'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Send className="w-5 h-5" />
                Send Communication
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                  activeTab === 'history'
                    ? 'bg-gradient-to-r from-green-600 to-blue-700 text-white'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Clock className="w-5 h-5" />
                History ({communicationRequests.length})
              </button>
              <button
                onClick={() => setActiveTab('calendar')}
                className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                  activeTab === 'calendar'
                    ? 'bg-gradient-to-r from-green-600 to-blue-700 text-white'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Calendar className="w-5 h-5" />
                Vendor Communication
              </button>
            </div>
          </div>

          {/* Send Communication Tab */}
          {activeTab === 'send' && (
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Send Communication</h2>
              
              {sandboxMode && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                    <span className="font-medium text-yellow-800">Sandbox Mode Active</span>
                  </div>
                  <p className="text-yellow-700 mt-1">
                    Communications will be simulated and logged to console. No actual messages will be sent.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Communication Type
                    </label>
                    <select
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value as any)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-green-300 focus:ring-2 focus:ring-green-300/20"
                    >
                      <option value="vendor_inquiry">Vendor Inquiry</option>
                      <option value="guest_invitation">Guest Invitation</option>
                      <option value="rsvp_reminder">RSVP Reminder</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Recipient Name
                    </label>
                    <input
                      type="text"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder="Enter recipient name"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-green-300 focus:ring-2 focus:ring-green-300/20"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      placeholder="Enter email address"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-green-300 focus:ring-2 focus:ring-green-300/20"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={recipientPhone}
                      onChange={(e) => setRecipientPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-green-300 focus:ring-2 focus:ring-green-300/20"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Communication Method
                    </label>
                    <select
                      value={communicationMethod}
                      onChange={(e) => setCommunicationMethod(e.target.value as any)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-green-300 focus:ring-2 focus:ring-green-300/20"
                    >
                      <option value="both">Email + WhatsApp</option>
                      <option value="email">Email Only</option>
                      <option value="whatsapp">WhatsApp Only</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Custom Message (Optional)
                    </label>
                    <textarea
                      value={customMessage}
                      onChange={(e) => setCustomMessage(e.target.value)}
                      placeholder="Leave blank to use default template..."
                      rows={8}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-green-300 focus:ring-2 focus:ring-green-300/20 resize-none"
                    />
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-800 mb-2">Wedding Details Context</h3>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><strong>Couple:</strong> {weddingDetails.coupleNames}</p>
                      <p><strong>Date:</strong> {weddingDetails.date}</p>
                      <p><strong>Venue:</strong> {weddingDetails.venue}</p>
                      <p><strong>Guests:</strong> {weddingDetails.guestCount}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  onClick={handleSendCommunication}
                  disabled={loading || !recipientName || (!recipientEmail && !recipientPhone)}
                  className="bg-gradient-to-r from-green-600 to-blue-700 text-white px-8 py-3 rounded-xl font-semibold hover:from-green-700 hover:to-blue-800 transition-all duration-300 disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                  {loading ? 'Sending...' : 'Send Communication'}
                </button>
              </div>
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Communication History</h2>
              
              {communicationRequests.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No communications sent yet</p>
                  <p className="text-sm text-gray-500">Your communication history will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {communicationRequests.map((request) => (
                    <div key={request.id} className="border border-gray-200 rounded-xl p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <div className="p-2 bg-gray-100 rounded-lg">
                            {getTypeIcon(request.type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="font-semibold text-gray-800 capitalize">
                                {request.type.replace('_', ' ')}
                              </h3>
                              {getStatusIcon(request.status)}
                            </div>
                            <p className="text-gray-600 mb-2">
                              To: {request.recipient.name}
                            </p>
                            <div className="text-sm text-gray-500 space-y-1">
                              {request.recipient.email && (
                                <div className="flex items-center gap-1">
                                  <Mail className="w-4 h-4" />
                                  {request.recipient.email}
                                </div>
                              )}
                              {request.recipient.phone && (
                                <div className="flex items-center gap-1">
                                  <MessageCircle className="w-4 h-4" />
                                  {request.recipient.phone}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                            request.status === 'sent' 
                              ? 'bg-green-100 text-green-800' 
                              : request.status === 'failed'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {request.status}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(request.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Calendar Integration Tab */}
          {activeTab === 'calendar' && (
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Vendor Communication</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Create Wedding Timeline</h3>
                  <p className="text-gray-600 mb-4">
                    Create Google Calendar events for your wedding timeline automatically.
                  </p>
                  
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <h4 className="font-medium text-gray-800 mb-2">Events to Create:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Wedding Ceremony</li>
                      <li>• Wedding Reception</li>
                      <li>• Vendor Meetings</li>
                      <li>• Final Preparations</li>
                    </ul>
                  </div>

                  <button
                    onClick={handleCreateCalendarEvent}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-green-600 to-blue-700 text-white py-3 px-6 rounded-xl font-semibold hover:from-green-700 hover:to-blue-800 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Calendar className="w-5 h-5" />
                    )}
                    {loading ? 'Creating Events...' : 'Create Calendar Events'}
                  </button>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Wedding Details</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Couple Names</label>
                      <p className="text-gray-900">{weddingDetails.coupleNames}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Wedding Date</label>
                      <p className="text-gray-900">{weddingDetails.date}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Venue</label>
                      <p className="text-gray-900">{weddingDetails.venue}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Guest Count</label>
                      <p className="text-gray-900">{weddingDetails.guestCount}</p>
                    </div>
                  </div>

                  {sandboxMode && (
                    <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-sm text-yellow-700">
                        <strong>Sandbox Mode:</strong> Calendar events will be simulated and logged to console.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommunicationHub;
