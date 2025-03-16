
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
  // Perform more thorough validation of the question object
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

  // Validate required question properties
  if (!question.id || !question.text) {
    console.error("Question is missing required properties:", question);
    return (
      <Card className="mb-8 shadow-subtle border border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">
            Question is incomplete
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">This question is missing required information.</p>
        </CardContent>
      </Card>
    );
  }

  // Make sure options is an array for multiple-choice and true-false questions
  if ((question.type === 'multiple-choice' || question.type === 'true-false') && 
      (!Array.isArray(question.options) || question.options.length === 0)) {
    console.error("Question options are invalid:", question.options);
    
    // Create default options for true-false questions
    if (question.type === 'true-false') {
      question.options = [
        { id: 'true', text: 'True', isCorrect: false },
        { id: 'false', text: 'False', isCorrect: false }
      ];
    }
  }

  // Determine question type with fallback and validation
  const questionType = ['multiple-choice', 'true-false', 'short-answer', 'long-answer'].includes(question.type)
    ? question.type
    : 'multiple-choice';
  
  // Ensure points is a number
  const points = typeof question.points === 'number' ? question.points : 1;
  
  return (
    <>
      <div className="mb-4 flex justify-between items-center">
        <Badge variant="outline" className="bg-primary/10 text-primary">
          Question {questionNumber} of {totalQuestions}
        </Badge>
        <Badge variant="outline">
          {points} {points === 1 ? 'point' : 'points'}
          {question.required && " • Required"}
        </Badge>
      </div>
      
      <Card className="mb-8 shadow-subtle border border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">
            {question.text}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {questionType === 'multiple-choice' && (
            <RadioGroup
              value={answer || ""}
              onValueChange={(value) => onAnswerChange(question.id, value)}
              className="space-y-3"
            >
              {Array.isArray(question.options) && question.options.length > 0 ? (
                question.options.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.id} id={`option-${question.id}-${option.id}`} />
                    <Label htmlFor={`option-${question.id}-${option.id}`} className="cursor-pointer">
                      {option.text || `Option ${option.id}`}
                    </Label>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">No options available for this question</p>
              )}
            </RadioGroup>
          )}
          
          {questionType === 'true-false' && (
            <RadioGroup
              value={answer || ""}
              onValueChange={(value) => onAnswerChange(question.id, value)}
              className="space-y-3"
            >
              {Array.isArray(question.options) && question.options.length > 0 ? (
                question.options.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.id} id={`option-${question.id}-${option.id}`} />
                    <Label htmlFor={`option-${question.id}-${option.id}`} className="cursor-pointer">
                      {option.text}
                    </Label>
                  </div>
                ))
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="true" id={`option-${question.id}-true`} />
                    <Label htmlFor={`option-${question.id}-true`} className="cursor-pointer">True</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="false" id={`option-${question.id}-false`} />
                    <Label htmlFor={`option-${question.id}-false`} className="cursor-pointer">False</Label>
                  </div>
                </div>
              )}
            </RadioGroup>
          )}
          
          {questionType === 'short-answer' && (
            <Input
              placeholder="Type your answer here"
              value={answer || ""}
              onChange={(e) => onAnswerChange(question.id, e.target.value)}
            />
          )}
          
          {questionType === 'long-answer' && (
            <Textarea
              placeholder="Type your answer here"
              rows={8}
              value={answer || ""}
              onChange={(e) => onAnswerChange(question.id, e.target.value)}
            />
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default QuestionItem;
