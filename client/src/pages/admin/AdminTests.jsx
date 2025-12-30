import { useState, useEffect } from 'react';
import { getAdminTests, getAdminTestById, updateTest, deleteTest } from '../../api/adminApi';
import { showToast } from '../../utils/toast';

function AdminTests() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [selectedTest, setSelectedTest] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

  useEffect(() => {
    fetchTests();
  }, [page, search, isActiveFilter]);

  const fetchTests = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 20,
        ...(search && { search }),
        ...(isActiveFilter && { isActive: isActiveFilter })
      };
      const response = await getAdminTests(params);
      if (response.success && response.data) {
        setTests(response.data.tests || []);
        setPagination(response.data.pagination || {});
      }
    } catch (error) {
      console.error('Failed to fetch tests:', error);
      showToast.error('Failed to load tests');
    } finally {
      setLoading(false);
    }
  };

  const handleViewTest = async (testId) => {
    try {
      const response = await getAdminTestById(testId);
      if (response.success && response.data) {
        setSelectedTest(response.data);
        setShowViewModal(true);
      }
    } catch (error) {
      console.error('Failed to load test:', error);
      showToast.error('Failed to load test details');
    }
  };

  const handleToggleActive = async (test) => {
    try {
      const response = await updateTest(test._id, { isActive: !test.isActive });
      if (response.success) {
        showToast.success(`Test ${!test.isActive ? 'activated' : 'deactivated'} successfully!`);
        fetchTests();
      }
    } catch (error) {
      console.error('Failed to update test:', error);
      showToast.error('Failed to update test');
    }
  };

  const handleDeleteTest = async (testId) => {
    if (!window.confirm('Are you sure you want to delete this test? This will deactivate it.')) {
      return;
    }
    try {
      const response = await deleteTest(testId);
      if (response.success) {
        showToast.success('Test deleted successfully!');
        fetchTests();
      }
    } catch (error) {
      console.error('Failed to delete test:', error);
      showToast.error('Failed to delete test');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchTests();
  };

  if (loading && tests.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-mh-green mb-4"></div>
          <p className="text-mh-dark">Loading tests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-mh-dark">Tests</h1>
          <p className="text-gray-600 mt-1">Manage mental health assessments</p>
        </div>
        <button
          onClick={() => showToast.info('Create test feature coming soon!')}
          className="bg-mh-green text-white px-6 py-2 rounded-lg hover:bg-[#027a4f] transition-colors"
        >
          Create Test
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title or category..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mh-green focus:border-transparent"
            />
          </div>
          <div className="md:w-48">
            <select
              value={isActiveFilter}
              onChange={(e) => {
                setIsActiveFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mh-green focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
          <button
            type="submit"
            className="bg-mh-green text-white px-6 py-2 rounded-lg hover:bg-[#027a4f] transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {/* Tests Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tests.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
            <p className="text-gray-500">No tests found</p>
          </div>
        ) : (
          tests.map((test) => (
            <div key={test._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-mh-dark mb-2">{test.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{test.category || 'Uncategorized'}</p>
                  <p className="text-xs text-gray-500 line-clamp-2">{test.shortDescription || 'No description'}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  test.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {test.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <span className="text-gray-600">Price:</span>
                  <span className="font-semibold text-mh-dark ml-2">
                    ₹{test.price || 0}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Questions:</span>
                  <span className="font-semibold text-mh-dark ml-2">
                    {test.questionsCount || 0}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-semibold text-mh-dark ml-2">
                    {test.durationMinutesMin || 0}-{test.durationMinutesMax || 0} min
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Popularity:</span>
                  <span className="font-semibold text-mh-dark ml-2">
                    {test.popularityScore || 0}
                  </span>
                </div>
              </div>

              <div className="flex space-x-2 pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleViewTest(test._id)}
                  className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  View
                </button>
                <button
                  onClick={() => handleToggleActive(test)}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors text-sm ${
                    test.isActive
                      ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                      : 'bg-green-100 text-green-800 hover:bg-green-200'
                  }`}
                >
                  {test.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => handleDeleteTest(test._id)}
                  className="bg-red-100 text-red-800 px-4 py-2 rounded-lg hover:bg-red-200 transition-colors text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border border-gray-200 rounded-lg sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= pagination.pages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{(page - 1) * pagination.limit + 1}</span> to{' '}
                <span className="font-medium">{Math.min(page * pagination.limit, pagination.total)}</span> of{' '}
                <span className="font-medium">{pagination.total}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                {[...Array(Math.min(pagination.pages, 5))].map((_, i) => {
                  const pageNum = page <= 3 ? i + 1 : page - 2 + i;
                  if (pageNum > pagination.pages) return null;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === pageNum
                          ? 'z-10 bg-mh-green border-mh-green text-white'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page >= pagination.pages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedTest && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-mh-dark">{selectedTest.title}</h3>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                <div>
                  <label className="text-sm font-medium text-gray-700">Category</label>
                  <p className="text-sm text-gray-900">{selectedTest.category || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Short Description</label>
                  <p className="text-sm text-gray-900">{selectedTest.shortDescription || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Long Description</label>
                  <p className="text-sm text-gray-900">{selectedTest.longDescription || 'N/A'}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Price</label>
                    <p className="text-sm text-gray-900">₹{selectedTest.price || 0}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">MRP</label>
                    <p className="text-sm text-gray-900">₹{selectedTest.mrp || 0}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Questions Count</label>
                    <p className="text-sm text-gray-900">{selectedTest.questionsCount || 0}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Duration</label>
                    <p className="text-sm text-gray-900">
                      {selectedTest.durationMinutesMin || 0}-{selectedTest.durationMinutesMax || 0} minutes
                    </p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <p className="text-sm">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      selectedTest.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedTest.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </p>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminTests;

