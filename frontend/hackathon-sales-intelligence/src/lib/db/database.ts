import Dexie, { type Table } from 'dexie';
import type { Deal, Note } from './types';

export class DealsDatabase extends Dexie {
  deals!: Table<Deal>;
  notes!: Table<Note>;

  constructor() {
    super('DealsTracker');

    // v2 schema (existing)
    this.version(2).stores({
      deals: 'id, status, synced, created_at, updated_at',
      notes: 'id, deal_id, synced, created_at'
    });

    // v3 schema - add new v4 feature indexes
    this.version(3).stores({
      deals: 'id, status, synced, created_at, updated_at, archived, stage, expected_close_date',
      notes: 'id, deal_id, synced, created_at'
    }).upgrade(tx => {
      // Migrate existing deals to have new fields
      return tx.table('deals').toCollection().modify(deal => {
        if (deal.archived === undefined) deal.archived = false;
        if (deal.stage === undefined) deal.stage = 'prospect';
        if (deal.expected_close_date === undefined) deal.expected_close_date = null;
        if (deal.customer_name === undefined) deal.customer_name = null;
      });
    });
  }
}

export const db = new DealsDatabase();
