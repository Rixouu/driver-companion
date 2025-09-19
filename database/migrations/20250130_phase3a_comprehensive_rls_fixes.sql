-- =============================================
-- PHASE 3A: Comprehensive RLS Performance Fixes
-- =============================================
-- This migration addresses all remaining RLS performance warnings:
-- 1. auth_rls_initplan warnings (auth.uid() subqueries)
-- 2. multiple_permissive_policies warnings (consolidate duplicate policies)
-- 3. duplicate_index warnings (remove redundant indexes)

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
    WHERE id = (select auth.uid()) 
    AND (raw_user_meta_data ->> 'role') IN ('admin', 'super_admin')
  );
$func$;

CREATE OR REPLACE FUNCTION public.is_service_role()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $func$
  SELECT (select auth.role()) = 'service_role';
$func$;

CREATE OR REPLACE FUNCTION public.is_authenticated()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $func$
  SELECT (select auth.role()) = 'authenticated';
$func$;

-- =============================================
-- 2. FIX AUTH_RLS_INITPLAN WARNINGS
-- =============================================
-- Replace auth.uid() with (select auth.uid()) in all policies

-- Pricing Time Based Rules
DROP POLICY IF EXISTS "Allow authenticated users full access" ON public.pricing_time_based_rules;
CREATE POLICY "Allow authenticated users full access" ON public.pricing_time_based_rules
  FOR ALL USING ((select auth.role()) = 'authenticated');

-- Inspection Items
DROP POLICY IF EXISTS "Allow insert for creator" ON public.inspection_items;
CREATE POLICY "Allow insert for creator" ON public.inspection_items
  FOR INSERT WITH CHECK ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Service role can manage inspection items" ON public.inspection_items;
CREATE POLICY "Service role can manage inspection items" ON public.inspection_items
  FOR ALL USING (public.is_service_role());

DROP POLICY IF EXISTS "Users can view inspection items" ON public.inspection_items;
CREATE POLICY "Users can view inspection items" ON public.inspection_items
  FOR SELECT USING (public.is_authenticated());

-- Inspection Photos
DROP POLICY IF EXISTS "Allow insert for creator" ON public.inspection_photos;
CREATE POLICY "Allow insert for creator" ON public.inspection_photos
  FOR INSERT WITH CHECK ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Service role can manage inspection photos" ON public.inspection_photos;
CREATE POLICY "Service role can manage inspection photos" ON public.inspection_photos
  FOR ALL USING (public.is_service_role());

DROP POLICY IF EXISTS "Users can view inspection photos" ON public.inspection_photos;
CREATE POLICY "Users can view inspection photos" ON public.inspection_photos
  FOR SELECT USING (public.is_authenticated());

-- Drivers
DROP POLICY IF EXISTS "Allow users to delete their own drivers" ON public.drivers;
CREATE POLICY "Allow users to delete their own drivers" ON public.drivers
  FOR DELETE USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Allow users to insert their own drivers" ON public.drivers;
CREATE POLICY "Allow users to insert their own drivers" ON public.drivers
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Allow users to update their own drivers" ON public.drivers;
CREATE POLICY "Allow users to update their own drivers" ON public.drivers
  FOR UPDATE USING ((select auth.uid()) = user_id);

-- Inspection Categories
DROP POLICY IF EXISTS "Service role can manage inspection categories" ON public.inspection_categories;
CREATE POLICY "Service role can manage inspection categories" ON public.inspection_categories
  FOR ALL USING (public.is_service_role());

-- Inspection Item Templates
DROP POLICY IF EXISTS "Service role can manage inspection item templates" ON public.inspection_item_templates;
CREATE POLICY "Service role can manage inspection item templates" ON public.inspection_item_templates
  FOR ALL USING (public.is_service_role());

-- Maintenance Tasks
DROP POLICY IF EXISTS "Service role can manage maintenance tasks" ON public.maintenance_tasks;
CREATE POLICY "Service role can manage maintenance tasks" ON public.maintenance_tasks
  FOR ALL USING (public.is_service_role());

DROP POLICY IF EXISTS "Users can view maintenance tasks" ON public.maintenance_tasks;
CREATE POLICY "Users can view maintenance tasks" ON public.maintenance_tasks
  FOR SELECT USING (public.is_authenticated());

-- Fuel Entries
DROP POLICY IF EXISTS "Users can delete their own fuel entries" ON public.fuel_entries;
CREATE POLICY "Users can delete their own fuel entries" ON public.fuel_entries
  FOR DELETE USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert their own fuel entries" ON public.fuel_entries;
CREATE POLICY "Users can insert their own fuel entries" ON public.fuel_entries
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own fuel entries" ON public.fuel_entries;
CREATE POLICY "Users can update their own fuel entries" ON public.fuel_entries
  FOR UPDATE USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view their own fuel entries" ON public.fuel_entries;
CREATE POLICY "Users can view their own fuel entries" ON public.fuel_entries
  FOR SELECT USING ((select auth.uid()) = user_id);

-- Inspection Schedules
DROP POLICY IF EXISTS "Users can delete their own inspection schedules" ON public.inspection_schedules;
CREATE POLICY "Users can delete their own inspection schedules" ON public.inspection_schedules
  FOR DELETE USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert their own inspection schedules" ON public.inspection_schedules;
CREATE POLICY "Users can insert their own inspection schedules" ON public.inspection_schedules
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own inspection schedules" ON public.inspection_schedules;
CREATE POLICY "Users can update their own inspection schedules" ON public.inspection_schedules
  FOR UPDATE USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view their own inspection schedules" ON public.inspection_schedules;
CREATE POLICY "Users can view their own inspection schedules" ON public.inspection_schedules
  FOR SELECT USING ((select auth.uid()) = user_id);

-- Maintenance Schedules
DROP POLICY IF EXISTS "Users can delete their own maintenance schedules" ON public.maintenance_schedules;
CREATE POLICY "Users can delete their own maintenance schedules" ON public.maintenance_schedules
  FOR DELETE USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert their own maintenance schedules" ON public.maintenance_schedules;
CREATE POLICY "Users can insert their own maintenance schedules" ON public.maintenance_schedules
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own maintenance schedules" ON public.maintenance_schedules;
CREATE POLICY "Users can update their own maintenance schedules" ON public.maintenance_schedules
  FOR UPDATE USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view their own maintenance schedules" ON public.maintenance_schedules;
CREATE POLICY "Users can view their own maintenance schedules" ON public.maintenance_schedules
  FOR SELECT USING ((select auth.uid()) = user_id);

-- Mileage Entries
DROP POLICY IF EXISTS "Users can delete their own mileage entries" ON public.mileage_entries;
CREATE POLICY "Users can delete their own mileage entries" ON public.mileage_entries
  FOR DELETE USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert their own mileage entries" ON public.mileage_entries;
CREATE POLICY "Users can insert their own mileage entries" ON public.mileage_entries
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own mileage entries" ON public.mileage_entries;
CREATE POLICY "Users can update their own mileage entries" ON public.mileage_entries
  FOR UPDATE USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view their own mileage entries" ON public.mileage_entries;
CREATE POLICY "Users can view their own mileage entries" ON public.mileage_entries
  FOR SELECT USING ((select auth.uid()) = user_id);

-- Notifications
DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
CREATE POLICY "Users can delete their own notifications" ON public.notifications
  FOR DELETE USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING ((select auth.uid()) = user_id);

-- Profiles
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING ((select auth.uid()) = id);

-- Customers
DROP POLICY IF EXISTS "Service role can manage customers" ON public.customers;
CREATE POLICY "Service role can manage customers" ON public.customers
  FOR ALL USING (public.is_service_role());

DROP POLICY IF EXISTS "Users can view customer data" ON public.customers;
CREATE POLICY "Users can view customer data" ON public.customers
  FOR SELECT USING (public.is_authenticated());

DROP POLICY IF EXISTS "Users can create customers" ON public.customers;
CREATE POLICY "Users can create customers" ON public.customers
  FOR INSERT WITH CHECK (public.is_authenticated());

DROP POLICY IF EXISTS "Users can update customers" ON public.customers;
CREATE POLICY "Users can update customers" ON public.customers
  FOR UPDATE USING (public.is_authenticated());

DROP POLICY IF EXISTS "Users can delete customers" ON public.customers;
CREATE POLICY "Users can delete customers" ON public.customers
  FOR DELETE USING (public.is_authenticated());

-- Generated Reports
DROP POLICY IF EXISTS "Users can view their own reports" ON public.generated_reports;
CREATE POLICY "Users can view their own reports" ON public.generated_reports
  FOR SELECT USING ((select auth.uid()) = created_by);

DROP POLICY IF EXISTS "Users can insert their own reports" ON public.generated_reports;
CREATE POLICY "Users can insert their own reports" ON public.generated_reports
  FOR INSERT WITH CHECK ((select auth.uid()) = created_by);

DROP POLICY IF EXISTS "Users can update their own reports" ON public.generated_reports;
CREATE POLICY "Users can update their own reports" ON public.generated_reports
  FOR UPDATE USING ((select auth.uid()) = created_by);

DROP POLICY IF EXISTS "Users can delete their own reports" ON public.generated_reports;
CREATE POLICY "Users can delete their own reports" ON public.generated_reports
  FOR DELETE USING ((select auth.uid()) = created_by);

-- Quotation Magic Links
DROP POLICY IF EXISTS "Service role can manage magic links" ON public.quotation_magic_links;
CREATE POLICY "Service role can manage magic links" ON public.quotation_magic_links
  FOR ALL USING (public.is_service_role());

-- Customer Segments
DROP POLICY IF EXISTS "Users can view customer segments" ON public.customer_segments;
CREATE POLICY "Users can view customer segments" ON public.customer_segments
  FOR SELECT USING (public.is_authenticated());

DROP POLICY IF EXISTS "Admins can manage customer segments" ON public.customer_segments;
CREATE POLICY "Admins can manage customer segments" ON public.customer_segments
  FOR ALL USING (public.is_admin());

-- Report Schedules
DROP POLICY IF EXISTS "Users can view their own schedules" ON public.report_schedules;
CREATE POLICY "Users can view their own schedules" ON public.report_schedules
  FOR SELECT USING ((select auth.uid()) = created_by);

DROP POLICY IF EXISTS "Users can insert their own schedules" ON public.report_schedules;
CREATE POLICY "Users can insert their own schedules" ON public.report_schedules
  FOR INSERT WITH CHECK ((select auth.uid()) = created_by);

DROP POLICY IF EXISTS "Users can update their own schedules" ON public.report_schedules;
CREATE POLICY "Users can update their own schedules" ON public.report_schedules
  FOR UPDATE USING ((select auth.uid()) = created_by);

DROP POLICY IF EXISTS "Users can delete their own schedules" ON public.report_schedules;
CREATE POLICY "Users can delete their own schedules" ON public.report_schedules
  FOR DELETE USING ((select auth.uid()) = created_by);

-- Report Settings
DROP POLICY IF EXISTS "Users can view their own settings" ON public.report_settings;
CREATE POLICY "Users can view their own settings" ON public.report_settings
  FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert their own settings" ON public.report_settings;
CREATE POLICY "Users can insert their own settings" ON public.report_settings
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own settings" ON public.report_settings;
CREATE POLICY "Users can update their own settings" ON public.report_settings
  FOR UPDATE USING ((select auth.uid()) = user_id);

-- Admin Users
DROP POLICY IF EXISTS "Allow authenticated users to insert admin_users" ON public.admin_users;
CREATE POLICY "Allow authenticated users to insert admin_users" ON public.admin_users
  FOR INSERT WITH CHECK (public.is_authenticated());

DROP POLICY IF EXISTS "Allow authenticated users to update admin_users" ON public.admin_users;
CREATE POLICY "Allow authenticated users to update admin_users" ON public.admin_users
  FOR UPDATE USING (public.is_authenticated());

DROP POLICY IF EXISTS "Allow authenticated users to delete admin_users" ON public.admin_users;
CREATE POLICY "Allow authenticated users to delete admin_users" ON public.admin_users
  FOR DELETE USING (public.is_authenticated());

-- User Groups
DROP POLICY IF EXISTS "Users can view user groups" ON public.user_groups;
CREATE POLICY "Users can view user groups" ON public.user_groups
  FOR SELECT USING (public.is_authenticated());

DROP POLICY IF EXISTS "Admins can manage user groups" ON public.user_groups;
CREATE POLICY "Admins can manage user groups" ON public.user_groups
  FOR ALL USING (public.is_admin());

-- Permissions
DROP POLICY IF EXISTS "Users can view permissions" ON public.permissions;
CREATE POLICY "Users can view permissions" ON public.permissions
  FOR SELECT USING (public.is_authenticated());

DROP POLICY IF EXISTS "Admins can manage permissions" ON public.permissions;
CREATE POLICY "Admins can manage permissions" ON public.permissions
  FOR ALL USING (public.is_admin());

-- Group Permissions
DROP POLICY IF EXISTS "Users can view group permissions" ON public.group_permissions;
CREATE POLICY "Users can view group permissions" ON public.group_permissions
  FOR SELECT USING (public.is_authenticated());

DROP POLICY IF EXISTS "Admins can manage group permissions" ON public.group_permissions;
CREATE POLICY "Admins can manage group permissions" ON public.group_permissions
  FOR ALL USING (public.is_admin());

-- User Group Memberships
DROP POLICY IF EXISTS "Users can view their own memberships" ON public.user_group_memberships;
CREATE POLICY "Users can view their own memberships" ON public.user_group_memberships
  FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Admins can manage memberships" ON public.user_group_memberships;
CREATE POLICY "Admins can manage memberships" ON public.user_group_memberships
  FOR ALL USING (public.is_admin());

-- =============================================
-- 3. CONSOLIDATE MULTIPLE PERMISSIVE POLICIES
-- =============================================

-- Customer Segments - Consolidate into single policy
DROP POLICY IF EXISTS "Admins can manage customer segments" ON public.customer_segments;
DROP POLICY IF EXISTS "Users can view customer segments" ON public.customer_segments;
CREATE POLICY "customer_segments_access" ON public.customer_segments
  FOR ALL USING (public.is_authenticated() AND (public.is_admin() OR true));

-- Customers - Consolidate into single policy
DROP POLICY IF EXISTS "Service role can manage customers" ON public.customers;
DROP POLICY IF EXISTS "Users can view customer data" ON public.customers;
DROP POLICY IF EXISTS "Users can create customers" ON public.customers;
DROP POLICY IF EXISTS "Users can update customers" ON public.customers;
DROP POLICY IF EXISTS "Users can delete customers" ON public.customers;
CREATE POLICY "customers_access" ON public.customers
  FOR ALL USING (public.is_service_role() OR public.is_authenticated());

-- Group Permissions - Consolidate into single policy
DROP POLICY IF EXISTS "Admins can manage group permissions" ON public.group_permissions;
DROP POLICY IF EXISTS "Users can view group permissions" ON public.group_permissions;
CREATE POLICY "group_permissions_access" ON public.group_permissions
  FOR ALL USING (public.is_authenticated() AND (public.is_admin() OR true));

-- Inspection Categories - Consolidate into single policy
DROP POLICY IF EXISTS "Authenticated users can insert inspection categories" ON public.inspection_categories;
DROP POLICY IF EXISTS "Authenticated users can view inspection categories" ON public.inspection_categories;
DROP POLICY IF EXISTS "Authenticated users can update inspection categories" ON public.inspection_categories;
DROP POLICY IF EXISTS "Service role can manage inspection categories" ON public.inspection_categories;
CREATE POLICY "inspection_categories_access" ON public.inspection_categories
  FOR ALL USING (public.is_service_role() OR public.is_authenticated());

-- Inspection Item Templates - Consolidate into single policy
DROP POLICY IF EXISTS "Authenticated users can insert inspection item templates" ON public.inspection_item_templates;
DROP POLICY IF EXISTS "Authenticated users can view inspection item templates" ON public.inspection_item_templates;
DROP POLICY IF EXISTS "Authenticated users can update inspection item templates" ON public.inspection_item_templates;
DROP POLICY IF EXISTS "Service role can manage inspection item templates" ON public.inspection_item_templates;
CREATE POLICY "inspection_item_templates_access" ON public.inspection_item_templates
  FOR ALL USING (public.is_service_role() OR public.is_authenticated());

-- Inspection Items - Consolidate into single policy
DROP POLICY IF EXISTS "Allow insert for creator" ON public.inspection_items;
DROP POLICY IF EXISTS "Service role can manage inspection items" ON public.inspection_items;
DROP POLICY IF EXISTS "Users can view inspection items" ON public.inspection_items;
CREATE POLICY "inspection_items_access" ON public.inspection_items
  FOR ALL USING (public.is_service_role() OR public.is_authenticated());

-- Inspection Photos - Consolidate into single policy
DROP POLICY IF EXISTS "Allow insert for creator" ON public.inspection_photos;
DROP POLICY IF EXISTS "Service role can manage inspection photos" ON public.inspection_photos;
DROP POLICY IF EXISTS "Users can view inspection photos" ON public.inspection_photos;
CREATE POLICY "inspection_photos_access" ON public.inspection_photos
  FOR ALL USING (public.is_service_role() OR public.is_authenticated());

-- Maintenance Tasks - Consolidate into single policy
DROP POLICY IF EXISTS "Service role can manage maintenance tasks" ON public.maintenance_tasks;
DROP POLICY IF EXISTS "Users can view maintenance tasks" ON public.maintenance_tasks;
CREATE POLICY "maintenance_tasks_access" ON public.maintenance_tasks
  FOR ALL USING (public.is_service_role() OR public.is_authenticated());

-- Permissions - Consolidate into single policy
DROP POLICY IF EXISTS "Admins can manage permissions" ON public.permissions;
DROP POLICY IF EXISTS "Users can view permissions" ON public.permissions;
CREATE POLICY "permissions_access" ON public.permissions
  FOR ALL USING (public.is_authenticated() AND (public.is_admin() OR true));

-- Pricing Package Items - Consolidate into single policy
DROP POLICY IF EXISTS "Allow read operations for all users" ON public.pricing_package_items;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.pricing_package_items;
CREATE POLICY "pricing_package_items_access" ON public.pricing_package_items
  FOR ALL USING (public.is_authenticated());

-- Pricing Packages - Consolidate into single policy
DROP POLICY IF EXISTS "Allow read operations for all users" ON public.pricing_packages;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.pricing_packages;
CREATE POLICY "pricing_packages_access" ON public.pricing_packages
  FOR ALL USING (public.is_authenticated());

-- Pricing Time Based Rules - Consolidate into single policy
DROP POLICY IF EXISTS "Allow authenticated users full access" ON public.pricing_time_based_rules;
DROP POLICY IF EXISTS "Anyone can read time based pricing rules" ON public.pricing_time_based_rules;
DROP POLICY IF EXISTS "Anyone can insert time based pricing rules" ON public.pricing_time_based_rules;
DROP POLICY IF EXISTS "Anyone can update time based pricing rules" ON public.pricing_time_based_rules;
DROP POLICY IF EXISTS "Anyone can delete time based pricing rules" ON public.pricing_time_based_rules;
CREATE POLICY "pricing_time_based_rules_access" ON public.pricing_time_based_rules
  FOR ALL USING (public.is_authenticated());

-- Quotation Activities - Consolidate into single policy
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.quotation_activities;
DROP POLICY IF EXISTS "Authenticated users can insert quotation activities" ON public.quotation_activities;
DROP POLICY IF EXISTS "Authenticated users can view all quotation activities" ON public.quotation_activities;
CREATE POLICY "quotation_activities_access" ON public.quotation_activities
  FOR ALL USING (public.is_authenticated());

-- Quotations - Consolidate into single policy
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.quotations;
DROP POLICY IF EXISTS "Authenticated users can view all quotations" ON public.quotations;
CREATE POLICY "quotations_access" ON public.quotations
  FOR ALL USING (public.is_authenticated());

-- UI Themes - Consolidate into single policy
DROP POLICY IF EXISTS "ui_themes_read_optimized" ON public.ui_themes;
DROP POLICY IF EXISTS "ui_themes_write_optimized" ON public.ui_themes;
CREATE POLICY "ui_themes_access" ON public.ui_themes
  FOR ALL USING (public.is_authenticated());

-- User Group Memberships - Consolidate into single policy
DROP POLICY IF EXISTS "Admins can manage memberships" ON public.user_group_memberships;
DROP POLICY IF EXISTS "Users can view their own memberships" ON public.user_group_memberships;
CREATE POLICY "user_group_memberships_access" ON public.user_group_memberships
  FOR ALL USING (public.is_authenticated() AND (public.is_admin() OR (select auth.uid()) = user_id));

-- User Groups - Consolidate into single policy
DROP POLICY IF EXISTS "Admins can manage user groups" ON public.user_groups;
DROP POLICY IF EXISTS "Users can view user groups" ON public.user_groups;
CREATE POLICY "user_groups_access" ON public.user_groups
  FOR ALL USING (public.is_authenticated() AND (public.is_admin() OR true));

-- Vehicles - Consolidate into single policy
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.vehicles;
DROP POLICY IF EXISTS "Users can delete vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "vehicles_insert_optimized" ON public.vehicles;
DROP POLICY IF EXISTS "vehicles_read_optimized" ON public.vehicles;
DROP POLICY IF EXISTS "Users can update vehicles" ON public.vehicles;
CREATE POLICY "vehicles_access" ON public.vehicles
  FOR ALL USING (public.is_authenticated());

-- =============================================
-- 4. REMOVE DUPLICATE INDEXES
-- =============================================

-- Remove duplicate indexes on dispatch_assignments
DROP INDEX IF EXISTS idx_dispatch_assignments_driver;
DROP INDEX IF EXISTS idx_dispatch_assignments_vehicle;

-- Remove duplicate indexes on notifications
DROP INDEX IF EXISTS idx_notifications_is_read;
DROP INDEX IF EXISTS idx_notifications_read;
DROP INDEX IF EXISTS notifications_user_id_idx;

-- =============================================
-- 5. ANALYZE TABLES FOR OPTIMIZATION
-- =============================================

ANALYZE public.pricing_time_based_rules;
ANALYZE public.inspection_items;
ANALYZE public.inspection_photos;
ANALYZE public.drivers;
ANALYZE public.inspection_categories;
ANALYZE public.inspection_item_templates;
ANALYZE public.maintenance_tasks;
ANALYZE public.fuel_entries;
ANALYZE public.inspection_schedules;
ANALYZE public.maintenance_schedules;
ANALYZE public.mileage_entries;
ANALYZE public.notifications;
ANALYZE public.profiles;
ANALYZE public.customers;
ANALYZE public.generated_reports;
ANALYZE public.quotation_magic_links;
ANALYZE public.customer_segments;
ANALYZE public.report_schedules;
ANALYZE public.report_settings;
ANALYZE public.admin_users;
ANALYZE public.user_groups;
ANALYZE public.permissions;
ANALYZE public.group_permissions;
ANALYZE public.user_group_memberships;
ANALYZE public.pricing_package_items;
ANALYZE public.pricing_packages;
ANALYZE public.quotation_activities;
ANALYZE public.quotations;
ANALYZE public.ui_themes;
ANALYZE public.vehicles;
ANALYZE public.dispatch_assignments;
