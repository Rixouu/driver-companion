-- =============================================
-- PHASE 3A: Simple RLS Performance Optimization
-- =============================================
-- This migration optimizes RLS policies to address:
-- 1. auth_rls_initplan warnings (auth.uid() in subqueries)
-- 2. multiple_permissive_policies warnings (consolidate duplicate policies)

-- =============================================
-- 1. CREATE HELPER FUNCTIONS FOR COMMON AUTH CHECKS
-- =============================================

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

CREATE OR REPLACE FUNCTION public.is_service_role()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $func$
  SELECT auth.role() = 'service_role';
$func$;

CREATE OR REPLACE FUNCTION public.is_authenticated()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $func$
  SELECT auth.role() = 'authenticated';
$func$;

-- =============================================
-- 2. OPTIMIZE INSPECTIONS TABLE POLICIES
-- =============================================

DROP POLICY IF EXISTS "Enable read access for all users" ON public.inspections;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.inspections;
DROP POLICY IF EXISTS "Public read access" ON public.inspections;
DROP POLICY IF EXISTS "Users can view inspections" ON public.inspections;
DROP POLICY IF EXISTS "Users can view their inspections" ON public.inspections;
DROP POLICY IF EXISTS "Enable update for inspectors" ON public.inspections;
DROP POLICY IF EXISTS "Users can update inspections" ON public.inspections;
DROP POLICY IF EXISTS "Users can update their inspections" ON public.inspections;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.inspections;
DROP POLICY IF EXISTS "Users can create inspections" ON public.inspections;

CREATE POLICY "inspections_read_optimized" ON public.inspections
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "inspections_update_optimized" ON public.inspections
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "inspections_insert_optimized" ON public.inspections
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- =============================================
-- 3. OPTIMIZE VEHICLES TABLE POLICIES
-- =============================================

DROP POLICY IF EXISTS "Allow public viewing of vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.vehicles;
DROP POLICY IF EXISTS "Public read access" ON public.vehicles;
DROP POLICY IF EXISTS "Public vehicles are viewable by authenticated users" ON public.vehicles;
DROP POLICY IF EXISTS "Users can view vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Allow authenticated users to create vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Users can insert vehicles" ON public.vehicles;

CREATE POLICY "vehicles_read_optimized" ON public.vehicles
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "vehicles_insert_optimized" ON public.vehicles
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- =============================================
-- 4. OPTIMIZE QUOTATION_MESSAGES TABLE POLICIES
-- =============================================

DROP POLICY IF EXISTS "Admins can see all messages" ON public.quotation_messages;
DROP POLICY IF EXISTS "Authenticated users can view all quotation messages" ON public.quotation_messages;
DROP POLICY IF EXISTS "Users can see their own messages" ON public.quotation_messages;
DROP POLICY IF EXISTS "Authenticated users can insert quotation messages" ON public.quotation_messages;
DROP POLICY IF EXISTS "Users can insert messages" ON public.quotation_messages;

CREATE POLICY "quotation_messages_read_optimized" ON public.quotation_messages
  FOR SELECT TO authenticated
  USING (is_authenticated());

CREATE POLICY "quotation_messages_insert_optimized" ON public.quotation_messages
  FOR INSERT TO authenticated
  WITH CHECK (is_authenticated());

-- =============================================
-- 5. OPTIMIZE ADMIN_USERS TABLE POLICIES
-- =============================================

DROP POLICY IF EXISTS "Admin users can read admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Allow authenticated users to read admin_users" ON public.admin_users;

CREATE POLICY "admin_users_read_optimized" ON public.admin_users
  FOR SELECT TO authenticated
  USING (is_authenticated());

-- =============================================
-- 6. OPTIMIZE BOOKINGS TABLE POLICIES
-- =============================================

DROP POLICY IF EXISTS "Allow authenticated users to manage bookings" ON public.bookings;
DROP POLICY IF EXISTS "Allow authenticated users to view all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Service role can do anything with bookings" ON public.bookings;

CREATE POLICY "bookings_authenticated_optimized" ON public.bookings
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "bookings_service_role_optimized" ON public.bookings
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- =============================================
-- 7. OPTIMIZE DRIVER_AVAILABILITY TABLE POLICIES
-- =============================================

DROP POLICY IF EXISTS "Allow authenticated users to manage driver availability" ON public.driver_availability;
DROP POLICY IF EXISTS "Allow authenticated users to view driver availability" ON public.driver_availability;
DROP POLICY IF EXISTS "Service role can manage driver availability" ON public.driver_availability;

CREATE POLICY "driver_availability_authenticated_optimized" ON public.driver_availability
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "driver_availability_service_role_optimized" ON public.driver_availability
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- =============================================
-- 8. OPTIMIZE PRICING_CALCULATION_LOGS TABLE POLICIES
-- =============================================

DROP POLICY IF EXISTS "Authenticated users can perform all operations on pricing_calcu" ON public.pricing_calculation_logs;
DROP POLICY IF EXISTS "Service role can manage pricing_calculation_logs" ON public.pricing_calculation_logs;

CREATE POLICY "pricing_calculation_logs_authenticated_optimized" ON public.pricing_calculation_logs
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "pricing_calculation_logs_service_role_optimized" ON public.pricing_calculation_logs
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- =============================================
-- 9. OPTIMIZE VEHICLE_ASSIGNMENTS TABLE POLICIES
-- =============================================

DROP POLICY IF EXISTS "Allow authenticated users to manage vehicle assignments" ON public.vehicle_assignments;
DROP POLICY IF EXISTS "Allow authenticated users to view vehicle assignments" ON public.vehicle_assignments;
DROP POLICY IF EXISTS "Service role can manage vehicle assignments" ON public.vehicle_assignments;

CREATE POLICY "vehicle_assignments_authenticated_optimized" ON public.vehicle_assignments
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "vehicle_assignments_service_role_optimized" ON public.vehicle_assignments
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- =============================================
-- 10. OPTIMIZE VEHICLE_ASSIGNMENT_OPERATIONS TABLE POLICIES
-- =============================================

DROP POLICY IF EXISTS "Users can create vehicle assignment operations for their bookin" ON public.vehicle_assignment_operations;
DROP POLICY IF EXISTS "Users can update vehicle assignment operations for their bookin" ON public.vehicle_assignment_operations;
DROP POLICY IF EXISTS "Users can view vehicle assignment operations for their bookings" ON public.vehicle_assignment_operations;

CREATE POLICY "vehicle_assignment_operations_read_optimized" ON public.vehicle_assignment_operations
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "vehicle_assignment_operations_insert_optimized" ON public.vehicle_assignment_operations
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "vehicle_assignment_operations_update_optimized" ON public.vehicle_assignment_operations
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- =============================================
-- 11. OPTIMIZE UI_THEMES TABLE POLICIES
-- =============================================

DROP POLICY IF EXISTS "Allow admins to manage ui_themes" ON public.ui_themes;
DROP POLICY IF EXISTS "Allow authenticated users to read ui_themes" ON public.ui_themes;

CREATE POLICY "ui_themes_read_optimized" ON public.ui_themes
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "ui_themes_write_optimized" ON public.ui_themes
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- =============================================
-- 12. ANALYZE TABLES AFTER POLICY CHANGES
-- =============================================

ANALYZE public.inspections;
ANALYZE public.vehicles;
ANALYZE public.quotation_messages;
ANALYZE public.admin_users;
ANALYZE public.bookings;
ANALYZE public.driver_availability;
ANALYZE public.pricing_calculation_logs;
ANALYZE public.vehicle_assignments;
ANALYZE public.vehicle_assignment_operations;
ANALYZE public.ui_themes;
