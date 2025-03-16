
import { useState } from 'react';
import { Question, QuizResult } from '@/types/quiz';

export function useQuizState() {
  const [quiz, setQuiz] = useState<any | null>(null);
  const [started, setStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [requiresAuth, setRequiresAuth] = useState(false);
  
  const handleAnswerChange = (questionId: string, value: any) => {
    console.log("Answer changed for question", questionId, "to", value);
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };
  
  const handleNextQuestion = () => {
    if (currentQuestion < (quiz?.questions.length || 0) - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };
  
  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const getRemainingQuestionCount = () => {
    if (!quiz?.questions) return 0;
    return quiz.questions.filter((q: Question) => !answers[q.id]).length;
  };

  return {
    quiz, setQuiz,
    started, setStarted,
    currentQuestion, setCurrentQuestion,
    answers, setAnswers,
    timeLeft, setTimeLeft,
    confirmed, setConfirmed,
    loading, setLoading,
    questions, setQuestions,
    error, setError,
    requiresAuth, setRequiresAuth,
    handleAnswerChange,
    handleNextQuestion,
    handlePreviousQuestion,
    getRemainingQuestionCount
  };
}
