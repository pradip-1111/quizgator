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
    // This counts visibility changes but doesn't block tab switching
    if (document.hidden) {
      onTabChange(false);
    } else {
      // When coming back, consider this a successful return
      setTimeout(() => {
        onTabChange(true);
      }, 100);
    }
  };

  // Initial check - no need to trigger warning on initial setup
  let isFullscreenChange = false;
  let lastFocusTime = Date.now();
  let lastBlurTime = 0;
  let switchCount = 0;
  const MAX_SWITCHES_WITHOUT_WARNING = 0; // This ensures every switch counts
  
  // Track fullscreen changes to avoid false positives
  const handleFullscreenChange = () => {
    isFullscreenChange = true;
    setTimeout(() => {
      isFullscreenChange = false;
    }, 500);
  };

  // Setup event listeners
  document.addEventListener('visibilitychange', handleVisibilityChange);
  document.addEventListener('fullscreenchange', handleFullscreenChange);
  
  // Handle blur events (user switching away from the tab)
  const handleBlur = () => {
    if (!isFullscreenChange) {
      lastBlurTime = Date.now();
      // Only count as a switch if it's been a while since last focus
      if (lastBlurTime - lastFocusTime > 100) {
        switchCount++;
        // Allow a few quick switches before triggering the warning
        if (switchCount > MAX_SWITCHES_WITHOUT_WARNING) {
          setTimeout(() => onTabChange(false), 50);
          switchCount = 0; // Reset after triggering
        }
      }
    }
  };
  
  // Handle focus events (user returning to the tab)
  const handleFocus = () => {
    lastFocusTime = Date.now();
    // If returning after a longer time (likely a tab switch)
    if (lastFocusTime - lastBlurTime > 300 && !isFullscreenChange) {
      // We don't call onTabChange(true) here to avoid resetting the warning
    }
  };
  
  window.addEventListener('blur', handleBlur);
  window.addEventListener('focus', handleFocus);
  
  // Add mouse leave detection as an additional signal
  const handleMouseLeave = () => {
    // Mouse leaving the document can be a sign of tab switching
    const now = Date.now();
    if (now - lastBlurTime > 500 && now - lastFocusTime > 500) {
      // Only count if we haven't already detected blur recently
      setTimeout(() => onTabChange(false), 100);
    }
  };
  
  document.addEventListener('mouseleave', handleMouseLeave);

  // Return cleanup function
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    document.removeEventListener('fullscreenchange', handleFullscreenChange);
    window.removeEventListener('blur', handleBlur);
    window.removeEventListener('focus', handleFocus);
    document.removeEventListener('mouseleave', handleMouseLeave);
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
