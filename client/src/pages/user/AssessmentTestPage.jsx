import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import Breadcrumb from '../../components/Breadcrumb';
import { startAttempt, saveAttempt, submitAttempt } from '../../api/assessmentApi';
import { 
  parseQuestions, 
  getQuestionType, 
  getQuestionOptions, 
  getSubQuestions,
  getQuestionText,
  getQuestionId
} from '../../utils/questionParser';
import QuestionRenderer from '../../components/QuestionRenderer';
import { getVisibleQuestions } from '../../utils/branchingEngine';

function AssessmentTestPage() {
  const navigate = useNavigate();
  const { id: testId } = useParams();
  
  const [test, setTest] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [questions, setQuestions] = useState([]); // All questions from schema
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);
  
  const autosaveTimerRef = useRef(null);
  const timeIntervalRef = useRef(null);
  
  // Compute visible questions based on current answers (re-computes on every render)
  const visibleQuestions = getVisibleQuestions(questions, answers);

  // Initialize test and attempt
  useEffect(() => {
    if (testId) {
      initializeTest();
    }
    
    return () => {
      // Cleanup timers
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
      if (timeIntervalRef.current) {
        clearInterval(timeIntervalRef.current);
      }
    };
  }, [testId]);

  // Handle auto-submit when time expires (must be defined before startTimer)
  const handleAutoSubmit = useCallback(async () => {
    if (!attempt?._id) return;
    
    toast('Time expired. Submitting assessment...', { icon: '⏱️' });
    
    try {
      const response = await submitAttempt(attempt._id, answers);
      if (response.success && response.data?.result) {
        toast.success('Assessment auto-submitted due to time limit');
        navigate(`/test-result/${response.data.result._id}`);
      }
    } catch (err) {
      console.error('Error auto-submitting:', err);
      toast.error('Failed to auto-submit assessment');
    }
  }, [attempt?._id, answers, navigate]);

  // Start timer for time limit (must be defined before useEffect that uses it)
  const startTimer = useCallback(() => {
    if (timeIntervalRef.current) {
      clearInterval(timeIntervalRef.current);
    }
    
    if (!attempt?.expiresAt) return;
    
    timeIntervalRef.current = setInterval(() => {
      if (attempt?.expiresAt) {
        const now = new Date().getTime();
        const expiry = new Date(attempt.expiresAt).getTime();
        const remaining = Math.max(0, Math.floor((expiry - now) / 1000));
        
        setTimeRemaining(remaining);
        
        if (remaining === 0) {
          // Time expired, auto-submit
          handleAutoSubmit();
        }
      }
    }, 1000);
  }, [attempt?.expiresAt, handleAutoSubmit]);

  // Update time remaining when attempt changes
  useEffect(() => {
    if (attempt?.expiresAt) {
      startTimer();
    }
    
    return () => {
      if (timeIntervalRef.current) {
        clearInterval(timeIntervalRef.current);
      }
    };
  }, [attempt?.expiresAt, startTimer]);

  const initializeTest = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Start attempt (this will create new or return existing)
      const response = await startAttempt(testId);
      
      if (response.success && response.data) {
        const { attempt: attemptData, test: testData } = response.data;
        
        setAttempt(attemptData);
        setTest(testData);
        
        // Parse questions from schemaJson
        const parsedQuestions = parseQuestions(testData.schemaJson || {});
        setQuestions(parsedQuestions);
        
        // Load existing answers if any
        if (attemptData.answers && Object.keys(attemptData.answers).length > 0) {
          setAnswers(attemptData.answers);
        }
      } else {
        setError('Failed to start assessment');
        toast.error('Failed to start assessment');
      }
    } catch (err) {
      console.error('Error initializing test:', err);
      const errorMessage = err.response?.data?.message || 'Failed to load assessment';
      const eligibilityDetails = err.response?.data?.eligibilityDetails || [];
      
      // Enhanced error message for eligibility issues
      if (err.response?.status === 400 && errorMessage.toLowerCase().includes('eligible')) {
        let fullMessage = errorMessage;
        if (eligibilityDetails.length > 0) {
          fullMessage += '\n\nDetails:\n' + eligibilityDetails.map((detail, idx) => `• ${detail}`).join('\n');
        }
        setError(fullMessage);
        toast.error(errorMessage, {
          duration: 5000,
          style: {
            maxWidth: '500px',
            whiteSpace: 'pre-line'
          }
        });
      } else {
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };


  // Format time remaining as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Autosave with debouncing
  const debouncedSave = useCallback((answersToSave) => {
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }
    
    autosaveTimerRef.current = setTimeout(async () => {
      if (!attempt?._id) return;
      
      try {
        await saveAttempt(attempt._id, answersToSave);
        // Silently save, no toast to avoid distraction
      } catch (err) {
        console.error('Autosave failed:', err);
        // Don't show error for autosave, just log it
      }
    }, 2000); // 2 second debounce
  }, [attempt?._id]);

  const handleAnswerChange = (questionId, value) => {
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);
    
    // Trigger autosave
    debouncedSave(newAnswers);
  };

  const handleSaveAndExit = async () => {
    if (!attempt?._id) return;
    
    try {
      setSaving(true);
      await saveAttempt(attempt._id, answers);
      toast.success('Progress saved successfully');
      navigate('/my-assessments');
    } catch (err) {
      console.error('Error saving:', err);
      toast.error(err.response?.data?.message || 'Failed to save progress');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!attempt?._id) return;
    
    // Basic validation - check if all visible required questions are answered
    // Only validate questions that are currently visible
    const visibleRequiredQuestions = visibleQuestions
      .filter(({ question }) => question.required !== false);
    
    const unanswered = visibleRequiredQuestions.filter(({ question, originalIndex }) => {
      const qId = getQuestionId(question, originalIndex);
      const answer = answers[qId];
      // Handle different answer types: string, number, boolean, array (for checkbox)
      if (answer === null || answer === undefined || answer === '') {
        return true; // Unanswered
      }
      // For checkbox (array), check if it's empty
      if (Array.isArray(answer) && answer.length === 0) {
        return true; // Unanswered
      }
      return false; // Answered
    });
    
    if (unanswered.length > 0) {
      toast.error(`Please answer all questions. ${unanswered.length} question(s) remaining.`);
      return;
    }
    
    try {
      setSubmitting(true);
      const response = await submitAttempt(attempt._id, answers);
      
      if (response.success && response.data?.result) {
        toast.success('Assessment submitted successfully!');
        navigate(`/test-result/${response.data.result._id}`);
      } else {
        toast.error('Failed to submit assessment');
      }
    } catch (err) {
      console.error('Error submitting:', err);
      toast.error(err.response?.data?.message || 'Failed to submit assessment');
    } finally {
      setSubmitting(false);
    }
  };


  // Calculate progress (only count visible questions)
  const calculateProgress = () => {
    if (visibleQuestions.length === 0) return { percentage: 0, answered: 0, total: 0 };
    
    // Only count answers for visible questions
    const visibleQuestionIds = visibleQuestions.map(({ question }) => {
      return getQuestionId(question, questions.indexOf(question));
    });
    
    const answeredCount = visibleQuestionIds.filter(qId => {
      const answer = answers[qId];
      if (answer === null || answer === undefined || answer === '') {
        return false;
      }
      // For checkbox (array), check if it's not empty
      if (Array.isArray(answer)) {
        return answer.length > 0;
      }
      return true;
    }).length;
    
    const percentage = Math.round((answeredCount / visibleQuestions.length) * 100);
    return { percentage, answered: answeredCount, total: visibleQuestions.length };
  };

  const progress = calculateProgress();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-mh-green"></div>
          <p className="mt-4 text-gray-600">Loading assessment...</p>
        </div>
      </div>
    );
  }

  if (error || !test) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Assessment not found'}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-mh-green text-white rounded-full hover:bg-green-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 sm:px-8 lg:px-20 xl:px-40 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-2">
        <Breadcrumb isLoggedIn={true} customLabel={test.title} />
        <div className="flex items-center gap-4">
          {timeRemaining !== null && (
            <div className="text-sm font-medium text-red-600 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Time: {formatTime(timeRemaining)}
            </div>
          )}
          {attempt?.lastSavedAt && (
            <div className="text-xs sm:text-sm text-gray-500">
              Last saved: {new Date(attempt.lastSavedAt).toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>

      {/* Title Section */}
      <div className="bg-[#D5DCEE] rounded-xl p-6 sm:p-8 lg:p-16 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 text-center mb-3">{test.title}</h1>
        {test.shortDescription && (
          <p className="text-gray-600 text-sm sm:text-base text-center max-w-2xl mx-auto leading-relaxed">
            {test.shortDescription}
          </p>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Progress: {progress.percentage}%</span>
          <span className="text-sm text-gray-500">{progress.answered}/{progress.total} Questions</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-mh-gradient h-2 rounded-full transition-all" style={{ width: `${progress.percentage}%` }}></div>
        </div>
      </div>

      {/* Questions - Only show visible questions */}
      <div className="space-y-8">
        {visibleQuestions.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center">
            <p className="text-gray-600">
              {questions.length === 0 
                ? 'No questions available for this assessment.'
                : 'No questions are currently visible based on your answers. Please answer previous questions to see more.'}
            </p>
          </div>
        ) : (
          visibleQuestions.map(({ question, originalIndex }, displayIndex) => (
            <QuestionRenderer
              key={getQuestionId(question, originalIndex)}
              question={question}
              index={displayIndex} // Use display index for numbering visible questions
              answers={answers}
              onAnswerChange={handleAnswerChange}
            />
          ))
        )}
      </div>

      {/* Bottom Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-center mt-6 sm:mt-8 gap-4">
        <button
          onClick={handleSaveAndExit}
          disabled={saving}
          className="text-mh-green hover:text-green-700 px-4 py-2 rounded-full border border-mh-green font-medium transition-colors w-full sm:w-auto text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save & Do it Later'}
        </button>

        <button
          onClick={handleSubmit}
          disabled={submitting || saving}
          className="bg-mh-gradient hover:bg-green-700 text-white px-6 sm:px-8 py-2 rounded-full font-medium transition-colors w-full sm:w-auto text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Submitting...' : 'Submit'}
        </button>
      </div>
    </div>
  );
}

export default AssessmentTestPage;