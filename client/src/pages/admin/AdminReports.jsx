import { useState, useEffect } from 'react';
import { getAdminSummary, downloadPurchasesCsv, downloadUsageCsv, getPurchasesData, getUsageData } from '../../api/adminApi';
import { showToast } from '../../utils/toast';

function AdminReports() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloadingPurchases, setDownloadingPurchases] = useState(false);
  const [downloadingUsage, setDownloadingUsage] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewType, setViewType] = useState(null); // 'purchases' or 'usage'
  const [viewData, setViewData] = useState([]);
  const [loadingViewData, setLoadingViewData] = useState(false);
  const [viewPage, setViewPage] = useState(1);
  const [viewPagination, setViewPagination] = useState({ page: 1, limit: 50, total: 0, pages: 1 });

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const response = await getAdminSummary();
      if (response.success && response.data) {
        setSummary(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch summary:', error);
      showToast.error('Failed to load reports data');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPurchases = async () => {
    try {
      setDownloadingPurchases(true);
      const blob = await downloadPurchasesCsv();
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `purchases-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      showToast.success('Purchases CSV downloaded successfully!');
    } catch (error) {
      console.error('Failed to download purchases CSV:', error);
      showToast.error('Failed to download purchases CSV');
    } finally {
      setDownloadingPurchases(false);
    }
  };

  const handleDownloadUsage = async () => {
    try {
      setDownloadingUsage(true);
      const blob = await downloadUsageCsv();
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `usage-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      showToast.success('Usage CSV downloaded successfully!');
    } catch (error) {
      console.error('Failed to download usage CSV:', error);
      showToast.error('Failed to download usage CSV');
    } finally {
      setDownloadingUsage(false);
    }
  };

  const handleViewReport = async (type) => {
    try {
      setViewType(type);
      setShowViewModal(true);
      setLoadingViewData(true);
      setViewPage(1);
      
      const response = type === 'purchases' 
        ? await getPurchasesData({ page: 1, limit: 50 })
        : await getUsageData({ page: 1, limit: 50 });
      
      if (response.success && response.data) {
        setViewData(response.data.data || []);
        setViewPagination(response.data.pagination || {});
      }
    } catch (error) {
      console.error(`Failed to fetch ${type} data:`, error);
      showToast.error(`Failed to load ${type} data`);
    } finally {
      setLoadingViewData(false);
    }
  };

  const fetchViewData = async (pageNum) => {
    if (!viewType) return;
    
    try {
      setLoadingViewData(true);
      const response = viewType === 'purchases'
        ? await getPurchasesData({ page: pageNum, limit: 50 })
        : await getUsageData({ page: pageNum, limit: 50 });
      
      if (response.success && response.data) {
        setViewData(response.data.data || []);
        setViewPagination(response.data.pagination || {});
      }
    } catch (error) {
      console.error(`Failed to fetch ${viewType} data:`, error);
      showToast.error(`Failed to load ${viewType} data`);
    } finally {
      setLoadingViewData(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const formatCurrency = (amount, currency = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-mh-green mb-4"></div>
          <p className="text-mh-dark">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-mh-dark">Reports</h1>
        <p className="text-gray-600 mt-1">Detailed reports and analytics</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-mh-dark mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mh-green focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mh-green focus:border-transparent"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setDateRange({ start: '', end: '' })}
              className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Purchases</p>
              <p className="text-3xl font-bold text-mh-dark mt-2">
                {summary?.purchasesCount || 0}
              </p>
            </div>
            <div className="bg-[#E8F1EE] rounded-full p-3">
              <svg className="w-8 h-8 text-mh-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Paid Purchases</p>
              <p className="text-3xl font-bold text-mh-dark mt-2">
                {summary?.paidCount || 0}
              </p>
            </div>
            <div className="bg-[#E8F1EE] rounded-full p-3">
              <svg className="w-8 h-8 text-mh-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Attempts Started</p>
              <p className="text-3xl font-bold text-mh-dark mt-2">
                {summary?.attemptsStarted || 0}
              </p>
            </div>
            <div className="bg-[#E8F1EE] rounded-full p-3">
              <svg className="w-8 h-8 text-mh-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Attempts Completed</p>
              <p className="text-3xl font-bold text-mh-dark mt-2">
                {summary?.attemptsCompleted || 0}
              </p>
            </div>
            <div className="bg-[#E8F1EE] rounded-full p-3">
              <svg className="w-8 h-8 text-mh-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Export Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-mh-dark mb-4">Reports</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Purchases Report */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-[#E8F1EE] rounded-lg p-2">
                <svg className="w-6 h-6 text-mh-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-mh-dark">Purchases Report</p>
                <p className="text-sm text-gray-600">View or download purchase data</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleViewReport('purchases')}
                className="flex-1 px-4 py-2 bg-mh-gradient text-white rounded-lg hover:opacity-90 transition font-medium flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                View
              </button>
              <button
                onClick={handleDownloadPurchases}
                disabled={downloadingPurchases}
                className="flex-1 px-4 py-2 border-2 border-mh-green text-mh-green rounded-lg hover:bg-mh-green hover:text-white transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {downloadingPurchases ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-mh-green"></div>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Usage Report */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-[#E8F1EE] rounded-lg p-2">
                <svg className="w-6 h-6 text-mh-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-mh-dark">Usage Report</p>
                <p className="text-sm text-gray-600">View or download test attempts data</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleViewReport('usage')}
                className="flex-1 px-4 py-2 bg-mh-gradient text-white rounded-lg hover:opacity-90 transition font-medium flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                View
              </button>
              <button
                onClick={handleDownloadUsage}
                disabled={downloadingUsage}
                className="flex-1 px-4 py-2 border-2 border-mh-green text-mh-green rounded-lg hover:bg-mh-green hover:text-white transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {downloadingUsage ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-mh-green"></div>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* View Report Modal */}
      {showViewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-mh-dark">
                    {viewType === 'purchases' ? 'Purchases Report' : 'Usage Report'}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Total: {viewPagination.total} records
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setViewType(null);
                    setViewData([]);
                    setViewPage(1);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {loadingViewData ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-mh-green mb-4"></div>
                    <p className="text-gray-600">Loading data...</p>
                  </div>
                </div>
              ) : viewData.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No data found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        {viewType === 'purchases' ? (
                          <>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Test</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                          </>
                        ) : (
                          <>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Test</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Started At</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitted At</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {viewData.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          {viewType === 'purchases' ? (
                            <>
                              <td className="px-4 py-3">
                                <div className="text-sm font-medium text-gray-900">{item.userName || item.user}</div>
                                <div className="text-xs text-gray-500">{item.user}</div>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">{item.test}</td>
                              <td className="px-4 py-3 text-sm text-gray-900">{formatCurrency(item.amount, item.currency)}</td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                  item.status === 'paid' 
                                    ? 'bg-green-100 text-green-800' 
                                    : item.status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {item.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-500 font-mono">{item.orderId || '-'}</td>
                              <td className="px-4 py-3 text-sm text-gray-500">{formatDate(item.createdAt)}</td>
                            </>
                          ) : (
                            <>
                              <td className="px-4 py-3">
                                <div className="text-sm font-medium text-gray-900">{item.userName || item.user}</div>
                                <div className="text-xs text-gray-500">{item.user}</div>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">{item.test}</td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                  item.status === 'submitted' 
                                    ? 'bg-green-100 text-green-800' 
                                    : item.status === 'in_progress'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {item.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-500">{formatDate(item.startedAt)}</td>
                              <td className="px-4 py-3 text-sm text-gray-500">{formatDate(item.submittedAt)}</td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Footer with Pagination */}
            {viewPagination.pages > 1 && (
              <div className="p-6 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {((viewPagination.page - 1) * viewPagination.limit) + 1} to {Math.min(viewPagination.page * viewPagination.limit, viewPagination.total)} of {viewPagination.total} records
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const newPage = viewPage - 1;
                        setViewPage(newPage);
                        fetchViewData(newPage);
                      }}
                      disabled={viewPage === 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => {
                        const newPage = viewPage + 1;
                        setViewPage(newPage);
                        fetchViewData(newPage);
                      }}
                      disabled={viewPage >= viewPagination.pages}
                      className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminReports;

