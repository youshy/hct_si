interface SyncStatusBarProps {
  isSyncing: boolean;
  lastSyncTime: Date | null;
  error: string | null;
  onSync: () => void;
}

function formatLastSync(date: Date | null): string {
  if (!date) return 'Never synced';

  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString();
}

export function SyncStatusBar({ isSyncing, lastSyncTime, error, onSync }: SyncStatusBarProps) {
  return (
    <div className={`px-4 py-3 flex items-center justify-between border-b ${
      error ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
    }`}>
      <div className="flex items-center gap-2">
        {/* Sync indicator dot */}
        <div className={`w-2 h-2 rounded-full ${
          isSyncing ? 'bg-blue-500 animate-pulse' :
          error ? 'bg-red-500' :
          'bg-green-500'
        }`} />

        <div className="text-sm">
          {isSyncing ? (
            <span className="text-blue-600 font-medium">Syncing...</span>
          ) : error ? (
            <span className="text-red-600">Sync failed</span>
          ) : (
            <span className="text-gray-600">
              Last sync: <span className="font-medium">{formatLastSync(lastSyncTime)}</span>
            </span>
          )}
        </div>
      </div>

      <button
        onClick={onSync}
        disabled={isSyncing}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
          isSyncing
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : error
            ? 'bg-red-100 text-red-700 active:bg-red-200'
            : 'bg-blue-100 text-blue-700 active:bg-blue-200'
        }`}
      >
        {isSyncing ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Syncing
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {error ? 'Retry' : 'Sync Now'}
          </>
        )}
      </button>
    </div>
  );
}
