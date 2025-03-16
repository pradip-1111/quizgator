import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Clock, FileText, Users, Link as LinkIcon, BarChart, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { Question, QuestionType } from '@/types/quiz';

export type Quiz = {
  id: string;
  userId: string;
  title: string;
  description: string;
  questions: number | any[]; // Can be either a count or array of questions
  duration: number; // in minutes
  created: string; // ISO date string
  attempts: number;
  status: 'draft' | 'active' | 'completed';
};

type QuizCardProps = {
  quiz: Quiz;
  onCopyLink: (id: string) => void;
  onDelete?: (id: string) => void;
};

const QuizCard: React.FC<QuizCardProps> = ({ quiz, onCopyLink, onDelete }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const statusColor = {
    draft: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    active: 'bg-green-100 text-green-800 border-green-200',
    completed: 'bg-blue-100 text-blue-800 border-blue-200',
  }[quiz.status];

  // Get the absolute quiz URL
  const getQuizUrl = () => {
    return `${window.location.origin}/take-quiz/${quiz.id}`;
  };

  // Ensure question type is valid according to our type definition
  const validateQuestionType = (question: any): Question => {
    const validTypes = ['multiple-choice', 'true-false', 'short-answer', 'long-answer'];
    const type = validTypes.includes(question.type) ? question.type : 'multiple-choice';
    
    return {
      id: question.id || `question-${Math.random().toString(36).substr(2, 9)}`,
      text: question.text || 'Unknown question',
      type: type as QuestionType,
      options: Array.isArray(question.options) 
        ? question.options.map((o: any) => ({
            id: o.id || `option-${Math.random().toString(36).substr(2, 9)}`,
            text: o.text || '',
            isCorrect: Boolean(o.isCorrect)
          })) 
        : [],
      points: Number(question.points) || 1,
      required: question.required !== undefined ? Boolean(question.required) : true
    };
  };

  // Function to find quiz questions from all possible sources
  const findQuizQuestions = (quizId: string): any[] => {
    console.log(`Looking for questions for quiz: ${quizId}`);
    
    // If quiz.questions is an array, it contains the actual questions
    if (Array.isArray(quiz.questions) && quiz.questions.length > 0) {
      console.log(`Quiz object contains questions array with ${quiz.questions.length} questions`);
      return quiz.questions;
    }
    
    // Try all possible storage locations
    const sources = [
      `quiz_creator_questions_${quizId}`,
      `quiz_questions_${quizId}`
    ];
    
    for (const source of sources) {
      try {
        const storedQuestions = localStorage.getItem(source);
        if (storedQuestions) {
          const parsedQuestions = JSON.parse(storedQuestions);
          if (Array.isArray(parsedQuestions) && parsedQuestions.length > 0) {
            console.log(`Found ${parsedQuestions.length} questions in ${source}`);
            return parsedQuestions;
          }
        }
      } catch (err) {
        console.error(`Error parsing questions from ${source}:`, err);
      }
    }
    
    console.warn(`No questions found for quiz ${quizId} in any storage location.`);
    return [];
  };

  // Create a function to save the quiz to localStorage with improved question handling
  const saveQuizToLocalStorage = () => {
    console.log(`Saving quiz to localStorage: ${quiz.title} with ID: ${quiz.id}`);
    
    // Find questions before saving quiz
    const questions = findQuizQuestions(quiz.id);
    const validatedQuestions = questions.length > 0 
      ? questions.map(validateQuestionType) 
      : [];
    
    // Create a complete quiz object with questions included
    const completeQuiz = {
      ...quiz,
      questions: validatedQuestions.length > 0 ? validatedQuestions : quiz.questions
    };
    
    // Save individual quiz directly with its ID as the key for easier retrieval
    localStorage.setItem(`quiz_${quiz.id}`, JSON.stringify(completeQuiz));
    console.log(`Saved quiz directly with key quiz_${quiz.id}`);
    
    // Save current quiz to quizzes array for backward compatibility
    const storedQuizzesJson = localStorage.getItem('quizzes');
    let quizzes = [];
    
    try {
      quizzes = storedQuizzesJson ? JSON.parse(storedQuizzesJson) : [];
      
      // Ensure quizzes is an array
      if (!Array.isArray(quizzes)) {
        console.warn('Stored quizzes was not an array, creating new array');
        quizzes = [];
      }
    } catch (e) {
      console.error('Error parsing stored quizzes, creating new array', e);
      quizzes = [];
    }
    
    // Remove any existing quiz with the same ID to avoid duplicates
    quizzes = quizzes.filter((q: any) => q.id !== quiz.id);
    
    // Add the current quiz
    quizzes.push(completeQuiz);
    
    // Save the updated quizzes array
    localStorage.setItem('quizzes', JSON.stringify(quizzes));
    console.log(`Saved quiz to quizzes array: ${quiz.title} with ID: ${quiz.id}`);
    
    // Also save questions separately for better accessibility
    if (validatedQuestions.length > 0) {
      localStorage.setItem(`quiz_questions_${quiz.id}`, JSON.stringify(validatedQuestions));
      localStorage.setItem(`quiz_creator_questions_${quiz.id}`, JSON.stringify(validatedQuestions));
      console.log(`Saved ${validatedQuestions.length} questions in separate storage for quiz ${quiz.id}`);
    }
    
    return completeQuiz;
  };

  // Create a function to handle the copy link action
  const handleCopyLink = () => {
    // Save quiz to localStorage before copying link
    const savedQuiz = saveQuizToLocalStorage();
    
    // Get the full URL for the quiz
    const quizLink = getQuizUrl();
    
    // Copy to clipboard
    navigator.clipboard.writeText(quizLink)
      .then(() => {
        // Call the callback to show toast
        onCopyLink(quiz.id);
        
        // Also show a toast using sonner for direct feedback
        toast.success("Quiz link copied to clipboard", {
          description: "Share this link with your students.",
          duration: 3000,
        });
        
        // Log the link to console for debugging
        console.log("Copied quiz link:", quizLink);
      })
      .catch(err => {
        console.error('Failed to copy quiz link:', err);
        toast.error("Failed to copy quiz link");
      });
  };

  // Navigate to take quiz page
  const handleOpenQuiz = () => {
    // Save quiz to localStorage before opening
    const savedQuiz = saveQuizToLocalStorage();
    
    console.log(`Opening quiz: ${quiz.id} with title: ${quiz.title}`);
    
    // Navigate directly to the quiz page
    navigate(`/take-quiz/${quiz.id}`);
  };

  // Navigate to view results - only available for admin users
  const handleViewResults = () => {
    console.log(`Navigating to view-results/${quiz.id}`);
    navigate(`/view-results/${quiz.id}`);
  };

  // Navigate to edit quiz
  const handleEditQuiz = () => {
    console.log(`Navigating to edit-quiz/${quiz.id}`);
    navigate(`/edit-quiz/${quiz.id}`);
  };
  
  // Handle delete quiz
  const handleDeleteQuiz = () => {
    if (window.confirm(`Are you sure you want to delete "${quiz.title}"? This cannot be undone.`)) {
      if (onDelete) {
        // Delete related data from localStorage
        localStorage.removeItem(`quiz_questions_${quiz.id}`);
        localStorage.removeItem(`quiz_creator_questions_${quiz.id}`);
        localStorage.removeItem(`quiz_results_${quiz.id}`);
        localStorage.removeItem(`quiz_${quiz.id}`);
        
        // Call the delete handler
        onDelete(quiz.id);
      }
    }
  };

  return (
    <Card className="overflow-hidden card-hover animate-scale-in">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">{quiz.title}</CardTitle>
            <CardDescription className="mt-1">{quiz.description}</CardDescription>
          </div>
          <Badge className={`${statusColor} capitalize`}>{quiz.status}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mt-2">
          <div className="flex items-center">
            <FileText className="h-4 w-4 mr-1 text-primary/70" />
            {typeof quiz.questions === 'number' 
              ? `${quiz.questions} questions` 
              : `${quiz.questions.length} questions`}
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1 text-primary/70" />
            {quiz.duration} min
          </div>
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-1 text-primary/70" />
            {quiz.attempts} attempts
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-2 border-t">
        <div className="text-xs text-muted-foreground">
          Created {new Date(quiz.created).toLocaleDateString()}
        </div>
        <div className="flex space-x-2">
          <Button size="sm" variant="outline" onClick={handleCopyLink}>
            <LinkIcon className="h-4 w-4 mr-1" />
            Copy Link
          </Button>
          
          <Button size="sm" variant="outline" onClick={handleOpenQuiz}>
            <LinkIcon className="h-4 w-4 mr-1" />
            Open
          </Button>
          
          {user && user.role === 'admin' && (
            <>
              <Button size="sm" variant="outline" onClick={handleViewResults}>
                <BarChart className="h-4 w-4 mr-1" />
                Results
              </Button>
              
              <Button size="sm" onClick={handleEditQuiz}>
                Edit
              </Button>
              
              <Button size="sm" variant="destructive" onClick={handleDeleteQuiz}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default QuizCard;
