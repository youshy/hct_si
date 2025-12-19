import { useState, useEffect, useCallback } from 'react';
import {
  getOpenDeals,
  getLatestNoteByDeal,
  getLossStats,
  getWinLossRatio,
  type Deal,
  type Note,
  type LossStats,
  type WinLossRatio
} from '../lib/db';
import { formatCurrency } from '../lib/utils/format';
import { AtRiskCard } from './AtRiskCard';

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
  const [lossStats, setLossStats] = useState<LossStats | null>(null);
  const [winLossRatio, setWinLossRatio] = useState<WinLossRatio | null>(null);
  const [loading, setLoading] = useState(true);

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
      setLossStats(await getLossStats());
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading dashboard...</div>
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
      </header>

      <main className="px-4 py-4">
        {/* At-Risk Deals Section */}
        <section className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg mb-6">
          <h2 className="text-red-800 font-bold text-lg mb-4 flex items-center gap-2">
            <span>⚠️</span> At-Risk Deals
          </h2>
          {atRiskDeals.length === 0 ? (
            <div className="text-center text-green-600 py-4">
              <span className="text-3xl">✅</span>
              <p className="mt-2">No at-risk deals!</p>
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

        {/* Loss Summary */}
        <section className="mb-6">
          <h2 className="text-gray-700 font-semibold mb-3">Loss Summary</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm text-center">
              <div className="text-xs text-gray-500 uppercase tracking-wide">Deals Lost</div>
              <div className="text-2xl font-bold text-gray-900">{lossStats?.totalLost ?? 0}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm text-center">
              <div className="text-xs text-gray-500 uppercase tracking-wide">Value Lost</div>
              <div className="text-2xl font-bold text-gray-900">
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
              <div className="text-center text-gray-500 py-4">
                No loss data yet.
              </div>
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
