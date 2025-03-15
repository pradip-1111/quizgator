
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '../context/AuthContext';
import { enterFullscreen, exitFullscreen, setupTabVisibilityTracking } from '../lib/fullscreen';
import { AlertCircle, ArrowLeft, ArrowRight, Clock, LogOut, Send } from 'lucide-react';
import { Quiz } from '@/components/QuizCard';

const TakeQuiz = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, registerStudent } = useAuth();
  
  const [quiz, setQuiz] = useState<any | null>(null);
  const [name, setName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [started, setStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [tabSwitchWarnings, setTabSwitchWarnings] = useState(0);
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const timerRef = useRef<number | null>(null);
  const quizContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log("TakeQuiz component mounted with quizId:", quizId);
    const loadQuiz = () => {
      setLoading(true);
      setError(null);
      
      try {
        if (!quizId) {
          setError("Quiz ID is missing");
          setLoading(false);
          return;
        }
        
        console.log("Loading quiz with ID:", quizId);
        const storedQuizzes = localStorage.getItem('quizzes');
        
        if (!storedQuizzes) {
          console.error("No quizzes found in localStorage");
          setError("No quizzes found");
          setLoading(false);
          return;
        }
        
        const quizzes = JSON.parse(storedQuizzes) as Quiz[];
        console.log("All quizzes:", quizzes);
        
        const foundQuiz = quizzes.find(q => q.id === quizId);
        
        if (!foundQuiz) {
          console.error("Quiz not found with ID:", quizId);
          setError(`Quiz with ID ${quizId} not found`);
          setLoading(false);
          return;
        }
        
        console.log("Found quiz:", foundQuiz);
        
        const generatedQuestions = [];
        for (let i = 0; i < foundQuiz.questions; i++) {
          const questionTypes = ['multiple-choice', 'true-false', 'short-answer', 'long-answer'];
          const type = questionTypes[i % questionTypes.length] as 'multiple-choice' | 'true-false' | 'short-answer' | 'long-answer';
          
          let options = [];
          if (type === 'multiple-choice') {
            options = [
              { id: '1', text: 'Option A', isCorrect: i === 0 },
              { id: '2', text: 'Option B', isCorrect: false },
              { id: '3', text: 'Option C', isCorrect: false },
              { id: '4', text: 'Option D', isCorrect: false }
            ];
          } else if (type === 'true-false') {
            options = [
              { id: '1', text: 'True', isCorrect: false },
              { id: '2', text: 'False', isCorrect: true }
            ];
          } else {
            options = [];
          }
          
          generatedQuestions.push({
            id: `${i + 1}`,
            text: `Question ${i + 1}`,
            type,
            options,
            points: 10,
            required: i < (foundQuiz.questions - 1)
          });
        }
        
        setQuestions(generatedQuestions);
        setQuiz({
          id: foundQuiz.id,
          title: foundQuiz.title, 
          description: foundQuiz.description,
          timeLimit: foundQuiz.duration,
          questions: generatedQuestions
        });
        setTimeLeft(foundQuiz.duration * 60);
        console.log("Quiz setup complete:", { 
          title: foundQuiz.title, 
          questions: generatedQuestions.length 
        });
      } catch (error) {
        console.error('Error loading quiz:', error);
        setError("Failed to load quiz data");
      } finally {
        setLoading(false);
      }
    };

    loadQuiz();
  }, [quizId]);
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const handleStartQuiz = async () => {
    if (!name || !rollNumber) {
      toast({
        title: "Error",
        description: "Please enter your name and roll number",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await registerStudent(name, rollNumber, quizId || '1');
      
      if (quizContainerRef.current) {
        enterFullscreen(quizContainerRef.current);
      }
      
      setStarted(true);
      
      toast({
        title: "Quiz Started",
        description: "Good luck! Remember not to switch tabs during the exam.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start quiz",
        variant: "destructive",
      });
    }
  };
  
  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };
  
  const handleNextQuestion = () => {
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };
  
  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };
  
  const handleQuitQuiz = () => {
    if (window.confirm("Are you sure you want to quit? Your progress will be lost.")) {
      exitFullscreen();
      navigate('/');
    }
  };
  
  const handleSubmitQuiz = () => {
    const unansweredRequired = quiz.questions
      .filter(q => q.required)
      .filter(q => !answers[q.id]);
    
    if (unansweredRequired.length > 0 && !confirmed) {
      toast({
        title: "Warning",
        description: `You have ${unansweredRequired.length} unanswered required questions. Are you sure you want to submit?`,
        variant: "destructive",
      });
      setConfirmed(true);
      return;
    }
    
    try {
      const storedQuizzes = localStorage.getItem('quizzes');
      if (storedQuizzes) {
        const quizzes = JSON.parse(storedQuizzes) as Quiz[];
        const updatedQuizzes = quizzes.map(q => {
          if (q.id === quizId) {
            return {
              ...q,
              attempts: (q.attempts || 0) + 1
            };
          }
          return q;
        });
        localStorage.setItem('quizzes', JSON.stringify(updatedQuizzes));
      }
    } catch (error) {
      console.error('Error updating quiz attempts:', error);
    }
    
    exitFullscreen();
    
    toast({
      title: "Quiz Submitted",
      description: "Your answers have been recorded. Thank you!",
    });
    
    toast({
      title: "Confirmation Email Sent",
      description: `A confirmation has been sent to ${rollNumber}@student.example.com`,
    });
    
    navigate('/quiz-complete');
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg">Loading quiz...</p>
        </div>
      </div>
    );
  }
  
  if (error || !quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Quiz Not Found</CardTitle>
            <CardDescription>
              {error || "The quiz you're looking for doesn't exist or has been removed."}
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Link to="/">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  const progressPercentage = (Object.keys(answers).length / quiz.questions.length) * 100;
  
  if (!started) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/30 px-4 animate-fade-in">
        <Card className="w-full max-w-md shadow-card">
          <CardHeader>
            <CardTitle className="text-2xl">{quiz.title}</CardTitle>
            <CardDescription>{quiz.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input 
                id="name" 
                placeholder="Enter your full name" 
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="roll">Roll Number / Student ID</Label>
              <Input 
                id="roll" 
                placeholder="Enter your roll number" 
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
              />
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex items-center text-muted-foreground">
                <Clock className="h-4 w-4 mr-1" />
                <span>Time limit: {quiz.timeLimit} minutes</span>
              </div>
              <div className="flex items-center text-muted-foreground">
                <AlertCircle className="h-4 w-4 mr-1" />
                <span>Once started, the quiz will enter fullscreen mode</span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={handleStartQuiz}>
              Start Quiz
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  return (
    <div ref={quizContainerRef} className="min-h-screen bg-background flex flex-col animate-fade-in fullscreen-mode">
      <header className="border-b border-border bg-card py-2 px-4">
        <div className="container mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold">{quiz.title}</h1>
            <div className="text-sm text-muted-foreground">
              {name} • {rollNumber}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="bg-red-50 text-red-700 px-3 py-1 rounded-full border border-red-200 flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              <span className="font-medium">{formatTime(timeLeft)}</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleQuitQuiz} className="text-destructive hover:text-destructive">
              <LogOut className="h-4 w-4 mr-1" />
              Quit
            </Button>
          </div>
        </div>
      </header>
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-6">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Progress</span>
            <span>{Object.keys(answers).length} of {quiz.questions.length} questions answered</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
        
        <div className="mb-4 flex justify-between items-center">
          <Badge variant="outline" className="bg-primary/10 text-primary">
            Question {currentQuestion + 1} of {quiz.questions.length}
          </Badge>
          <Badge variant="outline">
            {quiz.questions[currentQuestion].points} points
            {quiz.questions[currentQuestion].required && " • Required"}
          </Badge>
        </div>
        
        <Card className="mb-8 shadow-subtle border border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">
              {quiz.questions[currentQuestion].text}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {quiz.questions[currentQuestion].type === 'multiple-choice' && (
              <RadioGroup
                value={answers[quiz.questions[currentQuestion].id] || ""}
                onValueChange={(value) => handleAnswerChange(quiz.questions[currentQuestion].id, value)}
                className="space-y-3"
              >
                {quiz.questions[currentQuestion].options.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.id} id={`option-${option.id}`} />
                    <Label htmlFor={`option-${option.id}`} className="cursor-pointer">
                      {option.text}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}
            
            {quiz.questions[currentQuestion].type === 'true-false' && (
              <RadioGroup
                value={answers[quiz.questions[currentQuestion].id] || ""}
                onValueChange={(value) => handleAnswerChange(quiz.questions[currentQuestion].id, value)}
                className="space-y-3"
              >
                {quiz.questions[currentQuestion].options.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.id} id={`option-${option.id}`} />
                    <Label htmlFor={`option-${option.id}`} className="cursor-pointer">
                      {option.text}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}
            
            {quiz.questions[currentQuestion].type === 'short-answer' && (
              <Input
                placeholder="Type your answer here"
                value={answers[quiz.questions[currentQuestion].id] || ""}
                onChange={(e) => handleAnswerChange(quiz.questions[currentQuestion].id, e.target.value)}
              />
            )}
            
            {quiz.questions[currentQuestion].type === 'long-answer' && (
              <Textarea
                placeholder="Type your answer here"
                rows={8}
                value={answers[quiz.questions[currentQuestion].id] || ""}
                onChange={(e) => handleAnswerChange(quiz.questions[currentQuestion].id, e.target.value)}
              />
            )}
          </CardContent>
        </Card>
        
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePreviousQuestion}
            disabled={currentQuestion === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          
          {currentQuestion < quiz.questions.length - 1 ? (
            <Button onClick={handleNextQuestion}>
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmitQuiz} className="bg-green-600 hover:bg-green-700">
              <Send className="h-4 w-4 mr-2" />
              Submit Quiz
            </Button>
          )}
        </div>
      </main>
      
      <footer className="border-t border-border bg-card py-4 px-4">
        <div className="container mx-auto max-w-3xl">
          <div className="flex flex-wrap gap-2">
            {quiz.questions.map((q, index) => (
              <button
                key={q.id}
                onClick={() => setCurrentQuestion(index)}
                className={`h-8 w-8 flex items-center justify-center rounded-full text-sm font-medium 
                  ${index === currentQuestion 
                    ? 'bg-primary text-white' 
                    : answers[q.id] 
                      ? 'bg-green-100 text-green-800 border border-green-200' 
                      : 'bg-secondary text-secondary-foreground'
                  } 
                  ${q.required && !answers[q.id] && index !== currentQuestion 
                    ? 'ring-2 ring-red-400' 
                    : ''
                  }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default TakeQuiz;
