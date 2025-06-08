# 🚨 URGENT: Database Constraint Fix Required

## Issue
The `dispatch_entries_status_check` constraint in the database still contains old status values and is missing new ones, causing errors when moving cards in the dispatch board.

## Current Constraint
```sql
CHECK ((status = ANY (ARRAY['pending'::text, 'assigned'::text, 'in_transit'::text, 'completed'::text, 'cancelled'::text])))
```

## Required Fix
**Run this SQL script immediately in your Supabase SQL editor:**

```sql
-- Drop the old constraint
ALTER TABLE dispatch_entries 
DROP CONSTRAINT IF EXISTS dispatch_entries_status_check;

-- Add the new constraint with all valid statuses
ALTER TABLE dispatch_entries 
ADD CONSTRAINT dispatch_entries_status_check 
CHECK (status IN (
  'pending', 
  'assigned', 
  'confirmed', 
  'en_route', 
  'arrived', 
  'in_progress', 
  'completed', 
  'cancelled'
));
```

## Verification
After running the fix, verify with:
```sql
SELECT conname, pg_get_constraintdef(oid) as definition 
FROM pg_constraint 
WHERE conname = 'dispatch_entries_status_check';
```

## Temporary Workaround
Until this is fixed, the dispatch board has been temporarily limited to only use these statuses:
- pending
- assigned  
- confirmed
- completed
- cancelled

## After Fix
Once the constraint is updated, you can restore the full dispatch board by uncommenting the disabled columns in `dispatch-board-view.tsx`.

**Priority: HIGH - This blocks drag & drop functionality in dispatch board** 