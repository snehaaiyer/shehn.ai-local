
import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Mail, 
  MessageCircle, 
  Phone, 
  Send, 
  Plus, 
  Edit3, 
  Trash2, 
  Search, 
  Filter,
  Star,
  MapPin,
  DollarSign,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Copy
} from 'lucide-react';
import { ErrorBoundary } from './ErrorBoundary';
import VendorCommunicationService from '../services/vendor_communication_service';

interface Vendor {
  id: string;
  name: string;
  category: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  location: string;
  rating?: number;
  price?: string;
  status: 'contacted' | 'quoted' | 'booked' | 'pending';
  lastContact?: string;
  notes?: string;
}

interface CommunicationTemplate {
  id: string;
  type: 'email' | 'whatsapp';
  category: string;
  subject?: string;
  message: string;
  isDefault: boolean;
}

const ManageVendors: React.FC = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [showCommunicationModal, setShowCommunicationModal] = useState(false);
  const [communicationType, setCommunicationType] = useState<'email' | 'whatsapp'>('email');
  const [templates, setTemplates] = useState<CommunicationTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [customMessage, setCustomMessage] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAddVendor, setShowAddVendor] = useState(false);

  // Mock wedding details - in real app, get from store/context
  const weddingDetails = {
    date: '2024-12-15',
    location: 'Mumbai',
    guestCount: 300,
    coupleNames: 'John & Jane',
    contactNumber: '+91 98765 43210',
    contactEmail: 'john.jane@email.com'
  };

  useEffect(() => {
    loadVendors();
    loadTemplates();
  }, []);

  useEffect(() => {
    filterVendors();
  }, [vendors, searchTerm, categoryFilter, statusFilter]);

  const loadVendors = async () => {
    try {
      setLoading(true);
      // Mock data - replace with actual API call
      const mockVendors: Vendor[] = [
        {
          id: '1',
          name: 'Royal Garden Palace',
          category: 'venues',
          email: 'info@royalgardenpalace.com',
          phone: '+91 98765 43210',
          whatsapp: '+91 98765 43210',
          location: 'Mumbai',
          rating: 4.8,
          price: '₹2,00,000 - ₹5,00,000',
          status: 'contacted',
          lastContact: '2024-01-15',
          notes: 'Follow up on availability for December dates'
        },
        {
          id: '2',
          name: 'Elegant Catering Services',
          category: 'catering',
          email: 'bookings@elegantcatering.com',
          phone: '+91 99887 76543',
          whatsapp: '+91 99887 76543',
          location: 'Mumbai',
          rating: 4.6,
          price: '₹800 - ₹1,200 per plate',
          status: 'quoted',
          lastContact: '2024-01-12',
          notes: 'Received quote - need to finalize menu'
        },
        {
          id: '3',
          name: 'Picture Perfect Photography',
          category: 'photography',
          email: 'contact@pictureperfect.com',
          phone: '+91 88776 65432',
          whatsapp: '+91 88776 65432',
          location: 'Mumbai',
          rating: 4.9,
          price: '₹80,000 - ₹1,50,000',
          status: 'pending',
          lastContact: undefined,
          notes: 'Found through recommendations - need to contact'
        }
      ];
      setVendors(mockVendors);
    } catch (error) {
      console.error('Error loading vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = () => {
    const mockTemplates: CommunicationTemplate[] = [
      {
        id: '1',
        type: 'email',
        category: 'venues',
        subject: 'Wedding Venue Inquiry - {weddingDate}',
        message: `Dear {vendorName},

I hope this email finds you well. We are planning our wedding for {weddingDate} and are interested in your venue services.

Event Details:
• Wedding Date: {weddingDate}
• Guest Count: {guestCount}
• Location Preference: {location}

We would appreciate information about:
• Availability for our date
• Venue packages and pricing
• Included amenities and services
• Decoration policies
• Catering arrangements

Thank you for your time. Looking forward to hearing from you.

Best regards,
{coupleNames}
{contactEmail}
{contactNumber}`,
        isDefault: true
      },
      {
        id: '2',
        type: 'whatsapp',
        category: 'venues',
        message: `Hi {vendorName}! 💍

We're planning our wedding for {weddingDate} with {guestCount} guests in {location}.

Could you please share:
• Availability for our date
• Package details & pricing
• Portfolio/photos

Looking forward to your response!

{coupleNames}`,
        isDefault: true
      },
      {
        id: '3',
        type: 'email',
        category: 'catering',
        subject: 'Wedding Catering Services Inquiry',
        message: `Dear {vendorName},

Greetings! We are planning our wedding celebration and would like to inquire about your catering services.

Wedding Details:
• Date: {weddingDate}
• Guest Count: {guestCount}
• Venue: {location}

Please provide information about:
• Menu options and packages
• Pricing per plate
• Service style options
• Dietary accommodation
• Tasting session availability

Thank you!

Best regards,
{coupleNames}`,
        isDefault: true
      }
    ];
    setTemplates(mockTemplates);
  };

  const filterVendors = () => {
    let filtered = vendors;

    if (searchTerm) {
      filtered = filtered.filter(vendor =>
        vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(vendor => vendor.category === categoryFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(vendor => vendor.status === statusFilter);
    }

    setFilteredVendors(filtered);
  };

  const handleCommunicate = (vendor: Vendor, type: 'email' | 'whatsapp') => {
    setSelectedVendor(vendor);
    setCommunicationType(type);
    
    // Find default template for this category and communication type
    const defaultTemplate = templates.find(t => 
      t.category === vendor.category && t.type === type && t.isDefault
    );
    
    if (defaultTemplate) {
      setSelectedTemplate(defaultTemplate.id);
      setCustomMessage(formatMessage(defaultTemplate.message, vendor));
      setCustomSubject(defaultTemplate.subject ? formatMessage(defaultTemplate.subject, vendor) : '');
    }
    
    setShowCommunicationModal(true);
  };

  const formatMessage = (template: string, vendor: Vendor) => {
    return template
      .replace(/{vendorName}/g, vendor.name)
      .replace(/{weddingDate}/g, weddingDetails.date)
      .replace(/{guestCount}/g, weddingDetails.guestCount.toString())
      .replace(/{location}/g, weddingDetails.location)
      .replace(/{coupleNames}/g, weddingDetails.coupleNames)
      .replace(/{contactEmail}/g, weddingDetails.contactEmail)
      .replace(/{contactNumber}/g, weddingDetails.contactNumber);
  };

  const sendCommunication = async () => {
    if (!selectedVendor) return;

    try {
      setLoading(true);

      const payload = {
        vendorInfo: {
          name: selectedVendor.name,
          email: selectedVendor.email,
          phone: selectedVendor.whatsapp || selectedVendor.phone,
          category: selectedVendor.category
        },
        weddingInfo: weddingDetails,
        message: customMessage,
        subject: customSubject
      };

      let result;
      if (communicationType === 'email') {
        result = await VendorCommunicationService.sendEmail(payload);
      } else {
        result = await VendorCommunicationService.sendWhatsApp(payload);
      }

      if (result.success) {
        // Update vendor status
        setVendors(prev => prev.map(v => 
          v.id === selectedVendor.id 
            ? { ...v, status: 'contacted', lastContact: new Date().toISOString().split('T')[0] }
            : v
        ));
        
        setShowCommunicationModal(false);
        alert(`${communicationType === 'email' ? 'Email' : 'WhatsApp message'} sent successfully!`);
      } else {
        alert(`Failed to send ${communicationType}: ${result.error}`);
      }
    } catch (error) {
      console.error('Error sending communication:', error);
      alert(`Error sending ${communicationType}`);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'booked': return 'bg-green-100 text-green-800';
      case 'quoted': return 'bg-blue-100 text-blue-800';
      case 'contacted': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'booked': return <CheckCircle className="w-4 h-4" />;
      case 'quoted': return <DollarSign className="w-4 h-4" />;
      case 'contacted': return <Clock className="w-4 h-4" />;
      case 'pending': return <AlertCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'venues': return '🏛️';
      case 'catering': return '🍽️';
      case 'photography': return '📸';
      case 'decoration': return '🎨';
      case 'makeup': return '💄';
      default: return '🎉';
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <div className="bg-gradient-to-r from-pink-600 to-purple-700 p-2 rounded-lg">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-800">Manage Vendors</h1>
                  <p className="text-sm text-gray-600">
                    Communication hub for your wedding vendors
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddVendor(true)}
                className="bg-gradient-to-r from-pink-600 to-purple-700 text-white px-4 py-2 rounded-lg hover:from-pink-700 hover:to-purple-800 transition-all duration-300 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Vendor
              </button>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-6 py-8">
          <div className="max-w-7xl mx-auto">
            {/* Filters */}
            <div className="bg-white rounded-2xl p-6 mb-8 shadow-lg">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search vendors..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:border-pink-300 focus:ring-2 focus:ring-pink-300/20 transition-all duration-300"
                    />
                  </div>
                </div>
                <div className="flex gap-4">
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-200 rounded-lg focus:border-pink-300 focus:ring-2 focus:ring-pink-300/20 transition-all duration-300"
                  >
                    <option value="all">All Categories</option>
                    <option value="venues">Venues</option>
                    <option value="catering">Catering</option>
                    <option value="photography">Photography</option>
                    <option value="decoration">Decoration</option>
                    <option value="makeup">Makeup</option>
                  </select>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-200 rounded-lg focus:border-pink-300 focus:ring-2 focus:ring-pink-300/20 transition-all duration-300"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="contacted">Contacted</option>
                    <option value="quoted">Quoted</option>
                    <option value="booked">Booked</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Vendors Grid */}
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading vendors...</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredVendors.map((vendor) => (
                  <div key={vendor.id} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">{getCategoryIcon(vendor.category)}</div>
                        <div>
                          <h3 className="font-semibold text-gray-800">{vendor.name}</h3>
                          <p className="text-sm text-gray-600 capitalize">{vendor.category}</p>
                        </div>
                      </div>
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(vendor.status)}`}>
                        {getStatusIcon(vendor.status)}
                        <span className="capitalize">{vendor.status}</span>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mr-2" />
                        {vendor.location}
                      </div>
                      {vendor.rating && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Star className="w-4 h-4 mr-2 fill-yellow-400 text-yellow-400" />
                          {vendor.rating}/5.0
                        </div>
                      )}
                      {vendor.price && (
                        <div className="flex items-center text-sm text-gray-600">
                          <DollarSign className="w-4 h-4 mr-2" />
                          {vendor.price}
                        </div>
                      )}
                      {vendor.lastContact && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="w-4 h-4 mr-2" />
                          Last contact: {vendor.lastContact}
                        </div>
                      )}
                    </div>

                    {vendor.notes && (
                      <div className="bg-gray-50 rounded-lg p-3 mb-4">
                        <p className="text-xs text-gray-600">{vendor.notes}</p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      {vendor.email && (
                        <button
                          onClick={() => handleCommunicate(vendor, 'email')}
                          className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                        >
                          <Mail className="w-4 h-4" />
                          Email
                        </button>
                      )}
                      {vendor.whatsapp && (
                        <button
                          onClick={() => handleCommunicate(vendor, 'whatsapp')}
                          className="flex-1 bg-green-100 hover:bg-green-200 text-green-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                        >
                          <MessageCircle className="w-4 h-4" />
                          WhatsApp
                        </button>
                      )}
                      {vendor.phone && (
                        <button
                          onClick={() => window.open(`tel:${vendor.phone}`)}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          <Phone className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Communication Modal */}
        {showCommunicationModal && selectedVendor && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">
                  {communicationType === 'email' ? 'Send Email' : 'Send WhatsApp Message'}
                </h2>
                <button
                  onClick={() => setShowCommunicationModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div className="mb-4">
                <h3 className="font-semibold text-gray-800 mb-2">
                  {getCategoryIcon(selectedVendor.category)} {selectedVendor.name}
                </h3>
                <p className="text-sm text-gray-600">
                  {communicationType === 'email' ? selectedVendor.email : selectedVendor.whatsapp}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Template
                  </label>
                  <select
                    value={selectedTemplate}
                    onChange={(e) => {
                      setSelectedTemplate(e.target.value);
                      const template = templates.find(t => t.id === e.target.value);
                      if (template) {
                        setCustomMessage(formatMessage(template.message, selectedVendor));
                        setCustomSubject(template.subject ? formatMessage(template.subject, selectedVendor) : '');
                      }
                    }}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-pink-300 focus:ring-2 focus:ring-pink-300/20 transition-all duration-300"
                  >
                    <option value="">Custom Message</option>
                    {templates
                      .filter(t => t.type === communicationType && t.category === selectedVendor.category)
                      .map(template => (
                        <option key={template.id} value={template.id}>
                          Default {template.category} template
                        </option>
                      ))
                    }
                  </select>
                </div>

                {communicationType === 'email' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subject
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={customSubject}
                        onChange={(e) => setCustomSubject(e.target.value)}
                        className="w-full px-4 py-2 pr-10 border border-gray-200 rounded-lg focus:border-pink-300 focus:ring-2 focus:ring-pink-300/20 transition-all duration-300"
                        placeholder="Email subject"
                      />
                      <button
                        onClick={() => copyToClipboard(customSubject)}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <div className="relative">
                    <textarea
                      value={customMessage}
                      onChange={(e) => setCustomMessage(e.target.value)}
                      rows={12}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-pink-300 focus:ring-2 focus:ring-pink-300/20 transition-all duration-300 resize-none"
                      placeholder={`Enter your ${communicationType} message...`}
                    />
                    <button
                      onClick={() => copyToClipboard(customMessage)}
                      className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4 mt-6">
                <button
                  onClick={() => setShowCommunicationModal(false)}
                  className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={sendCommunication}
                  disabled={loading || !customMessage}
                  className="bg-gradient-to-r from-pink-600 to-purple-700 text-white px-6 py-2 rounded-lg hover:from-pink-700 hover:to-purple-800 transition-all duration-300 disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Send {communicationType === 'email' ? 'Email' : 'Message'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default ManageVendors;
