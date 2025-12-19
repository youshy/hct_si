import type { Deal, Note } from '../lib/db';
import { formatCurrency } from '../lib/utils/format';

interface AtRiskCardProps {
  deal: Deal;
  latestNote: Note;
  onClick: () => void;
}

export function AtRiskCard({ deal, latestNote, onClick }: AtRiskCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-white p-4 rounded-lg shadow-sm mb-3 border border-red-200 cursor-pointer active:bg-gray-50"
    >
      <div className="flex items-center gap-2 font-medium text-gray-900">
        <span className="w-2.5 h-2.5 rounded-full bg-red-500 flex-shrink-0" />
        {deal.name}
      </div>
      <div className="text-sm text-gray-500 ml-5">{formatCurrency(deal.value)}</div>
      <p className="text-sm text-red-600 mt-2 italic line-clamp-2">
        "{latestNote.content}"
      </p>
    </div>
  );
}
