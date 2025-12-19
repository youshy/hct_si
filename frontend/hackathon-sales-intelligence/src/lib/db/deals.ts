import { db } from './database';
import type { Deal } from './types';

export async function addDeal(name: string, value: number): Promise<Deal> {
  const deal: Deal = {
    id: crypto.randomUUID(),
    name,
    value,
    status: 'open',
    loss_reason: null,
    created_at: new Date(),
    updated_at: new Date(),
    synced: false
  };
  await db.deals.add(deal);
  return deal;
}

export async function updateDeal(id: string, updates: Partial<Deal>): Promise<void> {
  await db.deals.update(id, {
    ...updates,
    updated_at: new Date(),
    synced: false
  });
}

export async function getDeals(): Promise<Deal[]> {
  return db.deals.orderBy('created_at').reverse().toArray();
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
  return db.deals.where('status').equals('open').toArray();
}

export async function getLostDeals(): Promise<Deal[]> {
  return db.deals.where('status').equals('lost').toArray();
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
  const deals = await db.deals.toArray();
  const won = deals.filter(d => d.status === 'won').length;
  const lost = deals.filter(d => d.status === 'lost').length;
  const total = won + lost;

  return {
    won,
    lost,
    winRate: total > 0 ? Math.round((won / total) * 100) : 0
  };
}
