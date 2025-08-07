import { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import FileUpload from './components/FileUpload';
import SearchInterface from './components/SearchInterface';
import QuizInterface from './components/QuizInterface';
import ProgressDisplay from './components/ProgressDisplay';
import { apiService } from './services/api';
import './App.css';

function App() {
  const [documentCount, setDocumentCount] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [aiAnswer, setAiAnswer] = useState(null);
  const [sources, setSources] = useState([]);
  const [uploadMessage, setUploadMessage] = useState('');
  
  // Quiz states
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [quizData, setQuizData] = useState(null);
  const [isCheckingAnswer, setIsCheckingAnswer] = useState(false);

  // Progress display ref
  const progressDisplayRef = useRef();

  // Load initial document count
  useEffect(() => {
    loadDocumentCount();
  }, []);

  const loadDocumentCount = async () => {
    try {
      const health = await apiService.getHealth();
      setDocumentCount(health.documents_loaded);
    } catch (error) {
      console.error('Failed to load document count:', error);
    }
  };

  const handleFileUpload = async (file) => {
    setIsUploading(true);
    setUploadMessage('');
    
    try {
      const result = await apiService.uploadDocument(file);
      setUploadMessage(`✅ ${result.message} - ${result.chunks_processed} chunks processed`);
      setDocumentCount(result.total_documents);
      
      // Clear message after 5 seconds
      setTimeout(() => setUploadMessage(''), 5000);
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadMessage(`❌ Upload failed: ${error.response?.data?.detail || error.message}`);
      
      // Clear error message after 5 seconds
      setTimeout(() => setUploadMessage(''), 5000);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSearch = async (query) => {
    setIsSearching(true);
    setAiAnswer(null);
    setSources([]);
    
    try {
      const result = await apiService.askQuestion(query, 3);
      setAiAnswer(result.answer);
      setSources(result.sources || []);
    } catch (error) {
      console.error('AI question failed:', error);
      setUploadMessage(`❌ AI question failed: ${error.response?.data?.detail || error.message}`);
      setTimeout(() => setUploadMessage(''), 5000);
    } finally {
      setIsSearching(false);
    }
  };

  // Quiz handlers
  const handleGenerateQuiz = async () => {
    setIsGeneratingQuiz(true);
    setUploadMessage('');
    
    try {
      const result = await apiService.generateQuiz();
      setQuizData(result);
      setUploadMessage(`✅ Quiz generated successfully! ${result.total_questions} questions ready.`);
      setTimeout(() => setUploadMessage(''), 5000);
    } catch (error) {
      console.error('Quiz generation failed:', error);
      setUploadMessage(`❌ Quiz generation failed: ${error.response?.data?.detail || error.message}`);
      setTimeout(() => setUploadMessage(''), 5000);
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const handleCheckAnswer = async (questionIndex, userAnswer, quizData) => {
    setIsCheckingAnswer(true);
    
    try {
      const result = await apiService.checkAnswer(questionIndex, userAnswer, quizData);
      
      // Check if this was the last question and all answers are checked
      const allAnswersChecked = Object.keys(result).length === quizData.questions.length;
      if (allAnswersChecked) {
        // Quiz completed - refresh progress display
        setTimeout(() => {
          if (progressDisplayRef.current) {
            progressDisplayRef.current.refresh();
          }
        }, 1000); // Small delay to ensure Firebase save is complete
      }
      
      return result;
    } catch (error) {
      console.error('Answer check failed:', error);
      throw error;
    } finally {
      setIsCheckingAnswer(false);
    }
  };

  return (
    <div>
      <Header documentCount={documentCount} />
      
      <div className="container">
        {/* Upload Message */}
        {uploadMessage && (
          <div className={`message ${uploadMessage.startsWith('✅') ? 'success' : 'error'}`}>
            {uploadMessage}
          </div>
        )}
        
        <div className="main-content">
          {/* File Upload Section */}
          <FileUpload 
            onUpload={handleFileUpload}
            isUploading={isUploading}
          />
          
          {/* AI Tutor Section */}
          <SearchInterface
            onSearch={handleSearch}
            isSearching={isSearching}
            aiAnswer={aiAnswer}
            sources={sources}
          />

          {/* Quiz Section */}
          <QuizInterface
            onGenerateQuiz={handleGenerateQuiz}
            isGenerating={isGeneratingQuiz}
            quizData={quizData}
            onCheckAnswer={handleCheckAnswer}
          />

          {/* Progress Section */}
          <ProgressDisplay ref={progressDisplayRef} />
        </div>
        
        {/* Quick Stats */}
        <div className="stats">
          <div className="stat-card">
            <div className="stat-number">{documentCount}</div>
            <div className="stat-label">Documents Loaded</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">
              {sources.length > 0 ? sources.length : 0}
            </div>
            <div className="stat-label">Sources Used</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">
              {quizData ? quizData.total_questions : 0}
            </div>
            <div className="stat-label">Quiz Questions</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">🤖</div>
            <div className="stat-label">AI Powered</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
