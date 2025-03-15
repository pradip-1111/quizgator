
import React from 'react';
import { Progress } from '@/components/ui/progress';

type QuizProgressProps = {
  answeredCount: number;
  totalQuestions: number;
};

const QuizProgress = ({ answeredCount, totalQuestions }: QuizProgressProps) => {
  const progressPercentage = (answeredCount / totalQuestions) * 100;
  
  return (
    <div className="mb-6">
      <div className="flex justify-between text-sm text-muted-foreground mb-2">
        <span>Progress</span>
        <span>{answeredCount} of {totalQuestions} questions answered</span>
      </div>
      <Progress value={progressPercentage} className="h-2" />
    </div>
  );
};

export default QuizProgress;
