
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Send, AlertTriangle, Shield } from 'lucide-react';

type QuizControlsProps = {
  isLastQuestion: boolean;
  currentQuestion: number;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
  remainingQuestions?: number;
};

const QuizControls = ({
  isLastQuestion,
  currentQuestion,
  onPrevious,
  onNext,
  onSubmit,
  remainingQuestions = 0,
}: QuizControlsProps) => {
  
  return (
    <div className="flex flex-col space-y-2">
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
          <Button 
            onClick={onSubmit} 
            className="bg-green-600 hover:bg-green-700 flex items-center"
          >
            <Send className="h-4 w-4 mr-2" />
            Submit Quiz
          </Button>
        )}
      </div>
      
      {isLastQuestion && remainingQuestions > 0 && (
        <div className="flex items-center justify-center p-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-md">
          <AlertTriangle className="h-4 w-4 mr-2" />
          <span className="text-sm font-medium">
            You have {remainingQuestions} unanswered question{remainingQuestions > 1 ? 's' : ''}. Review before submitting.
          </span>
        </div>
      )}
      
      <div className="flex items-center justify-center p-2 bg-red-50 text-red-700 border border-red-200 rounded-md">
        <Shield className="h-4 w-4 mr-2" />
        <span className="text-sm font-medium">
          The quiz will be automatically submitted if you try to switch tabs or leave the page. All your current answers will be recorded.
        </span>
      </div>
    </div>
  );
};

export default QuizControls;
