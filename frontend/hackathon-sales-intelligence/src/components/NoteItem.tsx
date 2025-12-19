import type { Note } from '../lib/db';
import { getSentimentColor, formatRelativeTime } from '../lib/utils/format';

interface NoteItemProps {
  note: Note;
}

export function NoteItem({ note }: NoteItemProps) {
  return (
    <div className="flex items-start gap-3 p-3 border-b border-gray-100">
      <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${getSentimentColor(note.sentiment_label)}`} />
      <div className="flex-1 min-w-0">
        <p className="text-gray-700 whitespace-pre-wrap break-words">{note.content}</p>
        <p className="text-xs text-gray-400 mt-1">{formatRelativeTime(note.created_at)}</p>
      </div>
    </div>
  );
}
