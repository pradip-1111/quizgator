
import React from 'react';

type QuizNavigationProps = {
  questions: Array<{
    id: string;
    required: boolean;
  }>;
  currentQuestionIndex: number;
  answers: Record<string, any>;
  onQuestionSelect: (index: number) => void;
};

const QuizNavigation = ({
  questions,
  currentQuestionIndex,
  answers,
  onQuestionSelect,
}: QuizNavigationProps) => {
  // Ensure questions has the right shape before rendering
  const validQuestions = Array.isArray(questions) ? questions : [];
  
  // Debug log questions array
  console.log("QuizNavigation received questions:", validQuestions, "currentIndex:", currentQuestionIndex);
  
  return (
    <footer className="border-t border-border bg-card py-4 px-4 sticky bottom-0">
      <div className="container mx-auto max-w-3xl">
        <div className="flex flex-wrap gap-2 justify-center">
          {validQuestions.map((q, index) => (
            <button
              key={q.id}
              onClick={() => onQuestionSelect(index)}
              className={`h-8 w-8 flex items-center justify-center rounded-full text-sm font-medium 
                ${index === currentQuestionIndex 
                  ? 'bg-primary text-white' 
                  : answers[q.id] 
                    ? 'bg-green-100 text-green-800 border border-green-200' 
                    : 'bg-secondary text-secondary-foreground'
                } 
                ${q.required && !answers[q.id] && index !== currentQuestionIndex 
                  ? 'ring-2 ring-red-400' 
                  : ''
                }`}
              aria-label={`Go to question ${index + 1}`}
              title={answers[q.id] ? "Answered" : q.required ? "Required" : "Optional"}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>
    </footer>
  );
};

export default QuizNavigation;
