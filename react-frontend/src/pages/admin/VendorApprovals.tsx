import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle, XCircle, Clock, Building2, Camera, UtensilsCrossed, Filter,
  ChevronDown, ChevronUp, Star, MapPin, IndianRupee, Briefcase, FileText,
  Palette, Music, Sparkles, Search,
} from 'lucide-react';
import { AdminService } from '../../services/admin_service';
import { useAppStore } from '../../store/useAppStore';

type TabStatus = 'pending' | 'approved' | 'rejected';

const categoryColors: Record<string, string> = {
  venue: 'bg-blue-50 text-blue-700 border-blue-200',
  photography: 'bg-purple-50 text-purple-700 border-purple-200',
  catering: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  decoration: 'bg-amber-50 text-amber-700 border-amber-200',
  makeup: 'bg-pink-50 text-pink-700 border-pink-200',
  entertainment: 'bg-indigo-50 text-indigo-700 border-indigo-200',
};

const categoryIcons: Record<string, React.ReactNode> = {
  venue: <Building2 className="w-4 h-4" />,
  photography: <Camera className="w-4 h-4" />,
  catering: <UtensilsCrossed className="w-4 h-4" />,
  decoration: <Palette className="w-4 h-4" />,
  makeup: <Sparkles className="w-4 h-4" />,
  entertainment: <Music className="w-4 h-4" />,
};

const VendorApprovals: React.FC = () => {
  const { theme } = useAppStore();
  const isDark = theme === 'dark';
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabStatus>('approved');
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [tabCounts, setTabCounts] = useState<Record<TabStatus, number>>({ pending: 0, approved: 0, rejected: 0 });

  const loadVendors = async (status: TabStatus) => {
    setLoading(true);
    try {
      const res = await AdminService.getVendors(status);
      if (res.success && res.data) {
        setVendors(res.data);
        setTabCounts(prev => ({ ...prev, [status]: res.data!.length }));
      } else {
        setVendors([]);
      }
    } catch {
      setVendors([]);
    } finally {
      setLoading(false);
    }
  };

  // Load counts for all tabs on mount
  useEffect(() => {
    const loadCounts = async () => {
      for (const status of ['pending', 'approved', 'rejected'] as TabStatus[]) {
        try {
          const res = await AdminService.getVendors(status);
          if (res.success && res.data) {
            setTabCounts(prev => ({ ...prev, [status]: res.data!.length }));
          }
        } catch { /* ignore */ }
      }
    };
    loadCounts();
  }, []);

  useEffect(() => {
    loadVendors(activeTab);
  }, [activeTab]);

  const handleApprove = async (id: number) => {
    const res = await AdminService.approveVendor(id);
    if (res.success) {
      setVendors((prev) => prev.filter((v) => v.id !== id));
      setTabCounts(prev => ({ ...prev, pending: prev.pending - 1, approved: prev.approved + 1 }));
    }
  };

  const handleReject = async (id: number) => {
    const res = await AdminService.rejectVendor(id, rejectReason);
    if (res.success) {
      setVendors((prev) => prev.filter((v) => v.id !== id));
      setRejectingId(null);
      setRejectReason('');
      setTabCounts(prev => ({ ...prev, pending: prev.pending - 1, rejected: prev.rejected + 1 }));
    }
  };

  // Filter vendors by search and category
  const filteredVendors = vendors.filter(v => {
    const matchesSearch = !searchQuery ||
      v.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.business_description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.operating_cities?.some((c: string) => c.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || v.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const uniqueCategories = Array.from(new Set(vendors.map(v => v.category as string))).sort();

  const tabs: { key: TabStatus; label: string; icon: React.ReactNode }[] = [
    { key: 'pending', label: 'Pending', icon: <Clock className="w-4 h-4" /> },
    { key: 'approved', label: 'Approved', icon: <CheckCircle className="w-4 h-4" /> },
    { key: 'rejected', label: 'Rejected', icon: <XCircle className="w-4 h-4" /> },
  ];

  const formatPrice = (price: number) => {
    if (price >= 100000) return `₹${(price / 100000).toFixed(1)}L`;
    if (price >= 1000) return `₹${(price / 1000).toFixed(0)}K`;
    return `₹${price.toLocaleString('en-IN')}`;
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} p-4 sm:p-6`}>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className={`text-2xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Vendor Management</h1>
            <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {vendors.length} vendors in {activeTab} · {filteredVendors.length} shown
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search vendors..."
                className={`pl-9 pr-3 py-2 rounded-lg text-sm border focus:ring-2 focus:ring-rose-300 outline-none w-48 ${
                  isDark ? 'bg-gray-800 border-gray-700 text-gray-200 placeholder-gray-500' : 'bg-white border-gray-200 text-gray-800'
                }`}
              />
            </div>
            {/* Category filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className={`px-3 py-2 rounded-lg text-sm border focus:ring-2 focus:ring-rose-300 outline-none ${
                isDark ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-white border-gray-200 text-gray-700'
              }`}
            >
              <option value="all">All Categories</option>
              {uniqueCategories.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
          </div>
        </div>

        {/* Tab Filter Row */}
        <div className="flex gap-2 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.key
                  ? isDark ? 'bg-gray-100 text-gray-900 shadow-md' : 'bg-gray-900 text-white shadow-md'
                  : isDark ? 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              {tab.icon}
              {tab.label}
              <span
                className={`ml-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                  activeTab === tab.key
                    ? isDark ? 'bg-gray-300 text-gray-800' : 'bg-white/20 text-white'
                    : isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {tabCounts[tab.key]}
              </span>
            </button>
          ))}
        </div>

        {/* Vendor List */}
        {loading ? (
          <div className={`text-center py-16 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Loading vendors...</div>
        ) : filteredVendors.length === 0 ? (
          <div className={`text-center py-16 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            {searchQuery || categoryFilter !== 'all' ? 'No vendors match your filters.' : `No ${activeTab} vendors found.`}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredVendors.map((vendor, idx) => {
              const isExpanded = expandedId === vendor.id;
              const services = vendor.services_offered || [];
              const faqData = vendor.faq_data || {};
              const faqEntries = Object.entries(faqData).filter(([_, v]) => v !== '' && v !== null && v !== undefined);

              return (
                <motion.div
                  key={vendor.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(idx * 0.03, 0.3) }}
                  className={`rounded-xl border shadow-sm overflow-hidden ${
                    isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                  }`}
                >
                  {/* Compact row */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : vendor.id)}
                    className={`w-full text-left p-4 sm:p-5 hover:${isDark ? 'bg-gray-750' : 'bg-gray-50/50'} transition`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                            {categoryIcons[vendor.category] || <Briefcase className="w-4 h-4" />}
                          </span>
                          <h3 className={`text-base font-semibold truncate ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{vendor.name}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${categoryColors[vendor.category] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                            {vendor.category}
                          </span>
                          {vendor.rating > 0 && (
                            <span className="flex items-center gap-0.5 text-xs text-amber-600">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {vendor.rating}
                            </span>
                          )}
                        </div>
                        <div className={`flex flex-wrap items-center gap-3 mt-1.5 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {vendor.operating_cities?.length > 0 && (
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {vendor.operating_cities.join(', ')}</span>
                          )}
                          <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" /> {vendor.years_experience ?? 0} yrs</span>
                          <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> {services.length} services</span>
                          {services.length > 0 && (
                            <span className="flex items-center gap-1">
                              <IndianRupee className="w-3 h-3" />
                              {formatPrice(Math.min(...services.map((s: any) => s.base_price || 0).filter((p: number) => p > 0)))}
                              {' — '}
                              {formatPrice(Math.max(...services.map((s: any) => s.base_price || 0)))}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {/* Status badge on non-pending tabs */}
                        {activeTab === 'approved' && (
                          <span className="flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full border border-emerald-200">
                            <CheckCircle className="w-3 h-3" /> Approved
                          </span>
                        )}
                        {activeTab === 'rejected' && (
                          <span className="flex items-center gap-1 px-2 py-1 bg-rose-50 text-rose-700 text-xs font-medium rounded-full border border-rose-200">
                            <XCircle className="w-3 h-3" /> Rejected
                          </span>
                        )}
                        {isExpanded ? <ChevronUp className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} /> : <ChevronDown className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />}
                      </div>
                    </div>
                  </button>

                  {/* Expanded detail panel */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`border-t ${isDark ? 'border-gray-700' : 'border-gray-100'}`}
                      >
                        <div className="p-4 sm:p-5 space-y-5">
                          {/* Description */}
                          {vendor.business_description && (
                            <div>
                              <h4 className={`text-xs font-semibold uppercase tracking-wide mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>About</h4>
                              <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{vendor.business_description}</p>
                            </div>
                          )}

                          {/* Services & Pricing Table */}
                          {services.length > 0 && (
                            <div>
                              <h4 className={`text-xs font-semibold uppercase tracking-wide mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                Services &amp; Pricing ({services.length})
                              </h4>
                              <div className={`rounded-lg border overflow-hidden ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className={isDark ? 'bg-gray-700/50' : 'bg-gray-50'}>
                                      <th className={`text-left px-3 py-2 text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Service</th>
                                      <th className={`text-right px-3 py-2 text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Base Price</th>
                                      <th className={`text-right px-3 py-2 text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Unit</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {services.map((svc: any, i: number) => (
                                      <tr key={i} className={`border-t ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                                        <td className={`px-3 py-2 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{svc.name}</td>
                                        <td className={`px-3 py-2 text-right font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                                          {svc.base_price ? formatPrice(svc.base_price) : '—'}
                                        </td>
                                        <td className={`px-3 py-2 text-right ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{svc.price_unit || '—'}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}

                          {/* FAQ Data / Key-Value Store */}
                          {faqEntries.length > 0 && (
                            <div>
                              <h4 className={`text-xs font-semibold uppercase tracking-wide mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                Vendor Details ({faqEntries.length} attributes)
                              </h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {faqEntries.map(([key, val]) => (
                                  <div key={key} className={`flex items-start gap-2 px-3 py-2 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                                    <span className={`text-xs font-medium shrink-0 min-w-[120px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                      {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                    </span>
                                    <span className={`text-xs ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                                      {Array.isArray(val) ? (val as string[]).join(', ') : typeof val === 'boolean' ? (val ? 'Yes' : 'No') : String(val)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Portfolio Images */}
                          {vendor.portfolio_images?.length > 0 && (
                            <div>
                              <h4 className={`text-xs font-semibold uppercase tracking-wide mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                Portfolio ({vendor.portfolio_images.length} images)
                              </h4>
                              <div className="flex gap-2 overflow-x-auto">
                                {vendor.portfolio_images.map((img: any, i: number) => (
                                  <div key={i} className="shrink-0 w-24 h-24 rounded-lg overflow-hidden bg-gray-100">
                                    <img src={img.url || img} alt={img.caption || `Portfolio ${i + 1}`} className="w-full h-full object-cover" />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Rejection reason */}
                          {activeTab === 'rejected' && vendor.rejection_reason && (
                            <div className={`rounded-lg p-3 ${isDark ? 'bg-rose-900/20 border border-rose-800' : 'bg-rose-50 border border-rose-200'}`}>
                              <p className="text-xs font-semibold text-rose-600 mb-0.5">Rejection Reason</p>
                              <p className={`text-sm ${isDark ? 'text-rose-300' : 'text-rose-700'}`}>{vendor.rejection_reason}</p>
                            </div>
                          )}

                          {/* Actions */}
                          {activeTab === 'pending' && (
                            <div className={`flex items-center gap-3 pt-3 border-t ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                              <button
                                onClick={() => handleApprove(vendor.id)}
                                className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
                              >
                                <CheckCircle className="w-4 h-4" /> Approve
                              </button>
                              {rejectingId === vendor.id ? (
                                <div className="flex-1 flex items-center gap-2">
                                  <textarea
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    placeholder="Rejection reason..."
                                    className={`flex-1 text-sm border rounded-lg px-3 py-2 resize-none focus:ring-2 focus:ring-rose-300 outline-none ${
                                      isDark ? 'bg-gray-700 border-gray-600 text-gray-200' : 'border-gray-300'
                                    }`}
                                    rows={1}
                                  />
                                  <button
                                    onClick={() => handleReject(vendor.id)}
                                    className="px-4 py-2 bg-rose-600 text-white text-sm font-medium rounded-lg hover:bg-rose-700 transition-colors"
                                  >
                                    Confirm
                                  </button>
                                  <button
                                    onClick={() => { setRejectingId(null); setRejectReason(''); }}
                                    className={`px-3 py-2 text-sm ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setRejectingId(vendor.id)}
                                  className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 text-white text-sm font-medium rounded-lg hover:bg-rose-700 transition-colors"
                                >
                                  <XCircle className="w-4 h-4" /> Reject
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorApprovals;
