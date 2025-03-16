
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '../context/AuthContext';
import QuizCard, { Quiz } from '../components/QuizCard';
import Navbar from '../components/Navbar';
import { PlusCircle, Search, Lock, FilePenLine, RefreshCw } from 'lucide-react';
import { clearQuizCache } from '../hooks/use-quiz-loader';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<string>('all');
  
  // Function to clear demo quiz data
  const clearDemoQuizData = () => {
    // Clear any data with "demo" in the key
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('demo') || key.includes('Demo'))) {
        console.log(`Clearing demo quiz data: ${key}`);
        localStorage.removeItem(key);
      }
    }
    
    // Also update the quizzes array to remove any demo quizzes
    const storedQuizzesJson = localStorage.getItem('quizzes');
    if (storedQuizzesJson) {
      try {
        const quizzes = JSON.parse(storedQuizzesJson);
        if (Array.isArray(quizzes)) {
          // Filter out any quizzes with "demo" in title or description
          const filteredQuizzes = quizzes.filter((q: any) => {
            const title = (q.title || '').toLowerCase();
            const desc = (q.description || '').toLowerCase();
            return !title.includes('demo') && !desc.includes('demo');
          });
          localStorage.setItem('quizzes', JSON.stringify(filteredQuizzes));
          console.log(`Removed demo quizzes from quizzes array`);
        }
      } catch (e) {
        console.error('Error filtering demo quizzes:', e);
      }
    }
  };
  
  const prepareQuizzes = (loadedQuizzes: Quiz[]) => {
    console.log(`Preparing ${loadedQuizzes.length} quizzes`);
    
    // First, filter out demo quizzes
    const nonDemoQuizzes = loadedQuizzes.filter((quiz) => {
      const title = (quiz.title || '').toLowerCase();
      const desc = (quiz.description || '').toLowerCase();
      return !title.includes('demo') && !desc.includes('demo');
    });
    
    console.log(`Filtered out demo quizzes, ${nonDemoQuizzes.length} remaining`);
    
    return nonDemoQuizzes.map(quiz => {
      if (!quiz.id) {
        console.warn("Found quiz without ID, generating one");
        quiz.id = `quiz-${Math.random().toString(36).substr(2, 9)}`;
      }
      
      if (Array.isArray(quiz.questions) && quiz.questions.length > 0) {
        console.log(`Quiz ${quiz.id} already has ${quiz.questions.length} questions array`);
        return quiz;
      }
      
      try {
        const questionsKey = `quiz_questions_${quiz.id}`;
        const creatorQuestionsKey = `quiz_creator_questions_${quiz.id}`;
        
        let foundQuestions: any[] = [];
        
        for (const key of [questionsKey, creatorQuestionsKey]) {
          const storedQuestions = localStorage.getItem(key);
          if (storedQuestions) {
            try {
              const parsedQuestions = JSON.parse(storedQuestions);
              if (Array.isArray(parsedQuestions) && parsedQuestions.length > 0) {
                console.log(`Found ${parsedQuestions.length} questions for quiz ${quiz.id} in ${key}`);
                foundQuestions = parsedQuestions;
                break;
              }
            } catch (parseError) {
              console.error(`Error parsing questions from ${key}:`, parseError);
            }
          }
        }
        
        if (foundQuestions.length > 0) {
          const validatedQuestions = foundQuestions.map(q => ({
            ...q,
            id: q.id || `question-${Math.random().toString(36).substr(2, 9)}`,
            text: q.text || 'Unknown question',
            type: validateQuestionType(q.type),
            options: Array.isArray(q.options) ? q.options.map((o: any) => ({
              ...o,
              id: o.id || `option-${Math.random().toString(36).substr(2, 9)}`,
              text: o.text || '',
              isCorrect: Boolean(o.isCorrect)
            })) : [],
            points: Number(q.points) || 1,
            required: q.required !== undefined ? Boolean(q.required) : true
          }));
          
          localStorage.setItem(`quiz_questions_${quiz.id}`, JSON.stringify(validatedQuestions));
          localStorage.setItem(`quiz_creator_questions_${quiz.id}`, JSON.stringify(validatedQuestions));
          
          return {
            ...quiz,
            questions: validatedQuestions
          };
        }
      } catch (error) {
        console.error(`Error loading questions for quiz: ${quiz.id}`, error);
      }
      
      return quiz;
    });
  };
  
  const validateQuestionType = (type: string): "multiple-choice" | "true-false" | "short-answer" | "long-answer" => {
    const validTypes = ['multiple-choice', 'true-false', 'short-answer', 'long-answer'];
    return validTypes.includes(type) 
      ? type as "multiple-choice" | "true-false" | "short-answer" | "long-answer"
      : "multiple-choice";
  };
  
  const loadQuizzes = () => {
    try {
      console.log("Loading quizzes from localStorage");
      
      // First, clear demo quiz data
      clearDemoQuizData();
      
      const storedQuizzes = localStorage.getItem('quizzes');
      if (storedQuizzes) {
        try {
          const parsedQuizzes = JSON.parse(storedQuizzes);
          
          if (!Array.isArray(parsedQuizzes)) {
            console.error('Invalid quizzes data: not an array');
            localStorage.setItem('quizzes', JSON.stringify([]));
            setQuizzes([]);
            return;
          }
          
          const preparedQuizzes = prepareQuizzes(parsedQuizzes);
          setQuizzes(preparedQuizzes);
          
          // Save the prepared quizzes back to localStorage
          localStorage.setItem('quizzes', JSON.stringify(preparedQuizzes));
          console.log(`Loaded and prepared ${preparedQuizzes.length} quizzes`);
        } catch (parseError) {
          console.error('Error parsing quizzes:', parseError);
          localStorage.setItem('quizzes', JSON.stringify([]));
          setQuizzes([]);
        }
      } else {
        console.log('No quizzes found in localStorage, initializing empty array');
        localStorage.setItem('quizzes', JSON.stringify([]));
        setQuizzes([]);
      }
    } catch (error) {
      console.error('Error loading quizzes:', error);
      toast({
        title: "Error",
        description: "Failed to load quizzes",
        variant: "destructive",
      });
    }
  };
  
  useEffect(() => {
    loadQuizzes();
  }, [toast]);

  const handleCreateQuiz = () => {
    if (user) {
      navigate('/create-quiz');
    } else {
      toast({
        title: "Authentication Required",
        description: "Please log in to create a quiz",
        variant: "destructive",
      });
      navigate('/login');
    }
  };

  const handleCopyLink = (quizId: string) => {
    toast({
      title: "Link Copied",
      description: "Quiz link has been copied to clipboard",
    });
  };
  
  const handleDeleteQuiz = (quizId: string) => {
    try {
      console.log(`Deleting quiz with ID: ${quizId}`);
      const updatedQuizzes = quizzes.filter(quiz => quiz.id !== quizId);
      
      localStorage.setItem('quizzes', JSON.stringify(updatedQuizzes));
      
      setQuizzes(updatedQuizzes);
      
      toast({
        title: "Quiz Deleted",
        description: "The quiz has been permanently deleted",
      });
    } catch (error) {
      console.error('Error deleting quiz:', error);
      toast({
        title: "Error",
        description: "Failed to delete quiz",
        variant: "destructive",
      });
    }
  };
  
  const handleClearCache = () => {
    clearQuizCache();
    toast({
      title: "Cache Cleared",
      description: "All quiz cache data has been cleared",
    });
    loadQuizzes();
  };

  const filteredQuizzes = quizzes.filter(quiz => {
    const matchesSearch = quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quiz.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === 'all') {
      return matchesSearch;
    } else if (activeTab === 'draft') {
      return matchesSearch && quiz.status === 'draft';
    } else if (activeTab === 'active') {
      return matchesSearch && quiz.status === 'active';
    } else if (activeTab === 'completed') {
      return matchesSearch && quiz.status === 'completed';
    }
    
    return matchesSearch;
  });
  
  const hasQuizzes = quizzes.length > 0;
  
  const draftQuizzes = quizzes.filter(quiz => quiz.status === 'draft').length;
  const activeQuizzes = quizzes.filter(quiz => quiz.status === 'active').length;
  const completedQuizzes = quizzes.filter(quiz => quiz.status === 'completed').length;

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Manage your quizzes and view performance analytics
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={handleCreateQuiz}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Create Quiz
            </Button>
            
            <Button variant="outline" onClick={handleClearCache}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Clear Cache
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Quizzes</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-3xl font-bold">{quizzes.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-sm font-medium text-muted-foreground">Draft</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-3xl font-bold">{draftQuizzes}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-3xl font-bold">{activeQuizzes}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-3xl font-bold">{completedQuizzes}</div>
            </CardContent>
          </Card>
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <Tabs 
            defaultValue="all" 
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList>
              <TabsTrigger value="all">All Quizzes</TabsTrigger>
              <TabsTrigger value="draft">Drafts</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search quizzes..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {hasQuizzes ? (
          <div className="space-y-4">
            {filteredQuizzes.map((quiz) => (
              <QuizCard 
                key={quiz.id} 
                quiz={quiz} 
                onCopyLink={handleCopyLink} 
                onDelete={handleDeleteQuiz}
              />
            ))}
            
            {filteredQuizzes.length === 0 && (
              <Card className="p-8 text-center">
                <CardContent>
                  <p className="text-muted-foreground mb-4">No quizzes found matching your search.</p>
                  <Button variant="outline" onClick={() => setSearchTerm('')}>
                    Clear Search
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <CardContent className="flex flex-col items-center">
              <div className="bg-secondary rounded-full p-4 mb-4">
                <FilePenLine className="h-8 w-8 text-primary" />
              </div>
              
              <h2 className="text-xl font-semibold mb-2">No Quizzes Created Yet</h2>
              <p className="text-muted-foreground mb-4 max-w-lg mx-auto">
                Get started by creating your first quiz. You can add multiple choice, 
                true/false, and text questions to test your students.
              </p>
              
              <Button onClick={handleCreateQuiz}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Create Your First Quiz
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
