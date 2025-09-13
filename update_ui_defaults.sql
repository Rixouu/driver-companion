-- Update UI customization settings with ACTUAL values from globals.css (converted to hex)
-- This ensures the UI customization matches the current interface

-- Update sidebar colors to match globals.css :root (converted to hex)
UPDATE app_settings 
SET value = '#fafafa', updated_at = NOW()
WHERE key = 'ui_sidebar_background_color';

UPDATE app_settings 
SET value = '#404040', updated_at = NOW()
WHERE key = 'ui_sidebar_text_color';

UPDATE app_settings 
SET value = '#f5f5f5', updated_at = NOW()
WHERE key = 'ui_sidebar_hover_color';

UPDATE app_settings 
SET value = '#1a1a1a', updated_at = NOW()
WHERE key = 'ui_sidebar_active_color';

UPDATE app_settings 
SET value = '#e5e5e5', updated_at = NOW()
WHERE key = 'ui_sidebar_border_color';

-- Update typography to match globals.css
UPDATE app_settings 
SET value = 'Noto Sans Thai', updated_at = NOW()
WHERE key = 'ui_font_family';

-- Update header/navigation colors to match globals.css :root (converted to hex)
UPDATE app_settings 
SET value = '#ffffff', updated_at = NOW()
WHERE key = 'ui_header_background_color';

UPDATE app_settings 
SET value = '#0a0a0a', updated_at = NOW()
WHERE key = 'ui_header_text_color';

UPDATE app_settings 
SET value = '#e5e5e5', updated_at = NOW()
WHERE key = 'ui_header_border_color';

-- Update card colors to match globals.css :root (converted to hex)
UPDATE app_settings 
SET value = '#ffffff', updated_at = NOW()
WHERE key = 'ui_card_background_color';

UPDATE app_settings 
SET value = '#e5e5e5', updated_at = NOW()
WHERE key = 'ui_card_border_color';

-- Update button colors to match globals.css :root (converted to hex)
UPDATE app_settings 
SET value = '#171717', updated_at = NOW()
WHERE key = 'ui_primary_button_color';

UPDATE app_settings 
SET value = '#0f0f0f', updated_at = NOW()
WHERE key = 'ui_primary_button_hover_color';

UPDATE app_settings 
SET value = '#fafafa', updated_at = NOW()
WHERE key = 'ui_primary_button_text_color';

UPDATE app_settings 
SET value = '#f5f5f5', updated_at = NOW()
WHERE key = 'ui_secondary_button_color';

UPDATE app_settings 
SET value = '#e5e5e5', updated_at = NOW()
WHERE key = 'ui_secondary_button_hover_color';

-- Update status colors to match globals.css :root (converted to hex)
UPDATE app_settings 
SET value = '#16a34a', updated_at = NOW()
WHERE key = 'ui_success_color';

UPDATE app_settings 
SET value = '#eab308', updated_at = NOW()
WHERE key = 'ui_warning_color';

UPDATE app_settings 
SET value = '#dc2626', updated_at = NOW()
WHERE key = 'ui_error_color';

UPDATE app_settings 
SET value = '#3b82f6', updated_at = NOW()
WHERE key = 'ui_info_color';

-- Update layout colors to match globals.css :root (converted to hex)
UPDATE app_settings 
SET value = '#ffffff', updated_at = NOW()
WHERE key = 'ui_page_background_color';

UPDATE app_settings 
SET value = '#ffffff', updated_at = NOW()
WHERE key = 'ui_content_background_color';

-- Update dark mode colors to match globals.css .dark (converted to hex)
UPDATE app_settings 
SET value = '#1a1a1a', updated_at = NOW()
WHERE key = 'ui_dark_sidebar_background';

UPDATE app_settings 
SET value = '#0a0a0a', updated_at = NOW()
WHERE key = 'ui_dark_page_background';

UPDATE app_settings 
SET value = '#0a0a0a', updated_at = NOW()
WHERE key = 'ui_dark_card_background';
