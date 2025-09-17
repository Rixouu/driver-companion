-- Add secondary button text color fields to UI customization
-- This migration adds the missing secondary button text color settings

-- Add secondary button text color for light mode
INSERT INTO app_settings (key, value, description, created_at, updated_at)
VALUES (
  'ui_secondary_button_text_color',
  '#262626',
  'Secondary button text color for light mode (default: gray-800)',
  NOW(),
  NOW()
) ON CONFLICT (key) DO NOTHING;

-- Add dark mode secondary button color
INSERT INTO app_settings (key, value, description, created_at, updated_at)
VALUES (
  'ui_dark_secondary_button_color',
  '#1a1a1a',
  'Dark mode secondary button background color (default: gray-800)',
  NOW(),
  NOW()
) ON CONFLICT (key) DO NOTHING;

-- Add dark mode secondary button text color
INSERT INTO app_settings (key, value, description, created_at, updated_at)
VALUES (
  'ui_dark_secondary_button_text_color',
  '#f2f2f2',
  'Dark mode secondary button text color (default: gray-100)',
  NOW(),
  NOW()
) ON CONFLICT (key) DO NOTHING;
