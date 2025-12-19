import { useState } from 'react';
import type { DealStage } from '../lib/db';
import { STAGE_INFO } from '../lib/db';

interface AddDealOptions {
  name: string;
  value: number;
  customer_name?: string | null;
  expected_close_date?: Date | null;
  stage?: DealStage;
}

interface AddDealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (options: AddDealOptions) => void;
}

export function AddDealModal({ isOpen, onClose, onSubmit }: AddDealModalProps) {
  const [name, setName] = useState('');
  const [value, setValue] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [expectedCloseDate, setExpectedCloseDate] = useState('');
  const [stage, setStage] = useState<DealStage>('prospect');
  const [showAdvanced, setShowAdvanced] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && value) {
      onSubmit({
        name: name.trim(),
        value: Number(value),
        customer_name: customerName.trim() || null,
        expected_close_date: expectedCloseDate ? new Date(expectedCloseDate) : null,
        stage
      });
      // Reset form
      setName('');
      setValue('');
      setCustomerName('');
      setExpectedCloseDate('');
      setStage('prospect');
      setShowAdvanced(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-lg p-8 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Add New Deal</h2>
        <form onSubmit={handleSubmit}>
          {/* Required fields */}
          <div className="mb-5">
            <label htmlFor="deal-name" className="block text-sm font-medium text-gray-700 mb-2">
              Deal Name *
            </label>
            <input
              id="deal-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 text-lg"
              placeholder="Enter deal name"
              required
            />
          </div>
          <div className="mb-5">
            <label htmlFor="deal-value" className="block text-sm font-medium text-gray-700 mb-2">
              Deal Value ($) *
            </label>
            <input
              id="deal-value"
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 text-lg"
              placeholder="Enter value"
              min="0"
              required
            />
          </div>

          {/* Optional fields toggle */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="mb-5 text-blue-600 text-sm font-medium flex items-center gap-1"
          >
            <svg
              className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            {showAdvanced ? 'Hide' : 'Show'} optional fields
          </button>

          {/* Optional fields */}
          {showAdvanced && (
            <div className="space-y-5 mb-5 p-4 bg-gray-50 rounded-lg">
              <div>
                <label htmlFor="customer-name" className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Name
                </label>
                <input
                  id="customer-name"
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="Company or contact name"
                />
              </div>

              <div>
                <label htmlFor="expected-close" className="block text-sm font-medium text-gray-700 mb-2">
                  Expected Close Date
                </label>
                <input
                  id="expected-close"
                  type="date"
                  value={expectedCloseDate}
                  onChange={(e) => setExpectedCloseDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                />
              </div>

              <div>
                <label htmlFor="stage" className="block text-sm font-medium text-gray-700 mb-2">
                  Pipeline Stage
                </label>
                <select
                  id="stage"
                  value={stage}
                  onChange={(e) => setStage(e.target.value as DealStage)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                >
                  {(Object.keys(STAGE_INFO) as DealStage[]).map((s) => (
                    <option key={s} value={s}>
                      {STAGE_INFO[s].label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="flex gap-4 mt-8">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 text-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 text-lg"
            >
              Add Deal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
