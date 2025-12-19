import { useState, useEffect } from 'react';
import type { Deal, Note, DealStage } from '../lib/db';
import { getNotesByDeal, addNote, updateDeal, archiveDeal, STAGE_INFO } from '../lib/db';
import { analyzeSentiment } from '../lib/api/sentiment';
import { formatCurrency } from '../lib/utils/format';
import { NoteItem } from './NoteItem';
import { LossReasonModal } from './LossReasonModal';
import { EditDealModal } from './EditDealModal';
import { useToast } from './Toast';

interface DealDetailProps {
  deal: Deal;
  onBack: () => void;
  onDealUpdated: () => void;
}

// Helper to format expected close date
function formatCloseDate(date: Date | string | null): { text: string; color: string } | null {
  if (!date) return null;

  const closeDate = date instanceof Date ? date : new Date(date);
  if (isNaN(closeDate.getTime())) return null;

  const now = new Date();
  const diffTime = closeDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { text: `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''}`, color: 'text-red-600' };
  } else if (diffDays === 0) {
    return { text: 'Closes today', color: 'text-orange-600' };
  } else if (diffDays <= 7) {
    return { text: `Closes in ${diffDays} day${diffDays !== 1 ? 's' : ''}`, color: 'text-yellow-600' };
  } else {
    return { text: `Closes in ${diffDays} days`, color: 'text-green-600' };
  }
}

export function DealDetail({ deal, onBack, onDealUpdated }: DealDetailProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNoteText, setNewNoteText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showLossModal, setShowLossModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentDeal, setCurrentDeal] = useState(deal);
  const { showToast } = useToast();

  useEffect(() => {
    loadNotes();
  }, [deal.id]);

  // Keep currentDeal in sync with deal prop
  useEffect(() => {
    setCurrentDeal(deal);
  }, [deal]);

  const loadNotes = async () => {
    try {
      const dealNotes = await getNotesByDeal(deal.id);
      setNotes(dealNotes.reverse());
    } catch (error) {
      console.error('Failed to load notes:', error);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim() || isAnalyzing) return;

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
      onDealUpdated();
    } catch (error) {
      console.error('Failed to add note with sentiment:', error);
      try {
        const note = await addNote(deal.id, newNoteText.trim(), null, null);
        setNotes([note, ...notes]);
        setNewNoteText('');
        showToast('Note added (sentiment unavailable)', 'info');
        onDealUpdated();
      } catch (innerError) {
        console.error('Failed to add note:', innerError);
        showToast('Failed to add note', 'error');
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleMarkWon = async () => {
    await updateDeal(deal.id, { status: 'won' });
    if (navigator.vibrate) navigator.vibrate([10, 50, 10]);
    showToast(`"${deal.name}" marked as won!`, 'success');
    onDealUpdated();
    onBack();
  };

  const handleLossComplete = () => {
    setShowLossModal(false);
    onDealUpdated();
    onBack();
  };

  const handleEditComplete = async () => {
    setShowEditModal(false);
    onDealUpdated();
  };

  const handleArchive = async () => {
    await archiveDeal(deal.id);
    if (navigator.vibrate) navigator.vibrate(10);
    showToast(`"${deal.name}" archived`);
    onDealUpdated();
    onBack();
  };

  const handleStageChange = async (newStage: DealStage) => {
    await updateDeal(deal.id, { stage: newStage });
    setCurrentDeal({ ...currentDeal, stage: newStage });
    if (navigator.vibrate) navigator.vibrate(10);
    showToast(`Stage updated to ${STAGE_INFO[newStage].label}`);
    onDealUpdated();
  };

  const statusClasses = {
    open: 'bg-blue-100 text-blue-800',
    won: 'bg-green-100 text-green-800',
    lost: 'bg-red-100 text-red-800'
  };

  const latestSentiment = notes[0]?.sentiment_label;
  const sentimentInfo = {
    positive: { color: 'text-green-600', label: 'Positive sentiment' },
    neutral: { color: 'text-gray-500', label: 'Neutral sentiment' },
    negative: { color: 'text-red-600', label: 'Negative sentiment' }
  };

  const closeDateInfo = formatCloseDate(currentDeal.expected_close_date);

  // More padding when action buttons are shown (open deals)
  const bottomPadding = currentDeal.status === 'open' ? 'pb-40' : 'pb-24';

  return (
    <div className={`min-h-screen bg-gray-100 ${bottomPadding} flex flex-col`}>
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 py-3 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-gray-600 -ml-2 px-2 py-1 rounded-lg active:bg-gray-100"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleArchive}
              className="p-2 text-gray-500 rounded-lg active:bg-gray-100"
              title="Archive deal"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            </button>
            <button
              onClick={() => setShowEditModal(true)}
              className="px-3 py-1.5 text-blue-600 font-medium rounded-lg active:bg-blue-50"
            >
              Edit
            </button>
          </div>
        </div>
      </header>

      {/* Deal Info */}
      <div className="bg-white px-4 py-6 border-b border-gray-200">
        <div className="flex items-start justify-between mb-2">
          <h1 className="text-2xl font-bold text-gray-900">{currentDeal.name}</h1>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusClasses[currentDeal.status]}`}>
            {currentDeal.status.charAt(0).toUpperCase() + currentDeal.status.slice(1)}
          </span>
        </div>

        {currentDeal.customer_name && (
          <div className="text-gray-500 mb-3">{currentDeal.customer_name}</div>
        )}

        <div className="text-3xl font-bold text-gray-900 mb-4">
          {formatCurrency(currentDeal.value)}
        </div>

        {/* Stage selector for open deals */}
        {currentDeal.status === 'open' && (
          <div className="mb-4">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Pipeline Stage</div>
            <div className="flex gap-1 overflow-x-auto pb-1">
              {(Object.keys(STAGE_INFO) as DealStage[]).map((s) => (
                <button
                  key={s}
                  onClick={() => handleStageChange(s)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    currentDeal.stage === s
                      ? 'text-white'
                      : 'bg-gray-100 text-gray-600 active:bg-gray-200'
                  }`}
                  style={currentDeal.stage === s ? { backgroundColor: STAGE_INFO[s].color } : {}}
                >
                  {STAGE_INFO[s].label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2 text-sm">
          {closeDateInfo && currentDeal.status === 'open' && (
            <div className={`flex items-center gap-2 ${closeDateInfo.color}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {closeDateInfo.text}
            </div>
          )}
          {latestSentiment && (
            <div className={`flex items-center gap-2 ${sentimentInfo[latestSentiment].color}`}>
              <div className={`w-2 h-2 rounded-full ${
                latestSentiment === 'positive' ? 'bg-green-500' :
                latestSentiment === 'negative' ? 'bg-red-500' : 'bg-gray-400'
              }`} />
              {sentimentInfo[latestSentiment].label}
            </div>
          )}
          <div className="text-gray-500">
            Created {new Date(currentDeal.created_at).toLocaleDateString()}
          </div>
          {currentDeal.status === 'lost' && currentDeal.loss_reason && (
            <div className="text-red-600">
              Lost reason: {currentDeal.loss_reason.charAt(0).toUpperCase() + currentDeal.loss_reason.slice(1)}
            </div>
          )}
        </div>
      </div>

      {/* Notes Section */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h2 className="font-semibold text-gray-700">Notes ({notes.length})</h2>
        </div>

        <div className="flex-1 overflow-y-auto">
          {notes.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-gray-400">
              No notes yet
            </div>
          ) : (
            notes.map((note) => (
              <NoteItem key={note.id} note={note} />
            ))
          )}
        </div>
      </div>

      {/* Add Note Input - Fixed above action buttons */}
      <div className={`fixed left-0 right-0 border-t border-gray-200 p-4 bg-white z-10 ${
        currentDeal.status === 'open' ? 'bottom-[72px]' : 'bottom-0'
      }`}>
        <form onSubmit={handleAddNote}>
          <div className="flex gap-2">
            <input
              type="text"
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              placeholder="Add a note..."
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              disabled={isAnalyzing}
            />
            {isAnalyzing ? (
              <div className="flex items-center justify-center px-4">
                <svg className="animate-spin h-5 w-5 text-blue-600" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
            ) : (
              <button
                type="submit"
                disabled={!newNoteText.trim()}
                className="px-4 py-3 bg-blue-600 text-white rounded-lg font-medium active:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Add
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Action Buttons (only for open deals) */}
      {currentDeal.status === 'open' && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 flex gap-3 z-10">
          <button
            onClick={handleMarkWon}
            className="flex-1 py-3 bg-green-600 text-white rounded-lg font-medium active:bg-green-700 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Mark Won
          </button>
          <button
            onClick={() => setShowLossModal(true)}
            className="flex-1 py-3 bg-red-600 text-white rounded-lg font-medium active:bg-red-700 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Mark Lost
          </button>
        </div>
      )}

      {/* Modals */}
      {showLossModal && (
        <LossReasonModal
          dealId={deal.id}
          dealName={deal.name}
          isOpen={showLossModal}
          onClose={() => setShowLossModal(false)}
          onComplete={handleLossComplete}
        />
      )}

      <EditDealModal
        deal={currentDeal}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onComplete={handleEditComplete}
      />
    </div>
  );
}
