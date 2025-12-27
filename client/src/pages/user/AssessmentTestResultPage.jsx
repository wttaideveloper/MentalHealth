import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Breadcrumb from '../../components/Breadcrumb';

function AssessmentTestResultPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-40 py-6">
      {/* Header */}
      <Breadcrumb isLoggedIn={true} customLabel="Strengths and Difficulties Questionnaire" />

      {/* Result Header */}
      <div className="bg-mh-gradient rounded-xl p-16 mb-6 text-white">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold mb-2">Your Assessment Result</h1>
            <div className="bg-[#C1EBDB] font-bold mt-6 bg-opacity-50 rounded-full px-4 py-1 text-sm inline-block">
              Low Stress
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold">Strengths and Difficulties Questionnaire</div>
            <div className="text-green-100 text-sm mt-6">Completed on 15 Dec 2025</div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Progress (100%)</span>
          <span className="text-sm text-gray-500">25/25 Questions</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-mh-gradient h-2 rounded-full" style={{ width: '100%' }}></div>
        </div>
      </div>

      {/* Questions with Results */}
      <div className="space-y-8">
        {/* Question 01 */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            01. Helpful if someone is hurt, upset or feeling ill
          </h3>
          <div className="flex gap-4">
            <label className="flex items-center cursor-pointer p-3 rounded-lg bg-mh-light">
              <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center"></div>
              <span className="ml-3 text-gray-700">Not True</span>
            </label>
            <label className="flex items-center cursor-pointer p-3 rounded-lg bg-mh-green">
              <div className="w-6 h-6 rounded-full border-2 border-mh-green bg-mh-green flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="ml-3 text-white">Somewhat True</span>
            </label>
            <label className="flex items-center cursor-pointer p-3 rounded-lg bg-mh-light">
              <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center"></div>
              <span className="ml-3 text-gray-700">Certainly True</span>
            </label>
          </div>
        </div>

        {/* Question 02 with sub-questions */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            02. Overall, do you think that your child has difficulties in one or more of the following areas: emotions, concentration, behaviour or being able to get on with other people?
          </h3>
          <div className="flex gap-4 mb-6">
            <label className="flex items-center cursor-pointer p-3 rounded-lg bg-mh-light">
              <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center"></div>
              <span className="ml-3 text-gray-700">No</span>
            </label>
            <label className="flex items-center cursor-pointer p-3 rounded-lg bg-mh-light">
              <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center"></div>
              <span className="ml-3 text-gray-700">Yes-minor difficulties</span>
            </label>
            <label className="flex items-center cursor-pointer p-3 rounded-lg bg-mh-green">
              <div className="w-6 h-6 rounded-full border-2 border-mh-green bg-mh-green flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="ml-3 text-white">Yes-definite difficulties</span>
            </label>
            <label className="flex items-center cursor-pointer p-3 rounded-lg bg-mh-light">
              <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center"></div>
              <span className="ml-3 text-gray-700">Yes-severe difficulties</span>
            </label>
          </div>

          {/* Sub-questions in gray background */}
          <div className="bg-gray-100 rounded-lg p-6">
            <h4 className="text-base font-medium text-gray-900 mb-4 flex items-center">
              <svg className="w-4 h-4 mr-2 text-mh-green" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" />
              </svg>
              How long have these difficulties been present?
            </h4>
            <div className="flex gap-4 mb-6">
              <label className="flex items-center cursor-pointer p-3 rounded-lg bg-mh-green">
                <div className="w-6 h-6 rounded-full border-2 border-mh-green bg-mh-green flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="ml-3 text-white">Less than a month</span>
              </label>
              <label className="flex items-center cursor-pointer p-3 rounded-lg bg-mh-light">
                <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center"></div>
                <span className="ml-3 text-gray-700">1-5 months</span>
              </label>
              <label className="flex items-center cursor-pointer p-3 rounded-lg bg-mh-light">
                <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center"></div>
                <span className="ml-3 text-gray-700">6-12 months</span>
              </label>
              <label className="flex items-center cursor-pointer p-3 rounded-lg bg-mh-light">
                <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center"></div>
                <span className="ml-3 text-gray-700">Over a year</span>
              </label>
            </div>

            <h4 className="text-base font-medium text-gray-900 mb-4 flex items-center">
              <svg className="w-4 h-4 mr-2 text-mh-green" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" />
              </svg>
              Do the difficulties upset or distress your child?
            </h4>
            <div className="flex gap-4 mb-6">
              <label className="flex items-center cursor-pointer p-3 rounded-lg bg-mh-light">
                <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center"></div>
                <span className="ml-3 text-gray-700">Not at all</span>
              </label>
              <label className="flex items-center cursor-pointer p-3 rounded-lg bg-mh-green">
                <div className="w-6 h-6 rounded-full border-2 border-mh-green bg-mh-green flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="ml-3 text-white">Only a little</span>
              </label>
              <label className="flex items-center cursor-pointer p-3 rounded-lg bg-mh-light">
                <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center"></div>
                <span className="ml-3 text-gray-700">Quite a lot</span>
              </label>
              <label className="flex items-center cursor-pointer p-3 rounded-lg bg-mh-light">
                <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center"></div>
                <span className="ml-3 text-gray-700">A great deal</span>
              </label>
            </div>

            <h4 className="text-base font-medium text-gray-900 mb-4 flex items-center">
              <svg className="w-4 h-4 mr-2 text-mh-green" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" />
              </svg>
              Do the difficulties interfere with your child's everyday life in the following areas?
            </h4>
            
            <div className="space-y-3">
              {[
                { area: 'Home Life', selected: 'only-little' },
                { area: 'Friendships', selected: 'only-little' },
                { area: 'Classroom Learning', selected: 'only-little' },
                { area: 'Leisure Activities', selected: 'only-little' }
              ].map((item, index) => (
                <div key={index} className="flex items-center">
                  <span className="text-gray-700 w-40">{item.area}</span>
                  <div className="flex gap-4">
                    <label className={`flex items-center cursor-pointer p-3 rounded-lg ${item.selected === 'not-at-all' ? 'bg-mh-green' : 'bg-mh-light'}`}>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${item.selected === 'not-at-all' ? 'border-mh-green bg-mh-green' : 'border-gray-300'}`}>
                        {item.selected === 'not-at-all' && (
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <span className={`ml-3 ${item.selected === 'not-at-all' ? 'text-white' : 'text-gray-700'}`}>Not at all</span>
                    </label>
                    <label className={`flex items-center cursor-pointer p-3 rounded-lg ${item.selected === 'only-little' ? 'bg-mh-green' : 'bg-mh-light'}`}>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${item.selected === 'only-little' ? 'border-mh-green bg-mh-green' : 'border-gray-300'}`}>
                        {item.selected === 'only-little' && (
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <span className={`ml-3 ${item.selected === 'only-little' ? 'text-white' : 'text-gray-700'}`}>Only a little</span>
                    </label>
                    <label className={`flex items-center cursor-pointer p-3 rounded-lg ${item.selected === 'quite-lot' ? 'bg-mh-green' : 'bg-mh-light'}`}>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${item.selected === 'quite-lot' ? 'border-mh-green bg-mh-green' : 'border-gray-300'}`}>
                        {item.selected === 'quite-lot' && (
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <span className={`ml-3 ${item.selected === 'quite-lot' ? 'text-white' : 'text-gray-700'}`}>Quite a lot</span>
                    </label>
                    <label className={`flex items-center cursor-pointer p-3 rounded-lg ${item.selected === 'great-deal' ? 'bg-mh-green' : 'bg-mh-light'}`}>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${item.selected === 'great-deal' ? 'border-mh-green bg-mh-green' : 'border-gray-300'}`}>
                        {item.selected === 'great-deal' && (
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <span className={`ml-3 ${item.selected === 'great-deal' ? 'text-white' : 'text-gray-700'}`}>A great deal</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>

            <h4 className="text-base font-medium text-gray-900 mb-4 mt-6 flex items-center">
              <svg className="w-4 h-4 mr-2 text-mh-green" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" />
              </svg>
              Do the difficulties put a burden on you or the family as a whole?
            </h4>
            <div className="flex gap-4">
              <label className="flex items-center cursor-pointer p-3 rounded-lg bg-mh-light">
                <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center"></div>
                <span className="ml-3 text-gray-700">Not at all</span>
              </label>
              <label className="flex items-center cursor-pointer p-3 rounded-lg bg-mh-green">
                <div className="w-6 h-6 rounded-full border-2 border-mh-green bg-mh-green flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="ml-3 text-white">Only a little</span>
              </label>
              <label className="flex items-center cursor-pointer p-3 rounded-lg bg-mh-light">
                <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center"></div>
                <span className="ml-3 text-gray-700">Quite a lot</span>
              </label>
              <label className="flex items-center cursor-pointer p-3 rounded-lg bg-mh-light">
                <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center"></div>
                <span className="ml-3 text-gray-700">A great deal</span>
              </label>
            </div>
          </div>
        </div>

        {/* Additional Questions */}
        {[
          { num: '03', text: 'Helpful if someone is hurt, upset or feeling ill', selected: 'somewhat-true' },
          { num: '04', text: 'Helpful if someone is hurt, upset or feeling ill', selected: 'not-true' },
          { num: '05', text: 'Helpful if someone is hurt, upset or feeling ill', selected: 'somewhat-true' }
        ].map((question) => (
          <div key={question.num} className="bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {question.num}. {question.text}
            </h3>
            <div className="flex gap-4">
              <label className={`flex items-center cursor-pointer p-3 rounded-lg ${question.selected === 'not-true' ? 'bg-mh-green' : 'bg-mh-light'}`}>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${question.selected === 'not-true' ? 'border-mh-green bg-mh-green' : 'border-gray-300'}`}>
                  {question.selected === 'not-true' && (
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <span className={`ml-3 ${question.selected === 'not-true' ? 'text-white' : 'text-gray-700'}`}>Not True</span>
              </label>
              <label className={`flex items-center cursor-pointer p-3 rounded-lg ${question.selected === 'somewhat-true' ? 'bg-mh-green' : 'bg-mh-light'}`}>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${question.selected === 'somewhat-true' ? 'border-mh-green bg-mh-green' : 'border-gray-300'}`}>
                  {question.selected === 'somewhat-true' && (
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <span className={`ml-3 ${question.selected === 'somewhat-true' ? 'text-white' : 'text-gray-700'}`}>Somewhat True</span>
              </label>
              <label className={`flex items-center cursor-pointer p-3 rounded-lg ${question.selected === 'certainly-true' ? 'bg-mh-green' : 'bg-mh-light'}`}>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${question.selected === 'certainly-true' ? 'border-mh-green bg-mh-green' : 'border-gray-300'}`}>
                  {question.selected === 'certainly-true' && (
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <span className={`ml-3 ${question.selected === 'certainly-true' ? 'text-white' : 'text-gray-700'}`}>Certainly True</span>
              </label>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center mt-8">
        {/* Previous Page */}
        <button
          onClick={() => navigate("/my-assessments")}
          className="flex items-center gap-3 text-gray-700 hover:text-green-600 transition"
        >
          <span className="flex items-center justify-center w-7 h-7 rounded-full border border-green-500 text-green-500">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </span>
          <span className="text-sm font-medium">Previous Page</span>
        </button>

        {/* Next Page */}
        <button
          className="flex items-center gap-3 text-gray-700 hover:text-green-600 transition"
        >
          <span className="text-sm font-medium">Next Page</span>
          <span className="flex items-center justify-center w-7 h-7 rounded-full border border-green-500 text-green-500">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </button>
      </div>

      {/* Bottom Actions */}
      <div className="flex justify-between items-center mt-8">
        <button className=" px-4 py-2  font-bold transition-colors">
          Result <span className="mx-1"></span>
          <span className="text-mh-green bg-[#C1EBDB] px-2 py-2 rounded-md">Low Stress</span>
        </button>
        
        <button className="bg-mh-gradient hover:bg-green-700 text-white px-8 py-2 rounded-full font-medium transition-colors">
          Download Report
        </button>
      </div> 
    </div>
  );
}

export default AssessmentTestResultPage;