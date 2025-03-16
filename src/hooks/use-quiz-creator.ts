
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
      id: crypto.randomUUID(),
      text: 'What is the capital of France?',
      type: 'multiple-choice',
      options: [
        { id: crypto.randomUUID(), text: 'Paris', isCorrect: true },
        { id: crypto.randomUUID(), text: 'London', isCorrect: false },
        { id: crypto.randomUUID(), text: 'Berlin', isCorrect: false },
        { id: crypto.randomUUID(), text: 'Rome', isCorrect: false }
      ],
      points: 10,
      required: true
    }
  ]);

  const handleAddQuestion = () => {
    const newQuestion: Question = {
      id: crypto.randomUUID(),
      text: '',
      type: 'multiple-choice',
      options: [
        { id: crypto.randomUUID(), text: 'Option 1', isCorrect: false },
        { id: crypto.randomUUID(), text: 'Option 2', isCorrect: false }
      ],
      points: 10,
      required: true
    };
    
    setQuestions([...questions, newQuestion]);
  };

  const handleUpdateQuestion = (updatedQuestion: Question) => {
    // Ensure the question and all its options have valid UUIDs
    const safeQuestion = { ...updatedQuestion };
    
    // Validate/fix question ID
    if (!isValidUuid(safeQuestion.id)) {
      console.warn(`Replacing invalid question ID: ${safeQuestion.id}`);
      safeQuestion.id = crypto.randomUUID();
    }
    
    // Validate/fix option IDs
    if (safeQuestion.options) {
      safeQuestion.options = safeQuestion.options.map(opt => {
        if (!isValidUuid(opt.id)) {
          console.warn(`Replacing invalid option ID: ${opt.id}`);
          return { ...opt, id: crypto.randomUUID() };
        }
        return opt;
      });
    }
    
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
      const quizId = crypto.randomUUID();
      
      console.log("Quiz ID generated:", quizId);
      
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
      
      // Save questions one by one to ensure proper UUID handling
      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        
        // Ensure question has a valid UUID
        let questionId = question.id;
        if (!isValidUuid(questionId)) {
          console.warn(`Replacing invalid question ID during save: ${questionId}`);
          questionId = crypto.randomUUID();
        }
        
        console.log(`Saving question ${i+1}/${questions.length} with ID ${questionId}`);
        
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
          // Generate fresh UUIDs for all options and ensure they're valid
          const optionsToInsert = question.options.map((opt, index) => {
            // Validate option ID
            let optionId = opt.id;
            if (!isValidUuid(optionId)) {
              console.warn(`Replacing invalid option ID during save: ${optionId}`);
              optionId = crypto.randomUUID();
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
      localStorage.setItem(questionsKey, JSON.stringify(questions));
      localStorage.setItem(`quiz_questions_${quizId}`, JSON.stringify(questions));
      
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
