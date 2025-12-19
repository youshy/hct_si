import { useState, useEffect, useCallback } from 'react';
import { getDeals, addDeal, updateDeal, getLatestNoteByDeal, type Deal } from '../lib/db';
import { DealCard } from './DealCard';
import { AddDealModal } from './AddDealModal';
import { EditDealModal } from './EditDealModal';
import { ActionMenu } from './ActionMenu';
import { NotesModal } from './NotesModal';
import { LossReasonModal } from './LossReasonModal';
import { useToast } from './Toast';
import { PullToRefresh } from './PullToRefresh';
import { EmptyState } from './EmptyState';
import { DealListSkeleton } from './Skeleton';

interface DealWithSentiment {
  deal: Deal;
  sentimentLabel: string | null;
}

type SortOption = 'date-desc' | 'date-asc' | 'value-desc' | 'value-asc' | 'status';

const sortLabels: Record<SortOption, string> = {
  'date-desc': 'Newest First',
  'date-asc': 'Oldest First',
  'value-desc': 'Highest Value',
  'value-asc': 'Lowest Value',
  'status': 'Open First',
};

// Haptic feedback helper
function vibrate(pattern: number | number[] = 10) {
  if (navigator.vibrate) {
    navigator.vibrate(pattern);
  }
}

interface DealListProps {
  onDealSelect?: (deal: Deal) => void;
}

export function DealList({ onDealSelect }: DealListProps) {
  const [deals, setDeals] = useState<DealWithSentiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [editDeal, setEditDeal] = useState<Deal | null>(null);
  const [notesDeal, setNotesDeal] = useState<Deal | null>(null);
  const [lossDeal, setLossDeal] = useState<Deal | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const { showToast } = useToast();

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

  const sortedDeals = [...deals].sort((a, b) => {
    switch (sortBy) {
      case 'date-desc':
        return new Date(b.deal.created_at).getTime() - new Date(a.deal.created_at).getTime();
      case 'date-asc':
        return new Date(a.deal.created_at).getTime() - new Date(b.deal.created_at).getTime();
      case 'value-desc':
        return b.deal.value - a.deal.value;
      case 'value-asc':
        return a.deal.value - b.deal.value;
      case 'status':
        const statusOrder = { open: 0, won: 1, lost: 2 };
        return statusOrder[a.deal.status] - statusOrder[b.deal.status];
      default:
        return 0;
    }
  });

  const handleAddDeal = async (name: string, value: number) => {
    try {
      await addDeal(name, value);
      vibrate();
      showToast(`Deal "${name}" created`);
      await loadDeals();
    } catch (error) {
      console.error('Failed to add deal:', error);
      showToast('Failed to create deal', 'error');
    }
  };

  const handleMarkWon = async () => {
    if (selectedDeal) {
      await updateDeal(selectedDeal.id, { status: 'won' });
      vibrate([10, 50, 10]);
      showToast(`"${selectedDeal.name}" marked as won!`, 'success');
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

  const handleEditDeal = () => {
    if (selectedDeal) {
      setEditDeal(selectedDeal);
    }
  };

  const handleRefresh = useCallback(async () => {
    await loadDeals();
    showToast('Deals refreshed', 'info');
  }, [loadDeals, showToast]);

  const handleSwipeWon = async (deal: Deal) => {
    await updateDeal(deal.id, { status: 'won' });
    showToast(`"${deal.name}" marked as won!`, 'success');
    await loadDeals();
  };

  const handleSwipeLost = (deal: Deal) => {
    setLossDeal(deal);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 pb-24">
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="px-4 py-4">
            <h1 className="text-xl font-bold text-gray-900">Deals</h1>
          </div>
        </header>
        <DealListSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-24">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Deals</h1>
          <div className="relative">
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="flex items-center gap-1 text-sm text-gray-600 px-3 py-1.5 rounded-lg bg-gray-100 active:bg-gray-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
              </svg>
              {sortLabels[sortBy]}
            </button>
            {showSortMenu && (
              <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                {(Object.keys(sortLabels) as SortOption[]).map((option) => (
                  <button
                    key={option}
                    onClick={() => { setSortBy(option); setShowSortMenu(false); vibrate(); }}
                    className={`w-full px-4 py-2 text-left text-sm ${
                      sortBy === option ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {sortLabels[option]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      <PullToRefresh onRefresh={handleRefresh}>
        <main className="px-4 py-4">
          {sortedDeals.length === 0 ? (
            <EmptyState
              icon={
                <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
              title="No deals yet"
              description="Start tracking your sales pipeline by adding your first deal"
              action={{
                label: 'Add Your First Deal',
                onClick: () => setShowAddModal(true)
              }}
            />
          ) : (
            sortedDeals.map(({ deal, sentimentLabel }) => (
              <DealCard
                key={deal.id}
                deal={deal}
                sentimentLabel={sentimentLabel}
                onClick={() => onDealSelect ? onDealSelect(deal) : setSelectedDeal(deal)}
                onSwipeWon={() => handleSwipeWon(deal)}
                onSwipeLost={() => handleSwipeLost(deal)}
              />
            ))
          )}
        </main>
      </PullToRefresh>

      {/* Floating Action Button */}
      <button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-24 right-6 w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg active:bg-blue-700 z-20"
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
          onEditDeal={handleEditDeal}
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

      <EditDealModal
        deal={editDeal}
        isOpen={!!editDeal}
        onClose={() => setEditDeal(null)}
        onComplete={loadDeals}
      />
    </div>
  );
}
