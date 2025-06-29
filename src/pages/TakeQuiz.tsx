import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '../context/AuthContext';
import { enterFullscreen, exitFullscreen } from '../lib/fullscreen';

import { useQuizState } from '@/hooks/use-quiz-state';
import { useQuizLoader, clearQuizCache } from '@/hooks/use-quiz-loader';
import { useQuizTimer } from '@/hooks/use-quiz-timer';
import { useQuizSecurity } from '@/hooks/use-quiz-security';
import { submitQuiz, sendConfirmationEmail } from '@/utils/quiz-submission';

import QuizLoading from '@/components/quiz/QuizLoading';
import QuizError from '@/components/quiz/QuizError';
import StudentRegistration from '@/components/quiz/StudentRegistration';
import QuizContainer from '@/components/quiz/QuizContainer';

const TakeQuiz = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, registerStudent } = useAuth();
  
  const [name, setName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [email, setEmail] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  
  const quizContainerRef = useRef<HTMLDivElement>(null);
  
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
  
  useEffect(() => {
    if (!quizId) return;
    
    const expiredFlag = localStorage.getItem(`quiz_expired_${quizId}`);
    if (expiredFlag === 'true') {
      console.log(`Quiz ${quizId} is marked as expired`);
      setIsExpired(true);
      setQuizStateError('This quiz has expired because the time limit was reached.');
    }
  }, [quizId, setQuizStateError]);
  
  useEffect(() => {
    if (!quizId) return;
    
    console.log(`Initial load for quiz ID: ${quizId}, clearing state and checking localStorage`);
    
    setQuiz(null);
    setQuestions([]);
    setAnswers({});
    setCurrentQuestion(0);
    setStarted(false);
    setTimeLeft(0);
    setQuizStateError(null);
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('quiz_') && !key.includes(quizId)) {
        console.log(`Clearing potentially conflicting quiz data: ${key}`);
        localStorage.removeItem(key);
      }
    }
    
    console.log(`Attempting to load quiz with ID: ${quizId} directly from localStorage`);
    
    try {
      const directQuizData = localStorage.getItem(`quiz_${quizId}`);
      
      if (directQuizData) {
        const parsedQuiz = JSON.parse(directQuizData);
        console.log("Found quiz directly in localStorage:", parsedQuiz.title);
        
        if (parsedQuiz.id === quizId) {
          setQuiz(parsedQuiz);
          
          if (Array.isArray(parsedQuiz.questions) && parsedQuiz.questions.length > 0) {
            console.log(`Using ${parsedQuiz.questions.length} questions from direct quiz data`);
            setQuestions(parsedQuiz.questions);
          } else {
            const questionsData = localStorage.getItem(`quiz_questions_${quizId}`);
            if (questionsData) {
              const parsedQuestions = JSON.parse(questionsData);
              if (Array.isArray(parsedQuestions) && parsedQuestions.length > 0) {
                console.log(`Loaded ${parsedQuestions.length} questions from separate storage`);
                setQuestions(parsedQuestions);
              }
            }
          }
          
          setTimeLeft((parsedQuiz.timeLimit || parsedQuiz.duration) * 60);
          setQuizStateLoading(false);
          return;
        } else {
          console.warn(`Found quiz in localStorage but ID mismatch. Expected: ${quizId}, Found: ${parsedQuiz.id}`);
        }
      }
      
      console.log("LocalStorage keys:");
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        console.log(key);
      }
    } catch (error) {
      console.error("Error loading quiz directly from localStorage:", error);
    }
    
    console.log("No direct quiz found in localStorage, will use useQuizLoader");
  }, [quizId, setQuiz, setQuestions, setTimeLeft, setQuizStateLoading, setAnswers, setCurrentQuestion, setStarted, setQuizStateError]);
  
  const { 
    quiz: loadedQuiz, 
    questions: loadedQuestions, 
    loading: quizLoading, 
    error: quizLoadError,
    retryLoading,
    loadingStage,
    fallbackActive
  } = useQuizLoader(quizId);
  
  useEffect(() => {
    if (isExpired) {
      return;
    }
    
    if (loadedQuiz && !quiz) {
      console.log('Quiz loaded from useQuizLoader:', loadedQuiz.title);
      
      if (loadedQuiz.id === quizId) {
        setQuiz(loadedQuiz);
        setQuestions(loadedQuestions);
        setTimeLeft((loadedQuiz.timeLimit || loadedQuiz.duration) * 60);
        
        try {
          localStorage.setItem(`quiz_${quizId}`, JSON.stringify(loadedQuiz));
          if (loadedQuestions && loadedQuestions.length > 0) {
            localStorage.setItem(`quiz_questions_${quizId}`, JSON.stringify(loadedQuestions));
          }
        } catch (err) {
          console.error("Failed to save quiz to localStorage:", err);
        }
      } else {
        console.error(`Quiz ID mismatch! Expected: ${quizId}, Got: ${loadedQuiz.id}`);
        setQuizStateError(`Quiz ID mismatch! This might be the wrong quiz. Try clearing the cache.`);
      }
    }
    
    setQuizStateLoading(quizLoading);
    
    if (quizLoadError) {
      console.error("Quiz load error:", quizLoadError);
      setQuizStateError(quizLoadError);
    }
  }, [loadedQuiz, loadedQuestions, quizLoading, quizLoadError, quiz, quizId, setQuiz, setQuestions, setTimeLeft, setQuizStateLoading, setQuizStateError, isExpired]);
  
  const handleSubmitQuiz = () => {
    if (!quiz) return;
    
    if (cleanupTabTrackingRef.current) {
      cleanupTabTrackingRef.current();
    }
    
    try {
      exitFullscreen();
      
      const currentQuizId = quizId || '';
      const currentQuizTitle = quiz.title || 'Quiz';
      
      localStorage.setItem(`quiz_expired_${currentQuizId}`, 'true');
      
      toast({
        title: "Quiz Submitted",
        description: "Your answers are being recorded. Please wait...",
      });
      
      submitQuiz(
        currentQuizId, 
        quiz, 
        answers, 
        name, 
        rollNumber, 
        email
      ).then(result => {
        const quizResult = {
          ...result,
          quizTitle: currentQuizTitle
        };
        
        navigate('/quiz-complete', { state: { quizResult } });
        
        toast({
          title: "Quiz Processed Successfully",
          description: "Your answers have been recorded. A confirmation email will be sent to your email address.",
        });
      }).catch(error => {
        console.error('Error in quiz submission process:', error);
        toast({
          title: "Error",
          description: "There was a problem submitting your quiz. Please try again.",
          variant: "destructive",
        });
      });
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
  
  const cleanupTabTrackingRef = useQuizSecurity(started, handleSubmitQuiz);
  
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
  
  const handleClearCache = () => {
    if (quizId) {
      console.log(`Clearing cache for quiz ID: ${quizId}`);
      
      localStorage.removeItem(`quiz_${quizId}`);
      localStorage.removeItem(`quiz_questions_${quizId}`);
      localStorage.removeItem(`quiz_expired_${quizId}`);
      
      toast({
        title: "Cache Cleared",
        description: "Quiz cache has been cleared. Retrying quiz load.",
      });
      
      setIsExpired(false);
      retryLoading();
    }
  };
  
  const handleCancelLoading = () => {
    console.log("Canceling quiz loading");
    navigate('/');
  };
  
  const handleDebugQuiz = () => {
    console.log("Debugging quiz data:");
    console.log("Quiz ID:", quizId);
    console.log("Is expired:", isExpired);
    console.log("All localStorage keys:");
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        console.log(`Key: ${key}`);
        try {
          const value = localStorage.getItem(key);
          console.log(`Value: ${value ? value.substring(0, 100) + '...' : 'null'}`);
        } catch (e) {
          console.log('Error accessing value');
        }
      }
    }
    
    toast({
      title: "Debug Information",
      description: "Quiz debug info has been logged to the console (F12)",
    });
  };
  
  if (isExpired) {
    return <QuizError 
      error="This quiz has expired because the time limit was reached."
      isExpired={true}
      onClearCache={handleClearCache}
    />;
  }
  
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
  
  if (quizStateError || !quiz) {
    const isQuizNotFoundError = quizStateError?.toLowerCase().includes('not found') || 
                               quizStateError?.toLowerCase().includes('no quiz');
                               
    return <QuizError 
      error={quizStateError || `Quiz with ID ${quizId} not found. Please check the URL and try again.`} 
      onRetry={retryLoading} 
      isRetryable={true} 
      fallbackActive={fallbackActive}
      onClearCache={handleClearCache}
      onDebug={handleDebugQuiz}
    />;
  }
  
  if (quiz.id !== quizId) {
    return <QuizError 
      error={`Quiz ID mismatch! Expected: ${quizId}, Got: ${quiz.id}. Please clear cache and try again.`}
      onRetry={retryLoading} 
      isRetryable={true} 
      fallbackActive={false}
      onClearCache={handleClearCache}
      onDebug={handleDebugQuiz}
    />;
  }
  
  const quizWithQuestions = {
    ...quiz,
    questions: questions && questions.length > 0 ? questions : (quiz.questions || [])
  };
  
  if (quizWithQuestions.questions.length === 0) {
    return <QuizError 
      error={`The quiz "${quiz.title}" has no questions. Please add questions to this quiz or select a different quiz.`} 
      onRetry={retryLoading} 
      isRetryable={true} 
      fallbackActive={false}
      onClearCache={handleClearCache}
      onDebug={handleDebugQuiz}
    />;
  }
  
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
