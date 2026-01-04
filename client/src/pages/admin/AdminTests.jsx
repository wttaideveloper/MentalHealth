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
  const [uploadedJsonFileName, setUploadedJsonFileName] = useState('');
  const [isProcessingJson, setIsProcessingJson] = useState(false);
  const [validationErrors, setValidationErrors] = useState({ errors: [], warnings: [], questionErrors: {} });
  const [availableCategories, setAvailableCategories] = useState([]);
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [newCategoryValue, setNewCategoryValue] = useState('');
  const [openSections, setOpenSections] = useState({
    basicInfo: true,
    pricing: false,
    uploadJson: false,
    addQuestions: false,
    viewQuestions: false,
    eligibility: false,
    scoringRules: false,
    riskRules: false
  });

  // Scoring Rules UI State
  const [scoringRulesState, setScoringRulesState] = useState({
    type: 'sum', // 'sum' or 'weighted_sum'
    items: [], // Array of question IDs to include (empty = all)
    weights: {}, // Object: { q1: 2, q2: 1.5 }
    bands: [], // Array: [{ min: 0, max: 10, label: 'Low' }]
    subscales: {} // Object: { 'Anxiety': ['q1', 'q2'] }
  });

  // Risk Rules UI State
  const [riskRulesState, setRiskRulesState] = useState({
    triggers: [] // Array: [{ questionId: 'q4', condition: 'gte', value: 8, flag: 'high_stress', helpText: '...' }]
  });

  // Eligibility Rules UI State
  const [eligibilityRulesState, setEligibilityRulesState] = useState({
    enabled: false,
    minAge: 18
  });

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
        // Load existing rules into UI state
        setScoringRulesState(transformScoringRulesFromBackend(testData.scoringRules || {}));
        setRiskRulesState(transformRiskRulesFromBackend(testData.riskRules || {}));
        setEligibilityRulesState(transformEligibilityRulesFromBackend(testData.eligibilityRules || {}));
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

    // Transform rules from UI state to backend format
    const scoringRules = transformScoringRulesToBackend(scoringRulesState);
    const riskRules = transformRiskRulesToBackend(riskRulesState);
    const eligibilityRules = transformEligibilityRulesToBackend(eligibilityRulesState);

    // Update questionsCount based on actual questions
    const formData = {
      ...createForm,
      questionsCount: createForm.schemaJson.questions.length,
      scoringRules,
      riskRules,
      eligibilityRules
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
    setUploadedJsonFileName('');
    setOpenSections({
      basicInfo: true,
      pricing: false,
      uploadJson: false,
      addQuestions: false,
      viewQuestions: false,
      eligibility: false,
      scoringRules: false,
      riskRules: false
    });
    setIsProcessingJson(false);
    setValidationErrors({ errors: [], warnings: [], questionErrors: {} });
    setIsAddingNewCategory(false);
    setNewCategoryValue('');
    // Reset rules states
    setScoringRulesState({
      type: 'sum',
      items: [],
      weights: {},
      bands: [],
      subscales: {}
    });
    setRiskRulesState({ triggers: [] });
    setEligibilityRulesState({ enabled: false, minAge: 18 });
  };

  const toggleSection = (section) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Transformation functions: UI State → Backend Format
  const transformScoringRulesToBackend = (uiState) => {
    if (!uiState || uiState.type === 'sum' && !uiState.bands.length && !Object.keys(uiState.subscales).length && uiState.items.length === 0) {
      return {};
    }

    const backend = {
      type: uiState.type || 'sum'
    };

    if (uiState.items.length > 0) {
      backend.items = uiState.items;
    }

    if (uiState.type === 'weighted_sum' && Object.keys(uiState.weights).length > 0) {
      backend.weights = uiState.weights;
    }

    if (uiState.bands.length > 0) {
      backend.bands = uiState.bands.map(band => ({
        min: Number(band.min),
        max: Number(band.max),
        label: band.label || ''
      }));
    }

    if (Object.keys(uiState.subscales).length > 0) {
      backend.subscales = uiState.subscales;
    }

    return backend;
  };

  const transformRiskRulesToBackend = (uiState) => {
    if (!uiState || !uiState.triggers || uiState.triggers.length === 0) {
      return {};
    }

    const triggers = uiState.triggers.map(trigger => {
      const backendTrigger = {
        questionId: trigger.questionId,
        flag: trigger.flag || 'risk',
        helpText: trigger.helpText || ''
      };

      // Add condition based on condition type
      if (trigger.condition === 'equals') {
        backendTrigger.equals = Number(trigger.value);
      } else if (trigger.condition === 'gte') {
        backendTrigger.gte = Number(trigger.value);
      } else if (trigger.condition === 'lte') {
        backendTrigger.lte = Number(trigger.value);
      }

      return backendTrigger;
    }).filter(t => t.questionId); // Filter out triggers without questionId

    return triggers.length > 0 ? { triggers } : {};
  };

  const transformEligibilityRulesToBackend = (uiState) => {
    if (!uiState || !uiState.enabled) {
      return {};
    }

    return {
      minAge: Number(uiState.minAge) || 18
    };
  };

  // Reverse transformation: Backend Format → UI State
  const transformScoringRulesFromBackend = (backendRules) => {
    if (!backendRules || Object.keys(backendRules).length === 0) {
      return {
        type: 'sum',
        items: [],
        weights: {},
        bands: [],
        subscales: {}
      };
    }

    return {
      type: backendRules.type || 'sum',
      items: Array.isArray(backendRules.items) ? backendRules.items : [],
      weights: backendRules.weights || {},
      bands: Array.isArray(backendRules.bands) ? backendRules.bands : [],
      subscales: backendRules.subscales || {}
    };
  };

  const transformRiskRulesFromBackend = (backendRules) => {
    if (!backendRules || !backendRules.triggers || !Array.isArray(backendRules.triggers)) {
      return { triggers: [] };
    }

    const triggers = backendRules.triggers.map(trigger => {
      let condition = 'equals';
      let value = 0;

      if (trigger.equals !== undefined) {
        condition = 'equals';
        value = trigger.equals;
      } else if (trigger.gte !== undefined) {
        condition = 'gte';
        value = trigger.gte;
      } else if (trigger.lte !== undefined) {
        condition = 'lte';
        value = trigger.lte;
      }

      return {
        questionId: trigger.questionId || '',
        condition,
        value,
        flag: trigger.flag || 'risk',
        helpText: trigger.helpText || ''
      };
    });

    return { triggers };
  };

  const transformEligibilityRulesFromBackend = (backendRules) => {
    if (!backendRules || !backendRules.minAge) {
      return {
        enabled: false,
        minAge: 18
      };
    }

    return {
      enabled: true,
      minAge: Number(backendRules.minAge) || 18
    };
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
      setUploadedJsonFileName('');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast.error('File size must be less than 5MB');
      setJsonUploadError('File size exceeds 5MB limit.');
      e.target.value = '';
      setUploadedJsonFileName('');
      return;
    }

    setIsProcessingJson(true);
    setJsonUploadError('');
    setUploadedJsonFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const fileContent = event.target.result;
        if (!fileContent || fileContent.trim() === '') {
          throw new Error('JSON file is empty');
        }

        let parsedData;
        try {
          parsedData = JSON.parse(fileContent);
        } catch (parseError) {
          throw new Error(`Invalid JSON format: ${parseError.message}`);
        }

        if (!parsedData) {
          throw new Error('JSON file is empty or invalid');
        }
        
        // Handle different JSON formats
        let jsonData = parsedData;
        let questionsArray = null;
        
        // Case 1: Direct questions array
        if (Array.isArray(parsedData)) {
          questionsArray = parsedData;
        }
        // Case 2: Has questions property
        else if (parsedData.questions && Array.isArray(parsedData.questions)) {
          questionsArray = parsedData.questions;
          jsonData = parsedData;
        }
        // Case 3: Wrapped in schemaJson
        else if (parsedData.schemaJson && parsedData.schemaJson.questions && Array.isArray(parsedData.schemaJson.questions)) {
          questionsArray = parsedData.schemaJson.questions;
          jsonData = parsedData.schemaJson;
        }
        // Case 4: Has items property (alternative name)
        else if (parsedData.items && Array.isArray(parsedData.items)) {
          questionsArray = parsedData.items;
          jsonData = parsedData;
        }
        // Case 5: Single question object (has id, text, type)
        else if (typeof parsedData === 'object' && !Array.isArray(parsedData)) {
          // Check if it's a single question object
          if (parsedData.id && (parsedData.text || parsedData.question) && parsedData.type) {
            questionsArray = [parsedData];
            jsonData = { questions: questionsArray };
          }
          // Case 6: Object with question IDs as keys
          else {
            const keys = Object.keys(parsedData);
            if (keys.length > 0) {
              const firstKey = keys[0];
              const firstItem = parsedData[firstKey];
              // Check if it looks like questions object
              if (firstItem && typeof firstItem === 'object' && (firstItem.id || firstItem.text || firstItem.question || firstItem.type)) {
                // Convert object to array
                questionsArray = keys.map(key => {
                  const item = parsedData[key];
                  // If item already has an id, use it; otherwise use the key
                  return {
                    id: item.id || key,
                    ...item
                  };
                });
                jsonData = { questions: questionsArray };
              } else {
                // Case 7: Try to find any array property that might contain questions
                for (const key of keys) {
                  const value = parsedData[key];
                  if (Array.isArray(value) && value.length > 0) {
                    // Check if first item looks like a question
                    const firstArrayItem = value[0];
                    if (firstArrayItem && typeof firstArrayItem === 'object' && 
                        (firstArrayItem.id || firstArrayItem.text || firstArrayItem.question || firstArrayItem.type)) {
                      questionsArray = value;
                      jsonData = { questions: questionsArray };
                      break;
                    }
                  }
                }
              }
            }
          }
        }

        // Validate JSON structure
        if (!questionsArray || !Array.isArray(questionsArray)) {
          const receivedType = Array.isArray(parsedData) ? 'array' : typeof parsedData;
          const receivedKeys = typeof parsedData === 'object' && !Array.isArray(parsedData) 
            ? Object.keys(parsedData).join(', ') 
            : 'N/A';
          
          throw new Error(
            `JSON must contain a "questions" array. ` +
            `Received: ${receivedType}${receivedKeys !== 'N/A' ? ` with keys: ${receivedKeys}` : ''}. ` +
            `Supported formats:\n` +
            `1. { "questions": [...] }\n` +
            `2. [ { "id": "...", "text": "...", ... }, ... ]\n` +
            `3. { "schemaJson": { "questions": [...] } }`
          );
        }

        if (questionsArray.length === 0) {
          throw new Error('Questions array cannot be empty');
        }

        // Validate each question
        const validatedQuestions = [];
        const questionIds = new Set();

        questionsArray.forEach((q, index) => {
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
          // Note: Questions with subQuestions may not need options (they act as containers)
          if (['radio', 'checkbox', 'likert'].includes(questionType)) {
            const hasSubQuestions = (q.subQuestions && Array.isArray(q.subQuestions) && q.subQuestions.length > 0) ||
                                   (q.children && Array.isArray(q.children) && q.children.length > 0);
            
            // If question has subQuestions, options are optional
            if (!hasSubQuestions) {
              if (!q.options || !Array.isArray(q.options) || q.options.length < 2) {
                throw new Error(`Question ${index + 1}: Must have at least 2 options for type "${questionType}" (or include subQuestions)`);
              }
            } else {
              // If it has subQuestions, options are optional but if provided, should be valid
              if (q.options && Array.isArray(q.options) && q.options.length > 0 && q.options.length < 2) {
                throw new Error(`Question ${index + 1}: If options are provided for type "${questionType}", must have at least 2 options`);
              }
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
            })) : [],
            // Preserve sub-questions if present
            subQuestions: q.subQuestions || q.children || [],
            // Preserve show_if conditions
            show_if: q.show_if || q.showIf || undefined,
            // Preserve other numeric constraints
            min: q.min !== undefined ? Number(q.min) : undefined,
            max: q.max !== undefined ? Number(q.max) : undefined,
            step: q.step !== undefined ? Number(q.step) : undefined,
            maxLength: q.maxLength !== undefined ? Number(q.maxLength) : undefined,
            rows: q.rows !== undefined ? Number(q.rows) : undefined
          };
          
          // Remove undefined fields to keep JSON clean
          Object.keys(validatedQuestion).forEach(key => {
            if (validatedQuestion[key] === undefined) {
              delete validatedQuestion[key];
            }
          });

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
        setUploadedJsonFileName('');
        showToast.error(`JSON Error: ${error.message}`);
      } finally {
        setIsProcessingJson(false);
      }

      // Reset file input
      e.target.value = '';
    };

    reader.onerror = () => {
      showToast.error('Failed to read file');
      setJsonUploadError('Failed to read file. Please try again.');
      setUploadedJsonFileName('');
      setIsProcessingJson(false);
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
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-mh-dark">Assessments</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Create and manage mental health assessments</p>
        </div>
        <button
          onClick={() => {
            resetCreateForm();
            setEditingTestId(null);
            setShowCreateModal(true);
          }}
          className="w-full sm:w-auto bg-mh-gradient text-white px-4 sm:px-6 py-2 rounded-lg hover:opacity-90 transition-colors text-sm sm:text-base"
        >
          Create Assessment
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title or category..."
              className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mh-green focus:border-transparent text-sm sm:text-base"
            />
          </div>
          <div className="w-full sm:w-48">
            <select
              value={isActiveFilter}
              onChange={(e) => {
                setIsActiveFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mh-green focus:border-transparent text-sm sm:text-base"
            >
              <option value="all">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full sm:w-auto bg-mh-gradient text-white px-4 sm:px-6 py-2 rounded-lg hover:opacity-90 transition-colors text-sm sm:text-base"
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
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${test.isActive
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

              <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleViewTest(test._id)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 hover:shadow-sm transition-all duration-200 whitespace-nowrap flex-1 min-w-[80px] justify-center sm:flex-initial"
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
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 hover:border-emerald-300 hover:shadow-sm transition-all duration-200 whitespace-nowrap flex-1 min-w-[80px] justify-center sm:flex-initial"
                  title="Edit Assessment"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </button>
                <button
                  onClick={() => handleToggleActive(test)}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg hover:shadow-sm transition-all duration-200 whitespace-nowrap flex-1 min-w-[100px] justify-center sm:flex-initial ${test.isActive
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
                      <span className="hidden sm:inline">Deactivate</span>
                      <span className="sm:hidden">Deact</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="hidden sm:inline">Activate</span>
                      <span className="sm:hidden">Act</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleDeleteClick(test._id)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 hover:border-red-300 hover:shadow-sm transition-all duration-200 whitespace-nowrap flex-1 min-w-[80px] justify-center sm:flex-initial"
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
        <div className="bg-white px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-4 border border-gray-200 rounded-lg sm:px-6">
          <div className="flex-1 flex justify-between w-full sm:hidden">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex-1 mr-2"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= pagination.pages}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex-1 ml-2"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-700">
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
                      className={`relative inline-flex items-center px-3 sm:px-4 py-2 border text-sm font-medium ${page === pageNum
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

      {/* Create/Edit Test Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="relative bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col my-4 sm:my-8 overflow-hidden">
            {/* Modal Header */}
            <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 sm:gap-3 mb-2">
                    <div className="p-1.5 sm:p-2 bg-gradient-to-br from-mh-green/10 to-emerald-100 rounded-lg flex-shrink-0">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-mh-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">
                        {editingTestId ? 'Edit Assessment' : 'Create New Assessment'}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 mt-1">
                        {createForm.schemaJson.questions.length > 0
                          ? `${createForm.schemaJson.questions.length} question${createForm.schemaJson.questions.length !== 1 ? 's' : ''} added`
                          : 'Design and configure your assessment'}
                      </p>
                    </div>
                  </div>
                  {/* Progress Steps */}
                  <div className="hidden sm:flex items-center gap-2 lg:gap-4 mt-4 overflow-x-auto">
                    {['Basic Info', 'Content', 'Settings', 'Review'].map((step, index) => (
                      <div key={step} className="flex items-center gap-1 lg:gap-2 flex-shrink-0">
                        <div className={`w-6 h-6 lg:w-8 lg:h-8 rounded-full flex items-center justify-center text-xs lg:text-sm font-medium
                    ${index === 0 ? 'bg-mh-green text-white' : 'bg-gray-100 text-gray-500'}`}>
                          {index + 1}
                        </div>
                        <span className={`text-xs lg:text-sm font-medium hidden lg:inline ${index === 0 ? 'text-gray-900' : 'text-gray-500'}`}>
                          {step}
                        </span>
                        {index < 3 && (
                          <div className="w-6 lg:w-12 h-0.5 bg-gray-200 mx-1 lg:mx-2" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetCreateForm();
                  }}
                  className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1.5 sm:p-2 transition-all duration-200 flex-shrink-0"
                  aria-label="Close modal"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateTest} className="flex-1 overflow-y-auto">
              <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
                {/* Section: Basic Information */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-base sm:text-lg font-semibold text-gray-900">Basic Information</h4>
                          <p className="text-xs sm:text-sm text-gray-500">Core assessment details</p>
                        </div>
                      </div>
                      <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 sm:px-3 py-1 rounded-full self-start sm:self-auto">Required</span>
                    </div>
                  </div>
                  <div className="p-4 sm:p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                      <div className="md:col-span-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-800 mb-2">
                          <span>Assessment Title</span>
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={createForm.title}
                          onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                          required
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm sm:text-base"
                          placeholder="e.g., Depression Screening Test"
                        />
                        <p className="text-xs text-gray-500 mt-2">Enter a clear, descriptive title for your assessment</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-800 mb-2">Category</label>
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
                              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 appearance-none"
                            >
                              <option value="">Select a category...</option>
                              {availableCategories.map((category) => (
                                <option key={category} value={category}>
                                  {category}
                                </option>
                              ))}
                              <option value="__add_new__" className="font-semibold text-blue-600">
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
                                      handleAddCategory(newCategoryValue.trim());
                                    }
                                  }
                                }}
                                className="flex-1 px-4 py-3 bg-white border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                placeholder="Enter new category name..."
                                autoFocus
                              />
                              <button
                                type="button"
                                onClick={() => newCategoryValue.trim() && handleAddCategory(newCategoryValue.trim())}
                                className="px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 whitespace-nowrap font-medium"
                              >
                                Add
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-800 mb-2">Tag</label>
                        <input
                          type="text"
                          value={createForm.tag}
                          onChange={(e) => setCreateForm({ ...createForm, tag: e.target.value })}
                          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                          placeholder="e.g., Research-Based, Clinical"
                        />
                      </div>

                      {/* Image Upload UI - Commented out temporarily, will fix next time */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-800 mb-2">Assessment Image</label>
                        {imagePreview ? (
                          <div className="space-y-3">
                            <div className="relative group">
                              <img
                                src={imagePreview}
                                alt="Assessment preview"
                                className="w-full h-48 object-cover rounded-lg border-2 border-gray-200"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setImagePreview('');
                                  setCreateForm(prev => ({ ...prev, imageUrl: '' }));
                                }}
                                className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                                aria-label="Remove image"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                            <label className="cursor-pointer block">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                                disabled={uploadingImage}
                              />
                              <div className={`w-full px-4 py-2 text-center text-sm font-medium text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors ${uploadingImage ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                {uploadingImage ? 'Uploading...' : 'Change Image'}
                              </div>
                            </label>
                          </div>
                        ) : (
                          <label className="cursor-pointer block">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="hidden"
                              disabled={uploadingImage}
                            />
                            <div className={`w-full p-4 border-2 border-dashed border-blue-300 rounded-lg bg-white hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 ${uploadingImage ? 'opacity-50 cursor-not-allowed' : ''}`}>
                              <div className="flex flex-col items-center justify-center text-center">
                                {uploadingImage ? (
                                  <>
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
                                    <p className="text-sm font-medium text-gray-700">Uploading image...</p>
                                  </>
                                ) : (
                                  <>
                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                                      <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>
                                    </div>
                                    <p className="text-sm font-medium text-gray-900 mb-1">Upload Assessment Image</p>
                                    <p className="text-xs text-gray-500">Click to upload or drag and drop</p>
                                    <p className="text-xs text-gray-400 mt-1">PNG, JPG, GIF up to 5MB</p>
                                  </>
                                )}
                              </div>
                            </div>
                          </label>
                        )}
                        <p className="text-xs text-gray-500 mt-2">Upload an image for your assessment (recommended: 800x600px)</p>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-800 mb-2">Short Description</label>
                        <input
                          type="text"
                          value={createForm.shortDescription}
                          onChange={(e) => setCreateForm({ ...createForm, shortDescription: e.target.value })}
                          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                          placeholder="Brief overview shown in assessment lists"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-800 mb-2">Detailed Description</label>
                        <textarea
                          value={createForm.longDescription}
                          onChange={(e) => setCreateForm({ ...createForm, longDescription: e.target.value })}
                          rows="4"
                          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none"
                          placeholder="Comprehensive description shown on the assessment detail page"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section: Assessment Content */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-base sm:text-lg font-semibold text-gray-900">Assessment Content</h4>
                          <p className="text-xs sm:text-sm text-gray-500">Add questions and structure</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {createForm.schemaJson.questions.length > 0 && (
                          <span className="text-xs sm:text-sm font-medium text-green-600 bg-green-50 px-2 sm:px-3 py-1 rounded-full">
                            {createForm.schemaJson.questions.length} questions
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                    {/* Upload Questions JSON - Primary Option */}
                    <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-300 rounded-xl p-4 sm:p-6 shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4 sm:mb-5">
                        <div className="flex items-start gap-3 sm:gap-4 flex-1">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                              <h5 className="text-base sm:text-lg font-bold text-gray-900">Upload Questions JSON</h5>
                              <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 sm:px-2.5 py-1 rounded-full">Recommended</span>
                            </div>
                            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">Upload questions via JSON file for fast bulk import. This is the fastest way to add multiple questions at once.</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 sm:ml-4 flex-shrink-0">
                          {uploadedJsonFileName && (
                            <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-green-200">
                              ✓ Imported
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-4">
                        {!uploadedJsonFileName ? (
                          <label className="cursor-pointer block">
                            <input
                              type="file"
                              accept=".json"
                              onChange={handleJsonUpload}
                              className="hidden"
                              disabled={isProcessingJson}
                            />
                            <div className={`w-full p-4 border-2 border-dashed border-blue-300 rounded-lg bg-white hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 ${isProcessingJson ? 'opacity-50' : ''}`}>
                              <div className="flex flex-col items-center justify-center text-center">
                                {isProcessingJson ? (
                                  <>
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
                                    <p className="text-sm font-medium text-gray-700">Processing JSON file...</p>
                                  </>
                                ) : (
                                  <>
                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                                      <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                      </svg>
                                    </div>
                                    <p className="text-sm font-medium text-gray-900 mb-1">Upload JSON File</p>
                                    <p className="text-xs text-gray-500">Click or drag to upload your questions JSON</p>
                                  </>
                                )}
                              </div>
                            </div>
                          </label>
                        ) : (
                          <div className="bg-white border border-green-200 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                  <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{uploadedJsonFileName}</p>
                                  <p className="text-xs text-green-600">Successfully imported</p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => setUploadedJsonFileName('')}
                                className="text-gray-400 hover:text-gray-600"
                              >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* JSON Upload Error Display */}
                        {jsonUploadError && (
                          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 animate-in fade-in slide-in-from-top-2">
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 mt-0.5">
                                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                                  <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-3 mb-2">
                                  <h6 className="text-sm font-semibold text-red-900">Upload Error</h6>
                                  <button
                                    type="button"
                                    onClick={() => setJsonUploadError('')}
                                    className="text-red-400 hover:text-red-600 transition-colors flex-shrink-0"
                                    aria-label="Dismiss error"
                                  >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                                <div className="bg-white border border-red-100 rounded-md p-3 mt-2">
                                  <p className="text-sm text-red-800 font-medium whitespace-pre-wrap break-words leading-relaxed">
                                    {jsonUploadError}
                                  </p>
                                </div>
                                <div className="mt-3 pt-3 border-t border-red-200">
                                  <p className="text-xs text-red-700 font-medium mb-1">💡 Quick Fix Tips:</p>
                                  <ul className="text-xs text-red-600 space-y-1 ml-4 list-disc">
                                    <li>Check that your JSON file has a valid structure with a "questions" array</li>
                                    <li>Ensure all questions have required fields: id, text, and type</li>
                                    <li>For radio, checkbox, and likert types, include at least 2 options</li>
                                    <li>Each option must have both "value" and "label" fields</li>
                                    <li>Download the JSON template below for reference</li>
                                  </ul>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <button
                            type="button"
                            onClick={downloadSampleJson}
                            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Download JSON Template
                          </button>

                          <span className="text-xs text-gray-500">Supported formats: radio, checkbox, text, likert</span>
                        </div>
                      </div>
                    </div>

                    {/* Add Questions Manually - Optional Accordion */}
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                      <button
                        type="button"
                        onClick={() => toggleSection('addQuestions')}
                        className="w-full bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-100 hover:from-gray-100 hover:to-gray-50 transition-all duration-200 flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                            <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          </div>
                          <div className="text-left">
                            <h5 className="text-base font-semibold text-gray-900 group-hover:text-gray-950">Add Questions Manually</h5>
                            <p className="text-xs text-gray-500 mt-0.5">Optional: Add questions one by one</p>
                          </div>
                        </div>
                        <svg
                          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${openSections.addQuestions ? 'rotate-180' : ''}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {openSections.addQuestions && (
                        <div className="p-6 space-y-6">
                        {/* Question Form */}
                        <div className="space-y-6">
                          {/* Basic Info */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className="block text-sm font-medium text-gray-800 mb-2">
                                Question ID <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={currentQuestion.id}
                                onChange={(e) => setCurrentQuestion({ ...currentQuestion, id: e.target.value })}
                                placeholder="e.g., q1, q2"
                                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-800 mb-2">
                                Display Order <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="number"
                                value={currentQuestion.order}
                                onChange={(e) => setCurrentQuestion({ ...currentQuestion, order: Number(e.target.value) || 1 })}
                                min="1"
                                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                              />
                            </div>
                          </div>

                          {/* Question Text */}
                          <div>
                            <label className="block text-sm font-medium text-gray-800 mb-2">
                              Question Text <span className="text-red-500">*</span>
                            </label>
                            <textarea
                              value={currentQuestion.text}
                              onChange={(e) => setCurrentQuestion({ ...currentQuestion, text: e.target.value })}
                              rows="2"
                              placeholder="Enter the question that users will see..."
                              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 resize-none"
                            />
                          </div>

                          {/* Options */}
                          <div>
                            <label className="block text-sm font-medium text-gray-800 mb-4">
                              Answer Options <span className="text-red-500">*</span>
                              <span className="text-xs font-normal text-gray-500 ml-2">Add at least 2 options with scores</span>
                            </label>

                            {/* Options List */}
                            <div className="space-y-3 mb-4">
                              {currentQuestion.options.map((opt, idx) => (
                                <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                  <div className="w-16 flex-shrink-0">
                                    <span className="text-sm font-semibold text-purple-600">Score: {opt.value}</span>
                                  </div>
                                  <div className="flex-1 text-gray-700">{opt.label}</div>
                                  <button
                                    type="button"
                                    onClick={() => removeOption(idx)}
                                    className="text-gray-400 hover:text-red-500 transition-colors"
                                  >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                              ))}
                            </div>

                            {/* Add Option Form */}
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                                <div className="md:col-span-3">
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Score</label>
                                  <input
                                    type="number"
                                    value={currentOption.value}
                                    onChange={(e) => setCurrentOption({ ...currentOption, value: e.target.value })}
                                    placeholder="0"
                                    min="0"
                                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                                  />
                                </div>
                                <div className="md:col-span-7">
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Option Label</label>
                                  <input
                                    type="text"
                                    value={currentOption.label}
                                    onChange={(e) => setCurrentOption({ ...currentOption, label: e.target.value })}
                                    placeholder="Enter option text..."
                                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                                  />
                                </div>
                                <div className="md:col-span-2 flex items-end">
                                  <button
                                    type="button"
                                    onClick={addOption}
                                    className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-2 rounded hover:shadow-lg transition-all duration-200 font-medium"
                                  >
                                    Add
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Settings */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex items-center gap-3">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <div className="relative">
                                  <input
                                    type="checkbox"
                                    checked={currentQuestion.required}
                                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, required: e.target.checked })}
                                    className="sr-only"
                                  />
                                  <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all duration-200 ${currentQuestion.required
                                      ? 'bg-blue-500 border-blue-500'
                                      : 'bg-white border-gray-300'
                                    }`}>
                                    {currentQuestion.required && (
                                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                      </svg>
                                    )}
                                  </div>
                                </div>
                                <span className="text-sm font-medium text-gray-700">Required Question</span>
                              </label>
                            </div>

                            <div className="flex items-center gap-3">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <div className="relative">
                                  <input
                                    type="checkbox"
                                    checked={currentQuestion.isCritical}
                                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, isCritical: e.target.checked })}
                                    className="sr-only"
                                  />
                                  <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all duration-200 ${currentQuestion.isCritical
                                      ? 'bg-red-500 border-red-500'
                                      : 'bg-white border-gray-300'
                                    }`}>
                                    {currentQuestion.isCritical && (
                                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                      </svg>
                                    )}
                                  </div>
                                </div>
                                <span className="text-sm font-medium text-red-600">Critical Question</span>
                              </label>
                            </div>
                          </div>

                          {/* Help Text */}
                          {currentQuestion.isCritical && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                              <label className="block text-sm font-semibold text-red-700 mb-2">
                                Help Text (Required for Critical Questions)
                              </label>
                              <textarea
                                value={currentQuestion.helpText}
                                onChange={(e) => setCurrentQuestion({ ...currentQuestion, helpText: e.target.value })}
                                rows="3"
                                placeholder="Provide safety information and support resources..."
                                className="w-full px-4 py-3 bg-white border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 resize-none"
                              />
                              <p className="text-xs text-red-600 mt-2">⚠️ Critical questions must include safety information and support guidance.</p>
                            </div>
                          )}

                          {/* Add Question Button */}
                          <div>
                            <button
                              type="button"
                              onClick={addQuestion}
                              disabled={!currentQuestion.id || !currentQuestion.text.trim() || currentQuestion.options.length < 2}
                              className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white px-6 py-4 rounded-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-3"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                              Add Question to Assessment
                            </button>
                          </div>
                        </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section: Settings */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-base sm:text-lg font-semibold text-gray-900">Settings & Configuration</h4>
                          <p className="text-xs sm:text-sm text-gray-500">Pricing, duration, and display settings</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 sm:p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Pricing */}
                      <div className="space-y-4">
                        <h5 className="text-sm font-semibold text-gray-900 mb-3">Pricing</h5>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Price (₹)</label>
                            <input
                              type="number"
                              value={createForm.price}
                              onChange={(e) => setCreateForm({ ...createForm, price: Number(e.target.value) || 0 })}
                              min="0"
                              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">MRP (₹)</label>
                            <input
                              type="number"
                              value={createForm.mrp}
                              onChange={(e) => setCreateForm({ ...createForm, mrp: Number(e.target.value) || 0 })}
                              min="0"
                              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Duration */}
                      <div className="space-y-4">
                        <h5 className="text-sm font-semibold text-gray-900 mb-3">Duration</h5>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Min (minutes)</label>
                            <input
                              type="number"
                              value={createForm.durationMinutesMin}
                              onChange={(e) => setCreateForm({ ...createForm, durationMinutesMin: Number(e.target.value) || 0 })}
                              min="0"
                              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Max (minutes)</label>
                            <input
                              type="number"
                              value={createForm.durationMinutesMax}
                              onChange={(e) => setCreateForm({ ...createForm, durationMinutesMax: Number(e.target.value) || 0 })}
                              min="0"
                              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Additional Settings */}
                      <div className="md:col-span-2 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Time Limit (seconds)</label>
                            <input
                              type="number"
                              value={createForm.timeLimitSeconds}
                              onChange={(e) => setCreateForm({ ...createForm, timeLimitSeconds: Number(e.target.value) || 0 })}
                              min="0"
                              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                            />
                            <p className="text-xs text-gray-500 mt-2">0 = no time limit</p>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Popularity Score</label>
                            <input
                              type="number"
                              value={createForm.popularityScore}
                              onChange={(e) => setCreateForm({ ...createForm, popularityScore: Number(e.target.value) || 0 })}
                              min="0"
                              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                            />
                          </div>

                          <div className="flex items-center">
                            <label className="flex items-center gap-3 cursor-pointer">
                              <div className="relative">
                                <input
                                  type="checkbox"
                                  checked={createForm.isActive}
                                  onChange={(e) => setCreateForm({ ...createForm, isActive: e.target.checked })}
                                  className="sr-only"
                                />
                                <div className={`w-10 h-6 rounded-full transition-all duration-300 ${createForm.isActive
                                    ? 'bg-emerald-500'
                                    : 'bg-gray-300'
                                  }`}>
                                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 ${createForm.isActive
                                      ? 'left-5'
                                      : 'left-1'
                                    }`} />
                                </div>
                              </div>
                              <div>
                                <span className="text-sm font-medium text-gray-700">Active</span>
                                <p className="text-xs text-gray-500">Visible to users</p>
                              </div>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section: Scoring Rules Configuration */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                    <button
                      type="button"
                      onClick={() => toggleSection('scoringRules')}
                      className="w-full flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                        <div className="text-left">
                          <h4 className="text-base sm:text-lg font-semibold text-gray-900 group-hover:text-gray-950">Scoring Rules Configuration</h4>
                          <p className="text-xs sm:text-sm text-gray-500">Configure how scores are calculated and interpreted</p>
                        </div>
                      </div>
                      <svg
                        className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${openSections.scoringRules ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>

                  {openSections.scoringRules && (
                    <div className="p-4 sm:p-6 space-y-6">
                      {/* Scoring Method */}
                      <div>
                        <label className="block text-sm font-medium text-gray-800 mb-2">
                          Scoring Method
                        </label>
                        <select
                          value={scoringRulesState.type}
                          onChange={(e) => setScoringRulesState({ ...scoringRulesState, type: e.target.value })}
                          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        >
                          <option value="sum">Simple Sum</option>
                          <option value="weighted_sum">Weighted Sum</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-2">
                          {scoringRulesState.type === 'sum' 
                            ? 'Scores are calculated by adding up all answer values' 
                            : 'Scores are calculated using custom weights for each question'}
                        </p>
                      </div>

                      {/* Weighted Weights Configuration */}
                      {scoringRulesState.type === 'weighted_sum' && createForm.schemaJson.questions.length > 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <label className="block text-sm font-semibold text-blue-900 mb-3">
                            Question Weights
                          </label>
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {createForm.schemaJson.questions.map((q) => (
                              <div key={q.id} className="flex items-center gap-3 bg-white rounded-lg p-3 border border-blue-200">
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-gray-900 truncate">{q.id}</div>
                                  <div className="text-xs text-gray-500 truncate">{q.text}</div>
                                </div>
                                <div className="w-24">
                                  <input
                                    type="number"
                                    value={scoringRulesState.weights[q.id] || 1}
                                    onChange={(e) => {
                                      const newWeights = { ...scoringRulesState.weights };
                                      const value = Number(e.target.value);
                                      if (value > 0) {
                                        newWeights[q.id] = value;
                                      } else {
                                        delete newWeights[q.id];
                                      }
                                      setScoringRulesState({ ...scoringRulesState, weights: newWeights });
                                    }}
                                    min="0.1"
                                    step="0.1"
                                    placeholder="1"
                                    className="w-full px-3 py-2 bg-white border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-blue-700 mt-3">Set weight multiplier for each question. Default weight is 1.</p>
                        </div>
                      )}

                      {/* Score Bands */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <label className="block text-sm font-medium text-gray-800">
                            Score Bands (for interpretation)
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setScoringRulesState({
                                ...scoringRulesState,
                                bands: [...scoringRulesState.bands, { min: 0, max: 10, label: '' }]
                              });
                            }}
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add Band
                          </button>
                        </div>
                        <div className="space-y-3">
                          {scoringRulesState.bands.map((band, index) => (
                            <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                              <div className="flex-1 grid grid-cols-3 gap-3">
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Min</label>
                                  <input
                                    type="number"
                                    value={band.min}
                                    onChange={(e) => {
                                      const newBands = [...scoringRulesState.bands];
                                      newBands[index].min = Number(e.target.value) || 0;
                                      setScoringRulesState({ ...scoringRulesState, bands: newBands });
                                    }}
                                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Max</label>
                                  <input
                                    type="number"
                                    value={band.max}
                                    onChange={(e) => {
                                      const newBands = [...scoringRulesState.bands];
                                      newBands[index].max = Number(e.target.value) || 0;
                                      setScoringRulesState({ ...scoringRulesState, bands: newBands });
                                    }}
                                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Label</label>
                                  <input
                                    type="text"
                                    value={band.label}
                                    onChange={(e) => {
                                      const newBands = [...scoringRulesState.bands];
                                      newBands[index].label = e.target.value;
                                      setScoringRulesState({ ...scoringRulesState, bands: newBands });
                                    }}
                                    placeholder="e.g., Low, Moderate"
                                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                  />
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const newBands = scoringRulesState.bands.filter((_, i) => i !== index);
                                  setScoringRulesState({ ...scoringRulesState, bands: newBands });
                                }}
                                className="text-red-400 hover:text-red-600 transition-colors"
                              >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          ))}
                          {scoringRulesState.bands.length === 0 && (
                            <p className="text-sm text-gray-500 text-center py-4">No score bands configured. Click "Add Band" to create one.</p>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Score bands help interpret results (e.g., 0-10 = Low, 11-20 = Moderate)</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Section: Risk Rules Configuration */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                    <button
                      type="button"
                      onClick={() => toggleSection('riskRules')}
                      className="w-full flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        </div>
                        <div className="text-left">
                          <h4 className="text-base sm:text-lg font-semibold text-gray-900 group-hover:text-gray-950">Risk Rules Configuration</h4>
                          <p className="text-xs sm:text-sm text-gray-500">Set up triggers for risk detection and safety alerts</p>
                        </div>
                      </div>
                      <svg
                        className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${openSections.riskRules ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>

                  {openSections.riskRules && (
                    <div className="p-4 sm:p-6 space-y-4">
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-sm text-gray-600">Configure risk triggers that will flag concerning responses</p>
                        <button
                          type="button"
                          onClick={() => {
                            setRiskRulesState({
                              ...riskRulesState,
                              triggers: [...riskRulesState.triggers, {
                                questionId: '',
                                condition: 'gte',
                                value: 0,
                                flag: '',
                                helpText: ''
                              }]
                            });
                          }}
                          className="text-sm text-red-600 hover:text-red-800 font-medium flex items-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Add Trigger
                        </button>
                      </div>

                      <div className="space-y-4">
                        {riskRulesState.triggers.map((trigger, index) => (
                          <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-4">
                            <div className="flex items-center justify-between">
                              <h5 className="text-sm font-semibold text-red-900">Risk Trigger #{index + 1}</h5>
                              <button
                                type="button"
                                onClick={() => {
                                  const newTriggers = riskRulesState.triggers.filter((_, i) => i !== index);
                                  setRiskRulesState({ ...riskRulesState, triggers: newTriggers });
                                }}
                                className="text-red-400 hover:text-red-600 transition-colors"
                              >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-800 mb-2">Question</label>
                                <select
                                  value={trigger.questionId}
                                  onChange={(e) => {
                                    const newTriggers = [...riskRulesState.triggers];
                                    newTriggers[index].questionId = e.target.value;
                                    setRiskRulesState({ ...riskRulesState, triggers: newTriggers });
                                  }}
                                  className="w-full px-3 py-2 bg-white border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
                                >
                                  <option value="">Select a question...</option>
                                  {createForm.schemaJson.questions.map((q) => (
                                    <option key={q.id} value={q.id}>{q.id}: {q.text.substring(0, 50)}...</option>
                                  ))}
                                </select>
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-sm font-medium text-gray-800 mb-2">Condition</label>
                                  <select
                                    value={trigger.condition}
                                    onChange={(e) => {
                                      const newTriggers = [...riskRulesState.triggers];
                                      newTriggers[index].condition = e.target.value;
                                      setRiskRulesState({ ...riskRulesState, triggers: newTriggers });
                                    }}
                                    className="w-full px-3 py-2 bg-white border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
                                  >
                                    <option value="equals">Equals (=)</option>
                                    <option value="gte">Greater than or equal (≥)</option>
                                    <option value="lte">Less than or equal (≤)</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-800 mb-2">Value</label>
                                  <input
                                    type="number"
                                    value={trigger.value}
                                    onChange={(e) => {
                                      const newTriggers = [...riskRulesState.triggers];
                                      newTriggers[index].value = Number(e.target.value) || 0;
                                      setRiskRulesState({ ...riskRulesState, triggers: newTriggers });
                                    }}
                                    className="w-full px-3 py-2 bg-white border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
                                  />
                                </div>
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-800 mb-2">Flag Name</label>
                              <input
                                type="text"
                                value={trigger.flag}
                                onChange={(e) => {
                                  const newTriggers = [...riskRulesState.triggers];
                                  newTriggers[index].flag = e.target.value;
                                  setRiskRulesState({ ...riskRulesState, triggers: newTriggers });
                                }}
                                placeholder="e.g., high_anxiety, self_harm"
                                className="w-full px-3 py-2 bg-white border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-800 mb-2">Help Text (shown when triggered)</label>
                              <textarea
                                value={trigger.helpText}
                                onChange={(e) => {
                                  const newTriggers = [...riskRulesState.triggers];
                                  newTriggers[index].helpText = e.target.value;
                                  setRiskRulesState({ ...riskRulesState, triggers: newTriggers });
                                }}
                                rows="3"
                                placeholder="Provide safety information and support resources..."
                                className="w-full px-3 py-2 bg-white border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm resize-none"
                              />
                            </div>
                          </div>
                        ))}
                        {riskRulesState.triggers.length === 0 && (
                          <p className="text-sm text-gray-500 text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                            No risk triggers configured. Click "Add Trigger" to create one.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Section: Eligibility Rules Configuration */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-base sm:text-lg font-semibold text-gray-900">Eligibility Rules Configuration</h4>
                        <p className="text-xs sm:text-sm text-gray-500">Set age or other eligibility requirements</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 sm:p-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <div className="relative">
                            <input
                              type="checkbox"
                              checked={eligibilityRulesState.enabled}
                              onChange={(e) => setEligibilityRulesState({ ...eligibilityRulesState, enabled: e.target.checked })}
                              className="sr-only"
                            />
                            <div className={`w-10 h-6 rounded-full transition-all duration-300 ${eligibilityRulesState.enabled
                              ? 'bg-green-500'
                              : 'bg-gray-300'
                            }`}>
                              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 ${eligibilityRulesState.enabled
                                ? 'left-5'
                                : 'left-1'
                              }`} />
                            </div>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-700">Enable Age Requirement</span>
                            <p className="text-xs text-gray-500">Restrict test access based on minimum age</p>
                          </div>
                        </label>
                      </div>

                      {eligibilityRulesState.enabled && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <label className="block text-sm font-medium text-gray-800 mb-2">
                            Minimum Age (years)
                          </label>
                          <input
                            type="number"
                            value={eligibilityRulesState.minAge}
                            onChange={(e) => setEligibilityRulesState({ ...eligibilityRulesState, minAge: Number(e.target.value) || 18 })}
                            min="1"
                            max="100"
                            className="w-full px-4 py-3 bg-white border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          />
                          <p className="text-xs text-green-700 mt-2">
                            Users must be at least {eligibilityRulesState.minAge} years old to take this assessment.
                          </p>
                        </div>
                      )}

                      {!eligibilityRulesState.enabled && (
                        <p className="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded-lg border border-gray-200">
                          No eligibility restrictions. All users can take this assessment.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Questions List Preview */}
                {createForm.schemaJson.questions.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="text-base sm:text-lg font-semibold text-gray-900">Questions Preview</h4>
                            <p className="text-xs sm:text-sm text-gray-500">Review and manage your assessment questions</p>
                          </div>
                        </div>
                        <span className="text-xs sm:text-sm font-medium text-amber-600 bg-amber-50 px-2 sm:px-3 py-1 rounded-full self-start sm:self-auto">
                          {createForm.schemaJson.questions.length} questions
                        </span>
                      </div>
                    </div>
                    <div className="p-4 sm:p-6">
                      <div className="space-y-4">
                        {createForm.schemaJson.questions.map((q, idx) => (
                          <div key={idx} className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-all duration-200">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <span className="text-sm font-semibold text-gray-900 bg-gray-100 px-2 py-1 rounded">
                                    Q{q.order || idx + 1}
                                  </span>
                                  <span className="text-sm text-gray-500">ID: {q.id}</span>
                                  {q.required && (
                                    <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                                      Required
                                    </span>
                                  )}
                                  {q.isCritical && (
                                    <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full">
                                      Critical
                                    </span>
                                  )}
                                </div>
                                <p className="text-gray-800 mb-3">{q.text}</p>

                                {q.options && q.options.length > 0 && (
                                  <div className="bg-gray-50 rounded-lg p-3">
                                    <p className="text-xs font-medium text-gray-700 mb-2">Options:</p>
                                    <div className="flex flex-wrap gap-2">
                                      {q.options.map((opt, optIdx) => (
                                        <div key={optIdx} className="text-xs bg-white border border-gray-200 rounded px-3 py-1.5">
                                          <span className="font-semibold text-amber-600">[{opt.value}]</span>
                                          <span className="text-gray-700 ml-2">{opt.label}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {q.helpText && (
                                  <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                                    <span className="font-medium">Help:</span> {q.helpText}
                                  </div>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => removeQuestion(idx)}
                                className="text-gray-400 hover:text-red-500 transition-colors ml-4"
                              >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="text-xs sm:text-sm text-gray-600">
                    {createForm.schemaJson.questions.length === 0 ? (
                      <span className="text-amber-600 font-medium">⚠️ Add at least one question to continue</span>
                    ) : validationErrors.errors.length > 0 ? (
                      <span className="text-red-600 font-medium">⚠️ Fix errors before saving</span>
                    ) : (
                      <span className="text-green-600 font-medium">✓ Ready to save</span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateModal(false);
                        resetCreateForm();
                      }}
                      className="flex-1 sm:flex-initial px-4 sm:px-6 py-2 sm:py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium text-sm sm:text-base"
                      disabled={creating}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={creating || createForm.schemaJson.questions.length === 0}
                      className="flex-1 sm:flex-initial px-4 sm:px-8 py-2 sm:py-3 bg-mh-gradient text-white rounded-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2 sm:gap-3 text-sm sm:text-base"
                    >
                      {creating ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                          <span>{editingTestId ? 'Updating...' : 'Creating...'}</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="hidden sm:inline">{editingTestId ? 'Update Assessment' : 'Create Assessment'}</span>
                          <span className="sm:hidden">{editingTestId ? 'Update' : 'Create'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedTest && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative top-0 sm:top-20 mx-auto p-4 sm:p-5 border w-full max-w-2xl shadow-lg rounded-lg sm:rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="mt-0 sm:mt-3">
              <div className="flex justify-between items-start mb-4 gap-4">
                <h3 className="text-base sm:text-lg font-semibold text-mh-dark flex-1 min-w-0">{selectedTest.title}</h3>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-4 max-h-[60vh] sm:max-h-96 overflow-y-auto">
                <div>
                  <label className="text-xs sm:text-sm font-medium text-gray-700">Category</label>
                  <p className="text-xs sm:text-sm text-gray-900 mt-1">{selectedTest.category || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-xs sm:text-sm font-medium text-gray-700">Short Description</label>
                  <p className="text-xs sm:text-sm text-gray-900 mt-1">{selectedTest.shortDescription || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-xs sm:text-sm font-medium text-gray-700">Long Description</label>
                  <p className="text-xs sm:text-sm text-gray-900 mt-1">{selectedTest.longDescription || 'N/A'}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs sm:text-sm font-medium text-gray-700">Price</label>
                    <p className="text-xs sm:text-sm text-gray-900 mt-1">₹{selectedTest.price || 0}</p>
                  </div>
                  <div>
                    <label className="text-xs sm:text-sm font-medium text-gray-700">MRP</label>
                    <p className="text-xs sm:text-sm text-gray-900 mt-1">₹{selectedTest.mrp || 0}</p>
                  </div>
                  <div>
                    <label className="text-xs sm:text-sm font-medium text-gray-700">Questions Count</label>
                    <p className="text-xs sm:text-sm text-gray-900 mt-1">{selectedTest.questionsCount || 0}</p>
                  </div>
                  <div>
                    <label className="text-xs sm:text-sm font-medium text-gray-700">Duration</label>
                    <p className="text-xs sm:text-sm text-gray-900 mt-1">
                      {selectedTest.durationMinutesMin || 0}-{selectedTest.durationMinutesMax || 0} minutes
                    </p>
                  </div>
                </div>
                <div>
                  <label className="text-xs sm:text-sm font-medium text-gray-700">Status</label>
                  <p className="text-xs sm:text-sm mt-1">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${selectedTest.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                      }`}>
                      {selectedTest.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </p>
                </div>
              </div>
              <div className="mt-4 sm:mt-6 flex justify-end">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="w-full sm:w-auto bg-gray-200 text-gray-700 px-4 sm:px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors text-sm sm:text-base"
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
          <div className="relative mx-auto p-4 sm:p-6 border w-full max-w-sm shadow-xl rounded-lg bg-white">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                Delete Assessment?
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6">
                This will deactivate the assessment and it will no longer be visible to users. This action cannot be undone.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:space-x-3 sm:space-y-0">
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

