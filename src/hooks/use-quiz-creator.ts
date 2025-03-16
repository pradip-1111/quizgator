import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Question } from '@/components/QuestionEditor';
import { Quiz } from '@/components/QuizCard';
import { isValidUuid, generateUuid, ensureValidUuid, sanitizeUuidsInObject } from '@/utils/uuid-utils';

export function useQuizCreator() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [quizTitle, setQuizTitle] = useState('');
  const [quizDescription, setQuizDescription] = useState('');
  const [timeLimit, setTimeLimit] = useState('60');
  const [passingScore, setPassingScore] = useState('70');
  const [randomizeQuestions, setRandomizeQuestions] = useState(false);
  const [showResults, setShowResults] = useState(true);
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: generateUuid(),
      text: 'What is the capital of France?',
      type: 'multiple-choice',
      options: [
        { id: generateUuid(), text: 'Paris', isCorrect: true },
        { id: generateUuid(), text: 'London', isCorrect: false },
        { id: generateUuid(), text: 'Berlin', isCorrect: false },
        { id: generateUuid(), text: 'Rome', isCorrect: false }
      ],
      points: 10,
      required: true
    }
  ]);

  const handleAddQuestion = () => {
    const newQuestion: Question = {
      id: generateUuid(),
      text: '',
      type: 'multiple-choice',
      options: [
        { id: generateUuid(), text: 'Option 1', isCorrect: false },
        { id: generateUuid(), text: 'Option 2', isCorrect: false }
      ],
      points: 10,
      required: true
    };
    
    setQuestions([...questions, newQuestion]);
  };

  const handleUpdateQuestion = (updatedQuestion: Question) => {
    const safeQuestion = sanitizeUuidsInObject({
      ...updatedQuestion,
      id: ensureValidUuid(updatedQuestion.id),
      options: updatedQuestion.options ? [...updatedQuestion.options] : []
    });
    
    setQuestions(questions.map(q => 
      q.id === updatedQuestion.id ? safeQuestion : q
    ));
  };

  const handleDeleteQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const validateQuiz = (): { valid: boolean; message?: string } => {
    if (!quizTitle) {
      return {
        valid: false,
        message: "Please provide a title for your quiz"
      };
    }

    if (questions.length === 0) {
      return {
        valid: false,
        message: "Your quiz must have at least one question"
      };
    }

    return { valid: true };
  };

  const saveQuizWithQuestions = async (status: 'draft' | 'active') => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to save a quiz",
        variant: "destructive",
      });
      return;
    }
    
    const userId = isValidUuid(user.id) ? user.id : generateUuid();
    console.log("User ID for quiz:", userId);
    
    const validation = validateQuiz();
    if (!validation.valid) {
      toast({
        title: "Error",
        description: validation.message,
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      console.log("Starting quiz save process");
      
      // First, ensure we're logged in with Supabase
      // For now we'll create a temporary session since we're using simulated auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: user.email,
        password: 'temporary-password-for-rls',
      });
      
      if (authError && authError.message !== 'User already registered') {
        throw new Error(`Authentication error: ${authError.message}`);
      }
      
      // Now proceed with saving the quiz
      const quizId = generateUuid();
      console.log("Quiz ID generated:", quizId);
      
      const sanitizedQuestions = questions.map(question => {
        return sanitizeUuidsInObject({
          ...question,
          id: ensureValidUuid(question.id),
          options: question.options ? [...question.options] : []
        });
      });
      
      console.log("Sanitized questions:", JSON.stringify(sanitizedQuestions, null, 2));
      
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .insert({
          id: quizId,
          title: quizTitle,
          description: quizDescription,
          time_limit: parseInt(timeLimit),
          created_by: userId
        })
        .select();
      
      if (quizError) {
        console.error("Error inserting quiz:", quizError);
        throw new Error(`Failed to save quiz: ${quizError.message}`);
      }
      
      console.log("Quiz saved successfully:", quizData);
      
      // Save questions and options as before
      for (let i = 0; i < sanitizedQuestions.length; i++) {
        const question = sanitizedQuestions[i];
        const questionId = question.id;
        
        console.log(`Saving question ${i+1}/${sanitizedQuestions.length} with ID ${questionId}`);
        
        if (!isValidUuid(questionId)) {
          console.error(`Invalid question ID detected: ${questionId}`);
          throw new Error(`Invalid question ID format detected: ${questionId}`);
        }
        
        const { error: questionError } = await supabase
          .from('questions')
          .insert({
            id: questionId,
            quiz_id: quizId,
            text: question.text,
            type: question.type,
            points: question.points,
            required: question.required,
            order_number: i
          });
        
        if (questionError) {
          console.error(`Error inserting question ${i+1}:`, questionError);
          throw new Error(`Failed to save question ${i+1}: ${questionError.message}`);
        }
        
        if (question.options && question.options.length > 0) {
          const optionsToInsert = question.options.map((opt, index) => {
            const optionId = ensureValidUuid(opt.id);
            console.log(`Option ${index} ID: ${optionId} for question ${questionId}`);
            
            if (!isValidUuid(optionId)) {
              throw new Error(`Invalid option ID format: ${optionId}`);
            }
            
            return {
              id: optionId,
              question_id: questionId,
              text: opt.text,
              is_correct: opt.isCorrect,
              order_number: index
            };
          });
          
          console.log(`Saving ${optionsToInsert.length} options for question ${i+1}`);
          
          optionsToInsert.forEach((opt, idx) => {
            console.log(`Option ${idx} to insert:`, JSON.stringify(opt));
          });
          
          const { error: optionsError } = await supabase
            .from('options')
            .insert(optionsToInsert);
          
          if (optionsError) {
            console.error(`Error inserting options for question ${i+1}:`, optionsError);
            throw new Error(`Failed to save options for question ${i+1}: ${optionsError.message}`);
          }
        }
      }
      
      // Save to local storage for fallback
      const newQuiz: Quiz = {
        id: quizId,
        userId: userId,
        title: quizTitle,
        description: quizDescription,
        questions: questions.length,
        duration: parseInt(timeLimit),
        created: new Date().toISOString(),
        attempts: 0,
        status: status
      };
      
      const existingQuizzes = JSON.parse(localStorage.getItem('quizzes') || '[]');
      localStorage.setItem('quizzes', JSON.stringify([...existingQuizzes, newQuiz]));
      
      const questionsKey = `quiz_creator_questions_${quizId}`;
      localStorage.setItem(questionsKey, JSON.stringify(sanitizedQuestions));
      localStorage.setItem(`quiz_questions_${quizId}`, JSON.stringify(sanitizedQuestions));
      
      toast({
        title: status === 'active' ? "Quiz published" : "Draft saved",
        description: status === 'active' 
          ? "Your quiz is now live and ready to share" 
          : "Your quiz has been saved as a draft",
      });
      
      navigate('/admin-dashboard');
    } catch (error) {
      console.error('Error saving quiz:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save quiz. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    await saveQuizWithQuestions('draft');
  };

  const handlePublishQuiz = async () => {
    await saveQuizWithQuestions('active');
  };

  return {
    quizTitle, setQuizTitle,
    quizDescription, setQuizDescription,
    timeLimit, setTimeLimit,
    passingScore, setPassingScore,
    randomizeQuestions, setRandomizeQuestions,
    showResults, setShowResults,
    loading, setLoading,
    questions, setQuestions,
    handleAddQuestion,
    handleUpdateQuestion,
    handleDeleteQuestion,
    handleSaveDraft,
    handlePublishQuiz
  };
}
