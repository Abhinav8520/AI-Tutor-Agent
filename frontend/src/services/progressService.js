import { addDoc, collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

export const progressService = {
  // Save quiz result to Firebase
  async saveQuizResult(quizData, userAnswers, results, userId) {
    try {
      if (!userId) {
        throw new Error('User ID is required to save quiz results');
      }

      const quizResult = {
        userId: userId,
        date: new Date().toISOString(),
        score: results.correct_answers,
        total: results.total_questions,
        percentage: Math.round((results.correct_answers / results.total_questions) * 100),
        answers: Object.keys(userAnswers).map(questionIndex => ({
          questionIndex: parseInt(questionIndex),
          userAnswer: userAnswers[questionIndex],
          isCorrect: results.results.find(r => r.question_number === questionIndex)?.is_correct || false,
          topic: quizData.questions[parseInt(questionIndex)]?.question?.substring(0, 50) + '...'
        }))
      };
      
      const docRef = await addDoc(collection(db, 'quizResults'), quizResult);
      console.log('Quiz result saved successfully to Firebase');
      
      return docRef.id;
    } catch (error) {
      console.error('Error saving quiz result:', error);
      throw error;
    }
  },

  // Get quiz history for a user
  async getQuizHistory(userId) {
    try {
      if (!userId) {
        throw new Error('User ID is required to fetch quiz history');
      }

      const q = query(
        collection(db, 'quizResults'),
        where('userId', '==', userId),
        orderBy('date', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const quizHistory = [];
      
      querySnapshot.forEach((doc) => {
        quizHistory.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return quizHistory;
    } catch (error) {
      console.error('Error fetching quiz history:', error);
      throw error;
    }
  },

  // Get quiz statistics for a user
  async getQuizStatistics(userId) {
    try {
      if (!userId) {
        throw new Error('User ID is required to fetch quiz statistics');
      }

      const quizHistory = await this.getQuizHistory(userId);

      if (quizHistory.length === 0) {
        return {
          totalQuizzes: 0,
          averageScore: 0,
          bestScore: 0,
          lastQuizDate: null
        };
      }

      const totalQuizzes = quizHistory.length;
      const totalPercentage = quizHistory.reduce((sum, quiz) => sum + quiz.percentage, 0);
      const averageScore = Math.round(totalPercentage / totalQuizzes);
      const bestScore = Math.max(...quizHistory.map(quiz => quiz.percentage));
      const lastQuizDate = quizHistory[0]?.date || null;

      return {
        totalQuizzes,
        averageScore,
        bestScore,
        lastQuizDate
      };
    } catch (error) {
      console.error('Error calculating quiz statistics:', error);
      throw error;
    }
  }
}; 