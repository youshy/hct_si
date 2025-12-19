import { useState } from 'react';

interface AddDealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, value: number) => void;
}

export function AddDealModal({ isOpen, onClose, onSubmit }: AddDealModalProps) {
  const [name, setName] = useState('');
  const [value, setValue] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && value) {
      onSubmit(name.trim(), Number(value));
      setName('');
      setValue('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-lg p-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Add New Deal</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label htmlFor="deal-name" className="block text-sm font-medium text-gray-700 mb-2">
              Deal Name
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
          <div className="mb-8">
            <label htmlFor="deal-value" className="block text-sm font-medium text-gray-700 mb-2">
              Deal Value ($)
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
          <div className="flex gap-4">
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
