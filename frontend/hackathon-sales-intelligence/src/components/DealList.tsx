import { useState, useEffect, useCallback } from 'react';
import { getDeals, addDeal, updateDeal, getLatestNoteByDeal, type Deal } from '../lib/db';
import { DealCard } from './DealCard';
import { AddDealModal } from './AddDealModal';
import { ActionMenu } from './ActionMenu';
import { NotesModal } from './NotesModal';
import { LossReasonModal } from './LossReasonModal';

interface DealWithSentiment {
  deal: Deal;
  sentimentLabel: string | null;
}

export function DealList() {
  const [deals, setDeals] = useState<DealWithSentiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [notesDeal, setNotesDeal] = useState<Deal | null>(null);
  const [lossDeal, setLossDeal] = useState<Deal | null>(null);

  const loadDeals = useCallback(async () => {
    try {
      const allDeals = await getDeals();
      const dealsWithSentiment = await Promise.all(
        allDeals.map(async (deal) => {
          const latestNote = await getLatestNoteByDeal(deal.id);
          return {
            deal,
            sentimentLabel: latestNote?.sentiment_label ?? null
          };
        })
      );
      setDeals(dealsWithSentiment);
    } catch (error) {
      console.error('Failed to load deals:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDeals();
  }, [loadDeals]);

  const handleAddDeal = async (name: string, value: number) => {
    await addDeal(name, value);
    await loadDeals();
  };

  const handleMarkWon = async () => {
    if (selectedDeal) {
      await updateDeal(selectedDeal.id, { status: 'won' });
      await loadDeals();
    }
  };

  const handleMarkLost = () => {
    if (selectedDeal) {
      setLossDeal(selectedDeal);
    }
  };

  const handleAddNote = () => {
    if (selectedDeal) {
      setNotesDeal(selectedDeal);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading deals...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-24">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900">Deals</h1>
        </div>
      </header>

      <main className="px-4 py-4">
        {deals.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-2">No deals yet</p>
            <p className="text-sm text-gray-400">Tap + to add your first deal</p>
          </div>
        ) : (
          deals.map(({ deal, sentimentLabel }) => (
            <DealCard
              key={deal.id}
              deal={deal}
              sentimentLabel={sentimentLabel}
              onClick={() => setSelectedDeal(deal)}
            />
          ))
        )}
      </main>

      {/* Floating Action Button */}
      <button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg active:bg-blue-700 z-20"
        aria-label="Add deal"
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      <AddDealModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddDeal}
      />

      {selectedDeal && (
        <ActionMenu
          deal={selectedDeal}
          isOpen={!!selectedDeal}
          onClose={() => setSelectedDeal(null)}
          onAddNote={handleAddNote}
          onMarkWon={handleMarkWon}
          onMarkLost={handleMarkLost}
        />
      )}

      {notesDeal && (
        <NotesModal
          deal={notesDeal}
          isOpen={!!notesDeal}
          onClose={() => setNotesDeal(null)}
          onNoteAdded={loadDeals}
        />
      )}

      {lossDeal && (
        <LossReasonModal
          dealId={lossDeal.id}
          dealName={lossDeal.name}
          isOpen={!!lossDeal}
          onClose={() => setLossDeal(null)}
          onComplete={loadDeals}
        />
      )}
    </div>
  );
}
