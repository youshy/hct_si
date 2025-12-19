import Dexie, { type Table } from 'dexie';
import type { Deal, Note } from './types';

export class DealsDatabase extends Dexie {
  deals!: Table<Deal>;
  notes!: Table<Note>;

  constructor() {
    super('DealsTracker');
    this.version(2).stores({
      deals: 'id, status, synced, created_at, updated_at',
      notes: 'id, deal_id, synced, created_at'
    });
  }
}

export const db = new DealsDatabase();
