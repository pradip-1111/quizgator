
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Download, ArrowLeft, FileText, FileCog } from 'lucide-react';
import { StudentResponse, QuizResult } from '@/types/quiz';
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

  useEffect(() => {
    const loadResults = () => {
      setLoading(true);
      try {
        // Load quiz info
        const storedQuizzes = localStorage.getItem('quizzes');
        if (storedQuizzes) {
          const quizzes = JSON.parse(storedQuizzes);
          const quiz = quizzes.find((q: any) => q.id === quizId);
          if (quiz) {
            setQuizTitle(quiz.title);
          }
        }

        // Load quiz results - ensure we only load results for THIS quiz
        const resultsKey = `quiz_results_${quizId}`;
        console.log(`Loading results for specific quiz ID: ${quizId} using key: ${resultsKey}`);
        
        const storedResults = localStorage.getItem(resultsKey);
        if (storedResults) {
          const parsedResults = JSON.parse(storedResults) as QuizResult[];
          console.log(`Found ${parsedResults.length} results for quiz ID: ${quizId}`);
          
          // Validate that these results belong to this quiz
          const validResults = parsedResults.filter(result => result.quizId === quizId);
          console.log(`After validation: ${validResults.length} results belong to this quiz`);
          
          // Transform results for display
          const studentResponses = validResults.map(result => {
            const percentageScore = result.totalPoints > 0 
              ? Math.round((result.score / result.totalPoints) * 100) 
              : 0;
              
            return {
              studentName: result.studentName,
              studentId: result.studentId,
              score: result.score,
              totalPoints: result.totalPoints,
              submittedAt: result.submittedAt,
              percentageScore
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
        } else {
          console.log(`No results found for quiz ID: ${quizId}`);
          setResults([]);
        }
      } catch (error) {
        console.error('Error loading results:', error);
      } finally {
        setLoading(false);
      }
    };

    loadResults();
  }, [quizId]);

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
        </div>
        
        <h1 className="text-3xl font-bold mb-2">{quizTitle} - Results</h1>
        <p className="text-muted-foreground mb-6">
          {results.length} submissions (sorted by roll number)
        </p>
        
        {loading ? (
          <p>Loading results...</p>
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
