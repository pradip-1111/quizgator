
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Check, Mail, Trophy } from 'lucide-react';

const QuizComplete = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/20 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-4 text-center">
          <h1 className="text-3xl font-bold text-foreground">Quiz Completed</h1>
          <p className="text-muted-foreground">Thank you for your submission</p>
        </div>
        
        <Card className="w-full shadow-card border-primary/10 animate-scale-in">
          <CardHeader className="text-center pb-4 relative">
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 h-24 w-24 rounded-full bg-gradient-to-br from-green-100 to-green-50 border-4 border-white dark:border-gray-800 flex items-center justify-center shadow-sm">
              <Trophy className="h-12 w-12 text-green-600" />
            </div>
            <div className="mt-10">
              <CardTitle className="text-2xl mb-1">Submission Successful!</CardTitle>
              <CardDescription>Your answers have been recorded</CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6 px-6">
            <div className="flex items-center justify-center">
              <div className="w-full h-1 bg-gradient-to-r from-green-300 via-green-500 to-primary rounded-full" />
            </div>
            
            <div className="bg-card p-4 rounded-lg border border-border flex items-start gap-4">
              <div className="h-10 w-10 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                <Check className="h-5 w-5 text-green-600" />
              </div>
              <div className="space-y-1">
                <h3 className="font-medium">Quiz Complete</h3>
                <p className="text-sm text-muted-foreground">
                  You have successfully completed this quiz. Your responses have been saved.
                </p>
              </div>
            </div>
            
            <div className="bg-card p-4 rounded-lg border border-border flex items-start gap-4">
              <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                <Mail className="h-5 w-5 text-blue-600" />
              </div>
              <div className="space-y-1">
                <h3 className="font-medium">Confirmation Email</h3>
                <p className="text-sm text-muted-foreground">
                  A confirmation email has been sent to your registered email address. You will receive your results once they have been processed.
                </p>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col gap-4 px-6 pb-6">
            <div className="w-full pt-2 border-t border-border" />
            <Link to="/" className="w-full">
              <Button variant="default" className="w-full group">
                <ArrowLeft className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-1" />
                Return to Home
              </Button>
            </Link>
          </CardFooter>
        </Card>
        
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            If you have any questions, please contact your instructor.
          </p>
        </div>
      </div>
    </div>
  );
};

export default QuizComplete;
