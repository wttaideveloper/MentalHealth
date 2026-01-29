import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import Breadcrumb from '../../components/Breadcrumb';
import { getCombinedReport, downloadCombinedReport } from '../../api/groupAssessmentApi';

function CombinedReportPage() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (groupId) {
      fetchReport();
    }
  }, [groupId]);

  useEffect(() => {
    if (reportData && !loading) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [reportData, loading]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const response = await getCombinedReport(groupId);
      
      if (response.success && response.data) {
        setReportData(response.data);
      } else {
        toast.error('Failed to load report');
        navigate('/user/group-assessments');
      }
    } catch (err) {
      console.error('Error fetching report:', err);
      toast.error(err.response?.data?.message || 'Failed to load report');
      navigate('/user/group-assessments');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      await downloadCombinedReport(groupId);
      toast.success('Report downloaded successfully');
    } catch (err) {
      console.error('Error downloading report:', err);
      toast.error(err.response?.data?.message || 'Failed to download report');
    }
  };

  const getBandColorClass = (band) => {
    if (!band) return 'bg-gray-100 text-gray-800';
    const bandLower = band.toLowerCase();
    if (bandLower.includes('severe') || bandLower.includes('high')) {
      return 'bg-red-100 text-red-800';
    } else if (bandLower.includes('moderate') || bandLower.includes('medium')) {
      return 'bg-orange-100 text-orange-800';
    } else if (bandLower.includes('mild') || bandLower.includes('low')) {
      return 'bg-yellow-100 text-yellow-800';
    } else if (bandLower.includes('normal') || bandLower.includes('minimal')) {
      return 'bg-green-100 text-green-800';
    }
    return 'bg-blue-100 text-blue-800';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-40 py-6">
        <Breadcrumb isLoggedIn={true} customLabel="Combined Report" />
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading report...</div>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return null;
  }

  const { groupAssessment, results, users } = reportData;
  // Get all perspective names from groupAssessment
  const perspectiveNames = groupAssessment?.perspectives 
    ? groupAssessment.perspectives.map(p => p.perspectiveName || p)
    : Object.keys(results || {});
  const hasAllResults = perspectiveNames.every(name => results[name]);

  return (
    <div className="min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-40 py-6">
      <Breadcrumb isLoggedIn={true} customLabel="Combined Report" />
      
      {/* Header */}
      <div className="bg-mh-gradient rounded-xl p-8 sm:p-16 mb-6 text-white">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Combined Assessment Report</h1>
            <p className="text-green-100">{groupAssessment.groupName}</p>
            {groupAssessment.subjectId && (
              <p className="text-green-100 mt-2">
                Subject: {groupAssessment.subjectId.firstName} {groupAssessment.subjectId.lastName}
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleDownloadPDF}
              className="px-6 py-2 bg-white text-mh-green rounded-lg hover:bg-gray-100 transition-colors font-medium"
            >
              Download PDF
            </button>
          </div>
        </div>
      </div>

      {/* Overall Scores Comparison */}
      <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">Overall Scores Comparison</h2>
        
        <div className={`grid grid-cols-1 ${perspectiveNames.length === 2 ? 'md:grid-cols-2' : perspectiveNames.length >= 3 ? 'md:grid-cols-3' : 'md:grid-cols-1'} gap-4`}>
          {perspectiveNames.map((perspectiveName) => {
            const result = results[perspectiveName];
            const user = users[perspectiveName];
            if (!result) return null;
            
            return (
              <div key={perspectiveName} className="border border-gray-200 rounded-lg p-4">
                <div className="text-sm text-gray-500 mb-2">{perspectiveName}</div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{result.score}</div>
                {result.band && (
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getBandColorClass(result.band)}`}>
                    {result.band}
                  </span>
                )}
                {user && (
                  <div className="text-xs text-gray-500 mt-2">
                    {user.firstName} {user.lastName}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Category Results Comparison */}
      {hasAllResults && (() => {
        const allCategories = new Set();
        perspectiveNames.forEach(name => {
          if (results[name]?.categoryResults) {
            Object.keys(results[name].categoryResults).forEach(cat => allCategories.add(cat));
          }
        });

        if (allCategories.size === 0) return null;

        return (
          <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">Category Results Comparison</h2>
            
            <div className="space-y-4">
              {Array.from(allCategories).sort().map((categoryName) => {
                return (
                  <div key={categoryName} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">{categoryName}</h3>
                    
                    <div className={`grid grid-cols-1 ${perspectiveNames.length === 2 ? 'md:grid-cols-2' : perspectiveNames.length >= 3 ? 'md:grid-cols-3' : 'md:grid-cols-1'} gap-4`}>
                      {perspectiveNames.map((perspectiveName) => {
                        const cat = results[perspectiveName]?.categoryResults?.[categoryName];
                        if (!cat) return null;
                        
                        return (
                          <div key={perspectiveName}>
                            <div className="text-sm text-gray-500 mb-1">{perspectiveName}</div>
                            <div className="text-2xl font-bold text-gray-900 mb-1">{cat.score || 0}</div>
                            {cat.band && (
                              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getBandColorClass(cat.band)}`}>
                                {cat.band}
                              </span>
                            )}
                            {cat.bandDescription && (
                              <p className="text-xs text-gray-600 mt-2">{cat.bandDescription}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Individual Results Details */}
      <div className="space-y-6">
        {perspectiveNames.map((perspectiveName) => {
          const result = results[perspectiveName];
          if (!result) return null;
          
          return (
            <div key={perspectiveName} className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">{perspectiveName} Perspective</h2>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-500">Score:</span>
                  <span className="ml-2 text-lg font-semibold text-gray-900">{result.score}</span>
                </div>
                {result.band && (
                  <div>
                    <span className="text-sm text-gray-500">Severity Level:</span>
                    <span className={`ml-2 px-3 py-1 rounded-full text-sm font-medium ${getBandColorClass(result.band)}`}>
                      {result.band}
                    </span>
                  </div>
                )}
                {result.bandDescription && (
                  <div>
                    <span className="text-sm text-gray-500">Description:</span>
                    <p className="mt-1 text-gray-700">{result.bandDescription}</p>
                  </div>
                )}
                {result.createdAt && (
                  <div>
                    <span className="text-sm text-gray-500">Completed:</span>
                    <span className="ml-2 text-sm text-gray-700">{formatDate(result.createdAt)}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Back Button */}
      <div className="mt-8 flex justify-center">
        <button
          onClick={() => navigate('/user/group-assessments')}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Back to Group Assessments
        </button>
      </div>
    </div>
  );
}

export default CombinedReportPage;

