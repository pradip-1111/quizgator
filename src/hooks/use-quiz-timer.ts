
import { useEffect, useRef } from 'react';

export function useQuizTimer(
  started: boolean, 
  timeLeft: number, 
  setTimeLeft: (value: number) => void, 
  handleSubmitQuiz: () => void
) {
  const timerRef = useRef<number | null>(null);
  
  useEffect(() => {
    if (started && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev: number) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleSubmitQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      timerRef.current = timer as unknown as number;
      
      return () => clearInterval(timer);
    }
  }, [started, timeLeft, setTimeLeft, handleSubmitQuiz]);
  
  return timerRef;
}
