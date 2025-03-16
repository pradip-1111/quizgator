
import { QuizData, QuizResult, Question } from '@/types/quiz';
import { supabase } from '@/integrations/supabase/client';

export const calculateScore = (quiz: QuizData, answers: Record<string, any>) => {
  let score = 0;
  let totalPoints = 0;
  
  quiz.questions.forEach(question => {
    totalPoints += question.points;
    
    if (!answers[question.id]) return;
    
    if (question.type === 'multiple-choice' || question.type === 'true-false') {
      const selectedOption = question.options.find(opt => opt.id === answers[question.id]);
      if (selectedOption && selectedOption.isCorrect) {
        score += question.points;
      }
    } 
    else if (answers[question.id] && answers[question.id].trim().length > 0) {
      score += question.points;
    }
  });
  
  return { score, totalPoints };
};

export const submitQuiz = async (
  quizId: string, 
  quiz: QuizData, 
  answers: Record<string, any>, 
  name: string, 
  rollNumber: string, 
  email: string
) => {
  try {
    // Update quiz attempts in localStorage
    const storedQuizzes = localStorage.getItem('quizzes');
    if (storedQuizzes) {
      const quizzes = JSON.parse(storedQuizzes);
      const updatedQuizzes = quizzes.map((q: any) => {
        if (q.id === quizId) {
          return {
            ...q,
            attempts: (q.attempts || 0) + 1
          };
        }
        return q;
      });
      localStorage.setItem('quizzes', JSON.stringify(updatedQuizzes));
    }
    
    const { score, totalPoints } = calculateScore(quiz, answers);
    
    const correctAnswers: Record<string, any> = {};
    quiz.questions.forEach(question => {
      if (question.type === 'multiple-choice' || question.type === 'true-false') {
        const correctOption = question.options.find(opt => opt.isCorrect);
        if (correctOption) {
          correctAnswers[question.id] = correctOption.id;
        }
      } else if (question.type === 'short-answer' || question.type === 'long-answer') {
        correctAnswers[question.id] = null;
      }
    });
    
    const result: QuizResult = {
      quizId: quizId,
      studentName: name,
      studentId: rollNumber,
      score,
      totalPoints,
      submittedAt: new Date().toISOString(),
      answers,
      correctAnswers,
      securityViolations: 1,
      completed: false
    };
    
    const resultsKey = `quiz_results_${quizId}`;
    console.log(`Saving result for quiz ID: ${quizId} to key: ${resultsKey}`);
    
    const existingResults = localStorage.getItem(resultsKey) || '[]';
    const results = JSON.parse(existingResults);
    results.push(result);
    
    localStorage.setItem(resultsKey, JSON.stringify(results));
    console.log("Saved quiz results:", result);
    
    return result;
  } catch (error) {
    console.error('Error submitting quiz:', error);
    throw error;
  }
};

export const sendConfirmationEmail = async (
  quizId: string, 
  quizTitle: string, 
  result: QuizResult, 
  email: string
) => {
  try {
    console.log("Sending confirmation email for quiz submission");
    
    const response = await supabase.functions.invoke('send-quiz-confirmation', {
      body: {
        quizId: quizId,
        quizTitle: quizTitle || 'Quiz',
        studentName: result.studentName,
        studentId: result.studentId,
        studentEmail: email
      }
    });
    
    if (!response.data?.success) {
      throw new Error('Failed to send confirmation email');
    }
    
    console.log("Email confirmation sent successfully");
    return true;
  } catch (error) {
    console.error("Error sending confirmation email:", error);
    return false;
  }
};
