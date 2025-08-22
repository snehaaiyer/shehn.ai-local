
import React, { useState, useEffect } from 'react';
import { 
  MessageCircle, 
  Mail, 
  Phone, 
  Calendar,
  FileText,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertCircle,
  Send,
  Plus,
  Filter,
  Search,
  Download,
  Edit,
  Trash2,
  ArrowRight,
  DollarSign,
  Users,
  MapPin,
  Star,
  Heart,
  Eye
} from 'lucide-react';
import { VendorCommunicationService } from '../services/vendor_communication_service';

interface VendorCommunication {
  id: string;
  vendorId: string;
  vendorName: string;
  vendorCategory: string;
  vendorLocation: string;
  vendorPhone?: string;
  vendorEmail?: string;
  vendorWebsite?: string;
  
  // Communication Status
  status: 'interested' | 'contacted' | 'responded' | 'quoted' | 'negotiating' | 'booked' | 'declined';
  priority: 'high' | 'medium' | 'low';
  
  // Communication History
  messages: CommunicationMessage[];
  
  // Quotation Details
  quotation?: {
    amount: number;
    currency: string;
    description: string;
    validUntil: string;
    inclusions: string[];
    exclusions: string[];
    paymentTerms: string;
    advances: { percentage: number; amount: number }[];
  };
  
  // Important Dates
  contactDate: string;
  responseDate?: string;
  quotationDate?: string;
  followUpDate?: string;
  bookingDate?: string;
  serviceDate?: string;
  
  // Analytics
  responseTime?: number; // in hours
  negotiationCount: number;
  priceReductions: number;
  
  // Notes & Tags
  notes: string;
  tags: string[];
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}

interface CommunicationMessage {
  id: string;
  type: 'email' | 'whatsapp' | 'phone' | 'meeting' | 'system';
  direction: 'sent' | 'received';
  subject?: string;
  content: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read' | 'replied' | 'failed';
  attachments?: string[];
}

interface QuotationAnalysis {
  averagePrice: number;
  priceRange: { min: number; max: number };
  bestValue: string;
  recommendations: string[];
  marketInsights: string[];
}

const VendorCommunication: React.FC = () => {
  const [communications, setCommunications] = useState<VendorCommunication[]>([]);
  const [filteredCommunications, setFilteredCommunications] = useState<VendorCommunication[]>([]);
  const [selectedCommunication, setSelectedCommunication] = useState<VendorCommunication | null>(null);
  
  // Filters & Search
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // UI States
  const [loading, setLoading] = useState(false);
  const [showNewCommunication, setShowNewCommunication] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'messages' | 'quotations' | 'analytics'>('overview');
  
  // Analytics
  const [quotationAnalysis, setQuotationAnalysis] = useState<QuotationAnalysis | null>(null);

  useEffect(() => {
    loadCommunications();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [communications, statusFilter, categoryFilter, priorityFilter, searchTerm]);

  const loadCommunications = async () => {
    try {
      setLoading(true);
      
      // Load from localStorage for now (in real app, would be from API)
      const savedCommunications = localStorage.getItem('vendorCommunications');
      if (savedCommunications) {
        const data = JSON.parse(savedCommunications);
        setCommunications(data);
      } else {
        // Initialize with sample data
        const sampleData = generateSampleCommunications();
        setCommunications(sampleData);
        localStorage.setItem('vendorCommunications', JSON.stringify(sampleData));
      }
      
    } catch (error) {
      console.error('Error loading communications:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...communications];

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(comm => comm.status === statusFilter);
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(comm => comm.vendorCategory === categoryFilter);
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(comm => comm.priority === priorityFilter);
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(comm => 
        comm.vendorName.toLowerCase().includes(term) ||
        comm.vendorCategory.toLowerCase().includes(term) ||
        comm.vendorLocation.toLowerCase().includes(term) ||
        comm.notes.toLowerCase().includes(term)
      );
    }

    setFilteredCommunications(filtered);
  };

  const generateSampleCommunications = (): VendorCommunication[] => {
    return [
      {
        id: 'comm-1',
        vendorId: 'vendor-1',
        vendorName: 'Royal Garden Palace',
        vendorCategory: 'venues',
        vendorLocation: 'Mumbai, Maharashtra',
        vendorPhone: '+91 98765 43210',
        vendorEmail: 'info@royalgardenpalace.com',
        vendorWebsite: 'www.royalgardenpalace.com',
        status: 'quoted',
        priority: 'high',
        messages: [
          {
            id: 'msg-1',
            type: 'email',
            direction: 'sent',
            subject: 'Wedding Venue Inquiry - December 2024',
            content: 'Dear Royal Garden Palace team, we are interested in your venue for our wedding...',
            timestamp: '2024-01-15T10:00:00Z',
            status: 'delivered'
          },
          {
            id: 'msg-2',
            type: 'email',
            direction: 'received',
            subject: 'Re: Wedding Venue Inquiry - December 2024',
            content: 'Thank you for your inquiry. We have availability for your date...',
            timestamp: '2024-01-15T14:30:00Z',
            status: 'read'
          }
        ],
        quotation: {
          amount: 250000,
          currency: 'INR',
          description: 'Complete venue package for 300 guests',
          validUntil: '2024-02-15',
          inclusions: ['Venue rental', 'Basic lighting', 'Sound system', 'Parking'],
          exclusions: ['Catering', 'Decoration', 'Photography'],
          paymentTerms: '30% advance, 50% 30 days before event, 20% on event day',
          advances: [
            { percentage: 30, amount: 75000 },
            { percentage: 50, amount: 125000 },
            { percentage: 20, amount: 50000 }
          ]
        },
        contactDate: '2024-01-15T10:00:00Z',
        responseDate: '2024-01-15T14:30:00Z',
        quotationDate: '2024-01-16T11:00:00Z',
        followUpDate: '2024-01-25T10:00:00Z',
        responseTime: 4.5,
        negotiationCount: 1,
        priceReductions: 10000,
        notes: 'Beautiful venue with garden area. Good for outdoor ceremony.',
        tags: ['premium', 'garden', 'recommended'],
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-16T11:00:00Z'
      },
      {
        id: 'comm-2',
        vendorId: 'vendor-2',
        vendorName: 'Elite Photography Studio',
        vendorCategory: 'photography',
        vendorLocation: 'Mumbai, Maharashtra',
        vendorPhone: '+91 87654 32109',
        vendorEmail: 'booking@elitephotography.com',
        status: 'negotiating',
        priority: 'high',
        messages: [
          {
            id: 'msg-3',
            type: 'whatsapp',
            direction: 'sent',
            content: 'Hi! Interested in photography services for December wedding. Please share packages.',
            timestamp: '2024-01-16T09:00:00Z',
            status: 'read'
          }
        ],
        quotation: {
          amount: 150000,
          currency: 'INR',
          description: 'Premium wedding photography package',
          validUntil: '2024-02-10',
          inclusions: ['Full day coverage', 'Pre-wedding shoot', '500+ edited photos', 'Photo album'],
          exclusions: ['Videography', 'Drone shots', 'Additional events'],
          paymentTerms: '40% advance, 60% on delivery',
          advances: [
            { percentage: 40, amount: 60000 },
            { percentage: 60, amount: 90000 }
          ]
        },
        contactDate: '2024-01-16T09:00:00Z',
        responseDate: '2024-01-16T11:30:00Z',
        quotationDate: '2024-01-16T16:00:00Z',
        responseTime: 2.5,
        negotiationCount: 2,
        priceReductions: 25000,
        notes: 'Great portfolio, professional team. Negotiating on videography inclusion.',
        tags: ['premium', 'experienced', 'negotiable'],
        createdAt: '2024-01-16T09:00:00Z',
        updatedAt: '2024-01-17T15:00:00Z'
      }
    ];
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      interested: <Heart className="w-4 h-4 text-pink-500" />,
      contacted: <Send className="w-4 h-4 text-blue-500" />,
      responded: <MessageCircle className="w-4 h-4 text-green-500" />,
      quoted: <FileText className="w-4 h-4 text-orange-500" />,
      negotiating: <TrendingUp className="w-4 h-4 text-purple-500" />,
      booked: <CheckCircle className="w-4 h-4 text-green-600" />,
      declined: <AlertCircle className="w-4 h-4 text-red-500" />
    };
    return icons[status as keyof typeof icons] || <Clock className="w-4 h-4 text-gray-500" />;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      interested: 'bg-pink-100 text-pink-800',
      contacted: 'bg-blue-100 text-blue-800',
      responded: 'bg-green-100 text-green-800',
      quoted: 'bg-orange-100 text-orange-800',
      negotiating: 'bg-purple-100 text-purple-800',
      booked: 'bg-green-100 text-green-800',
      declined: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const generateQuotationAnalysis = () => {
    const quotations = communications
      .filter(comm => comm.quotation)
      .map(comm => comm.quotation!);

    if (quotations.length === 0) return null;

    const amounts = quotations.map(q => q.amount);
    const averagePrice = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
    const minPrice = Math.min(...amounts);
    const maxPrice = Math.max(...amounts);

    return {
      averagePrice,
      priceRange: { min: minPrice, max: maxPrice },
      bestValue: communications.find(comm => comm.quotation?.amount === minPrice)?.vendorName || '',
      recommendations: [
        'Consider bundling services for better rates',
        'Book early for seasonal discounts',
        'Compare inclusions carefully'
      ],
      marketInsights: [
        `Average market rate: ₹${averagePrice.toLocaleString()}`,
        `Price range: ₹${minPrice.toLocaleString()} - ₹${maxPrice.toLocaleString()}`,
        'Peak season rates apply for December weddings'
      ]
    };
  };

  useEffect(() => {
    setQuotationAnalysis(generateQuotationAnalysis());
  }, [communications]);

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
                <h1 className="text-xl font-bold text-gray-800">Vendor Communication</h1>
                <p className="text-sm text-gray-600">Manage all vendor communications in one place</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowNewCommunication(true)}
                className="bg-gradient-to-r from-green-600 to-blue-700 text-white px-4 py-2 rounded-lg font-medium hover:from-green-700 hover:to-blue-800 transition-all duration-300 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Vendor
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Vendors</p>
                  <p className="text-2xl font-bold text-gray-900">{communications.length}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Quotations Received</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {communications.filter(c => c.quotation).length}
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <FileText className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Quote Value</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ₹{communications
                      .filter(c => c.quotation)
                      .reduce((sum, c) => sum + (c.quotation?.amount || 0), 0)
                      .toLocaleString()}
                  </p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-lg">
                  <DollarSign className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Vendors Booked</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {communications.filter(c => c.status === 'booked').length}
                  </p>
                </div>
                <div className="bg-purple-100 p-3 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl p-6 shadow-lg mb-8">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search vendors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:border-green-300 focus:ring-2 focus:ring-green-300/20"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:border-green-300 focus:ring-2 focus:ring-green-300/20"
              >
                <option value="all">All Statuses</option>
                <option value="interested">Interested</option>
                <option value="contacted">Contacted</option>
                <option value="responded">Responded</option>
                <option value="quoted">Quoted</option>
                <option value="negotiating">Negotiating</option>
                <option value="booked">Booked</option>
                <option value="declined">Declined</option>
              </select>

              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:border-green-300 focus:ring-2 focus:ring-green-300/20"
              >
                <option value="all">All Categories</option>
                <option value="venues">Venues</option>
                <option value="photography">Photography</option>
                <option value="catering">Catering</option>
                <option value="decoration">Decoration</option>
                <option value="beauty">Beauty</option>
                <option value="entertainment">Entertainment</option>
              </select>

              {/* Priority Filter */}
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:border-green-300 focus:ring-2 focus:ring-green-300/20"
              >
                <option value="all">All Priorities</option>
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>

              {/* Export */}
              <button className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Vendor List */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-lg">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-800">
                    Vendor Communications ({filteredCommunications.length})
                  </h2>
                </div>
                
                <div className="divide-y divide-gray-100">
                  {filteredCommunications.map((communication) => (
                    <div
                      key={communication.id}
                      className={`p-6 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedCommunication?.id === communication.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                      }`}
                      onClick={() => setSelectedCommunication(communication)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900">{communication.vendorName}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(communication.status)}`}>
                              {communication.status}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(communication.priority)}`}>
                              {communication.priority}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {communication.vendorCategory}
                            </span>
                            <span>{communication.vendorLocation}</span>
                          </div>
                          
                          {communication.quotation && (
                            <div className="flex items-center gap-4 text-sm mb-2">
                              <span className="font-medium text-green-600">
                                ₹{communication.quotation.amount.toLocaleString()}
                              </span>
                              <span className="text-gray-500">
                                Valid until {new Date(communication.quotation.validUntil).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                          
                          {communication.notes && (
                            <p className="text-sm text-gray-600 line-clamp-2">{communication.notes}</p>
                          )}
                          
                          <div className="flex items-center gap-2 mt-3">
                            {communication.tags.map((tag) => (
                              <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-2">
                          {getStatusIcon(communication.status)}
                          <div className="flex gap-1">
                            {communication.vendorPhone && (
                              <div className="p-1 bg-green-100 rounded">
                                <Phone className="w-3 h-3 text-green-600" />
                              </div>
                            )}
                            {communication.vendorEmail && (
                              <div className="p-1 bg-blue-100 rounded">
                                <Mail className="w-3 h-3 text-blue-600" />
                              </div>
                            )}
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(communication.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Vendor Details */}
            <div className="lg:col-span-1">
              {selectedCommunication ? (
                <div className="bg-white rounded-2xl shadow-lg">
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-gray-800">
                        {selectedCommunication.vendorName}
                      </h2>
                      <div className="flex gap-2">
                        <button className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200">
                          <Edit className="w-4 h-4 text-gray-600" />
                        </button>
                        <button className="p-2 bg-red-100 rounded-lg hover:bg-red-200">
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Tab Navigation */}
                  <div className="border-b border-gray-100">
                    <div className="flex">
                      {['overview', 'messages', 'quotations', 'analytics'].map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setActiveTab(tab as any)}
                          className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === tab
                              ? 'border-blue-500 text-blue-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-6">
                    {activeTab === 'overview' && (
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-medium text-gray-900 mb-2">Contact Information</h3>
                          <div className="space-y-2 text-sm text-gray-600">
                            {selectedCommunication.vendorPhone && (
                              <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4" />
                                {selectedCommunication.vendorPhone}
                              </div>
                            )}
                            {selectedCommunication.vendorEmail && (
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                {selectedCommunication.vendorEmail}
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              {selectedCommunication.vendorLocation}
                            </div>
                          </div>
                        </div>

                        <div>
                          <h3 className="font-medium text-gray-900 mb-2">Status & Priority</h3>
                          <div className="flex gap-2">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedCommunication.status)}`}>
                              {selectedCommunication.status}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(selectedCommunication.priority)}`}>
                              {selectedCommunication.priority} priority
                            </span>
                          </div>
                        </div>

                        {selectedCommunication.quotation && (
                          <div>
                            <h3 className="font-medium text-gray-900 mb-2">Latest Quotation</h3>
                            <div className="bg-green-50 rounded-lg p-4">
                              <div className="text-2xl font-bold text-green-800 mb-1">
                                ₹{selectedCommunication.quotation.amount.toLocaleString()}
                              </div>
                              <div className="text-sm text-green-600 mb-2">
                                {selectedCommunication.quotation.description}
                              </div>
                              <div className="text-xs text-green-500">
                                Valid until {new Date(selectedCommunication.quotation.validUntil).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        )}

                        {selectedCommunication.notes && (
                          <div>
                            <h3 className="font-medium text-gray-900 mb-2">Notes</h3>
                            <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                              {selectedCommunication.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'messages' && (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="font-medium text-gray-900">Communication History</h3>
                          <button className="text-blue-600 text-sm font-medium">
                            Send Message
                          </button>
                        </div>
                        
                        <div className="space-y-3">
                          {selectedCommunication.messages.map((message) => (
                            <div
                              key={message.id}
                              className={`p-3 rounded-lg ${
                                message.direction === 'sent'
                                  ? 'bg-blue-50 ml-8'
                                  : 'bg-gray-50 mr-8'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  {message.type === 'email' ? (
                                    <Mail className="w-4 h-4 text-blue-500" />
                                  ) : (
                                    <MessageCircle className="w-4 h-4 text-green-500" />
                                  )}
                                  <span className="text-sm font-medium">
                                    {message.direction === 'sent' ? 'You' : selectedCommunication.vendorName}
                                  </span>
                                </div>
                                <span className="text-xs text-gray-500">
                                  {new Date(message.timestamp).toLocaleString()}
                                </span>
                              </div>
                              
                              {message.subject && (
                                <div className="text-sm font-medium text-gray-900 mb-1">
                                  {message.subject}
                                </div>
                              )}
                              
                              <div className="text-sm text-gray-700">
                                {message.content}
                              </div>
                              
                              <div className="flex items-center gap-2 mt-2">
                                <span className={`text-xs px-2 py-1 rounded ${
                                  message.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                  message.status === 'read' ? 'bg-blue-100 text-blue-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {message.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {activeTab === 'quotations' && selectedCommunication.quotation && (
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-medium text-gray-900 mb-3">Quotation Details</h3>
                          
                          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 mb-4">
                            <div className="text-2xl font-bold text-gray-900 mb-1">
                              ₹{selectedCommunication.quotation.amount.toLocaleString()}
                            </div>
                            <div className="text-sm text-gray-600">
                              {selectedCommunication.quotation.description}
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <h4 className="text-sm font-medium text-gray-900 mb-2">Inclusions</h4>
                              <ul className="text-sm text-gray-600 space-y-1">
                                {selectedCommunication.quotation.inclusions.map((item, index) => (
                                  <li key={index} className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div>
                              <h4 className="text-sm font-medium text-gray-900 mb-2">Exclusions</h4>
                              <ul className="text-sm text-gray-600 space-y-1">
                                {selectedCommunication.quotation.exclusions.map((item, index) => (
                                  <li key={index} className="flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 text-red-500" />
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div>
                              <h4 className="text-sm font-medium text-gray-900 mb-2">Payment Terms</h4>
                              <p className="text-sm text-gray-600 mb-2">
                                {selectedCommunication.quotation.paymentTerms}
                              </p>
                              
                              <div className="space-y-2">
                                {selectedCommunication.quotation.advances.map((advance, index) => (
                                  <div key={index} className="flex justify-between items-center bg-gray-50 rounded p-2">
                                    <span className="text-sm text-gray-600">
                                      {advance.percentage}% Payment
                                    </span>
                                    <span className="text-sm font-medium text-gray-900">
                                      ₹{advance.amount.toLocaleString()}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="flex gap-2 pt-4">
                              <button className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors">
                                Accept Quote
                              </button>
                              <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                                Negotiate
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'analytics' && (
                      <div className="space-y-4">
                        <h3 className="font-medium text-gray-900">Communication Analytics</h3>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-blue-50 rounded-lg p-3">
                            <div className="text-2xl font-bold text-blue-800">
                              {selectedCommunication.responseTime || 0}h
                            </div>
                            <div className="text-sm text-blue-600">Response Time</div>
                          </div>
                          
                          <div className="bg-purple-50 rounded-lg p-3">
                            <div className="text-2xl font-bold text-purple-800">
                              {selectedCommunication.negotiationCount}
                            </div>
                            <div className="text-sm text-purple-600">Negotiations</div>
                          </div>
                          
                          <div className="bg-green-50 rounded-lg p-3">
                            <div className="text-2xl font-bold text-green-800">
                              ₹{selectedCommunication.priceReductions.toLocaleString()}
                            </div>
                            <div className="text-sm text-green-600">Savings</div>
                          </div>
                          
                          <div className="bg-orange-50 rounded-lg p-3">
                            <div className="text-2xl font-bold text-orange-800">
                              {selectedCommunication.messages.length}
                            </div>
                            <div className="text-sm text-orange-600">Messages</div>
                          </div>
                        </div>

                        {quotationAnalysis && (
                          <div className="border-t pt-4">
                            <h4 className="font-medium text-gray-900 mb-3">Market Analysis</h4>
                            <div className="space-y-2 text-sm text-gray-600">
                              {quotationAnalysis.marketInsights.map((insight, index) => (
                                <div key={index} className="flex items-center gap-2">
                                  <TrendingUp className="w-4 h-4 text-blue-500" />
                                  {insight}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                  <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Vendor</h3>
                  <p className="text-gray-600">
                    Choose a vendor from the list to view detailed communication history and manage your conversation.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorCommunication;
