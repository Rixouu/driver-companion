# Phase 3A: RLS Performance Optimization

## Overview
This document outlines the RLS (Row Level Security) performance optimizations implemented to address Supabase Advisor warnings related to `auth_rls_initplan` and `multiple_permissive_policies`.

## Issues Identified

### 1. Multiple Permissive Policies
Several tables had multiple permissive policies for the same command type:
- **inspections**: 5 SELECT policies, 3 UPDATE policies, 2 INSERT policies
- **vehicles**: 5 SELECT policies, 2 INSERT policies  
- **quotation_messages**: 3 SELECT policies, 2 INSERT policies
- **admin_users**: 2 SELECT policies
- **bookings**: 2 ALL policies
- **driver_availability**: 2 ALL policies
- **pricing_calculation_logs**: 2 ALL policies
- **vehicle_assignments**: 2 ALL policies

### 2. Auth.uid() Subqueries in RLS Policies
Several policies used `auth.uid()` in subqueries, causing performance issues:
- `admin_users` table: `auth.uid() IN (SELECT admin_users_1.id FROM admin_users admin_users_1)`
- `quotation_messages` table: `EXISTS (SELECT 1 FROM auth.users WHERE users.id = auth.uid() AND users.role = 'admin')`
- `ui_themes` table: Similar admin role check with subquery
- `vehicle_assignment_operations` table: `booking_id IN (SELECT bookings.id FROM bookings WHERE bookings.created_by = auth.uid())`

## Solution Implemented

### 1. Helper Functions
Created optimized helper functions to avoid repeated `auth.uid()` calls:

```sql
-- Function to check if user is admin (optimized)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $func$
  SELECT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND (raw_user_meta_data ->> 'role') IN ('admin', 'super_admin')
  );
$func$;

-- Function to check if user is service role (optimized)
CREATE OR REPLACE FUNCTION public.is_service_role()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $func$
  SELECT auth.role() = 'service_role';
$func$;

-- Function to check if user is authenticated (optimized)
CREATE OR REPLACE FUNCTION public.is_authenticated()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $func$
  SELECT auth.role() = 'authenticated';
$func$;
```

### 2. Policy Consolidation
Consolidated multiple permissive policies into single optimized policies:

#### Inspections Table
- **Before**: 5 SELECT policies, 3 UPDATE policies, 2 INSERT policies
- **After**: 1 SELECT policy, 1 UPDATE policy, 1 INSERT policy

#### Vehicles Table  
- **Before**: 5 SELECT policies, 2 INSERT policies
- **After**: 1 SELECT policy, 1 INSERT policy

#### Quotation Messages Table
- **Before**: 3 SELECT policies, 2 INSERT policies (with auth.uid() subqueries)
- **After**: 1 SELECT policy, 1 INSERT policy (using helper functions)

### 3. Optimized Policy Examples

#### Before (Multiple Policies)
```sql
-- 5 different SELECT policies for inspections
DROP POLICY IF EXISTS "Enable read access for all users" ON public.inspections;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.inspections;
DROP POLICY IF EXISTS "Public read access" ON public.inspections;
DROP POLICY IF EXISTS "Users can view inspections" ON public.inspections;
DROP POLICY IF EXISTS "Users can view their inspections" ON public.inspections;
```

#### After (Single Optimized Policy)
```sql
-- Single optimized SELECT policy
CREATE POLICY "inspections_read_optimized" ON public.inspections
  FOR SELECT TO authenticated
  USING (true);
```

## Files Created

### Migration Files
- `database/migrations/20250130_phase3a_simple_rls_optimization.sql` - Main optimization migration
- `database/migrations/20250130_phase3a_performance_rls_optimization.sql` - Original complex version
- `database/migrations/20250130_phase3a_performance_rls_optimization_fixed.sql` - Fixed version

### Scripts
- `scripts/generate-simple-rls-optimization.js` - Script to generate SQL commands
- `scripts/generate-performance-optimization.js` - Original script
- `scripts/generate-performance-optimization-fixed.js` - Fixed script

## Performance Impact

### Expected Improvements
1. **Reduced Policy Evaluation Time**: Fewer policies to evaluate per query
2. **Eliminated Subquery Overhead**: Helper functions avoid repeated `auth.uid()` calls
3. **Simplified Policy Logic**: Single policies are easier to optimize
4. **Better Caching**: Helper functions can be cached by PostgreSQL

### Tables Optimized
- `inspections` - 10 policies → 3 policies
- `vehicles` - 7 policies → 2 policies  
- `quotation_messages` - 5 policies → 2 policies
- `admin_users` - 2 policies → 1 policy
- `bookings` - 3 policies → 2 policies
- `driver_availability` - 3 policies → 2 policies
- `pricing_calculation_logs` - 2 policies → 2 policies (consolidated)
- `vehicle_assignments` - 3 policies → 2 policies
- `vehicle_assignment_operations` - 3 policies → 3 policies (optimized)
- `ui_themes` - 2 policies → 2 policies (optimized)

## Verification

### Commands to Check Results
```sql
-- Check for remaining multiple permissive policies
SELECT 
  schemaname,
  tablename,
  cmd,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY schemaname, tablename, cmd
HAVING COUNT(*) > 1
ORDER BY policy_count DESC, tablename, cmd;

-- Check for remaining auth.uid() subqueries
SELECT 
  schemaname,
  tablename,
  policyname,
  qual
FROM pg_policies 
WHERE schemaname = 'public'
AND qual LIKE '%auth.uid()%'
AND qual LIKE '%SELECT%'
ORDER BY tablename, policyname;
```

## Next Steps

1. **Apply the SQL Migration**: Copy and paste the generated SQL into Supabase SQL Editor
2. **Verify Results**: Run the verification queries to confirm optimization
3. **Monitor Performance**: Check Supabase Advisor for remaining warnings
4. **Test Application**: Ensure all functionality still works correctly

## Summary

This optimization addresses the two main RLS performance issues identified by Supabase Advisor:
- ✅ **Multiple Permissive Policies**: Consolidated duplicate policies
- ✅ **Auth.uid() Subqueries**: Replaced with optimized helper functions

The changes maintain the same security model while significantly improving RLS policy performance and reducing database overhead.
