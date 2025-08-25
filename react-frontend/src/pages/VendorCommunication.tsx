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
  Eye,
  Activity,
  Target,
  Zap,
  Timer,
  Percent,
  BarChart3,
  MessageSquare // Added MessageSquare import
} from 'lucide-react';

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
  const [selectedCommunication, setSelectedCommunication] = useState<VendorCommunication | null>(null);

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // UI States
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'communication' | 'budget' | 'availability'>('overview');

  // Dummy data for stats - replace with actual calculations later
  const stats = {
    totalVendors: communications.length,
    activeNegotiations: communications.filter(c => c.status === 'negotiating').length,
    totalSavings: communications.reduce((sum, c) => sum + c.priceReductions, 0),
    avgResponseTime: (communications.filter(c => c.responseTime).reduce((sum, c) => sum + (c.responseTime || 0), 0) / (communications.filter(c => c.responseTime).length || 1)).toFixed(1) + 'h'
  };

  // Tab definitions
  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'communication', label: 'Communication', icon: MessageCircle },
    { id: 'budget', label: 'Budget', icon: DollarSign },
    { id: 'availability', label: 'Availability', icon: Activity },
  ];


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
        // Initialize with enhanced sample data
        const sampleData = generateEnhancedSampleCommunications();
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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-rose-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Vendor Communications</h1>
                <p className="text-sm text-gray-500">Comprehensive vendor relationship management</p>
              </div>
            </div>
            <button className="bg-rose-500 text-white px-4 py-2 rounded-lg hover:bg-rose-600 transition-colors flex items-center space-x-2">
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
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Vendors</p>
                  <p className="text-2xl font-bold text-gray-900">{communications.length}</p>
                </div>
                <div className="bg-rose-50 p-3 rounded-lg">
                  <Users className="w-6 h-6 text-rose-500" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Active Negotiations</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {communications.filter(c => c.status === 'negotiating').length}
                  </p>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-purple-500" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Savings</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ₹{communications.reduce((sum, c) => sum + c.priceReductions, 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-500" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Avg Response Time</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {(communications
                      .filter(c => c.responseTime)
                      .reduce((sum, c) => sum + (c.responseTime || 0), 0) / 
                      communications.filter(c => c.responseTime).length || 0
                    ).toFixed(1)}h
                  </p>
                </div>
                <div className="bg-amber-50 p-3 rounded-lg">
                  <Timer className="w-6 h-6 text-amber-500" />
                </div>
              </div>
            </div>
          </div>

          {/* View Toggle */}
          <div className="bg-white rounded-lg shadow-sm mb-8 border border-gray-100">
            <div className="border-b border-gray-100">
              <div className="flex">
                {tabs.map((view) => (
                  <button
                    key={view.id}
                    onClick={() => setActiveTab(view.id)}
                    className={`flex-1 py-4 px-6 text-sm font-medium border-b-2 transition-colors capitalize ${
                      activeTab === view.id
                        ? 'border-rose-400 text-rose-600 bg-rose-50'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {view.id === 'overview' && <BarChart3 className="w-4 h-4 mr-2 inline" />}
                    {view.id === 'communication' && <MessageCircle className="w-4 h-4 mr-2 inline" />}
                    {view.id === 'budget' && <DollarSign className="w-4 h-4 mr-2 inline" />}
                    {view.id === 'availability' && <Activity className="w-4 h-4 mr-2 inline" />}
                    {view.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Filters */}
            <div className="p-6 border-b border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search vendors..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:border-rose-400 focus:ring-2 focus:ring-rose-100 bg-white text-gray-900"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:border-green-400 focus:ring-2 focus:ring-green-100 bg-white text-gray-900"
                >
                  <option value="all">All Statuses</option>
                  <option value="contacted">Contacted</option>
                  <option value="responded">Responded</option>
                  <option value="quoted">Quoted</option>
                  <option value="negotiating">Negotiating</option>
                  <option value="booked">Booked</option>
                </select>

                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:border-green-400 focus:ring-2 focus:ring-green-100 bg-white text-gray-900"
                >
                  <option value="all">All Categories</option>
                  <option value="venues">Venues</option>
                  <option value="photography">Photography</option>
                  <option value="catering">Catering</option>
                  <option value="decoration">Decoration</option>
                </select>

                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:border-green-400 focus:ring-2 focus:ring-green-100 bg-white text-gray-900"
                >
                  <option value="all">All Priorities</option>
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>

                <button className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>
            </div>

            {/* Table Views */}
            <div className="p-6">
              {activeTab === 'overview' && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">Vendor</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">Category</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">Priority</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">Quote</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">Updated</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCommunications.map((comm) => (
                        <tr key={comm.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center">
                                <span className="text-sm font-semibold text-white">
                                  {comm.vendorName.charAt(0)}
                                </span>
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">{comm.vendorName}</div>
                                <div className="text-sm text-gray-600">{comm.vendorLocation}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className="bg-green-50 text-green-700 px-2 py-1 rounded-full text-xs font-medium capitalize">
                              {comm.vendorCategory}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(comm.status)}
                              <span className="text-sm font-medium capitalize">{comm.status}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
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
                                <div className="font-medium text-gray-900">
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
                              <button className="p-2 bg-gray-100 rounded-lg hover:bg-green-100 transition-colors">
                                <Eye className="w-4 h-4 text-gray-600 hover:text-green-600" />
                              </button>
                              <button className="p-2 bg-gray-100 rounded-lg hover:bg-green-100 transition-colors">
                                <MessageCircle className="w-4 h-4 text-gray-600 hover:text-green-600" />
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
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-muted-green">
                        <th className="text-left py-3 px-4 font-semibold text-deep-navy">Vendor</th>
                        <th className="text-left py-3 px-4 font-semibold text-deep-navy">Last Contact</th>
                        <th className="text-left py-3 px-4 font-semibold text-deep-navy">Response Time</th>
                        <th className="text-left py-3 px-4 font-semibold text-deep-navy">Messages</th>
                        <th className="text-left py-3 px-4 font-semibold text-deep-navy">Channels</th>
                        <th className="text-left py-3 px-4 font-semibold text-deep-navy">Next Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCommunications.map((comm) => (
                        <tr key={comm.id} className="border-b border-gray-200 hover:bg-soft-beige">
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-pastel-peach to-pink-100 rounded-lg flex items-center justify-center">
                                <span className="text-xs font-semibold text-deep-navy">
                                  {comm.vendorName.charAt(0)}
                                </span>
                              </div>
                              <div>
                                <div className="font-medium text-deep-navy">{comm.vendorName}</div>
                                <div className="text-xs text-muted-green">{comm.vendorCategory}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="text-sm">
                              {comm.responseDate ? (
                                <div>
                                  <div className="font-medium text-deep-navy">
                                    {new Date(comm.responseDate).toLocaleDateString()}
                                  </div>
                                  <div className="text-muted-green">
                                    {Math.ceil((Date.now() - new Date(comm.responseDate).getTime()) / (1000 * 60 * 60 * 24))} days ago
                                  </div>
                                </div>
                              ) : (
                                <span className="text-orange-500 font-medium">Awaiting response</span>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            {comm.responseTime ? (
                              <div className="flex items-center gap-2">
                                <Timer className="w-4 h-4 text-muted-green" />
                                <span className="text-sm font-medium">{comm.responseTime}h</span>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-sm">-</span>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <MessageCircle className="w-4 h-4 text-gray-400" />
                              <span className="text-sm font-medium">{comm.messages.length}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-1">
                              {comm.vendorEmail && (
                                <div className="p-1 bg-pastel-peach rounded">
                                  <Mail className="w-3 h-3 text-muted-green" />
                                </div>
                              )}
                              {comm.vendorPhone && (
                                <div className="p-1 bg-pastel-peach rounded">
                                  <Phone className="w-3 h-3 text-muted-green" />
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="text-sm">
                              {comm.followUpDate ? (
                                <div>
                                  <div className="font-medium text-purple-700">Follow up</div>
                                  <div className="text-muted-green">
                                    {new Date(comm.followUpDate).toLocaleDateString()}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-gray-400">No scheduled action</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'budget' && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-muted-green">
                        <th className="text-left py-3 px-4 font-semibold text-deep-navy">Vendor</th>
                        <th className="text-left py-3 px-4 font-semibold text-deep-navy">Quote Amount</th>
                        <th className="text-left py-3 px-4 font-semibold text-deep-navy">Compatibility</th>
                        <th className="text-left py-3 px-4 font-semibold text-deep-navy">Market Position</th>
                        <th className="text-left py-3 px-4 font-semibold text-deep-navy">Savings Achieved</th>
                        <th className="text-left py-3 px-4 font-semibold text-deep-navy">Negotiations</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCommunications.map((comm) => (
                        <tr key={comm.id} className="border-b border-gray-200 hover:bg-soft-beige">
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-pastel-peach to-pink-100 rounded-lg flex items-center justify-center">
                                <span className="text-xs font-semibold text-deep-navy">
                                  {comm.vendorName.charAt(0)}
                                </span>
                              </div>
                              <div>
                                <div className="font-medium text-deep-navy">{comm.vendorName}</div>
                                <div className="text-xs text-muted-green">{comm.vendorCategory}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            {comm.quotation ? (
                              <div>
                                <div className="text-lg font-bold text-deep-navy">
                                  ₹{comm.quotation.amount.toLocaleString()}
                                </div>
                                <div className="text-xs text-muted-green">
                                  Valid till {new Date(comm.quotation.validUntil).toLocaleDateString()}
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-400">No quote yet</span>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getBudgetCompatibilityColor(comm.budgetCompatibility)}`}>
                              {comm.budgetCompatibility}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              comm.marketPosition === 'luxury' ? 'bg-purple-100 text-purple-800' :
                              comm.marketPosition === 'premium' ? 'bg-green-100 text-green-800' :
                              comm.marketPosition === 'mid-range' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {comm.marketPosition}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            {comm.priceReductions > 0 ? (
                              <div className="flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-green-500" />
                                <span className="font-medium text-green-700">
                                  ₹{comm.priceReductions.toLocaleString()}
                                </span>
                              </div>
                            ) : (
                              <span className="text-gray-400">No savings yet</span>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <Target className="w-4 h-4 text-purple-500" />
                              <span className="text-sm font-medium">{comm.negotiationCount} rounds</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'availability' && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-muted-green">
                        <th className="text-left py-3 px-4 font-semibold text-deep-navy">Vendor</th>
                        <th className="text-left py-3 px-4 font-semibold text-deep-navy">Availability Status</th>
                        <th className="text-left py-3 px-4 font-semibold text-deep-navy">Contact Date</th>
                        <th className="text-left py-3 px-4 font-semibold text-deep-navy">Service Date</th>
                        <th className="text-left py-3 px-4 font-semibold text-deep-navy">Booking Window</th>
                        <th className="text-left py-3 px-4 font-semibold text-deep-navy">Risk Level</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCommunications.map((comm) => (
                        <tr key={comm.id} className="border-b border-gray-200 hover:bg-soft-beige">
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-pastel-peach to-pink-100 rounded-lg flex items-center justify-center">
                                <span className="text-xs font-semibold text-deep-navy">
                                  {comm.vendorName.charAt(0)}
                                </span>
                              </div>
                              <div>
                                <div className="font-medium text-deep-navy">{comm.vendorName}</div>
                                <div className="text-xs text-muted-green">{comm.vendorCategory}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <Activity className="w-4 h-4" />
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getAvailabilityColor(comm.availabilityStatus)}`}>
                                {comm.availabilityStatus} availability
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-sm text-muted-green">
                            {new Date(comm.contactDate).toLocaleDateString()}
                          </td>
                          <td className="py-4 px-4 text-sm">
                            {comm.serviceDate ? (
                              <div>
                                <div className="font-medium text-deep-navy">
                                  {new Date(comm.serviceDate).toLocaleDateString()}
                                </div>
                                <div className="text-muted-green">
                                  {Math.ceil((new Date(comm.serviceDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days away
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-400">Not scheduled</span>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            {comm.serviceDate && comm.contactDate ? (
                              <div className="text-sm">
                                <div className="font-medium text-deep-navy">
                                  {Math.ceil((new Date(comm.serviceDate).getTime() - new Date(comm.contactDate).getTime()) / (1000 * 60 * 60 * 24))} days
                                </div>
                                <div className="text-muted-green">booking window</div>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              comm.availabilityStatus === 'low' ? 'bg-red-100 text-red-800' :
                              comm.availabilityStatus === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {comm.availabilityStatus === 'low' ? 'High Risk' :
                               comm.availabilityStatus === 'medium' ? 'Medium Risk' : 'Low Risk'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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