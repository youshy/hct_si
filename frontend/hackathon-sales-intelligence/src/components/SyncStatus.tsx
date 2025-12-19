import type { SyncState } from '../hooks/useSync';

interface SyncStatusProps extends SyncState {
  onRetry: () => void;
}

export function SyncStatus({ isSyncing, error, onRetry }: SyncStatusProps) {
  if (isSyncing) {
    return (
      <div className="fixed top-0 left-0 right-0 bg-blue-500 text-white text-center py-1 text-sm z-50">
        <span className="inline-flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Syncing...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed top-0 left-0 right-0 bg-red-500 text-white text-center py-1 text-sm z-50">
        <span className="inline-flex items-center gap-2">
          Sync failed
          <button
            onClick={onRetry}
            className="underline font-medium"
          >
            Retry
          </button>
        </span>
      </div>
    );
  }

  return null;
}
