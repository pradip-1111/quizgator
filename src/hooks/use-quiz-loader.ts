
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
      
      // First priority: Check if we have the quiz and its questions in localStorage
      const storedQuizzesString = localStorage.getItem('quizzes');
      let quizFromLocalStorage = null;
      let questionsFromLocalStorage = null;
      
      if (storedQuizzesString) {
        try {
          const storedQuizzes = JSON.parse(storedQuizzesString);
          quizFromLocalStorage = storedQuizzes.find((q: any) => q.id === quizId);
          
          if (quizFromLocalStorage) {
            console.log('Found matching quiz in localStorage:', quizFromLocalStorage.title);
            
            // Check for questions in all possible locations
            const possibleQuestionKeys = [
              `quiz_creator_questions_${quizId}`,
              `quiz_questions_${quizId}`
            ];
            
            // If quiz.questions is an array, it contains the actual questions
            if (Array.isArray(quizFromLocalStorage.questions) && quizFromLocalStorage.questions.length > 0) {
              console.log('Quiz object contains questions array');
              questionsFromLocalStorage = quizFromLocalStorage.questions;
            } else {
              // Check all possible storage locations for questions
              for (const key of possibleQuestionKeys) {
                const storedQuestions = localStorage.getItem(key);
                if (storedQuestions) {
                  try {
                    const parsedQuestions = JSON.parse(storedQuestions);
                    if (Array.isArray(parsedQuestions) && parsedQuestions.length > 0) {
                      console.log(`Found ${parsedQuestions.length} questions in ${key}`);
                      questionsFromLocalStorage = parsedQuestions;
                      break;
                    }
                  } catch (e) {
                    console.error(`Error parsing questions from ${key}:`, e);
                  }
                }
              }
            }
            
            // If we have both quiz and questions, use them
            if (questionsFromLocalStorage) {
              console.log(`Using locally stored quiz with ${questionsFromLocalStorage.length} questions`);
              setLoadingStage('local');
              
              const fullQuiz: QuizData = {
                id: quizFromLocalStorage.id,
                title: quizFromLocalStorage.title,
                description: quizFromLocalStorage.description,
                timeLimit: quizFromLocalStorage.duration || 30,
                questions: questionsFromLocalStorage
              };
              
              // Save this data to both storage locations to ensure it's available next time
              localStorage.setItem(`quiz_questions_${quizId}`, JSON.stringify(questionsFromLocalStorage));
              localStorage.setItem(`quiz_creator_questions_${quizId}`, JSON.stringify(questionsFromLocalStorage));
              
              setQuiz(fullQuiz);
              setQuestions(questionsFromLocalStorage);
              setFallbackActive(true);
              setLoading(false);
              return;
            }
          }
        } catch (e) {
          console.error('Error parsing stored quizzes:', e);
        }
      }
      
      // Second priority: Try to fetch from Supabase
      console.log('Attempting to fetch quiz from Supabase');
      setLoadingStage('database');
      
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', quizId)
        .maybeSingle();
      
      if (quizError) {
        console.error('Error fetching quiz from Supabase:', quizError);
        throw new Error(`Failed to load quiz: ${quizError.message}`);
      }
      
      // If no quiz found in Supabase but we have a quiz in localStorage without questions
      if (!quizData && quizFromLocalStorage) {
        console.log('Quiz not found in Supabase, but found in localStorage without questions');
        setLoadingStage('demo');
        
        // Create a demo quiz with the title and description from localStorage
        const mockQuiz: QuizData = {
          id: quizId,
          title: quizFromLocalStorage.title || 'Demo Quiz',
          description: quizFromLocalStorage.description || 'This is a demo quiz',
          timeLimit: quizFromLocalStorage.duration || 30,
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
            },
            // Add more sample questions
            {
              id: '2',
              text: 'Sample Question 2',
              options: [
                { id: 'a', text: 'Option A', isCorrect: true },
                { id: 'b', text: 'Option B', isCorrect: false }
              ],
              type: 'multiple-choice',
              points: 1,
              required: true
            }
          ]
        };
        
        setQuiz(mockQuiz);
        setQuestions(mockQuiz.questions);
        setLoading(false);
        return;
      }
      
      // If quiz not found in Supabase or localStorage, create a demo quiz
      if (!quizData && !quizFromLocalStorage) {
        console.log('Quiz not found in Supabase or localStorage, creating demo quiz');
        setLoadingStage('demo');
        
        const mockQuiz: QuizData = {
          id: quizId,
          title: 'Demo Quiz',
          description: 'This is a demo quiz with sample questions',
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
      
      // If we have quiz data from Supabase, try to load questions
      if (quizData) {
        console.log('Quiz found in Supabase:', quizData);
        
        // First check if we have questions in localStorage
        const possibleQuestionKeys = [
          `quiz_creator_questions_${quizId}`,
          `quiz_questions_${quizId}`
        ];
        
        let localQuestions = null;
        
        for (const key of possibleQuestionKeys) {
          const storedQuestions = localStorage.getItem(key);
          if (storedQuestions) {
            try {
              const parsedQuestions = JSON.parse(storedQuestions);
              if (Array.isArray(parsedQuestions) && parsedQuestions.length > 0) {
                console.log(`Found ${parsedQuestions.length} questions in ${key}`);
                localQuestions = parsedQuestions;
                break;
              }
            } catch (e) {
              console.error(`Error parsing questions from ${key}:`, e);
            }
          }
        }
        
        // If we have questions in localStorage, use them
        if (localQuestions) {
          console.log('Using questions from localStorage with database quiz');
          
          const fullQuiz: QuizData = {
            id: quizData.id,
            title: quizData.title,
            description: quizData.description,
            timeLimit: quizData.time_limit,
            questions: localQuestions
          };
          
          setQuiz(fullQuiz);
          setQuestions(localQuestions);
          setLoading(false);
          return;
        }
        
        // If no questions in localStorage, fetch from Supabase
        console.log('Fetching questions from Supabase');
        
        const { data: questionsData, error: questionsError } = await supabase
          .from('questions')
          .select('id, text, type, points, required, order_number')
          .eq('quiz_id', quizId)
          .order('order_number');
        
        if (questionsError) {
          console.error('Error fetching questions from Supabase:', questionsError);
          throw new Error(`Failed to load questions: ${questionsError.message}`);
        }
        
        console.log(`Found ${questionsData?.length || 0} questions from database`);
        
        // If no questions in database, use default questions
        if (!questionsData || questionsData.length === 0) {
          console.log('No questions found in database, using default questions');
          
          const defaultQuestions = [
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
            },
            {
              id: '2',
              text: 'Sample Question',
              options: [
                { id: 'a', text: 'Option A', isCorrect: true },
                { id: 'b', text: 'Option B', isCorrect: false }
              ],
              type: 'multiple-choice',
              points: 1,
              required: true
            }
          ];
          
          const fullQuiz: QuizData = {
            id: quizData.id,
            title: quizData.title,
            description: quizData.description,
            timeLimit: quizData.time_limit,
            questions: defaultQuestions
          };
          
          setQuiz(fullQuiz);
          setQuestions(defaultQuestions);
          setLoading(false);
          return;
        }
        
        // For each question, fetch its options
        const questionsWithOptions: Question[] = [];
        
        for (const q of questionsData) {
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
        
        // Save questions to localStorage for future use
        localStorage.setItem(`quiz_questions_${quizId}`, JSON.stringify(questionsWithOptions));
        localStorage.setItem(`quiz_creator_questions_${quizId}`, JSON.stringify(questionsWithOptions));
        
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
      }
      
    } catch (err) {
      console.error('Error loading quiz:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load quiz. Please try again.';
      setError(errorMessage);
      
      // Try to use localStorage as fallback
      const possibleQuestionKeys = [
        `quiz_creator_questions_${quizId}`,
        `quiz_questions_${quizId}`
      ];
      
      let foundFallback = false;
      
      for (const key of possibleQuestionKeys) {
        const storedQuestions = localStorage.getItem(key);
        if (storedQuestions) {
          try {
            const parsedQuestions = JSON.parse(storedQuestions);
            if (Array.isArray(parsedQuestions) && parsedQuestions.length > 0) {
              console.log(`Using ${parsedQuestions.length} questions from ${key} as fallback`);
              
              // Get quiz info from localStorage if available
              const storedQuizzesString = localStorage.getItem('quizzes');
              let fallbackTitle = 'Your Quiz';
              let fallbackDescription = 'Quiz loaded from local storage due to connection issues';
              let fallbackTimeLimit = 30;
              
              if (storedQuizzesString) {
                try {
                  const storedQuizzes = JSON.parse(storedQuizzesString);
                  const matchedQuiz = storedQuizzes.find((q: any) => q.id === quizId);
                  
                  if (matchedQuiz) {
                    fallbackTitle = matchedQuiz.title;
                    fallbackDescription = matchedQuiz.description;
                    fallbackTimeLimit = matchedQuiz.duration || 30;
                  }
                } catch (e) {
                  console.error('Error parsing stored quizzes:', e);
                }
              }
              
              const fallbackQuiz: QuizData = {
                id: quizId,
                title: fallbackTitle,
                description: fallbackDescription,
                timeLimit: fallbackTimeLimit,
                questions: parsedQuestions
              };
              
              setQuiz(fallbackQuiz);
              setQuestions(parsedQuestions);
              setFallbackActive(true);
              foundFallback = true;
              
              toast({
                title: "Using local data",
                description: "Could not connect to the server. Using locally stored quiz.",
                variant: "default"
              });
              
              break;
            }
          } catch (e) {
            console.error(`Error parsing questions from ${key}:`, e);
          }
        }
      }
      
      if (!foundFallback) {
        toast({
          title: "Error",
          description: "Failed to load quiz data",
          variant: "destructive"
        });
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
