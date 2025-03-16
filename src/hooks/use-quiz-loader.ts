
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Question } from '@/types/quiz';

interface QuizLoaderState {
  quiz: any;
  questions: Question[];
  loading: boolean;
  error: string | null;
  stage: 'idle' | 'loading-quiz' | 'loading-questions' | 'ready' | 'error';
}

export const useQuizLoader = (quizId: string | undefined) => {
  const [state, setState] = useState<QuizLoaderState>({
    quiz: null,
    questions: [],
    loading: true,
    error: null,
    stage: 'idle'
  });

  useEffect(() => {
    if (!quizId) {
      setState({
        ...state,
        error: 'No quiz ID provided',
        loading: false,
        stage: 'error'
      });
      return;
    }

    const loadQuiz = async () => {
      console.log(`Loading quiz with ID: ${quizId}`);
      setState(prev => ({ ...prev, loading: true, stage: 'loading-quiz' }));

      try {
        // Try to load from Supabase first
        const { data: quizData, error } = await supabase
          .from('quizzes')
          .select('title, description, time_limit, created_at')
          .eq('id', quizId)
          .single();

        let quiz;
        
        if (error) {
          console.log(`Supabase error, trying localStorage: ${error.message}`);
          // Try to get quiz from localStorage
          const storedQuizzes = localStorage.getItem('quizzes');
          if (storedQuizzes) {
            const quizzes = JSON.parse(storedQuizzes);
            quiz = quizzes.find((q: any) => q.id === quizId);
            
            if (!quiz) {
              console.error(`Quiz not found in localStorage: ${quizId}`);
              throw new Error('Quiz not found');
            }
            
            console.log(`Found quiz in localStorage: ${quiz.title}`);
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
            created: quizData.created_at
          };
          console.log(`Found quiz in Supabase: ${quiz.title}`);
        }

        setState(prev => ({ 
          ...prev, 
          quiz, 
          stage: 'loading-questions'
        }));
        
        // Now load questions
        await loadQuestions(quizId, quiz);
      } catch (error) {
        console.error(`Error loading quiz: ${error.message}`);
        setState(prev => ({ 
          ...prev, 
          error: `Failed to load quiz: ${error.message}`, 
          loading: false,
          stage: 'error'
        }));
      }
    };

    const loadQuestions = async (quizId: string, quiz: any) => {
      console.log(`Loading questions for quiz: ${quizId}`);
      
      let questions: Question[] = [];
      
      // First, check if the quiz object already contains questions
      if (quiz && Array.isArray(quiz.questions) && quiz.questions.length > 0) {
        console.log(`Quiz object already contains ${quiz.questions.length} questions`);
        questions = ensureValidQuestionTypes(quiz.questions);
      } else {
        try {
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
          
          // If no questions found in Supabase, try localStorage
          if (questions.length === 0) {
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
                  
                  // Save these questions to localStorage for future use
                  localStorage.setItem(`quiz_questions_${quizId}`, JSON.stringify(questions));
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
          console.error(`Error loading questions: ${error.message}`);
          setState(prev => ({ 
            ...prev, 
            error: `Failed to load questions: ${error.message}`, 
            loading: false,
            stage: 'error'
          }));
          return;
        }
      }
      
      // Save loaded questions to localStorage for future access
      try {
        localStorage.setItem(`quiz_questions_${quizId}`, JSON.stringify(questions));
        console.log(`Saved ${questions.length} questions to localStorage for future access`);
      } catch (e) {
        console.error('Error saving questions to localStorage:', e);
      }

      // Successfully loaded everything
      setState({ 
        quiz, 
        questions, 
        loading: false, 
        error: null,
        stage: 'ready'
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
    type: ensureValidQuestionType(q.type),
    options: Array.isArray(q.options) ? q.options.map((o: any) => ({
      ...o,
      id: o.id || `option-${Math.random().toString(36).substr(2, 9)}`,
      isCorrect: Boolean(o.isCorrect)
    })) : [],
    points: Number(q.points) || 1,
    required: q.required !== undefined ? Boolean(q.required) : true
  }));
}
