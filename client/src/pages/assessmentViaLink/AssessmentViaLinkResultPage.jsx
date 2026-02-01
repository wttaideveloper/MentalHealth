import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import Breadcrumb from '../../components/Breadcrumb';

function AssessmentViaLinkResultPage() {
  const navigate = useNavigate();
  const { token, resultId } = useParams();
  
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (resultId && token) {
      // Get result from localStorage (stored when submitting)
      const storedResult = localStorage.getItem(`linkResult_${token}`);
      if (storedResult) {
        try {
          const parsedResult = JSON.parse(storedResult);
          setResult(parsedResult);
        } catch (err) {
          console.error('Error parsing stored result:', err);
          setError('Failed to load result data');
        }
      } else {
        setError('Result not found');
      }
      setLoading(false);
    } else {
      toast.error('Invalid result');
      setLoading(false);
    }
  }, [resultId, token]);

  const displayResult = result;

  // Get band color class
  const getBandColorClass = (band) => {
    if (!band) return 'bg-gray-100 text-gray-700';
    const bandLower = band.toLowerCase();
    if (bandLower.includes('low')) return 'bg-green-100 text-green-700';
    if (bandLower.includes('moderate') || bandLower.includes('medium')) return 'bg-orange-100 text-orange-700';
    if (bandLower.includes('high') || bandLower.includes('severe')) return 'bg-red-100 text-red-700';
    return 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-mh-green"></div>
          <p className="mt-4 text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }

  if (error || !displayResult) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Failed to load results'}</p>
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

  const interpretation = displayResult.interpretation || {};
  const riskFlags = displayResult.riskFlags || {};
  
  // Get categoryResults from result or interpretation (backend stores it in both places)
  const categoryResults = displayResult.categoryResults || interpretation.categoryResults || null;
  const subscales = displayResult.subscales || null;

  return (
    <div className="min-h-screen bg-gray-50 px-4 sm:px-8 lg:px-20 xl:px-40 py-6">
      {/* Header */}
      <div className="mb-6">
        <Breadcrumb isLoggedIn={false} customLabel="Assessment Results" />
      </div>

      {/* Success Message */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
        <h2 className="text-2xl font-bold text-green-800 mb-2">Assessment Completed!</h2>
        <p className="text-green-700">Thank you for completing the assessment. Your results are below.</p>
      </div>

      {/* Results Card */}
      <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8 mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Your Results</h3>
        
        {/* Score */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Score</span>
            <span className="text-2xl font-bold text-mh-green">{displayResult.score || 'N/A'}</span>
          </div>
        </div>

        {/* Band */}
        {displayResult.band && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Category</span>
              <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getBandColorClass(displayResult.band)}`}>
                {displayResult.band}
              </span>
            </div>
            {displayResult.bandDescription && (
              <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-800 text-sm leading-relaxed">{displayResult.bandDescription}</p>
              </div>
            )}
          </div>
        )}

        {/* Interpretation */}
        {interpretation.riskHelpText && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Interpretation</h4>
            <p className="text-gray-700 leading-relaxed">{interpretation.riskHelpText}</p>
          </div>
        )}

        {/* Risk Flags */}
        {Object.keys(riskFlags).length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-red-900 mb-2">Important Notice</h4>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm">
                Based on your responses, we recommend consulting with a mental health professional for further evaluation.
              </p>
            </div>
          </div>
        )}

        {/* Subscales Section */}
        {subscales && Object.keys(subscales).length > 0 && (
          <div className="mb-6">
            <h4 className="text-xl font-bold text-gray-900 mb-4">Subscales</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(subscales).map(([key, value]) => (
                <div key={key} className="border border-gray-200 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">{key}</div>
                  <div className="text-2xl font-bold text-gray-900">{value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Category Results Section */}
        {categoryResults && Object.keys(categoryResults).length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-gradient-to-br from-mh-green to-green-600 rounded-lg">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h4 className="text-xl font-bold text-gray-900">Category Results</h4>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {Object.entries(categoryResults).map(([categoryName, categoryData]) => {
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

        {/* Additional Info */}
        <div className="border-t border-gray-200 pt-6 mt-6">
          <p className="text-sm text-gray-600">
            This assessment is for informational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment.
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-mh-gradient text-white rounded-full font-medium hover:opacity-90 transition"
        >
          Return to Home
        </button>
      </div>
    </div>
  );
}

export default AssessmentViaLinkResultPage;

