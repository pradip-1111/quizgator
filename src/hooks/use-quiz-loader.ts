
import { useState, useEffect } from 'react';
import { Question, Quiz, QuizData } from '@/types/quiz';
import { useToast } from '@/hooks/use-toast';

export function useQuizLoader(quizId: string | undefined) {
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const { toast } = useToast();
  
  useEffect(() => {
    console.log("Loading quiz with ID:", quizId);
    const loadQuiz = async () => {
      setLoading(true);
      setError(null);
      setQuestions([]);
      
      try {
        if (!quizId) {
          setError("Quiz ID is missing");
          setLoading(false);
          return;
        }
        
        const storedQuizzes = localStorage.getItem('quizzes');
        
        if (!storedQuizzes) {
          console.error("No quizzes found in localStorage");
          setError("No quizzes found. Please create a quiz first.");
          setLoading(false);
          return;
        }
        
        const quizzes = JSON.parse(storedQuizzes) as Quiz[];
        console.log("All quizzes:", quizzes);
        
        const foundQuiz = quizzes.find(q => q.id === quizId);
        
        if (!foundQuiz) {
          console.error("Quiz not found with ID:", quizId);
          setError(`Quiz with ID ${quizId} not found`);
          setLoading(false);
          return;
        }
        
        console.log("Found quiz:", foundQuiz);
        
        const creatorQuestionsKey = `quiz_creator_questions_${quizId}`;
        const storedQuestionsByCreator = localStorage.getItem(creatorQuestionsKey);
        
        let quizQuestions: Question[] = [];
        
        if (storedQuestionsByCreator) {
          console.log("Found stored questions created by quiz author");
          try {
            const parsedQuestions = JSON.parse(storedQuestionsByCreator);
            
            if (Array.isArray(parsedQuestions) && parsedQuestions.length > 0) {
              console.log("Successfully parsed creator questions:", parsedQuestions);
              quizQuestions = parsedQuestions;
              
              localStorage.setItem(`quiz_questions_${quizId}`, JSON.stringify(quizQuestions));
            } else {
              console.error("Creator questions were found but not valid:", parsedQuestions);
              quizQuestions = generateSampleQuestions(foundQuiz.questions || 1);
            }
          } catch (error) {
            console.error("Error parsing creator questions:", error);
            quizQuestions = generateSampleQuestions(foundQuiz.questions || 1);
          }
        } else {
          console.log("No creator questions found, checking for previously stored questions");
          
          const storedQuestions = localStorage.getItem(`quiz_questions_${quizId}`);
          
          if (storedQuestions) {
            try {
              const parsedQuestions = JSON.parse(storedQuestions);
              if (Array.isArray(parsedQuestions) && parsedQuestions.length > 0) {
                console.log("Found previously stored questions");
                quizQuestions = parsedQuestions;
              } else {
                console.log("Previously stored questions not valid, generating samples");
                quizQuestions = generateSampleQuestions(foundQuiz.questions || 1);
                
                localStorage.setItem(`quiz_questions_${quizId}`, JSON.stringify(quizQuestions));
                localStorage.setItem(creatorQuestionsKey, JSON.stringify(quizQuestions));
              }
            } catch (error) {
              console.error("Error parsing stored questions:", error);
              quizQuestions = generateSampleQuestions(foundQuiz.questions || 1);
            }
          } else {
            console.log("No stored questions found, generating samples");
            quizQuestions = generateSampleQuestions(foundQuiz.questions || 1);
            
            localStorage.setItem(`quiz_questions_${quizId}`, JSON.stringify(quizQuestions));
            localStorage.setItem(creatorQuestionsKey, JSON.stringify(quizQuestions));
          }
        }
        
        console.log("Final quiz questions to display:", quizQuestions);
        
        if (!quizQuestions || quizQuestions.length === 0) {
          console.error("No questions found for quiz");
          setError("No questions found for this quiz");
          setLoading(false);
          return;
        }
        
        const validatedQuestions = quizQuestions.map(q => ({
          id: q.id || `q-${Math.random().toString(36).substring(2, 9)}`,
          text: q.text || "Untitled Question",
          type: (q.type && ['multiple-choice', 'true-false', 'short-answer', 'long-answer'].includes(q.type)) 
            ? q.type 
            : 'multiple-choice',
          options: Array.isArray(q.options) ? q.options : [],
          points: typeof q.points === 'number' ? q.points : 10,
          required: Boolean(q.required)
        }));
        
        setQuestions(validatedQuestions);
        setQuiz({
          id: foundQuiz.id,
          title: foundQuiz.title, 
          description: foundQuiz.description,
          timeLimit: foundQuiz.duration,
          questions: validatedQuestions
        });
        
        console.log("Quiz setup complete:", { 
          title: foundQuiz.title, 
          questions: validatedQuestions.length 
        });
      } catch (error) {
        console.error('Error loading quiz:', error);
        setError("Failed to load quiz data");
      } finally {
        setLoading(false);
      }
    };

    loadQuiz();
  }, [quizId]);

  const generateSampleQuestions = (count: number): Question[] => {
    console.log(`Generating ${count} sample questions`);
    const questionTypes = ['multiple-choice', 'true-false', 'short-answer', 'long-answer'];
    const questions: Question[] = [];
    
    for (let i = 0; i < count; i++) {
      const type = questionTypes[i % questionTypes.length] as 'multiple-choice' | 'true-false' | 'short-answer' | 'long-answer';
      
      let options = [];
      if (type === 'multiple-choice') {
        options = [
          { id: '1', text: 'Option A', isCorrect: i === 0 },
          { id: '2', text: 'Option B', isCorrect: false },
          { id: '3', text: 'Option C', isCorrect: false },
          { id: '4', text: 'Option D', isCorrect: false }
        ];
      } else if (type === 'true-false') {
        options = [
          { id: '1', text: 'True', isCorrect: false },
          { id: '2', text: 'False', isCorrect: true }
        ];
      } else {
        options = [];
      }
      
      questions.push({
        id: `${i + 1}`,
        text: `Question ${i + 1}: This is a sample ${type} question.`,
        type,
        options,
        points: 10,
        required: i < (count - 1)
      });
    }
    
    console.log(`Generated questions:`, questions);
    return questions;
  };
  
  return {
    quiz,
    loading,
    error,
    questions,
    setQuiz,
    setLoading,
    setError,
    setQuestions,
    generateSampleQuestions,
  };
}
