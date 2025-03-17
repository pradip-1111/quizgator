
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Download, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const QuizComplete = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [quizResult, setQuizResult] = useState<any>(null);

  // Try to get quiz result from location state or localStorage
  useEffect(() => {
    if (location.state?.quizResult) {
      setQuizResult(location.state.quizResult);
    } else {
      // Try to find the most recent quiz result in localStorage
      const recentResult = getRecentQuizResult();
      if (recentResult) {
        setQuizResult(recentResult);
      }
    }
  }, [location.state]);

  // Get the most recent quiz result from localStorage
  const getRecentQuizResult = () => {
    try {
      // Find the most recent quiz result in localStorage
      const keys = Object.keys(localStorage);
      const resultKeys = keys.filter(key => key.startsWith('quiz_results_'));
      
      if (resultKeys.length === 0) return null;
      
      // Try each result key until we find one with results
      for (const key of resultKeys) {
        const storedResults = localStorage.getItem(key);
        if (storedResults) {
          const results = JSON.parse(storedResults);
          if (Array.isArray(results) && results.length > 0) {
            // Return the most recent result
            return results[results.length - 1];
          }
        }
      }
      return null;
    } catch (error) {
      console.error('Error retrieving quiz result:', error);
      return null;
    }
  };

  const handleSaveResponse = () => {
    if (!quizResult) {
      toast({
        title: "No results found",
        description: "Unable to find your quiz results to save.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      // Create a formatted result file
      const quizTitle = quizResult.quizTitle || 'Quiz';
      const studentName = quizResult.studentName || 'Student';
      const date = new Date(quizResult.submittedAt).toLocaleDateString();
      
      // Create a formatted string with the quiz results, without scores
      let resultText = `Quiz Response Confirmation for: ${quizTitle}\n`;
      resultText += `Student: ${studentName}\n`;
      resultText += `Date: ${date}\n\n`;
      
      // Add answers if available, but not scores
      if (quizResult.answers && Array.isArray(quizResult.answers)) {
        resultText += `Your Responses:\n`;
        quizResult.answers.forEach((answer: any, index: number) => {
          resultText += `\nQuestion ${index + 1}:\n`;
          if (answer.textAnswer) {
            resultText += `Answer: ${answer.textAnswer}\n`;
          } else if (answer.selectedOptionId) {
            resultText += `Selected Option: ${answer.selectedOptionId}\n`;
          } else {
            resultText += `No answer provided\n`;
          }
        });
      }
      
      // Create and download the file
      const blob = new Blob([resultText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${quizTitle.replace(/\s+/g, '_')}_response_${date.replace(/\//g, '-')}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Response Saved",
        description: "Your quiz responses have been saved successfully.",
      });
    } catch (error) {
      console.error('Error saving quiz responses:', error);
      toast({
        title: "Save Failed",
        description: "There was a problem saving your responses.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md shadow-lg border-border animate-fade-in">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="h-16 w-16 text-primary" />
          </div>
          <CardTitle className="text-2xl">Quiz Submitted</CardTitle>
          <CardDescription>
            Thank you for completing the quiz
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4 pt-4">
          <p className="text-muted-foreground">
            Your responses have been recorded successfully.
          </p>
          <p className="text-muted-foreground">
            A confirmation has been sent to your registered email address.
          </p>
          
          {quizResult && quizResult.answers && quizResult.answers.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-md p-3 text-left mt-4">
              <p className="font-medium text-gray-800 mb-2">Your Responses:</p>
              <div className="max-h-60 overflow-y-auto text-sm">
                {quizResult.answers.map((answer: any, index: number) => (
                  <div key={index} className="mb-3 pb-3 border-b border-gray-100 last:border-0">
                    <p className="font-medium text-gray-700">Question {index + 1}:</p>
                    {answer.textAnswer ? (
                      <p className="text-gray-600">Answer: {answer.textAnswer}</p>
                    ) : answer.selectedOptionId ? (
                      <p className="text-gray-600">Selected Option: #{answer.selectedOptionId}</p>
                    ) : (
                      <p className="text-gray-600 italic">No answer provided</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="h-1 w-full bg-border/50 rounded-full my-4" />
          <p className="text-sm">
            The quiz administrator will be notified of your submission.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button 
            onClick={handleSaveResponse} 
            className="w-full" 
            variant="outline"
            disabled={isSaving || !quizResult}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Save Your Responses
              </>
            )}
          </Button>
          <Button variant="default" className="w-full" onClick={() => navigate('/')}>
            Return to Home
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default QuizComplete;
