import { addDoc, collection } from 'firebase/firestore';
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
  }
}; 