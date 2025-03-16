
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, RefreshCcw, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface QuizErrorProps {
  error: Error | string | null;
  onRetry?: () => void;
  isRetryable?: boolean;
  fallbackAvailable?: boolean;
}

const QuizError = ({ 
  error, 
  onRetry, 
  isRetryable = false,
  fallbackAvailable = false
}: QuizErrorProps) => {
  const errorMessage = error instanceof Error ? error.message : error;
  
  return (
    <Card className="w-full max-w-lg mx-auto shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-center text-xl text-destructive">
          Quiz Loading Error
        </CardTitle>
      </CardHeader>
      <CardContent className="py-6">
        <div className="space-y-4">
          {fallbackAvailable ? (
            <Alert variant="warning">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Connection Issue</AlertTitle>
              <AlertDescription>
                There was a problem connecting to the server, but we found a locally stored version of this quiz.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error Loading Quiz</AlertTitle>
              <AlertDescription>
                {errorMessage || "There was an error loading the quiz. Please try again later."}
              </AlertDescription>
            </Alert>
          )}
          
          {fallbackAvailable && (
            <p className="text-sm text-center text-muted-foreground">
              The quiz will continue with locally stored questions.
            </p>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-center space-x-3">
        <Link to="/">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Home
          </Button>
        </Link>
        
        {isRetryable && onRetry && (
          <Button onClick={onRetry} size="sm">
            <RefreshCcw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default QuizError;
