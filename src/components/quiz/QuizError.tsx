
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowLeft, AlertCircle, RefreshCcw } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

type QuizErrorProps = {
  error: string | null;
  onRetry?: () => void;
  isRetryable?: boolean;
};

const QuizError = ({ error, onRetry, isRetryable = false }: QuizErrorProps) => {
  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center text-red-600">
          <AlertCircle className="h-5 w-5 mr-2" />
          Error Loading Quiz
        </CardTitle>
        <CardDescription className="text-base">
          {error || "Failed to load quiz. Please try again."}
        </CardDescription>
      </CardHeader>
      
      {isRetryable && (
        <CardContent>
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Connection Issue</AlertTitle>
            <AlertDescription>
              There might be an issue with your network connection or the server is temporarily unavailable.
            </AlertDescription>
          </Alert>
        </CardContent>
      )}
      
      <CardFooter className="flex justify-between">
        <Link to="/">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>
        
        {isRetryable && onRetry && (
          <Button onClick={onRetry}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default QuizError;
