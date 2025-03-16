
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { QuizData } from '@/types/quiz';

interface StudentRegistrationProps {
  quiz: QuizData;
  name: string;
  setName: (name: string) => void;
  rollNumber: string;
  setRollNumber: (rollNumber: string) => void;
  email: string;
  setEmail: (email: string) => void;
  onStartQuiz: () => void;
  requiresAuth?: boolean;
}

const StudentRegistration = ({
  quiz,
  name,
  setName,
  rollNumber,
  setRollNumber,
  email,
  setEmail,
  onStartQuiz,
  requiresAuth = false
}: StudentRegistrationProps) => {
  const totalQuestions = Array.isArray(quiz.questions) ? quiz.questions.length : 0;
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card className="shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl">{quiz.title}</CardTitle>
          <CardDescription>
            {quiz.description || "No description provided for this quiz."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 mb-6">
            <div className="flex items-center justify-between text-sm">
              <span>Time allowed:</span>
              <span className="font-medium">{quiz.duration || quiz.timeLimit || 30} minutes</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Number of questions:</span>
              <span className="font-medium">{totalQuestions}</span>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="student-name">Full Name</Label>
              <Input
                id="student-name"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="student-id">Student ID</Label>
              <Input
                id="student-id"
                placeholder="Enter your student ID"
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="student-email">Email</Label>
              <Input
                id="student-email"
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Your quiz results will be sent to this email
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-sm text-muted-foreground">
            <p>Please fill in all fields to start the quiz.</p>
          </div>
          <Button onClick={onStartQuiz}>Start Quiz</Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default StudentRegistration;
