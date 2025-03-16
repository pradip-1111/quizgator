import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '../context/AuthContext';
import { enterFullscreen, exitFullscreen, setupTabVisibilityTracking } from '../lib/fullscreen';
import { Quiz } from '@/components/QuizCard';
import { Question, QuizData, QuizResult, QuizStatus } from '@/types/quiz';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

const TakeQuiz = () => {
  
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, registerStudent } = useAuth();
  
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [name, setName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [email, setEmail] = useState('');
  const [started, setStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [tabSwitchWarnings, setTabSwitchWarnings] = useState(0);
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [requiresAuth, setRequiresAuth] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  
  const timerRef = useRef<number | null>(null);
  const quizContainerRef = useRef<HTMLDivElement>(null);
  const cleanupTabTrackingRef = useRef<(() => void) | null>(null);

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
      setQuestions([]);
      setAnswers({});
      
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
          setError("No quizzes found. Please create a quiz first.");
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
        
        const creatorQuestionsKey = `quiz_creator_questions_${quizId}`;
        const storedQuestionsByCreator = localStorage.getItem(creatorQuestionsKey);
        
        let quizQuestions: Question[] = [];
        
        if (storedQuestionsByCreator) {
          console.log("Found stored questions created by quiz author");
          try {
            const parsedQuestions = JSON.parse(storedQuestionsByCreator);
            
            if (Array.isArray(parsedQuestions) && parsedQuestions.length > 0) {
              console.log("Successfully parsed creator questions:", parsedQuestions);
              quizQuestions = parsedQuestions;
              
              localStorage.setItem(`quiz_questions_${quizId}`, JSON.stringify(quizQuestions));
            } else {
              console.error("Creator questions were found but not valid:", parsedQuestions);
              quizQuestions = generateSampleQuestions(foundQuiz.questions || 1);
            }
          } catch (error) {
            console.error("Error parsing creator questions:", error);
            quizQuestions = generateSampleQuestions(foundQuiz.questions || 1);
          }
        } else {
          console.log("No creator questions found, checking for previously stored questions");
          
          const storedQuestions = localStorage.getItem(`quiz_questions_${quizId}`);
          
          if (storedQuestions) {
            try {
              const parsedQuestions = JSON.parse(storedQuestions);
              if (Array.isArray(parsedQuestions) && parsedQuestions.length > 0) {
                console.log("Found previously stored questions");
                quizQuestions = parsedQuestions;
              } else {
                console.log("Previously stored questions not valid, generating samples");
                quizQuestions = generateSampleQuestions(foundQuiz.questions || 1);
                
                localStorage.setItem(`quiz_questions_${quizId}`, JSON.stringify(quizQuestions));
                localStorage.setItem(creatorQuestionsKey, JSON.stringify(quizQuestions));
              }
            } catch (error) {
              console.error("Error parsing stored questions:", error);
              quizQuestions = generateSampleQuestions(foundQuiz.questions || 1);
            }
          } else {
            console.log("No stored questions found, generating samples");
            quizQuestions = generateSampleQuestions(foundQuiz.questions || 1);
            
            localStorage.setItem(`quiz_questions_${quizId}`, JSON.stringify(quizQuestions));
            localStorage.setItem(creatorQuestionsKey, JSON.stringify(quizQuestions));
          }
        }
        
        console.log("Final quiz questions to display:", quizQuestions);
        
        if (!quizQuestions || quizQuestions.length === 0) {
          console.error("No questions found for quiz");
          setError("No questions found for this quiz");
          setLoading(false);
          return;
        }
        
        const validatedQuestions = quizQuestions.map(q => ({
          id: q.id || `q-${Math.random().toString(36).substring(2, 9)}`,
          text: q.text || "Untitled Question",
          type: (q.type && ['multiple-choice', 'true-false', 'short-answer', 'long-answer'].includes(q.type)) 
            ? q.type 
            : 'multiple-choice',
          options: Array.isArray(q.options) ? q.options : [],
          points: typeof q.points === 'number' ? q.points : 10,
          required: Boolean(q.required)
        }));
        
        setQuestions(validatedQuestions);
        setQuiz({
          id: foundQuiz.id,
          title: foundQuiz.title, 
          description: foundQuiz.description,
          timeLimit: foundQuiz.duration,
          questions: validatedQuestions
        });
        setTimeLeft(foundQuiz.duration * 60);
        console.log("Quiz setup complete:", { 
          title: foundQuiz.title, 
          questions: validatedQuestions.length 
        });
      } catch (error) {
        console.error('Error loading quiz:', error);
        setError("Failed to load quiz data");
      } finally {
        setLoading(false);
      }
    };

    loadQuiz();
    
    return () => {
      if (cleanupTabTrackingRef.current) {
        cleanupTabTrackingRef.current();
      }
      
      if (timerRef.current) {
        clearInterval(timerRef.current as unknown as number);
      }
    };
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
      
      timerRef.current = timer as unknown as number;
      
      return () => clearInterval(timer);
    }
  }, [started, timeLeft]);
  
  useEffect(() => {
    if (started) {
      const cleanup = setupTabVisibilityTracking((isVisible) => {
        if (!isVisible) {
          setTabSwitchWarnings(prev => {
            const newCount = prev + 1;
            
            toast({
              title: `Warning #${newCount}`,
              description: "Switching tabs or applications during the quiz is not allowed!",
              variant: "destructive",
            });
            
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
    if (!name || !rollNumber || !email) {
      toast({
        title: "Error",
        description: "Please enter your name, student ID, and email address",
        variant: "destructive",
      });
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await registerStudent(name, rollNumber, email, quizId || '1');
      
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
      
      if (question.type === 'multiple-choice' || question.type === 'true-false') {
        const selectedOption = question.options.find(opt => opt.id === answers[question.id]);
        if (selectedOption && selectedOption.isCorrect) {
          score += question.points;
        }
      } 
      else if (answers[question.id] && answers[question.id].trim().length > 0) {
        score += question.points;
      }
    });
    
    return { score, totalPoints };
  };
  
  const sendConfirmationEmail = async (quizTitle: string, result: QuizResult) => {
    if (sendingEmail) return;
    
    try {
      setSendingEmail(true);
      console.log("Sending confirmation email for quiz submission");
      
      const response = await supabase.functions.invoke('send-quiz-confirmation', {
        body: {
          quizId: quizId || '',
          quizTitle: quizTitle || 'Quiz',
          studentName: result.studentName,
          studentId: result.studentId,
          studentEmail: user?.email || email
        }
      });
      
      if (!response.data?.success) {
        throw new Error('Failed to send confirmation email');
      }
      
      console.log("Email confirmation sent successfully");
    } catch (error) {
      console.error("Error sending confirmation email:", error);
    } finally {
      setSendingEmail(false);
    }
  };
  
  const handleSubmitQuiz = () => {
    if (!quiz) return;
    
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
      
      const { score, totalPoints } = calculateScore();
      
      const correctAnswers: Record<string, any> = {};
      quiz.questions.forEach(question => {
        if (question.type === 'multiple-choice' || question.type === 'true-false') {
          const correctOption = question.options.find(opt => opt.isCorrect);
          if (correctOption) {
            correctAnswers[question.id] = correctOption.id;
          }
        } else if (question.type === 'short-answer' || question.type === 'long-answer') {
          correctAnswers[question.id] = null;
        }
      });
      
      const result: QuizResult = {
        quizId: quizId || '',
        studentName: name,
        studentId: rollNumber,
        score,
        totalPoints,
        submittedAt: new Date().toISOString(),
        answers,
        correctAnswers,
        securityViolations: tabSwitchWarnings,
        completed: tabSwitchWarnings < 3
      };
      
      const resultsKey = `quiz_results_${quizId}`;
      console.log(`Saving result for quiz ID: ${quizId} to key: ${resultsKey}`);
      
      const existingResults = localStorage.getItem(resultsKey) || '[]';
      const results = JSON.parse(existingResults);
      results.push(result);
      
      localStorage.setItem(resultsKey, JSON.stringify(results));
      console.log("Saved quiz results:", result);
      
      exitFullscreen();
      
      sendConfirmationEmail(quiz.title, result);
      
      toast({
        title: "Quiz Submitted",
        description: "Your answers have been recorded successfully.",
      });
      
      toast({
        title: "Confirmation Email Sent",
        description: `A confirmation has been sent to ${user?.email || email}`,
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
        email={email}
        setEmail={setEmail}
        onStartQuiz={handleStartQuiz}
        requiresAuth={requiresAuth}
      />
    );
  }
  
  const currentQuestionExists = quiz.questions && 
    Array.isArray(quiz.questions) && 
    quiz.questions.length > 0 && 
    currentQuestion < quiz.questions.length;
  
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
        
        {currentQuestionExists ? (
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
              <p>There was a problem loading this question. Please contact your instructor.</p>
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
