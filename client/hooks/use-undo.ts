import { useState, useCallback } from 'react';

interface UseUndoOptions<T> {
  initialState: T;
  maxHistory?: number;
}

export function useUndo<T>({ initialState, maxHistory = 20 }: UseUndoOptions<T>) {
  const [history, setHistory] = useState<T[]>([initialState]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const state = history[currentIndex];

  const setState = useCallback((newState: T | ((prev: T) => T)) => {
    setHistory((prev) => {
      const resolvedState =
        typeof newState === 'function' ? (newState as (prev: T) => T)(prev[currentIndex]) : newState;

      // Remove any history after current index (when user made changes after undo)
      const newHistory = prev.slice(0, currentIndex + 1);
      
      // Add new state
      newHistory.push(resolvedState);

      // Limit history size
      if (newHistory.length > maxHistory) {
        newHistory.shift();
        setCurrentIndex((i) => i); // Keep same index since we shifted
      } else {
        setCurrentIndex(newHistory.length - 1);
      }

      return newHistory;
    });
  }, [currentIndex, maxHistory]);

  const undo = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  }, [currentIndex]);

  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex((i) => i + 1);
    }
  }, [currentIndex, history.length]);

  const reset = useCallback(() => {
    setHistory([initialState]);
    setCurrentIndex(0);
  }, [initialState]);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  return {
    state,
    setState,
    undo,
    redo,
    reset,
    canUndo,
    canRedo,
  };
}
