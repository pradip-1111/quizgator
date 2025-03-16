
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { FileText, Settings, Clock } from 'lucide-react';
import { Question } from '@/components/QuestionEditor';

type QuizSummaryProps = {
  questions: Question[];
  timeLimit: string;
};

const QuizSummary: React.FC<QuizSummaryProps> = ({ questions, timeLimit }) => {
  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

  return (
    <div className="sticky top-4">
      <Card className="shadow-subtle border border-border">
        <CardHeader className="pb-2">
          <CardTitle>Quiz Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                Draft
              </Badge>
            </div>
            
            <Separator />
            
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <FileText className="h-4 w-4 mr-2 text-primary/70" />
                <span className="text-muted-foreground">Questions</span>
              </div>
              <span>{questions.length}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Settings className="h-4 w-4 mr-2 text-primary/70" />
                <span className="text-muted-foreground">Total points</span>
              </div>
              <span>{totalPoints}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2 text-primary/70" />
                <span className="text-muted-foreground">Time limit</span>
              </div>
              <span>{timeLimit} min</span>
            </div>
            
            <Separator />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="preview-device">Preview as</Label>
            <Select defaultValue="desktop">
              <SelectTrigger id="preview-device">
                <SelectValue placeholder="Select device" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desktop">Desktop</SelectItem>
                <SelectItem value="tablet">Tablet</SelectItem>
                <SelectItem value="mobile">Mobile</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" className="w-full mt-2">
              Preview Quiz
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuizSummary;
