
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Question, QuizData } from '@/types/quiz';

interface QuizLoaderState {
  quiz: QuizData | null;
  questions: Question[];
  loading: boolean;
  error: string | null;
  stage: 'idle' | 'loading-quiz' | 'loading-questions' | 'ready' | 'error';
  retryLoading?: () => void;
  loadingStage?: 'initial' | 'database' | 'local' | 'demo';
  fallbackActive?: boolean;
}

export const useQuizLoader = (quizId: string | undefined) => {
  const [state, setState] = useState<QuizLoaderState>({
    quiz: null,
    questions: [],
    loading: true,
    error: null,
    stage: 'idle',
    loadingStage: 'initial',
    fallbackActive: false
  });

  // Function to retry loading the quiz
  const retryLoading = () => {
    console.log("Retrying quiz loading for ID:", quizId);
    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
      stage: 'idle',
      loadingStage: 'initial',
      fallbackActive: false
    }));
  };

  useEffect(() => {
    if (!quizId) {
      setState({
        ...state,
        error: 'No quiz ID provided',
        loading: false,
        stage: 'error',
        retryLoading
      });
      return;
    }

    const loadQuiz = async () => {
      console.log(`Loading quiz with ID: ${quizId}`);
      setState(prev => ({ 
        ...prev, 
        loading: true, 
        stage: 'loading-quiz',
        loadingStage: 'database' 
      }));

      try {
        // Try to load from Supabase first
        const { data: quizData, error } = await supabase
          .from('quizzes')
          .select('title, description, time_limit, created_at')
          .eq('id', quizId)
          .maybeSingle();

        let quiz: QuizData | null = null;
        let usedLocalStorage = false;
        
        if (error) {
          console.log(`Supabase error, trying localStorage: ${error.message}`);
          setState(prev => ({ 
            ...prev, 
            loadingStage: 'local' 
          }));
          
          // Try to get quiz from localStorage
          const storedQuizzes = localStorage.getItem('quizzes');
          if (storedQuizzes) {
            const quizzes = JSON.parse(storedQuizzes);
            const foundQuiz = quizzes.find((q: any) => q.id === quizId);
            
            if (foundQuiz) {
              quiz = {
                id: foundQuiz.id,
                title: foundQuiz.title,
                description: foundQuiz.description || '',
                duration: foundQuiz.duration,
                created: foundQuiz.created,
                questions: Array.isArray(foundQuiz.questions) ? foundQuiz.questions : []
              };
              usedLocalStorage = true;
              console.log(`Found quiz in localStorage: ${quiz.title}`);
            } else {
              console.error(`Quiz not found in localStorage: ${quizId}`);
              throw new Error('Quiz not found');
            }
          } else {
            console.error(`No quizzes found in localStorage`);
            throw new Error('Quiz not found');
          }
        } else {
          // Format the Supabase quiz data to match our app's format
          quiz = {
            id: quizId,
            title: quizData.title,
            description: quizData.description || '',
            duration: quizData.time_limit,
            timeLimit: quizData.time_limit,
            created: quizData.created_at
          };
          console.log(`Found quiz in Supabase: ${quiz.title}`);
        }

        setState(prev => ({ 
          ...prev, 
          quiz, 
          stage: 'loading-questions',
          fallbackActive: usedLocalStorage
        }));
        
        // Now load questions
        await loadQuestions(quizId, quiz, usedLocalStorage);
      } catch (error) {
        console.error(`Error loading quiz: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setState(prev => ({ 
          ...prev, 
          error: `Failed to load quiz: ${error instanceof Error ? error.message : 'Unknown error'}`, 
          loading: false,
          stage: 'error',
          retryLoading
        }));
      }
    };

    const loadQuestions = async (quizId: string, quiz: QuizData, usedLocalStorage: boolean) => {
      console.log(`Loading questions for quiz: ${quizId}`);
      
      let questions: Question[] = [];
      let loadedFromFallback = usedLocalStorage;
      
      // First, check if the quiz object already contains questions
      if (quiz && Array.isArray(quiz.questions) && quiz.questions.length > 0) {
        console.log(`Quiz object already contains ${quiz.questions.length} questions`);
        questions = ensureValidQuestionTypes(quiz.questions);
        loadedFromFallback = true;
      } else {
        try {
          if (!usedLocalStorage) {
            // First, try to load from Supabase
            const { data: questionsData, error: questionsError } = await supabase
              .from('questions')
              .select(`
                id, text, type, points, required,
                options(id, text, is_correct)
              `)
              .eq('quiz_id', quizId)
              .order('order_number', { ascending: true });

            if (questionsError) {
              console.log(`Supabase error on questions, trying localStorage: ${questionsError.message}`);
              setState(prev => ({ 
                ...prev, 
                loadingStage: 'local' 
              }));
            } else if (questionsData && questionsData.length > 0) {
              // Format Supabase question data to match our app's format
              questions = questionsData.map(q => ({
                id: q.id,
                text: q.text,
                type: ensureValidQuestionType(q.type),
                options: q.options.map((o: any) => ({
                  id: o.id,
                  text: o.text,
                  isCorrect: o.is_correct
                })),
                points: q.points,
                required: q.required
              }));
              console.log(`Found ${questions.length} questions in Supabase`);
            }
          }
          
          // If no questions found in Supabase, try localStorage
          if (questions.length === 0) {
            setState(prev => ({ 
              ...prev, 
              loadingStage: 'local',
              fallbackActive: true
            }));
            
            // Try all possible storage keys
            const possibleKeys = [
              `quiz_questions_${quizId}`,
              `quiz_creator_questions_${quizId}`
            ];
            
            for (const key of possibleKeys) {
              const storedQuestions = localStorage.getItem(key);
              if (storedQuestions) {
                try {
                  const parsedQuestions = JSON.parse(storedQuestions);
                  if (Array.isArray(parsedQuestions) && parsedQuestions.length > 0) {
                    questions = ensureValidQuestionTypes(parsedQuestions);
                    console.log(`Found ${questions.length} questions in localStorage (${key})`);
                    loadedFromFallback = true;
                    break;
                  }
                } catch (e) {
                  console.error(`Error parsing questions from ${key}:`, e);
                }
              }
            }
          }
          
          // If still no questions, try to look in quiz object
          if (questions.length === 0) {
            // Try to find quizzes in localStorage to check if any contain the full questions
            const storedQuizzes = localStorage.getItem('quizzes');
            if (storedQuizzes) {
              try {
                const quizzes = JSON.parse(storedQuizzes);
                const fullQuiz = quizzes.find((q: any) => q.id === quizId);
                
                if (fullQuiz && Array.isArray(fullQuiz.questions) && fullQuiz.questions.length > 0) {
                  questions = ensureValidQuestionTypes(fullQuiz.questions);
                  console.log(`Found ${questions.length} questions in full quiz object`);
                  loadedFromFallback = true;
                  
                  // Save these questions to localStorage for future use
                  localStorage.setItem(`quiz_questions_${quizId}`, JSON.stringify(questions));
                  
                  // Update the quiz object to include questions
                  if (quiz && !quiz.questions) {
                    quiz.questions = questions;
                  }
                }
              } catch (e) {
                console.error('Error parsing quizzes from localStorage:', e);
              }
            }
          }
          
          if (questions.length === 0) {
            throw new Error('No questions found for this quiz');
          }
        } catch (error) {
          console.error(`Error loading questions: ${error instanceof Error ? error.message : 'Unknown error'}`);
          setState(prev => ({ 
            ...prev, 
            error: `Failed to load questions: ${error instanceof Error ? error.message : 'Unknown error'}`, 
            loading: false,
            stage: 'error',
            retryLoading,
            fallbackActive: loadedFromFallback
          }));
          return;
        }
      }
      
      // Save loaded questions to localStorage for future access
      try {
        localStorage.setItem(`quiz_questions_${quizId}`, JSON.stringify(questions));
        console.log(`Saved ${questions.length} questions to localStorage for future access`);
        
        // Also update the quiz object in localStorage to include questions
        const storedQuizzes = localStorage.getItem('quizzes');
        if (storedQuizzes) {
          const quizzes = JSON.parse(storedQuizzes);
          const updatedQuizzes = quizzes.map((q: any) => {
            if (q.id === quizId) {
              return { ...q, questions: questions };
            }
            return q;
          });
          localStorage.setItem('quizzes', JSON.stringify(updatedQuizzes));
        }
      } catch (e) {
        console.error('Error saving questions to localStorage:', e);
      }

      // Ensure the quiz object includes the questions
      if (quiz && (!quiz.questions || quiz.questions.length === 0)) {
        quiz.questions = questions;
      }

      // Successfully loaded everything
      setState({ 
        quiz, 
        questions, 
        loading: false, 
        error: null,
        stage: 'ready',
        retryLoading,
        loadingStage: loadedFromFallback ? 'local' : 'database',
        fallbackActive: loadedFromFallback
      });
    };
    
    loadQuiz();
  }, [quizId]);

  return state;
};

// Helper function to ensure question type is valid
function ensureValidQuestionType(type: string): "multiple-choice" | "true-false" | "short-answer" | "long-answer" {
  const validTypes = ['multiple-choice', 'true-false', 'short-answer', 'long-answer'];
  return validTypes.includes(type) 
    ? type as "multiple-choice" | "true-false" | "short-answer" | "long-answer"
    : "multiple-choice";
}

// Helper function to validate a full question array
function ensureValidQuestionTypes(questions: any[]): Question[] {
  return questions.map(q => ({
    ...q,
    id: q.id || `question-${Math.random().toString(36).substr(2, 9)}`,
    text: q.text || 'Unknown question',
    type: ensureValidQuestionType(q.type),
    options: Array.isArray(q.options) ? q.options.map((o: any) => ({
      ...o,
      id: o.id || `option-${Math.random().toString(36).substr(2, 9)}`,
      text: o.text || '',
      isCorrect: Boolean(o.isCorrect)
    })) : [],
    points: Number(q.points) || 1,
    required: q.required !== undefined ? Boolean(q.required) : true
  }));
}
