
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { AlertCircle, Clock, User, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

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
  requiresAuth?: boolean;
};

const QuizRegistration = ({
  quiz,
  name,
  setName,
  rollNumber,
  setRollNumber,
  onStartQuiz,
  requiresAuth = false,
}: QuizRegistrationProps) => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 px-4 animate-fade-in">
      <Card className="w-full max-w-md shadow-card">
        <CardHeader>
          <CardTitle className="text-2xl">{quiz.title}</CardTitle>
          <CardDescription>{quiz.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {requiresAuth && !user ? (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-md text-amber-700">
                <div className="flex items-center mb-2">
                  <User className="h-5 w-5 mr-2" />
                  <h3 className="font-medium">Authentication Required</h3>
                </div>
                <p className="text-sm">
                  You need to be logged in to take this quiz. Please log in or create an account.
                </p>
                <div className="mt-4 space-x-2">
                  <Button variant="default" asChild>
                    <Link to="/login">Login</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to="/signup">Sign Up</Link>
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <>
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
                <div className="flex items-center text-muted-foreground">
                  <Lock className="h-4 w-4 mr-1" />
                  <span>Switching tabs or windows is not allowed during the test</span>
                </div>
              </div>
            </>
          )}
        </CardContent>
        <CardFooter>
          {(!requiresAuth || user) && (
            <Button className="w-full" onClick={onStartQuiz}>
              Start Quiz
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default QuizRegistration;
