import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import Breadcrumb from '../../components/Breadcrumb';
import { getGroupAssessments, deleteGroupAssessment } from '../../api/groupAssessmentApi';

function GroupAssessmentDashboardPage() {
  const navigate = useNavigate();
  const [groupAssessments, setGroupAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, in_progress, completed

  useEffect(() => {
    fetchGroupAssessments();
  }, [filter]);

  const fetchGroupAssessments = async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await getGroupAssessments(params);
      
      if (response.success && response.data) {
        // Handle both old format (array) and new format ({ groupAssessments: [] })
        const assessments = Array.isArray(response.data) 
          ? response.data 
          : (response.data.groupAssessments || []);
        setGroupAssessments(assessments);
      } else {
        setGroupAssessments([]);
      }
    } catch (err) {
      console.error('Error fetching group assessments:', err);
      toast.error('Failed to load group assessments');
      setGroupAssessments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (groupId, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this group assessment?')) {
      return;
    }

    try {
      await deleteGroupAssessment(groupId);
      toast.success('Group assessment deleted successfully');
      fetchGroupAssessments();
    } catch (err) {
      console.error('Error deleting group assessment:', err);
      toast.error(err.response?.data?.message || 'Failed to delete group assessment');
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCompletionStatus = (groupAssessment) => {
    if (groupAssessment.perspectives && Array.isArray(groupAssessment.perspectives)) {
      const completedCount = groupAssessment.perspectives.filter(p => p.resultId).length;
      const totalCount = groupAssessment.perspectives.length;
      return `${completedCount}/${totalCount} completed`;
    }
    // Fallback for old data structure
    const results = [
      groupAssessment.studentResultId ? 'Student' : null,
      groupAssessment.parentResultId ? 'Parent' : null,
      groupAssessment.teacherResultId ? 'Teacher' : null
    ].filter(Boolean);
    return `${results.length}/3 completed`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-40 py-6">
        <Breadcrumb isLoggedIn={true} customLabel="Group Assessments" />
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-40 py-6">
      <Breadcrumb isLoggedIn={true} customLabel="Group Assessments" />
      
      <div className="mt-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Group Assessments</h1>
          <button
            onClick={() => navigate('/user/group-assessments/create')}
            className="px-6 py-2 bg-mh-gradient text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            Create New Group Assessment
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          {['all', 'pending', 'in_progress', 'completed'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                filter === status
                  ? 'border-b-2 border-mh-green text-mh-green'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Group Assessments List */}
        {groupAssessments.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <p className="text-gray-500 mb-4">No group assessments found</p>
            <button
              onClick={() => navigate('/user/group-assessments/create')}
              className="px-6 py-2 bg-mh-gradient text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              Create Your First Group Assessment
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {groupAssessments.map((groupAssessment) => (
              <div
                key={groupAssessment._id}
                onClick={() => {
                  if (groupAssessment.status === 'completed') {
                    navigate(`/user/group-assessments/${groupAssessment._id}/report`);
                  } else {
                    navigate(`/user/group-assessments/${groupAssessment._id}`);
                  }
                }}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-xl font-bold text-gray-900">{groupAssessment.groupName}</h2>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(groupAssessment.status)}`}>
                        {groupAssessment.status}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 mb-2">
                      <span className="font-medium">Assessment:</span> {groupAssessment.testId?.title || 'N/A'}
                    </p>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Completion:</span> {getCompletionStatus(groupAssessment)}
                      </div>
                      {groupAssessment.subjectId && (
                        <div>
                          <span className="font-medium">Subject:</span> {groupAssessment.subjectId.firstName} {groupAssessment.subjectId.lastName}
                        </div>
                      )}
                      <div>
                        <span className="font-medium">Created:</span> {new Date(groupAssessment.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    {/* User Assignments */}
                    <div className="mt-4 flex flex-wrap gap-3">
                      {groupAssessment.perspectives && Array.isArray(groupAssessment.perspectives) ? (
                        groupAssessment.perspectives.map((perspective, idx) => {
                          const user = perspective.userId;
                          const colors = ['bg-blue-50 text-blue-700', 'bg-green-50 text-green-700', 'bg-purple-50 text-purple-700', 'bg-yellow-50 text-yellow-700', 'bg-pink-50 text-pink-700'];
                          const colorClass = colors[idx % colors.length];
                          return (
                            <div key={idx} className={`px-3 py-1 ${colorClass} rounded-lg text-xs`}>
                              {perspective.perspectiveName}: {user?.firstName} {user?.lastName}
                              {perspective.resultId && ' ✓'}
                            </div>
                          );
                        })
                      ) : (
                        // Fallback for old data structure
                        <>
                          {groupAssessment.studentUserId && (
                            <div className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs">
                              Student: {groupAssessment.studentUserId?.firstName} {groupAssessment.studentUserId?.lastName}
                              {groupAssessment.studentResultId && ' ✓'}
                            </div>
                          )}
                          {groupAssessment.parentUserId && (
                            <div className="px-3 py-1 bg-green-50 text-green-700 rounded-lg text-xs">
                              Parent: {groupAssessment.parentUserId?.firstName} {groupAssessment.parentUserId?.lastName}
                              {groupAssessment.parentResultId && ' ✓'}
                            </div>
                          )}
                          {groupAssessment.teacherUserId && (
                            <div className="px-3 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs">
                              Teacher: {groupAssessment.teacherUserId?.firstName} {groupAssessment.teacherUserId?.lastName}
                              {groupAssessment.teacherResultId && ' ✓'}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {groupAssessment.status === 'completed' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/user/group-assessments/${groupAssessment._id}/report`);
                        }}
                        className="px-4 py-2 bg-mh-gradient text-white rounded-lg hover:opacity-90 transition-opacity text-sm"
                      >
                        View Report
                      </button>
                    )}
                    {groupAssessment.status !== 'completed' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/user/group-assessments/${groupAssessment._id}`);
                        }}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                      >
                        View Details
                      </button>
                    )}
                    <button
                      onClick={(e) => handleDelete(groupAssessment._id, e)}
                      className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default GroupAssessmentDashboardPage;

