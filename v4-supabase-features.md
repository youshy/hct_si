# v4.0.0 - Features Requiring Supabase Changes

## Summary

These features require adding new columns to the Supabase `deals` table. All fields are optional/nullable to maintain backwards compatibility and keep input fast for salespeople.

---

## Feature 1: Archive Deals

**Purpose:** Soft-delete deals instead of permanent deletion

**Supabase Change:**
```sql
ALTER TABLE deals ADD COLUMN archived BOOLEAN DEFAULT FALSE;
```

**Behavior:**
- Archive button in ActionMenu/DealDetail
- Archived deals hidden from main list by default
- "Show Archived" toggle to view them
- Can restore archived deals
- Archived deals excluded from dashboard stats

**Effort:** Small

---

## Feature 2: Expected Close Date

**Purpose:** Track when deals are expected to close, show overdue indicators

**Supabase Change:**
```sql
ALTER TABLE deals ADD COLUMN expected_close_date TIMESTAMP NULL;
```

**Behavior:**
- Optional date picker in Add/Edit Deal modals
- Shows on deal card: "Closes in 3 days" / "Overdue by 2 days"
- Color coding: green (>7 days), yellow (1-7 days), red (overdue)
- Dashboard section: "Closing This Week"
- Can sort deals by close date

**Effort:** Medium

---

## Feature 3: Customer Name

**Purpose:** Associate deals with a contact/company name

**Supabase Change:**
```sql
ALTER TABLE deals ADD COLUMN customer_name TEXT NULL;
```

**Behavior:**
- Optional "Customer" field in Add/Edit Deal modals
- Shows on deal card below deal name (smaller, gray text)
- Shows on Deal Detail page
- Searchable in future

**Effort:** Small

---

## Feature 4: Pipeline Stages

**Purpose:** 5-stage pipeline with visual progression

**Supabase Change:**
```sql
ALTER TABLE deals ADD COLUMN stage TEXT DEFAULT 'prospect';
-- Valid values: prospect, qualified, proposal, negotiation, closing
```

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
- Stage selector in DealDetail page
- Stage shown on deal card
- Dashboard breakdown by stage (chart + stats)
- Can move forward/backward through stages
- From any stage, can mark as Won or Lost

**Effort:** Large

---

## Combined Supabase Migration

```sql
-- v4 Migration
ALTER TABLE deals
  ADD COLUMN archived BOOLEAN DEFAULT FALSE,
  ADD COLUMN expected_close_date TIMESTAMP NULL,
  ADD COLUMN customer_name TEXT NULL,
  ADD COLUMN stage TEXT DEFAULT 'prospect';

-- Optional: Add index for common queries
CREATE INDEX idx_deals_archived ON deals(archived);
CREATE INDEX idx_deals_stage ON deals(stage);
CREATE INDEX idx_deals_expected_close ON deals(expected_close_date);
```

---

## IndexedDB Changes

```typescript
// types.ts - Updated Deal interface
interface Deal {
  id: string;
  name: string;
  value: number;
  status: 'open' | 'won' | 'lost';
  loss_reason: string | null;
  created_at: Date;
  updated_at: Date;
  synced: boolean;
  // NEW v4 FIELDS:
  archived: boolean;                              // Feature 1
  expected_close_date: Date | null;               // Feature 2
  customer_name: string | null;                   // Feature 3
  stage: 'prospect' | 'qualified' | 'proposal' | 'negotiation' | 'closing';  // Feature 4
}
```

```typescript
// database.ts - Bump version
const db = new Dexie('SalesIntelligenceDB');
db.version(3).stores({
  deals: 'id, status, created_at, updated_at, archived, stage, expected_close_date',
  notes: 'id, deal_id, created_at'
});
```

---

## Recommended Implementation Order

| Order | Feature | Effort | Dependencies |
|-------|---------|--------|--------------|
| 1 | Customer Name | Small | None |
| 2 | Expected Close Date | Medium | Date picker component |
| 3 | Archive Deals | Small | None |
| 4 | Pipeline Stages | Large | Stage components |

**Rationale:**
- Customer Name is smallest change, good warmup
- Expected Close Date adds value quickly
- Archive is simple but useful
- Pipeline Stages is biggest, do last

---

## Decision Points

Before implementing, decide:

1. **Pipeline Stages:** Do we want all 5 stages or fewer?
   - Option A: 5 stages (Prospect → Qualified → Proposal → Negotiation → Closing)
   - Option B: 3 stages (Lead → Proposal → Closing)
   - Option C: Skip stages for v4, do in v5

2. **Archive vs Delete:**
   - Option A: Archive only (soft delete)
   - Option B: Both archive and hard delete
   - Option C: Skip archive, just hide closed deals

3. **Close Date Features:**
   - Option A: Just the date field + overdue indicator
   - Option B: Add "Closing Soon" dashboard section
   - Option C: Add reminder notifications (needs more work)

4. **Which features for v4?**
   - All 4 features
   - Just 1-3 (Customer, Close Date, Archive)
   - Mix and match

---

## API Sync Changes Required

The sync endpoint needs to handle new fields:

```typescript
// api/sync.ts updates needed
interface SyncRequest {
  changes: {
    deals: Deal[];  // Now includes new fields
    notes: Note[];
  };
}
```

Both frontend and backend need to be updated together when deploying.
