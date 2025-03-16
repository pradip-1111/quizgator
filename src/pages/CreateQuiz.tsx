
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Save, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import QuizDetails from '../components/quiz-creator/QuizDetails';
import QuestionsList from '../components/quiz-creator/QuestionsList';
import QuizSummary from '../components/quiz-creator/QuizSummary';
import { useQuizCreator } from '../hooks/use-quiz-creator';
import { useAuth } from '../context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const CreateQuiz = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [authChecked, setAuthChecked] = useState(false);
  
  useEffect(() => {
    // Check current authentication session
    const checkAuth = async () => {
      try {
        console.log("Checking auth status, current user:", user);
        
        if (!user) {
          console.log("No user found, redirecting to login");
          toast({
            title: "Authentication Required",
            description: "You must be logged in to create a quiz",
            variant: "destructive",
          });
          navigate('/login');
          return;
        }
        
        // Verification of session completed successfully
        setAuthChecked(true);
      } catch (err) {
        console.error("Auth check error:", err);
        toast({
          title: "Authentication Error",
          description: "There was a problem verifying your login status",
          variant: "destructive",
        });
        navigate('/login');
      }
    };
    
    checkAuth();
  }, [user, navigate, toast]);
  
  const {
    quizTitle, setQuizTitle,
    quizDescription, setQuizDescription,
    timeLimit, setTimeLimit,
    passingScore, setPassingScore,
    randomizeQuestions, setRandomizeQuestions,
    showResults, setShowResults,
    loading,
    questions,
    handleAddQuestion,
    handleUpdateQuestion,
    handleDeleteQuestion,
    handleSaveDraft,
    handlePublishQuiz
  } = useQuizCreator();

  // Don't render the page at all if auth hasn't been checked or there's no user
  if (!authChecked || !user) {
    return null;
  }

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
            
            <QuizDetails
              quizTitle={quizTitle}
              setQuizTitle={setQuizTitle}
              quizDescription={quizDescription}
              setQuizDescription={setQuizDescription}
              timeLimit={timeLimit}
              setTimeLimit={setTimeLimit}
              passingScore={passingScore}
              setPassingScore={setPassingScore}
              randomizeQuestions={randomizeQuestions}
              setRandomizeQuestions={setRandomizeQuestions}
              showResults={showResults}
              setShowResults={setShowResults}
            />
            
            <QuestionsList
              questions={questions}
              onAddQuestion={handleAddQuestion}
              onUpdateQuestion={handleUpdateQuestion}
              onDeleteQuestion={handleDeleteQuestion}
            />
            
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
            <QuizSummary 
              questions={questions} 
              timeLimit={timeLimit} 
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default CreateQuiz;
