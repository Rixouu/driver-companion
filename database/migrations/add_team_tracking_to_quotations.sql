-- Add team tracking fields to quotations table
-- This migration adds fields to track which team created the quote and who created it

-- Add created_by field to track the user who created the quotation
ALTER TABLE quotations 
ADD COLUMN created_by UUID REFERENCES auth.users(id);

-- Add team_location field to track which team (Japan/Thailand) created the quote
ALTER TABLE quotations 
ADD COLUMN team_location TEXT NOT NULL DEFAULT 'thailand' CHECK (team_location IN ('japan', 'thailand'));

-- Add index for better performance on team_location queries
CREATE INDEX idx_quotations_team_location ON quotations(team_location);

-- Add index for better performance on created_by queries
CREATE INDEX idx_quotations_created_by ON quotations(created_by);

-- Update existing quotations to have a default team_location
UPDATE quotations 
SET team_location = 'thailand' 
WHERE team_location IS NULL;

-- Make team_location NOT NULL after setting default values
ALTER TABLE quotations 
ALTER COLUMN team_location SET NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN quotations.created_by IS 'User ID who created this quotation';
COMMENT ON COLUMN quotations.team_location IS 'Team location that created this quotation (japan or thailand)';
