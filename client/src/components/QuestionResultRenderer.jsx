import { 
  getQuestionType, 
  getQuestionOptions, 
  getSubQuestions,
  getQuestionText,
  getQuestionId
} from '../utils/questionParser';

/**
 * Render a single question option (read-only, showing selected answer)
 */
function RadioOption({ option, questionId, checked }) {
  return (
    <label className={`flex items-center p-3 rounded-lg transition-colors ${
      checked ? 'bg-mh-green' : 'bg-mh-light'
    }`}>
      <div className="relative">
        <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center ${
          checked ? 'bg-mh-green border-mh-green' : 'border-gray-300'
        }`}>
          {checked && (
            <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
        </div>
      </div>
      <span className={`ml-2 sm:ml-3 text-sm sm:text-base ${checked ? 'text-white' : 'text-gray-700'}`}>
        {option.label}
      </span>
    </label>
  );
}

/**
 * Render sub-questions (read-only)
 */
function SubQuestionResultRenderer({ subQuestion, index, questionId, answers }) {
  const subQId = getQuestionId(subQuestion, index);
  const subQOptions = getQuestionOptions(subQuestion);
  const subQText = getQuestionText(subQuestion);
  const answer = answers[subQId] || '';

  return (
    <div className="mb-6">
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
        {subQText}
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:gap-4 gap-3">
        {subQOptions.map((option) => (
          <RadioOption
            key={option.value}
            option={option}
            questionId={subQId}
            checked={String(answer) === String(option.value)}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Render checkbox option (read-only, showing selected answers)
 */
function CheckboxOption({ option, questionId, checked }) {
  return (
    <label className={`flex items-center p-3 rounded-lg transition-colors border-2 ${
      checked ? 'bg-mh-green border-mh-green' : 'bg-mh-light border-gray-200'
    }`}>
      <div className="relative">
        <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded border-2 flex items-center justify-center ${
          checked ? 'bg-mh-green border-mh-green' : 'border-gray-300 bg-white'
        }`}>
          {checked && (
            <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
        </div>
      </div>
      <span className={`ml-2 sm:ml-3 text-sm sm:text-base ${checked ? 'text-white' : 'text-gray-700'}`}>
        {option.label}
      </span>
    </label>
  );
}

/**
 * Main Question Result Renderer Component (Read-only)
 */
function QuestionResultRenderer({ question, index, answers }) {
  const questionId = getQuestionId(question, index);
  const questionText = getQuestionText(question);
  const questionType = getQuestionType(question);
  const options = getQuestionOptions(question);
  const subQuestions = getSubQuestions(question);
  const answer = answers[questionId] || '';

  // Debug logging (remove in production if needed)
  if (process.env.NODE_ENV === 'development') {
    if (!question.type && !question.options) {
      console.warn('Question without type or options:', { questionId, questionText, question });
    }
  }

  // Render boolean (yes/no) question
  if (questionType === 'boolean') {
    const isYes = answer === true || answer === 'true' || String(answer).toLowerCase() === 'yes';
    const isNo = answer === false || answer === 'false' || String(answer).toLowerCase() === 'no';
    
    return (
      <div className="bg-white rounded-lg p-4 sm:p-6 border border-gray-200">
        <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">
          {index + 1}. {questionText}
        </h3>
        <div className="flex gap-4">
          <div className={`flex-1 px-6 py-4 rounded-lg font-medium ${
            isYes
              ? 'bg-mh-green text-white shadow-md'
              : 'bg-mh-light text-gray-700'
          }`}>
            Yes {isYes && '✓'}
          </div>
          <div className={`flex-1 px-6 py-4 rounded-lg font-medium ${
            isNo
              ? 'bg-red-500 text-white shadow-md'
              : 'bg-mh-light text-gray-700'
          }`}>
            No {isNo && '✓'}
          </div>
        </div>
      </div>
    );
  }

  // Render numeric question
  if (questionType === 'numeric') {
    return (
      <div className="bg-white rounded-lg p-4 sm:p-6 border border-gray-200">
        <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">
          {index + 1}. {questionText}
        </h3>
        <div className="max-w-md">
          <div className="px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-base font-medium">
            {answer !== null && answer !== undefined && answer !== '' ? answer : 'Not answered'}
          </div>
        </div>
      </div>
    );
  }

  // Render text (single-line) question
  if (questionType === 'text') {
    return (
      <div className="bg-white rounded-lg p-4 sm:p-6 border border-gray-200">
        <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">
          {index + 1}. {questionText}
        </h3>
        <div className="max-w-2xl">
          <div className="px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-base">
            {answer || 'Not answered'}
          </div>
        </div>
      </div>
    );
  }

  // Render textarea (multi-line) question
  if (questionType === 'textarea') {
    return (
      <div className="bg-white rounded-lg p-4 sm:p-6 border border-gray-200">
        <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">
          {index + 1}. {questionText}
        </h3>
        <div className="max-w-2xl">
          <div className="px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-base whitespace-pre-wrap min-h-[100px]">
            {answer || 'Not answered'}
          </div>
        </div>
      </div>
    );
  }

  // Render radio button question
  if (questionType === 'radio' && options.length > 0) {
    return (
      <div className="bg-white rounded-lg p-4 sm:p-6 border border-gray-200">
        <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">
          {index + 1}. {questionText}
        </h3>
        
        {/* Main question options */}
        <div className={`grid grid-cols-1 ${options.length > 3 ? 'sm:grid-cols-2 lg:flex lg:gap-4' : 'sm:flex sm:gap-4'} gap-3 mb-6`}>
          {options.map((option) => (
            <RadioOption
              key={option.value}
              option={option}
              questionId={questionId}
              checked={String(answer) === String(option.value)}
            />
          ))}
        </div>

        {/* Sub-questions */}
        {subQuestions.length > 0 && (
          <div className="bg-gray-100 rounded-lg p-4 sm:p-6">
            {subQuestions.map((subQ, subIndex) => (
              <SubQuestionResultRenderer
                key={subIndex}
                subQuestion={subQ}
                index={subIndex}
                questionId={questionId}
                answers={answers}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Render Likert scale question
  if (questionType === 'likert' && options.length > 0) {
    return (
      <div className="bg-white rounded-lg p-4 sm:p-6 border border-gray-200">
        <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">
          {index + 1}. {questionText}
        </h3>
        <div className={`grid grid-cols-1 ${options.length > 4 ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2 lg:flex lg:gap-4'} gap-3`}>
          {options.map((option) => (
            <RadioOption
              key={option.value}
              option={option}
              questionId={questionId}
              checked={String(answer) === String(option.value)}
            />
          ))}
        </div>
      </div>
    );
  }

  // Render checkbox (multi-choice) question
  if (questionType === 'checkbox' && options.length > 0) {
    const answerArray = Array.isArray(answer) ? answer : (answer ? [String(answer)] : []);
    
    return (
      <div className="bg-white rounded-lg p-4 sm:p-6 border border-gray-200">
        <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">
          {index + 1}. {questionText}
        </h3>
        <div className={`grid grid-cols-1 ${options.length > 3 ? 'sm:grid-cols-2 lg:flex lg:gap-4' : 'sm:flex sm:gap-4'} gap-3`}>
          {options.map((option) => (
            <CheckboxOption
              key={option.value}
              option={option}
              questionId={questionId}
              checked={answerArray.includes(String(option.value))}
            />
          ))}
        </div>
      </div>
    );
  }

  // Default: render as unsupported type placeholder
  return (
    <div className="bg-white rounded-lg p-4 sm:p-6 border border-gray-200">
      <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">
        {index + 1}. {questionText}
      </h3>
      <p className="text-gray-500 text-sm">Question type "{questionType}" not yet supported</p>
      {process.env.NODE_ENV === 'development' && (
        <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
          {JSON.stringify({ questionType, hasOptions: options.length > 0, answer }, null, 2)}
        </pre>
      )}
    </div>
  );
}

export default QuestionResultRenderer;

