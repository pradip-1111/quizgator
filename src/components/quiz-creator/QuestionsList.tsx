
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import QuestionEditor, { Question } from '@/components/QuestionEditor';

type QuestionsListProps = {
  questions: Question[];
  onAddQuestion: () => void;
  onUpdateQuestion: (question: Question) => void;
  onDeleteQuestion: (id: string) => void;
};

const QuestionsList: React.FC<QuestionsListProps> = ({
  questions,
  onAddQuestion,
  onUpdateQuestion,
  onDeleteQuestion,
}) => {
  return (
    <>
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Questions</h2>
        <Button onClick={onAddQuestion}>
          <Plus className="h-4 w-4 mr-2" />
          Add Question
        </Button>
      </div>
      
      {questions.length > 0 ? (
        <div className="space-y-4">
          {questions.map((question) => (
            <QuestionEditor
              key={question.id}
              question={question}
              onUpdate={onUpdateQuestion}
              onDelete={onDeleteQuestion}
            />
          ))}
        </div>
      ) : (
        <Card className="border border-dashed border-border text-center py-12">
          <CardContent>
            <p className="text-muted-foreground mb-4">No questions added yet</p>
            <Button onClick={onAddQuestion}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Question
            </Button>
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default QuestionsList;
