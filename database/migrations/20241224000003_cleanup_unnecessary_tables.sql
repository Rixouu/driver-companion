-- =============================================================================
-- CLEANUP UNNECESSARY TABLES
-- =============================================================================
-- Remove overcomplicated tables that aren't needed for your fleet management system

-- Drop unused branding tables (you use CSS variables instead)
DROP TABLE IF EXISTS client_portal_branding CASCADE;
DROP TABLE IF EXISTS document_branding CASCADE;
DROP TABLE IF EXISTS email_branding CASCADE;

-- Drop unused notification tables (overcomplicated)
DROP TABLE IF EXISTS notification_schedules CASCADE;
DROP TABLE IF EXISTS notification_preferences CASCADE;
DROP TABLE IF EXISTS notification_logs CASCADE;

-- Keep only what you actually need:
-- 1. notification_templates (for email templates)
-- 2. company_branding (basic company info only)

-- Simplify company_branding to just what you need
ALTER TABLE company_branding DROP COLUMN IF EXISTS logo_dark_url;
ALTER TABLE company_branding DROP COLUMN IF EXISTS favicon_url;
ALTER TABLE company_branding DROP COLUMN IF EXISTS background_color;
ALTER TABLE company_branding DROP COLUMN IF EXISTS text_color;
ALTER TABLE company_branding DROP COLUMN IF EXISTS font_family;
ALTER TABLE company_branding DROP COLUMN IF EXISTS font_size_base;
ALTER TABLE company_branding DROP COLUMN IF EXISTS border_radius;

-- Update company_branding to have your actual colors
UPDATE company_branding 
SET 
  primary_color = '#E03E2D',  -- Your actual red color from emails
  logo_url = 'https://japandriver.com/img/driver-invoice-logo.png'
WHERE company_name = 'Driver Japan';

-- Add a simple settings table for basic configuration
CREATE TABLE IF NOT EXISTS app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert basic settings
INSERT INTO app_settings (key, value, description) VALUES
('company_name', 'Driver Japan', 'Company name displayed in emails and documents'),
('company_logo', 'https://japandriver.com/img/driver-invoice-logo.png', 'Company logo URL'),
('primary_color', '#E03E2D', 'Primary brand color (red)'),
('support_email', 'booking@japandriver.com', 'Support email address'),
('from_email', 'Driver Japan <booking@japandriver.com>', 'From email for notifications')
ON CONFLICT (key) DO NOTHING;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_app_settings_updated_at
  BEFORE UPDATE ON app_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verification
DO $$
BEGIN
  RAISE NOTICE 'Cleanup complete! Simplified to essential tables only:';
  RAISE NOTICE '✅ notification_templates - for email templates';
  RAISE NOTICE '✅ company_branding - basic company info';
  RAISE NOTICE '✅ app_settings - simple key-value configuration';
  RAISE NOTICE '❌ Removed overcomplicated branding/notification tables';
END $$;
