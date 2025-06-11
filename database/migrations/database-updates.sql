-- Inspection Template Manager Database Updates
-- This file contains all SQL changes needed for the enhanced template management system

-- 1. Add is_active column to inspection_categories
ALTER TABLE inspection_categories 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 2. Create vehicle_groups table for organizing vehicles
CREATE TABLE IF NOT EXISTS vehicle_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6', -- Hex color for UI display
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Add vehicle_group_id to vehicles table
ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS vehicle_group_id UUID REFERENCES vehicle_groups(id);

-- 4. Create inspection_template_assignments table
CREATE TABLE IF NOT EXISTS inspection_template_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_type VARCHAR(50) NOT NULL, -- 'daily', 'routine', 'maintenance', 'safety'
    vehicle_id UUID REFERENCES vehicles(id),
    vehicle_group_id UUID REFERENCES vehicle_groups(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure only one of vehicle_id or vehicle_group_id is set
    CONSTRAINT check_assignment_target CHECK (
        (vehicle_id IS NOT NULL AND vehicle_group_id IS NULL) OR
        (vehicle_id IS NULL AND vehicle_group_id IS NOT NULL)
    ),
    
    -- Ensure unique assignment per template type and target
    CONSTRAINT unique_template_assignment UNIQUE (template_type, vehicle_id, vehicle_group_id)
);

-- 5. Add template assignment context to inspection_categories
ALTER TABLE inspection_categories 
ADD COLUMN IF NOT EXISTS assigned_to_vehicle_id UUID REFERENCES vehicles(id),
ADD COLUMN IF NOT EXISTS assigned_to_group_id UUID REFERENCES vehicle_groups(id);

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_inspection_categories_active ON inspection_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_inspection_categories_type_active ON inspection_categories(type, is_active);
CREATE INDEX IF NOT EXISTS idx_vehicles_group_id ON vehicles(vehicle_group_id);
CREATE INDEX IF NOT EXISTS idx_template_assignments_vehicle ON inspection_template_assignments(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_template_assignments_group ON inspection_template_assignments(vehicle_group_id);
CREATE INDEX IF NOT EXISTS idx_template_assignments_type ON inspection_template_assignments(template_type);

-- 7. Create trigger function for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. Create triggers for timestamp updates
DROP TRIGGER IF EXISTS update_vehicle_groups_updated_at ON vehicle_groups;
CREATE TRIGGER update_vehicle_groups_updated_at 
    BEFORE UPDATE ON vehicle_groups 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_template_assignments_updated_at ON inspection_template_assignments;
CREATE TRIGGER update_template_assignments_updated_at 
    BEFORE UPDATE ON inspection_template_assignments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. Insert some default vehicle groups based on existing brands
INSERT INTO vehicle_groups (name, description, color) 
SELECT DISTINCT 
    brand || ' Vehicles' as name,
    'Vehicles from ' || brand || ' brand' as description,
    CASE 
        WHEN brand = 'Mercedes' THEN '#E11D48'
        WHEN brand = 'Toyota' THEN '#DC2626'
        ELSE '#3B82F6'
    END as color
FROM vehicles 
WHERE brand IS NOT NULL 
AND NOT EXISTS (
    SELECT 1 FROM vehicle_groups vg WHERE vg.name = vehicles.brand || ' Vehicles'
); 