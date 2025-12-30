import { useState, useEffect } from 'react';
import { getAdminTests, getAdminTestById, updateTest, deleteTest, createTest } from '../../api/adminApi';
import { showToast } from '../../utils/toast';
import axiosInstance from '../../utils/config/axiosInstance';

function AdminAssessments() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [selectedTest, setSelectedTest] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    category: '',
    shortDescription: '',
    longDescription: '',
    durationMinutesMin: 10,
    durationMinutesMax: 12,
    questionsCount: 0,
    price: 0,
    mrp: 0,
    imageUrl: '',
    tag: 'Research-Based',
    timeLimitSeconds: 0,
    isActive: true,
    popularityScore: 0,
    schemaJson: { questions: [] },
    eligibilityRules: {},
    scoringRules: {},
    riskRules: {}
  });
  const [creating, setCreating] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState({
    id: '',
    text: '',
    type: 'radio', // Fixed to radio only
    required: true,
    order: 1,
    isCritical: false,
    helpText: '',
    options: []
  });
  const [currentOption, setCurrentOption] = useState({ value: '', label: '' });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState('');

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

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showToast.error('Please select an image file');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast.error('Image size must be less than 5MB');
      return;
    }

    const formData = new FormData();
    formData.append('image', file);

    try {
      setUploadingImage(true);
      const response = await axiosInstance.post('/upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        setCreateForm({ ...createForm, imageUrl: response.data.data.imageUrl });
        setImagePreview(response.data.data.imageUrl);
        showToast.success('Image uploaded successfully!');
      } else {
        showToast.error(response.data.message || 'Failed to upload image');
      }
    } catch (error) {
      console.error('Image upload error:', error);
      showToast.error(error.response?.data?.message || 'Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
      // Reset input
      e.target.value = '';
    }
  };

  const handleCreateTest = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!createForm.title.trim()) {
      showToast.error('Title is required');
      return;
    }
    
    if (!createForm.schemaJson.questions || createForm.schemaJson.questions.length === 0) {
      showToast.error('At least one question is required');
      return;
    }

    // Update questionsCount based on actual questions
    const formData = {
      ...createForm,
      questionsCount: createForm.schemaJson.questions.length
    };

    try {
      setCreating(true);
      const response = await createTest(formData);
      if (response.success) {
        showToast.success('Test created successfully!');
        setShowCreateModal(false);
        resetCreateForm();
        fetchTests();
      }
    } catch (error) {
      console.error('Failed to create test:', error);
      showToast.error(error.response?.data?.message || 'Failed to create test');
    } finally {
      setCreating(false);
    }
  };

  const resetCreateForm = () => {
    setCreateForm({
      title: '',
      category: '',
      shortDescription: '',
      longDescription: '',
      durationMinutesMin: 10,
      durationMinutesMax: 12,
      questionsCount: 0,
      price: 0,
      mrp: 0,
      imageUrl: '',
      tag: 'Research-Based',
      timeLimitSeconds: 0,
      isActive: true,
      popularityScore: 0,
      schemaJson: { questions: [] },
      eligibilityRules: {},
      scoringRules: {},
      riskRules: {}
    });
    setImagePreview('');
    setCurrentQuestion({
      id: 'q1',
      text: '',
      type: 'radio', // Fixed to radio only
      required: true,
      order: 1,
      isCritical: false,
      helpText: '',
      options: []
    });
    setCurrentOption({ value: '', label: '' });
  };

  const addQuestion = () => {
    if (!currentQuestion.id || !currentQuestion.text.trim()) {
      showToast.error('Question ID and text are required');
      return;
    }

    // Critical validation: If Is Critical is true, Help Text is required
    if (currentQuestion.isCritical && !currentQuestion.helpText.trim()) {
      showToast.error('Help Text is required for critical questions. Please provide safety/help information.');
      return;
    }

    if (currentQuestion.options.length < 2) {
      showToast.error('At least 2 options with scores are required');
      return;
    }

    // Validate that all options have numeric scores
    const invalidOptions = currentQuestion.options.filter(opt => 
      opt.value === null || opt.value === undefined || opt.value === '' || isNaN(Number(opt.value))
    );
    if (invalidOptions.length > 0) {
      showToast.error('All options must have valid numeric scores');
      return;
    }

    const newQuestion = {
      ...currentQuestion,
      options: [...currentQuestion.options] // Always radio, so always include options
    };

    // Add question and sort by order
    const updatedQuestions = [...createForm.schemaJson.questions, newQuestion].sort((a, b) => (a.order || 0) - (b.order || 0));

    setCreateForm({
      ...createForm,
      schemaJson: {
        ...createForm.schemaJson,
        questions: updatedQuestions
      }
    });

    // Reset question form
    const nextId = `q${createForm.schemaJson.questions.length + 2}`;
    const nextOrder = createForm.schemaJson.questions.length + 1;
    setCurrentQuestion({
      id: nextId,
      text: '',
      type: 'radio', // Fixed to radio only
      required: true,
      order: nextOrder,
      isCritical: false,
      helpText: '',
      options: []
    });
    setCurrentOption({ value: '', label: '' });
    showToast.success('Question added!');
  };

  const addOption = () => {
    if (!currentOption.value.toString() || !currentOption.label.trim()) {
      showToast.error('Option value and label are required');
      return;
    }

    setCurrentQuestion({
      ...currentQuestion,
      options: [...currentQuestion.options, { ...currentOption, value: Number(currentOption.value) || currentOption.value }]
    });

    setCurrentOption({ value: '', label: '' });
  };

  const removeQuestion = (index) => {
    const newQuestions = createForm.schemaJson.questions.filter((_, i) => i !== index);
    setCreateForm({
      ...createForm,
      schemaJson: {
        ...createForm.schemaJson,
        questions: newQuestions
      }
    });
    showToast.success('Question removed');
  };

  const removeOption = (optionIndex) => {
    setCurrentQuestion({
      ...currentQuestion,
      options: currentQuestion.options.filter((_, i) => i !== optionIndex)
    });
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
          <h1 className="text-3xl font-bold text-mh-dark">Assessments</h1>
          <p className="text-gray-600 mt-1">Create and manage mental health assessments</p>
        </div>
        <button
          onClick={() => {
            resetCreateForm();
            setShowCreateModal(true);
          }}
          className="bg-mh-green text-white px-6 py-2 rounded-lg hover:bg-[#027a4f] transition-colors"
        >
          Create Assessment
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

      {/* Create Test Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white mb-10">
            <div className="mt-3">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-2xl font-semibold text-mh-dark">Create New Assessment</h3>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetCreateForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleCreateTest} className="space-y-6 max-h-[80vh] overflow-y-auto pr-2">
                {/* Basic Information */}
                <div className="border-b border-gray-200 pb-4">
                  <h4 className="text-lg font-semibold text-mh-dark mb-4">Basic Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                      <input
                        type="text"
                        value={createForm.title}
                        onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mh-green focus:border-transparent"
                        placeholder="e.g., Depression Screening Test"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                      <input
                        type="text"
                        value={createForm.category}
                        onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mh-green focus:border-transparent"
                        placeholder="e.g., Mental Health"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tag</label>
                      <input
                        type="text"
                        value={createForm.tag}
                        onChange={(e) => setCreateForm({ ...createForm, tag: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mh-green focus:border-transparent"
                        placeholder="e.g., Research-Based"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Short Description</label>
                      <input
                        type="text"
                        value={createForm.shortDescription}
                        onChange={(e) => setCreateForm({ ...createForm, shortDescription: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mh-green focus:border-transparent"
                        placeholder="Brief description (shown in lists)"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Long Description</label>
                      <textarea
                        value={createForm.longDescription}
                        onChange={(e) => setCreateForm({ ...createForm, longDescription: e.target.value })}
                        rows="3"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mh-green focus:border-transparent"
                        placeholder="Detailed description (shown on test detail page)"
                      />
                    </div>
                  </div>
                </div>

                {/* Pricing & Duration */}
                <div className="border-b border-gray-200 pb-4">
                  <h4 className="text-lg font-semibold text-mh-dark mb-4">Pricing & Duration</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Price (₹)</label>
                      <input
                        type="number"
                        value={createForm.price}
                        onChange={(e) => setCreateForm({ ...createForm, price: Number(e.target.value) || 0 })}
                        min="0"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mh-green focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">MRP (₹)</label>
                      <input
                        type="number"
                        value={createForm.mrp}
                        onChange={(e) => setCreateForm({ ...createForm, mrp: Number(e.target.value) || 0 })}
                        min="0"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mh-green focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Min Duration (minutes)</label>
                      <input
                        type="number"
                        value={createForm.durationMinutesMin}
                        onChange={(e) => setCreateForm({ ...createForm, durationMinutesMin: Number(e.target.value) || 0 })}
                        min="0"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mh-green focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Max Duration (minutes)</label>
                      <input
                        type="number"
                        value={createForm.durationMinutesMax}
                        onChange={(e) => setCreateForm({ ...createForm, durationMinutesMax: Number(e.target.value) || 0 })}
                        min="0"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mh-green focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Time Limit (seconds, 0 = no limit)</label>
                      <input
                        type="number"
                        value={createForm.timeLimitSeconds}
                        onChange={(e) => setCreateForm({ ...createForm, timeLimitSeconds: Number(e.target.value) || 0 })}
                        min="0"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mh-green focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Popularity Score</label>
                      <input
                        type="number"
                        value={createForm.popularityScore}
                        onChange={(e) => setCreateForm({ ...createForm, popularityScore: Number(e.target.value) || 0 })}
                        min="0"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mh-green focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Assessment Image</label>
                      <div className="space-y-3">
                        {/* Image Preview */}
                        {imagePreview && (
                          <div className="relative w-full h-48 border border-gray-300 rounded-lg overflow-hidden bg-gray-100">
                            <img
                              src={imagePreview}
                              alt="Preview"
                              className="w-full h-full object-contain"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setImagePreview('');
                                setCreateForm({ ...createForm, imageUrl: '' });
                              }}
                              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        )}
                        
                        {/* File Upload Input */}
                        <div className="flex items-center space-x-3">
                          <label className="flex-1 cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="hidden"
                              disabled={uploadingImage}
                            />
                            <div className={`w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-mh-green transition-colors ${uploadingImage ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                              {uploadingImage ? (
                                <div className="flex items-center justify-center space-x-2">
                                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-mh-green"></div>
                                  <span className="text-sm text-gray-600">Uploading...</span>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center space-y-2">
                                  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  <span className="text-sm text-gray-600">
                                    {imagePreview ? 'Click to change image' : 'Click to upload image'}
                                  </span>
                                  <span className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</span>
                                </div>
                              )}
                            </div>
                          </label>
                        </div>
                        
                        {/* Current Image URL (if exists) */}
                        {createForm.imageUrl && !imagePreview && (
                          <div className="text-xs text-gray-500">
                            Current: {createForm.imageUrl}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={createForm.isActive}
                          onChange={(e) => setCreateForm({ ...createForm, isActive: e.target.checked })}
                          className="rounded border-gray-300 text-mh-green focus:ring-mh-green"
                        />
                        <span className="text-sm font-medium text-gray-700">Active (visible to users)</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Questions Section */}
                <div className="border-b border-gray-200 pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-mh-dark">
                      Questions ({createForm.schemaJson.questions.length})
                    </h4>
                    {createForm.schemaJson.questions.length > 0 && (
                      <span className="text-sm text-gray-600">
                        ✓ {createForm.schemaJson.questions.length} question{createForm.schemaJson.questions.length !== 1 ? 's' : ''} added
                      </span>
                    )}
                  </div>

                  {/* Add Question Form */}
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 p-5 rounded-lg mb-4">
                    <div className="mb-4">
                      <h5 className="text-base font-semibold text-mh-dark mb-1">➕ Add New Question</h5>
                      <p className="text-xs text-gray-600">
                        Create a multiple-choice question with fixed score options (e.g., 0-3 scale)
                      </p>
                    </div>
                    <div className="space-y-4">
                      {/* Step 1: Basic Question Info */}
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center space-x-2 mb-3">
                          <span className="bg-mh-green text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">1</span>
                          <h6 className="text-sm font-semibold text-gray-800">Basic Information</h6>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Question ID <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={currentQuestion.id}
                              onChange={(e) => setCurrentQuestion({ ...currentQuestion, id: e.target.value })}
                              placeholder="e.g., q1, q2, q3"
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-mh-green focus:border-transparent"
                            />
                            <p className="text-xs text-gray-500 mt-1">Unique identifier for this question</p>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Display Order <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="number"
                              value={currentQuestion.order}
                              onChange={(e) => setCurrentQuestion({ ...currentQuestion, order: Number(e.target.value) || 1 })}
                              min="1"
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-mh-green focus:border-transparent"
                            />
                            <p className="text-xs text-gray-500 mt-1">Order in which question appears (1, 2, 3...)</p>
                          </div>
                        </div>
                      </div>

                      {/* Step 2: Question Text */}
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center space-x-2 mb-3">
                          <span className="bg-mh-green text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">2</span>
                          <h6 className="text-sm font-semibold text-gray-800">Question Text</h6>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Question <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={currentQuestion.text}
                            onChange={(e) => setCurrentQuestion({ ...currentQuestion, text: e.target.value })}
                            placeholder="e.g., How often do you feel sad or hopeless?"
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-mh-green focus:border-transparent"
                          />
                          <p className="text-xs text-gray-500 mt-1">The actual question text that users will see</p>
                        </div>
                      </div>

                      {/* Step 3: Question Settings */}
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center space-x-2 mb-3">
                          <span className="bg-mh-green text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">3</span>
                          <h6 className="text-sm font-semibold text-gray-800">Question Settings</h6>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center space-x-3">
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={currentQuestion.required}
                                onChange={(e) => setCurrentQuestion({ ...currentQuestion, required: e.target.checked })}
                                className="rounded border-gray-300 text-mh-green focus:ring-mh-green w-4 h-4"
                              />
                              <span className="text-sm text-gray-700">Required Question</span>
                            </label>
                            <p className="text-xs text-gray-500">User must answer this question</p>
                          </div>
                          <div className="flex items-center space-x-3">
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={currentQuestion.isCritical}
                                onChange={(e) => setCurrentQuestion({ ...currentQuestion, isCritical: e.target.checked })}
                                className="rounded border-gray-300 text-red-600 focus:ring-red-600 w-4 h-4"
                              />
                              <span className="text-sm font-semibold text-red-700">⚠️ Critical Question</span>
                            </label>
                            <p className="text-xs text-red-600">Requires help text for safety</p>
                          </div>
                        </div>
                      </div>

                      {/* Step 4: Help Text (Required if Critical) */}
                      <div className={`bg-white p-4 rounded-lg border-2 ${currentQuestion.isCritical ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
                        <div className="flex items-center space-x-2 mb-3">
                          <span className="bg-mh-green text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">4</span>
                          <h6 className="text-sm font-semibold text-gray-800">
                            Help Text {currentQuestion.isCritical && <span className="text-red-600">*</span>}
                          </h6>
                          {currentQuestion.isCritical && (
                            <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full font-semibold">
                              ⚠️ Required for Critical Questions
                            </span>
                          )}
                        </div>
                        <div>
                          <textarea
                            value={currentQuestion.helpText}
                            onChange={(e) => setCurrentQuestion({ ...currentQuestion, helpText: e.target.value })}
                            placeholder={currentQuestion.isCritical 
                              ? "⚠️ REQUIRED: Provide safety/help information for this critical question (e.g., 'If you're experiencing thoughts of self-harm, please reach out for immediate help...')"
                              : "Optional: Additional help text or instructions for this question"
                            }
                            rows="3"
                            className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-mh-green focus:border-transparent ${
                              currentQuestion.isCritical && !currentQuestion.helpText.trim()
                                ? 'border-red-400 bg-red-50'
                                : 'border-gray-300'
                            }`}
                          />
                          {currentQuestion.isCritical ? (
                            <p className="text-xs text-red-700 mt-1 font-medium">
                              ⚠️ Critical questions must include help text for user safety and support guidance.
                            </p>
                          ) : (
                            <p className="text-xs text-gray-500 mt-1">
                              Optional: Provide additional context or instructions for users
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Step 5: Answer Options with Scores */}
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center space-x-2 mb-3">
                          <span className="bg-mh-green text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">5</span>
                          <h6 className="text-sm font-semibold text-gray-800">
                            Answer Options with Fixed Scores <span className="text-red-500">*</span>
                          </h6>
                        </div>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                          <p className="text-xs font-medium text-blue-900 mb-1">
                            📊 How it works:
                          </p>
                          <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
                            <li>Each option must have a numeric score (0, 1, 2, 3, etc.)</li>
                            <li>Minimum 2 options required</li>
                            <li>Scores are used for calculating the final assessment result</li>
                            <li>Example: 0 = "Not at all", 1 = "Several days", 2 = "More than half", 3 = "Nearly every day"</li>
                          </ul>
                        </div>
                        <div className="space-y-2 mb-2">
                          {currentQuestion.options.map((opt, idx) => (
                            <div key={idx} className="flex items-center space-x-2 bg-white p-2 rounded border border-gray-200">
                              <span className="text-xs font-semibold text-mh-green w-12">Score: {opt.value}</span>
                              <span className="text-xs text-gray-800 flex-1">{opt.label}</span>
                              <button
                                type="button"
                                onClick={() => removeOption(idx)}
                                className="text-red-600 hover:text-red-800 text-xs px-2 py-1 hover:bg-red-50 rounded"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                        <div className="flex space-x-2">
                          <div className="w-28">
                            <label className="block text-xs text-gray-600 mb-1">Score *</label>
                            <input
                              type="number"
                              value={currentOption.value}
                              onChange={(e) => setCurrentOption({ ...currentOption, value: e.target.value })}
                              placeholder="0"
                              min="0"
                              step="1"
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-mh-green focus:border-transparent"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="block text-xs text-gray-600 mb-1">Option Label *</label>
                            <input
                              type="text"
                              value={currentOption.label}
                              onChange={(e) => setCurrentOption({ ...currentOption, label: e.target.value })}
                              placeholder="e.g., Not at all, Several days, etc."
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-mh-green focus:border-transparent"
                            />
                          </div>
                          <div className="flex items-end">
                            <button
                              type="button"
                              onClick={addOption}
                              className="bg-mh-green text-white px-4 py-1 rounded text-sm hover:bg-[#027a4f] transition-colors"
                            >
                              Add Option
                            </button>
                          </div>
                        </div>
                        {currentQuestion.options.length > 0 && (
                          <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded">
                            <p className="text-xs font-medium text-green-800">
                              ✓ {currentQuestion.options.length} option{currentQuestion.options.length !== 1 ? 's' : ''} added
                            </p>
                            <p className="text-xs text-green-700 mt-1">
                              Scores: {currentQuestion.options.map(opt => opt.value).join(', ')}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Add Question Button */}
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={addQuestion}
                          disabled={!currentQuestion.id || !currentQuestion.text.trim() || currentQuestion.options.length < 2}
                          className="w-full bg-mh-green text-white px-4 py-3 rounded-lg hover:bg-[#027a4f] transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          <span>Add This Question</span>
                        </button>
                        {(!currentQuestion.id || !currentQuestion.text.trim() || currentQuestion.options.length < 2) && (
                          <p className="text-xs text-gray-500 mt-2 text-center">
                            Complete all required fields to add question
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* List of Added Questions */}
                  {createForm.schemaJson.questions.length > 0 && (
                    <div className="space-y-2">
                      <h6 className="text-sm font-semibold text-gray-700">Added Questions:</h6>
                      {createForm.schemaJson.questions.map((q, idx) => (
                        <div key={idx} className="bg-white border border-gray-200 rounded-lg p-3 flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-xs font-semibold text-mh-green">{q.id}</span>
                              <span className="text-xs text-gray-500">Order: {q.order || idx + 1}</span>
                              <span className="text-xs text-gray-500">({q.type})</span>
                              {q.required && <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded">Required</span>}
                              {q.isCritical && <span className="text-xs bg-red-200 text-red-900 px-2 py-0.5 rounded font-semibold">Critical</span>}
                            </div>
                            <p className="text-sm text-gray-800">{q.text}</p>
                            {q.helpText && (
                              <p className="text-xs text-gray-600 mt-1 italic">Help: {q.helpText}</p>
                            )}
                            {q.options && q.options.length > 0 && (
                              <div className="mt-2 space-y-1">
                                <div className="text-xs font-medium text-gray-700">Options with Scores:</div>
                                {q.options.map((opt, optIdx) => (
                                  <div key={optIdx} className="text-xs text-gray-600 pl-2">
                                    <span className="font-semibold text-mh-green">Score {opt.value}:</span> {opt.label}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeQuestion(idx)}
                            className="text-red-600 hover:text-red-800 ml-2"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      resetCreateForm();
                    }}
                    className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                    disabled={creating}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating || createForm.schemaJson.questions.length === 0}
                    className="bg-mh-green text-white px-6 py-2 rounded-lg hover:bg-[#027a4f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {creating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Creating...</span>
                      </>
                    ) : (
                      <span>Create Assessment</span>
                    )}
                  </button>
                </div>
              </form>
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

export default AdminAssessments;

