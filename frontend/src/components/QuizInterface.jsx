import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { progressService } from '../services/progressService';

const QuizInterface = ({ onGenerateQuiz, isGenerating = false, quizData = null, onCheckAnswer }) => {
  const { user } = useAuth();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [answerResults, setAnswerResults] = useState({});
  const [isCheckingAnswer, setIsCheckingAnswer] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);

  const handleGenerateQuiz = () => {
    setCurrentQuestion(0);
    setSelectedAnswers({});
    setAnswerResults({});
    setQuizCompleted(false);
    onGenerateQuiz();
  };

  const handleAnswerSelect = (questionIndex, answer) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionIndex]: answer
    }));
  };

  const handleCheckAnswer = async (questionIndex) => {
    if (!selectedAnswers[questionIndex]) return;
    
    setIsCheckingAnswer(true);
    try {
      const result = await onCheckAnswer(questionIndex, selectedAnswers[questionIndex], quizData);
      setAnswerResults(prev => ({
        ...prev,
        [questionIndex]: result
      }));
    } catch (error) {
      console.error('Error checking answer:', error);
      // Show error message to user
      alert(`Error checking answer: ${error.response?.data?.detail || error.message || 'Unknown error'}`);
    } finally {
      setIsCheckingAnswer(false);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestion < quizData.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Quiz completed - save results
      handleQuizComplete();
    }
  };

  const handleQuizComplete = async () => {
    if (quizCompleted) return; // Prevent multiple saves
    
    // Check if all questions are answered and checked
    const allQuestionsAnswered = Object.keys(selectedAnswers).length === quizData.questions.length;
    const allQuestionsChecked = Object.keys(answerResults).length === quizData.questions.length;
    
    if (!allQuestionsAnswered || !allQuestionsChecked) {
      return;
    }
    
    setQuizCompleted(true);
    
    // Calculate results
    const results = {
      total_questions: quizData.questions.length,
      correct_answers: Object.keys(answerResults).filter(key => answerResults[key].is_correct).length,
      results: Object.keys(answerResults).map(key => ({
        question_number: key,
        user_answer: selectedAnswers[key],
        correct_answer: answerResults[key].correct_answer,
        is_correct: answerResults[key].is_correct
      }))
    };

    // Save quiz results to Firebase
    try {
      if (!user || !user.uid) {
        console.warn('User not authenticated. Quiz results will not be saved.');
        alert('Please log in to save your quiz results.');
        return;
      }
      const savedId = await progressService.saveQuizResult(quizData, selectedAnswers, results, user.uid);
      console.log('Quiz results saved successfully to Firebase! Document ID:', savedId);
    } catch (error) {
      console.error('Error saving quiz results:', error);
      alert('Failed to save quiz results. Please try again.');
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const getQuestionStatus = (index) => {
    if (answerResults[index]) {
      return answerResults[index].is_correct ? '[OK]' : '[X]';
    }
    return selectedAnswers[index] ? '[...]' : '[ ]';
  };

  const allQuestionsAnswered = () => {
    return quizData && quizData.questions && 
           Object.keys(selectedAnswers).length === quizData.questions.length;
  };

  const allQuestionsChecked = () => {
    return quizData && quizData.questions && 
           Object.keys(answerResults).length === quizData.questions.length;
  };

  return (
    <div className="card">
      <h2>Quiz Generator</h2>
      
      {/* Generate Quiz Button */}
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={handleGenerateQuiz}
          disabled={isGenerating}
          className="upload-btn"
          style={{ width: '100%', padding: '12px' }}
        >
          {isGenerating ? (
            <>
              <span className="loading"></span>
              Generating Quiz...
            </>
          ) : (
            'Generate Quiz (5 Questions)'
          )}
        </button>
      </div>

      {/* Quiz Display */}
      {quizData && quizData.questions && (
        <div className="quiz-container">
          {/* Question Navigation */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            {quizData.questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestion(index)}
                style={{
                  padding: '8px 12px',
                  border: currentQuestion === index ? '2px solid #007bff' : '1px solid #ddd',
                  borderRadius: '6px',
                  background: currentQuestion === index ? '#f0f8ff' : 'white',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                {getQuestionStatus(index)} Q{index + 1}
              </button>
            ))}
          </div>

          {/* Current Question */}
          <div className="question-container">
            <h3 style={{ marginBottom: '16px', color: '#2c3e50' }}>
              Question {currentQuestion + 1} of {quizData.questions.length}
            </h3>
            
            <div style={{ 
              background: '#f8f9fa', 
              border: '1px solid #e9ecef', 
              borderRadius: '8px', 
              padding: '20px',
              marginBottom: '20px'
            }}>
              <p style={{ fontSize: '16px', lineHeight: '1.6', marginBottom: '16px' }}>
                {quizData.questions[currentQuestion].question}
              </p>
              
              {/* Answer Options */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {Object.entries(quizData.questions[currentQuestion].options).map(([option, text]) => (
                  <label
                    key={option}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '12px',
                      border: selectedAnswers[currentQuestion] === option ? '2px solid #007bff' : '1px solid #ddd',
                      borderRadius: '6px',
                      background: selectedAnswers[currentQuestion] === option ? '#f0f8ff' : 'white',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <input
                      type="radio"
                      name={`question-${currentQuestion}`}
                      value={option}
                      checked={selectedAnswers[currentQuestion] === option}
                      onChange={() => handleAnswerSelect(currentQuestion, option)}
                      style={{ marginRight: '12px' }}
                    />
                    <span style={{ fontWeight: 'bold', marginRight: '8px' }}>{option}.</span>
                    <span>{text}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Answer Result */}
            {answerResults[currentQuestion] && (
              <div style={{
                padding: '16px',
                borderRadius: '8px',
                marginBottom: '20px',
                background: answerResults[currentQuestion].is_correct ? '#d4edda' : '#f8d7da',
                border: `1px solid ${answerResults[currentQuestion].is_correct ? '#c3e6cb' : '#f5c6cb'}`,
                color: answerResults[currentQuestion].is_correct ? '#155724' : '#721c24'
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                  {answerResults[currentQuestion].is_correct ? 'Correct!' : 'Incorrect!'}
                </div>
                <div>
                  Your answer: {answerResults[currentQuestion].user_answer}
                  {!answerResults[currentQuestion].is_correct && (
                    <span style={{ marginLeft: '12px' }}>
                      Correct answer: {answerResults[currentQuestion].correct_answer}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between' }}>
              <button
                onClick={handlePreviousQuestion}
                disabled={currentQuestion === 0}
                style={{
                  padding: '10px 20px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  background: 'white',
                  cursor: currentQuestion === 0 ? 'not-allowed' : 'pointer',
                  opacity: currentQuestion === 0 ? 0.5 : 1
                }}
              >
                {'<'} Previous
              </button>
              
              <button
                onClick={() => handleCheckAnswer(currentQuestion)}
                disabled={!selectedAnswers[currentQuestion] || isCheckingAnswer}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '6px',
                  background: '#007bff',
                  color: 'white',
                  cursor: !selectedAnswers[currentQuestion] || isCheckingAnswer ? 'not-allowed' : 'pointer',
                  opacity: !selectedAnswers[currentQuestion] || isCheckingAnswer ? 0.5 : 1
                }}
              >
                {isCheckingAnswer ? 'Checking...' : 'Check Answer'}
              </button>
              
              <button
                onClick={handleNextQuestion}
                disabled={currentQuestion === quizData.questions.length - 1 && (!allQuestionsAnswered() || !allQuestionsChecked())}
                style={{
                  padding: '10px 20px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  background: 'white',
                  cursor: (currentQuestion === quizData.questions.length - 1 && (!allQuestionsAnswered() || !allQuestionsChecked())) ? 'not-allowed' : 'pointer',
                  opacity: (currentQuestion === quizData.questions.length - 1 && (!allQuestionsAnswered() || !allQuestionsChecked())) ? 0.5 : 1
                }}
              >
                {currentQuestion === quizData.questions.length - 1 ? 'Complete Quiz' : 'Next >'}
              </button>
            </div>

            {/* Quiz Status Message */}
            {currentQuestion === quizData.questions.length - 1 && (!allQuestionsAnswered() || !allQuestionsChecked()) && (
              <div style={{
                padding: '12px',
                borderRadius: '6px',
                marginTop: '16px',
                background: '#fff3cd',
                border: '1px solid #ffeaa7',
                color: '#856404',
                fontSize: '14px',
                textAlign: 'center'
              }}>
                {!allQuestionsAnswered() && !allQuestionsChecked() && 'Warning: Please answer and check all questions to complete the quiz'}
                {allQuestionsAnswered() && !allQuestionsChecked() && 'Warning: Please check all answers to complete the quiz'}
                {!allQuestionsAnswered() && allQuestionsChecked() && 'Warning: Please answer all questions to complete the quiz'}
              </div>
            )}

            {/* Quiz Completion Message */}
            {quizCompleted && (
              <div style={{
                padding: '16px',
                borderRadius: '8px',
                marginTop: '20px',
                background: '#d4edda',
                border: '1px solid #c3e6cb',
                color: '#155724',
                textAlign: 'center'
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                  Quiz Completed!
                </div>
                <div>
                  Your quiz results have been saved to Firebase.
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* No Quiz State */}
      {!quizData && !isGenerating && (
        <div style={{ 
          background: '#f0f8ff', 
          border: '1px solid #b3d9ff', 
          borderRadius: '6px', 
          padding: '16px',
          textAlign: 'center'
        }}>
          <h4 style={{ marginBottom: '12px', color: '#0066cc' }}>Ready to Test Your Knowledge?</h4>
          <p style={{ fontSize: '14px', color: '#0066cc', lineHeight: '1.6' }}>
            Upload some documents first, then click "Generate Quiz" to create 5 questions based on your study materials.
          </p>
        </div>
      )}
    </div>
  );
};

export default QuizInterface; 