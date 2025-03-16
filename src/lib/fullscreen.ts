
// Functions for handling fullscreen mode and tab visibility detection

export const enterFullscreen = (element: HTMLElement = document.documentElement) => {
  if (element.requestFullscreen) {
    element.requestFullscreen().catch(err => {
      console.error(`Error attempting to enable fullscreen: ${err.message}`);
    });
  } else if ((element as any).mozRequestFullScreen) {
    (element as any).mozRequestFullScreen();
  } else if ((element as any).webkitRequestFullscreen) {
    (element as any).webkitRequestFullscreen();
  } else if ((element as any).msRequestFullscreen) {
    (element as any).msRequestFullscreen();
  }
};

export const exitFullscreen = () => {
  if (document.exitFullscreen) {
    document.exitFullscreen().catch(err => {
      console.error(`Error attempting to exit fullscreen: ${err.message}`);
    });
  } else if ((document as any).mozCancelFullScreen) {
    (document as any).mozCancelFullScreen();
  } else if ((document as any).webkitExitFullscreen) {
    (document as any).webkitExitFullscreen();
  } else if ((document as any).msExitFullscreen) {
    (document as any).msExitFullscreen();
  }
};

export const isFullscreen = (): boolean => {
  return !!(
    document.fullscreenElement ||
    (document as any).mozFullScreenElement ||
    (document as any).webkitFullscreenElement ||
    (document as any).msFullscreenElement
  );
};

export const setupTabVisibilityTracking = (
  onTabChange: (isVisible: boolean) => void
): (() => void) => {
  const handleVisibilityChange = () => {
    onTabChange(!document.hidden);
  };

  // Initial check
  if (document.hidden) {
    onTabChange(false);
  }

  // Add a flag to track if focus was lost due to a fullscreen change
  let isFullscreenChange = false;
  let lastFocusTime = Date.now();
  let lastBlurTime = 0;
  
  // Track fullscreen changes to avoid false positives
  const handleFullscreenChange = () => {
    isFullscreenChange = true;
    setTimeout(() => {
      isFullscreenChange = false;
    }, 500);
  };

  // Setup event listeners with a slight delay to avoid false positives
  document.addEventListener('visibilitychange', handleVisibilityChange);
  document.addEventListener('fullscreenchange', handleFullscreenChange);
  
  // Use a more aggressive approach to detect tab switching
  const handleBlur = () => {
    if (!isFullscreenChange) {
      lastBlurTime = Date.now();
      // If it's been more than 100ms since focus (not just a click outside the window)
      if (lastBlurTime - lastFocusTime > 100) {
        setTimeout(() => onTabChange(false), 50);
      }
    }
  };
  
  const handleFocus = () => {
    lastFocusTime = Date.now();
    // If it's been more than 300ms since blur (likely a tab switch, not just a click)
    if (lastFocusTime - lastBlurTime > 300 && !isFullscreenChange) {
      setTimeout(() => onTabChange(true), 50);
    }
  };
  
  window.addEventListener('blur', handleBlur);
  window.addEventListener('focus', handleFocus);
  
  // Add mouse leave detection as an additional signal
  document.addEventListener('mouseleave', () => {
    // Mouse leaving the document can be a sign of tab switching
    const now = Date.now();
    if (now - lastBlurTime > 500 && now - lastFocusTime > 500) {
      // Only count if we haven't already detected blur recently
      setTimeout(() => onTabChange(false), 100);
    }
  });

  // Return cleanup function
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    document.removeEventListener('fullscreenchange', handleFullscreenChange);
    window.removeEventListener('blur', handleBlur);
    window.removeEventListener('focus', handleFocus);
    document.removeEventListener('mouseleave', () => {});
  };
};

// Function to check if the browser supports fullscreen mode
export const isFullscreenSupported = (): boolean => {
  return !!(
    document.documentElement.requestFullscreen ||
    (document.documentElement as any).mozRequestFullScreen ||
    (document.documentElement as any).webkitRequestFullscreen ||
    (document.documentElement as any).msRequestFullscreen
  );
};

// Force fullscreen and keep trying if it fails
export const forceFullscreen = (element: HTMLElement = document.documentElement, maxAttempts = 3): void => {
  let attempts = 0;
  
  const attemptFullscreen = () => {
    if (!isFullscreen() && attempts < maxAttempts) {
      attempts++;
      enterFullscreen(element);
      
      // Check if fullscreen was successful after a short delay
      setTimeout(() => {
        if (!isFullscreen()) {
          attemptFullscreen();
        }
      }, 500);
    }
  };
  
  attemptFullscreen();
};

// Monitor fullscreen state and restore if needed
export const setupFullscreenMonitoring = (
  element: HTMLElement = document.documentElement,
  onExit?: () => void
): (() => void) => {
  let isMonitoring = true;
  
  const handleFullscreenChange = () => {
    if (isMonitoring && !isFullscreen()) {
      // User exited fullscreen, try to restore it
      setTimeout(() => {
        if (isMonitoring) {
          enterFullscreen(element);
          if (onExit) {
            onExit();
          }
        }
      }, 100);
    }
  };
  
  document.addEventListener('fullscreenchange', handleFullscreenChange);
  
  // Return cleanup function
  return () => {
    isMonitoring = false;
    document.removeEventListener('fullscreenchange', handleFullscreenChange);
  };
};
