
import { useEffect, useRef } from 'react';

export function useQuizTimer(
  started: boolean, 
  timeLeft: number, 
  setTimeLeft: React.Dispatch<React.SetStateAction<number>>, 
  handleSubmitQuiz: () => void
) {
  const timerRef = useRef<number | null>(null);
  
  useEffect(() => {
    if (started && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            // Mark the quiz as expired in localStorage
            try {
              const params = new URLSearchParams(window.location.search);
              const quizId = window.location.pathname.split('/').pop() || params.get('id') || '';
              if (quizId) {
                localStorage.setItem(`quiz_expired_${quizId}`, 'true');
                console.log(`Quiz ${quizId} marked as expired`);
              }
            } catch (e) {
              console.error('Error marking quiz as expired:', e);
            }
            
            // Submit the quiz when time runs out
            handleSubmitQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      timerRef.current = timer as unknown as number;
      
      return () => {
        if (timer) {
          clearInterval(timer);
        }
      };
    }
  }, [started, timeLeft, setTimeLeft, handleSubmitQuiz]);
  
  return timerRef;
}
