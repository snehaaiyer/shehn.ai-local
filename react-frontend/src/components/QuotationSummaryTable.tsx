import React, { useState, useEffect } from 'react';
import { Mail, Calendar, DollarSign, TrendingUp, FileText, CheckCircle, Clock, AlertCircle, Download } from 'lucide-react';
// AI analysis via backend /api/ai/chat

interface QuotationData {
  id: string;
  vendor_name: string;
  vendor_category: string;
  email_sent_date: string;
  response_received: boolean;
  response_date?: string;
  quoted_price?: number;
  package_details?: string;
  ai_summary?: string;
  sentiment_score?: number;
  availability_confirmed?: boolean;
  follow_up_required?: boolean;
  raw_email_content?: string;
  attachments?: string[];
  rating: 'excellent' | 'good' | 'average' | 'poor';
  negotiation_potential?: number;
}

interface QuotationSummaryTableProps {
  weddingId: string;
  refreshTrigger?: number;
}

export const QuotationSummaryTable: React.FC<QuotationSummaryTableProps> = ({
  weddingId,
  refreshTrigger = 0
}) => {
  const [quotations, setQuotations] = useState<QuotationData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedQuotation, setSelectedQuotation] = useState<QuotationData | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [summaryStats, setSummaryStats] = useState({
    total_sent: 0,
    responses_received: 0,
    avg_response_time: 0,
    total_quoted_amount: 0,
    best_deals: [] as QuotationData[]
  });

  useEffect(() => {
    loadQuotations();
  }, [weddingId, refreshTrigger]);

  const loadQuotations = async () => {
    setIsLoading(true);
    try {
      // Fetch quotations from backend
      const response = await fetch(`/api/quotations/${weddingId}`);
      const data = await response.json();
      
      if (data.success) {
        const enrichedQuotations = await enrichQuotationsWithAI(data.quotations);
        setQuotations(enrichedQuotations);
        calculateSummaryStats(enrichedQuotations);
      }
    } catch (error) {
      console.error('Failed to load quotations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const enrichQuotationsWithAI = async (quotations: QuotationData[]): Promise<QuotationData[]> => {
    const enrichedQuotations = [];

    for (const quotation of quotations) {
      if (quotation.response_received && quotation.raw_email_content && !quotation.ai_summary) {
        try {
          // Use CrewAI to analyze vendor email responses
          const analysis = await analyzeVendorResponse(quotation.raw_email_content, quotation.vendor_category);
          
          enrichedQuotations.push({
            ...quotation,
            ai_summary: analysis.summary,
            sentiment_score: analysis.sentiment_score,
            availability_confirmed: analysis.availability_confirmed,
            follow_up_required: analysis.follow_up_required,
            rating: analysis.rating,
            negotiation_potential: analysis.negotiation_potential
          });
        } catch (error) {
          console.error(`AI analysis failed for ${quotation.vendor_name}:`, error);
          enrichedQuotations.push(quotation);
        }
      } else {
        enrichedQuotations.push(quotation);
      }
    }

    return enrichedQuotations;
  };

  const analyzeVendorResponse = async (emailContent: string, category: string) => {
    const prompt = `Analyze this wedding vendor email response and provide insights:

Email Content: ${emailContent}
Vendor Category: ${category}

Please provide:
1. A concise summary (2-3 sentences)
2. Sentiment score (0-100, where 100 is very positive)
3. Whether availability is confirmed (true/false)
4. If follow-up is required (true/false)
5. Overall rating (excellent/good/average/poor)
6. Negotiation potential (0-100, where 100 means highly negotiable)
7. Key pricing information extracted
8. Any red flags or concerns

Format as JSON:
{
  "summary": "...",
  "sentiment_score": 85,
  "availability_confirmed": true,
  "follow_up_required": false,
  "rating": "good",
  "negotiation_potential": 70,
  "pricing_info": "...",
  "concerns": "..."
}`;

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt })
      });
      const data = await res.json();
      const text = data.response || '';
      return JSON.parse(text);
    } catch (error) {
      console.error('AI analysis failed:', error);
      return {
        summary: 'Analysis failed',
        sentiment_score: 50,
        availability_confirmed: false,
        follow_up_required: true,
        rating: 'average',
        negotiation_potential: 50
      };
    }
  };

  const calculateSummaryStats = (quotations: QuotationData[]) => {
    const stats = {
      total_sent: quotations.length,
      responses_received: quotations.filter(q => q.response_received).length,
      avg_response_time: 0,
      total_quoted_amount: 0,
      best_deals: [] as QuotationData[]
    };

    // Calculate average response time
    const responseTimes = quotations
      .filter(q => q.response_received && q.response_date)
      .map(q => {
        const sent = new Date(q.email_sent_date).getTime();
        const received = new Date(q.response_date!).getTime();
        return (received - sent) / (1000 * 60 * 60 * 24); // days
      });

    if (responseTimes.length > 0) {
      stats.avg_response_time = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    }

    // Calculate total quoted amount
    stats.total_quoted_amount = quotations
      .filter(q => q.quoted_price)
      .reduce((sum, q) => sum + (q.quoted_price || 0), 0);

    // Find best deals (excellent rating with competitive pricing)
    stats.best_deals = quotations
      .filter(q => q.rating === 'excellent' && q.quoted_price)
      .sort((a, b) => (a.quoted_price || 0) - (b.quoted_price || 0))
      .slice(0, 3);

    setSummaryStats(stats);
  };

  const getStatusIcon = (quotation: QuotationData) => {
    if (!quotation.response_received) {
      return <Clock className="h-4 w-4 text-gray-500" />;
    }
    if (quotation.follow_up_required) {
      return <AlertCircle className="h-4 w-4 text-rose-500" />;
    }
    return <CheckCircle className="h-4 w-4 text-sage-500" />;
  };

  const getStatusText = (quotation: QuotationData) => {
    if (!quotation.response_received) return 'Pending';
    if (quotation.follow_up_required) return 'Follow-up Required';
    return 'Completed';
  };

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'excellent': return 'text-sage-600 bg-sage-100';
      case 'good': return 'text-gray-600 bg-gray-100';
      case 'average': return 'text-gray-600 bg-gray-100';
      case 'poor': return 'text-rose-600 bg-rose-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const exportToCSV = () => {
    const headers = ['Vendor', 'Category', 'Status', 'Price', 'Rating', 'Sent Date', 'Response Date'];
    const rows = quotations.map(q => [
      q.vendor_name,
      q.vendor_category,
      getStatusText(q),
      q.quoted_price ? `₹${q.quoted_price.toLocaleString()}` : '-',
      q.rating || '-',
      q.email_sent_date,
      q.response_date || '-'
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wedding-quotations-${weddingId}.csv`;
    a.click();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
        <span className="ml-2">Loading quotations...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <Mail className="h-5 w-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-900">Emails Sent</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {summaryStats.total_sent}
          </div>
        </div>

        <div className="bg-sage-50 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-sage-600" />
            <span className="text-sm font-medium text-sage-900">Responses</span>
          </div>
          <div className="text-2xl font-bold text-sage-900 mt-1">
            {summaryStats.responses_received}
            <span className="text-sm font-normal ml-1">
              ({Math.round((summaryStats.responses_received / summaryStats.total_sent) * 100)}%)
            </span>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-900">Avg Response</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {summaryStats.avg_response_time.toFixed(1)}
            <span className="text-sm font-normal ml-1">days</span>
          </div>
        </div>

        <div className="bg-rose-50 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5 text-rose-600" />
            <span className="text-sm font-medium text-rose-900">Total Quoted</span>
          </div>
          <div className="text-2xl font-bold text-rose-900 mt-1">
            ₹{summaryStats.total_quoted_amount.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Table Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Vendor Quotations</h3>
        <button
          onClick={exportToCSV}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <Download className="h-4 w-4" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Quotations Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vendor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quote
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  AI Rating
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Response
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {quotations.map((quotation) => (
                <tr key={quotation.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {quotation.vendor_name}
                      </div>
                      <div className="text-sm text-gray-500 capitalize">
                        {quotation.vendor_category}
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(quotation)}
                      <span className="text-sm text-gray-900">
                        {getStatusText(quotation)}
                      </span>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    {quotation.quoted_price ? (
                      <div className="text-sm font-medium text-gray-900">
                        ₹{quotation.quoted_price.toLocaleString()}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">Not quoted</span>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    {quotation.rating && (
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRatingColor(quotation.rating)}`}>
                        {quotation.rating}
                      </span>
                    )}
                    {quotation.sentiment_score && (
                      <div className="text-xs text-gray-500 mt-1">
                        Sentiment: {quotation.sentiment_score}%
                      </div>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {quotation.response_date ? (
                      new Date(quotation.response_date).toLocaleDateString()
                    ) : (
                      <span>-</span>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => {
                        setSelectedQuotation(quotation);
                        setShowDetails(true);
                      }}
                      className="text-rose-600 hover:text-rose-900 flex items-center space-x-1"
                    >
                      <FileText className="h-4 w-4" />
                      <span>Details</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Best Deals Section */}
      {summaryStats.best_deals.length > 0 && (
        <div className="bg-sage-50 p-6 rounded-lg">
          <h4 className="text-lg font-semibold text-sage-900 mb-4 flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Best Deals Found</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {summaryStats.best_deals.map((deal) => (
              <div key={deal.id} className="bg-white p-4 rounded-lg border border-sage-200">
                <div className="font-medium text-gray-900">{deal.vendor_name}</div>
                <div className="text-sm text-gray-600 capitalize">{deal.vendor_category}</div>
                <div className="text-lg font-bold text-sage-600 mt-2">
                  ₹{deal.quoted_price?.toLocaleString()}
                </div>
                {deal.ai_summary && (
                  <div className="text-xs text-gray-600 mt-2 line-clamp-2">
                    {deal.ai_summary}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detailed Modal */}
      {showDetails && selectedQuotation && (
        <QuotationDetailModal
          quotation={selectedQuotation}
          onClose={() => setShowDetails(false)}
        />
      )}
    </div>
  );
};

interface QuotationDetailModalProps {
  quotation: QuotationData;
  onClose: () => void;
}

const QuotationDetailModal: React.FC<QuotationDetailModalProps> = ({ quotation, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">{quotation.vendor_name} - Quotation Details</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {quotation.ai_summary && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">AI Summary</h4>
              <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">{quotation.ai_summary}</p>
            </div>
          )}

          {quotation.package_details && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Package Details</h4>
              <p className="text-sm text-gray-700">{quotation.package_details}</p>
            </div>
          )}

          {quotation.quoted_price && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Pricing</h4>
              <div className="text-2xl font-bold text-sage-600">
                ₹{quotation.quoted_price.toLocaleString()}
              </div>
            </div>
          )}

          {quotation.negotiation_potential && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Negotiation Potential</h4>
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-rose-600 h-2 rounded-full"
                    style={{ width: `${quotation.negotiation_potential}%` }}
                  ></div>
                </div>
                <span className="text-sm text-gray-600">{quotation.negotiation_potential}%</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
