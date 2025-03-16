
import { useEffect, useRef } from 'react';
import { setupTabVisibilityTracking } from '../lib/fullscreen';
import { useToast } from './use-toast';

export function useQuizSecurity(started: boolean, handleSubmitQuiz: () => void) {
  const { toast } = useToast();
  const cleanupTabTrackingRef = useRef<(() => void) | null>(null);
  
  useEffect(() => {
    if (started) {
      const cleanup = setupTabVisibilityTracking((isVisible) => {
        if (!isVisible) {
          toast({
            title: "Auto-Submission",
            description: "You attempted to switch tabs. Quiz has been auto-submitted.",
            variant: "destructive",
          });
          
          handleSubmitQuiz();
        }
      });
      
      cleanupTabTrackingRef.current = cleanup;
      
      return () => {
        if (cleanupTabTrackingRef.current) {
          cleanupTabTrackingRef.current();
        }
      };
    }
  }, [started, handleSubmitQuiz, toast]);
  
  return cleanupTabTrackingRef;
}
