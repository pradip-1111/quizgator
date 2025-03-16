
import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface QuizLoadingProps {
  cancelLoading?: () => void;
}

const QuizLoading = ({ cancelLoading }: QuizLoadingProps) => {
  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardContent className="py-8">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="h-8 w-8 rounded-full border-4 border-t-blue-500 border-r-transparent border-b-blue-500 border-l-transparent animate-spin"></div>
          <p className="text-lg font-medium">Loading quiz data...</p>
          <p className="text-sm text-muted-foreground text-center">
            This may take a moment as we retrieve the latest information.
          </p>
        </div>
      </CardContent>
      
      {cancelLoading && (
        <CardFooter className="flex justify-center">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Cancel and go back
            </Button>
          </Link>
        </CardFooter>
      )}
    </Card>
  );
};

export default QuizLoading;
