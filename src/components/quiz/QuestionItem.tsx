
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Question } from '@/types/quiz';

type QuestionItemProps = {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  answer: any;
  onAnswerChange: (questionId: string, value: any) => void;
};

const QuestionItem = ({
  question,
  questionNumber,
  totalQuestions,
  answer,
  onAnswerChange,
}: QuestionItemProps) => {
  console.log("Rendering question:", question); // Debug log to see question data
  
  // Check if question is null, undefined, or not an object
  if (!question || typeof question !== 'object') {
    console.error("Question is null, undefined, or not an object:", question);
    return (
      <Card className="mb-8 shadow-subtle border border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">
            Question not available
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">This question could not be loaded correctly.</p>
        </CardContent>
      </Card>
    );
  }

  // Create a safe question copy with defaults for all required properties
  const safeQuestion = {
    id: question.id || `question-${questionNumber}`,
    text: question.text || `Question ${questionNumber}`,
    type: (question.type && ['multiple-choice', 'true-false', 'short-answer', 'long-answer'].includes(question.type)) 
      ? question.type 
      : 'multiple-choice',
    options: Array.isArray(question.options) ? question.options : [],
    points: typeof question.points === 'number' ? question.points : 10,
    required: Boolean(question.required)
  };
  
  console.log("Safe question:", safeQuestion); // Debug log for the processed question

  // Provide default options for question types that need them
  if ((safeQuestion.type === 'multiple-choice' || safeQuestion.type === 'true-false') && 
      safeQuestion.options.length === 0) {
    
    if (safeQuestion.type === 'true-false') {
      safeQuestion.options = [
        { id: 'true', text: 'True', isCorrect: false },
        { id: 'false', text: 'False', isCorrect: false }
      ];
    } else {
      // Default options for multiple choice
      safeQuestion.options = [
        { id: '1', text: 'Option 1', isCorrect: false },
        { id: '2', text: 'Option 2', isCorrect: false },
        { id: '3', text: 'Option 3', isCorrect: false },
        { id: '4', text: 'Option 4', isCorrect: false }
      ];
    }
  }
  
  return (
    <>
      <div className="mb-4 flex justify-between items-center">
        <Badge variant="outline" className="bg-primary/10 text-primary">
          Question {questionNumber} of {totalQuestions}
        </Badge>
        <Badge variant="outline">
          {safeQuestion.points} {safeQuestion.points === 1 ? 'point' : 'points'}
          {safeQuestion.required && " • Required"}
        </Badge>
      </div>
      
      <Card className="mb-8 shadow-subtle border border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">
            {safeQuestion.text}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {safeQuestion.type === 'multiple-choice' && (
            <RadioGroup
              value={answer || ""}
              onValueChange={(value) => onAnswerChange(safeQuestion.id, value)}
              className="space-y-3"
            >
              {safeQuestion.options.length > 0 ? (
                safeQuestion.options.map((option) => (
                  <div key={option.id || Math.random().toString()} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.id || ""} id={`option-${safeQuestion.id}-${option.id || Math.random()}`} />
                    <Label 
                      htmlFor={`option-${safeQuestion.id}-${option.id || Math.random()}`} 
                      className="cursor-pointer"
                    >
                      {option.text || `Option ${option.id}`}
                    </Label>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">No options available for this question</p>
              )}
            </RadioGroup>
          )}
          
          {safeQuestion.type === 'true-false' && (
            <RadioGroup
              value={answer || ""}
              onValueChange={(value) => onAnswerChange(safeQuestion.id, value)}
              className="space-y-3"
            >
              {safeQuestion.options.length > 0 ? (
                safeQuestion.options.map((option) => (
                  <div key={option.id || Math.random().toString()} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.id || ""} id={`option-${safeQuestion.id}-${option.id || Math.random()}`} />
                    <Label 
                      htmlFor={`option-${safeQuestion.id}-${option.id || Math.random()}`} 
                      className="cursor-pointer"
                    >
                      {option.text || (option.id === 'true' ? 'True' : 'False')}
                    </Label>
                  </div>
                ))
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="true" id={`option-${safeQuestion.id}-true`} />
                    <Label htmlFor={`option-${safeQuestion.id}-true`} className="cursor-pointer">True</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="false" id={`option-${safeQuestion.id}-false`} />
                    <Label htmlFor={`option-${safeQuestion.id}-false`} className="cursor-pointer">False</Label>
                  </div>
                </div>
              )}
            </RadioGroup>
          )}
          
          {safeQuestion.type === 'short-answer' && (
            <Input
              placeholder="Type your answer here"
              value={answer || ""}
              onChange={(e) => onAnswerChange(safeQuestion.id, e.target.value)}
            />
          )}
          
          {safeQuestion.type === 'long-answer' && (
            <Textarea
              placeholder="Type your answer here"
              rows={8}
              value={answer || ""}
              onChange={(e) => onAnswerChange(safeQuestion.id, e.target.value)}
            />
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default QuestionItem;
