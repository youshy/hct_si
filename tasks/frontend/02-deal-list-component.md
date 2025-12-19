# Task: Deal List Component

## Overview
Create the main deal list view that displays all deals with their status, value, and sentiment indicators. This is the primary screen users will interact with.

## Required Outcome
A responsive, mobile-first deal list component with:
- Deal cards showing name, value, and status
- Sentiment indicator dots based on latest note
- Floating action button to add deals
- Action menu for deal interactions

## Prerequisites
- IndexedDB setup complete (Task 01)
- Tailwind CSS configured
- Framework (Svelte/React) set up

## Time Estimate
Hour 2-3 of the hackathon

---

## Step-by-Step Implementation

### Step 1: Create the Deal Card Component
A reusable card for displaying individual deals.

**Key Elements:**
- Deal name (primary text)
- Deal value (formatted as currency)
- Status badge (open/won/lost)
- Sentiment dot indicator (green/gray/red)

```
+------------------------------------------+
|  [Sentiment Dot]  Deal Name              |
|                   $50,000                |
|                              [Open] badge|
+------------------------------------------+
```

### Step 2: Implement Sentiment Indicator Logic

```typescript
// Sentiment dot color logic
function getSentimentColor(label: string | null): string {
  switch (label) {
    case 'positive': return 'bg-green-500';
    case 'negative': return 'bg-red-500';
    case 'neutral': return 'bg-gray-400';
    default: return 'bg-gray-300'; // No sentiment yet
  }
}

// Check if deal is at-risk
function isAtRisk(latestNote: Note | null): boolean {
  return latestNote?.sentiment_label === 'negative';
}
```

### Step 3: Create the Deal List Container
- Fetch deals from IndexedDB on mount
- Subscribe to database changes for live updates
- Sort by created_at descending (newest first)

### Step 4: Add the Floating Action Button (FAB)
- Position: fixed bottom-right
- Large touch target (56px minimum)
- Plus icon
- Opens Add Deal modal on click

### Step 5: Implement Add Deal Modal
**Fields:**
- Deal name (text input, required)
- Deal value (number input, required)
- Submit button

**Behavior:**
- Opens on FAB click
- Validates inputs
- Calls `addDeal()` on submit
- Closes and refreshes list

### Step 6: Implement Action Menu
Appears when tapping a deal card.

**Options:**
1. "Add Note" - Opens Notes modal (Task 03)
2. "Mark Won" - Updates status immediately
3. "Mark Lost" - Opens Loss Reason modal (Task 04)

---

## UI Specifications

### Deal Card
```css
/* Tailwind classes */
.deal-card {
  @apply bg-white rounded-lg shadow-sm p-4 mb-3;
  @apply flex items-center justify-between;
  @apply active:bg-gray-50; /* Touch feedback */
}

.deal-name {
  @apply text-lg font-medium text-gray-900;
}

.deal-value {
  @apply text-sm text-gray-500;
}

.status-badge {
  @apply px-2 py-1 rounded-full text-xs font-medium;
}

.status-open { @apply bg-blue-100 text-blue-800; }
.status-won { @apply bg-green-100 text-green-800; }
.status-lost { @apply bg-red-100 text-red-800; }
```

### Sentiment Dot
```css
.sentiment-dot {
  @apply w-3 h-3 rounded-full mr-3;
}

.at-risk-highlight {
  @apply border-2 border-red-300 bg-red-50;
}
```

### Floating Action Button
```css
.fab {
  @apply fixed bottom-6 right-6;
  @apply w-14 h-14 rounded-full;
  @apply bg-blue-600 text-white;
  @apply flex items-center justify-center;
  @apply shadow-lg;
  @apply active:bg-blue-700;
}
```

---

## Data Flow

```
Component Mount
     |
     v
getDeals() from IndexedDB
     |
     v
For each deal: getLatestNoteByDeal()
     |
     v
Render list with sentiment indicators
     |
     v
User taps deal --> Show action menu
User taps FAB --> Show add modal
```

---

## Acceptance Criteria

- [x] Deal list displays all deals from IndexedDB
- [x] Each deal shows name, value, and status badge
- [x] Sentiment dot appears based on latest note sentiment
- [x] At-risk deals (negative sentiment) have red dot
- [x] FAB is visible and accessible
- [x] Add Deal modal opens and creates deals
- [x] Deal cards are tappable with visual feedback
- [x] Action menu appears with three options
- [x] "Mark Won" updates deal status immediately
- [x] List refreshes after any changes
- [x] UI is mobile-friendly (thumb-reachable targets)

---

## AI Prompt for Claude

```
Create a [Svelte/React] component for a deal list with these requirements:

- Fetches deals from Dexie.js (assume db.deals.toArray() exists)
- Shows each deal as a card: name, value (formatted as currency), status badge
- Show a small colored dot if deal has notes with sentiment:
  - Green dot = latest note is positive
  - Gray dot = latest note is neutral
  - Red dot = latest note is negative (AT RISK)
- Floating action button (bottom right) to add new deal
- Clicking a deal opens action menu: "Add Note", "Mark Won", "Mark Lost"
- Use Tailwind CSS
- Mobile-first, thumb-friendly (large touch targets)
- Include the AddDealModal component inline (name + value fields only)

Keep it minimal - no animations, no fancy stuff.
```

---

## Currency Formatting Helper

```typescript
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

// Usage: formatCurrency(50000) --> "$50,000"
```

---

## Component State

```typescript
interface DealListState {
  deals: Deal[];
  loading: boolean;
  selectedDeal: Deal | null;
  showAddModal: boolean;
  showActionMenu: boolean;
}
```
