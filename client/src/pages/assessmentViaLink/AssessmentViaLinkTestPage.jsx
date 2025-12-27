import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Breadcrumb from '../../components/Breadcrumb';

function AssessmentViaLinkTestPage() {
  const navigate = useNavigate();
  const [answers, setAnswers] = useState({
    q17: 'yes-definite' // Set default selected value
  });

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 sm:px-8 lg:px-20 xl:px-40 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-2">
        <Breadcrumb isLoggedIn={false} customLabel="Assessment Test" />
        <div className="text-xs sm:text-sm text-gray-500">
          Last updated: 15 Dec 2025
        </div>
      </div>

      {/* Title Section */}
      <div className="bg-[#D5DCEE] rounded-xl p-6 sm:p-8 lg:p-16 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 text-center mb-3">Strengths and Difficulties Questionnaire</h1>
        <p className="text-gray-600 text-sm sm:text-base text-center max-w-2xl mx-auto leading-relaxed">
          For each item, please mark the box for Not True, Somewhat True or Certainly True. It would help us if you
          answered all items as best you can even if you are not absolutely certain. Please give your answers on
          the basis of how things have been for you over the last six months.
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Progress: 64%</span>
          <span className="text-sm text-gray-500">16/25 Questions</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-mh-gradient h-2 rounded-full" style={{ width: '64%' }}></div>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-8">
        {/* Question 15 */}
        <div className="bg-white rounded-lg p-4 sm:p-6 border border-gray-200">
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">
            15. I am easily distracted, I find it hard to concentrate
          </h3>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            {[
              { value: 'not-true', label: 'Not True' },
              { value: 'somewhat-true', label: 'Somewhat True' },
              { value: 'certainly-true', label: 'Certainly True' }
            ].map((option) => (
              <label key={option.value} className={`flex items-center cursor-pointer p-3 rounded-lg transition-colors ${answers.q15 === option.value ? 'bg-mh-green' : 'bg-mh-light'
                }`}>
                <div className="relative">
                  <input
                    type="radio"
                    name="q15"
                    value={option.value}
                    checked={answers.q15 === option.value}
                    onChange={(e) => setAnswers(prev => ({ ...prev, q15: e.target.value }))}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center ${answers.q15 === option.value
                      ? 'bg-mh-green border-mh-green'
                      : 'border-gray-300'
                    }`}>
                    {answers.q15 === option.value && (
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className={`ml-2 sm:ml-3 text-sm sm:text-base ${answers.q15 === option.value ? 'text-white' : 'text-gray-700'
                  }`}>{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Question 17 with sub-questions */}
        <div className="bg-white rounded-lg p-4 sm:p-6 border border-gray-200">
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">
            17. Overall, do you think that your child has difficulties in one or more of the following areas: emotions, concentration, behaviour or being able to get on with other people?
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:gap-4 gap-3 mb-6">
            {[
              { value: 'no', label: 'No' },
              { value: 'yes-minor', label: 'Yes minor difficulties' },
              { value: 'yes-definite', label: 'Yes definite difficulties' },
              { value: 'yes-severe', label: 'Yes severe difficulties' }
            ].map((option) => (
              <label key={option.value} className={`flex items-center cursor-pointer p-3 rounded-lg transition-colors ${answers.q17 === option.value ? 'bg-mh-green' : 'bg-mh-light'
                }`}>
                <div className="relative">
                  <input
                    type="radio"
                    name="q17"
                    value={option.value}
                    checked={answers.q17 === option.value}
                    onChange={(e) => setAnswers(prev => ({ ...prev, q17: e.target.value }))}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center ${answers.q17 === option.value
                      ? 'bg-mh-green border-mh-green'
                      : 'border-gray-300'
                    }`}>
                    {answers.q17 === option.value && (
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className={`ml-2 sm:ml-3 text-sm sm:text-base ${answers.q17 === option.value ? 'text-white' : 'text-gray-700'
                  }`}>{option.label}</span>
              </label>
            ))}
          </div>

          {/* Sub-questions in gray background */}
          <div className="bg-gray-100 rounded-lg p-4 sm:p-6">
            <h4 className="text-sm sm:text-base font-medium text-gray-900 mb-4 flex items-center">
              <svg
                className="w-4 h-4 mr-2 text-mh-green flex-shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 3l2.5 6L21 12l-6.5 3L12 21l-2.5-6L3 12l6.5-3L12 3z" />
              </svg>
              How long have these difficulties been present?
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:gap-4 gap-3 mb-6">
              {[
                { value: 'less-month', label: 'Less than a month' },
                { value: '1-5-months', label: '1-5 months' },
                { value: '6-12-months', label: '6-12 months' },
                { value: 'over-year', label: 'Over a year' }
              ].map((option) => (
                <label key={option.value} className={`flex items-center cursor-pointer p-3 rounded-lg transition-colors ${answers.duration === option.value ? 'bg-mh-green' : 'bg-mh-light'
                  }`}>
                  <div className="relative">
                    <input
                      type="radio"
                      name="duration"
                      value={option.value}
                      checked={answers.duration === option.value}
                      onChange={(e) => setAnswers(prev => ({ ...prev, duration: e.target.value }))}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center ${answers.duration === option.value
                        ? 'bg-mh-green border-mh-green'
                        : 'border-gray-300'
                      }`}>
                      {answers.duration === option.value && (
                        <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className={`ml-2 sm:ml-3 text-sm sm:text-base ${answers.duration === option.value ? 'text-white' : 'text-gray-700'
                    }`}>{option.label}</span>
                </label>
              ))}
            </div>

            <h4 className="text-sm sm:text-base font-medium text-gray-900 mb-4 flex items-center">
              <svg
                className="w-4 h-4 mr-2 text-mh-green flex-shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 3l2.5 6L21 12l-6.5 3L12 21l-2.5-6L3 12l6.5-3L12 3z" />
              </svg>
              Do the difficulties upset or distress your child?
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:gap-4 gap-3 mb-6">
              {[
                { value: 'not-at-all', label: 'Not at all' },
                { value: 'only-little', label: 'Only a little' },
                { value: 'quite-lot', label: 'Quite a lot' },
                { value: 'great-deal', label: 'A great deal' }
              ].map((option) => (
                <label key={option.value} className={`flex items-center cursor-pointer p-3 rounded-lg transition-colors ${answers.distress === option.value ? 'bg-mh-green' : 'bg-mh-light'
                  }`}>
                  <div className="relative">
                    <input
                      type="radio"
                      name="distress"
                      value={option.value}
                      checked={answers.distress === option.value}
                      onChange={(e) => setAnswers(prev => ({ ...prev, distress: e.target.value }))}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center ${answers.distress === option.value
                        ? 'bg-mh-green border-mh-green'
                        : 'border-gray-300'
                      }`}>
                      {answers.distress === option.value && (
                        <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className={`ml-2 sm:ml-3 text-sm sm:text-base ${answers.distress === option.value ? 'text-white' : 'text-gray-700'
                    }`}>{option.label}</span>
                </label>
              ))}
            </div>

            <h4 className="text-sm sm:text-base font-medium text-gray-900 mb-4 flex items-center">
              <svg
                className="w-4 h-4 mr-2 text-mh-green flex-shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 3l2.5 6L21 12l-6.5 3L12 21l-2.5-6L3 12l6.5-3L12 3z" />
              </svg>
              Do the difficulties interfere with your child's everyday life in the following areas?
            </h4>

            <div className="space-y-4">
              {[
                'Home Life',
                'Friendships',
                'Classroom Learning',
                'Leisure Activities'
              ].map((area, index) => (
                <div key={index} className="">
                  <span className="text-gray-700 text-sm sm:text-base font-medium block mb-2">{area}</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:gap-3 gap-2">
                    {[
                      { value: 'not-at-all', label: 'Not at all' },
                      { value: 'only-little', label: 'Only a little' },
                      { value: 'quite-lot', label: 'Quite a lot' },
                      { value: 'great-deal', label: 'A great deal' }
                    ].map((option) => (
                      <label key={option.value} className={`flex items-center cursor-pointer p-2 sm:p-3 rounded-lg transition-colors ${answers[`area-${index}`] === option.value ? 'bg-mh-green' : 'bg-mh-light'
                        }`}>
                        <div className="relative">
                          <input
                            type="radio"
                            name={`area-${index}`}
                            value={option.value}
                            checked={answers[`area-${index}`] === option.value}
                            onChange={(e) => setAnswers(prev => ({ ...prev, [`area-${index}`]: e.target.value }))}
                            className="sr-only"
                          />
                          <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center ${answers[`area-${index}`] === option.value
                              ? 'bg-mh-green border-mh-green'
                              : 'border-gray-300'
                            }`}>
                            {answers[`area-${index}`] === option.value && (
                              <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                        </div>
                        <span className={`ml-2 sm:ml-3 text-sm sm:text-base ${answers[`area-${index}`] === option.value ? 'text-white' : 'text-gray-700'
                          }`}>{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <h4 className="text-sm sm:text-base font-medium text-gray-900 mb-4 mt-6 flex items-center">
              <svg
                className="w-4 h-4 mr-2 text-mh-green flex-shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 3l2.5 6L21 12l-6.5 3L12 21l-2.5-6L3 12l6.5-3L12 3z" />
              </svg>
              Do the difficulties put a burden on you or the family as a whole?
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:gap-4 gap-3">
              {[
                { value: 'not-at-all', label: 'Not at all' },
                { value: 'only-little', label: 'Only a little' },
                { value: 'quite-lot', label: 'Quite a lot' },
                { value: 'great-deal', label: 'A great deal' }
              ].map((option) => (
                <label key={option.value} className={`flex items-center cursor-pointer p-3 rounded-lg transition-colors ${answers.burden === option.value ? 'bg-mh-green' : 'bg-mh-light'
                  }`}>
                  <div className="relative">
                    <input
                      type="radio"
                      name="burden"
                      value={option.value}
                      checked={answers.burden === option.value}
                      onChange={(e) => setAnswers(prev => ({ ...prev, burden: e.target.value }))}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center ${answers.burden === option.value
                        ? 'bg-mh-green border-mh-green'
                        : 'border-gray-300'
                      }`}>
                      {answers.burden === option.value && (
                        <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className={`ml-2 sm:ml-3 text-sm sm:text-base ${answers.burden === option.value ? 'text-white' : 'text-gray-700'
                    }`}>{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Remaining Questions */}
        {[
          { num: 18, text: "Helpful if someone is hurt, upset or feeling ill" },
          { num: 19, text: "Helpful if someone is hurt, upset or feeling ill" },
          { num: 20, text: "Helpful if someone is hurt, upset or feeling ill" }
        ].map((question) => (
          <div key={question.num} className="bg-white rounded-lg p-4 sm:p-6 border border-gray-200">
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">
              {question.num}. {question.text}
            </h3>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              {[
                { value: 'not-true', label: 'Not True' },
                { value: 'somewhat-true', label: 'Somewhat True' },
                { value: 'certainly-true', label: 'Certainly True' }
              ].map((option) => (
                <label key={option.value} className={`flex items-center cursor-pointer p-3 rounded-lg transition-colors ${answers[`q${question.num}`] === option.value ? 'bg-mh-green' : 'bg-mh-light'
                  }`}>
                  <div className="relative">
                    <input
                      type="radio"
                      name={`q${question.num}`}
                      value={option.value}
                      checked={answers[`q${question.num}`] === option.value}
                      onChange={(e) => setAnswers(prev => ({ ...prev, [`q${question.num}`]: e.target.value }))}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center ${answers[`q${question.num}`] === option.value
                        ? 'bg-mh-green border-mh-green'
                        : 'border-gray-300'
                      }`}>
                      {answers[`q${question.num}`] === option.value && (
                        <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className={`ml-2 sm:ml-3 text-sm sm:text-base ${answers[`q${question.num}`] === option.value ? 'text-white' : 'text-gray-700'
                    }`}>{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-center mt-8 gap-4">
        {/* Previous Page */}
        <button
          onClick={() => navigate("/my-assessments")}
          className="flex items-center gap-2 sm:gap-3 text-gray-700 hover:text-green-600 transition order-2 sm:order-1"
        >
          <span className="flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full border border-green-500 text-green-500">
            <svg
              className="w-3 h-3 sm:w-4 sm:h-4"
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
          className="flex items-center gap-2 sm:gap-3 text-gray-700 hover:text-green-600 transition order-1 sm:order-2"
        >
          <span className="text-sm font-medium">Next Page</span>
          <span className="flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full border border-green-500 text-green-500">
            <svg
              className="w-3 h-3 sm:w-4 sm:h-4"
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
      <div className="flex flex-col sm:flex-row justify-between items-center mt-6 sm:mt-8 gap-4">
        <button className="text-mh-green hover:text-green-700 px-4 py-2 rounded-full border border-mh-green font-medium transition-colors w-full sm:w-auto text-sm sm:text-base">
          Save & Do it Later
        </button>

        <button className="bg-mh-gradient hover:bg-green-700 text-white px-6 sm:px-8 py-2 rounded-full font-medium transition-colors w-full sm:w-auto text-sm sm:text-base">
          Submit
        </button>
      </div>
    </div>
  );
}

export default AssessmentViaLinkTestPage;