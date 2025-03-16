
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Send, AlertTriangle } from 'lucide-react';

type QuizControlsProps = {
  isLastQuestion: boolean;
  currentQuestion: number;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
  tabSwitchWarnings?: number;
  remainingQuestions?: number;
};

const QuizControls = ({
  isLastQuestion,
  currentQuestion,
  onPrevious,
  onNext,
  onSubmit,
  tabSwitchWarnings = 0,
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
            className={`${tabSwitchWarnings >= 2 ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} flex items-center`}
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
      
      {tabSwitchWarnings > 0 && (
        <div className={`
          flex items-center justify-center p-2 
          ${tabSwitchWarnings === 1 ? 'bg-amber-50 text-amber-700 border-amber-200' : 
           tabSwitchWarnings === 2 ? 'bg-orange-50 text-orange-700 border-orange-200' : 
           'bg-red-50 text-red-700 border-red-200'}
          border rounded-md ${tabSwitchWarnings >= 2 ? 'animate-pulse' : ''}
        `}>
          <AlertTriangle className={`h-4 w-4 mr-2 ${tabSwitchWarnings >= 2 ? 'animate-bounce' : ''}`} />
          <span className="text-sm font-medium">
            {tabSwitchWarnings === 1 && "Warning: First violation detected! Stay in the quiz."}
            {tabSwitchWarnings === 2 && "Warning: One more violation will auto-submit your quiz!"}
            {tabSwitchWarnings >= 3 && "Quiz being auto-submitted due to security violations!"}
          </span>
        </div>
      )}
    </div>
  );
};

export default QuizControls;
