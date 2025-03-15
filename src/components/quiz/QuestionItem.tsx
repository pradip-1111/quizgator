
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type QuestionOption = {
  id: string;
  text: string;
  isCorrect: boolean;
};

type QuestionItemProps = {
  question: {
    id: string;
    text: string;
    type: 'multiple-choice' | 'true-false' | 'short-answer' | 'long-answer';
    options: QuestionOption[];
    points: number;
    required: boolean;
  };
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
  return (
    <>
      <div className="mb-4 flex justify-between items-center">
        <Badge variant="outline" className="bg-primary/10 text-primary">
          Question {questionNumber} of {totalQuestions}
        </Badge>
        <Badge variant="outline">
          {question.points} points
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
          {question.type === 'multiple-choice' && (
            <RadioGroup
              value={answer || ""}
              onValueChange={(value) => onAnswerChange(question.id, value)}
              className="space-y-3"
            >
              {question.options.map((option) => (
                <div key={option.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.id} id={`option-${option.id}`} />
                  <Label htmlFor={`option-${option.id}`} className="cursor-pointer">
                    {option.text}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}
          
          {question.type === 'true-false' && (
            <RadioGroup
              value={answer || ""}
              onValueChange={(value) => onAnswerChange(question.id, value)}
              className="space-y-3"
            >
              {question.options.map((option) => (
                <div key={option.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.id} id={`option-${option.id}`} />
                  <Label htmlFor={`option-${option.id}`} className="cursor-pointer">
                    {option.text}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}
          
          {question.type === 'short-answer' && (
            <Input
              placeholder="Type your answer here"
              value={answer || ""}
              onChange={(e) => onAnswerChange(question.id, e.target.value)}
            />
          )}
          
          {question.type === 'long-answer' && (
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
