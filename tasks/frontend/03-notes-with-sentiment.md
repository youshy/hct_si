# Task: Notes UI with Sentiment Analysis

## Overview
Create the notes interface that allows users to add notes to deals and displays sentiment analysis results. This integrates with the backend sentiment API.

## Required Outcome
A modal/panel component that:
- Displays existing notes with timestamps and sentiment indicators
- Provides input for new notes
- Calls sentiment API on submission
- Shows real-time sentiment results

## Prerequisites
- IndexedDB setup complete (Task 01)
- Deal List component complete (Task 02)
- Backend sentiment endpoint deployed (Backend Task 03)
- Tailwind CSS configured

## Time Estimate
Hour 3-4 of the hackathon

---

## Step-by-Step Implementation

### Step 1: Create Notes Modal/Panel Component
Design the container for viewing and adding notes.

**Layout Structure:**
```
+------------------------------------------+
|  [X]  Notes for: Deal Name               |
+------------------------------------------+
|                                          |
|  [Note 1 with sentiment dot and time]    |
|  [Note 2 with sentiment dot and time]    |
|  [Note 3 with sentiment dot and time]    |
|                                          |
|  (scrollable area)                       |
|                                          |
+------------------------------------------+
|  [Text input........................]    |
|                            [Send button] |
+------------------------------------------+
```

### Step 2: Implement Note Display
Each note should show:
- Sentiment dot (color-coded)
- Note content
- Relative timestamp

```typescript
interface NoteDisplayProps {
  content: string;
  sentiment_label: 'positive' | 'neutral' | 'negative' | null;
  created_at: Date;
}
```

### Step 3: Create Note Input Component
**Elements:**
- Text input (textarea for multiline)
- Submit button
- Loading state ("Analyzing...")

### Step 4: Implement Sentiment API Integration

```typescript
async function analyzeSentiment(text: string): Promise<{
  score: number;
  label: 'positive' | 'neutral' | 'negative';
}> {
  const response = await fetch('/api/sentiment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });

  if (!response.ok) {
    // Fallback to neutral on error
    return { score: 0, label: 'neutral' };
  }

  return response.json();
}
```

### Step 5: Implement Note Submission Flow

```
User types note
     |
     v
User clicks "Send"
     |
     v
Show "Analyzing..." state
     |
     v
POST /api/sentiment with note text
     |
     v
Receive { score, label }
     |
     v
Save to IndexedDB via addNote()
     |
     v
Update UI with new note + sentiment dot
     |
     v
Clear input, hide loading
```

### Step 6: Load Existing Notes
On modal open:
1. Call `getNotesByDeal(deal_id)`
2. Sort by created_at (newest first or oldest first - your choice)
3. Render note list

---

## UI Specifications

### Note Item
```css
.note-item {
  @apply flex items-start gap-3 p-3 border-b border-gray-100;
}

.note-content {
  @apply text-gray-700 flex-1;
}

.note-time {
  @apply text-xs text-gray-400;
}
```

### Sentiment Dots
```css
.sentiment-dot {
  @apply w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0;
}

.sentiment-positive { @apply bg-green-500; }
.sentiment-neutral { @apply bg-gray-400; }
.sentiment-negative { @apply bg-red-500; }
```

### Input Area
```css
.note-input-container {
  @apply border-t border-gray-200 p-4 bg-gray-50;
}

.note-input {
  @apply w-full p-3 border border-gray-300 rounded-lg;
  @apply focus:ring-2 focus:ring-blue-500 focus:border-transparent;
  @apply resize-none;
}

.send-button {
  @apply mt-2 w-full py-3 bg-blue-600 text-white rounded-lg;
  @apply font-medium;
  @apply disabled:bg-gray-300 disabled:cursor-not-allowed;
}
```

### Loading State
```css
.analyzing-indicator {
  @apply flex items-center justify-center gap-2 py-3;
  @apply text-gray-500 text-sm;
}
```

---

## Component State

```typescript
interface NotesModalState {
  notes: Note[];
  newNoteText: string;
  isAnalyzing: boolean;
  error: string | null;
}
```

---

## Acceptance Criteria

- [ ] Modal opens when "Add Note" is selected from deal action menu
- [ ] Existing notes load and display correctly
- [ ] Each note shows sentiment indicator dot
- [ ] Note input accepts multiline text
- [ ] Submit button is disabled when input is empty
- [ ] "Analyzing..." shows during API call
- [ ] Sentiment API is called on note submit
- [ ] New note appears immediately with sentiment indicator
- [ ] Input clears after successful submission
- [ ] Gracefully handles API errors (shows note with neutral sentiment)
- [ ] Modal can be closed via X button or backdrop tap

---

## AI Prompt for Claude

```
Create a [Svelte/React] component for adding and viewing notes on a deal.

Requirements:
- Modal or slide-up panel showing notes for a deal
- List existing notes with:
  - Note content
  - Timestamp
  - Sentiment indicator (colored dot: green/gray/red)
- Text input at bottom to add new note
- On submit:
  1. Call POST /api/sentiment with note text
  2. Save note to IndexedDB with returned sentiment
  3. Display immediately with sentiment indicator
- Show "analyzing..." briefly while sentiment API runs
- Tailwind CSS, mobile-first

Keep the UI simple - just a list and input.
```

---

## Relative Time Helper

```typescript
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}
```

---

## Error Handling

```typescript
async function submitNote(dealId: string, content: string) {
  setIsAnalyzing(true);

  try {
    // Get sentiment
    const sentiment = await analyzeSentiment(content);

    // Save to IndexedDB
    const note = await addNote(
      dealId,
      content,
      sentiment.score,
      sentiment.label
    );

    // Update UI
    setNotes([...notes, note]);
    setNewNoteText('');
  } catch (error) {
    // Fallback: save note without sentiment
    const note = await addNote(dealId, content, null, null);
    setNotes([...notes, note]);
    setNewNoteText('');
    console.error('Sentiment analysis failed:', error);
  } finally {
    setIsAnalyzing(false);
  }
}
```

---

## Testing Scenarios

1. **Happy path:** Add note -> See "Analyzing..." -> See green/gray/red dot
2. **API failure:** Add note -> API fails -> Note saved with no sentiment
3. **Empty input:** Submit button should be disabled
4. **Long note:** Should wrap text properly
5. **Many notes:** List should scroll
