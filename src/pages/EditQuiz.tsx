
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Navbar from '../components/Navbar';
import { Quiz } from '@/components/QuizCard';
import { ArrowLeft } from 'lucide-react';

const EditQuiz = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(true);

  // Load quiz data from localStorage
  useEffect(() => {
    const loadQuiz = () => {
      setLoading(true);
      try {
        const storedQuizzes = localStorage.getItem('quizzes');
        if (storedQuizzes) {
          const quizzes = JSON.parse(storedQuizzes) as Quiz[];
          const foundQuiz = quizzes.find(q => q.id === quizId);
          
          if (foundQuiz) {
            setQuiz(foundQuiz);
            setTitle(foundQuiz.title);
            setDescription(foundQuiz.description);
            setDuration(foundQuiz.duration);
          } else {
            toast({
              title: "Quiz Not Found",
              description: "The requested quiz couldn't be found",
              variant: "destructive",
            });
            navigate('/admin-dashboard');
          }
        }
      } catch (error) {
        console.error('Error loading quiz:', error);
        toast({
          title: "Error",
          description: "Failed to load quiz data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadQuiz();
  }, [quizId, toast, navigate]);

  const handleSave = () => {
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Quiz title cannot be empty",
        variant: "destructive",
      });
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
              title,
              description,
              duration
            };
          }
          return q;
        });
        
        localStorage.setItem('quizzes', JSON.stringify(updatedQuizzes));
        
        // IMPORTANT: Also update any stored questions to ensure data consistency
        const questionsKey = `quiz_creator_questions_${quizId}`;
        const storedQuestions = localStorage.getItem(questionsKey);
        
        if (storedQuestions) {
          // Make sure we preserve the questions when updating quiz details
          localStorage.setItem(questionsKey, storedQuestions);
        }
        
        toast({
          title: "Quiz Updated",
          description: "Your quiz has been successfully updated",
        });
        
        navigate('/admin-dashboard');
      }
    } catch (error) {
      console.error('Error updating quiz:', error);
      toast({
        title: "Error",
        description: "Failed to update quiz",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <p className="text-center">Loading quiz...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link to="/admin-dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
        
        <h1 className="text-3xl font-bold mb-8">Edit Quiz</h1>
        
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Quiz Details</CardTitle>
            <CardDescription>
              Update your quiz information below
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Quiz Title</Label>
              <Input 
                id="title" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a title for your quiz"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                value={description} 
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter a description for your quiz"
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input 
                id="duration" 
                type="number" 
                value={duration} 
                onChange={(e) => setDuration(Number(e.target.value))}
                min={1}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => navigate('/admin-dashboard')}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Changes
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default EditQuiz;
