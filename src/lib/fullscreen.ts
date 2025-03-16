
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

  // Setup event listeners with a slight delay to avoid false positives
  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  // Track window focus/blur for better detection
  window.addEventListener('blur', () => {
    setTimeout(() => onTabChange(false), 100);
  });
  
  window.addEventListener('focus', () => {
    setTimeout(() => onTabChange(true), 100);
  });

  // Return cleanup function
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('blur', () => onTabChange(false));
    window.removeEventListener('focus', () => onTabChange(true));
  };
};

// New function to check if the browser supports fullscreen mode
export const isFullscreenSupported = (): boolean => {
  return !!(
    document.documentElement.requestFullscreen ||
    (document.documentElement as any).mozRequestFullScreen ||
    (document.documentElement as any).webkitRequestFullscreen ||
    (document.documentElement as any).msRequestFullscreen
  );
};
