import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { getAllAssessments } from '../../api/assessmentApi';
import { createGroupAssessmentLink, getGroupAssessmentLinks, deleteGroupAssessmentLink } from '../../api/adminApi';
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
    </div>
  );
}

export default AdminGroupAssessments;

