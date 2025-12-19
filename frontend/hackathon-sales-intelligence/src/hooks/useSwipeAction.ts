import { useState, useRef, useCallback } from 'react';

interface UseSwipeActionOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number; // percentage of width (0-1)
  disabled?: boolean;
}

interface SwipeState {
  offsetX: number;
  direction: 'left' | 'right' | null;
  isTriggered: boolean;
}

export function useSwipeAction({
  onSwipeLeft,
  onSwipeRight,
  threshold = 0.3,
  disabled = false
}: UseSwipeActionOptions) {
  const [swipeState, setSwipeState] = useState<SwipeState>({
    offsetX: 0,
    direction: null,
    isTriggered: false
  });

  const startX = useRef(0);
  const elementWidth = useRef(0);
  const isSwiping = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (disabled) return;
    startX.current = e.touches[0].clientX;
    elementWidth.current = e.currentTarget.offsetWidth;
    isSwiping.current = true;
  }, [disabled]);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (!isSwiping.current || disabled) return;

    const currentX = e.touches[0].clientX;
    const diff = currentX - startX.current;
    const maxOffset = elementWidth.current * 0.4;
    const clampedOffset = Math.max(-maxOffset, Math.min(maxOffset, diff));

    const direction = diff > 0 ? 'right' : diff < 0 ? 'left' : null;
    const thresholdPx = elementWidth.current * threshold;
    const isTriggered = Math.abs(diff) > thresholdPx;

    setSwipeState({
      offsetX: clampedOffset,
      direction,
      isTriggered
    });
  }, [disabled, threshold]);

  const handleTouchEnd = useCallback(() => {
    if (!isSwiping.current || disabled) return;
    isSwiping.current = false;

    if (swipeState.isTriggered) {
      if (swipeState.direction === 'right' && onSwipeRight) {
        if (navigator.vibrate) navigator.vibrate([10, 50, 10]);
        onSwipeRight();
      } else if (swipeState.direction === 'left' && onSwipeLeft) {
        if (navigator.vibrate) navigator.vibrate(10);
        onSwipeLeft();
      }
    }

    setSwipeState({ offsetX: 0, direction: null, isTriggered: false });
  }, [disabled, swipeState, onSwipeLeft, onSwipeRight]);

  const resetSwipe = useCallback(() => {
    setSwipeState({ offsetX: 0, direction: null, isTriggered: false });
  }, []);

  return {
    swipeState,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onTouchCancel: resetSwipe
    }
  };
}
