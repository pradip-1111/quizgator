
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowLeft, AlertCircle, RefreshCcw, HardDrive } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

type QuizErrorProps = {
  error: string | null;
  onRetry?: () => void;
  isRetryable?: boolean;
  showBackButton?: boolean;
  fallbackAvailable?: boolean;
};

const QuizError = ({ 
  error, 
  onRetry, 
  isRetryable = false, 
  showBackButton = true,
  fallbackAvailable = false
}: QuizErrorProps) => {
  return (
    <Card className="w-full max-w-lg mx-auto shadow-lg">
      <CardHeader className="space-y-1">
        <CardTitle className="flex items-center">
          {fallbackAvailable ? (
            <>
              <HardDrive className="h-5 w-5 mr-2 text-amber-500" />
              <span className="text-amber-600">Using Local Quiz Data</span>
            </>
          ) : (
            <>
              <AlertCircle className="h-5 w-5 mr-2 text-red-600" />
              <span className="text-red-600">Error Loading Quiz</span>
            </>
          )}
        </CardTitle>
        <CardDescription className="text-base">
          {fallbackAvailable 
            ? "There was an issue loading quiz data from the database, but we found a local copy of your quiz."
            : error || "Failed to load quiz. Please try again."}
        </CardDescription>
      </CardHeader>
      
      {isRetryable && (
        <CardContent>
          <Alert variant={fallbackAvailable ? "warning" : "destructive"} className="mb-4">
            <AlertTitle>{fallbackAvailable ? "Local Data Used" : "Connection Issue"}</AlertTitle>
            <AlertDescription>
              {fallbackAvailable 
                ? "We're showing you a locally stored version of the quiz because there was an issue connecting to the server."
                : "There might be an issue with your network connection or the server is temporarily unavailable."}
            </AlertDescription>
          </Alert>
        </CardContent>
      )}
      
      <CardFooter className="flex justify-between">
        {showBackButton && (
          <Link to="/">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        )}
        
        {isRetryable && onRetry && (
          <Button onClick={onRetry}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Retry Connection
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default QuizError;
