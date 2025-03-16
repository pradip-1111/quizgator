
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, RefreshCcw, AlertTriangle, Database, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface QuizErrorProps {
  error: Error | string | null;
  onRetry?: () => void;
  isRetryable?: boolean;
  fallbackAvailable?: boolean;
  onClearCache?: () => void;
}

const QuizError = ({ 
  error, 
  onRetry, 
  isRetryable = false,
  fallbackAvailable = false,
  onClearCache
}: QuizErrorProps) => {
  const { toast } = useToast();
  const errorMessage = error instanceof Error ? error.message : String(error);
  const isLocalStorageError = errorMessage.toLowerCase().includes('localstorage') || 
                             errorMessage.toLowerCase().includes('local storage') ||
                             errorMessage.toLowerCase().includes('no quizzes found');
  
  const isQuizNotFoundError = errorMessage.toLowerCase().includes('not found') ||
                              errorMessage.toLowerCase().includes('no quiz');
  
  const handleRetry = () => {
    if (onRetry) {
      console.log("Retrying quiz load...");
      onRetry();
      toast({
        title: "Retrying",
        description: "Attempting to load the quiz again",
      });
    }
  };
  
  const handleClearCache = () => {
    if (onClearCache) {
      console.log("Clearing quiz cache...");
      onClearCache();
      toast({
        title: "Cache Cleared",
        description: "Quiz cache has been cleared and page will reload",
      });
    } else {
      // Default clear cache behavior if no handler provided
      try {
        // Clear quiz-related localStorage items
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('quiz_') || key.includes('quiz'))) {
            keysToRemove.push(key);
          }
        }
        
        // Also clear the 'quizzes' entry specifically
        keysToRemove.push('quizzes');
        
        keysToRemove.forEach(key => localStorage.removeItem(key));
        console.log(`Cleared ${keysToRemove.length} quiz-related items from cache`);
        
        toast({
          title: "Cache Cleared",
          description: `Cleared ${keysToRemove.length} quiz-related items from cache`
        });
        
        // Reload the page after clearing
        setTimeout(() => window.location.reload(), 1000);
      } catch (e) {
        console.error("Failed to clear cache:", e);
        toast({
          title: "Error",
          description: "Failed to clear cache",
          variant: "destructive",
        });
      }
    }
  };
  
  return (
    <Card className="w-full max-w-lg mx-auto shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-center text-xl text-destructive">
          {isQuizNotFoundError ? "Quiz Not Found" : "Quiz Loading Error"}
        </CardTitle>
      </CardHeader>
      <CardContent className="py-6">
        <div className="space-y-4">
          {fallbackAvailable ? (
            <Alert variant="default" className="bg-yellow-50 border-yellow-200 text-yellow-800">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Connection Issue</AlertTitle>
              <AlertDescription>
                There was a problem connecting to the server, but we found a locally stored version of this quiz.
              </AlertDescription>
            </Alert>
          ) : isQuizNotFoundError ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Quiz Not Found</AlertTitle>
              <AlertDescription>
                {errorMessage || "The quiz you are looking for could not be found."}
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
          
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
            <h3 className="text-sm font-medium mb-2">Troubleshooting Tips:</h3>
            <ul className="text-sm space-y-2">
              {isQuizNotFoundError ? (
                <>
                  <li className="flex items-start">
                    <span className="mr-2 text-primary">•</span>
                    <span>Make sure you're using the correct quiz link</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-primary">•</span>
                    <span>Check if the quiz has been deleted or unpublished</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-primary">•</span>
                    <span>If you're the quiz creator, try re-publishing the quiz</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-primary">•</span>
                    <span>Return to the dashboard and select a valid quiz</span>
                  </li>
                </>
              ) : (
                <>
                  <li className="flex items-start">
                    <span className="mr-2 text-primary">•</span>
                    <span>Check that you're using the correct quiz link</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-primary">•</span>
                    <span>The quiz may have been deleted or is not available</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-primary">•</span>
                    <span>If the quiz was recently created, the creator may need to save it again</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-primary">•</span>
                    <span>Try clearing your browser cache and reloading the page</span>
                  </li>
                </>
              )}
              {isLocalStorageError && (
                <li className="flex items-start text-destructive">
                  <span className="mr-2 text-destructive">•</span>
                  <span>Your locally stored data appears to be corrupted or missing. Try clearing the quiz cache with the button below.</span>
                </li>
              )}
            </ul>
          </div>
          
          {isLocalStorageError && (
            <div className="bg-red-50 p-4 rounded-md border border-red-200 animate-pulse">
              <p className="text-sm text-red-700 font-medium">
                We recommend clearing your quiz cache to resolve this issue. This will remove any corrupted quiz data.
              </p>
            </div>
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
          <Button onClick={handleRetry} size="sm">
            <RefreshCcw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        )}
        
        {(isLocalStorageError || isQuizNotFoundError) && (
          <Button onClick={handleClearCache} variant="destructive" size="sm">
            <Trash2 className="mr-2 h-4 w-4" />
            Clear Cache
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default QuizError;
