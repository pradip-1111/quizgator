
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
            // Submit the quiz when time runs out without affecting link validity
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
