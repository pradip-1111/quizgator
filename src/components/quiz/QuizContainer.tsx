
import React, { useRef } from 'react';
import { Question } from '@/types/quiz';
import { Card, CardContent } from '@/components/ui/card';
import QuizHeader from '@/components/quiz/QuizHeader';
import QuizControls from '@/components/quiz/QuizControls';
import QuizProgress from '@/components/quiz/QuizProgress';
import QuizNavigation from '@/components/quiz/QuizNavigation';
import QuestionItem from '@/components/quiz/QuestionItem';

interface QuizContainerProps {
  quizTitle: string;
  studentName: string;
  studentRollNumber: string;
  timeLeft: number;
  currentQuestion: number;
  totalQuestions: number;
  questions: Question[];
  answers: Record<string, any>;
  onQuit: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
  onQuestionSelect: (index: number) => void;
  onAnswerChange: (questionId: string, value: any) => void;
}

const QuizContainer: React.FC<QuizContainerProps> = ({
  quizTitle,
  studentName,
  studentRollNumber,
  timeLeft,
  currentQuestion,
  totalQuestions,
  questions,
  answers,
  onQuit,
  onPrevious,
  onNext,
  onSubmit,
  onQuestionSelect,
  onAnswerChange
}) => {
  const quizContainerRef = useRef<HTMLDivElement>(null);
  const isLastQuestion = currentQuestion === totalQuestions - 1;
  const remainingQuestions = questions.filter(q => !answers[q.id]).length;
  
  const currentQuestionExists = questions && 
    Array.isArray(questions) && 
    questions.length > 0 && 
    currentQuestion < questions.length;
  
  return (
    <div ref={quizContainerRef} className="min-h-screen bg-background flex flex-col animate-fade-in fullscreen-mode">
      <QuizHeader
        quizTitle={quizTitle}
        studentName={studentName}
        studentRollNumber={studentRollNumber}
        timeLeft={timeLeft}
        onQuit={onQuit}
      />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-3xl">
        <QuizProgress 
          answeredCount={Object.keys(answers).length} 
          totalQuestions={totalQuestions} 
        />
        
        {currentQuestionExists ? (
          <QuestionItem
            question={questions[currentQuestion]}
            questionNumber={currentQuestion + 1}
            totalQuestions={totalQuestions}
            answer={answers[questions[currentQuestion].id]}
            onAnswerChange={onAnswerChange}
          />
        ) : (
          <Card className="mb-8">
            <CardContent className="pt-6">
              <p>There was a problem loading this question. Please contact your instructor.</p>
            </CardContent>
          </Card>
        )}
        
        <QuizControls
          isLastQuestion={isLastQuestion}
          currentQuestion={currentQuestion}
          onPrevious={onPrevious}
          onNext={onNext}
          onSubmit={onSubmit}
          remainingQuestions={remainingQuestions}
        />
      </main>
      
      <QuizNavigation
        questions={questions}
        currentQuestionIndex={currentQuestion}
        answers={answers}
        onQuestionSelect={onQuestionSelect}
      />
    </div>
  );
};

export default QuizContainer;
