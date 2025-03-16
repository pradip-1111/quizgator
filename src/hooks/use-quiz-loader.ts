
import { useState, useEffect } from 'react';
import { useToast } from './use-toast';
import { QuizData, Question } from '@/types/quiz';

export function useQuizLoader(quizId: string | undefined) {
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const loadQuiz = async () => {
      if (!quizId) {
        setError('Quiz ID is missing');
        setLoading(false);
        return;
      }

      try {
        // In a real app, this would be an API call to fetch quiz data
        // For demo purposes, we're simulating a quiz with 5 sample questions
        const mockQuiz: QuizData = {
          id: quizId,
          title: 'Demo Quiz',
          description: 'This is a demo quiz with 5 questions',
          timeLimit: 30,
          questions: [
            {
              id: '1',
              text: 'What is the capital of France?',
              options: ['London', 'Berlin', 'Paris', 'Madrid'],
              correctAnswer: 'Paris',
              type: 'multiple-choice'
            },
            // ... more sample questions would go here
          ],
          createdBy: 'demo-user',
          createdAt: new Date().toISOString(),
          requiresAuth: false
        };

        // Add more sample questions
        for (let i = 2; i <= 5; i++) {
          mockQuiz.questions.push({
            id: i.toString(),
            text: `Sample Question ${i}`,
            options: ['Option A', 'Option B', 'Option C', 'Option D'],
            correctAnswer: 'Option A',
            type: 'multiple-choice'
          });
        }

        setQuiz(mockQuiz);
        setQuestions(mockQuiz.questions);
        setLoading(false);
      } catch (err) {
        console.error('Error loading quiz:', err);
        setError('Failed to load quiz. Please try again.');
        setLoading(false);
        toast({
          title: 'Error',
          description: 'Failed to load quiz data',
          variant: 'destructive'
        });
      }
    };

    loadQuiz();
  }, [quizId, toast]);

  return { quiz, questions, loading, error };
}
