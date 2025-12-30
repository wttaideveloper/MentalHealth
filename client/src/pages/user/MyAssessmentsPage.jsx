import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import assHero from '../../assets/images/ass-hero.png';
import f1 from '../../assets/images/f1.png';
import f2 from '../../assets/images/f2.png';
import Breadcrumb from '../../components/Breadcrumb';
import { getMyResults, downloadReport, getOngoingAttempts } from '../../api/assessmentApi';
import { getMe } from '../../api/authApi';

function MyAssessmentsPage() {
  const [activeTab, setActiveTab] = useState('ongoing');
  const [completedResults, setCompletedResults] = useState([]);
  const [ongoingAttempts, setOngoingAttempts] = useState([]);
  const [user, setUser] = useState({ firstName: 'User', lastName: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserInfo();
    fetchCompletedResults();
    fetchOngoingAttempts();
  }, []);

  useEffect(() => {
    // Refetch data when switching tabs
    if (activeTab === 'ongoing') {
      fetchOngoingAttempts();
    }
  }, [activeTab]);

  const fetchUserInfo = async () => {
    try {
      const response = await getMe();
      if (response.success && response.data) {
        setUser({
          firstName: response.data.firstName || 'User',
          lastName: response.data.lastName || ''
        });
      }
    } catch (err) {
      console.error('Error fetching user info:', err);
      // Don't show error, just use defaults
    }
  };

  const fetchCompletedResults = async () => {
    try {
      const response = await getMyResults();
      if (response.success && response.data) {
        setCompletedResults(response.data || []);
      } else {
        setCompletedResults([]);
      }
    } catch (err) {
      console.error('Error fetching results:', err);
      if (activeTab === 'history') {
        setError(err.response?.data?.message || 'Failed to load assessment history');
        toast.error(err.response?.data?.message || 'Failed to load assessment history');
      }
      setCompletedResults([]);
    }
  };

  const fetchOngoingAttempts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getOngoingAttempts();
      if (response.success && response.data) {
        setOngoingAttempts(response.data || []);
      } else {
        setOngoingAttempts([]);
      }
    } catch (err) {
      console.error('Error fetching ongoing attempts:', err);
      setError(err.response?.data?.message || 'Failed to load ongoing assessments');
      if (activeTab === 'ongoing') {
        toast.error(err.response?.data?.message || 'Failed to load ongoing assessments');
      }
      setOngoingAttempts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = async (e, resultId) => {
    e.stopPropagation();
    try {
      await downloadReport(resultId);
      toast.success('Report downloaded successfully');
    } catch (err) {
      console.error('Error downloading report:', err);
      toast.error(err.response?.data?.message || 'Failed to download report');
    }
  };

  const handleViewResult = (resultId) => {
    navigate(`/test-result/${resultId}`);
  };

  // Calculate progress from answers
  const calculateProgress = (answers, totalQuestions) => {
    if (!answers || !totalQuestions) return 0;
    const answeredCount = Object.keys(answers).filter(key => 
      answers[key] !== null && answers[key] !== undefined && answers[key] !== ''
    ).length;
    return Math.round((answeredCount / totalQuestions) * 100);
  };

  // Handle continue attempt
  const handleContinueAttempt = (testId) => {
    navigate(`/test/${testId}`);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Get image URL or fallback
  const getImageUrl = (imageUrl) => {
    if (imageUrl) return imageUrl;
    return f1; // Fallback to default image
  };

  // Get band color class
  const getBandColorClass = (band) => {
    if (!band) return 'bg-gray-100 text-gray-700';
    const bandLower = band.toLowerCase();
    if (bandLower.includes('low')) return 'bg-green-100 text-green-700';
    if (bandLower.includes('moderate') || bandLower.includes('medium')) return 'bg-orange-100 text-orange-700';
    if (bandLower.includes('high') || bandLower.includes('severe')) return 'bg-red-100 text-red-700';
    return 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      {/* Breadcrumb */}
      <Breadcrumb isLoggedIn={true} />
      {/* Hero Section */}
      <div className="bg-mh-gradient rounded-2xl p-6 sm:p-8 mb-6 sm:mb-8 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
          <div className="text-white">
            <div className="bg-green-700 bg-opacity-50 rounded-full px-3 sm:px-4 py-1 text-xs sm:text-sm mb-3 sm:mb-4 inline-block">
              My Assessments
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">
              Hi, {user.firstName} {user.lastName}
            </h1>
            <p className="text-green-100 text-sm sm:text-base">
              {activeTab === 'ongoing' 
                ? 'Your ongoing assessments' 
                : `You have ${completedResults.length} completed assessment${completedResults.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <div className="flex-shrink-0 self-center lg:self-auto">
            <img src={assHero} alt="Assessment Hero" className="w-48 sm:w-56 lg:w-64 h-auto" />
          </div>
        </div>
      </div>

      {/* Header with Tabs */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8 gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
          {activeTab === 'ongoing' ? 'On going Assessment' : 'Assessment History'}
        </h2>
        <div className="flex gap-2 sm:gap-3 overflow-x-auto">
          <button
            onClick={() => setActiveTab('ongoing')}
            className={`px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'ongoing'
                ? 'bg-mh-green text-white'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            On going Assessment
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'history'
                ? 'bg-mh-green text-white'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            Assessment History
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-20">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-mh-green"></div>
            <p className="mt-4 text-gray-600">Loading assessments...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="text-center py-20">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={activeTab === 'ongoing' ? fetchOngoingAttempts : fetchCompletedResults}
            className="px-6 py-2 bg-mh-green text-white rounded-full hover:bg-green-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Assessment Cards */}
      <div className="space-y-4">
        {activeTab === 'ongoing' ? (
          <>
            {/* Empty State */}
            {!loading && ongoingAttempts.length === 0 && (
              <div className="bg-white rounded-xl p-12 text-center">
                <p className="text-gray-600 mb-4">You don't have any ongoing assessments.</p>
                <button
                  onClick={() => navigate('/assessments')}
                  className="px-6 py-2 bg-mh-gradient text-white rounded-full hover:bg-green-700 transition-colors"
                >
                  Browse Assessments
                </button>
              </div>
            )}

            {/* Ongoing Attempt Cards */}
            {!loading && ongoingAttempts.map((attempt) => {
              const test = attempt.testId;
              const progress = calculateProgress(attempt.answers, test?.questionsCount || 0);
              const timeRemaining = attempt.expiresAt 
                ? Math.max(0, Math.floor((new Date(attempt.expiresAt).getTime() - new Date().getTime()) / 1000))
                : null;
              
              return (
                <div key={attempt._id} className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-gray-100">
                  <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                    <div className="relative flex-shrink-0 self-center lg:self-start">
                      <img
                        src={getImageUrl(test?.imageUrl)}
                        alt={test?.title || 'Assessment'}
                        className="w-full max-w-xs sm:w-48 lg:w-60 h-32 sm:h-36 lg:h-44 object-cover rounded-lg opacity-75"
                        onError={(e) => {
                          e.target.src = f2;
                        }}
                      />
                      <div className="absolute top-1.5 left-1.5 bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
                        In Progress
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 gap-2">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {test?.title || 'Assessment'}
                          </h3>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-gray-500 text-sm mt-2">
                            {test?.durationMinutesMin && test?.durationMinutesMax && (
                              <div className="flex items-center">
                                <svg className="w-4 h-4 mr-1 text-mh-green" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                </svg>
                                {test.durationMinutesMin}-{test.durationMinutesMax} minutes
                              </div>
                            )}
                            {test?.questionsCount && (
                              <div className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                                </svg>
                                {test.questionsCount} Questions
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-left sm:text-right text-sm text-gray-500 flex-shrink-0">
                          Started {formatDate(attempt.startedAt)}
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-700">Progress: {progress}%</span>
                          <span className="text-sm text-gray-500">
                            {Object.keys(attempt.answers || {}).filter(key => 
                              attempt.answers[key] !== null && 
                              attempt.answers[key] !== undefined && 
                              attempt.answers[key] !== ''
                            ).length}/{test?.questionsCount || 0} Questions
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-mh-gradient h-2 rounded-full transition-all" 
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Time Remaining */}
                      {timeRemaining !== null && (
                        <div className="mb-4">
                          <div className="text-sm text-red-600 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Time remaining: {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex flex-col sm:flex-row gap-3 justify-end">
                        <button
                          onClick={() => handleContinueAttempt(test._id)}
                          className="bg-mh-gradient hover:bg-green-700 text-white px-5 py-2 rounded-full text-sm font-medium transition-colors"
                        >
                          Continue Assessment
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        ) : (
          <>
            {/* Empty State */}
            {!loading && completedResults.length === 0 && (
              <div className="bg-white rounded-xl p-12 text-center">
                <p className="text-gray-600 mb-4">You haven't completed any assessments yet.</p>
                <button
                  onClick={() => navigate('/assessments')}
                  className="px-6 py-2 bg-mh-gradient text-white rounded-full hover:bg-green-700 transition-colors"
                >
                  Browse Assessments
                </button>
              </div>
            )}

            {/* Assessment History Cards */}
            {!loading && completedResults.map((result) => {
              const test = result.testId;
              const attempt = result.attemptId;
              const submittedDate = attempt?.submittedAt || result.createdAt;
              
              return (
                <div key={result._id} className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-gray-100">
                  <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                    <div className="relative flex-shrink-0 self-center lg:self-start">
                      <img
                        src={getImageUrl(test?.imageUrl)}
                        alt={test?.title || 'Assessment'}
                        className="w-full max-w-xs sm:w-48 lg:w-60 h-32 sm:h-36 lg:h-44 object-cover rounded-lg opacity-75"
                        onError={(e) => {
                          e.target.src = f2;
                        }}
                      />
                      <div className="absolute top-1.5 left-1.5 bg-mh-green text-white text-xs px-2 py-0.5 rounded-full">
                        Completed
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 gap-2">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {test?.title || 'Assessment'}
                          </h3>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-gray-500 text-sm mt-2">
                            {test?.durationMinutesMin && test?.durationMinutesMax && (
                              <div className="flex items-center">
                                <svg className="w-4 h-4 mr-1 text-mh-green" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                </svg>
                                {test.durationMinutesMin}-{test.durationMinutesMax} minutes
                              </div>
                            )}
                            {test?.questionsCount && (
                              <div className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                                </svg>
                                {test.questionsCount} Questions
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-left sm:text-right text-sm text-gray-500 flex-shrink-0">
                          Completed on {formatDate(submittedDate)}
                        </div>
                      </div>
                      
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mt-6 lg:mt-20">
                        <div>
                          <div className="text-sm font-medium text-mh-dark mb-1">Result</div>
                          <div className={`px-3 py-1 rounded-full text-sm font-medium inline-block ${getBandColorClass(result.band)}`}>
                            {result.band || `Score: ${result.score}`}
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <button
                            onClick={(e) => handleDownloadReport(e, result._id)}
                            className="border border-mh-green text-mh-green hover:bg-green-50 px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center justify-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Download Report
                          </button>
                          <button
                            onClick={() => handleViewResult(result._id)}
                            className="bg-mh-gradient hover:bg-green-700 text-white px-5 py-2 rounded-full text-sm font-medium transition-colors"
                          >
                            View
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}

export default MyAssessmentsPage;