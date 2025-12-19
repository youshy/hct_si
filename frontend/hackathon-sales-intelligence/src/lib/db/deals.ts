import { db } from './database';
import type { Deal, DealStage } from './types';

interface AddDealOptions {
  name: string;
  value: number;
  customer_name?: string | null;
  expected_close_date?: Date | null;
  stage?: DealStage;
}

export async function addDeal(options: AddDealOptions): Promise<Deal> {
  const now = new Date();
  const deal: Deal = {
    id: crypto.randomUUID(),
    name: options.name,
    value: options.value,
    status: 'open',
    loss_reason: null,
    created_at: now,
    updated_at: now,
    synced: false,
    // v4 fields
    archived: false,
    expected_close_date: options.expected_close_date ?? null,
    customer_name: options.customer_name ?? null,
    stage: options.stage ?? 'prospect'
  };
  try {
    await db.deals.add(deal);
    console.log('Deal added to IndexedDB:', deal.id);
    return deal;
  } catch (error) {
    console.error('Failed to add deal to IndexedDB:', error);
    throw error;
  }
}

export async function updateDeal(id: string, updates: Partial<Deal>): Promise<void> {
  await db.deals.update(id, {
    ...updates,
    updated_at: new Date(),
    synced: false
  });
}

export async function getDeals(includeArchived = false): Promise<Deal[]> {
  const deals = await db.deals.orderBy('created_at').reverse().toArray();
  if (includeArchived) return deals;
  return deals.filter(d => !d.archived);
}

export async function getArchivedDeals(): Promise<Deal[]> {
  return db.deals.where('archived').equals(1).toArray();
}

export async function getDeal(id: string): Promise<Deal | undefined> {
  return db.deals.get(id);
}

export async function getUnsyncedDeals(): Promise<Deal[]> {
  return db.deals.where('synced').equals(0).toArray();
}

export async function markDealsSynced(ids: string[]): Promise<void> {
  await db.deals.where('id').anyOf(ids).modify({ synced: true });
}

export async function getOpenDeals(): Promise<Deal[]> {
  const deals = await db.deals.where('status').equals('open').toArray();
  return deals.filter(d => !d.archived);
}

export async function getLostDeals(): Promise<Deal[]> {
  const deals = await db.deals.where('status').equals('lost').toArray();
  return deals.filter(d => !d.archived);
}

export async function getWonDeals(): Promise<Deal[]> {
  const deals = await db.deals.where('status').equals('won').toArray();
  return deals.filter(d => !d.archived);
}

export async function archiveDeal(id: string): Promise<void> {
  await updateDeal(id, { archived: true });
}

export async function restoreDeal(id: string): Promise<void> {
  await updateDeal(id, { archived: false });
}

export interface TotalStats {
  totalDeals: number;
  totalValue: number;
  openDeals: number;
  openValue: number;
}

export async function getTotalStats(): Promise<TotalStats> {
  const allDeals = await getDeals(); // Already excludes archived
  const openDeals = allDeals.filter(d => d.status === 'open');

  return {
    totalDeals: allDeals.length,
    totalValue: allDeals.reduce((sum, deal) => sum + deal.value, 0),
    openDeals: openDeals.length,
    openValue: openDeals.reduce((sum, deal) => sum + deal.value, 0)
  };
}

export interface WinStats {
  totalWon: number;
  totalValue: number;
}

export async function getWinStats(): Promise<WinStats> {
  const wonDeals = await getWonDeals();
  const totalValue = wonDeals.reduce((sum, deal) => sum + deal.value, 0);

  return {
    totalWon: wonDeals.length,
    totalValue
  };
}

export interface LossStats {
  totalLost: number;
  totalValue: number;
  byReason: Record<string, { count: number; value: number }>;
}

export async function getLossStats(): Promise<LossStats> {
  const lostDeals = await getLostDeals();

  const byReason: Record<string, { count: number; value: number }> = {
    price: { count: 0, value: 0 },
    timing: { count: 0, value: 0 },
    competitor: { count: 0, value: 0 },
    fit: { count: 0, value: 0 },
    other: { count: 0, value: 0 }
  };

  let totalValue = 0;

  for (const deal of lostDeals) {
    totalValue += deal.value;
    if (deal.loss_reason && byReason[deal.loss_reason]) {
      byReason[deal.loss_reason].count++;
      byReason[deal.loss_reason].value += deal.value;
    }
  }

  return {
    totalLost: lostDeals.length,
    totalValue,
    byReason
  };
}

export interface WinLossRatio {
  won: number;
  lost: number;
  winRate: number;
}

export async function getWinLossRatio(): Promise<WinLossRatio> {
  const deals = await getDeals(); // Excludes archived
  const won = deals.filter(d => d.status === 'won').length;
  const lost = deals.filter(d => d.status === 'lost').length;
  const total = won + lost;

  return {
    won,
    lost,
    winRate: total > 0 ? Math.round((won / total) * 100) : 0
  };
}

export interface PipelineStats {
  open: { count: number; value: number };
  won: { count: number; value: number };
  lost: { count: number; value: number };
}

export async function getPipelineStats(): Promise<PipelineStats> {
  const deals = await getDeals(); // Excludes archived

  const stats: PipelineStats = {
    open: { count: 0, value: 0 },
    won: { count: 0, value: 0 },
    lost: { count: 0, value: 0 }
  };

  for (const deal of deals) {
    stats[deal.status].count++;
    stats[deal.status].value += deal.value;
  }

  return stats;
}

// Get deals closing soon (within next 7 days)
export async function getDealsClosingSoon(): Promise<Deal[]> {
  const deals = await getOpenDeals();
  const now = new Date();
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  return deals.filter(deal => {
    if (!deal.expected_close_date) return false;
    const closeDate = new Date(deal.expected_close_date);
    return closeDate <= weekFromNow;
  }).sort((a, b) => {
    const dateA = new Date(a.expected_close_date!).getTime();
    const dateB = new Date(b.expected_close_date!).getTime();
    return dateA - dateB;
  });
}

// Get stage breakdown stats for open deals
export interface StageStats {
  prospect: { count: number; value: number };
  qualified: { count: number; value: number };
  proposal: { count: number; value: number };
  negotiation: { count: number; value: number };
  closing: { count: number; value: number };
}

export async function getStageStats(): Promise<StageStats> {
  const deals = await getOpenDeals();

  const stats: StageStats = {
    prospect: { count: 0, value: 0 },
    qualified: { count: 0, value: 0 },
    proposal: { count: 0, value: 0 },
    negotiation: { count: 0, value: 0 },
    closing: { count: 0, value: 0 }
  };

  for (const deal of deals) {
    const stage = deal.stage || 'prospect';
    if (stats[stage]) {
      stats[stage].count++;
      stats[stage].value += deal.value;
    }
  }

  return stats;
}
