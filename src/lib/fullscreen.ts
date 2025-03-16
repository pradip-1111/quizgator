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
    // Block tab switching by immediately raising a warning
    if (document.hidden) {
      onTabChange(false);
      // Show a warning to the user
      alert("Warning: You are not allowed to switch tabs during the exam! Your activity is being monitored.");
    } else {
      // When coming back, consider this a successful return but warning was already triggered
      setTimeout(() => {
        onTabChange(true);
      }, 100);
    }
  };

  // Initial check - no need to trigger warning on initial setup
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

  // Setup event listeners
  document.addEventListener('visibilitychange', handleVisibilityChange);
  document.addEventListener('fullscreenchange', handleFullscreenChange);
  
  // Handle blur events (user switching away from the tab)
  const handleBlur = () => {
    if (!isFullscreenChange) {
      lastBlurTime = Date.now();
      // Immediately trigger warning when focus is lost
      setTimeout(() => onTabChange(false), 50);
    }
  };
  
  // Handle focus events (user returning to the tab)
  const handleFocus = () => {
    lastFocusTime = Date.now();
    // We don't call onTabChange(true) here to avoid resetting the warning
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

  // Block common keyboard shortcuts that might be used to switch tabs
  const handleKeyDown = (e: KeyboardEvent) => {
    // Alt+Tab, Ctrl+Tab, Alt+F4, Ctrl+N, Ctrl+T, F5, etc.
    if (
      (e.altKey && e.key === 'Tab') ||
      (e.ctrlKey && e.key === 'Tab') ||
      (e.altKey && e.key === 'F4') ||
      (e.ctrlKey && e.key === 'n') ||
      (e.ctrlKey && e.key === 't') ||
      e.key === 'F5'
    ) {
      e.preventDefault();
      alert("Warning: Keyboard shortcuts are disabled during the exam!");
      return false;
    }
  };
  
  document.addEventListener('keydown', handleKeyDown);

  // Detect contextmenu to prevent right-click
  const handleContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    alert("Right-click is disabled during the exam!");
    return false;
  };
  
  document.addEventListener('contextmenu', handleContextMenu);

  // Prevent navigation history manipulation
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    e.preventDefault();
    const message = "Warning! Leaving or refreshing this page will terminate your exam.";
    e.returnValue = message;
    return message;
  };
  
  window.addEventListener('beforeunload', handleBeforeUnload);

  // Return cleanup function
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    document.removeEventListener('fullscreenchange', handleFullscreenChange);
    window.removeEventListener('blur', handleBlur);
    window.removeEventListener('focus', handleFocus);
    document.removeEventListener('mouseleave', handleMouseLeave);
    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('contextmenu', handleContextMenu);
    window.removeEventListener('beforeunload', handleBeforeUnload);
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
      alert("Warning: Fullscreen mode is required during the exam!");
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
