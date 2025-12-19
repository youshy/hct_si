import { updateDeal } from '../lib/db';

const LOSS_REASONS = [
  { id: 'price', label: 'Price' },
  { id: 'timing', label: 'Timing' },
  { id: 'competitor', label: 'Competitor' },
  { id: 'fit', label: 'Bad Fit' },
  { id: 'other', label: 'Other' }
] as const;

type LossReason = typeof LOSS_REASONS[number]['id'];

interface LossReasonModalProps {
  dealId: string;
  dealName: string;
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function LossReasonModal({ dealId, dealName, isOpen, onClose, onComplete }: LossReasonModalProps) {
  if (!isOpen) return null;

  const handleSelectReason = async (reason: LossReason) => {
    await updateDeal(dealId, {
      status: 'lost',
      loss_reason: reason
    });
    onComplete();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-t-2xl w-full max-w-md p-6 pb-8"
        style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-gray-900 text-center mb-2">
          Why did you lose this deal?
        </h2>
        <p className="text-sm text-gray-500 text-center mb-6 truncate">{dealName}</p>

        <div className="grid grid-cols-2 gap-4">
          {LOSS_REASONS.slice(0, 4).map((reason) => (
            <button
              key={reason.id}
              onClick={() => handleSelectReason(reason.id)}
              className="flex flex-col items-center justify-center h-24 rounded-xl bg-gray-100 hover:bg-gray-200 active:bg-gray-300 active:scale-95 transition-all duration-150 text-gray-700 font-medium"
            >
              <span className="text-sm">{reason.label}</span>
            </button>
          ))}

          <button
            onClick={() => handleSelectReason('other')}
            className="col-span-2 flex items-center justify-center h-16 rounded-xl bg-gray-100 hover:bg-gray-200 active:bg-gray-300 active:scale-95 transition-all duration-150 text-gray-700 font-medium"
          >
            <span className="text-sm">Other</span>
          </button>
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
