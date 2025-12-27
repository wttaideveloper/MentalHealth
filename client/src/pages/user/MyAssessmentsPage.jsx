import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import assHero from '../../assets/images/ass-hero.png';
import f1 from '../../assets/images/f1.png';
import f2 from '../../assets/images/f2.png';
import Breadcrumb from '../../components/Breadcrumb';

function MyAssessmentsPage() {
  const [activeTab, setActiveTab] = useState('ongoing');
  const navigate = useNavigate();

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
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">Hi, John David</h1>
            <p className="text-green-100 text-sm sm:text-base">You have 2 on going Assessments</p>
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

      {/* Assessment Cards */}
      <div className="space-y-4">
        {activeTab === 'ongoing' ? (
          <>
            {/* First Assessment Card */}
            <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-gray-100">
              <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                <div className="relative flex-shrink-0 self-center lg:self-start">
                  <img src={f2} alt="Assessment" className="w-full max-w-xs sm:w-48 lg:w-60 h-32 sm:h-36 lg:h-44 object-cover rounded-lg" />
                  <div className="absolute top-1.5 left-1.5 bg-[#E4F1EC] text-mh-green text-xs px-2 py-0.5 rounded-full">
                    In Progress
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 gap-2">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">Anxiety Assessment</h3>
                      <div className="flex items-center text-gray-500 text-sm mt-2">
                        <svg className="w-4 h-4 mr-1 text-mh-green" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                        15-30 minutes
                      </div>
                    </div>
                    <div className="text-left sm:text-right text-sm text-gray-500 flex-shrink-0">
                      Last updated: 15 Dec 2025
                    </div>
                  </div>
                  
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-28 mt-6 lg:mt-20">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium text-mh-dark">Progress <span className="text-mh-green">(52%)</span></span>
                        <div className="flex items-center text-sm text-gray-500">
                          <svg className="w-3.5 h-3.5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                          </svg>
                          15/26 Question
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-mh-gradient h-2.5 rounded-full" style={{ width: '52%' }}></div>
                      </div>
                    </div>
                    <button 
                      onClick={() => navigate('/assessment-test/1')}
                      className="bg-mh-gradient hover:bg-green-700 text-white px-5 py-2 rounded-full text-sm font-medium transition-colors flex-shrink-0 w-full sm:w-auto"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Second Assessment Card */}
            <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-gray-100">
              <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                <div className="relative flex-shrink-0 self-center lg:self-start">
                  <img src={f1} alt="Assessment" className="w-full max-w-xs sm:w-48 lg:w-60 h-32 sm:h-36 lg:h-44 object-cover rounded-lg" />
                  <div className="absolute top-1.5 left-1.5 bg-[#E8F1EE] text-mh-dark text-xs px-2 py-0.5 rounded-full">
                    Not Started yet
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Anxiety Assessment</h3>
                    <div className="flex items-center text-gray-500 text-sm mt-2">
                      <svg className="w-4 h-4 mr-1 text-mh-green" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      15-30 minutes
                    </div>
                  </div>
                  
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-28 mt-6 lg:mt-20">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium text-mh-dark">Progress <span className="text-mh-green">(0%)</span></span>
                        <div className="flex items-center text-sm text-gray-500">
                          <svg className="w-3.5 h-3.5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                          </svg>
                          0/26 Question
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-mh-gradient h-1.5 rounded-full" style={{ width: '1%' }}></div>
                      </div>
                    </div>
                    <button 
                      onClick={() => navigate('/assessment-test/1')}
                      className="bg-mh-gradient hover:bg-green-700 text-white px-5 py-2 rounded-full text-sm font-medium transition-colors flex-shrink-0 w-full sm:w-auto"
                    >
                      Start
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Assessment History Cards */}
            <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-gray-100">
              <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                <div className="relative flex-shrink-0 self-center lg:self-start">
                  <img src={f2} alt="Assessment" className="w-full max-w-xs sm:w-48 lg:w-60 h-32 sm:h-36 lg:h-44 object-cover rounded-lg opacity-50" />
                  <div className="absolute top-1.5 left-1.5 bg-mh-green text-white text-xs px-2 py-0.5 rounded-full">
                    Completed
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 gap-2">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">Anxiety Assessment</h3>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-gray-500 text-sm mt-2">
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-1 text-mh-green" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                          15-30 minutes
                        </div>
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                          </svg>
                          26 Question
                        </div>
                      </div>
                    </div>
                    <div className="text-left sm:text-right text-sm text-gray-500 flex-shrink-0">
                      Completed on 15 Dec 2025
                    </div>
                  </div>
                  
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mt-6 lg:mt-20">
                    <div>
                      <div className="text-sm font-medium text-mh-dark mb-1">Result</div>
                      <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium inline-block">
                        Low Stress
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button className="border border-mh-green text-mh-green hover:bg-green-50 px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Download Report
                      </button>
                      <button className="bg-mh-gradient hover:bg-green-700 text-white px-5 py-2 rounded-full text-sm font-medium transition-colors">
                        View
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-gray-100">
              <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                <div className="relative flex-shrink-0 self-center lg:self-start">
                  <img src={f1} alt="Assessment" className="w-full max-w-xs sm:w-48 lg:w-60 h-32 sm:h-36 lg:h-44 object-cover rounded-lg opacity-50" />
                  <div className="absolute top-1.5 left-1.5 bg-mh-green text-white text-xs px-2 py-0.5 rounded-full">
                    Completed
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 gap-2">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">Anxiety Assessment</h3>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-gray-500 text-sm mt-2">
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-1 text-mh-green" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                          15-30 minutes
                        </div>
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                          </svg>
                          26 Question
                        </div>
                      </div>
                    </div>
                    <div className="text-left sm:text-right text-sm text-gray-500 flex-shrink-0">
                      Completed on 15 Dec 2025
                    </div>
                  </div>
                  
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mt-6 lg:mt-20">
                    <div>
                      <div className="text-sm font-medium text-mh-dark mb-1">Result</div>
                      <div className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-medium inline-block">
                        Moderate Anxiety
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button className="border border-mh-green text-mh-green hover:bg-green-50 px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Download Report
                      </button>
                      <button className="bg-mh-gradient hover:bg-green-700 text-white px-5 py-2 rounded-full text-sm font-medium transition-colors">
                        View
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default MyAssessmentsPage;