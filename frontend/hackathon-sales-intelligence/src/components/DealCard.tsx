import type { Deal } from '../lib/db';
import { STAGE_INFO } from '../lib/db';
import { formatCurrency, getSentimentColor } from '../lib/utils/format';
import { useSwipeAction } from '../hooks/useSwipeAction';

// Helper to format close date for card display
function formatCloseDate(date: Date | string | null): { text: string; color: string } | null {
  if (!date) return null;

  const closeDate = date instanceof Date ? date : new Date(date);
  if (isNaN(closeDate.getTime())) return null;

  const now = new Date();
  const diffTime = closeDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { text: `${Math.abs(diffDays)}d overdue`, color: 'text-red-600' };
  } else if (diffDays === 0) {
    return { text: 'Today', color: 'text-orange-600' };
  } else if (diffDays <= 7) {
    return { text: `${diffDays}d left`, color: 'text-yellow-600' };
  }
  return null; // Don't show if more than 7 days
}

interface DealCardProps {
  deal: Deal;
  sentimentLabel: string | null;
  onClick: () => void;
  onSwipeWon?: () => void;
  onSwipeLost?: () => void;
}

export function DealCard({ deal, sentimentLabel, onClick, onSwipeWon, onSwipeLost }: DealCardProps) {
  const isOpen = deal.status === 'open';

  const { swipeState, handlers } = useSwipeAction({
    onSwipeRight: onSwipeWon,
    onSwipeLeft: onSwipeLost,
    threshold: 0.3,
    disabled: !isOpen
  });

  const statusClasses = {
    open: 'bg-blue-100 text-blue-800',
    won: 'bg-green-100 text-green-800',
    lost: 'bg-red-100 text-red-800'
  };

  // Won deals always show green, no at-risk highlight
  const isWon = deal.status === 'won';
  const isAtRisk = !isWon && sentimentLabel === 'negative';

  // Won deals get green dot regardless of notes
  const dotColor = isWon ? 'bg-green-500' : getSentimentColor(sentimentLabel);

  const showSwipeIndicator = isOpen && swipeState.direction;

  return (
    <div className="relative mb-3 overflow-hidden rounded-lg">
      {/* Swipe background indicators */}
      {isOpen && (
        <>
          {/* Won indicator (right swipe) */}
          <div className={`absolute inset-y-0 left-0 w-full flex items-center pl-4 bg-green-500 transition-opacity ${
            swipeState.direction === 'right' ? 'opacity-100' : 'opacity-0'
          }`}>
            <div className={`flex items-center gap-2 text-white font-semibold transition-transform ${
              swipeState.isTriggered ? 'scale-110' : 'scale-100'
            }`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              WON
            </div>
          </div>
          {/* Lost indicator (left swipe) */}
          <div className={`absolute inset-y-0 right-0 w-full flex items-center justify-end pr-4 bg-red-500 transition-opacity ${
            swipeState.direction === 'left' ? 'opacity-100' : 'opacity-0'
          }`}>
            <div className={`flex items-center gap-2 text-white font-semibold transition-transform ${
              swipeState.isTriggered ? 'scale-110' : 'scale-100'
            }`}>
              LOST
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>
        </>
      )}

      {/* Main card content */}
      <div
        onClick={onClick}
        {...handlers}
        style={{
          transform: `translateX(${swipeState.offsetX}px)`,
          transition: swipeState.offsetX === 0 ? 'transform 0.2s ease-out' : 'none'
        }}
        className={`relative bg-white shadow-sm p-4 flex items-center justify-between cursor-pointer active:bg-gray-50 ${
          isAtRisk ? 'border-2 border-red-300 bg-red-50' : ''
        } ${showSwipeIndicator ? '' : 'rounded-lg'}`}
      >
        <div className="flex items-center flex-1 min-w-0">
          <div className={`w-3 h-3 rounded-full mr-3 flex-shrink-0 ${dotColor}`} />
          <div className="min-w-0 flex-1">
            <div className="text-lg font-medium text-gray-900 truncate">{deal.name}</div>
            {deal.customer_name && (
              <div className="text-sm text-gray-400 truncate">{deal.customer_name}</div>
            )}
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-sm text-gray-500">{formatCurrency(deal.value)}</span>
              {deal.stage && STAGE_INFO[deal.stage] && deal.status === 'open' && (
                <span
                  className="text-xs px-1.5 py-0.5 rounded"
                  style={{
                    backgroundColor: `${STAGE_INFO[deal.stage].color}20`,
                    color: STAGE_INFO[deal.stage].color
                  }}
                >
                  {STAGE_INFO[deal.stage].label}
                </span>
              )}
              {deal.status === 'open' && (() => {
                const closeInfo = formatCloseDate(deal.expected_close_date);
                return closeInfo ? (
                  <span className={`text-xs font-medium ${closeInfo.color}`}>
                    {closeInfo.text}
                  </span>
                ) : null;
              })()}
              <span className="text-xs text-gray-400">
                {new Date(deal.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ml-2 ${statusClasses[deal.status]}`}>
          {deal.status.charAt(0).toUpperCase() + deal.status.slice(1)}
        </span>
      </div>
    </div>
  );
}
