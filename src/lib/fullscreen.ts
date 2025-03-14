
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

  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('blur', () => onTabChange(false));
  window.addEventListener('focus', () => onTabChange(true));

  // Return cleanup function
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('blur', () => onTabChange(false));
    window.removeEventListener('focus', () => onTabChange(true));
  };
};
