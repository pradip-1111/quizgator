
import React from 'react';
import { Progress } from '@/components/ui/progress';

type QuizProgressProps = {
  answeredCount: number;
  totalQuestions: number;
};

const QuizProgress = ({ answeredCount, totalQuestions }: QuizProgressProps) => {
  // Ensure totalQuestions is at least 1 to prevent division by zero
  const safeTotal = Math.max(1, totalQuestions);
  // Ensure answeredCount doesn't exceed totalQuestions
  const safeAnswered = Math.min(answeredCount, safeTotal);
  const progressPercentage = (safeAnswered / safeTotal) * 100;
  
  return (
    <div className="mb-6">
      <div className="flex justify-between text-sm text-muted-foreground mb-2">
        <span>Progress</span>
        <span>{safeAnswered} of {safeTotal} questions answered</span>
      </div>
      <Progress value={progressPercentage} className="h-2" />
    </div>
  );
};

export default QuizProgress;
