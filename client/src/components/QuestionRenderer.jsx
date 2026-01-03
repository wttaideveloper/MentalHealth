import { 
  getQuestionType, 
  getQuestionOptions, 
  getSubQuestions,
  getQuestionText,
  getQuestionId
} from '../utils/questionParser';

/**
 * Render a single question option (radio button)
 */
function RadioOption({ option, questionId, checked, onChange }) {
  // Convert option.value to string for consistent comparison
  const optionValueStr = String(option.value);
  
  return (
    <label className={`flex items-center cursor-pointer p-3 rounded-lg transition-colors ${
      checked ? 'bg-mh-green' : 'bg-mh-light'
    }`}>
      <div className="relative">
        <input
          type="radio"
          name={questionId}
          value={optionValueStr}
          checked={checked}
          onChange={(e) => onChange(e.target.value)}
          className="sr-only"
        />
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
 * Render a checkbox option (for multi-choice questions)
 */
function CheckboxOption({ option, questionId, checked, onChange }) {
  const optionValueStr = String(option.value);
  
  return (
    <label className={`flex items-center cursor-pointer p-3 rounded-lg transition-colors border-2 ${
      checked ? 'bg-mh-green border-mh-green' : 'bg-mh-light border-gray-200'
    }`}>
      <div className="relative">
        <input
          type="checkbox"
          value={optionValueStr}
          checked={checked}
          onChange={(e) => {
            const currentValues = Array.isArray(checked) ? checked : [];
            if (e.target.checked) {
              onChange([...currentValues, optionValueStr]);
            } else {
              onChange(currentValues.filter(v => v !== optionValueStr));
            }
          }}
          className="sr-only"
        />
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
 * Render sub-questions
 */
function SubQuestionRenderer({ subQuestion, index, questionId, answers, onAnswerChange }) {
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
            onChange={(value) => onAnswerChange(subQId, value)}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Render Likert Scale Question
 */
function LikertQuestion({ question, questionId, questionText, index, answer, onAnswerChange, options }) {
  return (
    <div className="bg-white rounded-lg p-4 sm:p-6 border border-gray-200">
      <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">
        {index + 1}. {questionText}
      </h3>
      
      <div className="mb-2">
        <p className="text-sm text-gray-600 mb-4">Select the option that best describes your response:</p>
      </div>
      
      <div className={`grid grid-cols-1 ${options.length > 4 ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2 lg:flex lg:gap-4'} gap-3`}>
        {options.map((option) => (
          <RadioOption
            key={option.value}
            option={option}
            questionId={questionId}
            checked={String(answer) === String(option.value)}
            onChange={(value) => onAnswerChange(questionId, value)}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Render Checkbox (Multi-choice) Question
 */
function CheckboxQuestion({ question, questionId, questionText, index, answer, onAnswerChange, options }) {
  const answerArray = Array.isArray(answer) ? answer : (answer ? [String(answer)] : []);
  
  return (
    <div className="bg-white rounded-lg p-4 sm:p-6 border border-gray-200">
      <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">
        {index + 1}. {questionText}
      </h3>
      
      <div className="mb-2">
        <p className="text-sm text-gray-600 mb-4">Select all that apply:</p>
      </div>
      
      <div className={`grid grid-cols-1 ${options.length > 3 ? 'sm:grid-cols-2 lg:flex lg:gap-4' : 'sm:flex sm:gap-4'} gap-3`}>
        {options.map((option) => (
          <CheckboxOption
            key={option.value}
            option={option}
            questionId={questionId}
            checked={answerArray.includes(String(option.value))}
            onChange={(values) => onAnswerChange(questionId, values)}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Render Boolean (Yes/No) Question
 */
function BooleanQuestion({ question, questionId, questionText, index, answer, onAnswerChange }) {
  const isYes = answer === true || answer === 'true' || String(answer).toLowerCase() === 'yes';
  const isNo = answer === false || answer === 'false' || String(answer).toLowerCase() === 'no';
  
  return (
    <div className="bg-white rounded-lg p-4 sm:p-6 border border-gray-200">
      <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">
        {index + 1}. {questionText}
      </h3>
      
      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => onAnswerChange(questionId, true)}
          className={`flex-1 px-6 py-4 rounded-lg font-medium transition-colors ${
            isYes
              ? 'bg-mh-green text-white shadow-md'
              : 'bg-mh-light text-gray-700 hover:bg-gray-200'
          }`}
        >
          Yes
        </button>
        <button
          type="button"
          onClick={() => onAnswerChange(questionId, false)}
          className={`flex-1 px-6 py-4 rounded-lg font-medium transition-colors ${
            isNo
              ? 'bg-red-500 text-white shadow-md'
              : 'bg-mh-light text-gray-700 hover:bg-gray-200'
          }`}
        >
          No
        </button>
      </div>
    </div>
  );
}

/**
 * Render Numeric Question
 */
function NumericQuestion({ question, questionId, questionText, index, answer, onAnswerChange }) {
  const min = question.min !== undefined ? question.min : undefined;
  const max = question.max !== undefined ? question.max : undefined;
  const step = question.step !== undefined ? question.step : 1;
  
  return (
    <div className="bg-white rounded-lg p-4 sm:p-6 border border-gray-200">
      <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">
        {index + 1}. {questionText}
      </h3>
      
      <div className="max-w-md">
        <input
          type="number"
          value={answer || ''}
          onChange={(e) => {
            const value = e.target.value === '' ? '' : Number(e.target.value);
            onAnswerChange(questionId, value);
          }}
          min={min}
          max={max}
          step={step}
          placeholder="Enter a number"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mh-green focus:border-transparent text-base"
        />
        {(min !== undefined || max !== undefined) && (
          <p className="text-xs text-gray-500 mt-2">
            {min !== undefined && max !== undefined
              ? `Range: ${min} - ${max}`
              : min !== undefined
              ? `Minimum: ${min}`
              : `Maximum: ${max}`}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Render Text (Single-line) Question
 */
function TextQuestion({ question, questionId, questionText, index, answer, onAnswerChange }) {
  const maxLength = question.maxLength !== undefined ? question.maxLength : undefined;
  
  return (
    <div className="bg-white rounded-lg p-4 sm:p-6 border border-gray-200">
      <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">
        {index + 1}. {questionText}
      </h3>
      
      <div className="max-w-2xl">
        <input
          type="text"
          value={answer || ''}
          onChange={(e) => onAnswerChange(questionId, e.target.value)}
          maxLength={maxLength}
          placeholder="Type your answer here"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mh-green focus:border-transparent text-base"
        />
        {maxLength && (
          <p className="text-xs text-gray-500 mt-2">
            {String(answer || '').length}/{maxLength} characters
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Render Textarea (Multi-line) Question
 */
function TextareaQuestion({ question, questionId, questionText, index, answer, onAnswerChange }) {
  const rows = question.rows !== undefined ? question.rows : 4;
  const maxLength = question.maxLength !== undefined ? question.maxLength : undefined;
  
  return (
    <div className="bg-white rounded-lg p-4 sm:p-6 border border-gray-200">
      <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">
        {index + 1}. {questionText}
      </h3>
      
      <div className="max-w-2xl">
        <textarea
          value={answer || ''}
          onChange={(e) => onAnswerChange(questionId, e.target.value)}
          rows={rows}
          maxLength={maxLength}
          placeholder="Type your answer here"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mh-green focus:border-transparent text-base resize-y"
        />
        {maxLength && (
          <p className="text-xs text-gray-500 mt-2">
            {String(answer || '').length}/{maxLength} characters
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Main Question Renderer Component
 */
function QuestionRenderer({ question, index, answers, onAnswerChange }) {
  const questionId = getQuestionId(question, index);
  const questionText = getQuestionText(question);
  const questionType = getQuestionType(question);
  const options = getQuestionOptions(question);
  const subQuestions = getSubQuestions(question);
  const answer = answers[questionId] || '';

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
              onChange={(value) => onAnswerChange(questionId, value)}
            />
          ))}
        </div>

        {/* Sub-questions */}
        {subQuestions.length > 0 && (
          <div className="bg-gray-100 rounded-lg p-4 sm:p-6">
            {subQuestions.map((subQ, subIndex) => (
              <SubQuestionRenderer
                key={subIndex}
                subQuestion={subQ}
                index={subIndex}
                questionId={questionId}
                answers={answers}
                onAnswerChange={onAnswerChange}
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
      <LikertQuestion
        question={question}
        questionId={questionId}
        questionText={questionText}
        index={index}
        answer={answer}
        onAnswerChange={onAnswerChange}
        options={options}
      />
    );
  }

  // Render checkbox (multi-choice) question
  if (questionType === 'checkbox' && options.length > 0) {
    return (
      <CheckboxQuestion
        question={question}
        questionId={questionId}
        questionText={questionText}
        index={index}
        answer={answer}
        onAnswerChange={onAnswerChange}
        options={options}
      />
    );
  }

  // Render boolean (yes/no) question
  if (questionType === 'boolean') {
    return (
      <BooleanQuestion
        question={question}
        questionId={questionId}
        questionText={questionText}
        index={index}
        answer={answer}
        onAnswerChange={onAnswerChange}
      />
    );
  }

  // Render numeric question
  if (questionType === 'numeric') {
    return (
      <NumericQuestion
        question={question}
        questionId={questionId}
        questionText={questionText}
        index={index}
        answer={answer}
        onAnswerChange={onAnswerChange}
      />
    );
  }

  // Render text (single-line) question
  if (questionType === 'text') {
    return (
      <TextQuestion
        question={question}
        questionId={questionId}
        questionText={questionText}
        index={index}
        answer={answer}
        onAnswerChange={onAnswerChange}
      />
    );
  }

  // Render textarea (multi-line) question
  if (questionType === 'textarea') {
    return (
      <TextareaQuestion
        question={question}
        questionId={questionId}
        questionText={questionText}
        index={index}
        answer={answer}
        onAnswerChange={onAnswerChange}
      />
    );
  }

  // Default: render as unsupported type placeholder
  return (
    <div className="bg-white rounded-lg p-4 sm:p-6 border border-gray-200">
      <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">
        {index + 1}. {questionText}
      </h3>
      <p className="text-gray-500 text-sm">Question type "{questionType}" not yet supported</p>
    </div>
  );
}

export default QuestionRenderer;

