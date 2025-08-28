# Quotation Conversion to Booking Fix

## Issue Description

When clicking the "Convert to Booking" button in the quotation workflow, the system fails with the following error:

```
Error creating booking for service 1: {
  code: '23503',
  details: 'Key (customer_id)=(7160ac55-519c-4d10-a99a-a657d6179ba9) is not present in table "users".',
  hint: null,
  message: 'insert or update on table "bookings" violates foreign key constraint "bookings_customer_id_fkey"'
}
```

## Root Cause

The issue is caused by a **misconfigured foreign key constraint** in the database:

1. **Current Constraint**: `bookings.customer_id` references `auth.users(id)` (Supabase's built-in auth table)
2. **Expected Constraint**: `bookings.customer_id` should reference `customers(id)` (our custom customers table)
3. **Data Mismatch**: Quotations have `customer_id` values that exist in the `customers` table, not in `auth.users`

## Database Schema Analysis

### Current Foreign Key Constraints on Bookings Table:
```sql
bookings_customer_id_fkey: FOREIGN KEY (customer_id) REFERENCES auth.users(id) ON DELETE SET NULL
bookings_driver_id_fkey: FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE SET NULL
bookings_updated_by_fkey: FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON UPDATE SET NULL ON DELETE SET NULL
bookings_vehicle_id_fkey: FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL
```

### Tables Involved:
- **`quotations`**: Contains `customer_id` referencing `customers.id`
- **`customers`**: Contains customer information (name, email, phone, etc.)
- **`bookings`**: Should reference `customers.id` for `customer_id`

## Solution

### 1. Fix Database Foreign Key Constraint

Run the following SQL in your Supabase SQL Editor:

```sql
-- Fix the foreign key constraint on bookings.customer_id to reference customers table instead of auth.users
-- This migration fixes the issue where quotations can't be converted to bookings due to wrong foreign key reference

-- Drop the existing foreign key constraint
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_customer_id_fkey;

-- Add the correct foreign key constraint to reference the customers table
ALTER TABLE bookings ADD CONSTRAINT bookings_customer_id_fkey 
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL;

-- Add a comment to document the change
COMMENT ON CONSTRAINT bookings_customer_id_fkey ON bookings IS 'References customers table instead of auth.users for proper quotation conversion';
```

### 2. API Code Updates

The API endpoint (`/api/quotations/convert`) has been updated to properly set the `customer_id` when creating bookings:

```typescript
// Before (missing customer_id)
.insert({
  wp_id: `QUO-${baseQuotationNumber}-${i + 1}`,
  customer_name: quotation.customer_name,
  customer_email: quotation.customer_email,
  // ... other fields
})

// After (with customer_id)
.insert({
  wp_id: `QUO-${baseQuotationNumber}-${i + 1}`,
  customer_id: quotation.customer_id, // Add the customer_id from quotation
  customer_name: quotation.customer_name,
  customer_email: quotation.customer_email,
  // ... other fields
})
```

## Verification Steps

### 1. Check Current Constraint
```sql
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'bookings'::regclass 
    AND contype = 'f'
    AND conname = 'bookings_customer_id_fkey';
```

### 2. Verify Customer Data
```sql
-- Check if the problematic customer_id exists in customers table
SELECT id, name, email FROM customers WHERE id = '7160ac55-519c-4d10-a99a-a657d6179ba9';

-- Check if it exists in auth.users (it shouldn't)
SELECT id, email FROM auth.users WHERE id = '7160ac55-519c-4d10-a99a-a657d6179ba9';
```

### 3. Test Quotation Conversion
After applying the fix:
1. Go to a quotation with status "paid"
2. Click "Convert to Booking"
3. Verify that the conversion succeeds
4. Check that the booking is created with the correct `customer_id`

## Files Modified

1. **`app/api/quotations/convert/route.ts`** - Added `customer_id` to booking creation
2. **`database/migrations/20250128_fix_bookings_customer_id_fkey.sql`** - Database migration file
3. **`app/api/admin/fix-database/route.ts`** - Temporary admin endpoint for migration SQL
4. **`docs/QUOTATION_CONVERSION_FIX.md`** - This documentation

## Cleanup

After successfully applying the database fix:

1. **Delete the temporary admin endpoint**: `app/api/admin/fix-database/route.ts`
2. **Delete the migration file**: `database/migrations/20250128_fix_bookings_customer_id_fkey.sql`
3. **Remove this documentation** if no longer needed

## Prevention

To prevent similar issues in the future:

1. **Always verify foreign key constraints** when creating new tables
2. **Use consistent naming conventions** for foreign key references
3. **Test database operations** with real data before deploying
4. **Document database schema changes** in migration files
5. **Review foreign key relationships** when modifying table structures

## Related Issues

This fix resolves the immediate problem with quotation conversion. However, there may be other parts of the system that expect `bookings.customer_id` to reference `auth.users`. 

**Important**: Review the codebase for any other references to ensure this change doesn't break existing functionality.
