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
