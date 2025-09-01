import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000',
  timeout: 30000, // 30 seconds timeout for file uploads
});

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

  // Ask question using OpenAI RAG
  async askQuestion(query, topK = 3) {
    const formData = new FormData();
    formData.append('query', query);
    formData.append('top_k', topK);
    
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