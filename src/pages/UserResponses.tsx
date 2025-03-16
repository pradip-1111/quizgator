
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Search, RefreshCw } from 'lucide-react';
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

  // Function to load responses from both Supabase and localStorage
  const loadResponses = async () => {
    setLoading(true);
    try {
      console.log('Loading student responses from Supabase and localStorage...');
      
      // First, try to fetch all quiz attempts with student details from Supabase
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
        console.error('Error loading responses from Supabase:', attemptsError);
      }

      // Initialize an array to hold all responses (from both Supabase and localStorage)
      let allResponses: any[] = [];
      
      // Add Supabase responses if available
      if (attemptsData && attemptsData.length > 0) {
        console.log(`Found ${attemptsData.length} responses in Supabase`);
        
        // Transform data for display
        const supabaseResponses = attemptsData.map(attempt => {
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
            completed: attempt.completed,
            source: 'supabase'
          };
        });
        
        allResponses = [...supabaseResponses];
      }
      
      // Now check localStorage for any additional responses
      try {
        // Get all keys in localStorage
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('quiz_results_')) {
            keys.push(key);
          }
        }
        
        // Process each quiz result key
        for (const key of keys) {
          const storedResults = localStorage.getItem(key);
          if (storedResults) {
            try {
              const results = JSON.parse(storedResults);
              if (Array.isArray(results) && results.length > 0) {
                console.log(`Found ${results.length} results in localStorage for key: ${key}`);
                
                // Extract quizId from the key
                const quizId = key.replace('quiz_results_', '');
                
                // Transform and add each result
                const localResponses = results.map((result: any) => {
                  const percentageScore = result.totalPoints > 0 
                    ? Math.round((result.score / result.totalPoints) * 100) 
                    : 0;
                    
                  return {
                    id: `local-${quizId}-${result.studentId}-${Date.now()}`,
                    studentName: result.studentName,
                    studentId: result.studentId,
                    studentEmail: result.studentEmail || 'N/A',
                    quizId: result.quizId || quizId,
                    quizTitle: result.quizTitle || 'Unknown Quiz',
                    score: result.score,
                    totalPoints: result.totalPoints,
                    submittedAt: result.submittedAt,
                    percentageScore,
                    securityViolations: result.securityViolations || 0,
                    completed: result.completed !== undefined ? result.completed : true,
                    source: 'localStorage'
                  };
                });
                
                // Add to all responses
                allResponses = [...allResponses, ...localResponses];
              }
            } catch (e) {
              console.error(`Error parsing results from localStorage key ${key}:`, e);
            }
          }
        }
      } catch (localStorageError) {
        console.error('Error accessing localStorage:', localStorageError);
      }
      
      // Remove potential duplicates (same student, same quiz, same submission time)
      const uniqueResponses = allResponses.reduce((acc: any[], current: any) => {
        const isDuplicate = acc.some(item => 
          item.studentId === current.studentId && 
          item.quizId === current.quizId &&
          item.submittedAt === current.submittedAt
        );
        
        if (!isDuplicate) {
          acc.push(current);
        }
        
        return acc;
      }, []);
      
      // Sort by submission date (newest first)
      uniqueResponses.sort((a, b) => {
        const dateA = new Date(a.submittedAt).getTime();
        const dateB = new Date(b.submittedAt).getTime();
        return dateB - dateA;
      });
      
      console.log(`Total unique responses after merging: ${uniqueResponses.length}`);
      setResponses(uniqueResponses);
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

  useEffect(() => {
    loadResponses();
  }, [toast]);

  // Filter responses based on search term
  const filteredResponses = responses.filter(response => {
    const searchFields = [
      response.studentName,
      response.studentId,
      response.studentEmail,
      response.quizTitle,
    ].map(field => field?.toLowerCase());
    
    return searchFields.some(field => field && field.includes(searchTerm.toLowerCase()));
  });

  const viewQuizResults = (quizId: string) => {
    window.location.href = `/view-results/${quizId}`;
  };

  const handleRefresh = () => {
    loadResponses();
    toast({
      title: "Refreshing",
      description: "Refreshing student responses data...",
    });
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
          
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
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
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Loading student responses...</p>
            </CardContent>
          </Card>
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
                    <TableRow key={response.id || index}>
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
