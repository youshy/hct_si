import type { Deal } from '../lib/db';
import { formatCurrency, getSentimentColor } from '../lib/utils/format';

interface DealCardProps {
  deal: Deal;
  sentimentLabel: string | null;
  onClick: () => void;
}

export function DealCard({ deal, sentimentLabel, onClick }: DealCardProps) {
  const statusClasses = {
    open: 'bg-blue-100 text-blue-800',
    won: 'bg-green-100 text-green-800',
    lost: 'bg-red-100 text-red-800'
  };

  const isAtRisk = sentimentLabel === 'negative';

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-lg shadow-sm p-4 mb-3 flex items-center justify-between cursor-pointer active:bg-gray-50 ${
        isAtRisk ? 'border-2 border-red-300 bg-red-50' : ''
      }`}
    >
      <div className="flex items-center">
        <div className={`w-3 h-3 rounded-full mr-3 ${getSentimentColor(sentimentLabel)}`} />
        <div>
          <div className="text-lg font-medium text-gray-900">{deal.name}</div>
          <div className="text-sm text-gray-500">{formatCurrency(deal.value)}</div>
        </div>
      </div>
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClasses[deal.status]}`}>
        {deal.status.charAt(0).toUpperCase() + deal.status.slice(1)}
      </span>
    </div>
  );
}
