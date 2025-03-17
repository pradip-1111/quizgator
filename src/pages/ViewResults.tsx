
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Navbar from '../components/Navbar';
import { useResultsLoader } from '@/hooks/use-results-loader';
import QuizError from '@/components/quiz/QuizError';
import QuizLoading from '@/components/quiz/QuizLoading';
import ResultsTable from '@/components/results/ResultsTable';
import PerformanceChart from '@/components/results/PerformanceChart';
import ExportTools from '@/components/results/ExportTools';
import ResultsWarning from '@/components/results/ResultsWarning';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const ViewResults = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { results, quizTitle, loading, error, hasResults, retryLoading } = useResultsLoader(quizId);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check if user is authorized to view this quiz's results
  useEffect(() => {
    const checkAccess = async () => {
      setIsLoading(true);
      
      try {
        // First check if user exists
        if (!user) {
          console.log('Authorization failed: No user found');
          toast({
            title: "Access Denied",
            description: "Please log in to view this page",
            variant: "destructive",
          });
          navigate('/');
          return;
        }
        
        // Check if user is an admin
        if (user.role !== 'admin') {
          console.log('Authorization failed: User is not an admin', user.role);
          toast({
            title: "Access Denied",
            description: "Only administrators can view quiz results",
            variant: "destructive",
          });
          navigate('/');
          return;
        }
        
        // If we have a quiz ID, check if this admin is allowed to view it
        if (quizId) {
          // Get the quiz details
          const { data, error } = await supabase
            .from('quizzes')
            .select('created_by')
            .eq('id', quizId)
            .maybeSingle();
          
          if (error) {
            console.error('Error checking quiz creator:', error);
            toast({
              title: "Error",
              description: "Could not verify quiz ownership",
              variant: "destructive",
            });
            navigate('/admin-dashboard');
            return;
          }
          
          // Admin can view the results if they created the quiz or if there's no creator assigned
          if (data && (!data.created_by || data.created_by === user.id)) {
            console.log('User authorized to view results:', { 
              quizCreator: data?.created_by, 
              currentUser: user.id 
            });
            setIsAuthorized(true);
          } else {
            console.log('Access denied - quiz creator mismatch:', { 
              quizCreator: data?.created_by, 
              currentUser: user.id 
            });
            toast({
              title: "Access Denied",
              description: "You can only view results for quizzes you created",
              variant: "destructive",
            });
            navigate('/admin-dashboard');
            return;
          }
        } else {
          // No quiz ID provided
          console.log('Authorization failed: No quiz ID provided');
          toast({
            title: "Error",
            description: "No quiz specified",
            variant: "destructive",
          });
          navigate('/admin-dashboard');
          return;
        }
      } catch (error) {
        console.error('Error in authorization check:', error);
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
        navigate('/admin-dashboard');
        return;
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAccess();
  }, [user, quizId, navigate, toast]);

  // We need to ensure the component doesn't render anything until authorization is confirmed
  // This is critical to prevent content flashing before redirect
  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <QuizLoading />
        </div>
      </div>
    );
  }

  // If not authorized, don't render anything (redirect should happen)
  if (!isAuthorized) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Link to="/admin-dashboard" className="mb-6 block">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <QuizLoading />
        </div>
      </div>
    );
  }

  // Show error page only if there's an error AND no results available
  if (error && !hasResults) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Link to="/admin-dashboard" className="mb-6 block">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <QuizError error={error} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex justify-between items-center">
          <Link to="/admin-dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          
          {results.length > 0 && (
            <ExportTools 
              results={results} 
              quizTitle={quizTitle} 
              isAdmin={true} 
              onRefresh={retryLoading} 
            />
          )}
        </div>
        
        <h1 className="text-3xl font-bold mb-2">{quizTitle || 'Quiz Results'}</h1>
        <p className="text-muted-foreground mb-6">
          {results.length} submissions {results.length > 0 && '(sorted by roll number)'}
        </p>
        
        <ResultsWarning error={error} />
        
        {results.length > 0 ? (
          <>
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Performance Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <PerformanceChart results={results} />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Student Results</CardTitle>
              </CardHeader>
              <CardContent>
                <ResultsTable results={results} isAdmin={true} />
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No results available for this quiz yet.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ViewResults;
