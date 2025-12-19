# Task: Wire Up Sentiment API to Notes

## Overview
Connect the Notes component to the sentiment API endpoint so that every note gets analyzed and displays a sentiment indicator (positive/neutral/negative).

## Required Outcome
- When user adds a note, sentiment API is called
- Sentiment score and label are saved with the note
- UI displays colored dot based on sentiment
- Graceful fallback if API fails

## Prerequisites
- Notes component implemented (Frontend Task 03)
- Sentiment endpoint deployed (Backend Task 03)
- Both accessible and working

## Time Estimate
Hour 5-6 of the hackathon (Integration phase)

---

## Step-by-Step Implementation

### Step 1: Verify Sentiment Endpoint

```bash
# Test sentiment endpoint
curl -X POST https://your-api.vercel.app/api/sentiment \
  -H "Content-Type: application/json" \
  -d '{"text": "Great meeting, they love our product!"}'

# Expected: {"score": 0.8, "label": "positive"}

curl -X POST https://your-api.vercel.app/api/sentiment \
  -H "Content-Type: application/json" \
  -d '{"text": "Budget got cut, deal is at risk."}'

# Expected: {"score": -0.6, "label": "negative"}
```

### Step 2: Create Sentiment API Client

**File:** `frontend/hackathon-sales-intelligence/src/lib/api/sentiment.ts`
```typescript
import { API_URL } from '../config';

interface SentimentResult {
  score: number;
  label: 'positive' | 'neutral' | 'negative';
}

export async function analyzeSentiment(text: string): Promise<SentimentResult> {
  try {
    const response = await fetch(`${API_URL}/api/sentiment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text })
    });

    if (!response.ok) {
      console.error('Sentiment API error:', response.status);
      return { score: 0, label: 'neutral' };
    }

    return await response.json();
  } catch (error) {
    console.error('Sentiment API failed:', error);
    // Return neutral on error (fail gracefully)
    return { score: 0, label: 'neutral' };
  }
}
```

### Step 3: Update Note Submission Handler

**In Notes Component:**
```typescript
import { analyzeSentiment } from '../lib/api/sentiment';
import { addNote, getNotesByDeal } from '../lib/db';

async function handleSubmitNote() {
  if (!noteText.trim() || isAnalyzing) return;

  setIsAnalyzing(true);
  setError(null);

  try {
    // 1. Analyze sentiment via API
    const sentiment = await analyzeSentiment(noteText);

    // 2. Save note with sentiment to IndexedDB
    const newNote = await addNote(
      dealId,
      noteText,
      sentiment.score,
      sentiment.label
    );

    // 3. Update UI
    setNotes([...notes, newNote]);
    setNoteText('');

    console.log('Note saved with sentiment:', sentiment);
  } catch (error) {
    setError('Failed to save note');
    console.error('Error adding note:', error);
  } finally {
    setIsAnalyzing(false);
  }
}
```

### Step 4: Display Loading State

```svelte
<!-- Svelte example -->
<button
  on:click={handleSubmitNote}
  disabled={isAnalyzing || !noteText.trim()}
  class="submit-button"
>
  {#if isAnalyzing}
    <span class="flex items-center gap-2">
      <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" opacity="0.25"/>
        <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
      Analyzing...
    </span>
  {:else}
    Add Note
  {/if}
</button>
```

### Step 5: Display Sentiment Indicator

```svelte
<!-- Note item with sentiment dot -->
<div class="note-item">
  <div class="sentiment-dot {getSentimentClass(note.sentiment_label)}"></div>
  <div class="note-content">
    <p>{note.content}</p>
    <span class="note-time">{formatRelativeTime(note.created_at)}</span>
  </div>
</div>

<script>
  function getSentimentClass(label) {
    switch (label) {
      case 'positive': return 'bg-green-500';
      case 'negative': return 'bg-red-500';
      case 'neutral': return 'bg-gray-400';
      default: return 'bg-gray-300';
    }
  }
</script>

<style>
  .sentiment-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
    margin-top: 6px;
  }
</style>
```

### Step 6: Update Deal List with Latest Sentiment

The deal list should show the sentiment of the most recent note:

```typescript
// In Deal List component
import { getLatestNoteByDeal } from '../lib/db';

async function loadDealsWithSentiment() {
  const deals = await getDeals();

  // Enrich each deal with latest note sentiment
  const enrichedDeals = await Promise.all(
    deals.map(async (deal) => {
      const latestNote = await getLatestNoteByDeal(deal.id);
      return {
        ...deal,
        latestSentiment: latestNote?.sentiment_label || null
      };
    })
  );

  return enrichedDeals;
}
```

---

## Data Flow Diagram

```
User types note
       │
       v
┌──────────────┐
│ Click "Add"  │
└──────┬───────┘
       │
       v
┌──────────────────────────────────────┐
│ POST /api/sentiment { text: "..." }  │
│                                      │
│     Google Gemini 2.5 Flash         │
│            │                         │
│            v                         │
│   { score: 0.7, label: "positive" }  │
└──────────────────┬───────────────────┘
                   │
                   v
┌──────────────────────────────────────┐
│ Save to IndexedDB:                   │
│   addNote(dealId, text, 0.7, "pos")  │
└──────────────────┬───────────────────┘
                   │
                   v
┌──────────────────────────────────────┐
│ Update UI:                           │
│   - Show note in list               │
│   - Green dot appears               │
│   - Deal list updates at-risk        │
└──────────────────────────────────────┘
```

---

## Acceptance Criteria

- [x] Note submission calls sentiment API
- [x] Loading indicator shows "Analyzing..." during API call
- [x] Sentiment score and label are saved with note in IndexedDB
- [x] Note displays colored sentiment dot after save
- [x] Green dot for positive, gray for neutral, red for negative
- [x] API failures return neutral (don't break the app)
- [x] Deal list shows sentiment of latest note
- [x] At-risk indicator works (negative sentiment = red dot)

---

## Testing Scenarios

### Test 1: Positive Sentiment
```
Input: "Amazing call! They want to sign next week!"
Expected: Green dot appears
```

### Test 2: Negative Sentiment
```
Input: "Budget was cut. They're going with competitor."
Expected: Red dot appears
```

### Test 3: Neutral Sentiment
```
Input: "Had a meeting today. Discussed timeline."
Expected: Gray dot appears
```

### Test 4: API Failure
```
Scenario: Sentiment API returns 500
Expected: Note saved with neutral sentiment, no error shown to user
```

### Test 5: Network Offline
```
Scenario: Device is offline
Expected: Note saved with null sentiment (or skip API call)
```

---

## Error Handling Strategy

```typescript
async function handleSubmitNote() {
  setIsAnalyzing(true);

  let sentiment = { score: 0, label: 'neutral' as const };

  // Only call sentiment API if online
  if (navigator.onLine) {
    try {
      sentiment = await analyzeSentiment(noteText);
    } catch (error) {
      console.warn('Sentiment analysis failed, using neutral:', error);
      // Continue with neutral sentiment
    }
  }

  // Always save the note, even without sentiment
  const newNote = await addNote(
    dealId,
    noteText,
    sentiment.score,
    sentiment.label
  );

  setNotes([...notes, newNote]);
  setNoteText('');
  setIsAnalyzing(false);
}
```

---

## Debugging Checklist

### "Sentiment always shows neutral"
- Check sentiment endpoint URL is correct
- Check browser network tab for API response
- Verify API key is set in backend

### "Notes not showing sentiment dot"
- Check `sentiment_label` is being saved
- Verify CSS classes are correct
- Check note object structure matches expected

### "Loading spinner never stops"
- Add timeout to sentiment call
- Check for unhandled promise rejections
- Verify `setIsAnalyzing(false)` is in finally block

### "CORS error on sentiment call"
- Check backend returns CORS headers
- Verify OPTIONS preflight succeeds
