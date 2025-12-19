# Task: IndexedDB Setup with Dexie.js

## Overview
Set up the local database layer using Dexie.js for offline-first functionality. This is the foundation for all local data storage in the app.

## Required Outcome
A fully functional IndexedDB setup with typed tables for deals and notes, including all necessary CRUD helper functions.

## Prerequisites
- Frontend project initialized (Vite + Svelte/React)
- Dexie.js installed: `npm install dexie`
- TypeScript configured

## Time Estimate
Hour 1-2 of the hackathon

---

## Step-by-Step Implementation

### Step 1: Create Database Types
Create TypeScript interfaces for the data models.

**File:** `src/lib/db/types.ts`

```typescript
export interface Deal {
  id: string;
  name: string;
  value: number;
  status: 'open' | 'won' | 'lost';
  loss_reason: string | null;
  created_at: Date;
  updated_at: Date;
  synced: boolean;
}

export interface Note {
  id: string;
  deal_id: string;
  content: string;
  sentiment_score: number | null;
  sentiment_label: 'positive' | 'neutral' | 'negative' | null;
  created_at: Date;
  synced: boolean;
}
```

### Step 2: Initialize Dexie Database
Create the database class with indexed tables.

**File:** `src/lib/db/database.ts`

```typescript
import Dexie, { Table } from 'dexie';
import type { Deal, Note } from './types';

export class DealsDatabase extends Dexie {
  deals!: Table<Deal>;
  notes!: Table<Note>;

  constructor() {
    super('DealsTracker');
    this.version(1).stores({
      deals: 'id, status, synced, updated_at',
      notes: 'id, deal_id, synced, created_at'
    });
  }
}

export const db = new DealsDatabase();
```

### Step 3: Create Deal Helper Functions
Implement CRUD operations for deals.

**File:** `src/lib/db/deals.ts`

```typescript
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
```

### Step 4: Create Note Helper Functions
Implement CRUD operations for notes.

**File:** `src/lib/db/notes.ts`

```typescript
import { db } from './database';
import type { Note } from './types';

export async function addNote(
  deal_id: string,
  content: string,
  sentiment_score: number | null = null,
  sentiment_label: 'positive' | 'neutral' | 'negative' | null = null
): Promise<Note> {
  const note: Note = {
    id: crypto.randomUUID(),
    deal_id,
    content,
    sentiment_score,
    sentiment_label,
    created_at: new Date(),
    synced: false
  };
  await db.notes.add(note);
  return note;
}

export async function getNotesByDeal(deal_id: string): Promise<Note[]> {
  return db.notes.where('deal_id').equals(deal_id).sortBy('created_at');
}

export async function getLatestNoteByDeal(deal_id: string): Promise<Note | undefined> {
  const notes = await db.notes
    .where('deal_id')
    .equals(deal_id)
    .reverse()
    .sortBy('created_at');
  return notes[0];
}

export async function getUnsyncedNotes(): Promise<Note[]> {
  return db.notes.where('synced').equals(0).toArray();
}

export async function markNotesSynced(ids: string[]): Promise<void> {
  await db.notes.where('id').anyOf(ids).modify({ synced: true });
}
```

### Step 5: Create Index Export
Export all database functions from a single entry point.

**File:** `src/lib/db/index.ts`

```typescript
export { db } from './database';
export type { Deal, Note } from './types';
export * from './deals';
export * from './notes';
```

---

## Acceptance Criteria

- [x] Database initializes without errors
- [x] Can create a new deal with `addDeal()`
- [x] Can update a deal with `updateDeal()`
- [x] Can retrieve all deals with `getDeals()`
- [x] Can create notes with `addNote()`
- [x] Can retrieve notes by deal with `getNotesByDeal()`
- [x] Unsynced items can be queried for sync operations
- [x] All functions are properly typed with TypeScript

---

## Testing Checklist

```javascript
// Quick console tests (run in browser dev tools)
import { addDeal, getDeals, addNote, getNotesByDeal } from './lib/db';

// Test deal creation
const deal = await addDeal('Test Deal', 10000);
console.log('Created deal:', deal);

// Test deal retrieval
const deals = await getDeals();
console.log('All deals:', deals);

// Test note creation
const note = await addNote(deal.id, 'Test note content');
console.log('Created note:', note);

// Test note retrieval
const notes = await getNotesByDeal(deal.id);
console.log('Deal notes:', notes);
```

---

## AI Prompt for Claude

```
Create a Dexie.js database setup for a deals tracking app using TypeScript.

Schema:
- deals table: id (string), name (string), value (number), status ('open'|'won'|'lost'), loss_reason (string|null), created_at (Date), updated_at (Date), synced (boolean)
- notes table: id (string), deal_id (string), content (string), sentiment_score (number|null), sentiment_label ('positive'|'neutral'|'negative'|null), created_at (Date), synced (boolean)

Include:
- Database class with typed tables
- Helper functions for deals: addDeal, updateDeal, getDeals, getUnsyncedDeals
- Helper functions for notes: addNote, getNotesByDeal, getUnsyncedNotes
- markSynced function for both tables
- Use UUIDs for IDs (crypto.randomUUID())

Keep it simple, no over-engineering.
```

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Dexie version error | Clear IndexedDB in dev tools and refresh |
| Type errors with Table | Ensure Dexie is v3+ |
| synced field not indexing | Use `0` and `1` instead of boolean in queries |
