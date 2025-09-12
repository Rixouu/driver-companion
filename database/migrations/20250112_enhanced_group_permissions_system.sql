-- =============================================================================
-- ENHANCED GROUP PERMISSIONS SYSTEM FOR VEHICLE INSPECTION APP
-- =============================================================================

-- First, let's clear existing data and update the schema
TRUNCATE user_groups, permissions, group_permissions, user_group_memberships CASCADE;

-- Insert realistic user groups based on your vehicle inspection business
INSERT INTO user_groups (name, description, color, icon, sort_order) VALUES
  ('System Administrator', 'Full system access, can manage all users and settings', '#dc2626', 'shield-check', 1),
  ('Operations Manager', 'Manages daily operations, bookings, dispatch, and staff', '#7c3aed', 'briefcase', 2),
  ('Fleet Manager', 'Manages vehicles, drivers, maintenance, and inspections', '#059669', 'truck', 3),
  ('Sales Manager', 'Manages quotations, customers, pricing, and sales reports', '#ea580c', 'chart-line', 4),
  ('Dispatcher', 'Handles booking assignments, driver coordination, and real-time tracking', '#0ea5e9', 'map-pin', 5),
  ('Inspector', 'Performs vehicle inspections and manages inspection templates', '#16a34a', 'clipboard-check', 6),
  ('Driver Coordinator', 'Manages driver schedules, availability, and assignments', '#8b5cf6', 'users', 7),
  ('Accountant', 'Access to financial reports, invoices, and payment tracking', '#0d9488', 'calculator', 8),
  ('Customer Service', 'Handles customer inquiries, bookings, and basic quotations', '#06b6d4', 'headphones', 9),
  ('Viewer', 'Read-only access to assigned areas for monitoring and reporting', '#6b7280', 'eye', 10)
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  color = EXCLUDED.color,
  icon = EXCLUDED.icon,
  sort_order = EXCLUDED.sort_order;

-- Insert comprehensive permissions based on your app structure
INSERT INTO permissions (name, description, category, action, resource) VALUES
  -- Dashboard permissions
  ('dashboard.view', 'View dashboard overview and statistics', 'dashboard', 'read', 'dashboard'),
  
  -- Booking permissions
  ('bookings.create', 'Create new bookings', 'bookings', 'create', 'booking'),
  ('bookings.read', 'View bookings and booking details', 'bookings', 'read', 'booking'),
  ('bookings.update', 'Update booking information', 'bookings', 'update', 'booking'),
  ('bookings.delete', 'Cancel and delete bookings', 'bookings', 'delete', 'booking'),
  ('bookings.assign', 'Assign drivers and vehicles to bookings', 'bookings', 'assign', 'booking'),
  ('bookings.sync', 'Sync bookings from external systems', 'bookings', 'sync', 'booking'),
  ('bookings.invoice', 'Generate and send invoices for bookings', 'bookings', 'invoice', 'booking'),
  
  -- Vehicle permissions
  ('vehicles.create', 'Add new vehicles to the fleet', 'vehicles', 'create', 'vehicle'),
  ('vehicles.read', 'View vehicle information and details', 'vehicles', 'read', 'vehicle'),
  ('vehicles.update', 'Update vehicle information', 'vehicles', 'update', 'vehicle'),
  ('vehicles.delete', 'Remove vehicles from the fleet', 'vehicles', 'delete', 'vehicle'),
  ('vehicles.assign', 'Assign vehicles to drivers or bookings', 'vehicles', 'assign', 'vehicle'),
  
  -- Driver permissions
  ('drivers.create', 'Add new drivers to the system', 'drivers', 'create', 'driver'),
  ('drivers.read', 'View driver profiles and information', 'drivers', 'read', 'driver'),
  ('drivers.update', 'Update driver information and status', 'drivers', 'update', 'driver'),
  ('drivers.delete', 'Remove drivers from the system', 'drivers', 'delete', 'driver'),
  ('drivers.schedule', 'Manage driver availability and schedules', 'drivers', 'schedule', 'driver'),
  
  -- Inspection permissions
  ('inspections.create', 'Create and perform vehicle inspections', 'inspections', 'create', 'inspection'),
  ('inspections.read', 'View inspection records and reports', 'inspections', 'read', 'inspection'),
  ('inspections.update', 'Update inspection results and notes', 'inspections', 'update', 'inspection'),
  ('inspections.delete', 'Delete inspection records', 'inspections', 'delete', 'inspection'),
  ('inspections.templates', 'Manage inspection templates and checklists', 'inspections', 'manage', 'template'),
  ('inspections.schedule', 'Schedule recurring inspections', 'inspections', 'schedule', 'inspection'),
  
  -- Maintenance permissions
  ('maintenance.create', 'Create maintenance tasks and schedules', 'maintenance', 'create', 'maintenance'),
  ('maintenance.read', 'View maintenance records and schedules', 'maintenance', 'read', 'maintenance'),
  ('maintenance.update', 'Update maintenance tasks and status', 'maintenance', 'update', 'maintenance'),
  ('maintenance.delete', 'Delete maintenance records', 'maintenance', 'delete', 'maintenance'),
  ('maintenance.schedule', 'Schedule recurring maintenance', 'maintenance', 'schedule', 'maintenance'),
  
  -- Quotation permissions
  ('quotations.create', 'Create new quotations for customers', 'quotations', 'create', 'quotation'),
  ('quotations.read', 'View quotations and customer requests', 'quotations', 'read', 'quotation'),
  ('quotations.update', 'Update quotation details and pricing', 'quotations', 'update', 'quotation'),
  ('quotations.delete', 'Delete quotations', 'quotations', 'delete', 'quotation'),
  ('quotations.approve', 'Approve or reject quotations', 'quotations', 'approve', 'quotation'),
  ('quotations.convert', 'Convert approved quotations to bookings', 'quotations', 'convert', 'quotation'),
  ('quotations.send', 'Send quotations to customers', 'quotations', 'send', 'quotation'),
  
  -- Customer permissions
  ('customers.create', 'Add new customers to the system', 'customers', 'create', 'customer'),
  ('customers.read', 'View customer information and history', 'customers', 'read', 'customer'),
  ('customers.update', 'Update customer information', 'customers', 'update', 'customer'),
  ('customers.delete', 'Delete customer records', 'customers', 'delete', 'customer'),
  ('customers.segments', 'Manage customer segments and categories', 'customers', 'manage', 'segment'),
  
  -- Dispatch permissions
  ('dispatch.read', 'View dispatch board and assignments', 'dispatch', 'read', 'dispatch'),
  ('dispatch.assign', 'Create and manage dispatch assignments', 'dispatch', 'assign', 'dispatch'),
  ('dispatch.track', 'Track vehicles and drivers in real-time', 'dispatch', 'track', 'dispatch'),
  ('dispatch.communicate', 'Send notifications to drivers and customers', 'dispatch', 'communicate', 'dispatch'),
  
  -- Pricing permissions
  ('pricing.read', 'View pricing information and rates', 'pricing', 'read', 'pricing'),
  ('pricing.update', 'Update pricing rules and categories', 'pricing', 'update', 'pricing'),
  ('pricing.packages', 'Manage pricing packages and promotions', 'pricing', 'manage', 'package'),
  ('pricing.time_based', 'Manage time-based pricing rules', 'pricing', 'manage', 'time_rule'),
  
  -- Reporting permissions
  ('reports.financial', 'View financial reports and analytics', 'reports', 'read', 'financial_report'),
  ('reports.operational', 'View operational reports and metrics', 'reports', 'read', 'operational_report'),
  ('reports.fleet', 'View fleet performance and utilization reports', 'reports', 'read', 'fleet_report'),
  ('reports.custom', 'Create and generate custom reports', 'reports', 'create', 'custom_report'),
  ('reports.export', 'Export reports to PDF/CSV formats', 'reports', 'export', 'report'),
  
  -- Settings permissions
  ('settings.read', 'View system settings', 'settings', 'read', 'setting'),
  ('settings.update', 'Update system configuration', 'settings', 'update', 'setting'),
  ('settings.users', 'Manage user accounts and permissions', 'settings', 'manage', 'user'),
  ('settings.groups', 'Manage user groups and roles', 'settings', 'manage', 'group'),
  ('settings.templates', 'Manage inspection and maintenance templates', 'settings', 'manage', 'template'),
  
  -- System permissions
  ('system.admin', 'Full system administration access', 'system', 'admin', 'system'),
  ('system.backup', 'Perform system backups and maintenance', 'system', 'backup', 'system'),
  ('system.audit', 'View system audit logs and activity', 'system', 'audit', 'system')
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  action = EXCLUDED.action,
  resource = EXCLUDED.resource;

-- Assign permissions to groups based on realistic business roles
INSERT INTO group_permissions (group_id, permission_id, granted) 
SELECT 
  ug.id as group_id,
  p.id as permission_id,
  true as granted
FROM user_groups ug
CROSS JOIN permissions p
WHERE 
  -- System Administrator gets all permissions
  (ug.name = 'System Administrator') OR
  
  -- Operations Manager gets most operational permissions
  (ug.name = 'Operations Manager' AND p.category IN ('dashboard', 'bookings', 'dispatch', 'customers', 'reports') 
   AND p.action != 'delete' AND p.name NOT LIKE 'system.%') OR
  
  -- Fleet Manager gets vehicle, driver, maintenance, and inspection permissions
  (ug.name = 'Fleet Manager' AND p.category IN ('dashboard', 'vehicles', 'drivers', 'maintenance', 'inspections', 'reports') 
   AND p.action != 'delete' AND p.name NOT LIKE 'system.%') OR
  
  -- Sales Manager gets quotation, customer, and pricing permissions
  (ug.name = 'Sales Manager' AND p.category IN ('dashboard', 'quotations', 'customers', 'pricing', 'reports') 
   AND p.action != 'delete' AND p.name NOT LIKE 'system.%') OR
  
  -- Dispatcher gets dispatch, booking assignment, and tracking permissions
  (ug.name = 'Dispatcher' AND (
    p.category IN ('dashboard', 'dispatch') OR 
    p.name IN ('bookings.read', 'bookings.assign', 'drivers.read', 'vehicles.read')
  )) OR
  
  -- Inspector gets inspection and vehicle read permissions
  (ug.name = 'Inspector' AND (
    p.category = 'inspections' OR 
    p.name IN ('dashboard.view', 'vehicles.read', 'maintenance.create', 'maintenance.read')
  )) OR
  
  -- Driver Coordinator gets driver management and scheduling permissions
  (ug.name = 'Driver Coordinator' AND (
    p.category = 'drivers' OR 
    p.name IN ('dashboard.view', 'bookings.read', 'vehicles.read', 'dispatch.read')
  )) OR
  
  -- Accountant gets financial and reporting permissions
  (ug.name = 'Accountant' AND (
    p.category = 'reports' OR 
    p.name IN ('dashboard.view', 'bookings.read', 'bookings.invoice', 'quotations.read', 'customers.read')
  )) OR
  
  -- Customer Service gets basic customer and booking permissions
  (ug.name = 'Customer Service' AND (
    p.name IN ('dashboard.view', 'bookings.create', 'bookings.read', 'bookings.update', 
               'quotations.create', 'quotations.read', 'quotations.send', 
               'customers.create', 'customers.read', 'customers.update')
  )) OR
  
  -- Viewer gets only read permissions
  (ug.name = 'Viewer' AND p.action = 'read')
ON CONFLICT (group_id, permission_id) DO NOTHING;

-- Create a view for easier user management that combines auth.users with profiles
CREATE OR REPLACE VIEW user_profiles AS
SELECT 
  au.id,
  au.email,
  au.created_at as auth_created_at,
  au.last_sign_in_at,
  au.email_confirmed_at,
  COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', p.full_name) as full_name,
  au.raw_user_meta_data->>'avatar_url' as avatar_url,
  p.updated_at as profile_updated_at,
  CASE 
    WHEN au.email LIKE '%@japandriver.com' THEN 'Japan'
    ELSE 'Thailand'
  END as team_location,
  CASE 
    WHEN au.banned_until IS NOT NULL AND au.banned_until > NOW() THEN false
    WHEN au.email_confirmed_at IS NULL THEN false
    ELSE true
  END as is_active
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE au.deleted_at IS NULL;

-- Grant access to the view
GRANT SELECT ON user_profiles TO authenticated;

-- Create RLS policy for the view
CREATE POLICY "Users can view user profiles" ON user_profiles
  FOR SELECT USING (auth.role() = 'authenticated');

-- Add some indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_group_memberships_active_user ON user_group_memberships(user_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_permissions_category_action ON permissions(category, action);
CREATE INDEX IF NOT EXISTS idx_user_profiles_team_location ON auth.users((raw_user_meta_data->>'custom_claims'->>'hd'));

-- Update admin_users table with existing users
INSERT INTO admin_users (id, role, email, team_location)
SELECT 
  id,
  CASE 
    WHEN email LIKE '%@japandriver.com' THEN 'ADMIN'
    ELSE 'USER'
  END as role,
  email,
  CASE 
    WHEN email LIKE '%@japandriver.com' THEN 'Japan'
    ELSE 'Thailand'
  END as team_location
FROM auth.users
WHERE deleted_at IS NULL
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  team_location = EXCLUDED.team_location,
  updated_at = NOW();
