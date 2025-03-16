
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type QuizDetailsProps = {
  quizTitle: string;
  setQuizTitle: (title: string) => void;
  quizDescription: string;
  setQuizDescription: (description: string) => void;
  timeLimit: string;
  setTimeLimit: (timeLimit: string) => void;
  passingScore: string;
  setPassingScore: (passingScore: string) => void;
  randomizeQuestions: boolean;
  setRandomizeQuestions: (randomize: boolean) => void;
  showResults: boolean;
  setShowResults: (showResults: boolean) => void;
};

const QuizDetails: React.FC<QuizDetailsProps> = ({
  quizTitle,
  setQuizTitle,
  quizDescription,
  setQuizDescription,
  timeLimit,
  setTimeLimit,
  passingScore,
  setPassingScore,
  randomizeQuestions,
  setRandomizeQuestions,
  showResults,
  setShowResults,
}) => {
  return (
    <Card className="mb-8 shadow-subtle border border-border">
      <CardHeader>
        <CardTitle>Quiz Details</CardTitle>
        <CardDescription>
          Set the basic information for your quiz
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Quiz Title</Label>
          <Input
            id="title"
            placeholder="Enter quiz title"
            value={quizTitle}
            onChange={(e) => setQuizTitle(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description (Optional)</Label>
          <Textarea
            id="description"
            placeholder="Enter a description for your quiz"
            rows={3}
            value={quizDescription}
            onChange={(e) => setQuizDescription(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="time-limit">Time Limit (minutes)</Label>
            <Input
              id="time-limit"
              type="number"
              min="1"
              value={timeLimit}
              onChange={(e) => setTimeLimit(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="passing-score">Passing Score (%)</Label>
            <Input
              id="passing-score"
              type="number"
              min="0"
              max="100"
              value={passingScore}
              onChange={(e) => setPassingScore(e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="flex items-center space-x-2">
            <Switch
              id="randomize"
              checked={randomizeQuestions}
              onCheckedChange={setRandomizeQuestions}
            />
            <Label htmlFor="randomize">Randomize question order</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="show-results"
              checked={showResults}
              onCheckedChange={setShowResults}
            />
            <Label htmlFor="show-results">Show results after submission</Label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuizDetails;
