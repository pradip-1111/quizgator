
import { useState, useEffect } from 'react';
import { useToast } from './use-toast';
import { QuizData, Question } from '@/types/quiz';
import { supabase } from '@/integrations/supabase/client';

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
        // Fetch the quiz from Supabase
        const { data: quizData, error: quizError } = await supabase
          .from('quizzes')
          .select('*')
          .eq('id', quizId)
          .single();

        if (quizError) {
          throw quizError;
        }

        if (!quizData) {
          // If quiz not found in database, fall back to demo content
          const mockQuiz: QuizData = {
            id: quizId,
            title: 'Demo Quiz',
            description: 'This is a demo quiz with 5 questions',
            timeLimit: 30,
            questions: [
              {
                id: '1',
                text: 'What is the capital of France?',
                options: [
                  { id: 'a', text: 'London', isCorrect: false },
                  { id: 'b', text: 'Berlin', isCorrect: false },
                  { id: 'c', text: 'Paris', isCorrect: true },
                  { id: 'd', text: 'Madrid', isCorrect: false }
                ],
                type: 'multiple-choice',
                points: 1,
                required: true
              }
            ]
          };

          // Add more sample questions
          for (let i = 2; i <= 5; i++) {
            mockQuiz.questions.push({
              id: i.toString(),
              text: `Sample Question ${i}`,
              options: [
                { id: 'a', text: 'Option A', isCorrect: true },
                { id: 'b', text: 'Option B', isCorrect: false },
                { id: 'c', text: 'Option C', isCorrect: false },
                { id: 'd', text: 'Option D', isCorrect: false }
              ],
              type: 'multiple-choice',
              points: 1,
              required: true
            });
          }

          setQuiz(mockQuiz);
          setQuestions(mockQuiz.questions);
          setLoading(false);
          return;
        }

        // Fetch questions for the quiz
        const { data: questionsData, error: questionsError } = await supabase
          .from('questions')
          .select('id, text, type, points, required, order_number')
          .eq('quiz_id', quizId)
          .order('order_number');

        if (questionsError) {
          throw questionsError;
        }

        // For each question, fetch its options
        const questionsWithOptions: Question[] = [];
        
        for (const q of questionsData || []) {
          const { data: optionsData, error: optionsError } = await supabase
            .from('options')
            .select('id, text, is_correct')
            .eq('question_id', q.id)
            .order('order_number');

          if (optionsError) {
            throw optionsError;
          }

          const questionWithOptions: Question = {
            id: q.id,
            text: q.text,
            type: q.type as 'multiple-choice' | 'true-false' | 'short-answer' | 'long-answer',
            points: q.points,
            required: q.required,
            options: (optionsData || []).map(opt => ({
              id: opt.id,
              text: opt.text,
              isCorrect: opt.is_correct
            }))
          };

          questionsWithOptions.push(questionWithOptions);
        }

        // Construct the full quiz object
        const fullQuiz: QuizData = {
          id: quizData.id,
          title: quizData.title,
          description: quizData.description,
          timeLimit: quizData.time_limit,
          questions: questionsWithOptions
        };

        setQuiz(fullQuiz);
        setQuestions(questionsWithOptions);
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
