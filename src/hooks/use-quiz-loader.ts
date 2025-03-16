
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Question, QuizData } from '@/types/quiz';
import { generateUUID } from '@/utils/uuid-utils';

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

// Create a demo quiz as a fallback when nothing is available
const createDemoQuiz = (quizId: string): QuizData => {
  console.log("Creating demo fallback quiz with ID:", quizId);
  return {
    id: quizId,
    title: "Demo Quiz",
    description: "This is a demo quiz created because no quiz data was found",
    duration: 15,
    timeLimit: 15,
    created: new Date().toISOString(),
    questions: [
      {
        id: "q1",
        text: "What is the capital of France?",
        type: "multiple-choice",
        options: [
          { id: "q1-a", text: "London", isCorrect: false },
          { id: "q1-b", text: "Paris", isCorrect: true },
          { id: "q1-c", text: "Berlin", isCorrect: false },
          { id: "q1-d", text: "Madrid", isCorrect: false }
        ],
        points: 1,
        required: true
      },
      {
        id: "q2",
        text: "What is 2+2?",
        type: "multiple-choice",
        options: [
          { id: "q2-a", text: "3", isCorrect: false },
          { id: "q2-b", text: "4", isCorrect: true },
          { id: "q2-c", text: "5", isCorrect: false },
          { id: "q2-d", text: "6", isCorrect: false }
        ],
        points: 1,
        required: true
      },
      {
        id: "q3",
        text: "The earth is flat.",
        type: "true-false",
        options: [
          { id: "q3-a", text: "True", isCorrect: false },
          { id: "q3-b", text: "False", isCorrect: true }
        ],
        points: 1,
        required: true
      }
    ]
  };
};

// Helper function to clear quiz cache
export const clearQuizCache = (quizId?: string) => {
  console.log("Clearing quiz cache", quizId ? `for quiz ${quizId}` : "for all quizzes");
  
  try {
    if (quizId) {
      // Clear specific quiz data
      localStorage.removeItem(`quiz_questions_${quizId}`);
      localStorage.removeItem(`quiz_creator_questions_${quizId}`);
      localStorage.removeItem(`quiz_results_${quizId}`);
      
      // Update quizzes array to remove this quiz
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
      // Clear all quiz-related data
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
    retryLoading: () => {} // Will be properly defined below
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

  // Make sure retryLoading is properly attached to the state
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
        // Try to load from Supabase first
        const { data: quizData, error } = await supabase
          .from('quizzes')
          .select('title, description, time_limit, created_at')
          .eq('id', quizId)
          .maybeSingle();

        let quiz: QuizData | null = null;
        let usedLocalStorage = false;
        let usedFallback = false;
        
        if (error || !quizData) {
          console.log(`Supabase error or no data, trying localStorage: ${error?.message || 'No data returned'}`);
          setState(prev => ({ 
            ...prev, 
            loadingStage: 'local' 
          }));
          
          // Try to get quiz from localStorage
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
                  throw new Error('Quiz not found in localStorage');
                }
              } catch (e) {
                console.error('Error parsing quizzes from localStorage:', e);
                throw new Error(`Invalid quiz data in localStorage: ${e instanceof Error ? e.message : 'Unknown error'}`);
              }
            } else {
              throw new Error('No quizzes found in localStorage');
            }
          } catch (localError) {
            console.log(`LocalStorage error, creating fallback quiz: ${localError instanceof Error ? localError.message : 'Unknown error'}`);
            
            setState(prev => ({ 
              ...prev, 
              loadingStage: 'fallback'
            }));
            
            // Create a demo quiz as fallback
            quiz = createDemoQuiz(quizId);
            usedFallback = true;
            
            // Save this fallback quiz to localStorage for future use
            try {
              const demoQuizzes = [quiz];
              localStorage.setItem('quizzes', JSON.stringify(demoQuizzes));
              console.log("Saved fallback quiz to localStorage");
            } catch (e) {
              console.error("Failed to save fallback quiz to localStorage:", e);
            }
          }
        } else {
          // Format the Supabase quiz data to match our app's format
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
          throw new Error('Failed to load quiz data from any source');
        }

        setState(prev => ({ 
          ...prev, 
          quiz, 
          stage: 'loading-questions',
          fallbackActive: usedLocalStorage || usedFallback,
          loadingStage: usedFallback ? 'fallback' : (usedLocalStorage ? 'local' : 'database')
        }));
        
        // Now load questions
        await loadQuestions(quizId, quiz, usedLocalStorage, usedFallback);
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

    const loadQuestions = async (quizId: string, quiz: QuizData, usedLocalStorage: boolean, usedFallback: boolean) => {
      console.log(`Loading questions for quiz: ${quizId}`);
      
      let questions: Question[] = [];
      let loadedFromFallback = usedLocalStorage || usedFallback;
      
      // If the fallback quiz was used, it already has questions
      if (usedFallback && quiz && Array.isArray(quiz.questions) && quiz.questions.length > 0) {
        console.log(`Fallback quiz already contains ${quiz.questions.length} questions`);
        questions = ensureValidQuestionTypes(quiz.questions);
      }
      // Check if the quiz object already contains questions from localStorage
      else if (quiz && Array.isArray(quiz.questions) && quiz.questions.length > 0) {
        console.log(`Quiz object already contains ${quiz.questions.length} questions`);
        questions = ensureValidQuestionTypes(quiz.questions);
        loadedFromFallback = true;
      } else {
        try {
          if (!usedLocalStorage && !usedFallback) {
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
          
          // Final fallback - if still no questions, create demo ones
          if (questions.length === 0 && !usedFallback) {
            console.log("No questions found, creating demo questions");
            setState(prev => ({ 
              ...prev, 
              loadingStage: 'fallback'
            }));
            
            // Create demo questions
            const demoQuiz = createDemoQuiz(quizId);
            questions = demoQuiz.questions;
            loadedFromFallback = true;
            
            // Update our quiz with demo title and description if it was loaded from database but has no questions
            if (quiz) {
              quiz.title = demoQuiz.title;
              quiz.description = demoQuiz.description;
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
            
            // If parsing fails, create a new array with just this quiz
            const newQuizzes = [{
              ...quiz,
              questions
            }];
            localStorage.setItem('quizzes', JSON.stringify(newQuizzes));
          }
        } else {
          // If no quizzes array yet, create one
          const newQuizzes = [{
            ...quiz,
            questions
          }];
          localStorage.setItem('quizzes', JSON.stringify(newQuizzes));
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
        loadingStage: usedFallback ? 'fallback' : (loadedFromFallback ? 'local' : 'database'),
        fallbackActive: loadedFromFallback || usedFallback
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
    id: q.id || `question-${generateUUID()}`,
    text: q.text || 'Unknown question',
    type: ensureValidQuestionType(q.type),
    options: Array.isArray(q.options) ? q.options.map((o: any) => ({
      ...o,
      id: o.id || `option-${generateUUID()}`,
      text: o.text || '',
      isCorrect: Boolean(o.isCorrect)
    })) : [],
    points: Number(q.points) || 1,
    required: q.required !== undefined ? Boolean(q.required) : true
  }));
}
