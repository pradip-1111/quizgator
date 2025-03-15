
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import QuizCard, { Quiz } from '../components/QuizCard';
import Navbar from '../components/Navbar';
import { Plus, Search, FileDown, ClipboardCheck, Settings, Clock, Trash2 } from 'lucide-react';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Dummy data for demonstration
const dummyQuizzes: Quiz[] = [
  {
    id: '1',
    title: 'Midterm Examination',
    description: 'Comprehensive test covering chapters 1-5',
    questions: 25,
    duration: 90,
    created: '2023-10-15T10:30:00Z',
    attempts: 45,
    status: 'completed'
  },
  {
    id: '2',
    title: 'Weekly Quiz #3',
    description: 'Test on recent material from week 3',
    questions: 10,
    duration: 20,
    created: '2023-10-25T14:15:00Z',
    attempts: 28,
    status: 'active'
  },
  {
    id: '3',
    title: 'Final Exam Preparation',
    description: 'Practice quiz for upcoming final exam',
    questions: 40,
    duration: 120,
    created: '2023-11-01T09:00:00Z',
    attempts: 0,
    status: 'draft'
  },
  {
    id: '4',
    title: 'Pop Quiz: Chapter 7',
    description: 'Surprise assessment on recent material',
    questions: 8,
    duration: 15,
    created: '2023-11-05T10:20:00Z',
    attempts: 32,
    status: 'active'
  }
];

const AdminDashboard = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [quizzes, setQuizzes] = useState<Quiz[]>(dummyQuizzes);
  const { toast } = useToast();

  const handleCopyLink = (quizId: string) => {
    const link = `${window.location.origin}/take-quiz/${quizId}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link copied",
      description: "Quiz link has been copied to clipboard",
    });
  };

  const clearAllQuizzes = () => {
    setQuizzes([]);
    toast({
      title: "All quizzes cleared",
      description: "Your dashboard is now empty",
    });
  };

  const filteredQuizzes = (status?: string) => {
    return quizzes
      .filter(quiz => status ? quiz.status === status : true)
      .filter(quiz => 
        quiz.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        quiz.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
  };

  const statsCards = [
    {
      title: "Total Quizzes",
      value: quizzes.length,
      icon: ClipboardCheck,
      color: "bg-blue-100 text-blue-900"
    },
    {
      title: "Active Quizzes",
      value: quizzes.filter(q => q.status === 'active').length,
      icon: Clock,
      color: "bg-green-100 text-green-900"
    },
    {
      title: "Total Attempts",
      value: quizzes.reduce((sum, quiz) => sum + quiz.attempts, 0),
      icon: FileDown,
      color: "bg-purple-100 text-purple-900"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Manage your quizzes and view results</p>
          </div>
          
          <div className="mt-4 md:mt-0 flex gap-2">
            <Link to="/create-quiz">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create New Quiz
              </Button>
            </Link>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All Quizzes
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action will remove all quizzes from your dashboard. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={clearAllQuizzes}>
                    Yes, clear all quizzes
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {statsCards.map((card, index) => (
            <div 
              key={index} 
              className="bg-card rounded-lg shadow-subtle p-6 border border-border animate-scale-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground">{card.title}</p>
                  <h3 className="text-3xl font-bold mt-1">{card.value}</h3>
                </div>
                <div className={`h-12 w-12 rounded-full ${card.color} flex items-center justify-center`}>
                  <card.icon className="h-6 w-6" />
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <h2 className="text-2xl font-semibold mb-4 sm:mb-0">Your Quizzes</h2>
          <div className="w-full sm:w-auto relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search quizzes..."
              className="w-full sm:w-[300px] pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="draft">Drafts</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-2">
            {filteredQuizzes().length > 0 ? (
              <div className="grid grid-cols-1 gap-6">
                {filteredQuizzes().map((quiz) => (
                  <QuizCard key={quiz.id} quiz={quiz} onCopyLink={handleCopyLink} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No quizzes found. Try a different search term or create a new quiz.</p>
                <Link to="/create-quiz">
                  <Button variant="outline" className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Create a Quiz
                  </Button>
                </Link>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="active" className="mt-2">
            {filteredQuizzes('active').length > 0 ? (
              <div className="grid grid-cols-1 gap-6">
                {filteredQuizzes('active').map((quiz) => (
                  <QuizCard key={quiz.id} quiz={quiz} onCopyLink={handleCopyLink} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No active quizzes found.</p>
                <Link to="/create-quiz">
                  <Button variant="outline" className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Create a Quiz
                  </Button>
                </Link>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="draft" className="mt-2">
            {filteredQuizzes('draft').length > 0 ? (
              <div className="grid grid-cols-1 gap-6">
                {filteredQuizzes('draft').map((quiz) => (
                  <QuizCard key={quiz.id} quiz={quiz} onCopyLink={handleCopyLink} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No draft quizzes found.</p>
                <Link to="/create-quiz">
                  <Button variant="outline" className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Create a Quiz
                  </Button>
                </Link>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="completed" className="mt-2">
            {filteredQuizzes('completed').length > 0 ? (
              <div className="grid grid-cols-1 gap-6">
                {filteredQuizzes('completed').map((quiz) => (
                  <QuizCard key={quiz.id} quiz={quiz} onCopyLink={handleCopyLink} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No completed quizzes found.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
