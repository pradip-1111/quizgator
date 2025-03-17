
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

  const loadResults = async () => {
    // Reset state at the beginning of each load attempt
    setLoading(true);
    setError(null);
    
    if (!quizId) {
      console.error('No quiz ID provided');
      setError('Quiz ID is missing');
      setLoading(false);
      return;
    }

    console.log(`Loading results for quiz ID: ${quizId}`);
    
    // First check local storage regardless of Supabase status
    const resultsKey = `quiz_results_${quizId}`;
    const storedResults = localStorage.getItem(resultsKey);
    let foundLocalResults = false;
    
    if (storedResults) {
      try {
        const parsedResults = JSON.parse(storedResults);
        console.log(`Found ${parsedResults.length} results in localStorage for key: ${resultsKey}`);
        
        if (parsedResults.length > 0) {
          foundLocalResults = true;
          setQuizTitle(parsedResults[0].quizTitle || 'Quiz Results');
          
          // Transform results for display
          const studentResponses: StudentResponse[] = parsedResults.map((result: any) => ({
            studentName: result.studentName,
            studentId: result.studentId,
            score: result.score,
            totalPoints: result.totalPoints,
            submittedAt: result.submittedAt,
            percentageScore: result.totalPoints > 0 
              ? Math.round((result.score / result.totalPoints) * 100) 
              : 0,
            securityViolations: result.securityViolations,
            completed: result.completed,
            quizTitle: result.quizTitle
          }));
          
          setResults(studentResponses.sort((a, b) => a.studentId.localeCompare(b.studentId)));
        }
      } catch (parseError) {
        console.error('Error parsing stored results:', parseError);
      }
    } else {
      console.log(`No local storage results found for key: ${resultsKey}`);
    }
    
    // Always try to get data from Supabase regardless of local results
    try {
      // Fetch quiz title first
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select('title')
        .eq('id', quizId)
        .maybeSingle();

      if (quizError) {
        console.error('Error fetching quiz:', quizError);
        if (!foundLocalResults) {
          setError('Failed to retrieve quiz information');
        }
      } else if (quizData) {
        console.log('Found quiz in database:', quizData.title);
        setQuizTitle(quizData.title);
      } else if (!foundLocalResults) {
        console.log('Quiz not found in database');
        setQuizTitle('Quiz Results');
        // Only set error if we didn't find local results
        setError('Quiz not found in database');
      }

      // Fetch quiz attempts even if the quiz title fetch failed
      const { data: attemptsData, error: attemptsError } = await supabase
        .from('quiz_attempts')
        .select('id, student_name, student_id, score, total_points, submitted_at, security_violations, completed')
        .eq('quiz_id', quizId)
        .order('student_id');

      if (attemptsError) {
        console.error('Error fetching attempts:', attemptsError);
        if (!foundLocalResults) {
          setError(error => error ? `${error}. Also failed to load quiz attempts.` : 'Failed to load quiz attempts');
        }
      } else if (attemptsData && attemptsData.length > 0) {
        console.log(`Found ${attemptsData.length} attempts in database`);
        
        // Transform data
        const studentResponses: StudentResponse[] = attemptsData.map(attempt => ({
          studentName: attempt.student_name,
          studentId: attempt.student_id,
          score: attempt.score,
          totalPoints: attempt.total_points,
          submittedAt: attempt.submitted_at,
          percentageScore: attempt.total_points > 0 
            ? Math.round((attempt.score / attempt.total_points) * 100) 
            : 0,
          securityViolations: attempt.security_violations,
          completed: attempt.completed,
          quizTitle: quizTitle
        }));
        
        setResults(studentResponses.sort((a, b) => a.studentId.localeCompare(b.studentId)));
        // Clear any error if we successfully retrieved attempts
        if (!quizError) {
          setError(null);
        }
      } else if (!foundLocalResults) {
        console.log('No attempts found in database');
        setResults([]);
      }
    } catch (supabaseError) {
      console.error('Supabase error:', supabaseError);
      if (!foundLocalResults) {
        setError('Unable to connect to the server. Using local data if available.');
        toast({
          title: "Connection Error",
          description: "Unable to connect to server. Using local data if available.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResults();
  }, [quizId]); // eslint-disable-line react-hooks/exhaustive-deps

  return { 
    results, 
    quizTitle, 
    loading, 
    error,
    hasResults: results.length > 0,
    retryLoading: loadResults
  };
}
