import type { Deal } from '../lib/db';
import { formatCurrency, getSentimentColor } from '../lib/utils/format';
import { useSwipeAction } from '../hooks/useSwipeAction';

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
        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full mr-3 ${dotColor}`} />
          <div>
            <div className="text-lg font-medium text-gray-900">{deal.name}</div>
            <div className="text-sm text-gray-500">{formatCurrency(deal.value)}</div>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClasses[deal.status]}`}>
          {deal.status.charAt(0).toUpperCase() + deal.status.slice(1)}
        </span>
      </div>
    </div>
  );
}
