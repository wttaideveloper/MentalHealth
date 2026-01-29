import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import Breadcrumb from '../../components/Breadcrumb';
import { getAllAssessments } from '../../api/assessmentApi';
import { createGroupAssessment } from '../../api/groupAssessmentApi';
import { getMe } from '../../api/authApi';

function CreateGroupAssessmentPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [assessments, setAssessments] = useState([]);
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    testId: '',
    groupName: '',
    subjectId: '',
    studentUserId: '',
    parentUserId: '',
    teacherUserId: '',
    notes: ''
  });

  useEffect(() => {
    fetchAssessments();
    fetchUsers();
  }, []);

  const fetchAssessments = async () => {
    try {
      const response = await getAllAssessments();
      if (response.success && response.data) {
        setAssessments(response.data);
      }
    } catch (err) {
      console.error('Error fetching assessments:', err);
      toast.error('Failed to load assessments');
    }
  };

  const fetchUsers = async () => {
    try {
      // For now, we'll use a simple approach - in production, you'd have a user search API
      // This is a placeholder - you'll need to implement user search/selection
      const currentUser = await getMe();
      if (currentUser.success && currentUser.data) {
        // In a real app, you'd fetch a list of users here
        // For now, we'll just set the current user as an option
        setUsers([currentUser.data]);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.testId || !formData.groupName) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!formData.studentUserId && !formData.parentUserId && !formData.teacherUserId) {
      toast.error('Please assign at least one user (student, parent, or teacher)');
      return;
    }

    try {
      setLoading(true);
      const response = await createGroupAssessment(formData);
      
      if (response.success) {
        toast.success('Group assessment created successfully');
        navigate(`/user/group-assessments/${response.data._id}`);
      } else {
        toast.error(response.message || 'Failed to create group assessment');
      }
    } catch (err) {
      console.error('Error creating group assessment:', err);
      toast.error(err.response?.data?.message || 'Failed to create group assessment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-40 py-6">
      <Breadcrumb isLoggedIn={true} customLabel="Create Group Assessment" />
      
      <div className="max-w-3xl mx-auto mt-8">
        <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Create Group Assessment</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Assessment Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assessment <span className="text-red-500">*</span>
              </label>
              <select
                name="testId"
                value={formData.testId}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mh-green focus:border-transparent"
              >
                <option value="">Select an assessment</option>
                {assessments.map((assessment) => (
                  <option key={assessment._id} value={assessment._id}>
                    {assessment.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Group Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Group Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="groupName"
                value={formData.groupName}
                onChange={handleChange}
                required
                placeholder="e.g., John Doe - Character Assessment"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mh-green focus:border-transparent"
              />
            </div>

            {/* Subject (Student) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject (Student)
              </label>
              <input
                type="text"
                name="subjectId"
                value={formData.subjectId}
                onChange={handleChange}
                placeholder="User ID (optional - for tracking the subject)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mh-green focus:border-transparent"
              />
              <p className="mt-1 text-sm text-gray-500">
                Optional: The student/user being assessed
              </p>
            </div>

            {/* Student User */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Student User
              </label>
              <input
                type="text"
                name="studentUserId"
                value={formData.studentUserId}
                onChange={handleChange}
                placeholder="User ID who will take assessment as student"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mh-green focus:border-transparent"
              />
              <p className="mt-1 text-sm text-gray-500">
                User ID of the person who will take the assessment from student perspective
              </p>
            </div>

            {/* Parent User */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Parent User
              </label>
              <input
                type="text"
                name="parentUserId"
                value={formData.parentUserId}
                onChange={handleChange}
                placeholder="User ID who will take assessment as parent"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mh-green focus:border-transparent"
              />
              <p className="mt-1 text-sm text-gray-500">
                User ID of the person who will take the assessment from parent perspective
              </p>
            </div>

            {/* Teacher User */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teacher User
              </label>
              <input
                type="text"
                name="teacherUserId"
                value={formData.teacherUserId}
                onChange={handleChange}
                placeholder="User ID who will take assessment as teacher"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mh-green focus:border-transparent"
              />
              <p className="mt-1 text-sm text-gray-500">
                User ID of the person who will take the assessment from teacher perspective
              </p>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={4}
                placeholder="Additional notes about this group assessment..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mh-green focus:border-transparent"
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => navigate('/user/group-assessments')}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-2 bg-mh-gradient text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Group Assessment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CreateGroupAssessmentPage;

