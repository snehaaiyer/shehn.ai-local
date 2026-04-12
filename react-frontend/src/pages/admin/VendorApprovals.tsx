import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Clock, Building2, Camera, UtensilsCrossed, Filter } from 'lucide-react';
import { AdminService } from '../../services/admin_service';
import { VendorProfile } from '../../types/marketplace';

type TabStatus = 'pending' | 'approved' | 'rejected';

const categoryColors: Record<string, string> = {
  venue: 'bg-gray-100 text-gray-700',
  photography: 'bg-rose-100 text-rose-700',
  catering: 'bg-sage-100 text-sage-700',
  decoration: 'bg-rose-100 text-rose-700',
  makeup: 'bg-rose-100 text-rose-700',
  entertainment: 'bg-gray-100 text-gray-700',
};

const categoryIcons: Record<string, React.ReactNode> = {
  venue: <Building2 className="w-4 h-4" />,
  photography: <Camera className="w-4 h-4" />,
  catering: <UtensilsCrossed className="w-4 h-4" />,
};

const VendorApprovals: React.FC = () => {
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabStatus>('pending');
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const loadVendors = async (status: TabStatus) => {
    setLoading(true);
    try {
      const res = await AdminService.getVendors(status);
      if (res.success && res.data) {
        setVendors(res.data);
      } else {
        setVendors([]);
      }
    } catch {
      setVendors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVendors(activeTab);
  }, [activeTab]);

  const handleApprove = async (id: number) => {
    const res = await AdminService.approveVendor(id);
    if (res.success) {
      setVendors((prev) => prev.filter((v) => v.id !== id));
    }
  };

  const handleReject = async (id: number) => {
    const res = await AdminService.rejectVendor(id, rejectReason);
    if (res.success) {
      setVendors((prev) => prev.filter((v) => v.id !== id));
      setRejectingId(null);
      setRejectReason('');
    }
  };

  const tabs: { key: TabStatus; label: string; icon: React.ReactNode }[] = [
    { key: 'pending', label: 'Pending', icon: <Clock className="w-4 h-4" /> },
    { key: 'approved', label: 'Approved', icon: <CheckCircle className="w-4 h-4" /> },
    { key: 'rejected', label: 'Rejected', icon: <XCircle className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Vendor Approvals</h1>
          <Filter className="w-5 h-5 text-gray-400" />
        </div>

        {/* Tab Filter Row */}
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-gray-900 text-white shadow-md'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              {tab.icon}
              {tab.label}
              <span
                className={`ml-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                  activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {activeTab === tab.key ? vendors.length : '...'}
              </span>
            </button>
          ))}
        </div>

        {/* Vendor List */}
        {loading ? (
          <div className="text-center py-16 text-gray-400">Loading vendors...</div>
        ) : vendors.length === 0 ? (
          <div className="text-center py-16 text-gray-400">No {activeTab} vendors found.</div>
        ) : (
          <div className="space-y-4">
            {vendors.map((vendor, idx) => (
              <motion.div
                key={vendor.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm"
              >
                {/* Top row */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-900">{vendor.name}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${categoryColors[vendor.category] || 'bg-gray-100 text-gray-600'}`}>
                      {vendor.category}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {vendor.created_at ? new Date(vendor.created_at).toLocaleDateString() : ''}
                  </span>
                </div>

                {/* Cities */}
                {vendor.operating_cities?.length > 0 && (
                  <p className="text-sm text-gray-500 mb-2">
                    {vendor.operating_cities.join(', ')}
                  </p>
                )}

                {/* Stats row */}
                <div className="flex gap-4 text-xs text-gray-500 mb-2">
                  <span>{vendor.years_experience ?? 0} yrs exp</span>
                  <span>{vendor.services_offered?.length ?? 0} services</span>
                  <span>{vendor.portfolio_images?.length ?? 0} portfolio images</span>
                </div>

                {/* Description */}
                {vendor.business_description && (
                  <p className="text-sm text-gray-600 mb-3">
                    {vendor.business_description.length > 150
                      ? vendor.business_description.slice(0, 150) + '...'
                      : vendor.business_description}
                  </p>
                )}

                {/* Actions */}
                <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                  {activeTab === 'pending' && (
                    <>
                      <button
                        onClick={() => handleApprove(vendor.id)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-sage-600 text-white text-sm font-medium rounded-lg hover:bg-sage-700 transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" /> Approve
                      </button>
                      {rejectingId === vendor.id ? (
                        <div className="flex-1 flex items-center gap-2">
                          <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Rejection reason..."
                            className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2 resize-none"
                            rows={1}
                          />
                          <button
                            onClick={() => handleReject(vendor.id)}
                            className="px-4 py-2 bg-rose-600 text-white text-sm font-medium rounded-lg hover:bg-rose-700 transition-colors"
                          >
                            Confirm Reject
                          </button>
                          <button
                            onClick={() => { setRejectingId(null); setRejectReason(''); }}
                            className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700"
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
                    </>
                  )}
                  {activeTab === 'approved' && (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-sage-100 text-sage-700 text-sm font-medium rounded-full">
                      <CheckCircle className="w-4 h-4" /> Approved
                    </span>
                  )}
                  {activeTab === 'rejected' && (
                    <div className="flex flex-col gap-1">
                      <span className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-100 text-rose-700 text-sm font-medium rounded-full w-fit">
                        <XCircle className="w-4 h-4" /> Rejected
                      </span>
                      {vendor.rejection_reason && (
                        <p className="text-xs text-rose-500 ml-1">Reason: {vendor.rejection_reason}</p>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorApprovals;
