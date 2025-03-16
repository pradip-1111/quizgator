
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Send } from 'lucide-react';

type QuizControlsProps = {
  isLastQuestion: boolean;
  currentQuestion: number;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
};

const QuizControls = ({
  isLastQuestion,
  currentQuestion,
  onPrevious,
  onNext,
  onSubmit,
}: QuizControlsProps) => {
  console.log("QuizControls rendering with:", { isLastQuestion, currentQuestion });
  
  return (
    <div className="flex justify-between">
      <Button
        variant="outline"
        onClick={onPrevious}
        disabled={currentQuestion === 0}
        className="flex items-center"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Previous
      </Button>
      
      {!isLastQuestion ? (
        <Button onClick={onNext} className="flex items-center">
          Next
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      ) : (
        <Button onClick={onSubmit} className="bg-green-600 hover:bg-green-700 flex items-center">
          <Send className="h-4 w-4 mr-2" />
          Submit Quiz
        </Button>
      )}
    </div>
  );
};

export default QuizControls;
