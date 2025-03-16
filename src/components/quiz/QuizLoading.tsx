
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Database, HardDrive, Server, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface QuizLoadingProps {
  cancelLoading?: () => void;
  message?: string;
  loadingStage?: 'initial' | 'database' | 'local' | 'demo';
  fallbackActive?: boolean;
}

const QuizLoading = ({ 
  cancelLoading, 
  message, 
  loadingStage = 'initial',
  fallbackActive = false
}: QuizLoadingProps) => {
  // Different messages based on the loading stage
  const getLoadingMessage = () => {
    switch (loadingStage) {
      case 'database':
        return "Retrieving your quiz from the database...";
      case 'local':
        return "Loading your quiz from local storage...";
      case 'demo':
        return "Preparing demo quiz content...";
      case 'initial':
      default:
        return "Loading quiz data...";
    }
  };
  
  // Get the appropriate icon based on the loading stage
  const getLoadingIcon = () => {
    switch (loadingStage) {
      case 'database':
        return <Database className="h-6 w-6 text-blue-500 mb-2" />;
      case 'local':
        return <HardDrive className="h-6 w-6 text-green-500 mb-2" />;
      case 'demo':
        return <Server className="h-6 w-6 text-amber-500 mb-2" />;
      default:
        return null;
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-center text-xl">Loading Quiz</CardTitle>
      </CardHeader>
      <CardContent className="py-8">
        <div className="flex flex-col items-center justify-center space-y-4">
          {getLoadingIcon()}
          <div className="h-8 w-8 rounded-full border-4 border-t-blue-500 border-r-transparent border-b-blue-500 border-l-transparent animate-spin"></div>
          <p className="text-lg font-medium text-center">{getLoadingMessage()}</p>
          <p className="text-sm text-muted-foreground text-center">
            {message || "This may take a moment as we retrieve the latest information."}
          </p>
          {fallbackActive && (
            <div className="flex items-center mt-2 text-amber-600">
              <AlertTriangle className="h-4 w-4 mr-2" />
              <p className="text-sm">Using locally stored quiz due to connection issues.</p>
            </div>
          )}
        </div>
      </CardContent>
      
      {cancelLoading && (
        <CardFooter className="flex justify-center">
          <Button variant="ghost" size="sm" onClick={cancelLoading}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Cancel and go back
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default QuizLoading;
