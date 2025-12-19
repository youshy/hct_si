# Task: Loss Reason Modal

## Overview
Create a quick-select modal for capturing why a deal was lost. The focus is on speed - one tap to select a reason and mark the deal as lost.

## Required Outcome
A modal with 5 large, tappable buttons for loss reasons. Selecting one immediately marks the deal as lost and closes the modal.

## Prerequisites
- IndexedDB setup complete (Task 01)
- Deal List component complete (Task 02)
- `updateDeal()` function available

## Time Estimate
Hour 4-5 of the hackathon (30-45 minutes)

---

## Step-by-Step Implementation

### Step 1: Design the Modal Layout

```
+------------------------------------------+
|       Why did you lose this deal?        |
+------------------------------------------+
|                                          |
|    +-------------+    +-------------+    |
|    |             |    |             |    |
|    |    Price    |    |   Timing    |    |
|    |             |    |             |    |
|    +-------------+    +-------------+    |
|                                          |
|    +-------------+    +-------------+    |
|    |             |    |             |    |
|    |  Competitor |    |   Bad Fit   |    |
|    |             |    |             |    |
|    +-------------+    +-------------+    |
|                                          |
|    +-----------------------------+       |
|    |           Other             |       |
|    +-----------------------------+       |
|                                          |
+------------------------------------------+
```

### Step 2: Define Loss Reasons

```typescript
const LOSS_REASONS = [
  { id: 'price', label: 'Price', icon: '💰' },
  { id: 'timing', label: 'Timing', icon: '⏰' },
  { id: 'competitor', label: 'Competitor', icon: '🏃' },
  { id: 'fit', label: 'Bad Fit', icon: '🎯' },
  { id: 'other', label: 'Other', icon: '❓' }
] as const;

type LossReason = typeof LOSS_REASONS[number]['id'];
```

### Step 3: Create the Modal Component

**Props:**
```typescript
interface LossReasonModalProps {
  dealId: string;
  dealName: string;
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void; // Called after deal is marked lost
}
```

### Step 4: Implement Selection Handler

```typescript
async function handleSelectReason(reason: LossReason) {
  await updateDeal(dealId, {
    status: 'lost',
    loss_reason: reason
  });

  onComplete(); // Trigger list refresh
  onClose();    // Close modal
}
```

### Step 5: Style for Mobile Touch

Large buttons (minimum 48x48px, preferably larger) with clear visual feedback.

---

## UI Specifications

### Modal Container
```css
.loss-modal-overlay {
  @apply fixed inset-0 bg-black bg-opacity-50;
  @apply flex items-end justify-center; /* Slide up from bottom */
  @apply z-50;
}

.loss-modal-content {
  @apply bg-white rounded-t-2xl w-full max-w-md;
  @apply p-6 pb-8;
  @apply animate-slide-up; /* Optional animation */
}
```

### Modal Header
```css
.loss-modal-title {
  @apply text-lg font-semibold text-gray-900 text-center mb-6;
}
```

### Reason Buttons Grid
```css
.reasons-grid {
  @apply grid grid-cols-2 gap-4;
}

.reason-button {
  @apply flex flex-col items-center justify-center;
  @apply h-24 rounded-xl;
  @apply bg-gray-100 hover:bg-gray-200;
  @apply active:bg-gray-300 active:scale-95;
  @apply transition-all duration-150;
  @apply text-gray-700 font-medium;
}

.reason-button-full {
  @apply col-span-2; /* For "Other" button */
  @apply h-16;
}

.reason-icon {
  @apply text-2xl mb-2;
}

.reason-label {
  @apply text-sm font-medium;
}
```

### Safe Area (for mobile notches)
```css
.loss-modal-content {
  padding-bottom: max(2rem, env(safe-area-inset-bottom));
}
```

---

## Component Implementation Example

```svelte
<!-- Svelte example -->
<script>
  import { updateDeal } from '$lib/db';

  export let dealId;
  export let dealName;
  export let isOpen;
  export let onClose;
  export let onComplete;

  const reasons = [
    { id: 'price', label: 'Price' },
    { id: 'timing', label: 'Timing' },
    { id: 'competitor', label: 'Competitor' },
    { id: 'fit', label: 'Bad Fit' },
    { id: 'other', label: 'Other' }
  ];

  async function selectReason(reason) {
    await updateDeal(dealId, {
      status: 'lost',
      loss_reason: reason
    });
    onComplete();
    onClose();
  }
</script>

{#if isOpen}
  <div class="loss-modal-overlay" on:click={onClose}>
    <div class="loss-modal-content" on:click|stopPropagation>
      <h2 class="loss-modal-title">Why did you lose this deal?</h2>

      <div class="reasons-grid">
        {#each reasons.slice(0, 4) as reason}
          <button
            class="reason-button"
            on:click={() => selectReason(reason.id)}
          >
            {reason.label}
          </button>
        {/each}

        <button
          class="reason-button reason-button-full"
          on:click={() => selectReason('other')}
        >
          Other
        </button>
      </div>
    </div>
  </div>
{/if}
```

---

## Acceptance Criteria

- [ ] Modal appears when "Mark Lost" is selected from deal action menu
- [ ] Shows 5 loss reason options in a grid layout
- [ ] Buttons are large enough for easy mobile tapping (min 48px)
- [ ] Tapping a reason immediately updates the deal
- [ ] Deal status changes to 'lost' with selected loss_reason
- [ ] Modal closes after selection
- [ ] Deal list refreshes to show updated status
- [ ] Modal can be dismissed by tapping backdrop
- [ ] Works correctly on mobile devices

---

## AI Prompt for Claude

```
Create a [Svelte/React] modal component for capturing loss reasons.

Requirements:
- Shows when user clicks "Mark Lost" on a deal
- 5 quick-select buttons in a grid: Price, Timing, Competitor, Bad Fit, Other
- Tapping a reason immediately closes modal and updates deal
- Large buttons (easy to tap on mobile)
- Call updateDeal(id, { status: 'lost', loss_reason: selected }) on selection
- Tailwind CSS, mobile-first

No free-text field for now. Keep it to one tap.
```

---

## Integration with Deal List

In the Deal List component, add this to the action menu handler:

```typescript
function handleMarkLost(deal: Deal) {
  setSelectedDealForLoss(deal);
  setShowLossModal(true);
}

function handleLossComplete() {
  // Refresh deals list
  loadDeals();
}
```

---

## Loss Reason Values (Match Backend Schema)

Ensure these values match the database constraint:

```sql
CHECK (loss_reason IN ('price', 'timing', 'competitor', 'fit', 'other'))
```

| UI Label | Database Value |
|----------|---------------|
| Price | `price` |
| Timing | `timing` |
| Competitor | `competitor` |
| Bad Fit | `fit` |
| Other | `other` |
