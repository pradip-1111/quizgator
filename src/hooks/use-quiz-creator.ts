
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Question } from '@/components/QuestionEditor';
import { Quiz } from '@/components/QuizCard';

// UUID validation helper
const isValidUuid = (id: string): boolean => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
};

// Generate a valid UUID
const generateUuid = (): string => {
  return crypto.randomUUID();
};

// Ensure entity has a valid UUID
const ensureValidUuid = (id: string | undefined): string => {
  if (!id || !isValidUuid(id)) {
    return generateUuid();
  }
  return id;
};

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
    // Create a deep copy of the question to avoid reference issues
    const safeQuestion: Question = { 
      ...updatedQuestion,
      id: ensureValidUuid(updatedQuestion.id),
      options: updatedQuestion.options 
        ? updatedQuestion.options.map(opt => ({
            ...opt,
            id: ensureValidUuid(opt.id)
          }))
        : []
    };
    
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
      
      // Generate a fresh UUID for the quiz
      const quizId = generateUuid();
      
      console.log("Quiz ID generated:", quizId);
      
      // Sanitize all questions and options before saving to ensure valid UUIDs
      const sanitizedQuestions = questions.map((question, index) => {
        const sanitizedQuestion = {
          ...question,
          id: ensureValidUuid(question.id)
        };
        
        if (sanitizedQuestion.options) {
          sanitizedQuestion.options = sanitizedQuestion.options.map(opt => ({
            ...opt,
            id: ensureValidUuid(opt.id)
          }));
        }
        
        return sanitizedQuestion;
      });
      
      // Insert the quiz first
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .insert({
          id: quizId,
          title: quizTitle,
          description: quizDescription,
          time_limit: parseInt(timeLimit),
          created_by: user.id
        })
        .select();
      
      if (quizError) {
        console.error("Error inserting quiz:", quizError);
        throw new Error(`Failed to save quiz: ${quizError.message}`);
      }
      
      console.log("Quiz saved successfully:", quizData);
      
      // Save questions one by one to ensure proper handling
      for (let i = 0; i < sanitizedQuestions.length; i++) {
        const question = sanitizedQuestions[i];
        const questionId = question.id;
        
        console.log(`Saving question ${i+1}/${sanitizedQuestions.length} with ID ${questionId}`);
        
        // Double check the UUID is valid before inserting
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
        
        // Save all options for the question if they exist
        if (question.options && question.options.length > 0) {
          const optionsToInsert = question.options.map((opt, index) => {
            // Final validation before database insertion
            const optionId = ensureValidUuid(opt.id);
            
            // Log the option ID for debugging
            console.log(`Option ${index} ID: ${optionId}`);
            
            return {
              id: optionId,
              question_id: questionId,
              text: opt.text,
              is_correct: opt.isCorrect,
              order_number: index
            };
          });
          
          console.log(`Saving ${optionsToInsert.length} options for question ${i+1}`);
          
          const { error: optionsError } = await supabase
            .from('options')
            .insert(optionsToInsert);
          
          if (optionsError) {
            console.error(`Error inserting options for question ${i+1}:`, optionsError);
            throw new Error(`Failed to save options for question ${i+1}: ${optionsError.message}`);
          }
        }
      }
      
      // For backward compatibility, also save to localStorage
      const newQuiz: Quiz = {
        id: quizId,
        userId: user.id,
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
