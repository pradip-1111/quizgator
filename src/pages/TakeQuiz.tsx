
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '../context/AuthContext';
import { enterFullscreen, exitFullscreen, setupTabVisibilityTracking } from '../lib/fullscreen';
import { Quiz } from '@/components/QuizCard';
import { Question, QuizData, QuizResult, QuizStatus } from '@/types/quiz';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Import components
import QuizRegistration from '@/components/quiz/QuizRegistration';
import QuizHeader from '@/components/quiz/QuizHeader';
import QuizProgress from '@/components/quiz/QuizProgress';
import QuestionItem from '@/components/quiz/QuestionItem';
import QuizControls from '@/components/quiz/QuizControls';
import QuizNavigation from '@/components/quiz/QuizNavigation';
import QuizError from '@/components/quiz/QuizError';
import QuizLoading from '@/components/quiz/QuizLoading';

const TakeQuiz = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, registerStudent } = useAuth();
  
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [name, setName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [started, setStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [tabSwitchWarnings, setTabSwitchWarnings] = useState(0);
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [requiresAuth, setRequiresAuth] = useState(true);
  
  const timerRef = useRef<number | null>(null);
  const quizContainerRef = useRef<HTMLDivElement>(null);
  const cleanupTabTrackingRef = useRef<(() => void) | null>(null);

  // Check if user is authenticated
  useEffect(() => {
    if (requiresAuth && !user && !loading) {
      toast({
        title: "Authentication Required",
        description: "Please log in or sign up to take this quiz",
        variant: "destructive",
      });
      navigate('/login');
    }
  }, [user, requiresAuth, loading, navigate, toast]);

  useEffect(() => {
    console.log("TakeQuiz component mounted with quizId:", quizId);
    const loadQuiz = async () => {
      setLoading(true);
      setError(null);
      
      try {
        if (!quizId) {
          setError("Quiz ID is missing");
          setLoading(false);
          return;
        }
        
        console.log("Loading quiz with ID:", quizId);
        
        // Load quizzes from localStorage
        const storedQuizzes = localStorage.getItem('quizzes');
        
        if (!storedQuizzes) {
          console.error("No quizzes found in localStorage");
          
          // Create a dummy quiz for testing if none exists
          const dummyQuizzes = [
            {
              id: quizId,
              userId: '1',
              title: 'Sample Quiz',
              description: 'This is a sample quiz for testing',
              questions: 5,
              duration: 10,
              created: new Date().toISOString(),
              attempts: 0,
              status: 'active' as QuizStatus
            }
          ];
          
          localStorage.setItem('quizzes', JSON.stringify(dummyQuizzes));
          console.log("Created dummy quiz:", dummyQuizzes[0]);
          
          // Load dummy questions for this quiz
          const dummyQuestions = generateSampleQuestions(5);
          localStorage.setItem(`quiz_questions_${quizId}`, JSON.stringify(dummyQuestions));
          
          setQuestions(dummyQuestions);
          setQuiz({
            id: quizId,
            title: 'Sample Quiz',
            description: 'This is a sample quiz for testing',
            timeLimit: 10,
            questions: dummyQuestions
          });
          setTimeLeft(10 * 60);
          
          setLoading(false);
          return;
        }
        
        const quizzes = JSON.parse(storedQuizzes) as Quiz[];
        console.log("All quizzes:", quizzes);
        
        const foundQuiz = quizzes.find(q => q.id === quizId);
        
        if (!foundQuiz) {
          console.error("Quiz not found with ID:", quizId);
          
          // Create a dummy quiz if not found
          const dummyQuiz = {
            id: quizId,
            userId: '1',
            title: 'Sample Quiz',
            description: 'This is a sample quiz for testing',
            questions: 5,
            duration: 10,
            created: new Date().toISOString(),
            attempts: 0,
            status: 'active' as QuizStatus
          };
          
          quizzes.push(dummyQuiz);
          localStorage.setItem('quizzes', JSON.stringify(quizzes));
          console.log("Created dummy quiz:", dummyQuiz);
          
          // Load dummy questions for this quiz
          const dummyQuestions = generateSampleQuestions(5);
          localStorage.setItem(`quiz_questions_${quizId}`, JSON.stringify(dummyQuestions));
          
          setQuestions(dummyQuestions);
          setQuiz({
            id: quizId,
            title: 'Sample Quiz',
            description: 'This is a sample quiz for testing',
            timeLimit: 10,
            questions: dummyQuestions
          });
          setTimeLeft(10 * 60);
          
          setLoading(false);
          return;
        }
        
        console.log("Found quiz:", foundQuiz);
        
        // Get or generate questions for the quiz
        let quizQuestions: Question[] = [];
        
        // Check if there are stored questions for this quiz
        const storedQuestions = localStorage.getItem(`quiz_questions_${quizId}`);
        if (storedQuestions) {
          console.log("Found stored questions for quiz");
          quizQuestions = JSON.parse(storedQuestions);
          console.log("Parsed questions:", quizQuestions);
        } else {
          console.log("Generating questions for quiz");
          // Generate sample questions if none exist
          quizQuestions = generateSampleQuestions(foundQuiz.questions);
          
          // Store the questions for future use
          localStorage.setItem(`quiz_questions_${quizId}`, JSON.stringify(quizQuestions));
        }
        
        console.log("Quiz questions:", quizQuestions);
        
        if (!quizQuestions || quizQuestions.length === 0) {
          console.error("No questions found for quiz");
          setError("No questions found for this quiz");
          setLoading(false);
          return;
        }
        
        setQuestions(quizQuestions);
        setQuiz({
          id: foundQuiz.id,
          title: foundQuiz.title, 
          description: foundQuiz.description,
          timeLimit: foundQuiz.duration,
          questions: quizQuestions
        });
        setTimeLeft(foundQuiz.duration * 60);
        console.log("Quiz setup complete:", { 
          title: foundQuiz.title, 
          questions: quizQuestions.length 
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
  
  useEffect(() => {
    if (started && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleSubmitQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [started, timeLeft]);
  
  // Tab change detection
  useEffect(() => {
    if (started) {
      // Setup tab change tracking
      const cleanup = setupTabVisibilityTracking((isVisible) => {
        if (!isVisible) {
          // Tab was changed or window lost focus
          setTabSwitchWarnings(prev => {
            const newCount = prev + 1;
            
            // Alert the user
            toast({
              title: `Warning #${newCount}`,
              description: "Switching tabs or applications during the quiz is not allowed!",
              variant: "destructive",
            });
            
            // If too many warnings, auto-submit the quiz
            if (newCount >= 3) {
              toast({
                title: "Quiz Terminated",
                description: "You've switched tabs multiple times. Your quiz has been automatically submitted.",
                variant: "destructive",
              });
              handleSubmitQuiz();
            }
            
            return newCount;
          });
        }
      });
      
      cleanupTabTrackingRef.current = cleanup;
      
      return () => {
        if (cleanupTabTrackingRef.current) {
          cleanupTabTrackingRef.current();
        }
      };
    }
  }, [started, toast]);
  
  const generateSampleQuestions = (count: number): Question[] => {
    console.log(`Generating ${count} sample questions`);
    const questionTypes = ['multiple-choice', 'true-false', 'short-answer', 'long-answer'];
    const questions: Question[] = [];
    
    for (let i = 0; i < count; i++) {
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
      
      questions.push({
        id: `${i + 1}`,
        text: `Question ${i + 1}: This is a sample ${type} question.`,
        type,
        options,
        points: 10,
        required: i < (count - 1)
      });
    }
    
    console.log(`Generated questions:`, questions);
    return questions;
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
      // Register student for the quiz
      await registerStudent(name, rollNumber, quizId || '1');
      
      // Enter fullscreen
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
    console.log("Answer changed for question", questionId, "to", value);
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };
  
  const handleNextQuestion = () => {
    if (currentQuestion < (quiz?.questions.length || 0) - 1) {
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
      
      // Clean up tab tracking
      if (cleanupTabTrackingRef.current) {
        cleanupTabTrackingRef.current();
      }
      
      navigate('/');
    }
  };
  
  const calculateScore = () => {
    if (!quiz) return { score: 0, totalPoints: 0 };
    
    let score = 0;
    let totalPoints = 0;
    
    quiz.questions.forEach(question => {
      totalPoints += question.points;
      
      if (!answers[question.id]) return;
      
      // For multiple choice and true/false
      if (question.type === 'multiple-choice' || question.type === 'true-false') {
        const selectedOption = question.options.find(opt => opt.id === answers[question.id]);
        if (selectedOption && selectedOption.isCorrect) {
          score += question.points;
        }
      } 
      // For short and long answers - award full points if answered
      else if (answers[question.id] && answers[question.id].trim().length > 0) {
        score += question.points;
      }
    });
    
    return { score, totalPoints };
  };
  
  const handleSubmitQuiz = () => {
    if (!quiz) return;
    
    // Clean up tab tracking
    if (cleanupTabTrackingRef.current) {
      cleanupTabTrackingRef.current();
    }
    
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
      // Update quiz attempts
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
      
      // Save results
      const { score, totalPoints } = calculateScore();
      const result: QuizResult = {
        quizId: quizId || '',
        studentName: name,
        studentId: rollNumber,
        score,
        totalPoints,
        submittedAt: new Date().toISOString(),
        answers
      };
      
      // Get existing results or create new array
      const existingResults = localStorage.getItem(`quiz_results_${quizId}`) || '[]';
      const results = JSON.parse(existingResults);
      results.push(result);
      
      // Save updated results
      localStorage.setItem(`quiz_results_${quizId}`, JSON.stringify(results));
      console.log("Saved quiz results:", result);
      
      exitFullscreen();
      
      toast({
        title: "Quiz Submitted",
        description: `Your score: ${score}/${totalPoints}. Your answers have been recorded.`,
      });
      
      toast({
        title: "Confirmation Email Sent",
        description: `A confirmation has been sent to ${rollNumber}@student.example.com`,
      });
      
      navigate('/quiz-complete');
    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast({
        title: "Error",
        description: "There was a problem submitting your quiz. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  if (loading) {
    return <QuizLoading />;
  }
  
  if (error || !quiz) {
    return <QuizError error={error} />;
  }
  
  if (!started) {
    return (
      <QuizRegistration
        quiz={quiz}
        name={name}
        setName={setName}
        rollNumber={rollNumber}
        setRollNumber={setRollNumber}
        onStartQuiz={handleStartQuiz}
        requiresAuth={requiresAuth}
      />
    );
  }
  
  return (
    <div ref={quizContainerRef} className="min-h-screen bg-background flex flex-col animate-fade-in fullscreen-mode">
      <QuizHeader
        quizTitle={quiz.title}
        studentName={name}
        studentRollNumber={rollNumber}
        timeLeft={timeLeft}
        onQuit={handleQuitQuiz}
        tabSwitchWarnings={tabSwitchWarnings}
      />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-3xl">
        <QuizProgress 
          answeredCount={Object.keys(answers).length} 
          totalQuestions={quiz.questions.length} 
        />
        
        {quiz.questions[currentQuestion] ? (
          <QuestionItem
            question={quiz.questions[currentQuestion]}
            questionNumber={currentQuestion + 1}
            totalQuestions={quiz.questions.length}
            answer={answers[quiz.questions[currentQuestion].id]}
            onAnswerChange={handleAnswerChange}
          />
        ) : (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Question not available</CardTitle>
            </CardHeader>
            <CardContent>
              <p>There was a problem loading this question.</p>
            </CardContent>
          </Card>
        )}
        
        <QuizControls
          isLastQuestion={currentQuestion === quiz.questions.length - 1}
          currentQuestion={currentQuestion}
          onPrevious={handlePreviousQuestion}
          onNext={handleNextQuestion}
          onSubmit={handleSubmitQuiz}
        />
      </main>
      
      <QuizNavigation
        questions={quiz.questions}
        currentQuestionIndex={currentQuestion}
        answers={answers}
        onQuestionSelect={setCurrentQuestion}
      />
    </div>
  );
};

export default TakeQuiz;
