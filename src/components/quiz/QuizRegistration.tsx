
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { AlertCircle, Clock } from 'lucide-react';

type QuizRegistrationProps = {
  quiz: {
    title: string;
    description: string;
    timeLimit: number;
  };
  name: string;
  setName: (name: string) => void;
  rollNumber: string;
  setRollNumber: (rollNumber: string) => void;
  onStartQuiz: () => void;
};

const QuizRegistration = ({
  quiz,
  name,
  setName,
  rollNumber,
  setRollNumber,
  onStartQuiz,
}: QuizRegistrationProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 px-4 animate-fade-in">
      <Card className="w-full max-w-md shadow-card">
        <CardHeader>
          <CardTitle className="text-2xl">{quiz.title}</CardTitle>
          <CardDescription>{quiz.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input 
              id="name" 
              placeholder="Enter your full name" 
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="roll">Roll Number / Student ID</Label>
            <Input 
              id="roll" 
              placeholder="Enter your roll number" 
              value={rollNumber}
              onChange={(e) => setRollNumber(e.target.value)}
            />
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex items-center text-muted-foreground">
              <Clock className="h-4 w-4 mr-1" />
              <span>Time limit: {quiz.timeLimit} minutes</span>
            </div>
            <div className="flex items-center text-muted-foreground">
              <AlertCircle className="h-4 w-4 mr-1" />
              <span>Once started, the quiz will enter fullscreen mode</span>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={onStartQuiz}>
            Start Quiz
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default QuizRegistration;
