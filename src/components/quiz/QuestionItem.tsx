
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
  // Early return if question is not properly loaded
  if (!question || !question.id) {
    console.error("Question not properly loaded", question);
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

  console.log("Rendering question:", question, "Answer:", answer);

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
              {question.options && question.options.length > 0 ? (
                question.options.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.id} id={`option-${question.id}-${option.id}`} />
                    <Label htmlFor={`option-${question.id}-${option.id}`} className="cursor-pointer">
                      {option.text}
                    </Label>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">No options available for this question</p>
              )}
            </RadioGroup>
          )}
          
          {question.type === 'true-false' && (
            <RadioGroup
              value={answer || ""}
              onValueChange={(value) => onAnswerChange(question.id, value)}
              className="space-y-3"
            >
              {question.options && question.options.length > 0 ? (
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
