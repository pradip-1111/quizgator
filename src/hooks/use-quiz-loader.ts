
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Question, QuizData } from '@/types/quiz';
import { generateUuid } from '@/utils/uuid-utils';

interface QuizLoaderState {
  quiz: QuizData | null;
  questions: Question[];
  loading: boolean;
  error: string | null;
  stage: 'idle' | 'loading-quiz' | 'loading-questions' | 'ready' | 'error';
  retryLoading: () => void;
  loadingStage?: 'initial' | 'database' | 'local' | 'demo' | 'fallback';
  fallbackActive?: boolean;
}

export const clearQuizCache = (quizId?: string) => {
  console.log("Clearing quiz cache", quizId ? `for quiz ${quizId}` : "for all quizzes");
  
  try {
    if (quizId) {
      localStorage.removeItem(`quiz_questions_${quizId}`);
      localStorage.removeItem(`quiz_creator_questions_${quizId}`);
      localStorage.removeItem(`quiz_results_${quizId}`);
      
      const storedQuizzes = localStorage.getItem('quizzes');
      if (storedQuizzes) {
        try {
          const quizzes = JSON.parse(storedQuizzes);
          const updatedQuizzes = quizzes.filter((q: any) => q.id !== quizId);
          localStorage.setItem('quizzes', JSON.stringify(updatedQuizzes));
        } catch (e) {
          console.error("Error updating quizzes array:", e);
        }
      }
    } else {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('quiz') || key === 'quizzes')) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
    }
    
    return true;
  } catch (e) {
    console.error("Error clearing quiz cache:", e);
    return false;
  }
};

export const useQuizLoader = (quizId: string | undefined) => {
  const [state, setState] = useState<QuizLoaderState>({
    quiz: null,
    questions: [],
    loading: true,
    error: null,
    stage: 'idle',
    loadingStage: 'initial',
    fallbackActive: false,
    retryLoading: () => {}
  });

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
    setState(prev => ({
      ...prev,
      retryLoading
    }));
  }, [quizId]);

  useEffect(() => {
    if (!quizId) {
      setState(prev => ({
        ...prev,
        error: 'No quiz ID provided',
        loading: false,
        stage: 'error',
        retryLoading
      }));
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
        // First try to load the quiz from Supabase
        const { data: quizData, error } = await supabase
          .from('quizzes')
          .select('title, description, time_limit, created_at')
          .eq('id', quizId)
          .maybeSingle();

        let quiz: QuizData | null = null;
        let usedLocalStorage = false;
        
        if (error || !quizData) {
          console.log(`Supabase error or no data: ${error?.message || 'No data returned'}`);
          setState(prev => ({ 
            ...prev, 
            loadingStage: 'local' 
          }));
          
          // Try to load from localStorage as a backup
          try {
            const storedQuizzes = localStorage.getItem('quizzes');
            if (storedQuizzes) {
              try {
                const quizzes = JSON.parse(storedQuizzes);
                
                if (!Array.isArray(quizzes)) {
                  throw new Error('Invalid quiz data in localStorage: not an array');
                }
                
                const foundQuiz = quizzes.find((q: any) => q.id === quizId);
                
                if (foundQuiz) {
                  if (typeof foundQuiz !== 'object' || foundQuiz === null) {
                    throw new Error('Invalid quiz data in localStorage: quiz is not an object');
                  }
                  
                  quiz = {
                    id: foundQuiz.id || quizId,
                    title: foundQuiz.title || 'Untitled Quiz',
                    description: foundQuiz.description || '',
                    duration: foundQuiz.duration || foundQuiz.timeLimit || 30,
                    timeLimit: foundQuiz.duration || foundQuiz.timeLimit || 30,
                    created: foundQuiz.created || new Date().toISOString(),
                    questions: Array.isArray(foundQuiz.questions) ? foundQuiz.questions : []
                  };
                  usedLocalStorage = true;
                  console.log(`Found quiz in localStorage: ${quiz.title}`);
                } else {
                  // If quiz not found in localStorage, throw an error
                  throw new Error(`Quiz with ID ${quizId} not found in localStorage`);
                }
              } catch (e) {
                console.error('Error parsing quizzes from localStorage:', e);
                throw new Error(`Invalid quiz data in localStorage: ${e instanceof Error ? e.message : 'Unknown error'}`);
              }
            } else {
              throw new Error('No quizzes found in localStorage');
            }
          } catch (localError) {
            console.log(`LocalStorage error: ${localError instanceof Error ? localError.message : 'Unknown error'}`);
            
            // If quiz not found in database or localStorage, show a clear error
            throw new Error(`Quiz with ID ${quizId} not found. Please make sure the quiz exists and try again.`);
          }
        } else {
          quiz = {
            id: quizId,
            title: quizData.title || 'Untitled Quiz',
            description: quizData.description || '',
            duration: quizData.time_limit || 30,
            timeLimit: quizData.time_limit || 30,
            created: quizData.created_at || new Date().toISOString()
          };
          console.log(`Found quiz in Supabase: ${quiz.title}`);
        }

        if (!quiz) {
          throw new Error(`Quiz with ID ${quizId} not found. The quiz may have been deleted or does not exist.`);
        }

        setState(prev => ({ 
          ...prev, 
          quiz, 
          stage: 'loading-questions',
          fallbackActive: usedLocalStorage,
          loadingStage: usedLocalStorage ? 'local' : 'database'
        }));
        
        await loadQuestions(quizId, quiz, usedLocalStorage);
      } catch (error) {
        console.error(`Error loading quiz: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setState(prev => ({ 
          ...prev, 
          error: `${error instanceof Error ? error.message : 'Failed to load quiz'}`, 
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
      
      if (quiz && Array.isArray(quiz.questions) && quiz.questions.length > 0) {
        console.log(`Quiz object already contains ${quiz.questions.length} questions`);
        questions = ensureValidQuestionTypes(quiz.questions);
        loadedFromFallback = true;
      } else {
        try {
          if (!usedLocalStorage) {
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
          
          if (questions.length === 0) {
            setState(prev => ({ 
              ...prev, 
              loadingStage: 'local',
              fallbackActive: true
            }));
            
            // Try to load questions from localStorage
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
          
          if (questions.length === 0) {
            const storedQuizzes = localStorage.getItem('quizzes');
            if (storedQuizzes) {
              try {
                const quizzes = JSON.parse(storedQuizzes);
                const fullQuiz = quizzes.find((q: any) => q.id === quizId);
                
                if (fullQuiz && Array.isArray(fullQuiz.questions) && fullQuiz.questions.length > 0) {
                  questions = ensureValidQuestionTypes(fullQuiz.questions);
                  console.log(`Found ${questions.length} questions in full quiz object`);
                  loadedFromFallback = true;
                  
                  localStorage.setItem(`quiz_questions_${quizId}`, JSON.stringify(questions));
                  
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
            throw new Error(`No questions found for quiz ${quizId}. Please make sure the quiz has questions.`);
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
      
      try {
        localStorage.setItem(`quiz_questions_${quizId}`, JSON.stringify(questions));
        console.log(`Saved ${questions.length} questions to localStorage for future access`);
        
        const storedQuizzes = localStorage.getItem('quizzes');
        if (storedQuizzes) {
          try {
            const quizzes = JSON.parse(storedQuizzes);
            const updatedQuizzes = quizzes.map((q: any) => {
              if (q.id === quizId) {
                return { ...q, questions: questions };
              }
              return q;
            });
            localStorage.setItem('quizzes', JSON.stringify(updatedQuizzes));
          } catch (e) {
            console.error('Error updating quizzes array:', e);
            
            const newQuizzes = [{
              ...quiz,
              questions
            }];
            localStorage.setItem('quizzes', JSON.stringify(newQuizzes));
          }
        } else {
          const newQuizzes = [{
            ...quiz,
            questions
          }];
          localStorage.setItem('quizzes', JSON.stringify(newQuizzes));
        }
      } catch (e) {
        console.error('Error saving questions to localStorage:', e);
      }

      if (quiz && (!quiz.questions || quiz.questions.length === 0)) {
        quiz.questions = questions;
      }

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

function ensureValidQuestionType(type: string): "multiple-choice" | "true-false" | "short-answer" | "long-answer" {
  const validTypes = ['multiple-choice', 'true-false', 'short-answer', 'long-answer'];
  return validTypes.includes(type) 
    ? type as "multiple-choice" | "true-false" | "short-answer" | "long-answer"
    : "multiple-choice";
}

function ensureValidQuestionTypes(questions: any[]): Question[] {
  return questions.map(q => ({
    ...q,
    id: q.id || `question-${generateUuid()}`,
    text: q.text || 'Unknown question',
    type: ensureValidQuestionType(q.type),
    options: Array.isArray(q.options) ? q.options.map((o: any) => ({
      ...o,
      id: o.id || `option-${generateUuid()}`,
      text: o.text || '',
      isCorrect: Boolean(o.isCorrect)
    })) : [],
    points: Number(q.points) || 1,
    required: q.required !== undefined ? Boolean(q.required) : true
  }));
}
