
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';

const QuizComplete = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md shadow-lg border-border animate-fade-in">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="h-16 w-16 text-primary" />
          </div>
          <CardTitle className="text-2xl">Quiz Submitted</CardTitle>
          <CardDescription>
            Thank you for completing the quiz
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4 pt-4">
          <p className="text-muted-foreground">
            Your responses have been recorded successfully.
          </p>
          <p className="text-muted-foreground">
            A confirmation has been sent to your registered email address.
          </p>
          <div className="h-1 w-full bg-border/50 rounded-full my-4" />
          <p className="text-sm">
            The quiz administrator will be notified of your submission.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button variant="default" className="w-full" onClick={() => navigate('/')}>
            Return to Home
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default QuizComplete;
