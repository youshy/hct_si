import { useState, useEffect, useCallback } from 'react';
import { getDeals, getArchivedDeals, addDeal, updateDeal, archiveDeal, restoreDeal, getLatestNoteByDeal, getTotalStats, type Deal, type DealStage, type TotalStats } from '../lib/db';
import { STAGE_INFO } from '../lib/db';
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
import { formatCurrency } from '../lib/utils/format';

interface AddDealOptions {
  name: string;
  value: number;
  customer_name?: string | null;
  expected_close_date?: Date | null;
  stage?: DealStage;
}

interface DealWithSentiment {
  deal: Deal;
  sentimentLabel: string | null;
}

type SortOption = 'date-desc' | 'date-asc' | 'value-desc' | 'value-asc' | 'status' | 'close-date';

const sortLabels: Record<SortOption, string> = {
  'date-desc': 'Newest First',
  'date-asc': 'Oldest First',
  'value-desc': 'Highest Value',
  'value-asc': 'Lowest Value',
  'status': 'Open First',
  'close-date': 'Closing Soon'
};

type StageFilter = 'all' | DealStage;

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
  const [showArchived, setShowArchived] = useState(false);
  const [stageFilter, setStageFilter] = useState<StageFilter>('all');
  const [quickStats, setQuickStats] = useState<TotalStats | null>(null);
  const { showToast } = useToast();

  const loadDeals = useCallback(async () => {
    try {
      const allDeals = showArchived ? await getArchivedDeals() : await getDeals();
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
      setQuickStats(await getTotalStats());
    } catch (error) {
      console.error('Failed to load deals:', error);
    } finally {
      setLoading(false);
    }
  }, [showArchived]);

  useEffect(() => {
    loadDeals();
  }, [loadDeals]);

  // Filter by stage
  const filteredDeals = stageFilter === 'all'
    ? deals
    : deals.filter(d => d.deal.stage === stageFilter && d.deal.status === 'open');

  const sortedDeals = [...filteredDeals].sort((a, b) => {
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
      case 'close-date':
        const dateA = a.deal.expected_close_date ? new Date(a.deal.expected_close_date).getTime() : Infinity;
        const dateB = b.deal.expected_close_date ? new Date(b.deal.expected_close_date).getTime() : Infinity;
        return dateA - dateB;
      default:
        return 0;
    }
  });

  const handleAddDeal = async (options: AddDealOptions) => {
    try {
      await addDeal(options);
      vibrate();
      showToast(`Deal "${options.name}" created`);
      await loadDeals();
    } catch (error) {
      console.error('Failed to add deal:', error);
      showToast('Failed to create deal', 'error');
    }
  };

  const handleArchiveDeal = async () => {
    if (selectedDeal) {
      await archiveDeal(selectedDeal.id);
      vibrate();
      showToast(`"${selectedDeal.name}" archived`);
      setSelectedDeal(null);
      await loadDeals();
    }
  };

  const handleRestoreDeal = async (deal: Deal) => {
    await restoreDeal(deal.id);
    vibrate();
    showToast(`"${deal.name}" restored`);
    await loadDeals();
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
        {/* Quick Stats Bar */}
        {quickStats && !showArchived && (
          <div className="px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-100 flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <span className="text-blue-700 font-medium">{quickStats.openDeals} open</span>
              <span className="text-gray-400">·</span>
              <span className="text-purple-700 font-medium">{formatCurrency(quickStats.openValue)} in pipeline</span>
            </div>
            <span className="text-gray-500">{quickStats.totalDeals} total deals</span>
          </div>
        )}

        <div className="px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">
            {showArchived ? 'Archived Deals' : 'Deals'}
          </h1>
          <div className="flex items-center gap-2">
            {/* Archive Toggle */}
            <button
              onClick={() => { setShowArchived(!showArchived); setStageFilter('all'); }}
              className={`p-2 rounded-lg ${showArchived ? 'bg-gray-200 text-gray-800' : 'text-gray-500'}`}
              title={showArchived ? 'Show active deals' : 'Show archived deals'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            </button>
            {/* Sort Menu */}
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
        </div>

        {/* Stage Filter Chips */}
        {!showArchived && (
          <div className="px-4 pb-3 flex gap-2 overflow-x-auto">
            <button
              onClick={() => { setStageFilter('all'); vibrate(); }}
              className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${
                stageFilter === 'all'
                  ? 'bg-gray-800 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              All
            </button>
            {(Object.keys(STAGE_INFO) as DealStage[]).map((stage) => (
              <button
                key={stage}
                onClick={() => { setStageFilter(stage); vibrate(); }}
                className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${
                  stageFilter === stage
                    ? 'text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
                style={stageFilter === stage ? { backgroundColor: STAGE_INFO[stage].color } : {}}
              >
                {STAGE_INFO[stage].label}
              </button>
            ))}
          </div>
        )}
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
              title={showArchived ? "No archived deals" : (stageFilter !== 'all' ? `No ${STAGE_INFO[stageFilter].label} deals` : "No deals yet")}
              description={showArchived ? "Archived deals will appear here" : "Start tracking your sales pipeline by adding your first deal"}
              action={!showArchived && stageFilter === 'all' ? {
                label: 'Add Your First Deal',
                onClick: () => setShowAddModal(true)
              } : undefined}
            />
          ) : (
            sortedDeals.map(({ deal, sentimentLabel }) => (
              <div key={deal.id} className="relative">
                <DealCard
                  deal={deal}
                  sentimentLabel={sentimentLabel}
                  onClick={() => onDealSelect ? onDealSelect(deal) : setSelectedDeal(deal)}
                  onSwipeWon={!showArchived ? () => handleSwipeWon(deal) : undefined}
                  onSwipeLost={!showArchived ? () => handleSwipeLost(deal) : undefined}
                />
                {showArchived && (
                  <button
                    onClick={() => handleRestoreDeal(deal)}
                    className="absolute top-2 right-2 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded font-medium"
                  >
                    Restore
                  </button>
                )}
              </div>
            ))
          )}
        </main>
      </PullToRefresh>

      {/* Floating Action Button */}
      {!showArchived && (
        <button
          onClick={() => setShowAddModal(true)}
          className="fixed bottom-24 right-6 w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg active:bg-blue-700 z-20"
          aria-label="Add deal"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      )}

      <AddDealModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddDeal}
      />

      {selectedDeal && !showArchived && (
        <ActionMenu
          deal={selectedDeal}
          isOpen={!!selectedDeal}
          onClose={() => setSelectedDeal(null)}
          onAddNote={handleAddNote}
          onEditDeal={handleEditDeal}
          onMarkWon={handleMarkWon}
          onMarkLost={handleMarkLost}
          onArchive={handleArchiveDeal}
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
