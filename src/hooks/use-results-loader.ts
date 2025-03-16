
import { useState, useEffect } from 'react';
import { useToast } from './use-toast';
import { StudentResponse } from '@/types/quiz';
import { supabase } from '@/integrations/supabase/client';

export function useResultsLoader(quizId: string | undefined) {
  const [results, setResults] = useState<StudentResponse[]>([]);
  const [quizTitle, setQuizTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const loadResults = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Validate quiz ID
        if (!quizId) {
          throw new Error('Quiz ID is missing');
        }

        console.log(`Loading results for quiz ID: ${quizId}`);
        
        // First try local storage
        const resultsKey = `quiz_results_${quizId}`;
        const storedResults = localStorage.getItem(resultsKey);
        let foundLocalResults = false;
        
        if (storedResults) {
          try {
            const parsedResults = JSON.parse(storedResults);
            console.log(`Found ${parsedResults.length} results in localStorage`);
            
            if (parsedResults.length > 0) {
              foundLocalResults = true;
              setQuizTitle(parsedResults[0].quizTitle || 'Quiz Results');
              
              // Transform results for display
              const studentResponses = parsedResults.map(result => ({
                studentName: result.studentName,
                studentId: result.studentId,
                score: result.score,
                totalPoints: result.totalPoints,
                submittedAt: result.submittedAt,
                percentageScore: result.totalPoints > 0 
                  ? Math.round((result.score / result.totalPoints) * 100) 
                  : 0,
                securityViolations: result.securityViolations,
                completed: result.completed
              }));
              
              setResults(studentResponses.sort((a, b) => a.studentId.localeCompare(b.studentId)));
            }
          } catch (parseError) {
            console.error('Error parsing stored results:', parseError);
          }
        }
        
        // If no local results or we want to try to get more up-to-date data from Supabase
        try {
          // Fetch quiz title first
          const { data: quizData, error: quizError } = await supabase
            .from('quizzes')
            .select('title')
            .eq('id', quizId)
            .maybeSingle();

          if (quizError) throw quizError;
          
          if (quizData) {
            console.log('Found quiz in database:', quizData.title);
            setQuizTitle(quizData.title);
          } else if (!foundLocalResults) {
            console.log('Quiz not found in database, using default title');
            setQuizTitle('Quiz Results');
          }

          // Fetch quiz attempts
          const { data: attemptsData, error: attemptsError } = await supabase
            .from('quiz_attempts')
            .select('id, student_name, student_id, score, total_points, submitted_at, security_violations, completed')
            .eq('quiz_id', quizId)
            .order('student_id');

          if (attemptsError) throw attemptsError;
          
          if (attemptsData && attemptsData.length > 0) {
            console.log(`Found ${attemptsData.length} attempts in database`);
            
            // Transform data
            const studentResponses = attemptsData.map(attempt => ({
              studentName: attempt.student_name,
              studentId: attempt.student_id,
              score: attempt.score,
              totalPoints: attempt.total_points,
              submittedAt: attempt.submitted_at,
              percentageScore: attempt.total_points > 0 
                ? Math.round((attempt.score / attempt.total_points) * 100) 
                : 0,
              securityViolations: attempt.security_violations,
              completed: attempt.completed
            }));
            
            setResults(studentResponses.sort((a, b) => a.studentId.localeCompare(b.studentId)));
          } else if (!foundLocalResults) {
            console.log('No results found anywhere');
            setResults([]);
          }
        } catch (supabaseError) {
          console.error('Supabase error:', supabaseError);
          if (!foundLocalResults) {
            setError('Unable to load quiz data from the server. Using local data if available.');
            toast({
              title: "Connection Error",
              description: "Unable to load from server. Using local data if available.",
              variant: "destructive",
            });
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

  return { results, quizTitle, loading, error };
}
