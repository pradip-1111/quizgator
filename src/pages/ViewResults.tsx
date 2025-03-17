
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
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

const ViewResults = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const [isAdmin, setIsAdmin] = useState(false);
  const { results, quizTitle, loading, error, hasResults, retryLoading } = useResultsLoader(quizId);

  // Check if user is admin - for demonstration, checking if URL includes admin
  useEffect(() => {
    const checkIfAdmin = () => {
      const path = window.location.pathname;
      setIsAdmin(path.includes('admin-dashboard') || path.includes('admin'));
    };
    checkIfAdmin();
  }, []);

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
          <Link to={isAdmin ? "/admin-dashboard" : "/"}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to {isAdmin ? "Dashboard" : "Home"}
            </Button>
          </Link>
          
          {results.length > 0 && (
            <ExportTools 
              results={results} 
              quizTitle={quizTitle} 
              isAdmin={isAdmin} 
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
            {isAdmin && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Performance Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <PerformanceChart results={results} />
                </CardContent>
              </Card>
            )}
            
            <Card>
              <CardHeader>
                <CardTitle>{isAdmin ? "Student Results" : "Student Submissions"}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResultsTable results={results} isAdmin={isAdmin} />
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
