
import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, GripVertical, Plus, Check, X } from 'lucide-react';

export type QuestionType = 'multiple-choice' | 'true-false' | 'short-answer' | 'long-answer';

export type Option = {
  id: string;
  text: string;
  isCorrect: boolean;
};

export type Question = {
  id: string;
  text: string;
  type: QuestionType;
  options: Option[];
  points: number;
  required: boolean;
};

type QuestionEditorProps = {
  question: Question;
  onUpdate: (question: Question) => void;
  onDelete: (id: string) => void;
};

const QuestionEditor: React.FC<QuestionEditorProps> = ({ question, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<Question>(question);

  const handleUpdate = () => {
    onUpdate(currentQuestion);
    setIsEditing(false);
  };

  const handleQuestionTypeChange = (type: string) => {
    // If changing to true-false, limit options to just two
    if (type === 'true-false') {
      setCurrentQuestion({
        ...currentQuestion,
        type: type as QuestionType,
        options: [
          { id: '1', text: 'True', isCorrect: false },
          { id: '2', text: 'False', isCorrect: false }
        ]
      });
    } else {
      setCurrentQuestion({
        ...currentQuestion,
        type: type as QuestionType
      });
    }
  };

  const handleAddOption = () => {
    if (currentQuestion.options.length < 10) { // Limit to 10 options
      const newOption: Option = {
        id: Date.now().toString(),
        text: '',
        isCorrect: false
      };
      setCurrentQuestion({
        ...currentQuestion,
        options: [...currentQuestion.options, newOption]
      });
    }
  };

  const handleOptionTextChange = (id: string, text: string) => {
    setCurrentQuestion({
      ...currentQuestion,
      options: currentQuestion.options.map(option => 
        option.id === id ? { ...option, text } : option
      )
    });
  };

  const handleOptionCorrectChange = (id: string, isCorrect: boolean) => {
    setCurrentQuestion({
      ...currentQuestion,
      options: currentQuestion.options.map(option => {
        // If single choice, only one can be correct
        if (currentQuestion.type === 'multiple-choice') {
          return option.id === id ? { ...option, isCorrect } : { ...option, isCorrect: false };
        }
        return option.id === id ? { ...option, isCorrect } : option;
      })
    });
  };

  const handleDeleteOption = (id: string) => {
    setCurrentQuestion({
      ...currentQuestion,
      options: currentQuestion.options.filter(option => option.id !== id)
    });
  };

  return (
    <Card className="mb-6 border border-border shadow-subtle animate-fade-in">
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div className="flex items-center">
          <div className="mr-2 cursor-move">
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </div>
          <CardTitle className="text-lg">
            {isEditing ? (
              <Input
                value={currentQuestion.text}
                onChange={(e) => setCurrentQuestion({ ...currentQuestion, text: e.target.value })}
                placeholder="Enter question text"
                className="text-lg font-medium"
              />
            ) : (
              question.text || 'Untitled Question'
            )}
          </CardTitle>
        </div>
        <div className="flex items-center space-x-2">
          {isEditing ? (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsEditing(false)}
                className="flex items-center text-destructive hover:text-destructive border-destructive/30"
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button 
                variant="default" 
                size="sm" 
                onClick={handleUpdate}
                className="flex items-center"
              >
                <Check className="h-4 w-4 mr-1" />
                Save
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsEditing(true)}
                className="text-sm"
              >
                Edit
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onDelete(question.id)}
                className="text-destructive hover:text-destructive border-destructive/30"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </CardHeader>
      
      {isEditing ? (
        <CardContent className="pb-2">
          {/* Question type selector */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="question-type">Question Type</Label>
              <Select
                value={currentQuestion.type}
                onValueChange={handleQuestionTypeChange}
              >
                <SelectTrigger id="question-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                  <SelectItem value="true-false">True/False</SelectItem>
                  <SelectItem value="short-answer">Short Answer</SelectItem>
                  <SelectItem value="long-answer">Long Answer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="question-points">Points</Label>
              <Input
                id="question-points"
                type="number"
                min="0"
                max="100"
                value={currentQuestion.points}
                onChange={(e) => setCurrentQuestion({ 
                  ...currentQuestion, 
                  points: parseInt(e.target.value) || 0 
                })}
              />
            </div>
          </div>
          
          {/* For multiple choice and true/false questions */}
          {(currentQuestion.type === 'multiple-choice' || currentQuestion.type === 'true-false') && (
            <div className="space-y-4 mt-4">
              <Label>Answer Options</Label>
              
              {currentQuestion.options.map((option, index) => (
                <div key={option.id} className="flex items-center space-x-2">
                  <div className="flex-grow">
                    <Input
                      value={option.text}
                      onChange={(e) => handleOptionTextChange(option.id, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      disabled={currentQuestion.type === 'true-false'}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={option.isCorrect}
                        onCheckedChange={(checked) => handleOptionCorrectChange(option.id, checked)}
                      />
                      <span className="text-sm text-muted-foreground">Correct</span>
                    </div>
                    
                    {currentQuestion.type !== 'true-false' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteOption(option.id)}
                        disabled={currentQuestion.options.length <= 2}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              
              {currentQuestion.type === 'multiple-choice' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddOption}
                  className="mt-2"
                  disabled={currentQuestion.options.length >= 10}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Option
                </Button>
              )}
            </div>
          )}
          
          {/* For short answer or long answer */}
          {(currentQuestion.type === 'short-answer' || currentQuestion.type === 'long-answer') && (
            <div className="space-y-2 mt-4">
              <Label>Answer Preview</Label>
              {currentQuestion.type === 'short-answer' ? (
                <Input disabled placeholder="Short answer text field will appear here" />
              ) : (
                <Textarea disabled placeholder="Long answer text area will appear here" />
              )}
            </div>
          )}
          
          <div className="flex items-center space-x-2 mt-4">
            <Switch
              checked={currentQuestion.required}
              onCheckedChange={(checked) => 
                setCurrentQuestion({ ...currentQuestion, required: checked })
              }
            />
            <Label htmlFor="required">Required question</Label>
          </div>
        </CardContent>
      ) : (
        <CardContent>
          {/* Display version - just show a preview of the question */}
          <div className="text-sm text-muted-foreground mb-2">
            {question.type === 'multiple-choice' && 'Multiple Choice'}
            {question.type === 'true-false' && 'True/False'}
            {question.type === 'short-answer' && 'Short Answer'}
            {question.type === 'long-answer' && 'Long Answer'} 
            {' · '} 
            {question.points} {question.points === 1 ? 'point' : 'points'}
            {question.required && ' · Required'}
          </div>
          
          {/* For multiple choice and true/false questions */}
          {(question.type === 'multiple-choice' || question.type === 'true-false') && (
            <div className="space-y-2 mt-4">
              {question.options.map((option) => (
                <div key={option.id} className="flex items-center space-x-2">
                  <div className="h-4 w-4 rounded-full border border-primary/40 flex items-center justify-center">
                    {option.isCorrect && <div className="h-2 w-2 rounded-full bg-primary" />}
                  </div>
                  <span className={option.isCorrect ? "font-medium" : ""}>{option.text}</span>
                </div>
              ))}
            </div>
          )}
          
          {/* For short answer or long answer */}
          {(question.type === 'short-answer' || question.type === 'long-answer') && (
            <div className="mt-2 text-muted-foreground italic">
              {question.type === 'short-answer' 
                ? "Students will enter a short text answer" 
                : "Students will enter a long text answer"}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default QuestionEditor;
