# Task: Full Flow Testing & Bug Bash

## Overview
Test the complete user flow from deal creation to dashboard analytics. Find and fix bugs before the demo. This is the final quality check before presenting.

## Required Outcome
- All critical paths work end-to-end
- No show-stopper bugs
- App works on mobile browsers
- Demo script verified and ready

## Prerequisites
- All frontend components complete
- All backend endpoints deployed
- Integration complete (sync + sentiment)

## Time Estimate
Hour 7-8 of the hackathon (Bug Bash phase)

---

## Test Scenarios

### Scenario 1: Deal Creation
**Steps:**
1. Open app on phone/browser
2. Tap FAB (floating action button)
3. Enter: Name = "Acme Corp", Value = 50000
4. Tap "Create"

**Expected:**
- [ ] Modal closes
- [ ] New deal appears in list
- [ ] Deal shows name, value ($50,000), "Open" badge
- [ ] No sentiment dot (no notes yet)

**Time Target:** < 10 seconds

---

### Scenario 2: Add Positive Note
**Steps:**
1. Tap on a deal
2. Select "Add Note"
3. Enter: "Great initial call, they love the product!"
4. Tap "Add Note" / Submit

**Expected:**
- [ ] "Analyzing..." appears briefly
- [ ] Note appears in list with timestamp
- [ ] **Green dot** appears next to note
- [ ] Deal list updates to show green dot

---

### Scenario 3: Add Negative Note (At-Risk)
**Steps:**
1. On same deal, add another note
2. Enter: "Budget got cut, they're hesitant about moving forward"
3. Submit

**Expected:**
- [ ] Note appears with **red dot**
- [ ] Deal now shows red dot (latest note is negative)
- [ ] Deal is flagged as **AT RISK**

---

### Scenario 4: Mark Deal as Lost
**Steps:**
1. Tap on a different deal
2. Select "Mark Lost"
3. Tap "Price"

**Expected:**
- [ ] Modal closes
- [ ] Deal status changes to "Lost" badge
- [ ] Deal appears in loss analytics

---

### Scenario 5: View Dashboard
**Steps:**
1. Navigate to Dashboard tab
2. Review all sections

**Expected:**
- [ ] **At-Risk Deals** section shows deals with negative sentiment
- [ ] At-risk cards show deal name, value, and note preview
- [ ] **Loss Summary** shows count and total value
- [ ] **Loss Reasons** breakdown shows each category
- [ ] Bars visually represent relative counts
- [ ] Win/Loss ratio displayed

---

### Scenario 6: Offline Functionality
**Steps:**
1. Turn on airplane mode
2. Create a new deal
3. Add a note

**Expected:**
- [ ] Deal is created locally
- [ ] Note is saved locally (maybe without sentiment)
- [ ] App doesn't crash

**Steps (continued):**
4. Turn off airplane mode
5. Wait 30 seconds (or trigger sync manually)

**Expected:**
- [ ] Data syncs to server
- [ ] Console shows sync activity

---

### Scenario 7: Multi-Device Sync
**Steps:**
1. On Device A: Create a deal
2. Wait for sync
3. On Device B: Refresh app

**Expected:**
- [ ] Deal appears on Device B
- [ ] All notes and sentiment data synced

---

## Bug Priority Levels

### P0 - Show Stoppers (Fix Immediately)
- App crashes on load
- Cannot create deals
- Cannot add notes
- Sentiment always fails
- Data disappears

### P1 - Major (Fix if Time)
- Sync not working
- Dashboard calculations wrong
- Loss flow broken
- Mobile layout broken

### P2 - Minor (Document for Later)
- Visual glitches
- Slow performance
- Edge case errors
- Minor styling issues

---

## Bug Report Template

```markdown
## Bug: [Title]

**Priority:** P0 / P1 / P2
**Reporter:** [Name]
**Device:** [iPhone 14 / Chrome Desktop / etc.]

### Steps to Reproduce
1. ...
2. ...
3. ...

### Expected Result
...

### Actual Result
...

### Screenshot
[attach if relevant]

### Console Errors
[paste any errors]
```

---

## Quick Fixes for Common Issues

### Deal not appearing after create
```typescript
// Make sure to refresh the list after adding
const deal = await addDeal(name, value);
await loadDeals(); // Re-fetch deals
```

### Sentiment always neutral
```typescript
// Check API URL
console.log('API URL:', API_URL);
// Check sentiment response
const result = await analyzeSentiment(text);
console.log('Sentiment result:', result);
```

### Sync failing
```typescript
// Check last sync time
console.log('Last sync:', localStorage.getItem('lastSyncTime'));
// Check unsynced items
console.log('Unsynced deals:', await getUnsyncedDeals());
```

### Dashboard showing wrong counts
```typescript
// Debug loss stats
const stats = await getLossStats();
console.log('Loss stats:', stats);
```

---

## Mobile Testing Checklist

### iOS Safari
- [ ] App loads without errors
- [ ] Touch targets are large enough (48px+)
- [ ] Modals don't get hidden by keyboard
- [ ] Scrolling is smooth
- [ ] FAB is visible and tappable

### Android Chrome
- [ ] Same as iOS checklist
- [ ] Back button doesn't break app

### Common Mobile Issues
- **Keyboard pushes content up:** Add padding to bottom
- **Touch targets too small:** Increase button size
- **Text too small:** Use min 16px font
- **Modal hidden by notch:** Use safe-area-inset

---

## Demo Script Verification

Run through the exact demo script:

### 1. Problem Statement (30 sec)
"Salespeople don't log why deals are lost. And they don't notice when deals are going south until it's too late."

### 2. Create Deal (10 sec)
- [ ] Open app on phone
- [ ] Tap FAB → "Acme Corp $50k" → Create
- [ ] Verify: Deal appears immediately

### 3. Add Positive Note (15 sec)
- [ ] Add note: "Great initial call, they love the product"
- [ ] Verify: **Green dot** appears

### 4. Add Negative Note (15 sec)
- [ ] Add note: "Budget got cut, they're hesitant"
- [ ] Verify: **Red dot** appears

### 5. Show Dashboard (20 sec)
- [ ] Navigate to Dashboard
- [ ] Verify: "Acme is now flagged as AT RISK"

### 6. Mark Deal Lost (10 sec)
- [ ] On another deal, tap "Mark Lost"
- [ ] Tap "Competitor"
- [ ] Verify: Status changes to Lost

### 7. Loss Analytics (20 sec)
- [ ] Show loss reasons breakdown
- [ ] Point out: "Price and Competitor are our top loss reasons"

### 8. Closing (10 sec)
"8 hours to build. Imagine the patterns we'll find at scale."

---

## Pre-Demo Checklist

- [ ] App is deployed and live
- [ ] Test data created (at least 5 deals with various states)
- [ ] One at-risk deal ready to show
- [ ] Loss dashboard has data
- [ ] Demo device charged and connected
- [ ] Browser in incognito (fresh state if needed)
- [ ] Screen sharing tested
- [ ] Backup plan if live demo fails (screenshots/video)

---

## Emergency Fallback Plan

### If API is down
- Demo with local data only
- Pre-populate IndexedDB with test data
- Say "Sync is in development"

### If sentiment fails
- Have pre-analyzed notes already in DB
- Or use mock sentiment (always positive for demo)

### If app crashes
- Have screenshots ready
- Have video recording as backup
- Explain architecture from diagrams

---

## Team Bug Bash Assignments

### Tester 1 (Frontend Focus)
- Test all UI interactions
- Check mobile responsiveness
- Verify all modals work

### Tester 2 (Backend Focus)
- Check API responses in network tab
- Verify data in Supabase dashboard
- Test sync with multiple devices

### Tester 3 (Integration Focus)
- Test full user flows
- Try to break the app
- Check edge cases

---

## Sign-Off Checklist

- [ ] All P0 bugs fixed
- [ ] Demo script works end-to-end
- [ ] App works on demo device
- [ ] Team has seen the app working
- [ ] Screenshots captured for presentation
- [ ] Production URL is stable

**Ready for Demo!** 🚀
