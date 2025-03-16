
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '../context/AuthContext';
import { enterFullscreen, exitFullscreen } from '../lib/fullscreen';
import { Question } from '@/types/quiz';

// Import the new hooks and components
import { useQuizState } from '@/hooks/use-quiz-state';
import { useQuizLoader } from '@/hooks/use-quiz-loader';
import { useQuizTimer } from '@/hooks/use-quiz-timer';
import { useQuizSecurity } from '@/hooks/use-quiz-security';
import { submitQuiz, sendConfirmationEmail } from '@/utils/quiz-submission';

// Import UI components
import QuizLoading from '@/components/quiz/QuizLoading';
import QuizError from '@/components/quiz/QuizError';
import StudentRegistration from '@/components/quiz/StudentRegistration';
import QuizContainer from '@/components/quiz/QuizContainer';

const TakeQuiz = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, registerStudent } = useAuth();
  
  // Personal info state
  const [name, setName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [email, setEmail] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  
  const quizContainerRef = useRef<HTMLDivElement>(null);
  
  // Use our custom hooks
  const {
    quiz, setQuiz,
    started, setStarted,
    currentQuestion, setCurrentQuestion,
    answers, setAnswers,
    timeLeft, setTimeLeft,
    loading, setLoading,
    questions, setQuestions,
    error, setError,
    requiresAuth, setRequiresAuth,
    handleAnswerChange,
    handleNextQuestion,
    handlePreviousQuestion,
    getRemainingQuestionCount
  } = useQuizState();
  
  // Load quiz data
  const quizLoader = useQuizLoader(quizId);
  
  useEffect(() => {
    if (quizLoader.quiz) {
      setQuiz(quizLoader.quiz);
      setQuestions(quizLoader.questions);
      setTimeLeft(quizLoader.quiz.timeLimit * 60);
    }
    setLoading(quizLoader.loading);
    setError(quizLoader.error);
  }, [quizLoader.quiz, quizLoader.questions, quizLoader.loading, quizLoader.error]);
  
  // Setup timer
  const handleSubmitQuiz = () => {
    if (!quiz) return;
    
    if (cleanupTabTrackingRef.current) {
      cleanupTabTrackingRef.current();
    }
    
    try {
      exitFullscreen();
      
      submitQuiz(
        quizId || '', 
        quiz, 
        answers, 
        name, 
        rollNumber, 
        email
      ).then(result => {
        sendConfirmationEmail(quizId || '', quiz.title, result, user?.email || email)
          .then(() => {
            toast({
              title: "Confirmation Email Sent",
              description: `A confirmation has been sent to ${user?.email || email}`,
            });
          })
          .catch((error) => {
            console.error("Failed to send confirmation email:", error);
          });
      });
      
      toast({
        title: "Quiz Auto-Submitted",
        description: "Your answers have been recorded. The quiz was submitted automatically due to tab switching.",
        variant: "destructive",
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
  
  const timerRef = useQuizTimer(started, timeLeft, setTimeLeft, handleSubmitQuiz);
  
  // Setup security monitoring
  const cleanupTabTrackingRef = useQuizSecurity(started, handleSubmitQuiz);
  
  // Auth effect
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
  
  const handleQuitQuiz = () => {
    if (window.confirm("Are you sure you want to quit? Your progress will be lost.")) {
      exitFullscreen();
      
      if (cleanupTabTrackingRef.current) {
        cleanupTabTrackingRef.current();
      }
      
      navigate('/');
    }
  };
  
  // Render loading state
  if (loading) {
    return <QuizLoading />;
  }
  
  // Render error state
  if (error || !quiz) {
    return <QuizError error={error} />;
  }
  
  // Render the registration form before starting
  if (!started) {
    return (
      <StudentRegistration
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
  
  // Render the quiz container once started
  return (
    <QuizContainer
      quizTitle={quiz.title}
      studentName={name}
      studentRollNumber={rollNumber}
      timeLeft={timeLeft}
      currentQuestion={currentQuestion}
      totalQuestions={quiz.questions.length}
      questions={quiz.questions}
      answers={answers}
      onQuit={handleQuitQuiz}
      onPrevious={handlePreviousQuestion}
      onNext={handleNextQuestion}
      onSubmit={handleSubmitQuiz}
      onQuestionSelect={setCurrentQuestion}
      onAnswerChange={handleAnswerChange}
    />
  );
};

export default TakeQuiz;
