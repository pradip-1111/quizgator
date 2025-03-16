
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

const QuizLoading = () => {
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
    </Card>
  );
};

export default QuizLoading;
