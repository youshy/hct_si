import { useState, useEffect, useCallback } from 'react';
import {
  getOpenDeals,
  getLatestNoteByDeal,
  getLossStats,
  getWinStats,
  getTotalStats,
  getWinLossRatio,
  getPipelineStats,
  type Deal,
  type Note,
  type LossStats,
  type WinStats,
  type TotalStats,
  type WinLossRatio,
  type PipelineStats
} from '../lib/db';
import { formatCurrency } from '../lib/utils/format';
import { AtRiskCard } from './AtRiskCard';
import { EmptyState } from './EmptyState';
import { DashboardSkeleton } from './Skeleton';
import { DonutChart } from './DonutChart';
import { SyncStatusBar } from './SyncStatusBar';
import { useSync } from '../hooks/useSync';
import { useToast } from './Toast';

interface AtRiskDeal {
  deal: Deal;
  latestNote: Note;
}

const REASON_LABELS: Record<string, string> = {
  price: 'Price',
  timing: 'Timing',
  competitor: 'Competitor',
  fit: 'Bad Fit',
  other: 'Other'
};

export function Dashboard() {
  const [atRiskDeals, setAtRiskDeals] = useState<AtRiskDeal[]>([]);
  const [totalStats, setTotalStats] = useState<TotalStats | null>(null);
  const [pipelineStats, setPipelineStats] = useState<PipelineStats | null>(null);
  const [lossStats, setLossStats] = useState<LossStats | null>(null);
  const [winStats, setWinStats] = useState<WinStats | null>(null);
  const [winLossRatio, setWinLossRatio] = useState<WinLossRatio | null>(null);
  const [loading, setLoading] = useState(true);
  const { isSyncing, lastSyncTime, error: syncError, syncNow } = useSync();
  const { showToast } = useToast();

  const loadDashboardData = useCallback(async () => {
    try {
      const openDeals = await getOpenDeals();
      const atRisk: AtRiskDeal[] = [];

      for (const deal of openDeals) {
        const latestNote = await getLatestNoteByDeal(deal.id);
        if (latestNote?.sentiment_label === 'negative') {
          atRisk.push({ deal, latestNote });
        }
      }

      setAtRiskDeals(atRisk);
      setTotalStats(await getTotalStats());
      setPipelineStats(await getPipelineStats());
      setLossStats(await getLossStats());
      setWinStats(await getWinStats());
      setWinLossRatio(await getWinLossRatio());
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleSync = async () => {
    try {
      await syncNow();
      showToast('Sync completed successfully', 'success');
      // Reload dashboard data after sync
      await loadDashboardData();
    } catch {
      showToast('Sync failed - will retry automatically', 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 pb-24">
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="px-4 py-4">
            <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          </div>
          <SyncStatusBar
            isSyncing={isSyncing}
            lastSyncTime={lastSyncTime}
            error={syncError}
            onSync={handleSync}
          />
        </header>
        <DashboardSkeleton />
      </div>
    );
  }

  const maxReasonCount = lossStats
    ? Math.max(...Object.values(lossStats.byReason).map(r => r.count))
    : 0;

  return (
    <div className="min-h-screen bg-gray-100 pb-24">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        </div>
        <SyncStatusBar
          isSyncing={isSyncing}
          lastSyncTime={lastSyncTime}
          error={syncError}
          onSync={handleSync}
        />
      </header>

      <main className="px-4 py-4">
        {/* At-Risk Deals Section */}
        <section className={`p-4 rounded-r-lg mb-6 border-l-4 ${
          atRiskDeals.length === 0
            ? 'bg-green-50 border-green-500'
            : 'bg-red-50 border-red-500'
        }`}>
          <h2 className={`font-bold text-lg mb-4 flex items-center gap-2 ${
            atRiskDeals.length === 0 ? 'text-green-800' : 'text-red-800'
          }`}>
            <span>{atRiskDeals.length === 0 ? '✅' : '⚠️'}</span>
            {atRiskDeals.length === 0 ? 'All Deals Healthy' : 'At-Risk Deals'}
          </h2>
          {atRiskDeals.length === 0 ? (
            <div className="text-center text-green-600 py-4">
              <p>No at-risk deals - great job!</p>
            </div>
          ) : (
            atRiskDeals.map(({ deal, latestNote }) => (
              <AtRiskCard
                key={deal.id}
                deal={deal}
                latestNote={latestNote}
                onClick={() => {}}
              />
            ))
          )}
        </section>

        {/* Pipeline Donut Charts */}
        {pipelineStats && (pipelineStats.open.count > 0 || pipelineStats.won.count > 0 || pipelineStats.lost.count > 0) && (
          <section className="mb-6">
            <h2 className="text-gray-700 font-semibold mb-3">Deal Distribution</h2>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="grid grid-cols-2 gap-4">
                {/* By Count */}
                <div className="text-center">
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">By Count</div>
                  <DonutChart
                    segments={[
                      { label: 'Open', value: pipelineStats.open.count, color: '#60A5FA' },
                      { label: 'Won', value: pipelineStats.won.count, color: '#34D399' },
                      { label: 'Lost', value: pipelineStats.lost.count, color: '#F87171' }
                    ]}
                    centerValue={totalStats?.totalDeals ?? 0}
                    centerLabel="Deals"
                    size={140}
                    showLegend={false}
                  />
                </div>
                {/* By Value */}
                <div className="text-center">
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">By Value</div>
                  <DonutChart
                    segments={[
                      { label: 'Open', value: pipelineStats.open.value, color: '#60A5FA' },
                      { label: 'Won', value: pipelineStats.won.value, color: '#34D399' },
                      { label: 'Lost', value: pipelineStats.lost.value, color: '#F87171' }
                    ]}
                    centerValue={formatCurrency(totalStats?.totalValue ?? 0)}
                    centerLabel="Value"
                    size={140}
                    showLegend={false}
                  />
                </div>
              </div>
              {/* Shared Legend */}
              <div className="flex justify-center gap-4 mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#60A5FA]" />
                  <span className="text-sm text-gray-600">Open</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#34D399]" />
                  <span className="text-sm text-gray-600">Won</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#F87171]" />
                  <span className="text-sm text-gray-600">Lost</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Pipeline Summary */}
        <section className="mb-6">
          <h2 className="text-gray-700 font-semibold mb-3">Pipeline Overview</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg shadow-sm text-center border border-blue-200">
              <div className="text-xs text-blue-600 uppercase tracking-wide">Total Deals</div>
              <div className="text-2xl font-bold text-blue-700">{totalStats?.totalDeals ?? 0}</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg shadow-sm text-center border border-blue-200">
              <div className="text-xs text-blue-600 uppercase tracking-wide">Total Value</div>
              <div className="text-2xl font-bold text-blue-700">
                {formatCurrency(totalStats?.totalValue ?? 0)}
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg shadow-sm text-center border border-purple-200">
              <div className="text-xs text-purple-600 uppercase tracking-wide">Open Deals</div>
              <div className="text-2xl font-bold text-purple-700">{totalStats?.openDeals ?? 0}</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg shadow-sm text-center border border-purple-200">
              <div className="text-xs text-purple-600 uppercase tracking-wide">Open Value</div>
              <div className="text-2xl font-bold text-purple-700">
                {formatCurrency(totalStats?.openValue ?? 0)}
              </div>
            </div>
          </div>
        </section>

        {/* Won Summary */}
        <section className="mb-6">
          <h2 className="text-gray-700 font-semibold mb-3">Won Deals</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 p-4 rounded-lg shadow-sm text-center border border-green-200">
              <div className="text-xs text-green-600 uppercase tracking-wide">Deals Won</div>
              <div className="text-2xl font-bold text-green-700">{winStats?.totalWon ?? 0}</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg shadow-sm text-center border border-green-200">
              <div className="text-xs text-green-600 uppercase tracking-wide">Value Won</div>
              <div className="text-2xl font-bold text-green-700">
                {formatCurrency(winStats?.totalValue ?? 0)}
              </div>
            </div>
          </div>
        </section>

        {/* Loss Summary */}
        <section className="mb-6">
          <h2 className="text-gray-700 font-semibold mb-3">Lost Deals</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-red-50 p-4 rounded-lg shadow-sm text-center border border-red-200">
              <div className="text-xs text-red-600 uppercase tracking-wide">Deals Lost</div>
              <div className="text-2xl font-bold text-red-700">{lossStats?.totalLost ?? 0}</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg shadow-sm text-center border border-red-200">
              <div className="text-xs text-red-600 uppercase tracking-wide">Value Lost</div>
              <div className="text-2xl font-bold text-red-700">
                {formatCurrency(lossStats?.totalValue ?? 0)}
              </div>
            </div>
          </div>
        </section>

        {/* Loss Reasons Breakdown */}
        <section className="mb-6">
          <h2 className="text-gray-700 font-semibold mb-3">Loss Reasons</h2>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            {lossStats && lossStats.totalLost > 0 ? (
              Object.entries(lossStats.byReason).map(([reason, data]) => (
                <div key={reason} className="flex items-center gap-3 mb-3 last:mb-0">
                  <div className="w-20 text-sm text-gray-600">{REASON_LABELS[reason]}</div>
                  <div className="flex-1 h-6 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-500 rounded-full transition-all duration-300"
                      style={{ width: `${maxReasonCount > 0 ? (data.count / maxReasonCount) * 100 : 0}%` }}
                    />
                  </div>
                  <div className="text-sm text-gray-500 w-28 text-right">
                    {data.count} ({formatCurrency(data.value)})
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                icon={
                  <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                }
                title="No loss data yet"
                description="Loss insights will appear here once you mark deals as lost"
              />
            )}
          </div>
        </section>

        {/* Win/Loss Ratio */}
        {winLossRatio && (winLossRatio.won > 0 || winLossRatio.lost > 0) && (
          <section className="text-center text-sm text-gray-500 py-4 border-t border-gray-200">
            Win/Loss: {winLossRatio.won} won / {winLossRatio.lost} lost{' '}
            <span className="font-semibold text-gray-700">({winLossRatio.winRate}% win rate)</span>
          </section>
        )}
      </main>
    </div>
  );
}
