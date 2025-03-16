
import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '../ui/input';

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
  
  // Debug log questions array and current index
  console.log("QuizNavigation received questions:", validQuestions, "currentIndex:", currentQuestionIndex);
  
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
    <footer className="border-t border-border bg-card py-4 px-4 sticky bottom-0">
      <div className="container mx-auto max-w-3xl">
        <div className="flex flex-col gap-3">
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
              className="bg-primary text-white px-3 py-1.5 rounded-md text-sm hover:bg-primary/90"
            >
              Go
            </button>
          </form>
          
          {/* Question buttons */}
          <div className="flex flex-wrap gap-2 justify-center">
            {validQuestions.map((q, index) => {
              // Ensure we have a valid question ID
              const questionId = q.id || `fallback-id-${index}`;
              const isAnswered = !!answers[questionId];
              const isRequired = !!q.required;
              const isCurrent = index === currentQuestionIndex;
              
              console.log(`Question ${index + 1}:`, { id: questionId, answered: isAnswered, required: isRequired, current: isCurrent });
              
              return (
                <button
                  key={questionId}
                  onClick={() => onQuestionSelect(index)}
                  className={`h-8 w-8 flex items-center justify-center rounded-full text-sm font-medium 
                    ${isCurrent 
                      ? 'bg-primary text-white' 
                      : isAnswered 
                        ? 'bg-green-100 text-green-800 border border-green-200' 
                        : 'bg-secondary text-secondary-foreground'
                    } 
                    ${isRequired && !isAnswered && !isCurrent 
                      ? 'ring-2 ring-red-400' 
                      : ''
                    }`}
                  aria-label={`Go to question ${index + 1}`}
                  title={isAnswered ? "Answered" : isRequired ? "Required" : "Optional"}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default QuizNavigation;
