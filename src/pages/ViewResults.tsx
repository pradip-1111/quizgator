
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Quiz } from '@/components/QuizCard';

const ViewResults = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load quiz data from localStorage
    const loadQuiz = () => {
      setLoading(true);
      try {
        const storedQuizzes = localStorage.getItem('quizzes');
        if (storedQuizzes) {
          const quizzes = JSON.parse(storedQuizzes) as Quiz[];
          const foundQuiz = quizzes.find(q => q.id === quizId);
          
          if (foundQuiz) {
            setQuiz(foundQuiz);
          }
        }
      } catch (error) {
        console.error('Error loading quiz:', error);
      } finally {
        setLoading(false);
      }
    };

    loadQuiz();
  }, [quizId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg">Loading quiz results...</p>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Quiz Not Found</CardTitle>
            <CardDescription>
              The quiz you're looking for doesn't exist or has been removed.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Link to="/admin-dashboard">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Link to="/admin-dashboard">
          <Button variant="outline" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        <h1 className="text-3xl font-bold mb-2">{quiz.title} - Results</h1>
        <p className="text-muted-foreground">{quiz.description}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quiz Statistics</CardTitle>
          <CardDescription>
            Overview of student attempts and performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-secondary/30 p-4 rounded-lg">
                <div className="text-sm text-muted-foreground">Total Attempts</div>
                <div className="text-2xl font-bold">{quiz.attempts}</div>
              </div>
              <div className="bg-secondary/30 p-4 rounded-lg">
                <div className="text-sm text-muted-foreground">Quiz Status</div>
                <div className="text-2xl font-bold capitalize">{quiz.status}</div>
              </div>
              <div className="bg-secondary/30 p-4 rounded-lg">
                <div className="text-sm text-muted-foreground">Questions</div>
                <div className="text-2xl font-bold">{quiz.questions}</div>
              </div>
            </div>

            <div className="bg-secondary/20 p-6 rounded-lg mt-6">
              <p className="text-center text-lg text-muted-foreground">
                Detailed results and student responses will appear here once students complete the quiz.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ViewResults;
