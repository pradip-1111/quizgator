
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowLeft, FileText, FileCog, AlertCircle } from 'lucide-react';
import { StudentResponse } from '@/types/quiz';
import { Badge } from '@/components/ui/badge';
import Navbar from '../components/Navbar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const ViewResults = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const { toast } = useToast();
  const [quizTitle, setQuizTitle] = useState('');
  const [results, setResults] = useState<StudentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadResults = async () => {
      setLoading(true);
      setError(null);
      try {
        // Load quiz info from Supabase
        if (!quizId) {
          throw new Error('Quiz ID is missing');
        }

        console.log(`Attempting to load results for quiz ID: ${quizId}`);

        // Check if we have results in localStorage first
        const resultsKey = `quiz_results_${quizId}`;
        const storedResults = localStorage.getItem(resultsKey);
        let foundLocalResults = false;
        
        if (storedResults) {
          const parsedResults = JSON.parse(storedResults);
          console.log(`Found ${parsedResults.length} results in localStorage for quiz ID: ${quizId}`);
          
          if (parsedResults.length > 0) {
            foundLocalResults = true;
            setQuizTitle(parsedResults[0].quizTitle || 'Quiz Results');
            
            // Transform results for display
            const studentResponses = parsedResults.map(result => {
              const percentageScore = result.totalPoints > 0 
                ? Math.round((result.score / result.totalPoints) * 100) 
                : 0;
                
              return {
                studentName: result.studentName,
                studentId: result.studentId,
                score: result.score,
                totalPoints: result.totalPoints,
                submittedAt: result.submittedAt,
                percentageScore,
                securityViolations: result.securityViolations,
                completed: result.completed
              };
            });
            
            setResults(studentResponses.sort((a, b) => a.studentId.localeCompare(b.studentId)));
          }
        }
        
        // If we didn't find local results, try to fetch from Supabase
        if (!foundLocalResults) {
          try {
            // Fetch quiz details - don't use single() to avoid error if no quiz found
            const { data: quizData, error: quizError } = await supabase
              .from('quizzes')
              .select('title')
              .eq('id', quizId)
              .maybeSingle();

            if (quizError) {
              console.error('Error fetching quiz:', quizError);
              throw quizError;
            }

            if (quizData) {
              console.log('Found quiz in database:', quizData.title);
              setQuizTitle(quizData.title);
            } else {
              console.log('Quiz not found in database, using default title');
              setQuizTitle('Quiz Results');
            }

            // Fetch quiz attempts for the specific quiz
            const { data: attemptsData, error: attemptsError } = await supabase
              .from('quiz_attempts')
              .select('id, student_name, student_id, score, total_points, submitted_at, security_violations, completed')
              .eq('quiz_id', quizId)
              .order('student_id');

            if (attemptsError) {
              console.error('Error fetching attempts:', attemptsError);
              throw attemptsError;
            }

            if (attemptsData && attemptsData.length > 0) {
              console.log(`Found ${attemptsData.length} attempts in database`);
              // Transform data for display
              const studentResponses = attemptsData.map(attempt => {
                const percentageScore = attempt.total_points > 0 
                  ? Math.round((attempt.score / attempt.total_points) * 100) 
                  : 0;
                  
                return {
                  studentName: attempt.student_name,
                  studentId: attempt.student_id,
                  score: attempt.score,
                  totalPoints: attempt.total_points,
                  submittedAt: attempt.submitted_at,
                  percentageScore,
                  securityViolations: attempt.security_violations,
                  completed: attempt.completed
                };
              });
              
              // Sort results by student ID (roll number) in ascending order
              const sortedResults = studentResponses.sort((a, b) => {
                // First try to sort numerically if both IDs are numbers
                const aNum = parseInt(a.studentId);
                const bNum = parseInt(b.studentId);
                
                if (!isNaN(aNum) && !isNaN(bNum)) {
                  return aNum - bNum;
                }
                
                // Fall back to string comparison if not numbers
                return a.studentId.localeCompare(b.studentId);
              });
              
              setResults(sortedResults);
            } else if (!foundLocalResults) {
              // If we get here, we didn't find results in either localStorage or database
              console.log('No results found anywhere');
              setResults([]);
            }
          } catch (supabaseError) {
            console.error('Supabase error:', supabaseError);
            // If we have local results, don't show the error
            if (!foundLocalResults) {
              setError('Unable to load quiz data from the server. Using local data if available.');
            }
          }
        }
      } catch (error) {
        console.error('Error loading results:', error);
        setError('Failed to load quiz results. Please try again.');
        toast({
          title: "Error",
          description: "Failed to load quiz results. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadResults();
  }, [quizId, toast]);

  const handleDownloadCSV = () => {
    try {
      // Create CSV content
      const headers = ['Student Name', 'Roll Number', 'Score', 'Total Points', 'Percentage', 'Submitted At'];
      const csvRows = [headers];

      results.forEach(result => {
        const row = [
          result.studentName,
          result.studentId,
          result.score.toString(),
          result.totalPoints.toString(),
          `${result.percentageScore}%`,
          new Date(result.submittedAt).toLocaleString()
        ];
        csvRows.push(row);
      });

      // Convert to CSV format
      const csvContent = csvRows.map(row => row.join(',')).join('\n');
      
      // Create and download the file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${quizTitle.replace(/\s+/g, '-')}-results.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "CSV Downloaded",
        description: "Results have been exported as CSV",
      });
    } catch (error) {
      console.error('Error generating CSV:', error);
      toast({
        title: "Error",
        description: "Failed to download results as CSV",
        variant: "destructive",
      });
    }
  };

  const handlePrintPDF = () => {
    try {
      // Create a printable version of the page
      const printContent = document.createElement('div');
      printContent.innerHTML = `
        <style>
          body { font-family: Arial, sans-serif; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          h1, h2 { margin-bottom: 10px; }
          .header { margin-bottom: 20px; }
          .score-good { color: green; }
          .score-average { color: orange; }
          .score-poor { color: red; }
        </style>
        <div class="header">
          <h1>${quizTitle} - Results</h1>
          <p>Generated on ${new Date().toLocaleString()}</p>
          <p>Total submissions: ${results.length}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Student Name</th>
              <th>Roll Number</th>
              <th>Score</th>
              <th>Percentage</th>
              <th>Submitted At</th>
            </tr>
          </thead>
          <tbody>
            ${results.map(result => `
              <tr>
                <td>${result.studentName}</td>
                <td>${result.studentId}</td>
                <td>${result.score}/${result.totalPoints}</td>
                <td class="${
                  result.percentageScore >= 80 ? 'score-good' : 
                  result.percentageScore >= 60 ? 'score-average' : 'score-poor'
                }">${result.percentageScore}%</td>
                <td>${new Date(result.submittedAt).toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
      
      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(printContent.innerHTML);
        printWindow.document.close();
        printWindow.focus();
        
        // Print after content is loaded
        printWindow.onload = function() {
          printWindow.print();
        };
        
        toast({
          title: "PDF Generated",
          description: "Results have been prepared for printing as PDF",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to open print window. Please check your popup settings.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive",
      });
    }
  };

  // Display data in table and chart format
  const chartData = results.map(result => ({
    name: result.studentName,
    score: result.percentageScore
  }));

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
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleDownloadCSV}>
                <FileCog className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrintPDF}>
                <FileText className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </div>
          )}
        </div>
        
        <h1 className="text-3xl font-bold mb-2">{quizTitle || 'Quiz Results'}</h1>
        <p className="text-muted-foreground mb-6">
          {results.length} submissions {results.length > 0 && '(sorted by roll number)'}
        </p>
        
        {loading ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p>Loading results...</p>
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-amber-600">
                <AlertCircle className="h-5 w-5 mr-2" />
                Warning
              </CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
            <CardContent>
              {results.length > 0 ? (
                <p>Showing available results from local storage.</p>
              ) : (
                <p>No results found for this quiz. Please check the quiz ID and try again.</p>
              )}
            </CardContent>
            <CardContent className="border-t pt-4">
              <p className="text-sm text-muted-foreground">Quiz ID: {quizId}</p>
            </CardContent>
          </Card>
        ) : results.length > 0 ? (
          <>
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Performance Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" />
                      <YAxis label={{ value: 'Score (%)', angle: -90, position: 'insideLeft' }} />
                      <Tooltip />
                      <Bar dataKey="score" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Student Results</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Roll Number</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Percentage</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((result, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{result.studentName}</TableCell>
                        <TableCell>{result.studentId}</TableCell>
                        <TableCell>{result.score}/{result.totalPoints}</TableCell>
                        <TableCell>{result.percentageScore}%</TableCell>
                        <TableCell>
                          <Badge className={
                            result.percentageScore >= 80 ? 'bg-green-100 text-green-800 border-green-200' : 
                            result.percentageScore >= 60 ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : 
                            'bg-red-100 text-red-800 border-red-200'
                          }>
                            {result.percentageScore >= 80 ? 'Excellent' : 
                             result.percentageScore >= 60 ? 'Satisfactory' : 
                             'Needs Improvement'}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(result.submittedAt).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
