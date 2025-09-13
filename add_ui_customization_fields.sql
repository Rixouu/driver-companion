-- Add missing UI customization fields to app_settings table

-- Light Mode Sidebar Colors (Improved Contrast)
INSERT INTO app_settings (key, value, description) VALUES
('ui_sidebar_background_color', '#d9d9d9', 'Light mode sidebar background'),
('ui_sidebar_text_color', '#262626', 'Light mode sidebar text color'),
('ui_sidebar_hover_color', '#cccccc', 'Light mode sidebar hover color'),
('ui_sidebar_active_color', '#171717', 'Light mode sidebar active color'),
('ui_sidebar_border_color', '#bfbfbf', 'Light mode sidebar border color'),
('ui_main_layout_background', '#ffffff', 'Light mode main layout background'),

-- Typography
('ui_font_family', 'Noto Sans Thai', 'Font family'),
('ui_font_size_base', '14px', 'Base font size'),

-- Buttons
('ui_primary_button_color', '#171717', 'Primary button color'),
('ui_primary_button_text_color', '#fafafa', 'Primary button text color'),
('ui_secondary_button_color', '#f5f5f5', 'Secondary button color'),

-- Status Colors
('ui_success_color', '#16a34a', 'Success color'),
('ui_warning_color', '#eab308', 'Warning color'),
('ui_error_color', '#dc2626', 'Error color'),
('ui_info_color', '#3b82f6', 'Info color'),

-- Layout
('ui_page_background_color', '#ffffff', 'Page background color'),
('ui_card_background_color', '#ffffff', 'Card background color'),
('ui_card_border_color', '#e5e5e5', 'Card border color'),
('ui_border_radius', '0.5rem', 'Border radius'),

-- Dark Mode Colors
('ui_dark_sidebar_background', '#080808', 'Dark mode sidebar background'),
('ui_dark_sidebar_text_color', '#f2f2f2', 'Dark mode sidebar text color'),
('ui_dark_sidebar_hover_color', '#0f0f0f', 'Dark mode sidebar hover color'),
('ui_dark_sidebar_active_color', '#1a1a1a', 'Dark mode sidebar active color'),
('ui_dark_sidebar_border_color', '#0f0f0f', 'Dark mode sidebar border color'),
('ui_dark_page_background', '#050505', 'Dark mode page background'),
('ui_dark_main_layout_background', '#050505', 'Dark mode main layout background'),
('ui_dark_card_background', '#0a0a0a', 'Dark mode card background'),
('ui_dark_card_border_color', '#0f0f0f', 'Dark mode card border color'),
('ui_dark_primary_button_color', '#f2f2f2', 'Dark mode primary button color'),
('ui_dark_primary_button_text_color', '#050505', 'Dark mode primary button text color'),

-- Sidebar Logo
('ui_sidebar_logo_text', 'DRIVER', 'Sidebar logo text'),
('ui_sidebar_logo_color', '#dc2626', 'Sidebar logo color'),
('ui_sidebar_logo_image', '', 'Sidebar logo image (base64)'),

-- Menu Colors
('ui_menu_active_color', '#171717', 'Menu active background color'),
('ui_menu_hover_color', '#f5f5f5', 'Menu hover background color'),
('ui_content_background', '#FAFAFA', 'Content background color'),
('ui_card_border_width', '1px', 'Card border width'),
('ui_sidebar_font_size', '1rem', 'Sidebar font size'),
('ui_dark_menu_active_color', '#1a1a1a', 'Dark mode menu active background color'),
('ui_dark_menu_hover_color', '#0f0f0f', 'Dark mode menu hover background color'),
('ui_dark_content_background', '#111111', 'Dark mode content background color'),
('ui_dark_card_border_width', '1px', 'Dark mode card border width'),
('ui_dark_sidebar_font_size', '1rem', 'Dark mode sidebar font size'),

-- Custom CSS
('ui_custom_css', '', 'Custom CSS code')

ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  updated_at = NOW();
