
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import QuestionEditor, { Question } from '../components/QuestionEditor';
import Navbar from '../components/Navbar';
import { Clock, FileText, Plus, Save, Send, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Quiz } from '../components/QuizCard';
import { supabase } from '@/integrations/supabase/client';

const CreateQuiz = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [quizTitle, setQuizTitle] = useState('');
  const [quizDescription, setQuizDescription] = useState('');
  const [timeLimit, setTimeLimit] = useState('60');
  const [passingScore, setPassingScore] = useState('70');
  const [randomizeQuestions, setRandomizeQuestions] = useState(false);
  const [showResults, setShowResults] = useState(true);
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: crypto.randomUUID(),
      text: 'What is the capital of France?',
      type: 'multiple-choice',
      options: [
        { id: crypto.randomUUID(), text: 'Paris', isCorrect: true },
        { id: crypto.randomUUID(), text: 'London', isCorrect: false },
        { id: crypto.randomUUID(), text: 'Berlin', isCorrect: false },
        { id: crypto.randomUUID(), text: 'Rome', isCorrect: false }
      ],
      points: 10,
      required: true
    }
  ]);

  const handleAddQuestion = () => {
    const newQuestion: Question = {
      id: crypto.randomUUID(),
      text: '',
      type: 'multiple-choice',
      options: [
        { id: crypto.randomUUID(), text: 'Option 1', isCorrect: false },
        { id: crypto.randomUUID(), text: 'Option 2', isCorrect: false }
      ],
      points: 10,
      required: true
    };
    
    setQuestions([...questions, newQuestion]);
  };

  const handleUpdateQuestion = (updatedQuestion: Question) => {
    setQuestions(questions.map(q => 
      q.id === updatedQuestion.id ? updatedQuestion : q
    ));
  };

  const handleDeleteQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const handleSaveDraft = async () => {
    if (!quizTitle) {
      toast({
        title: "Error",
        description: "Please provide a title for your quiz",
        variant: "destructive",
      });
      return;
    }

    await saveQuizWithQuestions('draft');
  };

  const handlePublishQuiz = async () => {
    if (!quizTitle) {
      toast({
        title: "Error",
        description: "Please provide a title for your quiz",
        variant: "destructive",
      });
      return;
    }

    if (questions.length === 0) {
      toast({
        title: "Error",
        description: "Your quiz must have at least one question",
        variant: "destructive",
      });
      return;
    }

    await saveQuizWithQuestions('active');
  };
  
  const saveQuizWithQuestions = async (status: 'draft' | 'active') => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to save a quiz",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      console.log("Starting quiz save process");
      const quizId = crypto.randomUUID();
      
      // Insert the quiz first
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .insert({
          id: quizId,
          title: quizTitle,
          description: quizDescription,
          time_limit: parseInt(timeLimit),
          created_by: user.id
        })
        .select()
        .single();
      
      if (quizError) {
        console.error("Error inserting quiz:", quizError);
        throw quizError;
      }
      
      console.log("Quiz saved successfully:", quizData);
      
      // Save all questions
      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        
        // Generate a UUID for the question
        const questionId = crypto.randomUUID();
        
        const { data: questionData, error: questionError } = await supabase
          .from('questions')
          .insert({
            id: questionId,
            quiz_id: quizId,
            text: question.text,
            type: question.type,
            points: question.points,
            required: question.required,
            order_number: i
          })
          .select()
          .single();
        
        if (questionError) {
          console.error("Error inserting question:", questionError);
          throw questionError;
        }
        
        console.log("Question saved successfully:", questionData);
        
        // Save all options for the question if they exist
        if (question.options && question.options.length > 0) {
          const optionsToInsert = question.options.map((opt, index) => ({
            id: crypto.randomUUID(),
            question_id: questionId,
            text: opt.text,
            is_correct: opt.isCorrect,
            order_number: index
          }));
          
          const { data: optionsData, error: optionsError } = await supabase
            .from('options')
            .insert(optionsToInsert)
            .select();
          
          if (optionsError) {
            console.error("Error inserting options:", optionsError);
            throw optionsError;
          }
          
          console.log("Options saved successfully:", optionsData);
        }
      }
      
      // For backward compatibility, also save to localStorage
      const newQuiz: Quiz = {
        id: quizId,
        userId: user.id,
        title: quizTitle,
        description: quizDescription,
        questions: questions.length,
        duration: parseInt(timeLimit),
        created: new Date().toISOString(),
        attempts: 0,
        status: status
      };
      
      const existingQuizzes = JSON.parse(localStorage.getItem('quizzes') || '[]');
      localStorage.setItem('quizzes', JSON.stringify([...existingQuizzes, newQuiz]));
      
      const questionsKey = `quiz_creator_questions_${quizId}`;
      localStorage.setItem(questionsKey, JSON.stringify(questions));
      localStorage.setItem(`quiz_questions_${quizId}`, JSON.stringify(questions));
      
      toast({
        title: status === 'active' ? "Quiz published" : "Draft saved",
        description: status === 'active' 
          ? "Your quiz is now live and ready to share" 
          : "Your quiz has been saved as a draft",
      });
      
      navigate('/admin-dashboard');
    } catch (error) {
      console.error('Error saving quiz:', error);
      toast({
        title: "Error",
        description: "Failed to save quiz. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 animate-fade-in">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-grow order-2 lg:order-1">
            <div className="mb-8">
              <h1 className="text-3xl font-bold">Create New Quiz</h1>
              <p className="text-muted-foreground mt-1">
                Design your quiz, add questions, and set preferences
              </p>
            </div>
            
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
            
            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Questions</h2>
              <Button onClick={handleAddQuestion}>
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
                    onUpdate={handleUpdateQuestion}
                    onDelete={handleDeleteQuestion}
                  />
                ))}
              </div>
            ) : (
              <Card className="border border-dashed border-border text-center py-12">
                <CardContent>
                  <p className="text-muted-foreground mb-4">No questions added yet</p>
                  <Button onClick={handleAddQuestion}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Question
                  </Button>
                </CardContent>
              </Card>
            )}
            
            <div className="mt-8 flex flex-col sm:flex-row justify-end gap-3">
              <Button variant="outline" onClick={handleSaveDraft} disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                Save as Draft
              </Button>
              <Button onClick={handlePublishQuiz} disabled={loading}>
                <Send className="h-4 w-4 mr-2" />
                Publish Quiz
              </Button>
            </div>
          </div>
          
          <div className="w-full lg:w-80 order-1 lg:order-2">
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
          </div>
        </div>
      </main>
    </div>
  );
};

export default CreateQuiz;
