
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
import { supabase } from '@/integrations/supabase/client';

const EditQuiz = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(true);

  // Load quiz data from Supabase
  useEffect(() => {
    const loadQuiz = async () => {
      setLoading(true);
      try {
        // First try to get quiz from Supabase
        const { data: supabaseQuiz, error } = await supabase
          .from('quizzes')
          .select('*')
          .eq('id', quizId)
          .single();
        
        if (error) {
          console.error('Error fetching quiz from Supabase:', error);
          
          // Fall back to localStorage if needed
          const storedQuizzes = localStorage.getItem('quizzes');
          if (storedQuizzes) {
            const quizzes = JSON.parse(storedQuizzes) as Quiz[];
            const foundQuiz = quizzes.find(q => q.id === quizId);
            
            if (foundQuiz) {
              setQuiz(foundQuiz);
              setTitle(foundQuiz.title);
              setDescription(foundQuiz.description);
              setDuration(foundQuiz.duration);
              return;
            }
          }
          
          toast({
            title: "Quiz Not Found",
            description: "The requested quiz couldn't be found",
            variant: "destructive",
          });
          navigate('/admin-dashboard');
          return;
        }
        
        // If we found the quiz in Supabase
        const mappedQuiz: Quiz = {
          id: supabaseQuiz.id,
          title: supabaseQuiz.title,
          description: supabaseQuiz.description || '',
          duration: supabaseQuiz.time_limit,
          created: supabaseQuiz.created_at,
          questions: 0, // We'll update this later if needed
          attempts: 0,
          status: 'active',
          userId: supabaseQuiz.created_by || ''
        };
        
        setQuiz(mappedQuiz);
        setTitle(mappedQuiz.title);
        setDescription(mappedQuiz.description);
        setDuration(mappedQuiz.duration);
      } catch (error) {
        console.error('Error loading quiz:', error);
        toast({
          title: "Error",
          description: "Failed to load quiz data",
          variant: "destructive",
        });
        navigate('/admin-dashboard');
      } finally {
        setLoading(false);
      }
    };

    if (quizId) {
      loadQuiz();
    }
  }, [quizId, toast, navigate]);

  const handleSave = async () => {
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Quiz title cannot be empty",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Update quiz in Supabase
      const { error } = await supabase
        .from('quizzes')
        .update({
          title,
          description,
          time_limit: duration,
          updated_at: new Date().toISOString()
        })
        .eq('id', quizId);
      
      if (error) {
        throw error;
      }
      
      // For backward compatibility, also update localStorage
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
      }
      
      toast({
        title: "Quiz Updated",
        description: "Your quiz has been successfully updated",
      });
      
      navigate('/admin-dashboard');
    } catch (error) {
      console.error('Error updating quiz:', error);
      toast({
        title: "Error",
        description: "Failed to update quiz",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
            <Button onClick={handleSave} disabled={loading}>
              Save Changes
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default EditQuiz;
