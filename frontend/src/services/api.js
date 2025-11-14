import axios from 'axios';

// Get API URL from environment or use default
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 seconds timeout for file uploads
});

// Add request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, {
      baseURL: config.baseURL,
      timeout: config.timeout
    });
    return config;
  },
  (error) => {
    console.error('[API] Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.code === 'ECONNABORTED') {
      console.error('[API] Request timeout:', error);
      error.message = 'Request timed out. Please try again.';
    } else if (error.message === 'Network Error' || !error.response) {
      console.error('[API] Network error:', error);
      error.message = `Cannot connect to backend server at ${API_URL}. Please ensure the backend is running.`;
    }
    return Promise.reject(error);
  }
);

// API service functions
export const apiService = {
  // Health check
  async getHealth() {
    const response = await api.get('/health');
    return response.data;
  },

  // Upload document
  async uploadDocument(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Ask question using OpenAI RAG with conversation memory
  async askQuestion(query, topK = 3, userId = null) {
    const formData = new FormData();
    formData.append('query', query);
    formData.append('top_k', topK);
    if (userId) {
      formData.append('user_id', userId);
    }
    
    const response = await api.post('/ask', formData);
    return response.data;
  },

  // Generate quiz
  async generateQuiz() {
    const response = await api.post('/generate-quiz');
    return response.data;
  },

  // Check answer
  async checkAnswer(questionIndex, userAnswer, quizData) {
    const formData = new FormData();
    formData.append('question_index', questionIndex.toString());
    formData.append('user_answer', userAnswer);
    formData.append('quiz_data', JSON.stringify(quizData));
    
    const response = await api.post('/check-answer', formData);
    return response.data;
  },

  // Get document count
  async getDocumentCount() {
    const response = await api.get('/documents');
    return response.data;
  },
};

export default api; 