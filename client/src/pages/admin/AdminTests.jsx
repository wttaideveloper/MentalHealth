import { useState, useEffect } from 'react';
import { getAdminTests, getAdminTestById, updateTest, deleteTest, createTest } from '../../api/adminApi';
import { showToast } from '../../utils/toast';
import axiosInstance from '../../utils/config/axiosInstance';
import { validateTestData } from '../../utils/schemaValidator';

function AdminAssessments() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState('true'); // Default to showing only active tests
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [selectedTest, setSelectedTest] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTestId, setEditingTestId] = useState(null);
  const [testIdToDelete, setTestIdToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
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
    options: [],
    show_if: null // Branching condition
  });
  const [showIfMode, setShowIfMode] = useState('none'); // 'none', 'simple'
  const [currentCondition, setCurrentCondition] = useState({
    questionId: '',
    operator: 'equals',
    value: ''
  });
  const [currentOption, setCurrentOption] = useState({ value: '', label: '' });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  const [jsonUploadError, setJsonUploadError] = useState('');
  const [validationErrors, setValidationErrors] = useState({ errors: [], warnings: [], questionErrors: {} });
  const [availableCategories, setAvailableCategories] = useState([]);
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [newCategoryValue, setNewCategoryValue] = useState('');

  useEffect(() => {
    fetchTests();
  }, [page, search, isActiveFilter]);

  // Fetch categories when component mounts
  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch categories when create modal opens
  useEffect(() => {
    if (showCreateModal) {
      fetchCategories();
    }
  }, [showCreateModal]);

  const fetchCategories = async () => {
    try {
      // Fetch all tests (including inactive) to get all categories
      const response = await getAdminTests({ page: 1, limit: 1000, isActive: 'all' });
      if (response.success && response.data && response.data.tests) {
        // Extract unique categories
        const categories = [...new Set(
          response.data.tests
            .map(test => test.category)
            .filter(cat => cat && cat.trim() !== '')
        )].sort();
        setAvailableCategories(categories);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchTests = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 20,
        ...(search && { search }),
        isActive: isActiveFilter // "true" for active, "false" for inactive, "all" for all
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

  const handleEditTest = async (testId) => {
    try {
      const response = await getAdminTestById(testId);
      if (response.success && response.data) {
        const testData = response.data;
        const testCategory = testData.category || '';
        
        // Ensure the test's category is in the available categories list
        if (testCategory && testCategory.trim() !== '' && !availableCategories.includes(testCategory)) {
          setAvailableCategories([...availableCategories, testCategory].sort());
        }
        
        // Populate form with existing test data
        setCreateForm({
          title: testData.title || '',
          category: testCategory,
          shortDescription: testData.shortDescription || '',
          longDescription: testData.longDescription || '',
          durationMinutesMin: testData.durationMinutesMin || 10,
          durationMinutesMax: testData.durationMinutesMax || 12,
          questionsCount: testData.questionsCount || 0,
          price: testData.price || 0,
          mrp: testData.mrp || 0,
          imageUrl: testData.imageUrl || '',
          tag: testData.tag || 'Research-Based',
          timeLimitSeconds: testData.timeLimitSeconds || 0,
          isActive: testData.isActive !== undefined ? testData.isActive : true,
          popularityScore: testData.popularityScore || 0,
          schemaJson: testData.schemaJson || { questions: [] },
          eligibilityRules: testData.eligibilityRules || {},
          scoringRules: testData.scoringRules || {},
          riskRules: testData.riskRules || {}
        });
        setImagePreview(testData.imageUrl || '');
        setEditingTestId(testId);
        setIsAddingNewCategory(false);
        setNewCategoryValue('');
        // Reset current question form for adding new questions
        const questions = testData.schemaJson?.questions || [];
        const nextId = `q${questions.length + 1}`;
        const nextOrder = questions.length + 1;
        setCurrentQuestion({
          id: nextId,
          text: '',
          type: 'radio',
          required: true,
          order: nextOrder,
          isCritical: false,
          helpText: '',
          options: []
        });
        setCurrentOption({ value: '', label: '' });
        setShowCreateModal(true);
      }
    } catch (error) {
      console.error('Failed to load test for editing:', error);
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

  const handleDeleteClick = (testId) => {
    setTestIdToDelete(testId);
  };

  const handleDeleteCancel = () => {
    setTestIdToDelete(null);
  };

  const handleDeleteConfirm = async () => {
    if (!testIdToDelete) return;
    
    const testId = testIdToDelete;
    try {
      setDeleting(true);
      const response = await deleteTest(testId);
      if (response.success) {
        // Immediately remove the test from UI for better UX
        setTests(prevTests => {
          const updatedTests = prevTests.filter(test => test._id !== testId);
          
          // If current page becomes empty and there are previous pages, navigate back
          if (updatedTests.length === 0 && page > 1) {
            setPage(page - 1);
          }
          
          return updatedTests;
        });
        
        // Update pagination total count
        setPagination(prev => {
          const newTotal = Math.max(0, prev.total - 1);
          const newPages = Math.ceil(newTotal / prev.limit) || 1;
          return {
            ...prev,
            total: newTotal,
            pages: newPages
          };
        });
        
        setTestIdToDelete(null);
        showToast.success('Test deleted successfully!');
      }
    } catch (error) {
      console.error('Failed to delete test:', error);
      showToast.error('Failed to delete test');
      // Refetch on error to ensure UI is in sync
      fetchTests();
    } finally {
      setDeleting(false);
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
        const uploadedImageUrl = response.data.data.imageUrl;
        console.log('Image uploaded successfully, imageUrl:', uploadedImageUrl);
        // Use functional update to ensure we get the latest state
        setCreateForm(prev => ({ ...prev, imageUrl: uploadedImageUrl }));
        setImagePreview(uploadedImageUrl);
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
    
    // Comprehensive validation
    const validation = validateTestData(createForm);
    setValidationErrors(validation);

    if (!validation.valid) {
      // Show first error as toast
      if (validation.errors.length > 0) {
        showToast.error(validation.errors[0]);
      }
      // Scroll to first error if possible
      return;
    }

    // Show warnings if any
    if (validation.warnings.length > 0) {
      showToast.warning(`${validation.warnings.length} warning(s) found. Check the form for details.`);
    }

    // Check if user is still authenticated
    const { getAccessToken } = await import('../../utils/auth');
    const token = getAccessToken();
    if (!token) {
      showToast.error('Session expired. Please log in again.');
      setTimeout(() => {
        window.location.href = '/admin-login';
      }, 1500);
      return;
    }

    // Update questionsCount based on actual questions
    const formData = {
      ...createForm,
      questionsCount: createForm.schemaJson.questions.length
    };

    try {
      setCreating(true);
      let response;
      if (editingTestId) {
        // Update existing test
        response = await updateTest(editingTestId, formData);
        if (response.success) {
          showToast.success('Test updated successfully!');
          setShowCreateModal(false);
          resetCreateForm();
          fetchTests();
        }
      } else {
        // Create new test
        response = await createTest(formData);
        if (response.success) {
          showToast.success('Test created successfully!');
          setShowCreateModal(false);
          resetCreateForm();
          fetchTests();
        }
      }
    } catch (error) {
      console.error(`Failed to ${editingTestId ? 'update' : 'create'} test:`, error);
      console.error('Error details:', {
        status: error.response?.status,
        message: error.response?.data?.message,
        url: error.config?.url
      });
      
      // If 401, suggest re-login
      if (error.response?.status === 401) {
        showToast.error('Session expired. Please log in again.');
        setTimeout(() => {
          window.location.href = '/admin-login';
        }, 2000);
      } else {
        // Handle validation errors from backend
        if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
          setValidationErrors({
            errors: error.response.data.errors,
            warnings: error.response.data.warnings || [],
            questionErrors: {}
          });
          showToast.error('Schema validation failed. Please check the errors below.');
        } else {
          showToast.error(error.response?.data?.message || `Failed to ${editingTestId ? 'update' : 'create'} test`);
        }
      }
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
    setEditingTestId(null);
    setCurrentQuestion({
      id: 'q1',
      text: '',
      type: 'radio', // Fixed to radio only
      required: true,
      order: 1,
      isCritical: false,
      helpText: '',
      options: [],
      show_if: null
    });
    setCurrentOption({ value: '', label: '' });
    setShowIfMode('none');
    setCurrentCondition({ questionId: '', operator: 'equals', value: '' });
    setJsonUploadError('');
    setValidationErrors({ errors: [], warnings: [], questionErrors: {} });
    setIsAddingNewCategory(false);
    setNewCategoryValue('');
  };

  const buildShowIfCondition = () => {
    if (showIfMode === 'none') return null;
    
    if (showIfMode === 'simple') {
      if (!currentCondition.questionId || currentCondition.value === '') return null;
      return {
        questionId: currentCondition.questionId,
        equals: currentCondition.value
      };
    }
    
    return null;
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
      options: [...currentQuestion.options], // Always radio, so always include options
      show_if: buildShowIfCondition()
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
      options: [],
      show_if: null
    });
    setCurrentOption({ value: '', label: '' });
    setShowIfMode('none');
    setCurrentCondition({ questionId: '', operator: 'equals', value: '' });
    showToast.success('Question added!');
    
    // Trigger validation after adding question
    const validation = validateTestData(createForm);
    setValidationErrors(validation);
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
    const updatedForm = {
      ...createForm,
      schemaJson: {
        ...createForm.schemaJson,
        questions: newQuestions
      }
    };
    setCreateForm(updatedForm);
    showToast.success('Question removed');
    
    // Trigger validation after removing question
    const validation = validateTestData(updatedForm);
    setValidationErrors(validation);
  };

  const handleValidateSchema = () => {
    const validation = validateTestData(createForm);
    setValidationErrors(validation);
    
    if (validation.valid) {
      if (validation.warnings.length > 0) {
        showToast.warning(`Schema is valid but has ${validation.warnings.length} warning(s)`);
      } else {
        showToast.success('Schema is valid! ✓');
      }
    } else {
      showToast.error(`Schema validation failed: ${validation.errors.length} error(s) found`);
    }
  };

  const removeOption = (optionIndex) => {
    setCurrentQuestion({
      ...currentQuestion,
      options: currentQuestion.options.filter((_, i) => i !== optionIndex)
    });
  };

  const handleJsonUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.json')) {
      showToast.error('Please select a JSON file');
      setJsonUploadError('Invalid file type. Please select a .json file.');
      e.target.value = '';
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast.error('File size must be less than 5MB');
      setJsonUploadError('File size exceeds 5MB limit.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonData = JSON.parse(event.target.result);
        
        // Validate JSON structure
        if (!jsonData.questions || !Array.isArray(jsonData.questions)) {
          throw new Error('JSON must contain a "questions" array');
        }

        if (jsonData.questions.length === 0) {
          throw new Error('Questions array cannot be empty');
        }

        // Validate each question
        const validatedQuestions = [];
        const questionIds = new Set();
        
        jsonData.questions.forEach((q, index) => {
          // Validate required fields
          if (!q.id || typeof q.id !== 'string') {
            throw new Error(`Question ${index + 1}: "id" is required and must be a string`);
          }

          if (!q.text || typeof q.text !== 'string' || q.text.trim() === '') {
            throw new Error(`Question ${index + 1}: "text" is required and cannot be empty`);
          }

          // Check for duplicate IDs
          if (questionIds.has(q.id)) {
            throw new Error(`Question ${index + 1}: Duplicate question ID "${q.id}"`);
          }
          questionIds.add(q.id);

          // Validate question type
          const validTypes = ['radio', 'checkbox', 'text', 'textarea', 'numeric', 'boolean', 'likert'];
          const questionType = q.type || 'radio';
          if (!validTypes.includes(questionType)) {
            throw new Error(`Question ${index + 1}: Invalid type "${questionType}". Valid types: ${validTypes.join(', ')}`);
          }

          // Validate options for radio, checkbox, and likert types
          if (['radio', 'checkbox', 'likert'].includes(questionType)) {
            if (!q.options || !Array.isArray(q.options) || q.options.length < 2) {
              throw new Error(`Question ${index + 1}: Must have at least 2 options for type "${questionType}"`);
            }

            // Validate each option
            q.options.forEach((opt, optIndex) => {
              if (opt.value === undefined || opt.value === null) {
                throw new Error(`Question ${index + 1}, Option ${optIndex + 1}: "value" is required`);
              }
              if (!opt.label || typeof opt.label !== 'string' || opt.label.trim() === '') {
                throw new Error(`Question ${index + 1}, Option ${optIndex + 1}: "label" is required and cannot be empty`);
              }
            });
          }

          // Set defaults for optional fields
          const validatedQuestion = {
            id: q.id.trim(),
            text: q.text.trim(),
            type: questionType,
            required: q.required !== undefined ? q.required : true,
            order: q.order !== undefined ? Number(q.order) : index + 1,
            isCritical: q.isCritical || false,
            helpText: q.helpText || '',
            options: q.options ? q.options.map(opt => ({
              value: typeof opt.value === 'number' ? opt.value : Number(opt.value) || opt.value,
              label: String(opt.label).trim()
            })) : []
          };

          validatedQuestions.push(validatedQuestion);
        });

        // Merge with existing questions (check for duplicates by ID)
        const existingQuestions = createForm.schemaJson.questions || [];
        const existingIds = new Set(existingQuestions.map(q => q.id));
        const newQuestions = validatedQuestions.filter(q => !existingIds.has(q.id));
        const duplicateCount = validatedQuestions.length - newQuestions.length;

        if (duplicateCount > 0) {
          showToast.warning(`${duplicateCount} question(s) were skipped due to duplicate IDs`);
        }

        // Merge and sort by order
        const mergedQuestions = [...existingQuestions, ...newQuestions]
          .sort((a, b) => (a.order || 0) - (b.order || 0));

        // Update form state
        setCreateForm({
          ...createForm,
          schemaJson: {
            ...createForm.schemaJson,
            questions: mergedQuestions
          }
        });

        setJsonUploadError('');
        showToast.success(`Successfully imported ${newQuestions.length} question(s)! ${duplicateCount > 0 ? `(${duplicateCount} duplicates skipped)` : ''}`);
        
      } catch (error) {
        console.error('JSON parsing error:', error);
        setJsonUploadError(error.message);
        showToast.error(`JSON Error: ${error.message}`);
      }
      
      // Reset file input
      e.target.value = '';
    };

    reader.onerror = () => {
      showToast.error('Failed to read file');
      setJsonUploadError('Failed to read file. Please try again.');
      e.target.value = '';
    };

    reader.readAsText(file);
  };

  const downloadSampleJson = () => {
    const sampleJson = {
      questions: [
        {
          id: "q1",
          text: "How often do you feel anxious or worried?",
          type: "radio",
          required: true,
          order: 1,
          isCritical: false,
          helpText: "",
          options: [
            { value: 0, label: "Not at all" },
            { value: 1, label: "Rarely" },
            { value: 2, label: "Sometimes" },
            { value: 3, label: "Often" }
          ]
        },
        {
          id: "q2",
          text: "Do you experience difficulty sleeping?",
          type: "radio",
          required: true,
          order: 2,
          isCritical: false,
          helpText: "",
          options: [
            { value: 0, label: "Never" },
            { value: 1, label: "Seldom" },
            { value: 2, label: "Occasionally" },
            { value: 3, label: "Frequently" }
          ]
        },
        {
          id: "q3",
          text: "Rate your overall mood (1-5 scale)",
          type: "likert",
          required: true,
          order: 3,
          isCritical: false,
          helpText: "",
          options: [
            { value: 1, label: "Very Poor" },
            { value: 2, label: "Poor" },
            { value: 3, label: "Neutral" },
            { value: 4, label: "Good" },
            { value: 5, label: "Very Good" }
          ]
        },
        {
          id: "q4",
          text: "This question only appears if q1 equals 3",
          type: "radio",
          required: false,
          order: 4,
          isCritical: false,
          helpText: "",
          show_if: {
            questionId: "q1",
            equals: 3
          },
          options: [
            { value: 0, label: "No" },
            { value: 1, label: "Yes" }
          ]
        }
      ]
    };
    
    const blob = new Blob([JSON.stringify(sampleJson, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample-questions.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast.success('Sample JSON template downloaded!');
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
            setEditingTestId(null);
            setShowCreateModal(true);
          }}
          className="bg-mh-gradient text-white px-6 py-2 rounded-lg hover:opacity-90 transition-colors"
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
              <option value="all">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
          <button
            type="submit"
            className="bg-mh-gradient text-white px-6 py-2 rounded-lg hover:opacity-90 transition-colors"
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

              <div className="flex gap-2 pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleViewTest(test._id)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 hover:shadow-sm transition-all duration-200 whitespace-nowrap"
                  title="View Details"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  View
                </button>
                <button
                  onClick={() => handleEditTest(test._id)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 hover:border-emerald-300 hover:shadow-sm transition-all duration-200 whitespace-nowrap"
                  title="Edit Assessment"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </button>
                <button
                  onClick={() => handleToggleActive(test)}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg hover:shadow-sm transition-all duration-200 whitespace-nowrap ${
                    test.isActive
                      ? 'text-orange-700 bg-orange-50 border border-orange-200 hover:bg-orange-100 hover:border-orange-300'
                      : 'text-green-700 bg-green-50 border border-green-200 hover:bg-green-100 hover:border-green-300'
                  }`}
                  title={test.isActive ? 'Deactivate Assessment' : 'Activate Assessment'}
                >
                  {test.isActive ? (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Deactivate
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Activate
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleDeleteClick(test._id)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 hover:border-red-300 hover:shadow-sm transition-all duration-200 whitespace-nowrap"
                  title="Delete Assessment"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
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
                          ? 'z-10 bg-mh-gradient border-mh-green text-white'
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
                <h3 className="text-2xl font-semibold text-mh-dark">
                  {editingTestId ? 'Edit Assessment' : 'Create New Assessment'}
                </h3>
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
                      {!isAddingNewCategory ? (
                        <div className="space-y-2">
                          <select
                            value={createForm.category}
                            onChange={(e) => {
                              const selectedValue = e.target.value;
                              if (selectedValue === '__add_new__') {
                                setIsAddingNewCategory(true);
                                setNewCategoryValue('');
                              } else {
                                setCreateForm({ ...createForm, category: selectedValue });
                              }
                            }}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mh-green focus:border-transparent"
                          >
                            <option value="">Select a category...</option>
                            {availableCategories.map((category) => (
                              <option key={category} value={category}>
                                {category}
                              </option>
                            ))}
                            <option value="__add_new__" className="font-semibold text-mh-green">
                              + Add New Category
                            </option>
                          </select>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={newCategoryValue}
                              onChange={(e) => setNewCategoryValue(e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  if (newCategoryValue.trim()) {
                                    setCreateForm({ ...createForm, category: newCategoryValue.trim() });
                                    // Add to available categories if not already present
                                    if (!availableCategories.includes(newCategoryValue.trim())) {
                                      setAvailableCategories([...availableCategories, newCategoryValue.trim()].sort());
                                    }
                                    setIsAddingNewCategory(false);
                                    setNewCategoryValue('');
                                  }
                                }
                              }}
                              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mh-green focus:border-transparent"
                              placeholder="Enter new category name..."
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (newCategoryValue.trim()) {
                                  setCreateForm({ ...createForm, category: newCategoryValue.trim() });
                                  // Add to available categories if not already present
                                  if (!availableCategories.includes(newCategoryValue.trim())) {
                                    setAvailableCategories([...availableCategories, newCategoryValue.trim()].sort());
                                  }
                                  setIsAddingNewCategory(false);
                                  setNewCategoryValue('');
                                }
                              }}
                              className="px-4 py-2 bg-mh-gradient text-white rounded-lg hover:opacity-90 transition-colors whitespace-nowrap"
                            >
                              Add
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setIsAddingNewCategory(false);
                                setNewCategoryValue('');
                                // Restore previous category if it exists in the list
                                if (createForm.category && availableCategories.includes(createForm.category)) {
                                  // Keep the current category
                                } else {
                                  setCreateForm({ ...createForm, category: '' });
                                }
                              }}
                              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors whitespace-nowrap"
                            >
                              Cancel
                            </button>
                          </div>
                          <p className="text-xs text-gray-500">Press Enter or click Add to save the new category</p>
                        </div>
                      )}
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
                    <div className="flex items-center space-x-3">
                      {/* JSON Upload Button */}
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept=".json"
                          onChange={handleJsonUpload}
                          className="hidden"
                        />
                        <span className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          Upload Questions JSON
                        </span>
                      </label>
                      
                      {/* Validate Schema Button */}
                      <button
                        type="button"
                        onClick={handleValidateSchema}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium shadow-sm"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Validate Schema
                      </button>
                      
                      {createForm.schemaJson.questions.length > 0 && (
                        <span className={`text-sm ${
                          validationErrors.errors.length > 0 
                            ? 'text-red-600' 
                            : validationErrors.warnings.length > 0 
                            ? 'text-yellow-600' 
                            : 'text-gray-600'
                        }`}>
                          {validationErrors.errors.length > 0 
                            ? `⚠️ ${validationErrors.errors.length} error(s)`
                            : validationErrors.warnings.length > 0
                            ? `⚠️ ${validationErrors.warnings.length} warning(s)`
                            : `✓ ${createForm.schemaJson.questions.length} question${createForm.schemaJson.questions.length !== 1 ? 's' : ''} added`}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Validation Errors Display */}
                  {validationErrors.errors.length > 0 && (
                    <div className="mb-4 p-4 bg-red-50 border-2 border-red-300 rounded-lg">
                      <div className="flex items-start mb-2">
                        <svg className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-red-800 mb-2">Schema Validation Errors ({validationErrors.errors.length}):</p>
                          <ul className="list-disc list-inside space-y-1">
                            {validationErrors.errors.slice(0, 5).map((error, idx) => (
                              <li key={idx} className="text-xs text-red-700">{error}</li>
                            ))}
                            {validationErrors.errors.length > 5 && (
                              <li className="text-xs text-red-600 italic">... and {validationErrors.errors.length - 5} more error(s)</li>
                            )}
                          </ul>
                        </div>
                        <button
                          type="button"
                          onClick={() => setValidationErrors({ errors: [], warnings: [], questionErrors: {} })}
                          className="ml-2 text-red-600 hover:text-red-800"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Validation Warnings Display */}
                  {validationErrors.warnings.length > 0 && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-start">
                        <svg className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-yellow-800 mb-1">Warnings ({validationErrors.warnings.length}):</p>
                          <ul className="list-disc list-inside space-y-1">
                            {validationErrors.warnings.slice(0, 3).map((warning, idx) => (
                              <li key={idx} className="text-xs text-yellow-700">{warning}</li>
                            ))}
                            {validationErrors.warnings.length > 3 && (
                              <li className="text-xs text-yellow-600 italic">... and {validationErrors.warnings.length - 3} more warning(s)</li>
                            )}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* JSON Upload Error Display */}
                  {jsonUploadError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start">
                        <svg className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="flex-1">
                          <p className="text-sm text-red-800 font-medium mb-1">JSON Upload Error:</p>
                          <p className="text-xs text-red-600">{jsonUploadError}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setJsonUploadError('')}
                          className="ml-2 text-red-600 hover:text-red-800"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* JSON Format Help */}
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-xs font-medium text-blue-900 mb-1">📄 JSON Upload Format:</p>
                        <p className="text-xs text-blue-800 mb-2">
                          Upload a JSON file with a "questions" array. Each question needs: <strong>id</strong>, <strong>text</strong>, <strong>type</strong>, <strong>options</strong> (for radio/checkbox/likert), <strong>order</strong>, <strong>required</strong>.
                        </p>
                        <p className="text-xs text-blue-700 mb-2">
                          <strong>Supported types:</strong> radio, checkbox, text, textarea, numeric, boolean, likert
                        </p>
                        <button
                          type="button"
                          onClick={downloadSampleJson}
                          className="text-xs text-blue-700 hover:text-blue-900 underline font-medium"
                        >
                          📥 Download Sample JSON Template
                        </button>
                      </div>
                    </div>
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
                              className="bg-mh-gradient text-white px-4 py-1 rounded text-sm hover:opacity-90 transition-colors"
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

                      {/* Show If Condition Section */}
                      <div className="border-t border-gray-200 pt-4 mt-4">
                        <div className="flex items-center justify-between mb-3">
                          <label className="block text-sm font-semibold text-gray-700">
                            Conditional Display (show_if)
                          </label>
                          <span className="text-xs text-gray-500">Optional</span>
                        </div>
                        <p className="text-xs text-gray-500 mb-3">
                          This question will only appear if the condition is met
                        </p>

                        <div className="space-y-3">
                          <select
                            value={showIfMode}
                            onChange={(e) => {
                              setShowIfMode(e.target.value);
                              if (e.target.value === 'none') {
                                setCurrentCondition({ questionId: '', operator: 'equals', value: '' });
                              }
                            }}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-mh-green focus:border-transparent"
                          >
                            <option value="none">No condition (always show)</option>
                            <option value="simple">Show if condition is met</option>
                          </select>

                          {showIfMode !== 'none' && (
                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-3">
                              {showIfMode === 'simple' && (
                                <>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                      Depends on Question
                                    </label>
                                    <select
                                      value={currentCondition.questionId}
                                      onChange={(e) => setCurrentCondition({ ...currentCondition, questionId: e.target.value })}
                                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-mh-green"
                                    >
                                      <option value="">Select a question...</option>
                                      {createForm.schemaJson.questions
                                        .filter(q => q.id !== currentQuestion.id) // Don't allow self-reference
                                        .map(q => (
                                          <option key={q.id} value={q.id}>
                                            {q.id}: {q.text.substring(0, 50)}{q.text.length > 50 ? '...' : ''}
                                          </option>
                                        ))}
                                    </select>
                                  </div>

                                  {currentCondition.questionId && (
                                    <>
                                      <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                          Operator
                                        </label>
                                        <select
                                          value={currentCondition.operator}
                                          onChange={(e) => setCurrentCondition({ ...currentCondition, operator: e.target.value, value: '' })}
                                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-mh-green"
                                          disabled
                                        >
                                          <option value="equals">Equals (=)</option>
                                        </select>
                                      </div>

                                      <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                          Value
                                        </label>
                                        <input
                                          type="text"
                                          value={currentCondition.value}
                                          onChange={(e) => setCurrentCondition({ ...currentCondition, value: e.target.value })}
                                          placeholder="Enter value"
                                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-mh-green"
                                        />
                                      </div>
                                    </>
                                  )}
                                </>
                              )}

                            </div>
                          )}
                        </div>
                      </div>

                      {/* Add Question Button */}
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={addQuestion}
                          disabled={!currentQuestion.id || !currentQuestion.text.trim() || currentQuestion.options.length < 2}
                          className="w-full bg-mh-gradient text-white px-4 py-3 rounded-lg hover:opacity-90 transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
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
                      {createForm.schemaJson.questions.map((q, idx) => {
                        const questionErrors = validationErrors.questionErrors[q.id] || [];
                        const hasErrors = questionErrors.length > 0;
                        
                        return (
                          <div 
                            key={idx} 
                            className={`bg-white border-2 rounded-lg p-3 flex justify-between items-start ${
                              hasErrors 
                                ? 'border-red-400 bg-red-50' 
                                : 'border-gray-200'
                            }`}
                          >
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className={`text-xs font-semibold ${hasErrors ? 'text-red-700' : 'text-mh-green'}`}>
                                  {q.id}
                                  {hasErrors && (
                                    <span className="ml-1 text-red-600" title={`${questionErrors.length} error(s)`}>
                                      ⚠️
                                    </span>
                                  )}
                                </span>
                                <span className="text-xs text-gray-500">Order: {q.order || idx + 1}</span>
                                <span className="text-xs text-gray-500">({q.type})</span>
                                {q.required && <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded">Required</span>}
                                {q.isCritical && <span className="text-xs bg-red-200 text-red-900 px-2 py-0.5 rounded font-semibold">Critical</span>}
                              </div>
                              <p className="text-sm text-gray-800">{q.text}</p>
                              {hasErrors && (
                                <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded text-xs">
                                  <p className="font-semibold text-red-800 mb-1">Errors:</p>
                                  <ul className="list-disc list-inside space-y-0.5">
                                    {questionErrors.map((error, errIdx) => (
                                      <li key={errIdx} className="text-red-700">{error}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
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
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Eligibility Rules Section */}
                <div className="border-b border-gray-200 pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-mh-dark">Eligibility Rules</h4>
                    <span className="text-xs text-gray-500">Optional: Restrict who can take this assessment</span>
                  </div>

                  <div className="space-y-4">
                    {/* Legacy: Simple minAge */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <label className="flex items-center space-x-2 mb-2">
                        <input
                          type="checkbox"
                          checked={createForm.eligibilityRules.minAge !== undefined}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCreateForm({
                                ...createForm,
                                eligibilityRules: { ...createForm.eligibilityRules, minAge: 18 }
                              });
                            } else {
                              const newRules = { ...createForm.eligibilityRules };
                              delete newRules.minAge;
                              setCreateForm({ ...createForm, eligibilityRules: newRules });
                            }
                          }}
                          className="rounded border-gray-300 text-mh-green focus:ring-mh-green"
                        />
                        <span className="text-sm font-medium text-gray-700">Set Minimum Age</span>
                      </label>
                      {createForm.eligibilityRules.minAge !== undefined && (
                        <div className="mt-2 ml-6">
                          <input
                            type="number"
                            value={createForm.eligibilityRules.minAge || ''}
                            onChange={(e) => setCreateForm({
                              ...createForm,
                              eligibilityRules: { ...createForm.eligibilityRules, minAge: Number(e.target.value) || 0 }
                            })}
                            min="0"
                            max="120"
                            className="w-32 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-mh-green focus:border-transparent"
                            placeholder="Minimum age"
                          />
                          <p className="text-xs text-gray-500 mt-1">Users must be at least this age to take the assessment</p>
                        </div>
                      )}
                    </div>

                  </div>
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
                    className="bg-mh-gradient text-white px-6 py-2 rounded-lg hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {creating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>{editingTestId ? 'Updating...' : 'Creating...'}</span>
                      </>
                    ) : (
                      <span>{editingTestId ? 'Update Assessment' : 'Create Assessment'}</span>
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

      {/* Delete Confirmation Modal */}
      {testIdToDelete && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative mx-auto p-6 border w-full max-w-sm shadow-xl rounded-lg bg-white">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Delete Assessment?
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                This will deactivate the assessment and it will no longer be visible to users. This action cannot be undone.
              </p>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={handleDeleteCancel}
                  disabled={deleting}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  disabled={deleting}
                  className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {deleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
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

