
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Clock, FileText, Users, Link as LinkIcon, BarChart } from 'lucide-react';

export type Quiz = {
  id: string;
  userId: string; // Add userId to associate quizzes with specific users
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
          <Button size="sm" variant="outline" onClick={() => onCopyLink(quiz.id)}>
            <LinkIcon className="h-4 w-4 mr-1" />
            Copy Link
          </Button>
          <Link to={`/view-results/${quiz.id}`}>
            <Button size="sm" variant="outline">
              <BarChart className="h-4 w-4 mr-1" />
              Results
            </Button>
          </Link>
          <Link to={`/edit-quiz/${quiz.id}`}>
            <Button size="sm">Edit</Button>
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
};

export default QuizCard;
