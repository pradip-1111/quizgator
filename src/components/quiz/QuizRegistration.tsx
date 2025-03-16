
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { QuizData } from '@/types/quiz';

interface QuizRegistrationProps {
  quiz: QuizData;
  name: string;
  setName: (name: string) => void;
  rollNumber: string;
  setRollNumber: (rollNumber: string) => void;
  email: string; // Added email prop
  setEmail: (email: string) => void; // Added setEmail prop
  onStartQuiz: () => void;
  requiresAuth: boolean;
}

const QuizRegistration: React.FC<QuizRegistrationProps> = ({
  quiz,
  name,
  setName,
  rollNumber,
  setRollNumber,
  email, // Add email
  setEmail, // Add setEmail
  onStartQuiz,
  requiresAuth
}) => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 animate-fade-in">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">{quiz.title}</CardTitle>
          <CardDescription>
            {quiz.description || "Enter your details to start the quiz"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="rollNumber">Student ID</Label>
            <Input
              id="rollNumber"
              placeholder="Enter your student ID"
              value={rollNumber}
              onChange={(e) => setRollNumber(e.target.value)}
              required
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full"
            />
          </div>
          
          <div className="pt-2">
            <p className="text-sm text-muted-foreground">
              This quiz contains {quiz.questions?.length || 0} questions.
              {quiz.timeLimit > 0 && ` You will have ${quiz.timeLimit} minutes to complete it.`}
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={onStartQuiz} 
            className="w-full"
            disabled={!name || !rollNumber || !email} // Add email validation
          >
            Start Quiz
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default QuizRegistration;
