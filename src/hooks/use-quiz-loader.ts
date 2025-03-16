
import { useState, useEffect, useCallback } from 'react';
import { useToast } from './use-toast';
import { QuizData, Question } from '@/types/quiz';
import { supabase } from '@/integrations/supabase/client';

export function useQuizLoader(quizId: string | undefined) {
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchQuiz = useCallback(async () => {
    if (!quizId) {
      setError('Quiz ID is missing');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log(`Fetching quiz with ID: ${quizId}`);
      
      // Fetch the quiz from Supabase
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', quizId)
        .maybeSingle();

      if (quizError) {
        console.error('Error fetching quiz:', quizError);
        throw new Error(`Failed to load quiz: ${quizError.message}`);
      }

      // If quiz not found in database, fall back to demo content
      if (!quizData) {
        console.log('Quiz not found in database, creating demo quiz');
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

      console.log('Quiz found:', quizData);

      // Fetch questions for the quiz
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('id, text, type, points, required, order_number')
        .eq('quiz_id', quizId)
        .order('order_number');

      if (questionsError) {
        console.error('Error fetching questions:', questionsError);
        throw new Error(`Failed to load questions: ${questionsError.message}`);
      }

      console.log(`Found ${questionsData?.length || 0} questions`);

      // For each question, fetch its options
      const questionsWithOptions: Question[] = [];
      
      for (const q of questionsData || []) {
        const { data: optionsData, error: optionsError } = await supabase
          .from('options')
          .select('id, text, is_correct')
          .eq('question_id', q.id)
          .order('order_number');

        if (optionsError) {
          console.error(`Error fetching options for question ${q.id}:`, optionsError);
          throw new Error(`Failed to load options: ${optionsError.message}`);
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

      // Check if we have any questions
      if (questionsWithOptions.length === 0) {
        console.warn('No questions found for this quiz, creating a demo question');
        // Add a sample question if none exist
        questionsWithOptions.push({
          id: '1',
          text: 'Sample Question',
          options: [
            { id: 'a', text: 'Option A', isCorrect: true },
            { id: 'b', text: 'Option B', isCorrect: false }
          ],
          type: 'multiple-choice',
          points: 1,
          required: true
        });
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
      
    } catch (err) {
      console.error('Error loading quiz:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load quiz. Please try again.';
      setError(errorMessage);
      toast({
        title: "Error",
        description: "Failed to load quiz data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [quizId, toast]);

  useEffect(() => {
    fetchQuiz();
  }, [fetchQuiz]);

  return { 
    quiz, 
    questions, 
    loading, 
    error, 
    retryLoading: fetchQuiz 
  };
}
