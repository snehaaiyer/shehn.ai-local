import React, { useState, useEffect } from 'react';
import {
  MessageCircle,
  Mail,
  Phone,
  FileText,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertCircle,
  Send,
  Plus,
  Search,
  Download,
  Eye,
  Activity,
  DollarSign,
  Users,
  Heart,
  Timer,
  BarChart3,
  MessageSquare
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

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

  // Availability & Budget Insights
  availabilityStatus: 'high' | 'medium' | 'low' | 'unknown';
  budgetCompatibility: 'perfect' | 'good' | 'stretch' | 'over';
  marketPosition: 'budget' | 'mid-range' | 'premium' | 'luxury';

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

const VendorCommunication: React.FC = () => {
  const [communications, setCommunications] = useState<VendorCommunication[]>([]);
  const [filteredCommunications, setFilteredCommunications] = useState<VendorCommunication[]>([]);

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // UI States
  const [activeTab, setActiveTab] = useState<'overview' | 'communication' | 'budget' | 'availability'>('overview');

  // Tab definitions
  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: BarChart3 },
    { id: 'communication' as const, label: 'Communication', icon: MessageCircle },
    { id: 'budget' as const, label: 'Budget', icon: DollarSign },
    { id: 'availability' as const, label: 'Availability', icon: Activity },
  ];

  useEffect(() => {
    loadCommunications();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [communications, statusFilter, categoryFilter, priorityFilter, searchTerm]);

  const loadCommunications = async () => {
    try {
      // Load from localStorage for now (in real app, would be from API)
      const savedCommunications = localStorage.getItem('vendorCommunications');
      if (savedCommunications) {
        const data = JSON.parse(savedCommunications);
        setCommunications(data);
      } else {
        // Initialize with enhanced sample data
        const sampleData = generateEnhancedSampleCommunications();
        setCommunications(sampleData);
        localStorage.setItem('vendorCommunications', JSON.stringify(sampleData));
      }

    } catch (error) {
      console.error('Error loading communications:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...communications];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(comm => comm.status === statusFilter);
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(comm => comm.vendorCategory === categoryFilter);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(comm => comm.priority === priorityFilter);
    }

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

  const generateEnhancedSampleCommunications = (): VendorCommunication[] => {
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
        availabilityStatus: 'medium',
        budgetCompatibility: 'good',
        marketPosition: 'premium',
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
        availabilityStatus: 'high',
        budgetCompatibility: 'perfect',
        marketPosition: 'mid-range',
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
        followUpDate: '2024-01-25T10:00:00Z',
        responseTime: 2.5,
        negotiationCount: 2,
        priceReductions: 25000,
        notes: 'Great portfolio, professional team. Negotiating on videography inclusion.',
        tags: ['premium', 'experienced', 'negotiable'],
        createdAt: '2024-01-16T09:00:00Z',
        updatedAt: '2024-01-17T15:00:00Z'
      },
      {
        id: 'comm-3',
        vendorId: 'vendor-3',
        vendorName: 'Spice Garden Catering',
        vendorCategory: 'catering',
        vendorLocation: 'Delhi, India',
        vendorPhone: '+91 99887 76543',
        vendorEmail: 'orders@spicegarden.in',
        status: 'contacted',
        priority: 'medium',
        availabilityStatus: 'high',
        budgetCompatibility: 'stretch',
        marketPosition: 'budget',
        messages: [
          {
            id: 'msg-4',
            type: 'email',
            direction: 'sent',
            subject: 'Catering Service Inquiry',
            content: 'Looking for catering services for 200 guests...',
            timestamp: '2024-01-17T12:00:00Z',
            status: 'sent'
          }
        ],
        quotation: {
          amount: 80000,
          currency: 'INR',
          description: 'Traditional Indian catering for 200 guests',
          validUntil: '2024-02-01',
          inclusions: ['3-course meal', 'Service staff', 'Crockery'],
          exclusions: ['Beverages', 'Desserts', 'Decoration'],
          paymentTerms: '50% advance, 50% on service day',
          advances: [
            { percentage: 50, amount: 40000 },
            { percentage: 50, amount: 40000 }
          ]
        },
        contactDate: '2024-01-17T12:00:00Z',
        responseDate: undefined,
        quotationDate: undefined,
        responseTime: undefined,
        negotiationCount: 0,
        priceReductions: 0,
        notes: 'Waiting for response. Budget-friendly option.',
        tags: ['budget-friendly', 'traditional', 'pending'],
        createdAt: '2024-01-17T12:00:00Z',
        updatedAt: '2024-01-17T12:00:00Z'
      }
    ];
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      interested: <Heart className="w-4 h-4 text-rose-500" />,
      contacted: <Send className="w-4 h-4 text-blue-500" />,
      responded: <MessageCircle className="w-4 h-4 text-green-500" />,
      quoted: <FileText className="w-4 h-4 text-orange-500" />,
      negotiating: <TrendingUp className="w-4 h-4 text-purple-500" />,
      booked: <CheckCircle className="w-4 h-4 text-green-600" />,
      declined: <AlertCircle className="w-4 h-4 text-red-500" />
    };
    return icons[status as keyof typeof icons] || <Clock className="w-4 h-4 text-gray-500" />;
  };

  const getAvailabilityColor = (status: string) => {
    const colors = {
      high: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-red-100 text-red-800',
      unknown: 'bg-gray-100 text-gray-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getBudgetCompatibilityColor = (compatibility: string) => {
    const colors = {
      perfect: 'bg-green-100 text-green-800',
      good: 'bg-green-100 text-green-800',
      stretch: 'bg-yellow-100 text-yellow-800',
      over: 'bg-red-100 text-red-800'
    };
    return colors[compatibility as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-orange-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-pink-600 to-purple-700 p-2 rounded-lg">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Vendor Communications</h1>
                <p className="text-sm text-gray-600">Comprehensive vendor relationship management</p>
              </div>
            </div>
            <button className="bg-gradient-to-r from-pink-600 to-purple-700 text-white px-6 py-2 rounded-lg hover:from-pink-700 hover:to-purple-800 transition-all duration-300 flex items-center space-x-2 shadow-lg">
              <Plus className="w-4 h-4" />
              <span>Add Vendor</span>
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Analytics Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/90 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Vendors</p>
                  <p className="text-2xl font-bold text-gray-800">{communications.length}</p>
                </div>
                <div className="bg-gradient-to-r from-pink-100 to-purple-100 p-3 rounded-lg">
                  <Users className="w-6 h-6 text-pink-600" />
                </div>
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Negotiations</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {communications.filter(c => c.status === 'negotiating').length}
                  </p>
                </div>
                <div className="bg-gradient-to-r from-pink-100 to-purple-100 p-3 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-pink-600" />
                </div>
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Savings</p>
                  <p className="text-2xl font-bold text-gray-800">
                    ₹{communications.reduce((sum, c) => sum + c.priceReductions, 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-gradient-to-r from-pink-100 to-purple-100 p-3 rounded-lg">
                  <DollarSign className="w-6 h-6 text-pink-600" />
                </div>
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {(communications
                      .filter(c => c.responseTime)
                      .reduce((sum, c) => sum + (c.responseTime || 0), 0) /
                      communications.filter(c => c.responseTime).length || 0
                    ).toFixed(1)}h
                  </p>
                </div>
                <div className="bg-gradient-to-r from-pink-100 to-purple-100 p-3 rounded-lg">
                  <Timer className="w-6 h-6 text-pink-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Card */}
          <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-white/20">
            {/* Tab Navigation */}
            <div className="border-b border-gray-100">
              <div className="flex">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 py-4 px-6 text-sm font-medium border-b-2 transition-all duration-300 flex items-center justify-center gap-2 ${
                      activeTab === tab.id
                        ? 'border-pink-500 text-pink-600 bg-pink-50/50'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50/50'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Filters */}
            <div className="p-6 border-b border-gray-100 bg-gray-50/30">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search vendors..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:border-pink-300 focus:ring-2 focus:ring-pink-100 bg-white/80 backdrop-blur-sm"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-xl focus:border-pink-300 focus:ring-2 focus:ring-pink-100 bg-white/80 backdrop-blur-sm"
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

                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-xl focus:border-pink-300 focus:ring-2 focus:ring-pink-100 bg-white/80 backdrop-blur-sm"
                >
                  <option value="all">All Categories</option>
                  <option value="venues">Venues</option>
                  <option value="photography">Photography</option>
                  <option value="catering">Catering</option>
                  <option value="decoration">Decoration</option>
                  <option value="entertainment">Entertainment</option>
                  <option value="logistics">Logistics</option>
                </select>

                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-xl focus:border-pink-300 focus:ring-2 focus:ring-pink-100 bg-white/80 backdrop-blur-sm"
                >
                  <option value="all">All Priorities</option>
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>

                <button className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl hover:from-pink-600 hover:to-purple-700 transition-all duration-300 shadow-lg">
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="p-6">
              {activeTab === 'overview' && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Vendor</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Category</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Priority</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Quote</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Updated</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCommunications.map((comm) => (
                        <tr key={comm.id} className="border-b border-gray-100 hover:bg-pink-50/30 transition-colors">
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center">
                                <span className="text-sm font-semibold text-white">
                                  {comm.vendorName.charAt(0)}
                                </span>
                              </div>
                              <div>
                                <div className="font-medium text-gray-800">{comm.vendorName}</div>
                                <div className="text-sm text-gray-600">{comm.vendorLocation}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className="bg-pink-100 text-pink-800 px-3 py-1 rounded-full text-xs font-medium capitalize">
                              {comm.vendorCategory}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(comm.status)}
                              <span className="text-sm font-medium capitalize text-gray-700">{comm.status}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              comm.priority === 'high' ? 'bg-red-100 text-red-800' :
                              comm.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {comm.priority}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            {comm.quotation ? (
                              <div className="text-sm">
                                <div className="font-medium text-gray-800">
                                  ₹{comm.quotation.amount.toLocaleString()}
                                </div>
                                <div className="text-gray-600">
                                  Valid till {new Date(comm.quotation.validUntil).toLocaleDateString()}
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-sm">No quote</span>
                            )}
                          </td>
                          <td className="py-4 px-4 text-sm text-gray-600">
                            {new Date(comm.updatedAt).toLocaleDateString()}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <button className="p-2 bg-pink-100 rounded-lg hover:bg-pink-200 transition-colors">
                                <Eye className="w-4 h-4 text-pink-600" />
                              </button>
                              <button className="p-2 bg-pink-100 rounded-lg hover:bg-pink-200 transition-colors">
                                <MessageCircle className="w-4 h-4 text-pink-600" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'communication' && (
                <div className="space-y-4">
                  {filteredCommunications.map((comm) => (
                    <div key={comm.id} className="bg-white rounded-xl p-4 border border-gray-200 hover:bg-pink-50/30 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center">
                            <span className="text-sm font-semibold text-white">
                              {comm.vendorName.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{comm.vendorName}</h4>
                            <p className="text-sm text-gray-600">{comm.vendorCategory} • {comm.vendorLocation}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {comm.responseTime && (
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Timer className="w-4 h-4" />
                              <span>{comm.responseTime}h response</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <MessageCircle className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium">{comm.messages.length}</span>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Last Contact:</span>
                          <div className="font-medium">
                            {comm.responseDate ? new Date(comm.responseDate).toLocaleDateString() : 'Awaiting response'}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">Status:</span>
                          <div className="flex items-center gap-1 font-medium">
                            {getStatusIcon(comm.status)}
                            <span className="capitalize">{comm.status}</span>
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">Priority:</span>
                          <div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              comm.priority === 'high' ? 'bg-red-100 text-red-800' :
                              comm.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {comm.priority}
                            </span>
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">Channels:</span>
                          <div className="flex items-center gap-1 mt-1">
                            {comm.vendorEmail && (
                              <div className="p-1 bg-pink-100 rounded">
                                <Mail className="w-3 h-3 text-pink-600" />
                              </div>
                            )}
                            {comm.vendorPhone && (
                              <div className="p-1 bg-pink-100 rounded">
                                <Phone className="w-3 h-3 text-pink-600" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'budget' && (
                <div className="space-y-4">
                  {filteredCommunications.map((comm) => (
                    <div key={comm.id} className="bg-white rounded-xl p-4 border border-gray-200 hover:bg-pink-50/30 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center">
                            <span className="text-sm font-semibold text-white">
                              {comm.vendorName.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{comm.vendorName}</h4>
                            <p className="text-sm text-gray-600">{comm.vendorCategory}</p>
                          </div>
                        </div>
                        {comm.quotation && (
                          <div className="text-right">
                            <div className="text-xl font-bold text-gray-800">
                              ₹{comm.quotation.amount.toLocaleString()}
                            </div>
                            <div className="text-sm text-gray-600">
                              Valid till {new Date(comm.quotation.validUntil).toLocaleDateString()}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Compatibility:</span>
                          <div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getBudgetCompatibilityColor(comm.budgetCompatibility)}`}>
                              {comm.budgetCompatibility}
                            </span>
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">Market Position:</span>
                          <div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              comm.marketPosition === 'luxury' ? 'bg-purple-100 text-purple-800' :
                              comm.marketPosition === 'premium' ? 'bg-pink-100 text-pink-800' :
                              comm.marketPosition === 'mid-range' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {comm.marketPosition}
                            </span>
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">Savings Achieved:</span>
                          <div className="font-medium">
                            {comm.priceReductions > 0 ? (
                              <span className="text-green-600">₹{comm.priceReductions.toLocaleString()}</span>
                            ) : (
                              <span className="text-gray-400">No savings yet</span>
                            )}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">Negotiations:</span>
                          <div className="font-medium">{comm.negotiationCount} rounds</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'availability' && (
                <div className="space-y-4">
                  {filteredCommunications.map((comm) => (
                    <div key={comm.id} className="bg-white rounded-xl p-4 border border-gray-200 hover:bg-pink-50/30 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center">
                            <span className="text-sm font-semibold text-white">
                              {comm.vendorName.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{comm.vendorName}</h4>
                            <p className="text-sm text-gray-600">{comm.vendorCategory}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4" />
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getAvailabilityColor(comm.availabilityStatus)}`}>
                            {comm.availabilityStatus} availability
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Contact Date:</span>
                          <div className="font-medium">
                            {new Date(comm.contactDate).toLocaleDateString()}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">Service Date:</span>
                          <div className="font-medium">
                            {comm.serviceDate ? (
                              <>
                                {new Date(comm.serviceDate).toLocaleDateString()}
                                <div className="text-xs text-gray-500">
                                  {Math.ceil((new Date(comm.serviceDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days away
                                </div>
                              </>
                            ) : (
                              'Not scheduled'
                            )}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">Booking Window:</span>
                          <div className="font-medium">
                            {comm.serviceDate && comm.contactDate ? (
                              `${Math.ceil((new Date(comm.serviceDate).getTime() - new Date(comm.contactDate).getTime()) / (1000 * 60 * 60 * 24))} days`
                            ) : (
                              '-'
                            )}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">Risk Level:</span>
                          <div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              comm.availabilityStatus === 'low' ? 'bg-red-100 text-red-800' :
                              comm.availabilityStatus === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {comm.availabilityStatus === 'low' ? 'High Risk' :
                               comm.availabilityStatus === 'medium' ? 'Medium Risk' : 'Low Risk'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
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