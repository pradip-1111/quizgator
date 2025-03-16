import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '../context/AuthContext';
import { enterFullscreen, exitFullscreen } from '../lib/fullscreen';

// Import the hooks and components
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
    loading: quizStateLoading, setLoading: setQuizStateLoading,
    questions, setQuestions,
    error: quizStateError, setError: setQuizStateError,
    requiresAuth, setRequiresAuth,
    handleAnswerChange,
    handleNextQuestion,
    handlePreviousQuestion,
    getRemainingQuestionCount
  } = useQuizState();
  
  // Load quiz data with enhanced error handling
  const { 
    quiz: loadedQuiz, 
    questions: loadedQuestions, 
    loading: quizLoading, 
    error: quizLoadError,
    retryLoading,
    loadingStage,
    fallbackActive
  } = useQuizLoader(quizId);
  
  // Update quiz state when quiz is loaded
  useEffect(() => {
    if (loadedQuiz) {
      console.log('Quiz loaded successfully:', loadedQuiz.title);
      setQuiz(loadedQuiz);
      setQuestions(loadedQuestions);
      // Use timeLimit or duration property
      setTimeLeft((loadedQuiz.timeLimit || loadedQuiz.duration) * 60);
    }
    setQuizStateLoading(quizLoading);
    setQuizStateError(quizLoadError);
  }, [loadedQuiz, loadedQuestions, quizLoading, quizLoadError]);
  
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
        title: "Quiz Submitted",
        description: "Your answers have been recorded successfully.",
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
    if (requiresAuth && !user && !quizStateLoading) {
      toast({
        title: "Authentication Required",
        description: "Please log in or sign up to take this quiz",
        variant: "destructive",
      });
      navigate('/login');
    }
  }, [user, requiresAuth, quizStateLoading, navigate, toast]);
  
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
  
  const handleCancelLoading = () => {
    navigate('/');
  };
  
  const handleClearCache = () => {
    if (quizId) {
      console.log(`Clearing cache for quiz ID: ${quizId}`);
      
      // Clear all quiz-related items for this quiz
      const keysToRemove = [
        `quiz_questions_${quizId}`,
        `quiz_creator_questions_${quizId}`,
        `quiz_progress_${quizId}`
      ];
      
      // Also check for other keys that might contain this quizId
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes(quizId)) {
          keysToRemove.push(key);
        }
      }
      
      // Clear each key
      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
          console.log(`Removed ${key} from localStorage`);
        } catch (e) {
          console.error(`Failed to remove ${key}:`, e);
        }
      });
      
      // Check if quizzes array contains this quiz and remove it
      try {
        const storedQuizzes = localStorage.getItem('quizzes');
        if (storedQuizzes) {
          const quizzes = JSON.parse(storedQuizzes);
          const filteredQuizzes = quizzes.filter((q: any) => q.id !== quizId);
          localStorage.setItem('quizzes', JSON.stringify(filteredQuizzes));
          console.log(`Removed quiz ${quizId} from quizzes array`);
        }
      } catch (e) {
        console.error('Error updating quizzes array:', e);
      }
      
      toast({
        title: "Cache Cleared",
        description: "Quiz cache has been cleared. Retrying quiz load.",
      });
      
      // Retry loading the quiz
      retryLoading();
    }
  };
  
  // Render loading state
  if (quizStateLoading) {
    return <QuizLoading 
      cancelLoading={handleCancelLoading} 
      loadingStage={loadingStage}
      fallbackActive={fallbackActive}
      message={
        fallbackActive 
          ? "Using locally stored quiz due to connection issues." 
          : undefined
      }
      onRetry={retryLoading}
      onClearCache={handleClearCache}
    />;
  }
  
  // Render error state with cache clearing
  if (quizStateError || !quiz) {
    const isQuizNotFoundError = quizStateError?.toString().toLowerCase().includes('not found') ||
                               quizStateError?.toString().toLowerCase().includes('no quiz');
    
    return <QuizError 
      error={quizStateError} 
      onRetry={retryLoading} 
      isRetryable={true} 
      fallbackAvailable={fallbackActive}
      onClearCache={handleClearCache}
    />;
  }
  
  // Ensure quiz.questions is available
  const quizWithQuestions = {
    ...quiz,
    questions: questions && questions.length > 0 ? questions : (quiz.questions || [])
  };
  
  // Additional check to make sure we don't proceed with a quiz without questions
  if (quizWithQuestions.questions.length === 0) {
    return <QuizError 
      error={"This quiz has no questions. Please contact the quiz creator."} 
      onRetry={retryLoading} 
      isRetryable={true} 
      fallbackAvailable={false}
      onClearCache={handleClearCache}
    />;
  }
  
  // Render the registration form before starting
  if (!started) {
    return (
      <StudentRegistration
        quiz={quizWithQuestions}
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
      ref={quizContainerRef}
      quizTitle={quiz.title}
      studentName={name}
      studentRollNumber={rollNumber}
      timeLeft={timeLeft}
      currentQuestion={currentQuestion}
      totalQuestions={quizWithQuestions.questions.length}
      questions={quizWithQuestions.questions}
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
