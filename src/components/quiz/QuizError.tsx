
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';

type QuizErrorProps = {
  error: string | null;
};

const QuizError = ({ error }: QuizErrorProps) => {
  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center text-red-600">
          <AlertCircle className="h-5 w-5 mr-2" />
          Error Loading Quiz
        </CardTitle>
        <CardDescription className="text-base">
          {error || "The quiz you're looking for doesn't exist or has been removed."}
        </CardDescription>
      </CardHeader>
      <CardFooter>
        <Link to="/">
          <Button>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default QuizError;
