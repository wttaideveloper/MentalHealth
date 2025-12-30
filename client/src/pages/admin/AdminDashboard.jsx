import { useState, useEffect } from 'react';
import { getAdminSummary, downloadPurchasesCsv, downloadUsageCsv } from '../../api/adminApi';
import { showToast } from '../../utils/toast';

function AdminDashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloadingPurchases, setDownloadingPurchases] = useState(false);
  const [downloadingUsage, setDownloadingUsage] = useState(false);

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
      showToast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPurchases = async () => {
    try {
      setDownloadingPurchases(true);
      const blob = await downloadPurchasesCsv();
      
      // Create download link
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
      
      // Create download link
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-mh-green mb-4"></div>
          <p className="text-mh-dark">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-mh-dark">Dashboard</h1>
          <p className="text-gray-600 mt-1">Overview of your platform statistics</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleDownloadPurchases}
            disabled={downloadingPurchases}
            className="bg-mh-green text-white px-4 py-2 rounded-lg hover:bg-[#027a4f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {downloadingPurchases ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Downloading...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Export Purchases</span>
              </>
            )}
          </button>
          <button
            onClick={handleDownloadUsage}
            disabled={downloadingUsage}
            className="bg-mh-green text-white px-4 py-2 rounded-lg hover:bg-[#027a4f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {downloadingUsage ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Downloading...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Export Usage</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Purchases Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
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

        {/* Paid Purchases Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
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

        {/* Attempts Started Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
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

        {/* Attempts Completed Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
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

      {/* Additional Stats Section */}
      {summary && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Completion Rate Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-mh-dark mb-4">Completion Rate</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Completion Percentage</span>
                  <span className="font-semibold text-mh-dark">
                    {summary.attemptsStarted > 0
                      ? Math.round((summary.attemptsCompleted / summary.attemptsStarted) * 100)
                      : 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-mh-gradient h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${summary.attemptsStarted > 0
                        ? (summary.attemptsCompleted / summary.attemptsStarted) * 100
                        : 0}%`
                    }}
                  ></div>
                </div>
              </div>
              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Started</span>
                  <span className="text-sm font-semibold text-mh-dark">{summary.attemptsStarted}</span>
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-sm text-gray-600">Completed</span>
                  <span className="text-sm font-semibold text-mh-green">{summary.attemptsCompleted}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Status Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-mh-dark mb-4">Payment Status</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Payment Success Rate</span>
                  <span className="font-semibold text-mh-dark">
                    {summary.purchasesCount > 0
                      ? Math.round((summary.paidCount / summary.purchasesCount) * 100)
                      : 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-mh-gradient h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${summary.purchasesCount > 0
                        ? (summary.paidCount / summary.purchasesCount) * 100
                        : 0}%`
                    }}
                  ></div>
                </div>
              </div>
              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Orders</span>
                  <span className="text-sm font-semibold text-mh-dark">{summary.purchasesCount}</span>
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-sm text-gray-600">Paid</span>
                  <span className="text-sm font-semibold text-mh-green">{summary.paidCount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-mh-dark mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={handleDownloadPurchases}
            disabled={downloadingPurchases}
            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center space-x-3">
              <div className="bg-[#E8F1EE] rounded-lg p-2">
                <svg className="w-6 h-6 text-mh-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="font-semibold text-mh-dark">Export Purchases</p>
                <p className="text-sm text-gray-600">Download all purchase data as CSV</p>
              </div>
            </div>
            {downloadingPurchases && (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-mh-green"></div>
            )}
          </button>

          <button
            onClick={handleDownloadUsage}
            disabled={downloadingUsage}
            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center space-x-3">
              <div className="bg-[#E8F1EE] rounded-lg p-2">
                <svg className="w-6 h-6 text-mh-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="font-semibold text-mh-dark">Export Usage</p>
                <p className="text-sm text-gray-600">Download test attempts data as CSV</p>
              </div>
            </div>
            {downloadingUsage && (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-mh-green"></div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
