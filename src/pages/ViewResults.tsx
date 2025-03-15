
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Users, FileText, Clock } from 'lucide-react';
import { Quiz } from '@/components/QuizCard';
import { QuizResult } from '@/types/quiz';

const ViewResults = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("ViewResults component mounted with quizId:", quizId);
    
    // Load quiz data from localStorage
    const loadQuiz = () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log("Loading quiz with ID:", quizId);
        const storedQuizzes = localStorage.getItem('quizzes');
        
        if (!storedQuizzes) {
          console.error("No quizzes found in localStorage");
          setError("No quizzes found");
          setLoading(false);
          return;
        }
        
        const quizzes = JSON.parse(storedQuizzes) as Quiz[];
        console.log("All quizzes:", quizzes);
        
        const foundQuiz = quizzes.find(q => q.id === quizId);
        
        if (!foundQuiz) {
          console.error("Quiz not found with ID:", quizId);
          setError(`Quiz with ID ${quizId} not found`);
          setLoading(false);
          return;
        }
        
        console.log("Found quiz:", foundQuiz);
        setQuiz(foundQuiz);
        
        // Load quiz results
        const storedResults = localStorage.getItem(`quiz_results_${quizId}`);
        if (storedResults) {
          const parsedResults = JSON.parse(storedResults) as QuizResult[];
          console.log("Loaded quiz results:", parsedResults);
          setResults(parsedResults);
        } else {
          console.log("No results found for quiz");
        }
      } catch (error) {
        console.error('Error loading quiz:', error);
        setError("Failed to load quiz data");
      } finally {
        setLoading(false);
      }
    };

    loadQuiz();
  }, [quizId]);

  const handleExportResults = () => {
    try {
      if (!results.length) return;
      
      // Create CSV content
      const headers = ["Student Name", "Student ID", "Score", "Total Points", "Submitted At"];
      const csvContent = [
        headers.join(","),
        ...results.map(result => [
          result.studentName,
          result.studentId,
          result.score,
          result.totalPoints,
          new Date(result.submittedAt).toLocaleString()
        ].join(","))
      ].join("\n");
      
      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `quiz-${quizId}-results.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log("Downloaded results CSV");
    } catch (error) {
      console.error('Error exporting results:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg">Loading quiz results...</p>
        </div>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Quiz Not Found</CardTitle>
            <CardDescription>
              {error || "The quiz you're looking for doesn't exist or has been removed."}
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
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Quiz Statistics</CardTitle>
            <CardDescription>
              Overview of student attempts and performance
            </CardDescription>
          </div>
          {results.length > 0 && (
            <Button variant="outline" onClick={handleExportResults}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-secondary/30 p-4 rounded-lg">
                <div className="text-sm text-muted-foreground">Total Attempts</div>
                <div className="text-2xl font-bold">{quiz.attempts || 0}</div>
              </div>
              <div className="bg-secondary/30 p-4 rounded-lg">
                <div className="text-sm text-muted-foreground">Quiz Status</div>
                <div className="text-2xl font-bold capitalize">{quiz.status}</div>
              </div>
              <div className="bg-secondary/30 p-4 rounded-lg">
                <div className="text-sm text-muted-foreground">Average Score</div>
                <div className="text-2xl font-bold">
                  {results.length > 0 
                    ? `${Math.round(results.reduce((acc, r) => acc + (r.score / r.totalPoints * 100), 0) / results.length)}%` 
                    : 'N/A'}
                </div>
              </div>
            </div>

            <div className="bg-secondary/20 p-4 rounded-lg">
              <div className="flex flex-wrap gap-3 text-sm">
                <div className="flex items-center">
                  <FileText className="h-4 w-4 mr-1 text-primary/70" />
                  {quiz.questions} questions
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1 text-primary/70" />
                  {quiz.duration} min
                </div>
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-1 text-primary/70" />
                  {results.length} submissions
                </div>
              </div>
            </div>

            {results.length > 0 ? (
              <div>
                <h3 className="text-lg font-medium mb-3">Student Results</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="p-2 text-left">Student Name</th>
                        <th className="p-2 text-left">Student ID</th>
                        <th className="p-2 text-left">Score</th>
                        <th className="p-2 text-left">Percentage</th>
                        <th className="p-2 text-left">Submitted At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((result, index) => (
                        <tr key={index} className="border-t border-border">
                          <td className="p-2">{result.studentName}</td>
                          <td className="p-2">{result.studentId}</td>
                          <td className="p-2">{result.score}/{result.totalPoints}</td>
                          <td className="p-2">{Math.round((result.score / result.totalPoints) * 100)}%</td>
                          <td className="p-2">{new Date(result.submittedAt).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-secondary/20 p-6 rounded-lg mt-6">
                <p className="text-center text-lg text-muted-foreground">
                  No student results available yet. Results will appear here once students complete the quiz.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ViewResults;
