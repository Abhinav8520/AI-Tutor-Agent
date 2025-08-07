import { addDoc, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

export const progressService = {
  // Save quiz result (minimal data)
  async saveQuizResult(quizData, userAnswers, results) {
    try {
      const quizResult = {
        date: new Date().toISOString(),
        score: results.correct_answers,
        total: results.total_questions,
        percentage: Math.round((results.correct_answers / results.total_questions) * 100),
        answers: Object.keys(userAnswers).map(questionIndex => ({
          questionIndex: parseInt(questionIndex),
          userAnswer: userAnswers[questionIndex],
          isCorrect: results.results.find(r => r.question_number === questionIndex)?.is_correct || false,
          topic: quizData.questions[parseInt(questionIndex)]?.question?.substring(0, 50) + '...' // Simple topic extraction
        }))
      };
      
      const docRef = await addDoc(collection(db, 'quizResults'), quizResult);
      console.log('Quiz result saved successfully');
      
      return docRef.id;
    } catch (error) {
      console.error('Error saving quiz result:', error);
      throw error;
    }
  },

  // Get all quiz history
  async getQuizHistory() {
    try {
      const q = query(collection(db, 'quizResults'), orderBy('date', 'desc'));
      const snapshot = await getDocs(q);
      const history = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      return history;
    } catch (error) {
      console.error('Error getting quiz history:', error);
      return [];
    }
  },

  // Get weak topics (simple analysis)
  async getWeakTopics() {
    try {
      const history = await this.getQuizHistory();
      const wrongAnswers = history.flatMap(quiz => 
        quiz.answers.filter(answer => !answer.isCorrect)
      );
      
      // Count wrong answers per topic
      const topicCounts = {};
      wrongAnswers.forEach(answer => {
        const topic = answer.topic || 'Unknown Topic';
        topicCounts[topic] = (topicCounts[topic] || 0) + 1;
      });
      
      // Return topics with most wrong answers
      return Object.entries(topicCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([topic]) => topic);
    } catch (error) {
      console.error('Error getting weak topics:', error);
      return [];
    }
  }
}; 