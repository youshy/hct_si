import { useState, useEffect, useCallback, useRef } from 'react';
import { performSync } from '../lib/api/sync';

export interface SyncState {
  isSyncing: boolean;
  lastSyncTime: Date | null;
  error: string | null;
}

export function useSync() {
  const [state, setState] = useState<SyncState>({
    isSyncing: false,
    lastSyncTime: null,
    error: null
  });

  const retryTimeoutRef = useRef<number | null>(null);

  const syncNow = useCallback(async () => {
    if (state.isSyncing || !navigator.onLine) return;

    setState(s => ({ ...s, isSyncing: true, error: null }));

    try {
      await performSync();
      setState({
        isSyncing: false,
        lastSyncTime: new Date(),
        error: null
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sync failed';
      setState(s => ({
        ...s,
        isSyncing: false,
        error: errorMessage
      }));

      // Retry after 30 seconds
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      retryTimeoutRef.current = window.setTimeout(() => {
        syncNow();
      }, 30000);
    }
  }, [state.isSyncing]);

  // Sync on mount
  useEffect(() => {
    syncNow();

    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  // Sync when coming online
  useEffect(() => {
    const handleOnline = () => syncNow();
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [syncNow]);

  return {
    ...state,
    syncNow
  };
}
