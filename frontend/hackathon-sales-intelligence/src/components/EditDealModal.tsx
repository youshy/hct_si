import { useState, useEffect } from 'react';
import type { Deal, DealStage } from '../lib/db';
import { updateDeal, STAGE_INFO } from '../lib/db';
import { useToast } from './Toast';

interface EditDealModalProps {
  deal: Deal | null;
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function EditDealModal({ deal, isOpen, onClose, onComplete }: EditDealModalProps) {
  const [name, setName] = useState('');
  const [value, setValue] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [expectedCloseDate, setExpectedCloseDate] = useState('');
  const [stage, setStage] = useState<DealStage>('prospect');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (deal && isOpen) {
      setName(deal.name);
      setValue(deal.value.toString());
      setCustomerName(deal.customer_name ?? '');
      setExpectedCloseDate(deal.expected_close_date
        ? new Date(deal.expected_close_date).toISOString().split('T')[0]
        : ''
      );
      setStage(deal.stage ?? 'prospect');
    }
  }, [deal, isOpen]);

  if (!isOpen || !deal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !value || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await updateDeal(deal.id, {
        name: name.trim(),
        value: parseFloat(value),
        customer_name: customerName.trim() || null,
        expected_close_date: expectedCloseDate ? new Date(expectedCloseDate) : null,
        stage
      });
      if (navigator.vibrate) navigator.vibrate(10);
      showToast('Deal updated');
      onComplete();
      onClose();
    } catch (error) {
      console.error('Failed to update deal:', error);
      showToast('Failed to update deal', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-lg w-full max-w-md p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Edit Deal</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Deal Name *
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              placeholder="Company name"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="value" className="block text-sm font-medium text-gray-700 mb-1">
              Deal Value ($) *
            </label>
            <input
              type="number"
              id="value"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              placeholder="50000"
              min="0"
              step="any"
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="customer-name" className="block text-sm font-medium text-gray-700 mb-1">
              Customer Name
            </label>
            <input
              type="text"
              id="customer-name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              placeholder="Company or contact name"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="expected-close" className="block text-sm font-medium text-gray-700 mb-1">
              Expected Close Date
            </label>
            <input
              type="date"
              id="expected-close"
              value={expectedCloseDate}
              onChange={(e) => setExpectedCloseDate(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            />
          </div>

          {deal.status === 'open' && (
            <div className="mb-6">
              <label htmlFor="stage" className="block text-sm font-medium text-gray-700 mb-1">
                Pipeline Stage
              </label>
              <select
                id="stage"
                value={stage}
                onChange={(e) => setStage(e.target.value as DealStage)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
              >
                {(Object.keys(STAGE_INFO) as DealStage[]).map((s) => (
                  <option key={s} value={s}>
                    {STAGE_INFO[s].label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-gray-700 bg-gray-100 rounded-lg font-medium hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || !value || isSubmitting}
              className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
