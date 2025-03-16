
import React, { useState } from 'react';
import { Search, AlertCircle } from 'lucide-react';
import { Input } from '../ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
  // State for search query
  const [searchQuery, setSearchQuery] = useState('');
  
  // Ensure questions has the right shape before rendering
  const validQuestions = Array.isArray(questions) ? questions : [];
  
  // Count answered and required questions
  const answeredQuestions = Object.keys(answers).length;
  const requiredQuestions = validQuestions.filter(q => q.required).length;
  const answeredRequiredQuestions = validQuestions
    .filter(q => q.required && answers[q.id])
    .length;
  
  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convert search query to a number and validate
    const questionNumber = parseInt(searchQuery);
    
    if (!isNaN(questionNumber) && questionNumber > 0 && questionNumber <= validQuestions.length) {
      // Convert to zero-based index
      onQuestionSelect(questionNumber - 1);
      setSearchQuery('');
    }
  };
  
  return (
    <footer className="border-t border-border bg-card py-4 px-4 sticky bottom-0 shadow-top">
      <div className="container mx-auto max-w-3xl">
        <div className="flex flex-col gap-3">
          {/* Status bar */}
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>
              Answered: <strong>{answeredQuestions}/{validQuestions.length}</strong>
            </span>
            <span>
              Required: <strong>{answeredRequiredQuestions}/{requiredQuestions}</strong>
            </span>
          </div>
          
          {/* Search form */}
          <form onSubmit={handleSearch} className="flex items-center gap-2 mb-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Go to question #"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 h-9"
              />
            </div>
            <button 
              type="submit"
              className="bg-primary text-white px-3 py-2 rounded-md text-sm hover:bg-primary/90"
            >
              Go
            </button>
          </form>
          
          {/* Question buttons */}
          <div className="flex flex-wrap gap-2 justify-center">
            <TooltipProvider>
              {validQuestions.map((q, index) => {
                // Ensure we have a valid question ID
                const questionId = q.id || `fallback-id-${index}`;
                const isAnswered = !!answers[questionId];
                const isRequired = !!q.required;
                const isCurrent = index === currentQuestionIndex;
                
                return (
                  <Tooltip key={questionId}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => onQuestionSelect(index)}
                        className={`h-8 w-8 flex items-center justify-center rounded-full text-sm font-medium 
                          ${isCurrent 
                            ? 'bg-primary text-white' 
                            : isAnswered 
                              ? 'bg-green-100 text-green-800 border border-green-200' 
                              : 'bg-secondary text-secondary-foreground'
                          } 
                          ${isRequired && !isAnswered && !isCurrent 
                            ? 'ring-2 ring-red-400 relative after:content-["!"] after:absolute after:top-[-5px] after:right-[-5px] after:bg-red-500 after:text-white after:text-xs after:h-4 after:w-4 after:rounded-full after:flex after:items-center after:justify-center' 
                            : ''
                          }`}
                        aria-label={`Go to question ${index + 1}`}
                      >
                        {index + 1}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        Question {index + 1}
                        {isRequired && " (Required)"}
                        {isAnswered ? " - Answered" : " - Not answered"}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </TooltipProvider>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default QuizNavigation;
