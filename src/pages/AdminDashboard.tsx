
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
import { PlusCircle, Search, Lock, FilePenLine } from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<string>('all');
  
  // Load quizzes from localStorage
  useEffect(() => {
    try {
      const storedQuizzes = localStorage.getItem('quizzes');
      if (storedQuizzes) {
        setQuizzes(JSON.parse(storedQuizzes));
      } else {
        // Initialize with empty array if no quizzes found
        localStorage.setItem('quizzes', JSON.stringify([]));
      }
    } catch (error) {
      console.error('Error loading quizzes:', error);
      toast({
        title: "Error",
        description: "Failed to load quizzes",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Function to handle "Create Quiz" button click
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

  // Function to handle "Copy Link" action
  const handleCopyLink = (quizId: string) => {
    toast({
      title: "Link Copied",
      description: "Quiz link has been copied to clipboard",
    });
  };
  
  // Function to handle "Delete Quiz" action
  const handleDeleteQuiz = (quizId: string) => {
    try {
      // Filter out the deleted quiz
      const updatedQuizzes = quizzes.filter(quiz => quiz.id !== quizId);
      
      // Save updated quizzes to localStorage
      localStorage.setItem('quizzes', JSON.stringify(updatedQuizzes));
      
      // Update state
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

  // Filter quizzes based on search term and active tab
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
  
  // Check if any quizzes exist
  const hasQuizzes = quizzes.length > 0;
  
  // Filter drafts, active and completed quizzes
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
          
          <Button onClick={handleCreateQuiz}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Create Quiz
          </Button>
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
