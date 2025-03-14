
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Check, Mail } from 'lucide-react';

const QuizComplete = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 px-4 animate-fade-in">
      <Card className="w-full max-w-md shadow-card text-center">
        <CardHeader>
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Quiz Submitted</CardTitle>
          <CardDescription>Your answers have been recorded successfully</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            A confirmation email has been sent to your registered email address
          </p>
          
          <div className="bg-primary/5 border border-primary/10 rounded-lg p-4 flex items-center">
            <Mail className="h-5 w-5 text-primary mr-3" />
            <div className="text-left">
              <p className="text-sm font-medium">Email Confirmation</p>
              <p className="text-xs text-muted-foreground">
                You will receive your results once the instructor reviews your submission
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link to="/">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Return to Home
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
};

export default QuizComplete;
