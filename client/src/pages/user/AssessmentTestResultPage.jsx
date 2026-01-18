import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import Breadcrumb from '../../components/Breadcrumb';
import { getResultById, downloadReport } from '../../api/assessmentApi';
import { 
  parseQuestions, 
  getQuestionType, 
  getQuestionOptions, 
  getSubQuestions,
  getQuestionText,
  getQuestionId
} from '../../utils/questionParser';
import QuestionResultRenderer from '../../components/QuestionResultRenderer';

function AssessmentTestResultPage() {
  const navigate = useNavigate();
  const { id: resultId } = useParams();
  
  const [result, setResult] = useState(null);
  const [test, setTest] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    // Scroll to top when component mounts or resultId changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    if (resultId) {
      fetchResult();
    }
  }, [resultId]);

  // Scroll to top when result is loaded
  useEffect(() => {
    if (result && !loading) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [result, loading]);

  const fetchResult = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getResultById(resultId);
      
      if (response.success && response.data) {
        const resultData = response.data;
        setResult(resultData);
        
        // Extract test, attempt, and user data
        if (resultData.testId) {
          setTest(resultData.testId);
          // Parse questions from schemaJson
          const parsedQuestions = parseQuestions(resultData.testId.schemaJson || {});
          setQuestions(parsedQuestions);
        }
        
        if (resultData.attemptId) {
          setAttempt(resultData.attemptId);
          // Load answers from attempt
          if (resultData.attemptId.answers) {
            setAnswers(resultData.attemptId.answers);
          }
        }
      } else {
        setError('Failed to load result');
        toast.error('Failed to load assessment result');
      }
    } catch (err) {
      console.error('Error fetching result:', err);
      setError(err.response?.data?.message || 'Failed to load assessment result');
      toast.error(err.response?.data?.message || 'Failed to load assessment result');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = async () => {
    if (!resultId) return;
    
    try {
      setDownloading(true);
      await downloadReport(resultId);
      toast.success('Report downloaded successfully');
    } catch (err) {
      console.error('Error downloading report:', err);
      toast.error(err.response?.data?.message || 'Failed to download report');
    } finally {
      setDownloading(false);
    }
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

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-mh-green"></div>
          <p className="mt-4 text-gray-600">Loading result...</p>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Result not found'}</p>
          <button
            onClick={() => navigate('/my-assessments')}
            className="px-6 py-2 bg-mh-green text-white rounded-full hover:bg-green-700 transition-colors"
          >
            Go to My Assessments
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-40 py-6">
      {/* Header */}
      <Breadcrumb isLoggedIn={true} customLabel={test?.title || 'Assessment Result'} />

      {/* Result Header */}
      <div className="bg-mh-gradient rounded-xl p-8 sm:p-16 mb-6 text-white">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-2">Your Assessment Result</h1>
            {result.band && (
              <div className={`font-bold mt-4 rounded-full px-4 py-2 text-sm inline-block ${getBandColorClass(result.band)}`}>
                {result.band}
              </div>
            )}
            {result.bandDescription && (
              <div className="mt-4 p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                <p className="text-white text-sm leading-relaxed">{result.bandDescription}</p>
              </div>
            )}
          </div>
          <div className="text-left sm:text-right">
            <div className="text-lg font-semibold">{test?.title || 'Assessment'}</div>
            {result.createdAt && (
              <div className="text-green-100 text-sm mt-4">Completed on {formatDate(result.createdAt)}</div>
            )}
            <div className="text-green-100 text-sm mt-1">Score: {result.score}</div>
          </div>
        </div>
      </div>

      {/* Risk Flags Alert */}
      {result.riskFlags && Object.keys(result.riskFlags).length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              <h3 className="text-red-800 font-semibold mb-2">Important Information</h3>
              {result.interpretation?.riskHelpText && (
                <p className="text-red-700 text-sm">{result.interpretation.riskHelpText}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Interpretation Section */}
      {result.interpretation && (
        <div className="bg-white rounded-lg p-6 border border-gray-200 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Interpretation</h2>
          {result.interpretation.band && (
            <div className="mb-4">
              <div className="text-sm text-gray-600 mb-1">Result Band</div>
              <div className={`px-3 py-2 rounded-full text-sm font-medium inline-block ${getBandColorClass(result.interpretation.band)}`}>
                {result.interpretation.band}
              </div>
              {result.bandDescription && (
                <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-800 text-sm leading-relaxed">{result.bandDescription}</p>
                </div>
              )}
            </div>
          )}
          {result.interpretation.score !== undefined && (
            <div className="mb-4">
              <div className="text-sm text-gray-600 mb-1">Total Score</div>
              <div className="text-2xl font-bold text-gray-900">{result.interpretation.score}</div>
            </div>
          )}
          {result.interpretation.answeredCount !== undefined && result.interpretation.totalItems !== undefined && (
            <div className="mb-4">
              <div className="text-sm text-gray-600 mb-1">Questions Answered</div>
              <div className="text-lg text-gray-900">{result.interpretation.answeredCount} / {result.interpretation.totalItems}</div>
            </div>
          )}
        </div>
      )}

      {/* Subscales Section */}
      {result.subscales && Object.keys(result.subscales).length > 0 && (
        <div className="bg-white rounded-lg p-6 border border-gray-200 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Subscales</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(result.subscales).map(([key, value]) => (
              <div key={key} className="border border-gray-200 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">{key}</div>
                <div className="text-2xl font-bold text-gray-900">{value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Results Section */}
      {result.categoryResults && Object.keys(result.categoryResults).length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-gradient-to-br from-mh-green to-green-600 rounded-lg">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Category Results</h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {Object.entries(result.categoryResults).map(([categoryName, categoryData]) => {
              // Handle both Map structure (from Mongoose) and plain object
              const categoryInfo = categoryData && typeof categoryData === 'object' 
                ? categoryData 
                : { score: categoryData };
              
              // Calculate progress percentage if maxScore is available, otherwise use answered/total ratio
              const progressPercentage = categoryInfo.maxScore 
                ? Math.min((categoryInfo.score / categoryInfo.maxScore) * 100, 100)
                : categoryInfo.totalItems 
                  ? ((categoryInfo.answeredCount || 0) / categoryInfo.totalItems) * 100
                  : 0;
              
              return (
                <div 
                  key={categoryName} 
                  className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-lg p-4 hover:border-mh-green hover:shadow-md transition-all duration-200"
                >
                  {/* Header with Category Name and Band Badge */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`p-1 rounded ${getBandColorClass(categoryInfo.band)} bg-opacity-20`}>
                        <svg className={`w-4 h-4 ${getBandColorClass(categoryInfo.band).includes('green') ? 'text-green-600' : getBandColorClass(categoryInfo.band).includes('red') ? 'text-red-600' : getBandColorClass(categoryInfo.band).includes('orange') ? 'text-orange-600' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="text-base font-semibold text-gray-900">{categoryName}</h3>
                    </div>
                    {categoryInfo.band && (
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${getBandColorClass(categoryInfo.band)}`}>
                        {categoryInfo.band}
                      </span>
                    )}
                  </div>
                  
                  {/* Compact Score and Stats Row */}
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-xs text-gray-500">Score</span>
                        <span className="text-2xl font-bold text-gray-900">{categoryInfo.score || 0}</span>
                        {categoryInfo.maxScore && (
                          <span className="text-xs text-gray-400">/ {categoryInfo.maxScore}</span>
                        )}
                      </div>
                      {categoryInfo.maxScore && (
                        <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              getBandColorClass(categoryInfo.band).includes('green') 
                                ? 'bg-gradient-to-r from-green-400 to-green-600' 
                                : getBandColorClass(categoryInfo.band).includes('red') 
                                  ? 'bg-gradient-to-r from-red-400 to-red-600' 
                                  : getBandColorClass(categoryInfo.band).includes('orange') 
                                    ? 'bg-gradient-to-r from-orange-400 to-orange-600' 
                                    : 'bg-gradient-to-r from-gray-400 to-gray-600'
                            }`}
                            style={{ width: `${progressPercentage}%` }}
                          ></div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-3 text-center">
                      <div className="min-w-[60px]">
                        <div className="text-xs text-gray-500 mb-0.5">Questions</div>
                        <div className="text-sm font-semibold text-gray-900">
                          {categoryInfo.answeredCount || 0}<span className="text-xs text-gray-400">/{categoryInfo.totalItems || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Band Description */}
                  {categoryInfo.bandDescription && (
                    <div className={`mt-3 p-3 rounded border-l-2 ${
                      getBandColorClass(categoryInfo.band).includes('green') 
                        ? 'bg-green-50 border-green-400' 
                        : getBandColorClass(categoryInfo.band).includes('red') 
                          ? 'bg-red-50 border-red-400' 
                          : getBandColorClass(categoryInfo.band).includes('orange') 
                            ? 'bg-orange-50 border-orange-400' 
                            : 'bg-blue-50 border-blue-400'
                    }`}>
                      <p className={`text-xs leading-relaxed ${
                        getBandColorClass(categoryInfo.band).includes('green') 
                          ? 'text-green-800' 
                          : getBandColorClass(categoryInfo.band).includes('red') 
                            ? 'text-red-800' 
                            : getBandColorClass(categoryInfo.band).includes('orange') 
                              ? 'text-orange-800' 
                              : 'text-blue-800'
                      }`}>
                        {categoryInfo.bandDescription}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Progress Bar */}
      {result.interpretation && result.interpretation.answeredCount !== undefined && result.interpretation.totalItems !== undefined && (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Progress (100%)</span>
            <span className="text-sm text-gray-500">{result.interpretation.answeredCount}/{result.interpretation.totalItems} Questions</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-mh-gradient h-2 rounded-full" style={{ width: '100%' }}></div>
          </div>
        </div>
      )}

      {/* Questions with Results */}
      <div className="space-y-8">
        {questions.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center">
            <p className="text-gray-600">No questions available for this result.</p>
          </div>
        ) : (
          questions.map((question, index) => (
            <QuestionResultRenderer
              key={getQuestionId(question, index)}
              question={question}
              index={index}
              answers={answers}
            />
          ))
        )}
      </div>

      {/* Bottom Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-center mt-8 gap-4">
        <div className="flex items-center gap-3">
          <span className="text-gray-700 font-medium">Result:</span>
          {result.band && (
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${getBandColorClass(result.band)}`}>
              {result.band}
            </span>
          )}
          {!result.band && (
            <span className="px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
              Score: {result.score}
            </span>
          )}
        </div>
        
        <button
          onClick={handleDownloadReport}
          disabled={downloading}
          className="bg-mh-gradient hover:bg-green-700 text-white px-6 sm:px-8 py-2 rounded-full font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {downloading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Downloading...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Report
            </>
          )}
        </button>
      </div> 
    </div>
  );
}

export default AssessmentTestResultPage;