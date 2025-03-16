
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import Navbar from '../components/Navbar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const UserResponses = () => {
  const { toast } = useToast();
  const [responses, setResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadResponses = async () => {
      setLoading(true);
      try {
        // Fetch all quiz attempts with student details
        const { data: attemptsData, error: attemptsError } = await supabase
          .from('quiz_attempts')
          .select(`
            id, 
            student_name, 
            student_id, 
            student_email, 
            score, 
            total_points, 
            submitted_at, 
            security_violations, 
            completed,
            quiz_id,
            quizzes(title)
          `)
          .order('submitted_at', { ascending: false });

        if (attemptsError) {
          throw attemptsError;
        }

        if (attemptsData) {
          // Transform data for display
          const transformedResponses = attemptsData.map(attempt => {
            const percentageScore = attempt.total_points > 0 
              ? Math.round((attempt.score / attempt.total_points) * 100) 
              : 0;
              
            return {
              id: attempt.id,
              studentName: attempt.student_name,
              studentId: attempt.student_id,
              studentEmail: attempt.student_email || 'N/A',
              quizId: attempt.quiz_id,
              quizTitle: attempt.quizzes?.title || 'Unknown Quiz',
              score: attempt.score,
              totalPoints: attempt.total_points,
              submittedAt: attempt.submitted_at,
              percentageScore,
              securityViolations: attempt.security_violations || 0,
              completed: attempt.completed
            };
          });
          
          setResponses(transformedResponses);
        }
      } catch (error) {
        console.error('Error loading responses:', error);
        toast({
          title: "Error",
          description: "Failed to load student responses. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadResponses();
  }, [toast]);

  // Filter responses based on search term
  const filteredResponses = responses.filter(response => {
    const searchFields = [
      response.studentName,
      response.studentId,
      response.studentEmail,
      response.quizTitle,
    ].map(field => field.toLowerCase());
    
    return searchFields.some(field => field.includes(searchTerm.toLowerCase()));
  });

  const viewQuizResults = (quizId: string) => {
    window.location.href = `/view-results/${quizId}`;
  };

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
        </div>
        
        <h1 className="text-3xl font-bold mb-2">Student Responses</h1>
        <p className="text-muted-foreground mb-6">
          View all student quiz attempts and responses
        </p>
        
        <div className="relative w-full md:w-64 mb-6">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search responses..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {loading ? (
          <p>Loading responses...</p>
        ) : responses.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>All Student Responses</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Roll Number</TableHead>
                    <TableHead>Quiz</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted At</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResponses.map((response, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{response.studentName}</TableCell>
                      <TableCell>{response.studentId}</TableCell>
                      <TableCell>{response.quizTitle}</TableCell>
                      <TableCell>{response.score}/{response.totalPoints} ({response.percentageScore}%)</TableCell>
                      <TableCell>
                        {response.completed ? (
                          <Badge className={
                            response.percentageScore >= 80 ? 'bg-green-100 text-green-800 border-green-200' : 
                            response.percentageScore >= 60 ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : 
                            'bg-red-100 text-red-800 border-red-200'
                          }>
                            {response.percentageScore >= 80 ? 'Excellent' : 
                             response.percentageScore >= 60 ? 'Satisfactory' : 
                             'Needs Improvement'}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">
                            Incomplete
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{new Date(response.submittedAt).toLocaleString()}</TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => viewQuizResults(response.quizId)}
                        >
                          View Quiz
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No student responses available yet.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default UserResponses;
