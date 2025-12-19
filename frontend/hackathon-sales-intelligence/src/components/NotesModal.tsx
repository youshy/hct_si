import { useState, useEffect } from 'react';
import type { Deal, Note } from '../lib/db';
import { getNotesByDeal, addNote } from '../lib/db';
import { analyzeSentiment } from '../lib/api/sentiment';
import { NoteItem } from './NoteItem';
import { useToast } from './Toast';

interface NotesModalProps {
  deal: Deal;
  isOpen: boolean;
  onClose: () => void;
  onNoteAdded: () => void;
}

export function NotesModal({ deal, isOpen, onClose, onNoteAdded }: NotesModalProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNoteText, setNewNoteText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen && deal?.id) {
      loadNotes();
    }
  }, [isOpen, deal?.id]);

  const loadNotes = async () => {
    if (!deal?.id) return;
    try {
      const dealNotes = await getNotesByDeal(deal.id);
      setNotes(dealNotes.reverse());
    } catch (error) {
      console.error('Failed to load notes:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim() || isAnalyzing || !deal?.id) return;

    setIsAnalyzing(true);

    try {
      const sentiment = await analyzeSentiment(newNoteText.trim());
      const note = await addNote(
        deal.id,
        newNoteText.trim(),
        sentiment.score,
        sentiment.label
      );
      setNotes([note, ...notes]);
      setNewNoteText('');
      if (navigator.vibrate) navigator.vibrate(10);
      showToast('Note added');
      onNoteAdded();
    } catch (error) {
      console.error('Failed to add note with sentiment:', error);
      try {
        const note = await addNote(deal.id, newNoteText.trim(), null, null);
        setNotes([note, ...notes]);
        setNewNoteText('');
        showToast('Note added (sentiment unavailable)', 'info');
        onNoteAdded();
      } catch (innerError) {
        console.error('Failed to add note:', innerError);
        showToast('Failed to add note', 'error');
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!isOpen || !deal) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-lg h-[80vh] sm:h-[70vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 truncate pr-4">
            Notes for: {deal.name}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Notes List */}
        <div className="flex-1 overflow-y-auto">
          {notes.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              No notes yet
            </div>
          ) : (
            notes.map((note) => (
              <NoteItem key={note.id} note={note} />
            ))
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <form onSubmit={handleSubmit}>
            <textarea
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              placeholder="Add a note..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900"
              rows={3}
              disabled={isAnalyzing}
            />
            {isAnalyzing ? (
              <div className="flex items-center justify-center gap-2 py-3 text-gray-500 text-sm">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Analyzing sentiment...
              </div>
            ) : (
              <button
                type="submit"
                disabled={!newNoteText.trim()}
                className="mt-2 w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Add Note
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
