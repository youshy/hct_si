# Task: Loss Dashboard with At-Risk Deals

## Overview
Create a dashboard that surfaces at-risk deals (negative sentiment) and provides loss analytics to help the sales team understand why deals are being lost.

## Required Outcome
A dashboard view showing:
1. **At-Risk Deals** - Prominently displayed deals with negative sentiment
2. **Loss Summary** - Total count and value of lost deals
3. **Loss Reasons Breakdown** - Visual breakdown by reason
4. **Win/Loss Ratio** - Quick performance indicator

## Prerequisites
- IndexedDB setup complete (Task 01)
- Notes with sentiment complete (Task 03)
- Deal data with loss reasons populated

## Time Estimate
Hour 4-5 of the hackathon

---

## Step-by-Step Implementation

### Step 1: Design Dashboard Layout

```
+------------------------------------------+
|  DASHBOARD                               |
+------------------------------------------+
|                                          |
|  ⚠️ AT-RISK DEALS                        |
|  +------------------------------------+  |
|  | 🔴 Acme Corp - $50,000             |  |
|  | "Budget got cut, they're hesitant" |  |
|  +------------------------------------+  |
|  | 🔴 TechStart - $25,000             |  |
|  | "Competition offering 50% less"    |  |
|  +------------------------------------+  |
|                                          |
+------------------------------------------+
|  LOSS SUMMARY                            |
|  +------------------+------------------+ |
|  |  Deals Lost: 12  |  Value: $340K   | |
|  +------------------+------------------+ |
|                                          |
+------------------------------------------+
|  LOSS REASONS                            |
|  Price       ████████████  5 ($150K)    |
|  Competitor  ████████      3 ($90K)     |
|  Timing      ████          2 ($50K)     |
|  Bad Fit     ██            1 ($30K)     |
|  Other       ██            1 ($20K)     |
|                                          |
+------------------------------------------+
|  Win/Loss: 8 won / 12 lost (40% win)    |
+------------------------------------------+
```

### Step 2: Query Functions for Dashboard Data

```typescript
// Get at-risk deals (open deals with negative sentiment on latest note)
async function getAtRiskDeals(): Promise<Array<Deal & { latestNote: Note }>> {
  const openDeals = await db.deals
    .where('status')
    .equals('open')
    .toArray();

  const atRiskDeals = [];

  for (const deal of openDeals) {
    const latestNote = await getLatestNoteByDeal(deal.id);
    if (latestNote?.sentiment_label === 'negative') {
      atRiskDeals.push({ ...deal, latestNote });
    }
  }

  return atRiskDeals;
}

// Get loss statistics
async function getLossStats(): Promise<{
  totalLost: number;
  totalValue: number;
  byReason: Record<string, { count: number; value: number }>;
}> {
  const lostDeals = await db.deals
    .where('status')
    .equals('lost')
    .toArray();

  const byReason: Record<string, { count: number; value: number }> = {
    price: { count: 0, value: 0 },
    timing: { count: 0, value: 0 },
    competitor: { count: 0, value: 0 },
    fit: { count: 0, value: 0 },
    other: { count: 0, value: 0 }
  };

  let totalValue = 0;

  for (const deal of lostDeals) {
    totalValue += deal.value;
    if (deal.loss_reason && byReason[deal.loss_reason]) {
      byReason[deal.loss_reason].count++;
      byReason[deal.loss_reason].value += deal.value;
    }
  }

  return {
    totalLost: lostDeals.length,
    totalValue,
    byReason
  };
}

// Get win/loss ratio
async function getWinLossRatio(): Promise<{
  won: number;
  lost: number;
  winRate: number;
}> {
  const deals = await db.deals.toArray();
  const won = deals.filter(d => d.status === 'won').length;
  const lost = deals.filter(d => d.status === 'lost').length;
  const total = won + lost;

  return {
    won,
    lost,
    winRate: total > 0 ? Math.round((won / total) * 100) : 0
  };
}
```

### Step 3: Create At-Risk Deals Section
**Priority:** This should be the most prominent section.

```typescript
// Component for at-risk deal card
interface AtRiskDealCardProps {
  deal: Deal;
  latestNote: Note;
  onClick: () => void; // Navigate to deal
}
```

### Step 4: Create Loss Summary Cards
Simple stat cards showing total lost deals and value.

### Step 5: Create Loss Reasons Breakdown
CSS-based bar chart showing distribution by reason.

```typescript
// Calculate bar width percentage
function getBarWidth(count: number, maxCount: number): number {
  return maxCount > 0 ? (count / maxCount) * 100 : 0;
}
```

### Step 6: Add Navigation
- Tab or bottom nav to switch between Deal List and Dashboard
- At-risk deal cards should be clickable to navigate to deal detail

---

## UI Specifications

### At-Risk Section
```css
.at-risk-section {
  @apply bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg mb-6;
}

.at-risk-title {
  @apply text-red-800 font-bold text-lg mb-4 flex items-center gap-2;
}

.at-risk-card {
  @apply bg-white p-4 rounded-lg shadow-sm mb-3;
  @apply border border-red-200;
}

.at-risk-deal-name {
  @apply font-medium text-gray-900 flex items-center gap-2;
}

.at-risk-deal-value {
  @apply text-sm text-gray-500;
}

.at-risk-note-preview {
  @apply text-sm text-red-600 mt-2 italic;
  @apply line-clamp-2; /* Truncate long notes */
}
```

### Summary Cards
```css
.summary-grid {
  @apply grid grid-cols-2 gap-4 mb-6;
}

.summary-card {
  @apply bg-white p-4 rounded-lg shadow-sm text-center;
}

.summary-label {
  @apply text-xs text-gray-500 uppercase tracking-wide;
}

.summary-value {
  @apply text-2xl font-bold text-gray-900;
}
```

### Loss Reasons Bars
```css
.reason-row {
  @apply flex items-center gap-3 mb-3;
}

.reason-label {
  @apply w-24 text-sm text-gray-600;
}

.reason-bar-container {
  @apply flex-1 h-6 bg-gray-200 rounded-full overflow-hidden;
}

.reason-bar {
  @apply h-full bg-red-500 rounded-full transition-all duration-300;
}

.reason-stats {
  @apply text-sm text-gray-500 w-32 text-right;
}
```

### Win/Loss Section
```css
.win-loss-section {
  @apply text-center text-sm text-gray-500 py-4 border-t;
}

.win-rate {
  @apply font-semibold text-gray-700;
}
```

---

## Component State

```typescript
interface DashboardState {
  atRiskDeals: Array<Deal & { latestNote: Note }>;
  lossStats: {
    totalLost: number;
    totalValue: number;
    byReason: Record<string, { count: number; value: number }>;
  };
  winLossRatio: {
    won: number;
    lost: number;
    winRate: number;
  };
  loading: boolean;
}
```

---

## Acceptance Criteria

- [ ] Dashboard displays at-risk deals prominently at the top
- [ ] At-risk deals show deal name, value, and negative note preview
- [ ] At-risk section has red styling to draw attention
- [ ] Loss summary shows total deals lost and total value
- [ ] Loss reasons breakdown shows all 5 categories
- [ ] Each reason shows count and value
- [ ] Visual bars represent relative counts
- [ ] Win/loss ratio is displayed
- [ ] Data refreshes when returning to dashboard
- [ ] Dashboard is scrollable on mobile
- [ ] Empty states handled (no at-risk deals, no lost deals)

---

## AI Prompt for Claude

```
Create a [Svelte/React] dashboard component showing loss analytics and at-risk deals.

Data source: Dexie.js deals and notes tables

Display:
1. **At-Risk Deals** (TOP PRIORITY - show first)
   - List deals where latest note has negative sentiment
   - Show deal name, value, and the negative note preview
   - Red styling to draw attention

2. **Loss Summary**
   - Total deals lost (count)
   - Total value lost (sum, formatted as currency)

3. **Loss Reasons Breakdown**
   - Price: X deals ($Y value)
   - Timing: X deals ($Y value)
   - Competitor: X deals ($Y value)
   - Bad Fit: X deals ($Y value)
   - Other: X deals ($Y value)
   - Use simple CSS bars for visualization

4. Win/Loss ratio (small text, de-emphasized)

Use Tailwind CSS. No charting library - CSS bars are fine.
```

---

## Empty States

```typescript
// No at-risk deals
{atRiskDeals.length === 0 && (
  <div class="text-center text-green-600 py-8">
    <span class="text-4xl">✅</span>
    <p class="mt-2">No at-risk deals!</p>
  </div>
)}

// No lost deals yet
{lossStats.totalLost === 0 && (
  <div class="text-center text-gray-500 py-8">
    <p>No loss data yet.</p>
  </div>
)}
```

---

## Navigation Implementation

Simple tab navigation between views:

```svelte
<script>
  let activeTab = 'deals'; // 'deals' | 'dashboard'
</script>

<nav class="fixed bottom-0 left-0 right-0 bg-white border-t">
  <div class="flex">
    <button
      class:active={activeTab === 'deals'}
      on:click={() => activeTab = 'deals'}
    >
      Deals
    </button>
    <button
      class:active={activeTab === 'dashboard'}
      on:click={() => activeTab = 'dashboard'}
    >
      Dashboard
    </button>
  </div>
</nav>
```
