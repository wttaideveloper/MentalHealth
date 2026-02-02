import { useState, useEffect } from 'react';
import { getAssessmentLinks, createAssessmentLink, getAdminTests, getLinkResults, sendAssessmentLinkEmail, getLinkEmailHistory, createGroupAssessmentLink, getGroupAssessmentLinks } from '../../api/adminApi';
import { showToast } from '../../utils/toast';
import DatePicker from '../../components/DatePicker';

function AdminAssessmentLinks() {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isActiveFilter, setIsActiveFilter] = useState('true');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [tests, setTests] = useState([]);
  const [groupFormData, setGroupFormData] = useState({
    testId: '',
    groupName: '',
    perspectives: [{ perspectiveName: '', maxAttempts: '' }],
    expiresAt: '',
    notes: ''
  });
  const [formData, setFormData] = useState({
    testId: '',
    campaignName: '',
    expiresAt: '',
    maxAttempts: '',
    linkType: 'free',
    price: 0,
    useCustomPrice: false
  });
  const [selectedTest, setSelectedTest] = useState(null);
  const [createdLink, setCreatedLink] = useState(null);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [selectedLink, setSelectedLink] = useState(null);
  const [linkResults, setLinkResults] = useState([]);
  const [allLinkResults, setAllLinkResults] = useState([]); // Store all results for filtering/export
  const [loadingResults, setLoadingResults] = useState(false);
  const [resultsPage, setResultsPage] = useState(1);
  const [resultsPagination, setResultsPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [selectedResult, setSelectedResult] = useState(null);
  const [showResultDetailModal, setShowResultDetailModal] = useState(false);
  const [resultsFilter, setResultsFilter] = useState({ riskFlags: 'all', band: 'all', sortBy: 'date', sortOrder: 'desc' });
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedLinkForEmail, setSelectedLinkForEmail] = useState(null);
  const [emailForm, setEmailForm] = useState({
    recipientEmails: '',
    customMessage: ''
  });
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailResults, setEmailResults] = useState(null);
  const [emailCount, setEmailCount] = useState(0);
  const [validEmails, setValidEmails] = useState([]);
  const [invalidEmails, setInvalidEmails] = useState([]);
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [emailList, setEmailList] = useState([]); // List of added emails
  const [currentEmailInput, setCurrentEmailInput] = useState(''); // Current email being typed
  const [showEmailHistoryModal, setShowEmailHistoryModal] = useState(false);
  const [selectedLinkForHistory, setSelectedLinkForHistory] = useState(null);
  const [emailHistory, setEmailHistory] = useState([]);
  const [loadingEmailHistory, setLoadingEmailHistory] = useState(false);
  const [emailHistoryPage, setEmailHistoryPage] = useState(1);
  const [emailHistoryPagination, setEmailHistoryPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [emailHistoryStatusFilter, setEmailHistoryStatusFilter] = useState('all');

  useEffect(() => {
    fetchLinks();
    fetchTests();
  }, [page, isActiveFilter]);

  const fetchLinks = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 20,
        isActive: isActiveFilter
      };
      const response = await getAssessmentLinks(params);
      if (response.success && response.data) {
        setLinks(response.data.links || []);
        setPagination(response.data.pagination || {});
      }
    } catch (error) {
      console.error('Failed to fetch links:', error);
      showToast.error('Failed to load assessment links');
    } finally {
      setLoading(false);
    }
  };

  const fetchTests = async () => {
    try {
      const response = await getAdminTests({ isActive: 'true', limit: 100 });
      if (response.success && response.data) {
        setTests(response.data.tests || []);
      }
    } catch (error) {
      console.error('Failed to fetch tests:', error);
    }
  };

  // Convert date-only (YYYY-MM-DD) to datetime (YYYY-MM-DDTHH:mm) for backend
  const convertDateToDateTime = (dateString) => {
    if (!dateString) return '';
    // Set time to end of day (23:59) for expiration
    return `${dateString}T23:59`;
  };

  // Convert datetime (YYYY-MM-DDTHH:mm) to date-only (YYYY-MM-DD) for DatePicker
  const convertDateTimeToDate = (dateTimeString) => {
    if (!dateTimeString) return '';
    // Extract just the date part
    return dateTimeString.split('T')[0];
  };

  const handleCreateLink = async (e) => {
    e.preventDefault();
    
    if (!formData.testId) {
      showToast.error('Please select a test');
      return;
    }

    try {
      setCreating(true);
      const linkData = {
        testId: formData.testId,
        campaignName: formData.campaignName || '',
        expiresAt: formData.expiresAt ? convertDateToDateTime(formData.expiresAt) : null,
        maxAttempts: formData.maxAttempts ? parseInt(formData.maxAttempts) : null,
        linkType: formData.linkType || 'free',
        price: formData.linkType === 'paid' ? parseFloat(formData.price) || 0 : 0
      };

      const response = await createAssessmentLink(linkData);
      if (response.success && response.data) {
        showToast.success('Assessment link created successfully!');
        setCreatedLink(response.data);
        setFormData({ testId: '', campaignName: '', expiresAt: '', maxAttempts: '', linkType: 'free', price: 0, useCustomPrice: false });
        fetchLinks();
      } else {
        showToast.error(response.message || 'Failed to create link');
      }
    } catch (error) {
      console.error('Failed to create link:', error);
      showToast.error(error.response?.data?.message || 'Failed to create assessment link');
    } finally {
      setCreating(false);
    }
  };

  const handleCreateGroupLink = async (e) => {
    e.preventDefault();
    
    if (!groupFormData.testId) {
      showToast.error('Please select a test');
      return;
    }

    if (!groupFormData.groupName) {
      showToast.error('Please enter a group name');
      return;
    }

    // Validate perspectives
    const validPerspectives = groupFormData.perspectives.filter(p => p.perspectiveName.trim() !== '');
    if (validPerspectives.length === 0) {
      showToast.error('Please add at least one perspective');
      return;
    }

    try {
      setCreatingGroup(true);
      const linkData = {
        testId: groupFormData.testId,
        groupName: groupFormData.groupName,
        perspectives: validPerspectives.map(p => ({
          perspectiveName: p.perspectiveName.trim(),
          maxAttempts: p.maxAttempts ? parseInt(p.maxAttempts) : null
        })),
        expiresAt: groupFormData.expiresAt ? convertDateToDateTime(groupFormData.expiresAt) : null,
        notes: groupFormData.notes || ''
      };

      const response = await createGroupAssessmentLink(linkData);
      if (response.success && response.data) {
        showToast.success('Group assessment link created successfully!');
        setCreatedLink(response.data);
        setGroupFormData({
          testId: '',
          groupName: '',
          perspectives: [{ perspectiveName: '', maxAttempts: '' }],
          expiresAt: '',
          notes: ''
        });
        fetchLinks();
      } else {
        showToast.error(response.message || 'Failed to create group link');
      }
    } catch (error) {
      console.error('Failed to create group link:', error);
      showToast.error(error.response?.data?.message || 'Failed to create group assessment link');
    } finally {
      setCreatingGroup(false);
    }
  };

  const handleAddPerspective = () => {
    setGroupFormData({
      ...groupFormData,
      perspectives: [...groupFormData.perspectives, { perspectiveName: '', maxAttempts: '' }]
    });
  };

  const handleRemovePerspective = (index) => {
    if (groupFormData.perspectives.length > 1) {
      const newPerspectives = groupFormData.perspectives.filter((_, i) => i !== index);
      setGroupFormData({
        ...groupFormData,
        perspectives: newPerspectives
      });
    } else {
      showToast.error('At least one perspective is required');
    }
  };

  const handlePerspectiveChange = (index, field, value) => {
    const newPerspectives = [...groupFormData.perspectives];
    newPerspectives[index][field] = value;
    setGroupFormData({
      ...groupFormData,
      perspectives: newPerspectives
    });
  };

  // Copy to clipboard with fallback for non-HTTPS environments
  const copyToClipboard = async (text) => {
    // Try modern Clipboard API first (requires HTTPS or localhost)
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (err) {
        console.warn('Clipboard API failed, trying fallback:', err);
      }
    }
    
    // Fallback: Use document.execCommand (works in HTTP and HTTPS)
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        return true;
      } else {
        throw new Error('execCommand copy failed');
      }
    } catch (err) {
      console.error('Fallback copy failed:', err);
      return false;
    }
  };

  const handleCopyLink = async (token) => {
    const baseUrl = window.location.origin;
    const fullLink = `${baseUrl}/assessment-link/${token}`;
    const success = await copyToClipboard(fullLink);
    if (success) {
      showToast.success('Link copied to clipboard!');
    } else {
      showToast.error('Failed to copy link. Please copy manually.');
    }
  };

  const handleViewResults = async (link) => {
    try {
      setSelectedLink(link);
      setShowResultsModal(true);
      setLoadingResults(true);
      setResultsPage(1);
      setExpandedRows(new Set());
      setResultsFilter({ riskFlags: 'all', band: 'all', sortBy: 'date', sortOrder: 'desc' });
      
      // Fetch all results for statistics and export (use a larger limit or fetch all)
      const response = await getLinkResults(link._id, { page: 1, limit: 1000 });
      if (response.success && response.data) {
        const allResults = response.data.results || [];
        setAllLinkResults(allResults);
        applyFiltersAndSort(allResults);
        setResultsPagination(response.data.pagination || {});
      }
    } catch (error) {
      console.error('Failed to fetch link results:', error);
      showToast.error('Failed to load results');
    } finally {
      setLoadingResults(false);
    }
  };

  const fetchLinkResults = async (linkId, pageNum) => {
    try {
      setLoadingResults(true);
      const response = await getLinkResults(linkId, { page: pageNum, limit: 1000 });
      if (response.success && response.data) {
        const allResults = response.data.results || [];
        setAllLinkResults(allResults);
        applyFiltersAndSort(allResults, resultsFilter);
        setResultsPagination(response.data.pagination || {});
      }
    } catch (error) {
      console.error('Failed to fetch link results:', error);
      showToast.error('Failed to load results');
    } finally {
      setLoadingResults(false);
    }
  };

  // Calculate summary statistics
  const calculateStatistics = (results) => {
    if (!results || results.length === 0) {
      return {
        total: 0,
        avgScore: 0,
        bandDistribution: {},
        riskFlagCount: 0,
        avgTimeTaken: 0,
        avgCompletion: 0
      };
    }

    const scores = results.map(r => r.score || 0).filter(s => s > 0);
    const avgScore = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2) : 0;

    const bandDistribution = {};
    results.forEach(r => {
      const band = r.band || 'Unknown';
      bandDistribution[band] = (bandDistribution[band] || 0) + 1;
    });

    const riskFlagCount = results.filter(r => r.riskFlags && Object.keys(r.riskFlags).length > 0).length;

    const timeTaken = results
      .map(r => {
        if (r.attemptId?.startedAt && r.attemptId?.submittedAt) {
          return (new Date(r.attemptId.submittedAt) - new Date(r.attemptId.startedAt)) / 1000 / 60; // minutes
        }
        return null;
      })
      .filter(t => t !== null);
    const avgTimeTaken = timeTaken.length > 0 
      ? (timeTaken.reduce((a, b) => a + b, 0) / timeTaken.length).toFixed(1) 
      : 0;

    const completions = results
      .map(r => {
        if (r.interpretation?.answeredCount && r.interpretation?.totalItems) {
          return (r.interpretation.answeredCount / r.interpretation.totalItems) * 100;
        }
        return null;
      })
      .filter(c => c !== null);
    const avgCompletion = completions.length > 0
      ? (completions.reduce((a, b) => a + b, 0) / completions.length).toFixed(1)
      : 0;

    return {
      total: results.length,
      avgScore: parseFloat(avgScore),
      bandDistribution,
      riskFlagCount,
      avgTimeTaken: parseFloat(avgTimeTaken),
      avgCompletion: parseFloat(avgCompletion)
    };
  };

  // Apply filters and sorting
  const applyFiltersAndSort = (results, filter = resultsFilter) => {
    let filtered = [...results];

    // Filter by risk flags
    if (filter.riskFlags === 'with') {
      filtered = filtered.filter(r => r.riskFlags && Object.keys(r.riskFlags).length > 0);
    } else if (filter.riskFlags === 'without') {
      filtered = filtered.filter(r => !r.riskFlags || Object.keys(r.riskFlags).length === 0);
    }

    // Filter by band
    if (filter.band !== 'all') {
      filtered = filtered.filter(r => {
        const band = (r.band || '').toLowerCase();
        return band.includes(filter.band.toLowerCase());
      });
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal, bVal;
      switch (filter.sortBy) {
        case 'score':
          aVal = a.score || 0;
          bVal = b.score || 0;
          break;
        case 'date':
          aVal = new Date(a.createdAt || 0).getTime();
          bVal = new Date(b.createdAt || 0).getTime();
          break;
        case 'time':
          aVal = a.attemptId?.startedAt && a.attemptId?.submittedAt
            ? (new Date(a.attemptId.submittedAt) - new Date(a.attemptId.startedAt))
            : 0;
          bVal = b.attemptId?.startedAt && b.attemptId?.submittedAt
            ? (new Date(b.attemptId.submittedAt) - new Date(b.attemptId.startedAt))
            : 0;
          break;
        default:
          aVal = new Date(a.createdAt || 0).getTime();
          bVal = new Date(b.createdAt || 0).getTime();
      }
      return filter.sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });

    setLinkResults(filtered);
  };

  // Handle filter changes
  const handleFilterChange = (filterType, value) => {
    const newFilter = { ...resultsFilter, [filterType]: value };
    setResultsFilter(newFilter);
    // Use setTimeout to ensure state is updated before applying filters
    setTimeout(() => {
      applyFiltersAndSort(allLinkResults, newFilter);
    }, 0);
  };

  // Toggle row expansion
  const toggleRowExpansion = (resultId) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(resultId)) {
      newExpanded.delete(resultId);
    } else {
      newExpanded.add(resultId);
    }
    setExpandedRows(newExpanded);
  };

  // Calculate time taken in minutes
  const getTimeTaken = (result) => {
    if (result.attemptId?.startedAt && result.attemptId?.submittedAt) {
      const minutes = (new Date(result.attemptId.submittedAt) - new Date(result.attemptId.startedAt)) / 1000 / 60;
      return minutes.toFixed(1);
    }
    return '-';
  };

  // Calculate completion percentage
  const getCompletionPercentage = (result) => {
    if (result.interpretation?.answeredCount && result.interpretation?.totalItems) {
      return ((result.interpretation.answeredCount / result.interpretation.totalItems) * 100).toFixed(0);
    }
    return '-';
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (linkResults.length === 0) {
      showToast.error('No results to export');
      return;
    }

    const headers = [
      'Participant Name',
      'Email',
      'Gender',
      'Date of Birth',
      'Score',
      'Band',
      'Band Description',
      'Risk Flags',
      'Risk Flag Details',
      'Time Taken (minutes)',
      'Completion %',
      'Answered Questions',
      'Total Questions',
      'Completed Date'
    ];

    const rows = linkResults.map(result => {
      const participantInfo = result.attemptId?.participantInfo || {};
      const riskFlags = result.riskFlags || {};
      const riskFlagKeys = Object.keys(riskFlags);
      const riskFlagDetails = riskFlagKeys.length > 0 
        ? riskFlagKeys.map(k => `${k}: ${riskFlags[k]?.helpText || 'Triggered'}`).join('; ')
        : 'None';

      return [
        participantInfo.name || 'Anonymous',
        participantInfo.email || '',
        participantInfo.gender || '',
        participantInfo.dateOfBirth || '',
        result.score || 0,
        result.band || '',
        result.bandDescription || '',
        riskFlagKeys.length > 0 ? `${riskFlagKeys.length} flag(s)` : 'None',
        riskFlagDetails,
        getTimeTaken(result),
        getCompletionPercentage(result),
        result.interpretation?.answeredCount || 0,
        result.interpretation?.totalItems || 0,
        result.createdAt ? new Date(result.createdAt).toLocaleString() : ''
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `assessment-results-${selectedLink?.campaignName || 'export'}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast.success('Results exported successfully!');
  };

  const getBandColorClass = (band) => {
    if (!band) return 'bg-gray-100 text-gray-700';
    const bandLower = band.toLowerCase();
    if (bandLower.includes('low')) return 'bg-green-100 text-green-700';
    if (bandLower.includes('moderate') || bandLower.includes('medium')) return 'bg-orange-100 text-orange-700';
    if (bandLower.includes('high') || bandLower.includes('severe')) return 'bg-red-100 text-red-700';
    return 'bg-gray-100 text-gray-700';
  };

  const handleSendEmail = (link) => {
    setSelectedLinkForEmail(link);
    setShowEmailModal(true);
    setEmailForm({ recipientEmails: '', customMessage: '' });
    setEmailResults(null);
    setEmailCount(0);
    setValidEmails([]);
    setInvalidEmails([]);
    setShowEmailPreview(false);
    setEmailList([]);
    setCurrentEmailInput('');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      showToast.error('Please upload a CSV file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      // Parse CSV - simple implementation (assumes emails in first column)
      const lines = text.split('\n').filter(line => line.trim());
      const emails = lines
        .map(line => line.split(',')[0].trim())
        .filter(email => email.length > 0);
      
      // Convert to email list format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const emailListFromCsv = emails.map(email => ({
        email,
        isValid: emailRegex.test(email)
      }));
      
      // Remove duplicates
      const uniqueEmails = emailListFromCsv.filter((item, index, self) =>
        index === self.findIndex(e => e.email.toLowerCase() === item.email.toLowerCase())
      );
      
      setEmailList(prev => {
        // Merge with existing, avoiding duplicates
        const merged = [...prev];
        uniqueEmails.forEach(newEmail => {
          if (!merged.some(e => e.email.toLowerCase() === newEmail.email.toLowerCase())) {
            merged.push(newEmail);
          }
        });
        updateEmailCounts(merged);
        return merged;
      });
      
      showToast.success(`Loaded ${uniqueEmails.length} email(s) from CSV`);
    };
    reader.readAsText(file);
    // Reset file input
    e.target.value = '';
  };

  const handleViewEmailHistory = async (link) => {
    try {
      setSelectedLinkForHistory(link);
      setShowEmailHistoryModal(true);
      setLoadingEmailHistory(true);
      setEmailHistoryPage(1);
      setEmailHistoryStatusFilter('all');
      
      const response = await getLinkEmailHistory(link._id, { page: 1, limit: 20 });
      if (response.success && response.data) {
        setEmailHistory(response.data.history || []);
        setEmailHistoryPagination(response.data.pagination || {});
      }
    } catch (error) {
      console.error('Failed to fetch email history:', error);
      showToast.error('Failed to load email history');
    } finally {
      setLoadingEmailHistory(false);
    }
  };

  const fetchEmailHistory = async (linkId, pageNum, status = 'all') => {
    try {
      setLoadingEmailHistory(true);
      const params = { page: pageNum, limit: 20 };
      if (status !== 'all') {
        params.status = status;
      }
      
      const response = await getLinkEmailHistory(linkId, params);
      if (response.success && response.data) {
        setEmailHistory(response.data.history || []);
        setEmailHistoryPagination(response.data.pagination || {});
      }
    } catch (error) {
      console.error('Failed to fetch email history:', error);
      showToast.error('Failed to load email history');
    } finally {
      setLoadingEmailHistory(false);
    }
  };

  const handleEmailHistoryFilterChange = (status) => {
    setEmailHistoryStatusFilter(status);
    setEmailHistoryPage(1);
    if (selectedLinkForHistory) {
      fetchEmailHistory(selectedLinkForHistory._id, 1, status);
    }
  };

  const handleEmailFormChange = (e) => {
    const { name, value } = e.target;
    if (name === 'customMessage') {
      setEmailForm(prev => ({ ...prev, [name]: value }));
    }
  };

  // Add email to list
  const handleAddEmail = () => {
    const email = currentEmailInput.trim();
    if (!email) {
      showToast.error('Please enter an email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showToast.error('Please enter a valid email address');
      return;
    }

    // Check if email already exists
    if (emailList.some(e => e.email.toLowerCase() === email.toLowerCase())) {
      showToast.error('This email is already in the list');
      return;
    }

    // Add to list
    const newEmail = { email, isValid: true };
    setEmailList(prev => [...prev, newEmail]);
    setCurrentEmailInput('');
    
    // Update counts
    updateEmailCounts([...emailList, newEmail]);
    
    showToast.success('Email added successfully');
  };

  // Remove email from list
  const handleRemoveEmail = (index) => {
    const newList = emailList.filter((_, i) => i !== index);
    setEmailList(newList);
    updateEmailCounts(newList);
  };

  // Update email counts and validation
  const updateEmailCounts = (list) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const valid = list.filter(e => e.isValid && emailRegex.test(e.email));
    const invalid = list.filter(e => !e.isValid || !emailRegex.test(e.email));
    
    setEmailCount(list.length);
    setValidEmails(valid.map(e => e.email));
    setInvalidEmails(invalid.map(e => e.email));
    
    // Update form data for submission
    setEmailForm(prev => ({
      ...prev,
      recipientEmails: list.map(e => e.email).join('\n')
    }));
  };

  // Handle Enter key in email input
  const handleEmailInputKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddEmail();
    }
  };

  const handleSendEmailSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedLinkForEmail) return;

    // Get emails from emailList
    const emails = emailList.map(e => e.email);
    
    if (emails.length === 0) {
      showToast.error('Please add at least one email address');
      return;
    }

    // Check for invalid emails
    const invalidEmails = emailList.filter(e => !e.isValid || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.email));
    if (invalidEmails.length > 0) {
      showToast.error(`Please remove ${invalidEmails.length} invalid email(s) before sending`);
      return;
    }

    try {
      setSendingEmail(true);
      setEmailResults(null);

      const response = await sendAssessmentLinkEmail(
        selectedLinkForEmail._id,
        emails.length === 1 ? emails[0] : emails,
        emailForm.customMessage || ''
      );

      if (response.success && response.data) {
        setEmailResults(response.data);
        if (response.data.successful > 0) {
          showToast.success(`Successfully sent ${response.data.successful} email(s)!`);
        }
        if (response.data.failed > 0) {
          showToast.error(`Failed to send ${response.data.failed} email(s)`);
        }
      } else {
        showToast.error(response.message || 'Failed to send emails');
      }
    } catch (error) {
      console.error('Failed to send emails:', error);
      showToast.error(error.response?.data?.message || 'Failed to send emails');
    } finally {
      setSendingEmail(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No expiration';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusBadge = (link) => {
    if (!link.isActive) {
      return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">Inactive</span>;
    }
    if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
      return <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs">Expired</span>;
    }
    if (link.maxAttempts && link.currentAttempts >= link.maxAttempts) {
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">Max Reached</span>;
    }
    return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">Active</span>;
  };

  if (loading && links.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-mh-green mb-4"></div>
          <p className="text-mh-dark">Loading assessment links...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-mh-dark">Assessment Links</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Create and manage shareable assessment links</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          <button
            onClick={() => {
              setShowCreateModal(true);
              setCreatedLink(null);
            }}
            className="w-full sm:w-auto px-4 py-2 bg-mh-gradient text-white rounded-lg font-medium hover:opacity-90 transition text-sm sm:text-base"
          >
            Create New Link
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="w-full sm:w-48">
            <select
              value={isActiveFilter}
              onChange={(e) => {
                setIsActiveFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mh-green focus:border-transparent text-sm sm:text-base"
            >
              <option value="true">Active Only</option>
              <option value="false">Inactive Only</option>
              <option value="all">All Links</option>
            </select>
          </div>
        </div>
      </div>

      {/* Links Table - Desktop */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campaign</th>
                <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Test</th>
                <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attempts</th>
                <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expires</th>
                <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {links.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-12 text-center text-gray-500">
                    No assessment links found
                  </td>
                </tr>
              ) : (
                links.map((link) => (
                  <tr key={link._id} className="hover:bg-gray-50">
                    <td className="px-4 xl:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {link.campaignName || 'No campaign name'}
                      </div>
                    </td>
                    <td className="px-4 xl:px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {link.testId?.title || 'N/A'}
                      </div>
                    </td>
                    <td className="px-4 xl:px-6 py-4 whitespace-nowrap">
                      {link.linkType === 'paid' ? (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">Paid</span>
                      ) : (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">Free</span>
                      )}
                    </td>
                    <td className="px-4 xl:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {link.linkType === 'paid' ? `₹${link.price || 0}` : 'Free'}
                      </div>
                    </td>
                    <td className="px-4 xl:px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(link)}
                    </td>
                    <td className="px-4 xl:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {link.currentAttempts || 0}
                        {link.maxAttempts ? ` / ${link.maxAttempts}` : ''}
                      </div>
                    </td>
                    <td className="px-4 xl:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(link.expiresAt)}
                    </td>
                    <td className="px-4 xl:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(link.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 xl:px-6 py-4">
                      <div className="flex items-center gap-2 flex-wrap">
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
                          onClick={() => handleSendEmail(link)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 hover:border-purple-300 transition-colors whitespace-nowrap"
                          title="Send Email"
                        >
                          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          Send Email
                        </button>
                        <button
                          onClick={() => handleViewEmailHistory(link)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 hover:border-indigo-300 transition-colors whitespace-nowrap"
                          title="Email History"
                        >
                          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          History
                        </button>
                        <button
                          onClick={() => handleCopyLink(link.linkToken)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-mh-green bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 hover:border-green-300 transition-colors whitespace-nowrap"
                          title="Copy Link"
                        >
                          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Copy Link
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile/Tablet Card View */}
        <div className="lg:hidden">
          {links.length === 0 ? (
            <div className="px-4 py-12 text-center text-gray-500">
              No assessment links found
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {links.map((link) => (
                <div key={link._id} className="p-4 hover:bg-gray-50">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {link.campaignName || 'No campaign name'}
                        </div>
                        <div className="text-xs text-gray-500 mt-1 truncate">
                          {link.testId?.title || 'N/A'}
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        {getStatusBadge(link)}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-xs text-gray-500">Type</div>
                        <div className="mt-1">
                          {link.linkType === 'paid' ? (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">Paid</span>
                          ) : (
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">Free</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Price</div>
                        <div className="mt-1 text-gray-900">
                          {link.linkType === 'paid' ? `₹${link.price || 0}` : 'Free'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Attempts</div>
                        <div className="mt-1 text-gray-900">
                          {link.currentAttempts || 0}
                          {link.maxAttempts ? ` / ${link.maxAttempts}` : ''}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Created</div>
                        <div className="mt-1 text-gray-900 text-xs">
                          {new Date(link.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    {link.expiresAt && (
                      <div>
                        <div className="text-xs text-gray-500">Expires</div>
                        <div className="mt-1 text-sm text-gray-900">
                          {formatDate(link.expiresAt)}
                        </div>
                      </div>
                    )}

                    <div className="pt-2 border-t border-gray-200">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleViewResults(link)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 transition-colors flex-1 min-w-[100px] justify-center"
                          title="View Results"
                        >
                          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Results
                        </button>
                        <button
                          onClick={() => handleSendEmail(link)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 hover:border-purple-300 transition-colors flex-1 min-w-[100px] justify-center"
                          title="Send Email"
                        >
                          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          Email
                        </button>
                        <button
                          onClick={() => handleViewEmailHistory(link)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 hover:border-indigo-300 transition-colors flex-1 min-w-[100px] justify-center"
                          title="Email History"
                        >
                          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          History
                        </button>
                        <button
                          onClick={() => handleCopyLink(link.linkToken)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-mh-green bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 hover:border-green-300 transition-colors flex-1 min-w-[100px] justify-center"
                          title="Copy Link"
                        >
                          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Copy
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="bg-gray-50 px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-200">
            <div className="text-xs sm:text-sm text-gray-700 text-center sm:text-left">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} links
            </div>
            <div className="flex gap-2 w-full sm:w-auto justify-center">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={pagination.page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-sm flex-1 sm:flex-initial"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                disabled={pagination.page === pagination.pages}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-sm flex-1 sm:flex-initial"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-mh-dark">Create Assessment Link</h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreatedLink(null);
                    setFormData({ testId: '', campaignName: '', expiresAt: '', maxAttempts: '', linkType: 'free', price: 0 });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {createdLink ? (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-800 font-semibold mb-2 text-sm sm:text-base">Link Created Successfully!</p>
                    <div className="bg-white rounded p-3 mb-3">
                      <p className="text-xs text-gray-500 mb-1">Shareable Link:</p>
                      <p className="text-xs sm:text-sm font-mono break-all">{window.location.origin}/assessment-link/{createdLink.linkToken}</p>
                    </div>
                    <button
                      onClick={() => handleCopyLink(createdLink.linkToken)}
                      className="w-full px-4 py-2 bg-mh-gradient text-white rounded-lg font-medium hover:opacity-90 text-sm sm:text-base"
                    >
                      Copy Link
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setCreatedLink(null);
                      setFormData({ testId: '', campaignName: '', expiresAt: '', maxAttempts: '' });
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm sm:text-base"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <form onSubmit={handleCreateLink} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Test <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.testId}
                      onChange={(e) => {
                        const testId = e.target.value;
                        const test = tests.find(t => t._id === testId);
                        setSelectedTest(test);
                        setFormData({ 
                          ...formData, 
                          testId,
                          // Auto-set price if switching to paid and test has a price
                          price: formData.linkType === 'paid' && test?.price ? test.price : formData.price
                        });
                      }}
                      required
                      className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mh-green focus:border-transparent text-sm sm:text-base"
                    >
                      <option value="">Select a test</option>
                      {tests.map((test) => (
                        <option key={test._id} value={test._id}>
                          {test.title} {test.price > 0 ? `(₹${test.price})` : '(Free)'}
                        </option>
                      ))}
                    </select>
                    {selectedTest && (
                      <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-600">
                          <span className="font-medium">Assessment Details:</span> {selectedTest.shortDescription || 'No description'}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          <span className="font-medium">Default Price:</span> {selectedTest.price > 0 ? `₹${selectedTest.price}` : 'Free'}
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Campaign Name
                    </label>
                    <input
                      type="text"
                      value={formData.campaignName}
                      onChange={(e) => setFormData({ ...formData, campaignName: e.target.value })}
                      placeholder="e.g., Mental Health Awareness Week 2025"
                      className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mh-green focus:border-transparent text-sm sm:text-base"
                    />
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
                    <p className="text-xs text-gray-500 mt-1">The link will expire at the end of the selected date</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Attempts (Optional)
                    </label>
                    <input
                      type="number"
                      value={formData.maxAttempts}
                      onChange={(e) => setFormData({ ...formData, maxAttempts: e.target.value })}
                      placeholder="e.g., 1000"
                      min="1"
                      className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mh-green focus:border-transparent text-sm sm:text-base"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Link Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.linkType}
                      onChange={(e) => {
                        const newLinkType = e.target.value;
                        let newPrice = formData.price;
                        let useCustomPrice = formData.useCustomPrice;
                        
                        if (newLinkType === 'free') {
                          newPrice = 0;
                          useCustomPrice = false;
                        } else if (newLinkType === 'paid') {
                          // If switching to paid, use test's default price unless custom is already set
                          if (!formData.useCustomPrice && selectedTest?.price > 0) {
                            newPrice = selectedTest.price;
                            useCustomPrice = false;
                          } else if (!formData.useCustomPrice) {
                            newPrice = 100;
                            useCustomPrice = false;
                          }
                        }
                        
                        setFormData({ 
                          ...formData, 
                          linkType: newLinkType,
                          price: newPrice,
                          useCustomPrice
                        });
                      }}
                      required
                      className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mh-green focus:border-transparent text-sm sm:text-base"
                    >
                      <option value="free">Free</option>
                      <option value="paid">Paid</option>
                    </select>
                  </div>

                  {formData.linkType === 'paid' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Pricing Options
                      </label>
                      
                      {/* Original Price Display */}
                      {selectedTest && (
                        <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-700">Assessment Original Price:</span>
                            <span className="text-lg font-semibold text-blue-700">
                              {selectedTest.price > 0 ? `₹${selectedTest.price}` : 'Free'}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {/* Price Option Toggle */}
                      <div className="mb-3">
                        <div className="flex gap-4">
                          <label className="flex items-center cursor-pointer">
                            <div className="relative">
                              <input
                                type="radio"
                                name="priceOption"
                                checked={!formData.useCustomPrice}
                                onChange={() => setFormData({ 
                                  ...formData, 
                                  useCustomPrice: false,
                                  price: selectedTest?.price > 0 ? selectedTest.price : 100
                                })}
                                className="sr-only"
                              />
                              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                !formData.useCustomPrice 
                                  ? 'border-mh-green bg-mh-green' 
                                  : 'border-gray-300 bg-white'
                              }`}>
                                {!formData.useCustomPrice && (
                                  <div className="w-2 h-2 rounded-full bg-white"></div>
                                )}
                              </div>
                            </div>
                            <span className="ml-2 text-sm">Use Original Price</span>
                          </label>
                          <label className="flex items-center cursor-pointer">
                            <div className="relative">
                              <input
                                type="radio"
                                name="priceOption"
                                checked={formData.useCustomPrice}
                                onChange={() => setFormData({ 
                                  ...formData, 
                                  useCustomPrice: true
                                })}
                                className="sr-only"
                              />
                              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                formData.useCustomPrice 
                                  ? 'border-mh-green bg-mh-green' 
                                  : 'border-gray-300 bg-white'
                              }`}>
                                {formData.useCustomPrice && (
                                  <div className="w-2 h-2 rounded-full bg-white"></div>
                                )}
                              </div>
                            </div>
                            <span className="ml-2 text-sm">Set Custom Price</span>
                          </label>
                        </div>
                      </div>
                      
                      {/* Custom Price Input */}
                      {formData.useCustomPrice && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Custom Price (₹) <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            placeholder="e.g., 299"
                            min="1"
                            step="0.01"
                            required
                            className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mh-green focus:border-transparent text-sm sm:text-base"
                          />
                          <div className="mt-2 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, price: 99 })}
                              className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition"
                            >
                              ₹99
                            </button>
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, price: 199 })}
                              className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition"
                            >
                              ₹199
                            </button>
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, price: 299 })}
                              className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition"
                            >
                              ₹299
                            </button>
                          </div>
                        </div>
                      )}
                      
                      {/* Final Price Display */}
                      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">Link Price:</span>
                          <span className="text-xl font-bold text-green-700">₹{formData.price}</span>
                        </div>
                        {formData.useCustomPrice && selectedTest?.price > 0 && formData.price < selectedTest.price && (
                          <div className="mt-1 text-xs text-green-600">
                            Discount: ₹{selectedTest.price - formData.price} off
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <button
                      type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setFormData({ testId: '', campaignName: '', expiresAt: '', maxAttempts: '', linkType: 'free', price: 0, useCustomPrice: false });
                      setSelectedTest(null);
                    }}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm sm:text-base"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={creating}
                      className="flex-1 px-4 py-2 bg-mh-gradient text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50 text-sm sm:text-base"
                    >
                      {creating ? 'Creating...' : 'Create Link'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Group Assessment Link Modal */}
      {showCreateGroupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-mh-dark">Create Group Assessment Link</h2>
                <button
                  onClick={() => {
                    setShowCreateGroupModal(false);
                    setCreatedLink(null);
                    setGroupFormData({
                      testId: '',
                      groupName: '',
                      perspectives: [{ perspectiveName: '', maxAttempts: '' }],
                      expiresAt: '',
                      notes: ''
                    });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {createdLink ? (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-800 font-semibold mb-2 text-sm sm:text-base">Group Link Created Successfully!</p>
                    <div className="bg-white rounded p-3 mb-3">
                      <p className="text-xs text-gray-500 mb-1">Shareable Link:</p>
                      <p className="text-xs sm:text-sm font-mono break-all">{window.location.origin}/group-assessment-link/{createdLink.linkToken}/select-role</p>
                    </div>
                    <button
                      onClick={async () => {
                        const fullLink = `${window.location.origin}/group-assessment-link/${createdLink.linkToken}/select-role`;
                        const success = await copyToClipboard(fullLink);
                        if (success) {
                          showToast.success('Link copied to clipboard!');
                        } else {
                          showToast.error('Failed to copy link. Please copy manually.');
                        }
                      }}
                      className="w-full px-4 py-2 bg-mh-gradient text-white rounded-lg font-medium hover:opacity-90 text-sm sm:text-base"
                    >
                      Copy Link
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      setShowCreateGroupModal(false);
                      setCreatedLink(null);
                      setGroupFormData({
                        testId: '',
                        groupName: '',
                        perspectives: [{ perspectiveName: '', maxAttempts: '' }],
                        expiresAt: '',
                        notes: ''
                      });
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm sm:text-base"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <form onSubmit={handleCreateGroupLink} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Test <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={groupFormData.testId}
                      onChange={(e) => setGroupFormData({ ...groupFormData, testId: e.target.value })}
                      required
                      className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mh-green focus:border-transparent text-sm sm:text-base"
                    >
                      <option value="">Select a test</option>
                      {tests.map((test) => (
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
                      value={groupFormData.groupName}
                      onChange={(e) => setGroupFormData({ ...groupFormData, groupName: e.target.value })}
                      placeholder="e.g., Multi-Student Assessment or Student Character Assessment"
                      required
                      className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mh-green focus:border-transparent text-sm sm:text-base"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      This is a generic name for the link. Student names will be captured during assessment.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Perspectives <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-3">
                      {groupFormData.perspectives.map((perspective, index) => (
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
                          {groupFormData.perspectives.length > 1 && (
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
                      value={groupFormData.expiresAt && groupFormData.expiresAt.includes('T') ? convertDateTimeToDate(groupFormData.expiresAt) : groupFormData.expiresAt || ''}
                      onChange={(e) => setGroupFormData({ ...groupFormData, expiresAt: e.target.value })}
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
                      value={groupFormData.notes}
                      onChange={(e) => setGroupFormData({ ...groupFormData, notes: e.target.value })}
                      placeholder="Additional notes about this group assessment"
                      rows={3}
                      className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mh-green focus:border-transparent text-sm sm:text-base"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateGroupModal(false);
                        setGroupFormData({
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
                      disabled={creatingGroup}
                      className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 text-sm sm:text-base"
                    >
                      {creatingGroup ? 'Creating...' : 'Create Group Link'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Results Modal */}
      {showResultsModal && selectedLink && (() => {
        const stats = calculateStatistics(allLinkResults);
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[95vh] overflow-hidden flex flex-col">
              <div className="p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl sm:text-2xl font-bold text-mh-dark">Assessment Link Results</h2>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1 truncate">
                      {selectedLink.campaignName || 'No campaign name'} - {selectedLink.testId?.title || 'N/A'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Total Participants: {selectedLink.currentAttempts || 0} | 
                      Completed: {stats.total}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleExportCSV}
                      className="px-3 py-1.5 text-xs sm:text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1.5"
                      title="Export to CSV"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Export CSV
                    </button>
                    <button
                      onClick={() => {
                        setShowResultsModal(false);
                        setSelectedLink(null);
                        setLinkResults([]);
                        setAllLinkResults([]);
                        setResultsPage(1);
                        setExpandedRows(new Set());
                      }}
                      className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                    >
                      <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Summary Statistics */}
                {stats.total > 0 && (
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <div className="text-xs text-gray-500">Avg Score</div>
                      <div className="text-lg font-bold text-mh-dark">{stats.avgScore}</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <div className="text-xs text-gray-500">Avg Time</div>
                      <div className="text-lg font-bold text-mh-dark">{stats.avgTimeTaken} min</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <div className="text-xs text-gray-500">Avg Completion</div>
                      <div className="text-lg font-bold text-mh-dark">{stats.avgCompletion}%</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <div className="text-xs text-gray-500">With Risk Flags</div>
                      <div className="text-lg font-bold text-red-600">{stats.riskFlagCount}</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <div className="text-xs text-gray-500">Total Results</div>
                      <div className="text-lg font-bold text-mh-dark">{stats.total}</div>
                    </div>
                  </div>
                )}

                {/* Filters and Sorting */}
                <div className="mt-4 flex flex-wrap gap-3 items-center">
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-600">Filter:</label>
                    <select
                      value={resultsFilter.riskFlags}
                      onChange={(e) => handleFilterChange('riskFlags', e.target.value)}
                      className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-mh-green focus:border-transparent"
                    >
                      <option value="all">All Results</option>
                      <option value="with">With Risk Flags</option>
                      <option value="without">Without Risk Flags</option>
                    </select>
                    <select
                      value={resultsFilter.band}
                      onChange={(e) => handleFilterChange('band', e.target.value)}
                      className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-mh-green focus:border-transparent"
                    >
                      <option value="all">All Bands</option>
                      <option value="low">Low</option>
                      <option value="moderate">Moderate</option>
                      <option value="high">High</option>
                      <option value="severe">Severe</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-600">Sort:</label>
                    <select
                      value={resultsFilter.sortBy}
                      onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                      className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-mh-green focus:border-transparent"
                    >
                      <option value="date">Date</option>
                      <option value="score">Score</option>
                      <option value="time">Time Taken</option>
                    </select>
                    <button
                      onClick={() => handleFilterChange('sortOrder', resultsFilter.sortOrder === 'asc' ? 'desc' : 'asc')}
                      className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                      title={resultsFilter.sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                    >
                      {resultsFilter.sortOrder === 'asc' ? '↑' : '↓'}
                    </button>
                  </div>
                  <div className="text-xs text-gray-500 ml-auto">
                    Showing {linkResults.length} of {stats.total} results
                  </div>
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
                    <p className="text-gray-500 text-sm">No results found for this assessment link</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Desktop Table */}
                    <div className="hidden lg:block overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase w-8"></th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Participant</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Band</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Risk Flags</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completion</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completed</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {linkResults.map((result) => {
                            const participantInfo = result.attemptId?.participantInfo || {};
                            const isExpanded = expandedRows.has(result._id);
                            const riskFlagCount = result.riskFlags ? Object.keys(result.riskFlags).length : 0;
                            return (
                              <>
                                <tr key={result._id} className="hover:bg-gray-50">
                                  <td className="px-3 py-3">
                                    <button
                                      onClick={() => toggleRowExpansion(result._id)}
                                      className="text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                      <svg 
                                        className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
                                        fill="none" 
                                        viewBox="0 0 24 24" 
                                        stroke="currentColor"
                                      >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                      </svg>
                                    </button>
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="text-sm font-medium text-gray-900">
                                      {participantInfo.name || 'Anonymous'}
                                    </div>
                                    {participantInfo.email && (
                                      <div className="text-xs text-gray-500">{participantInfo.email}</div>
                                    )}
                                    {(participantInfo.gender || participantInfo.dateOfBirth) && (
                                      <div className="text-xs text-gray-500">
                                        {participantInfo.gender && `${participantInfo.gender}`}
                                        {participantInfo.dateOfBirth && ` • ${participantInfo.dateOfBirth}`}
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <div className="text-sm font-semibold text-mh-dark">{result.score || 0}</div>
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    {result.band ? (
                                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getBandColorClass(result.band)}`}>
                                        {result.band}
                                      </span>
                                    ) : (
                                      <span className="text-xs text-gray-500">-</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    {riskFlagCount > 0 ? (
                                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                        {riskFlagCount} flag(s)
                                      </span>
                                    ) : (
                                      <span className="text-xs text-gray-500">None</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                    {getTimeTaken(result)} min
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                    {getCompletionPercentage(result)}%
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                    {result.createdAt ? new Date(result.createdAt).toLocaleDateString() : '-'}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <button
                                      onClick={() => {
                                        setSelectedResult(result);
                                        setShowResultDetailModal(true);
                                      }}
                                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                    >
                                      View Details
                                    </button>
                                  </td>
                                </tr>
                                {isExpanded && (
                                  <tr key={`${result._id}-expanded`} className="bg-gray-50">
                                    <td colSpan="9" className="px-4 py-4">
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                        {result.bandDescription && (
                                          <div>
                                            <div className="font-medium text-gray-700 mb-1">Band Description</div>
                                            <div className="text-gray-600 bg-blue-50 p-2 rounded">{result.bandDescription}</div>
                                          </div>
                                        )}
                                        {result.subscales && Object.keys(result.subscales).length > 0 && (
                                          <div>
                                            <div className="font-medium text-gray-700 mb-1">Subscales</div>
                                            <div className="space-y-1">
                                              {Object.entries(result.subscales).map(([key, value]) => (
                                                <div key={key} className="flex justify-between bg-gray-100 p-2 rounded">
                                                  <span className="text-gray-700">{key}:</span>
                                                  <span className="font-semibold text-mh-dark">{value}</span>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                        {riskFlagCount > 0 && (
                                          <div className="md:col-span-2">
                                            <div className="font-medium text-gray-700 mb-1">Risk Flags</div>
                                            <div className="bg-red-50 border border-red-200 rounded p-3 space-y-2">
                                              {Object.entries(result.riskFlags).map(([flag, data]) => (
                                                <div key={flag} className="text-sm">
                                                  <span className="font-semibold text-red-800">{flag}:</span>
                                                  <span className="text-red-700 ml-2">
                                                    {typeof data === 'object' && data.helpText ? data.helpText : 'Triggered'}
                                                  </span>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                        {result.interpretation && (
                                          <div className="md:col-span-2">
                                            <div className="font-medium text-gray-700 mb-1">Interpretation</div>
                                            <div className="bg-gray-100 p-2 rounded text-gray-700">
                                              <div className="text-xs mb-1">
                                                Answered: {result.interpretation.answeredCount || 0} / {result.interpretation.totalItems || 0} questions
                                              </div>
                                              {result.interpretation.text && (
                                                <div className="text-sm mt-1">{result.interpretation.text}</div>
                                              )}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile/Tablet Card View */}
                    <div className="lg:hidden space-y-3">
                      {linkResults.map((result) => {
                        const participantInfo = result.attemptId?.participantInfo || {};
                        const isExpanded = expandedRows.has(result._id);
                        const riskFlagCount = result.riskFlags ? Object.keys(result.riskFlags).length : 0;
                        return (
                          <div key={result._id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                            <div className="p-4 space-y-3">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="text-sm font-medium text-gray-900">
                                    {participantInfo.name || 'Anonymous'}
                                  </div>
                                  {participantInfo.email && (
                                    <div className="text-xs text-gray-500">{participantInfo.email}</div>
                                  )}
                                  {(participantInfo.gender || participantInfo.dateOfBirth) && (
                                    <div className="text-xs text-gray-500">
                                      {participantInfo.gender && `${participantInfo.gender}`}
                                      {participantInfo.dateOfBirth && ` • ${participantInfo.dateOfBirth}`}
                                    </div>
                                  )}
                                </div>
                                <button
                                  onClick={() => toggleRowExpansion(result._id)}
                                  className="text-gray-400 hover:text-gray-600"
                                >
                                  <svg 
                                    className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
                                    fill="none" 
                                    viewBox="0 0 24 24" 
                                    stroke="currentColor"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                </button>
                              </div>
                              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                                <div>
                                  <div className="text-xs text-gray-500">Score</div>
                                  <div className="text-sm font-semibold text-mh-dark">{result.score || 0}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500">Band</div>
                                  <div>
                                    {result.band ? (
                                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getBandColorClass(result.band)}`}>
                                        {result.band}
                                      </span>
                                    ) : (
                                      <span className="text-xs text-gray-500">-</span>
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500">Risk Flags</div>
                                  <div>
                                    {riskFlagCount > 0 ? (
                                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                        {riskFlagCount} flag(s)
                                      </span>
                                    ) : (
                                      <span className="text-xs text-gray-500">None</span>
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500">Time</div>
                                  <div className="text-xs text-gray-600">{getTimeTaken(result)} min</div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500">Completion</div>
                                  <div className="text-xs text-gray-600">{getCompletionPercentage(result)}%</div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500">Completed</div>
                                  <div className="text-xs text-gray-500">
                                    {result.createdAt ? new Date(result.createdAt).toLocaleDateString() : '-'}
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  setSelectedResult(result);
                                  setShowResultDetailModal(true);
                                }}
                                className="w-full text-xs text-blue-600 hover:text-blue-800 font-medium py-2 border-t border-gray-100"
                              >
                                View Full Details →
                              </button>
                            </div>
                            {isExpanded && (
                              <div className="px-4 pb-4 bg-gray-50 border-t border-gray-200 space-y-3">
                                {result.bandDescription && (
                                  <div>
                                    <div className="text-xs font-medium text-gray-700 mb-1">Band Description</div>
                                    <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded">{result.bandDescription}</div>
                                  </div>
                                )}
                                {result.subscales && Object.keys(result.subscales).length > 0 && (
                                  <div>
                                    <div className="text-xs font-medium text-gray-700 mb-1">Subscales</div>
                                    <div className="space-y-1">
                                      {Object.entries(result.subscales).map(([key, value]) => (
                                        <div key={key} className="flex justify-between bg-gray-100 p-2 rounded text-xs">
                                          <span className="text-gray-700">{key}:</span>
                                          <span className="font-semibold text-mh-dark">{value}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {riskFlagCount > 0 && (
                                  <div>
                                    <div className="text-xs font-medium text-gray-700 mb-1">Risk Flags</div>
                                    <div className="bg-red-50 border border-red-200 rounded p-2 space-y-1">
                                      {Object.entries(result.riskFlags).map(([flag, data]) => (
                                        <div key={flag} className="text-xs">
                                          <span className="font-semibold text-red-800">{flag}:</span>
                                          <span className="text-red-700 ml-1">
                                            {typeof data === 'object' && data.helpText ? data.helpText : 'Triggered'}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {result.interpretation && (
                                  <div>
                                    <div className="text-xs font-medium text-gray-700 mb-1">Interpretation</div>
                                    <div className="bg-gray-100 p-2 rounded text-xs text-gray-700">
                                      <div className="mb-1">
                                        Answered: {result.interpretation.answeredCount || 0} / {result.interpretation.totalItems || 0} questions
                                      </div>
                                      {result.interpretation.text && (
                                        <div className="mt-1">{result.interpretation.text}</div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 sm:p-6 border-t border-gray-200 flex justify-end">
                <button
                  onClick={() => {
                    setShowResultsModal(false);
                    setSelectedLink(null);
                    setLinkResults([]);
                    setAllLinkResults([]);
                    setResultsPage(1);
                    setExpandedRows(new Set());
                  }}
                  className="w-full sm:w-auto px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm sm:text-base"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Result Detail Modal */}
      {showResultDetailModal && selectedResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <h3 className="text-lg sm:text-xl font-bold text-mh-dark">Result Details</h3>
                <button
                  onClick={() => {
                    setShowResultDetailModal(false);
                    setSelectedResult(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              {(() => {
                const participantInfo = selectedResult.attemptId?.participantInfo || {};
                const riskFlagCount = selectedResult.riskFlags ? Object.keys(selectedResult.riskFlags).length : 0;
                return (
                  <>
                    {/* Participant Information */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Participant Information</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs text-gray-500">Name</div>
                          <div className="text-sm font-medium text-gray-900">{participantInfo.name || 'Anonymous'}</div>
                        </div>
                        {participantInfo.email && (
                          <div>
                            <div className="text-xs text-gray-500">Email</div>
                            <div className="text-sm text-gray-900">{participantInfo.email}</div>
                          </div>
                        )}
                        {participantInfo.gender && (
                          <div>
                            <div className="text-xs text-gray-500">Gender</div>
                            <div className="text-sm text-gray-900">{participantInfo.gender}</div>
                          </div>
                        )}
                        {participantInfo.dateOfBirth && (
                          <div>
                            <div className="text-xs text-gray-500">Date of Birth</div>
                            <div className="text-sm text-gray-900">{participantInfo.dateOfBirth}</div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Assessment Results */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Assessment Results</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs text-gray-500">Score</div>
                          <div className="text-2xl font-bold text-mh-dark">{selectedResult.score || 0}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Band</div>
                          <div className="mt-1">
                            {selectedResult.band ? (
                              <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getBandColorClass(selectedResult.band)}`}>
                                {selectedResult.band}
                              </span>
                            ) : (
                              <span className="text-sm text-gray-500">-</span>
                            )}
                          </div>
                        </div>
                        {selectedResult.bandDescription && (
                          <div className="sm:col-span-2">
                            <div className="text-xs text-gray-500 mb-1">Band Description</div>
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                              {selectedResult.bandDescription}
                            </div>
                          </div>
                        )}
                        <div>
                          <div className="text-xs text-gray-500">Time Taken</div>
                          <div className="text-sm font-medium text-gray-900">{getTimeTaken(selectedResult)} minutes</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Completion</div>
                          <div className="text-sm font-medium text-gray-900">{getCompletionPercentage(selectedResult)}%</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Started At</div>
                          <div className="text-sm text-gray-900">
                            {selectedResult.attemptId?.startedAt ? new Date(selectedResult.attemptId.startedAt).toLocaleString() : 'N/A'}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Completed At</div>
                          <div className="text-sm text-gray-900">
                            {selectedResult.createdAt ? new Date(selectedResult.createdAt).toLocaleString() : 'N/A'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Subscales */}
                    {selectedResult.subscales && Object.keys(selectedResult.subscales).length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Subscales</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {Object.entries(selectedResult.subscales).map(([key, value]) => (
                            <div key={key} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                              <div className="text-xs text-gray-500 mb-1">{key}</div>
                              <div className="text-lg font-bold text-mh-dark">{value}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Risk Flags */}
                    {riskFlagCount > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-red-700 mb-3">Risk Flags ({riskFlagCount})</h4>
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
                          {Object.entries(selectedResult.riskFlags).map(([flag, data]) => (
                            <div key={flag} className="border-b border-red-200 last:border-b-0 pb-2 last:pb-0">
                              <div className="font-semibold text-red-800 text-sm mb-1">{flag}</div>
                              <div className="text-sm text-red-700">
                                {typeof data === 'object' && data.helpText ? data.helpText : 'Risk flag triggered'}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Interpretation */}
                    {selectedResult.interpretation && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Interpretation</h4>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <div className="text-xs text-gray-600 mb-2">
                            Answered: {selectedResult.interpretation.answeredCount || 0} / {selectedResult.interpretation.totalItems || 0} questions
                          </div>
                          {selectedResult.interpretation.text && (
                            <div className="text-sm text-gray-700 whitespace-pre-wrap">
                              {selectedResult.interpretation.text}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            <div className="p-4 sm:p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => {
                  setShowResultDetailModal(false);
                  setSelectedResult(null);
                }}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm sm:text-base"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Email Modal */}
      {showEmailModal && selectedLinkForEmail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[95vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-start gap-4">
                <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                  <div className="bg-opacity-20 rounded-lg p-2 flex-shrink-0">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg sm:text-2xl font-bold truncate">Send Assessment Link via Email</h2>
                    <p className="text-xs sm:text-sm mt-1 opacity-95 truncate">
                      {selectedLinkForEmail.campaignName || 'No campaign name'} • {selectedLinkForEmail.testId?.title || 'N/A'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowEmailModal(false);
                    setSelectedLinkForEmail(null);
                    setEmailForm({ recipientEmails: '', customMessage: '' });
                    setEmailResults(null);
                    setEmailCount(0);
                    setValidEmails([]);
                    setInvalidEmails([]);
                    setShowEmailPreview(false);
                  }}
                  className="text-gray-500 hover:text-mh-dark hover:bg-opacity-20 rounded-lg p-1 transition flex-shrink-0"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50">
              {emailResults ? (
                <div className="space-y-6">
                  {/* Success Summary Card */}
                  <div className={`rounded-xl p-4 sm:p-6 shadow-lg ${
                    emailResults.successful > 0 && emailResults.failed === 0
                      ? 'bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300'
                      : emailResults.successful > 0 && emailResults.failed > 0
                      ? 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-300'
                      : 'bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-300'
                  }`}>
                    <div className="flex items-center gap-3 sm:gap-4 mb-4">
                      <div className={`text-3xl sm:text-4xl flex-shrink-0 ${
                        emailResults.successful === emailResults.total ? 'text-green-600' :
                        emailResults.successful > 0 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {emailResults.successful === emailResults.total ? '✅' :
                         emailResults.successful > 0 ? '⚠️' : '❌'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg sm:text-xl mb-1">
                          {emailResults.successful === emailResults.total
                            ? 'All emails sent successfully!'
                            : emailResults.successful > 0
                            ? `${emailResults.successful} sent, ${emailResults.failed} failed`
                            : 'Failed to send emails'}
                        </h3>
                        <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm font-medium">
                          <span className="text-gray-700">Total: <span className="font-bold">{emailResults.total}</span></span>
                          <span className="text-green-700">Successful: <span className="font-bold">{emailResults.successful}</span></span>
                          {emailResults.failed > 0 && (
                            <span className="text-red-700">Failed: <span className="font-bold">{emailResults.failed}</span></span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Detailed Results */}
                  {emailResults.results && emailResults.results.length > 0 && (
                    <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
                      <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2 text-sm sm:text-base">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Email Status Details
                      </h4>
                      <div className="space-y-2 max-h-80 overflow-y-auto">
                        {emailResults.results.map((result, index) => (
                          <div
                            key={index}
                            className={`p-3 sm:p-4 rounded-lg border-l-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 transition ${
                              result.success 
                                ? 'bg-green-50 border-green-400 text-green-900' 
                                : 'bg-red-50 border-red-400 text-red-900'
                            }`}
                          >
                            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                              <span className={`text-base sm:text-lg flex-shrink-0 ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                                {result.success ? '✓' : '✗'}
                              </span>
                              <span className="font-medium truncate text-sm sm:text-base">{result.email}</span>
                            </div>
                            {!result.success && (
                              <span className="text-xs text-red-600 sm:ml-2 flex-shrink-0">
                                {result.error || 'Failed'}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      onClick={() => {
                        setShowEmailModal(false);
                        setSelectedLinkForEmail(null);
                        setEmailForm({ recipientEmails: '', customMessage: '' });
                        setEmailResults(null);
                        setEmailCount(0);
                        setValidEmails([]);
                        setInvalidEmails([]);
                        setShowEmailPreview(false);
                        setEmailList([]);
                        setCurrentEmailInput('');
                      }}
                      className="flex-1 px-4 sm:px-6 py-2 sm:py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium text-sm sm:text-base"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => {
                        setEmailResults(null);
                        setEmailForm({ recipientEmails: '', customMessage: '' });
                        setEmailCount(0);
                        setValidEmails([]);
                        setInvalidEmails([]);
                        setShowEmailPreview(false);
                        setEmailList([]);
                        setCurrentEmailInput('');
                      }}
                      className="flex-1 px-4 sm:px-6 py-2 sm:py-3 bg-mh-gradient text-white rounded-lg hover:opacity-90 transition font-medium shadow-md text-sm sm:text-base"
                    >
                      Send Another
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSendEmailSubmit} className="space-y-6">
                  {/* Email Input Section */}
                  <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-4">
                      <label className="block text-sm font-semibold text-gray-800">
                        Recipient Email(s) <span className="text-red-500">*</span>
                      </label>
                      {emailCount > 0 && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold ${
                            invalidEmails.length === 0 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {emailCount} email{emailCount !== 1 ? 's' : ''}
                          </span>
                          {invalidEmails.length > 0 && (
                            <span className="px-2 sm:px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                              {invalidEmails.length} invalid
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Single Email Input with Add Button */}
                    <div className="mb-4">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="email"
                          value={currentEmailInput}
                          onChange={(e) => setCurrentEmailInput(e.target.value)}
                          onKeyPress={handleEmailInputKeyPress}
                          placeholder="Enter email address"
                          className="flex-1 px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-mh-green focus:border-mh-green transition text-sm sm:text-base"
                        />
                        <button
                          type="button"
                          onClick={handleAddEmail}
                          disabled={!currentEmailInput.trim()}
                          className="px-4 sm:px-6 py-2 sm:py-3 bg-mh-gradient text-white rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md flex items-center justify-center gap-2 text-sm sm:text-base"
                        >
                          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          <span className="hidden sm:inline">Add Email</span>
                          <span className="sm:hidden">Add</span>
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Press Enter or click "Add Email" to add to the list
                      </p>
                    </div>

                    {/* CSV Upload Option */}
                    <div className="mb-4 p-3 sm:p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                      <label htmlFor="csv-upload" className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-700 cursor-pointer hover:text-mh-green transition group">
                        <div className="bg-white p-2 rounded-lg group-hover:bg-mh-green group-hover:text-white transition flex-shrink-0">
                          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-semibold block text-xs sm:text-sm">Upload CSV for Bulk Import</span>
                          <span className="text-xs text-gray-500 hidden sm:block">Click to upload or drag & drop CSV file</span>
                          <span className="text-xs text-gray-500 sm:hidden">Upload CSV file</span>
                        </div>
                        <input
                          id="csv-upload"
                          type="file"
                          accept=".csv"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {/* Email List Display */}
                    {emailList.length > 0 && (
                      <div className="mt-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                          <h4 className="text-sm font-semibold text-gray-800">Email List ({emailList.length})</h4>
                          {emailList.length > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                setEmailList([]);
                                updateEmailCounts([]);
                                showToast.success('Email list cleared');
                              }}
                              className="text-xs text-red-600 hover:text-red-700 font-medium self-start sm:self-auto"
                            >
                              Clear All
                            </button>
                          )}
                        </div>
                        <div className="max-h-60 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-2 sm:p-3 bg-gray-50">
                          {emailList.map((emailItem, index) => {
                            const isValid = emailItem.isValid && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailItem.email);
                            return (
                              <div
                                key={index}
                                className={`flex items-center justify-between p-2 sm:p-3 rounded-lg border-l-4 ${
                                  isValid
                                    ? 'bg-white border-green-400'
                                    : 'bg-red-50 border-red-400'
                                }`}
                              >
                                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                                  <span className={`text-base sm:text-lg flex-shrink-0 ${isValid ? 'text-green-600' : 'text-red-600'}`}>
                                    {isValid ? '✓' : '✗'}
                                  </span>
                                  <span className={`font-mono text-xs sm:text-sm truncate ${isValid ? 'text-gray-900' : 'text-red-800'}`}>
                                    {emailItem.email}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveEmail(index)}
                                  className="ml-2 text-red-600 hover:text-red-700 hover:bg-red-50 p-1 rounded transition flex-shrink-0"
                                  title="Remove email"
                                >
                                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            );
                          })}
                        </div>
                        {invalidEmails.length > 0 && (
                          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-xs text-red-700 font-semibold mb-1">
                              ⚠️ {invalidEmails.length} invalid email(s) found. Please remove them before sending.
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {emailList.length === 0 && (
                      <div className="text-center py-8 text-gray-400">
                        <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <p className="text-sm">No emails added yet. Add emails individually or upload a CSV file.</p>
                      </div>
                    )}
                  </div>

                  {/* Custom Message Section */}
                  <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
                    <label className="block text-sm font-semibold text-gray-800 mb-3">
                      Custom Message <span className="text-gray-500 font-normal">(Optional)</span>
                    </label>
                    <textarea
                      name="customMessage"
                      value={emailForm.customMessage}
                      onChange={handleEmailFormChange}
                      placeholder="Add a personal message that will appear prominently in the email..."
                      rows={4}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-mh-green focus:border-mh-green resize-none transition text-sm sm:text-base"
                    />
                    <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                      <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="hidden sm:inline">This message will be displayed prominently in the email body</span>
                      <span className="sm:hidden">Message appears in email</span>
                    </p>
                  </div>

                  {/* Link Preview Section */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-md p-4 sm:p-6 border-2 border-blue-200">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-3">
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        <span className="text-xs sm:text-sm">Assessment Link Preview</span>
                      </label>
                      <button
                        type="button"
                        onClick={async () => {
                          const fullLink = `${window.location.origin}/assessment-link/${selectedLinkForEmail.linkToken}`;
                          const success = await copyToClipboard(fullLink);
                          if (success) {
                            showToast.success('Link copied to clipboard!');
                          } else {
                            showToast.error('Failed to copy link. Please copy manually.');
                          }
                        }}
                        className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-1 w-full sm:w-auto"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy
                      </button>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-blue-200">
                      <p className="text-xs sm:text-sm text-gray-700 break-all font-mono">
                        {window.location.origin}/assessment-link/{selectedLinkForEmail.linkToken}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEmailModal(false);
                        setSelectedLinkForEmail(null);
                        setEmailForm({ recipientEmails: '', customMessage: '' });
                        setEmailResults(null);
                        setEmailCount(0);
                        setValidEmails([]);
                        setInvalidEmails([]);
                        setShowEmailPreview(false);
                      }}
                      className="flex-1 px-4 sm:px-6 py-2 sm:py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium text-sm sm:text-base"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={sendingEmail || emailList.length === 0 || invalidEmails.length > 0}
                      className="flex-1 px-4 sm:px-6 py-2 sm:py-3 bg-mh-gradient text-white rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg flex items-center justify-center gap-2 text-sm sm:text-base"
                    >
                      {sendingEmail ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                          <span>Sending...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                          <span>Send {emailList.length > 0 ? `${emailList.length} Email${emailList.length !== 1 ? 's' : ''}` : 'Email(s)'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Email History Modal */}
      {showEmailHistoryModal && selectedLinkForHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl sm:text-2xl font-bold text-mh-dark">Email History</h2>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1 truncate">
                    {selectedLinkForHistory.campaignName || 'No campaign name'} - {selectedLinkForHistory.testId?.title || 'N/A'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowEmailHistoryModal(false);
                    setSelectedLinkForHistory(null);
                    setEmailHistory([]);
                    setEmailHistoryPage(1);
                    setEmailHistoryStatusFilter('all');
                  }}
                  className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 border-b border-gray-200">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleEmailHistoryFilterChange('all')}
                  className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition ${
                    emailHistoryStatusFilter === 'all'
                      ? 'bg-mh-gradient text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => handleEmailHistoryFilterChange('sent')}
                  className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition ${
                    emailHistoryStatusFilter === 'sent'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Sent
                </button>
                <button
                  onClick={() => handleEmailHistoryFilterChange('failed')}
                  className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition ${
                    emailHistoryStatusFilter === 'failed'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Failed
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {loadingEmailHistory ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-mh-green mb-4"></div>
                    <p className="text-gray-600 text-sm">Loading email history...</p>
                  </div>
                </div>
              ) : emailHistory.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-sm">No email history found for this assessment link</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Desktop Table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recipient</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sent By</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sent At</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {emailHistory.map((email) => (
                          <tr key={email._id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <div className="text-sm font-medium text-gray-900">{email.recipientEmail}</div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-sm text-gray-900 max-w-xs truncate" title={email.subject}>
                                {email.subject}
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              {email.status === 'sent' ? (
                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                  ✅ Sent
                                </span>
                              ) : (
                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                  ❌ Failed
                                </span>
                              )}
                              {email.errorMessage && (
                                <div className="text-xs text-red-600 mt-1" title={email.errorMessage}>
                                  {email.errorMessage.length > 50 ? `${email.errorMessage.substring(0, 50)}...` : email.errorMessage}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-sm text-gray-900">
                                {email.sentBy?.firstName || ''} {email.sentBy?.lastName || ''}
                              </div>
                              <div className="text-xs text-gray-500">{email.sentBy?.email || ''}</div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              {email.sentAt ? new Date(email.sentAt).toLocaleString() : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-3">
                    {emailHistory.map((email) => (
                      <div key={email._id} className="bg-white border border-gray-200 rounded-lg p-4 space-y-2">
                        <div>
                          <div className="text-xs text-gray-500">Recipient</div>
                          <div className="text-sm font-medium text-gray-900 truncate">{email.recipientEmail}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Subject</div>
                          <div className="text-sm text-gray-900">{email.subject}</div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                          <div>
                            <div className="text-xs text-gray-500">Status</div>
                            <div className="mt-1">
                              {email.status === 'sent' ? (
                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                  ✅ Sent
                                </span>
                              ) : (
                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                  ❌ Failed
                                </span>
                              )}
                            </div>
                            {email.errorMessage && (
                              <div className="text-xs text-red-600 mt-1" title={email.errorMessage}>
                                {email.errorMessage.length > 30 ? `${email.errorMessage.substring(0, 30)}...` : email.errorMessage}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Sent At</div>
                            <div className="text-xs text-gray-500 mt-1">
                              {email.sentAt ? new Date(email.sentAt).toLocaleString() : '-'}
                            </div>
                          </div>
                        </div>
                        {email.sentBy && (
                          <div className="pt-2 border-t border-gray-100">
                            <div className="text-xs text-gray-500">Sent By</div>
                            <div className="text-sm text-gray-900">
                              {email.sentBy?.firstName || ''} {email.sentBy?.lastName || ''}
                            </div>
                            <div className="text-xs text-gray-500">{email.sentBy?.email || ''}</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {emailHistoryPagination.pages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-200 pt-4">
                      <div className="text-xs sm:text-sm text-gray-700 text-center sm:text-left">
                        Showing {((emailHistoryPagination.page - 1) * emailHistoryPagination.limit) + 1} to {Math.min(emailHistoryPagination.page * emailHistoryPagination.limit, emailHistoryPagination.total)} of {emailHistoryPagination.total} emails
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto justify-center">
                        <button
                          onClick={() => {
                            const newPage = emailHistoryPage - 1;
                            setEmailHistoryPage(newPage);
                            fetchEmailHistory(selectedLinkForHistory._id, newPage, emailHistoryStatusFilter);
                          }}
                          disabled={emailHistoryPage === 1}
                          className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-sm flex-1 sm:flex-initial"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => {
                            const newPage = emailHistoryPage + 1;
                            setEmailHistoryPage(newPage);
                            fetchEmailHistory(selectedLinkForHistory._id, newPage, emailHistoryStatusFilter);
                          }}
                          disabled={emailHistoryPage >= emailHistoryPagination.pages}
                          className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-sm flex-1 sm:flex-initial"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 sm:p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => {
                  setShowEmailHistoryModal(false);
                  setSelectedLinkForHistory(null);
                  setEmailHistory([]);
                  setEmailHistoryPage(1);
                  setEmailHistoryStatusFilter('all');
                }}
                className="w-full sm:w-auto px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm sm:text-base"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminAssessmentLinks;

