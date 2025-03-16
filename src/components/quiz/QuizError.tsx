
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home, Database } from 'lucide-react';
import { Link } from 'react-router-dom';

interface QuizErrorProps {
  error: string;
  onRetry?: () => void;
  isRetryable?: boolean;
  fallbackActive?: boolean;
  onClearCache?: () => void;
  onDebug?: () => void;
}

const QuizError = ({ 
  error, 
  onRetry, 
  isRetryable = false,
  fallbackActive = false,
  onClearCache,
  onDebug
}: QuizErrorProps) => {
  return (
    <Card className="w-full max-w-lg mx-auto shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-center text-xl flex items-center justify-center">
          <AlertTriangle className="h-6 w-6 text-red-500 mr-2" />
          Quiz Error
        </CardTitle>
      </CardHeader>
      <CardContent className="py-6">
        <div className="flex flex-col items-center justify-center space-y-4">
          <p className="text-center text-red-600 font-medium">{error}</p>
          
          {fallbackActive && (
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-md w-full">
              <p className="text-sm text-amber-800">
                <span className="font-medium">Note:</span> We attempted to load a fallback version of this quiz but encountered issues.
              </p>
            </div>
          )}
          
          <div className="text-center mt-4">
            <p className="text-sm text-gray-600">
              Please try again later or contact support if the problem persists.
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-wrap justify-center gap-3">
        <Link to="/">
          <Button variant="outline">
            <Home className="mr-2 h-4 w-4" />
            Go Home
          </Button>
        </Link>
        
        {isRetryable && onRetry && (
          <Button variant="default" onClick={onRetry}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry Loading
          </Button>
        )}
        
        {onClearCache && (
          <Button variant="destructive" onClick={onClearCache}>
            Clear Cache
          </Button>
        )}
        
        {onDebug && (
          <Button variant="ghost" onClick={onDebug}>
            <Database className="mr-2 h-4 w-4" />
            Debug Quiz
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default QuizError;

