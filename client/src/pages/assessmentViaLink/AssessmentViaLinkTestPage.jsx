import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import Breadcrumb from '../../components/Breadcrumb';
import { validateAssessmentLink, saveLinkAttempt, submitLinkAttempt } from '../../api/publicAssessmentLinkApi';
import { parseQuestions, getQuestionId } from '../../utils/questionParser';
import QuestionRenderer from '../../components/QuestionRenderer';
import { getVisibleQuestions } from '../../utils/branchingEngine';

function AssessmentViaLinkTestPage() {
  const navigate = useNavigate();
  const { token, attemptId } = useParams();
  
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

  // Load attempt data from localStorage or API
  useEffect(() => {
    if (token && attemptId) {
      initializeTest();
    } else {
      toast.error('Invalid assessment link or attempt');
      setLoading(false);
    }
    
    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
      if (timeIntervalRef.current) {
        clearInterval(timeIntervalRef.current);
      }
    };
  }, [token, attemptId]);

  // Initialize test and attempt
  const initializeTest = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get attempt data from localStorage (stored when starting attempt)
      const storedAttempt = localStorage.getItem(`linkAttempt_${token}`);
      if (storedAttempt && storedAttempt === attemptId) {
        // Get test schema from validate API
        const validateResponse = await validateAssessmentLink(token);
        
        if (validateResponse.success && validateResponse.data) {
          setTest(validateResponse.data.test);
          // Parse questions from schemaJson
          const parsedQuestions = parseQuestions(validateResponse.data.test.schemaJson || {});
          setQuestions(parsedQuestions);
          
          // Load saved answers from attempt (if any)
          // For now, we'll start with empty answers
          // In a full implementation, you'd fetch the attempt to get saved answers
          setAttempt({ _id: attemptId, answers: {} });
        }
      } else {
        toast.error('Invalid attempt');
      }
    } catch (err) {
      console.error('Error initializing test:', err);
      setError(err.response?.data?.message || 'Failed to load assessment');
      toast.error(err.response?.data?.message || 'Failed to load assessment');
    } finally {
      setLoading(false);
    }
  };

  // Auto-save answers
  const handleAutoSave = useCallback(async () => {
    if (!token || !attemptId || Object.keys(answers).length === 0) return;
    
    try {
      await saveLinkAttempt(token, attemptId, answers);
    } catch (err) {
      console.error('Error auto-saving:', err);
      // Don't show error toast for auto-save failures
    }
  }, [token, attemptId, answers]);

  // Handle answer change
  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => {
      const newAnswers = { ...prev, [questionId]: value };
      
      // Auto-save after 2 seconds of inactivity
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
      autosaveTimerRef.current = setTimeout(() => {
        handleAutoSave();
      }, 2000);
      
      return newAnswers;
    });
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!token || !attemptId) {
      toast.error('Invalid attempt');
      return;
    }

    try {
      setSubmitting(true);
      const response = await submitLinkAttempt(token, attemptId, answers);
      
      if (response.success && response.data?.result) {
        // Store result in localStorage for result page
        localStorage.setItem(`linkResult_${token}`, JSON.stringify(response.data.result));
        toast.success('Assessment submitted successfully!');
        // Navigate to result page
        navigate(`/assessment-link/${token}/result/${response.data.result._id}`);
      } else {
        toast.error(response.message || 'Failed to submit assessment');
      }
    } catch (err) {
      console.error('Error submitting:', err);
      toast.error(err.response?.data?.message || 'Failed to submit assessment');
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate progress (only count visible questions)
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
  const totalQuestions = visibleQuestions.length;
  const progress = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Failed to load assessment'}</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-mh-gradient text-white rounded-full"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 sm:px-8 lg:px-20 xl:px-40 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-2">
        <Breadcrumb isLoggedIn={false} customLabel="Assessment Test" />
        {timeRemaining !== null && (
          <div className="text-xs sm:text-sm text-gray-500">
            Time remaining: {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
          </div>
        )}
      </div>

      {/* Title Section */}
      <div className="bg-[#D5DCEE] rounded-xl p-6 sm:p-8 lg:p-16 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 text-center mb-3">{test.title}</h1>
        {test.longDescription && (
          <p className="text-gray-600 text-sm sm:text-base text-center max-w-2xl mx-auto leading-relaxed">
            {test.longDescription}
          </p>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Progress: {progress}%</span>
          <span className="text-sm text-gray-500">{answeredCount}/{totalQuestions} Questions</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-mh-gradient h-2 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
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
            question={question}
            index={index}
              answers={answers}
              onAnswerChange={handleAnswerChange}
            />
          ))
        )}
      </div>

      {/* Bottom Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-center mt-8 gap-4">
        <button
          onClick={handleAutoSave}
          disabled={saving || Object.keys(answers).length === 0}
          className="text-mh-green hover:text-green-700 px-4 py-2 rounded-full border border-mh-green font-medium transition-colors w-full sm:w-auto text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Progress'}
        </button>

        <button
          onClick={handleSubmit}
          disabled={submitting || answeredCount === 0}
          className="bg-mh-gradient hover:bg-green-700 text-white px-6 sm:px-8 py-2 rounded-full font-medium transition-colors w-full sm:w-auto text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Submitting...' : 'Submit Assessment'}
        </button>
      </div>
    </div>
  );
}

export default AssessmentViaLinkTestPage;
