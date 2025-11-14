import { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import Header from './components/Header';
import FileUpload from './components/FileUpload';
import SearchInterface from './components/SearchInterface';
import QuizInterface from './components/QuizInterface';
import AuthContainer from './components/Auth/AuthContainer';
import { apiService } from './services/api';
import './App.css';

function App() {
  const { user, loading } = useAuth();
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
      setUploadMessage(`Success: ${result.message} - ${result.chunks_processed} chunks processed`);
      setDocumentCount(result.total_documents);
      
      // Clear message after 5 seconds
      setTimeout(() => setUploadMessage(''), 5000);
    } catch (error) {
      console.error('Upload failed:', error);
      
      // Provide more helpful error messages
      let errorMessage = 'Upload failed: ';
      if (error.message && error.message.includes('Cannot connect to backend')) {
        errorMessage += 'Backend server is not running. Please start the backend server.';
      } else if (error.response?.data?.detail) {
        errorMessage += error.response.data.detail;
      } else if (error.message) {
        errorMessage += error.message;
      } else {
        errorMessage += 'Unknown error occurred.';
      }
      
      setUploadMessage(`Error: ${errorMessage}`);
      
      // Clear error message after 8 seconds (longer for network errors)
      setTimeout(() => setUploadMessage(''), 8000);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSearch = async (query) => {
    setIsSearching(true);
    setAiAnswer(null);
    setSources([]);
    
    try {
      // Pass user_id for conversation memory if user is logged in
      const userId = user?.uid || null;
      const result = await apiService.askQuestion(query, 3, userId);
      setAiAnswer(result.answer);
      setSources(result.sources || []);
    } catch (error) {
      console.error('AI question failed:', error);
      setUploadMessage(`Error: AI question failed: ${error.response?.data?.detail || error.message}`);
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
      setUploadMessage(`Success: Quiz generated successfully! ${result.total_questions} questions ready.`);
      setTimeout(() => setUploadMessage(''), 5000);
    } catch (error) {
      console.error('Quiz generation failed:', error);
      setUploadMessage(`Error: Quiz generation failed: ${error.response?.data?.detail || error.message}`);
      setTimeout(() => setUploadMessage(''), 5000);
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const handleCheckAnswer = async (questionIndex, userAnswer, quizData) => {
    setIsCheckingAnswer(true);
    
    try {
      const result = await apiService.checkAnswer(questionIndex, userAnswer, quizData);
      return result;
    } catch (error) {
      console.error('Answer check failed:', error);
      throw error;
    } finally {
      setIsCheckingAnswer(false);
    }
  };

  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{
          textAlign: 'center',
          color: 'white',
          fontSize: '18px'
        }}>
          <div style={{
            border: '4px solid rgba(255,255,255,0.3)',
            borderTop: '4px solid white',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
          Loading...
        </div>
      </div>
    );
  }

  // Show auth container if user is not authenticated
  if (!user) {
    return <AuthContainer />;
  }

  // Show main app if user is authenticated
  return (
    <div>
      <Header documentCount={documentCount} />
      
      <div className="container">
        {/* Upload Message */}
        {uploadMessage && (
          <div className={`message ${uploadMessage.startsWith('Success:') ? 'success' : 'error'}`}>
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
            <div className="stat-number">AI</div>
            <div className="stat-label">AI Powered</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
