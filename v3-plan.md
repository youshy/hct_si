# v3.0.0 Plan - "Deal Tracking Pro"

## Overview

This document outlines the implementation plan for v3 features. All changes are designed to be fast for salespeople - minimal required fields, quick actions.

---

## Feature 1: Swipe Actions

**Goal:** Quick deal status changes via swipe gestures on mobile

**Behavior:**
- Swipe RIGHT on deal card → Mark as WON (green indicator)
- Swipe LEFT on deal card → Opens Loss Reason modal (red indicator)
- Visual feedback during swipe (color gradient, icon reveal)
- Haptic feedback on action trigger
- Swipe threshold: 30% of card width to trigger

**Files to Modify:**
- `src/components/DealCard.tsx` - Add swipe detection and visual states
- `src/components/DealList.tsx` - Handle swipe callbacks

**New Files:**
- `src/hooks/useSwipeAction.ts` - Reusable swipe gesture hook

**Technical Approach:**
```
- Track touchstart, touchmove, touchend events
- Calculate swipe distance and direction
- Show action indicator (checkmark/X) as user swipes
- Trigger action when threshold met and touch ends
- Animate card back to position or off-screen
```

**UI States:**
```
Idle:        [  Deal Card  ]
Swipe Right: [✓ WON][Deal Card    ] (green bg reveals)
Swipe Left:  [    Deal Card][LOST ✗] (red bg reveals)
```

---

## Feature 2: Expected Close Date

**Goal:** Track when deals are expected to close, show overdue indicators

**Behavior:**
- Optional date field when creating/editing deals
- Shows on deal card if set
- Visual indicator: "Closes in 3 days" / "Overdue by 2 days"
- Color coding: green (>7 days), yellow (1-7 days), red (overdue)
- Dashboard: Show deals closing this week

**Data Model Changes:**
```typescript
// types.ts - Update Deal interface
interface Deal {
  // ... existing fields
  expected_close_date: Date | null;  // NEW
}
```

**Files to Modify:**
- `src/lib/db/types.ts` - Add expected_close_date field
- `src/lib/db/database.ts` - Update schema version, add index
- `src/lib/db/deals.ts` - Add getDealsClosingSoon() function
- `src/components/AddDealModal.tsx` - Add optional date picker
- `src/components/EditDealModal.tsx` - Add optional date picker
- `src/components/DealCard.tsx` - Show close date indicator
- `src/components/Dashboard.tsx` - Add "Closing Soon" section

**New Files:**
- `src/components/DatePicker.tsx` - Simple mobile-friendly date picker
- `src/lib/utils/dates.ts` - Date formatting helpers (daysUntil, isOverdue)

**UI on Deal Card:**
```
┌─────────────────────────────────┐
│ Acme Corp                    ●  │
│ $50,000                         │
│ 📅 Closes in 3 days         ▸   │  <- NEW line (yellow text)
└─────────────────────────────────┘
```

---

## Feature 3: Deal Detail Page

**Goal:** Full-screen view of a deal with all information and inline notes

**Behavior:**
- Tap deal card → Opens detail page (not modal)
- Shows all deal info at top
- Notes list below (same as NotesModal but inline)
- Action buttons at bottom (Edit, Mark Won, Mark Lost)
- Back button to return to list
- Can add notes directly on this page

**Navigation Change:**
- Currently: DealList → ActionMenu modal → NotesModal
- New: DealList → DealDetail page (with notes inline)

**Files to Modify:**
- `src/App.tsx` - Add routing/state for detail view
- `src/components/DealList.tsx` - Navigate to detail instead of showing ActionMenu
- `src/components/BottomNav.tsx` - Hide when on detail page

**New Files:**
- `src/components/DealDetail.tsx` - Main detail page component
- `src/components/DealHeader.tsx` - Top section with deal info
- `src/components/DealActions.tsx` - Bottom action bar

**Layout:**
```
┌─────────────────────────────────┐
│ ← Back                     Edit │  <- Header
├─────────────────────────────────┤
│                                 │
│  ACME Corporation               │  <- Deal name
│  Contact: John Smith            │  <- Customer (if set)
│                                 │
│  $50,000                        │  <- Value (large)
│                                 │
│  Stage: Proposal                │  <- Pipeline stage
│  Expected Close: Jan 15, 2025   │  <- Close date
│  ● Positive sentiment           │  <- Latest sentiment
│                                 │
├─────────────────────────────────┤
│  Notes (3)                      │  <- Notes section header
├─────────────────────────────────┤
│  📝 "Great call today..."       │
│     Positive · 2 hours ago      │
│  ─────────────────────────────  │
│  📝 "Waiting on budget..."      │
│     Neutral · Yesterday         │
│  ─────────────────────────────  │
│  📝 "Initial contact made"      │
│     Positive · 3 days ago       │
├─────────────────────────────────┤
│  [Add Note input area]          │  <- Sticky at bottom
├─────────────────────────────────┤
│  [Mark Won]  [Mark Lost]        │  <- Action buttons (if open)
└─────────────────────────────────┘
```

---

## Feature 4: Pipeline Donut Chart

**Goal:** Visual representation of pipeline by stage on Dashboard

**Behavior:**
- Donut chart showing deal count or value by stage
- Toggle between "By Count" and "By Value"
- Tap segment → Filter to that stage (future)
- Center shows total count/value
- Legend below chart

**Files to Modify:**
- `src/components/Dashboard.tsx` - Add chart section

**New Files:**
- `src/components/DonutChart.tsx` - SVG-based donut chart component
- `src/lib/db/deals.ts` - Add getDealsByStage() function

**Chart Design:**
```
        ┌─────────────┐
       ╱   ╲     ╱     ╲
      │  12  │ Prospect │
      │deals │ Qualified│
       ╲     ╱   ╲     ╱
        └─────────────┘

  ● Prospect (4)     ● Qualified (3)
  ● Proposal (2)     ● Negotiation (2)
  ● Closed Won (1)
```

**Color Scheme:**
```
Prospect:    #94A3B8 (gray)
Qualified:   #60A5FA (blue)
Proposal:    #A78BFA (purple)
Negotiation: #FBBF24 (yellow)
Won:         #34D399 (green)
Lost:        #F87171 (red)
```

**Technical Approach:**
- Pure SVG, no chart library needed
- Calculate arc paths from percentages
- Animate on load with CSS transitions
- Responsive sizing

---

## Feature 5: Customer Name (Optional)

**Goal:** Associate deals with a customer/contact name without requiring it

**Behavior:**
- Optional "Customer" field in Add/Edit Deal modals
- Shows on deal card if provided
- Searchable in future
- Placeholder: "Customer name (optional)"

**Data Model Changes:**
```typescript
// types.ts - Update Deal interface
interface Deal {
  // ... existing fields
  customer_name: string | null;  // NEW - optional
}
```

**Files to Modify:**
- `src/lib/db/types.ts` - Add customer_name field
- `src/lib/db/database.ts` - Update schema version
- `src/components/AddDealModal.tsx` - Add optional customer input
- `src/components/EditDealModal.tsx` - Add optional customer input
- `src/components/DealCard.tsx` - Show customer name if present
- `src/components/DealDetail.tsx` - Show customer name

**UI in Add Deal Modal:**
```
┌─────────────────────────────────┐
│ Add New Deal                    │
├─────────────────────────────────┤
│ Deal Name *                     │
│ [________________________]      │
│                                 │
│ Customer (optional)             │  <- NEW
│ [________________________]      │
│                                 │
│ Deal Value ($) *                │
│ [________________________]      │
│                                 │
│ Expected Close (optional)       │  <- From Feature 2
│ [________________________]      │
│                                 │
│ [Cancel]         [Add Deal]     │
└─────────────────────────────────┘
```

**UI on Deal Card:**
```
┌─────────────────────────────────┐
│ Acme Corp                    ●  │  <- Deal name
│ John Smith                      │  <- Customer (gray, smaller) NEW
│ $50,000                      ▸  │
└─────────────────────────────────┘
```

---

## Feature 6 (STRETCH): Pipeline Stages

**Goal:** 5-stage pipeline with progression toward Won or Lost

**Stages:**
```
1. Prospect     → Initial contact, qualifying
2. Qualified    → Budget/authority/need confirmed
3. Proposal     → Sent proposal/quote
4. Negotiation  → Discussing terms
5. Closing      → Final decision pending
   ↓
   Won ✓  OR  Lost ✗
```

**Behavior:**
- New deals start at "Prospect"
- Can move forward/backward through stages
- From any stage, can mark as Won or Lost
- Stage shown on deal card with visual indicator
- Dashboard shows breakdown by stage
- Detail page shows stage with progress bar

**Data Model Changes:**
```typescript
// types.ts - Update Deal interface
type DealStage = 'prospect' | 'qualified' | 'proposal' | 'negotiation' | 'closing';

interface Deal {
  // ... existing fields
  stage: DealStage;  // NEW - defaults to 'prospect'
  // status remains: 'open' | 'won' | 'lost'
}
```

**Files to Modify:**
- `src/lib/db/types.ts` - Add DealStage type, update Deal
- `src/lib/db/database.ts` - Update schema, add stage index
- `src/lib/db/deals.ts` - Add stage-related queries
- `src/components/AddDealModal.tsx` - Default to 'prospect' stage
- `src/components/DealCard.tsx` - Show stage indicator
- `src/components/DealDetail.tsx` - Show stage progress, change stage
- `src/components/ActionMenu.tsx` - Add "Change Stage" option
- `src/components/Dashboard.tsx` - Show stage breakdown

**New Files:**
- `src/components/StageSelector.tsx` - UI for selecting/changing stage
- `src/components/StageProgress.tsx` - Visual progress indicator
- `src/components/ChangeStageModal.tsx` - Modal for stage selection

**Stage Progress UI (Detail Page):**
```
┌─────────────────────────────────────────────┐
│  ●────●────●────○────○                      │
│  Pro  Qual Prop Nego Clos                   │
│       ↑ Current: Proposal                   │
└─────────────────────────────────────────────┘
```

**Stage Indicator on Deal Card:**
```
┌─────────────────────────────────┐
│ Acme Corp                    ●  │
│ John Smith · Proposal           │  <- Stage shown here
│ $50,000           Closes Jan 15 │
└─────────────────────────────────┘
```

**Stage Change Flow:**
```
From Deal Detail or ActionMenu:
  → Tap "Change Stage"
  → Modal shows all 5 stages
  → Current stage highlighted
  → Tap new stage to select
  → Confirm → Update deal
```

---

## Database Migration Summary

**New Fields on Deal:**
```typescript
interface Deal {
  id: string;
  name: string;
  value: number;
  status: 'open' | 'won' | 'lost';
  loss_reason: string | null;
  created_at: Date;
  updated_at: Date;
  synced: boolean;
  // NEW FIELDS:
  customer_name: string | null;      // Feature 5
  expected_close_date: Date | null;  // Feature 2
  stage: DealStage;                  // Feature 6 (stretch)
}
```

**IndexedDB Version Bump:**
- Current version: 2
- New version: 3
- Migration: Add new fields with null/default values

**Supabase Changes (for sync):**
- Add columns: customer_name, expected_close_date, stage
- All nullable or with defaults

---

## Implementation Order

Recommended sequence for development:

```
1. Customer Name (Feature 5)         ← Smallest change, updates data model
2. Expected Close Date (Feature 2)   ← Builds on modal changes
3. Deal Detail Page (Feature 3)      ← Big UX improvement, uses new fields
4. Swipe Actions (Feature 1)         ← Independent, enhances deal list
5. Pipeline Donut Chart (Feature 4)  ← Dashboard enhancement
6. Pipeline Stages (Feature 6)       ← Stretch, biggest change
```

---

## File Change Summary

### Modified Files (12):
- `src/lib/db/types.ts`
- `src/lib/db/database.ts`
- `src/lib/db/deals.ts`
- `src/components/AddDealModal.tsx`
- `src/components/EditDealModal.tsx`
- `src/components/DealCard.tsx`
- `src/components/DealList.tsx`
- `src/components/Dashboard.tsx`
- `src/components/ActionMenu.tsx`
- `src/components/BottomNav.tsx`
- `src/App.tsx`
- `api/` endpoints (for sync)

### New Files (10-12):
- `src/hooks/useSwipeAction.ts`
- `src/components/DatePicker.tsx`
- `src/components/DealDetail.tsx`
- `src/components/DealHeader.tsx`
- `src/components/DealActions.tsx`
- `src/components/DonutChart.tsx`
- `src/lib/utils/dates.ts`
- `src/components/StageSelector.tsx` (stretch)
- `src/components/StageProgress.tsx` (stretch)
- `src/components/ChangeStageModal.tsx` (stretch)

---

## Success Criteria

- [ ] Deals can be swiped to quickly mark won/lost
- [ ] Expected close date can be set (optional)
- [ ] Overdue deals show visual indicator
- [ ] Deal detail page shows all info + notes inline
- [ ] Dashboard has donut chart of pipeline
- [ ] Customer name can be added to deals (optional)
- [ ] (Stretch) Deals can progress through 5 stages
- [ ] All changes maintain offline-first functionality
- [ ] No required fields added (fast for salespeople)
