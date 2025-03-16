
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Clock, FileText, Users, Link as LinkIcon, BarChart, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

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

  // Create a function to save the quiz to localStorage with improved question handling
  const saveQuizToLocalStorage = () => {
    console.log(`Attempting to save quiz to localStorage: ${quiz.title} with ID: ${quiz.id}`);
    
    // Save current quiz to localStorage
    const quizzes = JSON.parse(localStorage.getItem('quizzes') || '[]');
    const existingQuizIndex = quizzes.findIndex((q: any) => q.id === quiz.id);
    
    if (existingQuizIndex === -1) {
      // If not already in localStorage, add it
      quizzes.push(quiz);
    } else {
      // If already in localStorage, update it
      quizzes[existingQuizIndex] = quiz;
    }
    
    localStorage.setItem('quizzes', JSON.stringify(quizzes));
    console.log(`Saved quiz to localStorage: ${quiz.title} with ID: ${quiz.id}`);
    
    // Handle questions - check all possible locations
    const questionLocations = [
      `quiz_creator_questions_${quiz.id}`,
      `quiz_questions_${quiz.id}`
    ];
    
    let questionsFound = false;
    
    // If quiz.questions is an array, it contains the actual questions
    if (Array.isArray(quiz.questions)) {
      console.log(`Quiz object contains questions array with ${quiz.questions.length} questions`);
      
      // Save questions directly to both storage locations
      localStorage.setItem(`quiz_questions_${quiz.id}`, JSON.stringify(quiz.questions));
      localStorage.setItem(`quiz_creator_questions_${quiz.id}`, JSON.stringify(quiz.questions));
      
      console.log(`Saved ${quiz.questions.length} questions for quiz ${quiz.id} from quiz object`);
      questionsFound = true;
    }
    
    if (!questionsFound) {
      // Check each possible storage location for questions
      for (const location of questionLocations) {
        const questions = localStorage.getItem(location);
        
        if (questions) {
          try {
            const parsedQuestions = JSON.parse(questions);
            if (Array.isArray(parsedQuestions) && parsedQuestions.length > 0) {
              console.log(`Found ${parsedQuestions.length} questions in ${location}`);
              
              // Save to both locations to ensure they're available
              localStorage.setItem(`quiz_questions_${quiz.id}`, questions);
              localStorage.setItem(`quiz_creator_questions_${quiz.id}`, questions);
              
              questionsFound = true;
              break;
            }
          } catch (err) {
            console.error(`Error parsing questions from ${location}:`, err);
          }
        }
      }
    }
    
    if (!questionsFound && typeof quiz.questions === 'number') {
      console.warn(`No questions found for quiz ${quiz.id} in any storage location. Quiz only has question count: ${quiz.questions}`);
    }
  };

  // Create a function to handle the copy link action
  const handleCopyLink = () => {
    // Save quiz to localStorage before copying link
    saveQuizToLocalStorage();
    
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
    saveQuizToLocalStorage();
    
    console.log(`Opening quiz: ${quiz.id} with title: ${quiz.title}`);
    
    // Navigate directly
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
            {quiz.questions} questions
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
