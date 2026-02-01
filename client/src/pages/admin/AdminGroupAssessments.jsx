import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { getAllAssessments } from '../../api/assessmentApi';
import { createGroupAssessmentLink, getGroupAssessmentLinks, deleteGroupAssessmentLink, getGroupLinkResults, getGroupAssessmentDetails, downloadGroupAssessmentPDF } from '../../api/adminApi';
import DatePicker from '../../components/DatePicker';
import { showToast } from '../../utils/toast';

function AdminGroupAssessments() {
  const navigate = useNavigate();
  const [groupLinks, setGroupLinks] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createdLink, setCreatedLink] = useState(null);
  const [filter, setFilter] = useState('all');
  const [formData, setFormData] = useState({
    testId: '',
    groupName: '',
    perspectives: [{ perspectiveName: '', maxAttempts: '' }],
    expiresAt: '',
    notes: ''
  });
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [selectedLink, setSelectedLink] = useState(null);
  const [linkResults, setLinkResults] = useState([]);
  const [allLinkResults, setAllLinkResults] = useState([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroupAssessment, setSelectedGroupAssessment] = useState(null);
  const [showGroupDetailsModal, setShowGroupDetailsModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, [filter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filter === 'active') {
        params.isActive = 'true';
      }
      
      const [linksRes, assessmentsRes] = await Promise.all([
        getGroupAssessmentLinks(params),
        getAllAssessments()
      ]);

      if (linksRes.success && linksRes.data) {
        const links = Array.isArray(linksRes.data) ? linksRes.data : (linksRes.data.links || []);
        setGroupLinks(links);
      }
      if (assessmentsRes.success) {
        setAssessments(assessmentsRes.data || []);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      showToast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const convertDateToDateTime = (dateString) => {
    if (!dateString) return null;
    // If it's already in ISO format, return as is
    if (dateString.includes('T')) return dateString;
    // Otherwise, add time to make it end of day
    return `${dateString}T23:59:59.999Z`;
  };

  const convertDateTimeToDate = (dateTimeString) => {
    if (!dateTimeString) return '';
    return dateTimeString.split('T')[0];
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    
    if (!formData.testId) {
      showToast.error('Please select a test');
      return;
    }

    if (!formData.groupName) {
      showToast.error('Please enter a group name');
      return;
    }

    // Validate perspectives
    const validPerspectives = formData.perspectives.filter(p => p.perspectiveName.trim() !== '');
    if (validPerspectives.length === 0) {
      showToast.error('Please add at least one perspective');
      return;
    }

    try {
      setCreating(true);
      const linkData = {
        testId: formData.testId,
        groupName: formData.groupName,
        perspectives: validPerspectives.map(p => ({
          perspectiveName: p.perspectiveName.trim(),
          maxAttempts: p.maxAttempts ? parseInt(p.maxAttempts) : null
        })),
        expiresAt: formData.expiresAt ? convertDateToDateTime(formData.expiresAt) : null,
        notes: formData.notes || ''
      };

      const response = await createGroupAssessmentLink(linkData);
      if (response.success && response.data) {
        showToast.success('Group assessment link created successfully!');
        setCreatedLink(response.data);
        setFormData({
          testId: '',
          groupName: '',
          perspectives: [{ perspectiveName: '', maxAttempts: '' }],
          expiresAt: '',
          notes: ''
        });
        fetchData();
      } else {
        showToast.error(response.message || 'Failed to create group link');
      }
    } catch (error) {
      console.error('Failed to create group link:', error);
      showToast.error(error.response?.data?.message || 'Failed to create group assessment link');
    } finally {
      setCreating(false);
    }
  };

  const handleAddPerspective = () => {
    setFormData({
      ...formData,
      perspectives: [...formData.perspectives, { perspectiveName: '', maxAttempts: '' }]
    });
  };

  const handleRemovePerspective = (index) => {
    if (formData.perspectives.length > 1) {
      const newPerspectives = formData.perspectives.filter((_, i) => i !== index);
      setFormData({
        ...formData,
        perspectives: newPerspectives
      });
    } else {
      showToast.error('At least one perspective is required');
    }
  };

  const handlePerspectiveChange = (index, field, value) => {
    const newPerspectives = [...formData.perspectives];
    newPerspectives[index][field] = value;
    setFormData({
      ...formData,
      perspectives: newPerspectives
    });
  };

  const handleDelete = async (linkId) => {
    if (!window.confirm('Are you sure you want to delete this group assessment link?')) {
      return;
    }

    try {
      await deleteGroupAssessmentLink(linkId);
      showToast.success('Group assessment link deleted successfully');
      fetchData();
    } catch (err) {
      console.error('Error deleting group link:', err);
      showToast.error(err.response?.data?.message || 'Failed to delete group assessment link');
    }
  };

  const handleCopyLink = (token) => {
    const fullLink = `${window.location.origin}/group-assessment-link/${token}/select-role`;
    navigator.clipboard.writeText(fullLink).then(() => {
      showToast.success('Link copied to clipboard!');
    }).catch(() => {
      showToast.error('Failed to copy link');
    });
  };

  const getStatusBadgeClass = (isActive) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
  };

  const getCompletionStatus = (link) => {
    if (link.perspectives && Array.isArray(link.perspectives)) {
      const totalAttempts = link.perspectives.reduce((sum, p) => sum + (p.currentAttempts || 0), 0);
      const totalMaxAttempts = link.perspectives.reduce((sum, p) => sum + (p.maxAttempts || 0), 0);
      if (totalMaxAttempts > 0) {
        return `${totalAttempts}/${totalMaxAttempts} attempts`;
      }
      return `${totalAttempts} attempts`;
    }
    return '0 attempts';
  };

  const handleViewResults = async (link) => {
    try {
      setSelectedLink(link);
      setShowResultsModal(true);
      setLoadingResults(true);
      setSearchQuery('');
      
      // Fetch group assessments organized by student
      const response = await getGroupLinkResults(link._id, { page: 1, limit: 1000 });
      if (response.success && response.data) {
        const allResults = response.data.results || [];
        setAllLinkResults(allResults);
        setLinkResults(allResults);
      }
    } catch (error) {
      console.error('Failed to fetch link results:', error);
      showToast.error('Failed to load results');
    } finally {
      setLoadingResults(false);
    }
  };

  const handleSearch = async () => {
    if (!selectedLink) return;
    
    try {
      setLoadingResults(true);
      const response = await getGroupLinkResults(selectedLink._id, { 
        page: 1, 
        limit: 1000,
        search: searchQuery.trim() || undefined
      });
      if (response.success && response.data) {
        const results = response.data.results || [];
        setLinkResults(results);
      }
    } catch (error) {
      console.error('Failed to search results:', error);
      showToast.error('Failed to search results');
    } finally {
      setLoadingResults(false);
    }
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleViewGroupDetails = async (groupAssessment) => {
    try {
      setLoadingResults(true);
      const response = await getGroupAssessmentDetails(selectedLink._id, groupAssessment._id);
      if (response.success && response.data) {
        setSelectedGroupAssessment(response.data.groupAssessment);
        setShowGroupDetailsModal(true);
      } else {
        showToast.error('Failed to load group assessment details');
      }
    } catch (error) {
      console.error('Failed to fetch group assessment details:', error);
      showToast.error('Failed to load group assessment details');
    } finally {
      setLoadingResults(false);
    }
  };

  const handleDownloadPDF = async (groupAssessment) => {
    try {
      await downloadGroupAssessmentPDF(selectedLink._id, groupAssessment._id);
      showToast.success('PDF downloaded successfully!');
    } catch (error) {
      console.error('Failed to download PDF:', error);
      showToast.error('Failed to download PDF');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-mh-green mb-4"></div>
          <p className="text-mh-dark">Loading group assessments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-mh-dark">Group Assessments</h1>
          <p className="text-gray-600 mt-1">Manage multi-perspective assessments</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-2 bg-mh-gradient text-white rounded-lg hover:opacity-90 transition-opacity"
        >
          Create Group Assessment
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {['all', 'active'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              filter === status
                ? 'border-b-2 border-mh-green text-mh-green'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {status === 'all' ? 'All' : 'Active'}
          </button>
        ))}
      </div>

      {/* Group Assessment Links List */}
      {groupLinks.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <p className="text-gray-500 mb-4">No group assessment links found</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-2 bg-mh-gradient text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            Create Your First Group Assessment Link
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Group Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assessment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Perspectives</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attempts</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {groupLinks.map((link) => (
                  <tr key={link._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{link.groupName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{link.testId?.title || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {link.perspectives?.map((p, idx) => (
                          <span key={idx} className="inline-block mr-2 mb-1">
                            <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-700">
                              {p.perspectiveName}
                            </span>
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(link.isActive)}`}>
                        {link.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{getCompletionStatus(link)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {new Date(link.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleViewResults(link)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 transition-colors whitespace-nowrap"
                          title="View Results"
                        >
                          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Results
                        </button>
                        <button
                          onClick={() => handleCopyLink(link.linkToken)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Copy Link"
                        >
                          Copy Link
                        </button>
                        <button
                          onClick={() => handleDelete(link._id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Create Group Assessment Link</h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreatedLink(null);
                    setFormData({
                      testId: '',
                      groupName: '',
                      perspectives: [{ perspectiveName: '', maxAttempts: '' }],
                      expiresAt: '',
                      notes: ''
                    });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {createdLink ? (
              <div className="p-6 space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800 font-semibold mb-2">Group Link Created Successfully!</p>
                  <div className="bg-white rounded p-3 mb-3">
                    <p className="text-xs text-gray-500 mb-1">Shareable Link:</p>
                    <p className="text-xs font-mono break-all">{window.location.origin}/group-assessment-link/{createdLink.linkToken}/select-role</p>
                  </div>
                  <button
                    onClick={() => handleCopyLink(createdLink.linkToken)}
                    className="w-full px-4 py-2 bg-mh-gradient text-white rounded-lg font-medium hover:opacity-90"
                  >
                    Copy Link
                  </button>
                </div>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreatedLink(null);
                    setFormData({
                      testId: '',
                      groupName: '',
                      perspectives: [{ perspectiveName: '', maxAttempts: '' }],
                      expiresAt: '',
                      notes: ''
                    });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreate} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Test <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.testId}
                    onChange={(e) => setFormData({ ...formData, testId: e.target.value })}
                    required
                    className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mh-green focus:border-transparent text-sm sm:text-base"
                  >
                    <option value="">Select a test</option>
                    {assessments.map((test) => (
                      <option key={test._id} value={test._id}>
                        {test.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Group Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.groupName}
                    onChange={(e) => setFormData({ ...formData, groupName: e.target.value })}
                    placeholder="e.g., John Doe - Character Assessment"
                    required
                    className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mh-green focus:border-transparent text-sm sm:text-base"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Perspectives <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-3">
                    {formData.perspectives.map((perspective, index) => (
                      <div key={index} className="flex gap-2 items-start">
                        <div className="flex-1">
                          <input
                            type="text"
                            value={perspective.perspectiveName}
                            onChange={(e) => handlePerspectiveChange(index, 'perspectiveName', e.target.value)}
                            placeholder="e.g., Student, Parent, Teacher"
                            required={index === 0}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mh-green focus:border-transparent text-sm"
                          />
                        </div>
                        <div className="w-32">
                          <input
                            type="number"
                            value={perspective.maxAttempts}
                            onChange={(e) => handlePerspectiveChange(index, 'maxAttempts', e.target.value)}
                            placeholder="Max attempts"
                            min="1"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mh-green focus:border-transparent text-sm"
                          />
                        </div>
                        {formData.perspectives.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemovePerspective(index)}
                            className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={handleAddPerspective}
                      className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-mh-green hover:bg-green-50 text-gray-600 hover:text-mh-green text-sm"
                    >
                      + Add Perspective
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Each perspective represents a role (e.g., Student, Parent, Teacher)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expiration Date (Optional)
                  </label>
                  <DatePicker
                    value={formData.expiresAt && formData.expiresAt.includes('T') ? convertDateTimeToDate(formData.expiresAt) : formData.expiresAt || ''}
                    onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                    placeholder="Select expiration date"
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mh-green focus:border-transparent text-sm sm:text-base"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional notes about this group assessment"
                    rows={3}
                    className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mh-green focus:border-transparent text-sm sm:text-base"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setFormData({
                        testId: '',
                        groupName: '',
                        perspectives: [{ perspectiveName: '', maxAttempts: '' }],
                        expiresAt: '',
                        notes: ''
                      });
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm sm:text-base"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 text-sm sm:text-base"
                  >
                    {creating ? 'Creating...' : 'Create Group Link'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Results Modal */}
      {showResultsModal && selectedLink && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[95vh] overflow-hidden flex flex-col">
            <div className="p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl sm:text-2xl font-bold text-mh-dark">Group Assessment Results</h2>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1 truncate">
                    View results organized by student name. Results from group assessment links will show student names (e.g., "Bala").
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {selectedLink.testId?.title || 'N/A'} - {linkResults.length} student{linkResults.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowResultsModal(false);
                    setSelectedLink(null);
                    setLinkResults([]);
                    setAllLinkResults([]);
                    setSearchQuery('');
                  }}
                  className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Search */}
              <div className="mt-4 flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleSearchKeyPress}
                  placeholder="Search by student name (e.g., Bala)..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mh-green focus:border-transparent text-sm"
                />
                <button
                  onClick={handleSearch}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Search
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {loadingResults ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-mh-green mb-4"></div>
                    <p className="text-gray-600 text-sm">Loading results...</p>
                  </div>
                </div>
              ) : linkResults.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-sm">No results found for this group assessment link</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Desktop Table */}
                  <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student/Group Name</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assessment</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Perspectives</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {linkResults.map((result) => (
                          <tr key={result._id} className="hover:bg-gray-50">
                            <td className="px-4 py-4">
                              <div className="text-sm font-medium text-gray-900">
                                {result.studentName || result.groupName}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {result.completedCount}/{result.totalPerspectives} completed
                              </div>
                              {result.studentProfile && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {result.studentProfile.classGrade} • {result.studentProfile.school || 'No school'}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-sm text-gray-900">{result.assessment}</div>
                              <div className="text-xs text-gray-500">{result.questionsCount} Q</div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex flex-wrap gap-1">
                                {result.perspectives.map((p, idx) => (
                                  <span
                                    key={idx}
                                    className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded ${
                                      p.completed
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-gray-100 text-gray-600'
                                    }`}
                                  >
                                    {p.name}
                                    {p.completed && (
                                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    )}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                result.status === 'completed'
                                  ? 'bg-green-100 text-green-800'
                                  : result.status === 'in_progress'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {result.status || 'pending'}
                              </span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                              {result.createdAt ? new Date(result.createdAt).toLocaleDateString() : '-'}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleViewGroupDetails(result)}
                                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                >
                                  View Details
                                </button>
                                <button
                                  onClick={() => handleDownloadPDF(result)}
                                  className="text-xs text-green-600 hover:text-green-800 font-medium"
                                >
                                  Download PDF
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile/Tablet Card View */}
                  <div className="lg:hidden space-y-3">
                    {linkResults.map((result) => (
                      <div key={result._id} className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">
                              {result.studentName || result.groupName}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {result.completedCount}/{result.totalPerspectives} completed
                            </div>
                            {result.studentProfile && (
                              <div className="text-xs text-gray-500 mt-1">
                                {result.studentProfile.classGrade} • {result.studentProfile.school || 'No school'}
                              </div>
                            )}
                          </div>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            result.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : result.status === 'in_progress'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {result.status || 'pending'}
                          </span>
                        </div>
                        <div className="mb-3">
                          <div className="text-xs text-gray-500 mb-1">Assessment</div>
                          <div className="text-sm text-gray-900">{result.assessment}</div>
                          <div className="text-xs text-gray-500">{result.questionsCount} Q</div>
                        </div>
                        <div className="mb-3">
                          <div className="text-xs text-gray-500 mb-1">Perspectives</div>
                          <div className="flex flex-wrap gap-1">
                            {result.perspectives.map((p, idx) => (
                              <span
                                key={idx}
                                className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded ${
                                  p.completed
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {p.name}
                                {p.completed && (
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2 pt-3 border-t border-gray-100">
                          <button
                            onClick={() => handleViewGroupDetails(result)}
                            className="flex-1 text-xs text-blue-600 hover:text-blue-800 font-medium py-2"
                          >
                            View Details
                          </button>
                          <button
                            onClick={() => handleDownloadPDF(result)}
                            className="flex-1 text-xs text-green-600 hover:text-green-800 font-medium py-2"
                          >
                            Download PDF
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Group Assessment Details Modal - Combined Report */}
      {showGroupDetailsModal && selectedGroupAssessment && (() => {
        const perspectiveNames = selectedGroupAssessment.perspectives
          .map(p => p.name)
          .filter(name => selectedGroupAssessment.results?.[name]);
        const hasAllResults = perspectiveNames.length > 0;
        const allCategories = new Set();
        if (hasAllResults) {
          perspectiveNames.forEach(name => {
            if (selectedGroupAssessment.results[name]?.categoryResults) {
              Object.keys(selectedGroupAssessment.results[name].categoryResults).forEach(cat => allCategories.add(cat));
            }
          });
        }

        const getBandColorClass = (band) => {
          if (!band) return 'bg-gray-100 text-gray-800';
          const bandLower = band.toLowerCase();
          if (bandLower.includes('severe') || bandLower.includes('high')) {
            return 'bg-red-100 text-red-800';
          } else if (bandLower.includes('moderate') || bandLower.includes('medium')) {
            return 'bg-orange-100 text-orange-800';
          } else if (bandLower.includes('mild') || bandLower.includes('low')) {
            return 'bg-yellow-100 text-yellow-800';
          } else if (bandLower.includes('normal') || bandLower.includes('minimal')) {
            return 'bg-green-100 text-green-800';
          }
          return 'bg-blue-100 text-blue-800';
        };

        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[95vh] overflow-hidden flex flex-col">
              <div className="p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl sm:text-2xl font-bold text-mh-dark">Combined Assessment Report</h2>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                      {selectedGroupAssessment.groupName} - {selectedGroupAssessment.test?.title || 'N/A'}
                    </p>
                    {selectedGroupAssessment.studentProfile && (
                      <p className="text-xs text-gray-500 mt-1">
                        Student: {selectedGroupAssessment.studentProfile.name}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setShowGroupDetailsModal(false);
                      setSelectedGroupAssessment(null);
                    }}
                    className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                  >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                {/* Student Profile Info */}
                {selectedGroupAssessment.studentProfile && (
                  <div className="mb-6 bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Student Profile</h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500">Name:</span>
                        <span className="ml-2 font-medium text-gray-900">{selectedGroupAssessment.studentProfile.name}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Parent Name:</span>
                        <span className="ml-2 font-medium text-gray-900">{selectedGroupAssessment.studentProfile.parentName || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Class/Grade:</span>
                        <span className="ml-2 font-medium text-gray-900">{selectedGroupAssessment.studentProfile.classGrade || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">School:</span>
                        <span className="ml-2 font-medium text-gray-900">{selectedGroupAssessment.studentProfile.school || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Overall Scores Comparison */}
                {hasAllResults && (
                  <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Overall Scores Comparison</h2>
                    <div className={`grid grid-cols-1 ${perspectiveNames.length === 2 ? 'md:grid-cols-2' : perspectiveNames.length >= 3 ? 'md:grid-cols-3' : 'md:grid-cols-1'} gap-4`}>
                      {perspectiveNames.map((perspectiveName) => {
                        const result = selectedGroupAssessment.results[perspectiveName];
                        if (!result) return null;
                        
                        return (
                          <div key={perspectiveName} className="border border-gray-200 rounded-lg p-4">
                            <div className="text-sm text-gray-500 mb-2">{perspectiveName}</div>
                            <div className="text-3xl font-bold text-gray-900 mb-1">{result.score || 0}</div>
                            {result.band && (
                              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getBandColorClass(result.band)}`}>
                                {result.band}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Category Results Comparison */}
                {hasAllResults && allCategories.size > 0 && (
                  <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Category Results Comparison</h2>
                    <div className="space-y-4">
                      {Array.from(allCategories).sort().map((categoryName) => {
                        return (
                          <div key={categoryName} className="border border-gray-200 rounded-lg p-4">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">{categoryName}</h3>
                            <div className={`grid grid-cols-1 ${perspectiveNames.length === 2 ? 'md:grid-cols-2' : perspectiveNames.length >= 3 ? 'md:grid-cols-3' : 'md:grid-cols-1'} gap-4`}>
                              {perspectiveNames.map((perspectiveName) => {
                                const cat = selectedGroupAssessment.results[perspectiveName]?.categoryResults?.[categoryName];
                                if (!cat) return null;
                                
                                return (
                                  <div key={perspectiveName}>
                                    <div className="text-sm text-gray-500 mb-1">{perspectiveName}</div>
                                    <div className="text-2xl font-bold text-gray-900 mb-1">{cat.score || 0}</div>
                                    {cat.band && (
                                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getBandColorClass(cat.band)}`}>
                                        {cat.band}
                                      </span>
                                    )}
                                    {cat.bandDescription && (
                                      <p className="text-xs text-gray-600 mt-2">{cat.bandDescription}</p>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Individual Results Details */}
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Individual Results Details</h2>
                  {selectedGroupAssessment.perspectives.map((perspective, idx) => {
                    const result = selectedGroupAssessment.results?.[perspective.name];
                    return (
                      <div key={idx} className="bg-white rounded-xl shadow-lg p-6">
                        <div className="flex items-center gap-2 mb-4">
                          <h3 className="text-lg font-bold text-gray-900">{perspective.name} Perspective</h3>
                          {perspective.completed ? (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                              ✓ Completed
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                              Pending
                            </span>
                          )}
                        </div>
                        {result ? (
                          <div className="space-y-3">
                            <div>
                              <span className="text-sm text-gray-500">Score:</span>
                              <span className="ml-2 text-lg font-semibold text-gray-900">{result.score || 0}</span>
                            </div>
                            {result.band && (
                              <div>
                                <span className="text-sm text-gray-500">Severity Level:</span>
                                <span className={`ml-2 px-3 py-1 rounded-full text-sm font-medium ${getBandColorClass(result.band)}`}>
                                  {result.band}
                                </span>
                              </div>
                            )}
                            {result.bandDescription && (
                              <div>
                                <span className="text-sm text-gray-500">Description:</span>
                                <p className="mt-1 text-gray-700">{result.bandDescription}</p>
                              </div>
                            )}
                            {result.riskFlags && Object.keys(result.riskFlags).length > 0 && (
                              <div>
                                <span className="text-sm text-gray-500">Risk Flags:</span>
                                <div className="mt-1 bg-red-50 border border-red-200 rounded p-2">
                                  {Object.keys(result.riskFlags).map((flag, flagIdx) => (
                                    <div key={flagIdx} className="text-xs text-red-800">
                                      • {flag}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {result.interpretation && (
                              <div>
                                <span className="text-sm text-gray-500">Interpretation:</span>
                                <p className="mt-1 text-gray-700 text-sm">{result.interpretation.text || 'N/A'}</p>
                              </div>
                            )}
                            {result.createdAt && (
                              <div>
                                <span className="text-sm text-gray-500">Completed:</span>
                                <span className="ml-2 text-sm text-gray-700">
                                  {new Date(result.createdAt).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">No results available for this perspective yet.</p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Status and Dates */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Status:</span>
                      <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${
                        selectedGroupAssessment.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : selectedGroupAssessment.status === 'in_progress'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedGroupAssessment.status || 'pending'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Created:</span>
                      <span className="ml-2 text-gray-900">
                        {selectedGroupAssessment.createdAt ? new Date(selectedGroupAssessment.createdAt).toLocaleString() : 'N/A'}
                      </span>
                    </div>
                    {selectedGroupAssessment.completedAt && (
                      <div>
                        <span className="text-gray-500">Completed:</span>
                        <span className="ml-2 text-gray-900">
                          {new Date(selectedGroupAssessment.completedAt).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

export default AdminGroupAssessments;

