import type { Deal } from '../lib/db';

interface ActionMenuProps {
  deal: Deal;
  isOpen: boolean;
  onClose: () => void;
  onAddNote: () => void;
  onEditDeal: () => void;
  onMarkWon: () => void;
  onMarkLost: () => void;
}

export function ActionMenu({ deal, isOpen, onClose, onAddNote, onEditDeal, onMarkWon, onMarkLost }: ActionMenuProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-t-2xl w-full max-w-md p-4 pb-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">{deal.name}</h3>
        <div className="space-y-2">
          <button
            onClick={() => { onAddNote(); onClose(); }}
            className="w-full py-3 px-4 text-left text-gray-900 bg-gray-50 rounded-lg active:bg-gray-100 font-medium"
          >
            Add Note
          </button>
          <button
            onClick={() => { onEditDeal(); onClose(); }}
            className="w-full py-3 px-4 text-left text-blue-700 bg-blue-50 rounded-lg active:bg-blue-100 font-medium"
          >
            Edit Deal
          </button>
          {deal.status === 'open' && (
            <>
              <button
                onClick={() => { onMarkWon(); onClose(); }}
                className="w-full py-3 px-4 text-left text-green-700 bg-green-50 rounded-lg active:bg-green-100 font-medium"
              >
                Mark Won
              </button>
              <button
                onClick={() => { onMarkLost(); onClose(); }}
                className="w-full py-3 px-4 text-left text-red-700 bg-red-50 rounded-lg active:bg-red-100 font-medium"
              >
                Mark Lost
              </button>
            </>
          )}
        </div>
        <button
          onClick={onClose}
          className="w-full mt-4 py-3 text-gray-500 font-medium"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
