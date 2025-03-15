
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

type QuizErrorProps = {
  error: string | null;
};

const QuizError = ({ error }: QuizErrorProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Quiz Not Found</CardTitle>
          <CardDescription>
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
    </div>
  );
};

export default QuizError;
