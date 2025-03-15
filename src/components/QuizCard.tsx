
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Clock, FileText, Users, Link as LinkIcon, BarChart, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

export type Quiz = {
  id: string;
  userId: string;
  title: string;
  description: string;
  questions: number;
  duration: number; // in minutes
  created: string; // ISO date string
  attempts: number;
  status: 'draft' | 'active' | 'completed';
};

type QuizCardProps = {
  quiz: Quiz;
  onCopyLink: (id: string) => void;
};

const QuizCard: React.FC<QuizCardProps> = ({ quiz, onCopyLink }) => {
  const statusColor = {
    draft: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    active: 'bg-green-100 text-green-800 border-green-200',
    completed: 'bg-blue-100 text-blue-800 border-blue-200',
  }[quiz.status];

  // Get the absolute quiz URL
  const getQuizUrl = () => {
    return `${window.location.origin}/take-quiz/${quiz.id}`;
  };

  // Create a function to handle the copy link action
  const handleCopyLink = () => {
    // Get the full URL for the quiz
    const quizLink = getQuizUrl();
    
    // Copy to clipboard
    navigator.clipboard.writeText(quizLink)
      .then(() => {
        // Call the callback to show toast
        onCopyLink(quiz.id);
        
        // Also show a toast using sonner for direct feedback
        toast.success("Quiz link copied to clipboard", {
          description: quizLink,
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

  // Add questions to localStorage when clicking "Open" to ensure questions are available
  const handleOpenQuiz = () => {
    const questionCount = quiz.questions;
    
    // Generate sample questions for this quiz if they don't already exist
    if (!localStorage.getItem(`quiz_questions_${quiz.id}`)) {
      const questionTypes = ['multiple-choice', 'true-false', 'short-answer', 'long-answer'];
      const questions = [];
      
      for (let i = 0; i < questionCount; i++) {
        const type = questionTypes[i % questionTypes.length];
        
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
        }
        
        questions.push({
          id: `${i + 1}`,
          text: `Question ${i + 1}: This is a sample ${type} question.`,
          type,
          options,
          points: 10,
          required: i < (questionCount - 1)
        });
      }
      
      // Store the questions in localStorage
      localStorage.setItem(`quiz_questions_${quiz.id}`, JSON.stringify(questions));
      console.log(`Stored ${questions.length} questions for quiz ${quiz.id}`);
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
            <Link to={`/take-quiz/${quiz.id}`} className="flex items-center" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-1" />
              Open
            </Link>
          </Button>
          
          <Button size="sm" variant="outline">
            <Link to={`/view-results/${quiz.id}`} className="flex items-center">
              <BarChart className="h-4 w-4 mr-1" />
              Results
            </Link>
          </Button>
          
          <Button size="sm">
            <Link to={`/edit-quiz/${quiz.id}`} className="flex items-center">
              Edit
            </Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default QuizCard;
