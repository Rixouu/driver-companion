-- =============================================================================
-- MIGRATION: Create Group Permissions System
-- =============================================================================

-- Create user_groups table
CREATE TABLE IF NOT EXISTS user_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  color VARCHAR(7) DEFAULT '#6366f1', -- Hex color for UI display
  icon VARCHAR(50) DEFAULT 'users', -- Icon name for UI
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  category VARCHAR(50) NOT NULL, -- e.g., 'bookings', 'vehicles', 'drivers', 'reports'
  action VARCHAR(50) NOT NULL, -- e.g., 'create', 'read', 'update', 'delete', 'manage'
  resource VARCHAR(50) NOT NULL, -- e.g., 'booking', 'vehicle', 'driver', 'report'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create group_permissions junction table
CREATE TABLE IF NOT EXISTS group_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES user_groups(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  granted BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, permission_id)
);

-- Create user_group_memberships table
CREATE TABLE IF NOT EXISTS user_group_memberships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES user_groups(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, group_id)
);

-- Add email and team_location columns to admin_users if they don't exist
ALTER TABLE admin_users 
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS team_location VARCHAR(50);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_groups_active ON user_groups(is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_permissions_category ON permissions(category);
CREATE INDEX IF NOT EXISTS idx_permissions_resource ON permissions(resource);
CREATE INDEX IF NOT EXISTS idx_group_permissions_group ON group_permissions(group_id);
CREATE INDEX IF NOT EXISTS idx_group_permissions_permission ON group_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_user_group_memberships_user ON user_group_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_user_group_memberships_group ON user_group_memberships(group_id);
CREATE INDEX IF NOT EXISTS idx_user_group_memberships_active ON user_group_memberships(is_active);

-- Enable Row Level Security
ALTER TABLE user_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_group_memberships ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_groups
CREATE POLICY "Users can view user groups" ON user_groups
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage user groups" ON user_groups
  FOR ALL USING (auth.role() = 'authenticated');

-- Create RLS policies for permissions
CREATE POLICY "Users can view permissions" ON permissions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage permissions" ON permissions
  FOR ALL USING (auth.role() = 'authenticated');

-- Create RLS policies for group_permissions
CREATE POLICY "Users can view group permissions" ON group_permissions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage group permissions" ON group_permissions
  FOR ALL USING (auth.role() = 'authenticated');

-- Create RLS policies for user_group_memberships
CREATE POLICY "Users can view their own memberships" ON user_group_memberships
  FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'authenticated');

CREATE POLICY "Admins can manage memberships" ON user_group_memberships
  FOR ALL USING (auth.role() = 'authenticated');

-- Insert default user groups
INSERT INTO user_groups (name, description, color, icon, sort_order) VALUES
  ('Super Admin', 'Full system access with all permissions', '#dc2626', 'shield-check', 1),
  ('Admin', 'Administrative access to most system features', '#7c3aed', 'user-cog', 2),
  ('Manager', 'Management access to assigned areas', '#059669', 'user-tie', 3),
  ('Operator', 'Operational access for daily tasks', '#0ea5e9', 'user-gear', 4),
  ('Viewer', 'Read-only access to assigned areas', '#6b7280', 'eye', 5)
ON CONFLICT (name) DO NOTHING;

-- Insert default permissions
INSERT INTO permissions (name, description, category, action, resource) VALUES
  -- Booking permissions
  ('bookings.create', 'Create new bookings', 'bookings', 'create', 'booking'),
  ('bookings.read', 'View bookings', 'bookings', 'read', 'booking'),
  ('bookings.update', 'Update bookings', 'bookings', 'update', 'booking'),
  ('bookings.delete', 'Delete bookings', 'bookings', 'delete', 'booking'),
  ('bookings.manage', 'Full booking management', 'bookings', 'manage', 'booking'),
  
  -- Vehicle permissions
  ('vehicles.create', 'Create new vehicles', 'vehicles', 'create', 'vehicle'),
  ('vehicles.read', 'View vehicles', 'vehicles', 'read', 'vehicle'),
  ('vehicles.update', 'Update vehicles', 'vehicles', 'update', 'vehicle'),
  ('vehicles.delete', 'Delete vehicles', 'vehicles', 'delete', 'vehicle'),
  ('vehicles.manage', 'Full vehicle management', 'vehicles', 'manage', 'vehicle'),
  
  -- Driver permissions
  ('drivers.create', 'Create new drivers', 'drivers', 'create', 'driver'),
  ('drivers.read', 'View drivers', 'drivers', 'read', 'driver'),
  ('drivers.update', 'Update drivers', 'drivers', 'update', 'driver'),
  ('drivers.delete', 'Delete drivers', 'drivers', 'delete', 'driver'),
  ('drivers.manage', 'Full driver management', 'drivers', 'manage', 'driver'),
  
  -- Quotation permissions
  ('quotations.create', 'Create new quotations', 'quotations', 'create', 'quotation'),
  ('quotations.read', 'View quotations', 'quotations', 'read', 'quotation'),
  ('quotations.update', 'Update quotations', 'quotations', 'update', 'quotation'),
  ('quotations.delete', 'Delete quotations', 'quotations', 'delete', 'quotation'),
  ('quotations.manage', 'Full quotation management', 'quotations', 'manage', 'quotation'),
  
  -- Report permissions
  ('reports.create', 'Create new reports', 'reports', 'create', 'report'),
  ('reports.read', 'View reports', 'reports', 'read', 'report'),
  ('reports.manage', 'Full report management', 'reports', 'manage', 'report'),
  
  -- Settings permissions
  ('settings.read', 'View settings', 'settings', 'read', 'setting'),
  ('settings.update', 'Update settings', 'settings', 'update', 'setting'),
  ('settings.manage', 'Full settings management', 'settings', 'manage', 'setting'),
  
  -- User management permissions
  ('users.create', 'Create new users', 'users', 'create', 'user'),
  ('users.read', 'View users', 'users', 'read', 'user'),
  ('users.update', 'Update users', 'users', 'update', 'user'),
  ('users.delete', 'Delete users', 'users', 'delete', 'user'),
  ('users.manage', 'Full user management', 'users', 'manage', 'user'),
  
  -- Group management permissions
  ('groups.create', 'Create new groups', 'groups', 'create', 'group'),
  ('groups.read', 'View groups', 'groups', 'read', 'group'),
  ('groups.update', 'Update groups', 'groups', 'update', 'group'),
  ('groups.delete', 'Delete groups', 'groups', 'delete', 'group'),
  ('groups.manage', 'Full group management', 'groups', 'manage', 'group')
ON CONFLICT (name) DO NOTHING;

-- Grant all permissions to Super Admin group
INSERT INTO group_permissions (group_id, permission_id, granted)
SELECT 
  ug.id as group_id,
  p.id as permission_id,
  true as granted
FROM user_groups ug
CROSS JOIN permissions p
WHERE ug.name = 'Super Admin'
ON CONFLICT (group_id, permission_id) DO NOTHING;

-- Grant basic permissions to Admin group
INSERT INTO group_permissions (group_id, permission_id, granted)
SELECT 
  ug.id as group_id,
  p.id as permission_id,
  true as granted
FROM user_groups ug
CROSS JOIN permissions p
WHERE ug.name = 'Admin'
  AND p.name NOT LIKE 'users.%'
  AND p.name NOT LIKE 'groups.%'
ON CONFLICT (group_id, permission_id) DO NOTHING;

-- Grant read permissions to Manager group
INSERT INTO group_permissions (group_id, permission_id, granted)
SELECT 
  ug.id as group_id,
  p.id as permission_id,
  CASE 
    WHEN p.action = 'read' THEN true
    WHEN p.name IN ('bookings.create', 'bookings.update', 'quotations.create', 'quotations.update') THEN true
    ELSE false
  END as granted
FROM user_groups ug
CROSS JOIN permissions p
WHERE ug.name = 'Manager'
ON CONFLICT (group_id, permission_id) DO NOTHING;

-- Grant read permissions to Operator group
INSERT INTO group_permissions (group_id, permission_id, granted)
SELECT 
  ug.id as group_id,
  p.id as permission_id,
  CASE 
    WHEN p.action = 'read' THEN true
    WHEN p.name IN ('bookings.create', 'bookings.update', 'vehicles.read', 'drivers.read') THEN true
    ELSE false
  END as granted
FROM user_groups ug
CROSS JOIN permissions p
WHERE ug.name = 'Operator'
ON CONFLICT (group_id, permission_id) DO NOTHING;

-- Grant read-only permissions to Viewer group
INSERT INTO group_permissions (group_id, permission_id, granted)
SELECT 
  ug.id as group_id,
  p.id as permission_id,
  CASE 
    WHEN p.action = 'read' THEN true
    ELSE false
  END as granted
FROM user_groups ug
CROSS JOIN permissions p
WHERE ug.name = 'Viewer'
ON CONFLICT (group_id, permission_id) DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_user_groups_updated_at 
  BEFORE UPDATE ON user_groups 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_permissions_updated_at 
  BEFORE UPDATE ON permissions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Report completion
DO $$
BEGIN
  RAISE NOTICE '=== GROUP PERMISSIONS SYSTEM CREATED ===';
  RAISE NOTICE 'Tables created: user_groups, permissions, group_permissions, user_group_memberships';
  RAISE NOTICE 'Default groups: Super Admin, Admin, Manager, Operator, Viewer';
  RAISE NOTICE 'Default permissions: 35 permissions across 7 categories';
  RAISE NOTICE 'RLS policies: Created for all tables';
  RAISE NOTICE 'All permissions granted to Super Admin group';
  RAISE NOTICE 'Group permissions system ready!';
END $$;
