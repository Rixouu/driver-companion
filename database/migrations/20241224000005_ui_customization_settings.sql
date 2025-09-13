-- UI Customization Settings Migration
-- This migration adds UI customization settings for the fleet management interface

-- Add UI customization fields to app_settings table
INSERT INTO app_settings (key, value, description, created_at, updated_at)
VALUES 
  -- Sidebar Customization
  ('ui_sidebar_background_color', '#1f2937', 'Sidebar background color (default: gray-800)', NOW(), NOW()),
  ('ui_sidebar_text_color', '#f9fafb', 'Sidebar text color (default: gray-50)', NOW(), NOW()),
  ('ui_sidebar_hover_color', '#374151', 'Sidebar item hover background color (default: gray-700)', NOW(), NOW()),
  ('ui_sidebar_active_color', '#3b82f6', 'Sidebar active item color (default: blue-500)', NOW(), NOW()),
  ('ui_sidebar_border_color', '#374151', 'Sidebar border color (default: gray-700)', NOW(), NOW()),
  
  -- Typography
  ('ui_font_family', 'Inter', 'Primary font family (default: Inter)', NOW(), NOW()),
  ('ui_font_size_base', '14px', 'Base font size (default: 14px)', NOW(), NOW()),
  ('ui_font_weight_normal', '400', 'Normal font weight (default: 400)', NOW(), NOW()),
  ('ui_font_weight_medium', '500', 'Medium font weight (default: 500)', NOW(), NOW()),
  ('ui_font_weight_semibold', '600', 'Semibold font weight (default: 600)', NOW(), NOW()),
  
  -- Header/Navigation
  ('ui_header_background_color', '#ffffff', 'Header background color (default: white)', NOW(), NOW()),
  ('ui_header_text_color', '#111827', 'Header text color (default: gray-900)', NOW(), NOW()),
  ('ui_header_border_color', '#e5e7eb', 'Header border color (default: gray-200)', NOW(), NOW()),
  
  -- Cards and Content
  ('ui_card_background_color', '#ffffff', 'Card background color (default: white)', NOW(), NOW()),
  ('ui_card_border_color', '#e5e7eb', 'Card border color (default: gray-200)', NOW(), NOW()),
  ('ui_card_shadow', '0 1px 3px 0 rgb(0 0 0 / 0.1)', 'Card shadow (default: shadow-sm)', NOW(), NOW()),
  
  -- Buttons and Interactive Elements
  ('ui_primary_button_color', '#3b82f6', 'Primary button background color (default: blue-500)', NOW(), NOW()),
  ('ui_primary_button_hover_color', '#2563eb', 'Primary button hover color (default: blue-600)', NOW(), NOW()),
  ('ui_primary_button_text_color', '#ffffff', 'Primary button text color (default: white)', NOW(), NOW()),
  ('ui_secondary_button_color', '#6b7280', 'Secondary button background color (default: gray-500)', NOW(), NOW()),
  ('ui_secondary_button_hover_color', '#4b5563', 'Secondary button hover color (default: gray-600)', NOW(), NOW()),
  
  -- Status Colors
  ('ui_success_color', '#10b981', 'Success color (default: emerald-500)', NOW(), NOW()),
  ('ui_warning_color', '#f59e0b', 'Warning color (default: amber-500)', NOW(), NOW()),
  ('ui_error_color', '#ef4444', 'Error color (default: red-500)', NOW(), NOW()),
  ('ui_info_color', '#3b82f6', 'Info color (default: blue-500)', NOW(), NOW()),
  
  -- Background and Layout
  ('ui_page_background_color', '#f9fafb', 'Page background color (default: gray-50)', NOW(), NOW()),
  ('ui_content_background_color', '#ffffff', 'Content background color (default: white)', NOW(), NOW()),
  ('ui_border_radius', '0.5rem', 'Default border radius (default: 8px)', NOW(), NOW()),
  ('ui_spacing_unit', '4px', 'Base spacing unit (default: 4px)', NOW(), NOW()),
  
  -- Dark Mode Settings
  ('ui_dark_mode_enabled', 'true', 'Enable dark mode support (default: true)', NOW(), NOW()),
  ('ui_dark_sidebar_background', '#111827', 'Dark mode sidebar background (default: gray-900)', NOW(), NOW()),
  ('ui_dark_page_background', '#111827', 'Dark mode page background (default: gray-900)', NOW(), NOW()),
  ('ui_dark_card_background', '#1f2937', 'Dark mode card background (default: gray-800)', NOW(), NOW()),
  
  -- Custom CSS
  ('ui_custom_css', '', 'Custom CSS for additional styling', NOW(), NOW())
ON CONFLICT (key) DO NOTHING;

-- Create UI themes table for predefined themes
CREATE TABLE IF NOT EXISTS ui_themes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  settings JSONB NOT NULL,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default themes
INSERT INTO ui_themes (name, display_name, description, settings, is_default) VALUES
('default', 'Default Theme', 'Clean and professional default theme', '{
  "ui_sidebar_background_color": "#1f2937",
  "ui_sidebar_text_color": "#f9fafb",
  "ui_sidebar_hover_color": "#374151",
  "ui_sidebar_active_color": "#3b82f6",
  "ui_primary_button_color": "#3b82f6",
  "ui_primary_button_hover_color": "#2563eb"
}', true),

('dark', 'Dark Theme', 'Dark theme for reduced eye strain', '{
  "ui_sidebar_background_color": "#111827",
  "ui_sidebar_text_color": "#f9fafb",
  "ui_sidebar_hover_color": "#1f2937",
  "ui_sidebar_active_color": "#3b82f6",
  "ui_page_background_color": "#111827",
  "ui_card_background_color": "#1f2937",
  "ui_header_background_color": "#1f2937",
  "ui_header_text_color": "#f9fafb"
}', false),

('blue', 'Blue Theme', 'Professional blue color scheme', '{
  "ui_sidebar_background_color": "#1e3a8a",
  "ui_sidebar_text_color": "#dbeafe",
  "ui_sidebar_hover_color": "#1e40af",
  "ui_sidebar_active_color": "#60a5fa",
  "ui_primary_button_color": "#2563eb",
  "ui_primary_button_hover_color": "#1d4ed8"
}', false),

('green', 'Green Theme', 'Nature-inspired green theme', '{
  "ui_sidebar_background_color": "#14532d",
  "ui_sidebar_text_color": "#dcfce7",
  "ui_sidebar_hover_color": "#166534",
  "ui_sidebar_active_color": "#4ade80",
  "ui_primary_button_color": "#16a34a",
  "ui_primary_button_hover_color": "#15803d"
}', false);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ui_themes_name ON ui_themes(name);
CREATE INDEX IF NOT EXISTS idx_ui_themes_is_default ON ui_themes(is_default);
CREATE INDEX IF NOT EXISTS idx_ui_themes_is_active ON ui_themes(is_active);

-- Add RLS policies
ALTER TABLE ui_themes ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read themes
CREATE POLICY "Allow authenticated users to read ui_themes" ON ui_themes
  FOR SELECT TO authenticated USING (true);

-- Allow admins to manage themes (you may want to adjust this based on your role system)
CREATE POLICY "Allow admins to manage ui_themes" ON ui_themes
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.raw_user_meta_data->>'role' = 'admin' OR auth.users.raw_user_meta_data->>'role' = 'super_admin')
    )
  );
