
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowLeft, FileText, FileCog, AlertCircle, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Navbar from '../components/Navbar';
import { useToast } from '@/hooks/use-toast';
import { useResultsLoader } from '@/hooks/use-results-loader';
import QuizError from '@/components/quiz/QuizError';
import QuizLoading from '@/components/quiz/QuizLoading';

const ViewResults = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const { results, quizTitle, loading, error, hasResults, retryLoading } = useResultsLoader(quizId);

  // Check if user is admin - for demonstration, checking if URL includes admin
  React.useEffect(() => {
    const checkIfAdmin = () => {
      const path = window.location.pathname;
      setIsAdmin(path.includes('admin-dashboard') || path.includes('admin'));
    };
    checkIfAdmin();
  }, []);

  const handleDownloadCSV = () => {
    try {
      // Create CSV content
      const headers = ['Student Name', 'Roll Number', 'Submitted At'];
      // Only add score columns if admin
      if (isAdmin) {
        headers.push('Score', 'Total Points', 'Percentage');
      }
      
      const csvRows = [headers];

      results.forEach(result => {
        const row = [
          result.studentName,
          result.studentId,
          new Date(result.submittedAt).toLocaleString()
        ];
        
        // Only add score data if admin
        if (isAdmin) {
          row.push(
            result.score.toString(),
            result.totalPoints.toString(),
            `${result.percentageScore}%`
          );
        }
        
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
      
      // Different content based on user role
      if (isAdmin) {
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
                <th>Status</th>
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
                  <td>${
                    result.percentageScore >= 80 ? 'Excellent' : 
                    result.percentageScore >= 60 ? 'Satisfactory' : 'Needs Improvement'
                  }</td>
                  <td>${new Date(result.submittedAt).toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
      } else {
        // Student view - no scores
        printContent.innerHTML = `
          <style>
            body { font-family: Arial, sans-serif; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            h1, h2 { margin-bottom: 10px; }
            .header { margin-bottom: 20px; }
          </style>
          <div class="header">
            <h1>${quizTitle} - Submissions</h1>
            <p>Generated on ${new Date().toLocaleString()}</p>
            <p>Total submissions: ${results.length}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Roll Number</th>
                <th>Submitted At</th>
              </tr>
            </thead>
            <tbody>
              ${results.map(result => `
                <tr>
                  <td>${result.studentName}</td>
                  <td>${result.studentId}</td>
                  <td>${new Date(result.submittedAt).toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
      }
      
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
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => retryLoading()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Data
              </Button>
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
        
        {error && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center text-amber-600">
                <AlertCircle className="h-5 w-5 mr-2" />
                Warning
              </CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
          </Card>
        )}
        
        {results.length > 0 ? (
          <>
            {isAdmin && (
              <>
                <Card className="mb-8">
                  <CardHeader>
                    <CardTitle>Performance Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={results.map(result => ({
                            name: result.studentName,
                            score: result.percentageScore
                          }))}
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
              </>
            )}
            
            <Card>
              <CardHeader>
                <CardTitle>{isAdmin ? "Student Results" : "Student Submissions"}</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Roll Number</TableHead>
                      {isAdmin && (
                        <>
                          <TableHead>Score</TableHead>
                          <TableHead>Percentage</TableHead>
                          <TableHead>Status</TableHead>
                        </>
                      )}
                      <TableHead>Submitted At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((result, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{result.studentName}</TableCell>
                        <TableCell>{result.studentId}</TableCell>
                        {isAdmin && (
                          <>
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
                          </>
                        )}
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
