
import { useState, useEffect, useCallback } from 'react';
import { useToast } from './use-toast';
import { QuizData, Question } from '@/types/quiz';
import { supabase } from '@/integrations/supabase/client';

export function useQuizLoader(quizId: string | undefined) {
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingStage, setLoadingStage] = useState<'initial' | 'database' | 'local' | 'demo'>('initial');
  const [fallbackActive, setFallbackActive] = useState(false);
  const { toast } = useToast();

  const fetchQuiz = useCallback(async () => {
    if (!quizId) {
      setError('Quiz ID is missing');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setLoadingStage('initial');
    
    try {
      console.log(`Fetching quiz with ID: ${quizId}`);
      
      // First check for creator questions (highest priority)
      const creatorStorageKey = `quiz_creator_questions_${quizId}`;
      const creatorQuestions = localStorage.getItem(creatorStorageKey);
      
      // Regular storage key for questions
      const localStorageKey = `quiz_questions_${quizId}`;
      
      // First check if we have creator questions (highest priority)
      if (creatorQuestions) {
        console.log('Found creator questions in local storage, using these as primary source');
        try {
          const parsedQuestions = JSON.parse(creatorQuestions);
          if (Array.isArray(parsedQuestions) && parsedQuestions.length > 0) {
            console.log('Successfully parsed creator questions:', parsedQuestions.length);
            // Copy creator questions to the regular questions key so the quiz loader will use them
            localStorage.setItem(localStorageKey, creatorQuestions);
            setQuestions(parsedQuestions);
          }
        } catch (e) {
          console.error('Error parsing creator questions:', e);
        }
      }
      
      // Then check for regular stored questions
      const storedQuestions = localStorage.getItem(localStorageKey);
      
      if (storedQuestions && !creatorQuestions) {
        console.log('Found locally stored questions, using these while we fetch from database');
        try {
          const parsedQuestions = JSON.parse(storedQuestions);
          if (Array.isArray(parsedQuestions) && parsedQuestions.length > 0) {
            console.log('Successfully parsed local questions:', parsedQuestions.length);
            setQuestions(parsedQuestions);
          }
        } catch (e) {
          console.error('Error parsing stored questions:', e);
        }
      }
      
      // Fetch the quiz from Supabase
      setLoadingStage('database');
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', quizId)
        .maybeSingle();

      if (quizError) {
        console.error('Error fetching quiz:', quizError);
        throw new Error(`Failed to load quiz: ${quizError.message}`);
      }

      // If quiz not found in database, check if we have any stored questions to create a quiz
      if (!quizData) {
        console.log('Quiz not found in database, checking local storage');
        setLoadingStage('local');
        
        // Look for creator questions first, then fallback to regular stored questions
        const localQuestions = creatorQuestions || storedQuestions;
        
        if (localQuestions) {
          const parsedQuestions = JSON.parse(localQuestions);
          if (Array.isArray(parsedQuestions) && parsedQuestions.length > 0) {
            console.log('Creating quiz from stored questions');
            setFallbackActive(true);
            
            const mockQuiz: QuizData = {
              id: quizId,
              title: 'Your Quiz',
              description: 'Quiz loaded from local storage',
              timeLimit: 30,
              questions: parsedQuestions
            };
            
            setQuiz(mockQuiz);
            setQuestions(parsedQuestions);
            setLoading(false);
            return;
          }
        }
        
        // If no stored questions are available, create a demo quiz
        console.log('No stored questions found, creating demo quiz');
        setLoadingStage('demo');
        
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

      // Prioritize using creator questions if available, then fetch from database
      if (creatorQuestions) {
        try {
          const parsedQuestions = JSON.parse(creatorQuestions);
          if (Array.isArray(parsedQuestions) && parsedQuestions.length > 0) {
            console.log('Using creator questions for database quiz:', parsedQuestions.length);
            
            const fullQuiz: QuizData = {
              id: quizData.id,
              title: quizData.title,
              description: quizData.description,
              timeLimit: quizData.time_limit,
              questions: parsedQuestions
            };
            
            setQuiz(fullQuiz);
            setQuestions(parsedQuestions);
            setLoading(false);
            return;
          }
        } catch (e) {
          console.error('Error parsing creator questions:', e);
        }
      }

      // If no creator questions, proceed with fetching questions from database
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

      console.log(`Found ${questionsData?.length || 0} questions from database`);

      // For each question, fetch its options
      const questionsWithOptions: Question[] = [];
      
      // Check if we have any stored questions to use as a fallback
      let shouldUseStoredQuestions = false;
      
      if ((!questionsData || questionsData.length === 0) && storedQuestions) {
        console.log('No questions found in database, using stored questions');
        shouldUseStoredQuestions = true;
      }
      
      if (shouldUseStoredQuestions && storedQuestions) {
        try {
          const parsedQuestions = JSON.parse(storedQuestions);
          if (Array.isArray(parsedQuestions) && parsedQuestions.length > 0) {
            const fullQuiz: QuizData = {
              id: quizData.id,
              title: quizData.title,
              description: quizData.description,
              timeLimit: quizData.time_limit,
              questions: parsedQuestions
            };
            
            setQuiz(fullQuiz);
            setQuestions(parsedQuestions);
            setLoading(false);
            return;
          }
        } catch (e) {
          console.error('Error parsing stored questions:', e);
        }
      }
      
      // If we got here, we need to process questions from the database
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
        console.warn('No questions found for this quiz, checking local storage again');
        
        // Try to get questions from local storage again as a final fallback
        if (storedQuestions) {
          try {
            const parsedQuestions = JSON.parse(storedQuestions);
            if (Array.isArray(parsedQuestions) && parsedQuestions.length > 0) {
              console.log('Using stored questions as fallback:', parsedQuestions.length);
              setFallbackActive(true);
              
              // Update the local storage key to ensure we use these questions
              localStorage.setItem(localStorageKey, JSON.stringify(parsedQuestions));
              
              const fullQuiz: QuizData = {
                id: quizData.id,
                title: quizData.title,
                description: quizData.description,
                timeLimit: quizData.time_limit,
                questions: parsedQuestions
              };
              
              setQuiz(fullQuiz);
              setQuestions(parsedQuestions);
              setLoading(false);
              return;
            }
          } catch (e) {
            console.error('Error parsing stored questions:', e);
          }
        }
        
        console.warn('Creating a sample question as fallback');
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

      // Update the local storage with the retrieved questions for faster loading next time
      localStorage.setItem(localStorageKey, JSON.stringify(questionsWithOptions));
      
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
      
      // If we have questions from localStorage, use those as a fallback
      const storageOptions = [
        `quiz_creator_questions_${quizId}`,
        `quiz_questions_${quizId}`
      ];
      
      let foundFallback = false;
      
      for (const storageKey of storageOptions) {
        const storedQuestions = localStorage.getItem(storageKey);
        if (storedQuestions) {
          try {
            const parsedQuestions = JSON.parse(storedQuestions);
            if (Array.isArray(parsedQuestions) && parsedQuestions.length > 0) {
              console.log(`Error occurred, but using ${storageKey} as fallback`);
              setFallbackActive(true);
              
              const fallbackQuiz: QuizData = {
                id: quizId,
                title: 'Your Quiz',
                description: 'Quiz loaded from local storage due to connection issues',
                timeLimit: 30,
                questions: parsedQuestions
              };
              
              setQuiz(fallbackQuiz);
              setQuestions(parsedQuestions);
              foundFallback = true;
              break;
            }
          } catch (e) {
            console.error('Error parsing stored questions:', e);
          }
        }
      }
      
      if (!foundFallback) {
        setQuiz(null);
        setQuestions([]);
      }
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
    retryLoading: fetchQuiz,
    loadingStage,
    fallbackActive
  };
}
