-- Add email partials and styling fields to app_settings
-- This allows customization of email header, footer, and CSS styling

-- Add email header template field
INSERT INTO app_settings (key, value, description, created_at, updated_at)
VALUES (
  'email_header_template',
  '',
  'Custom email header HTML template. Leave empty to use default. Available variables: {{company_name}}, {{company_logo}}, {{primary_color}}, {{title}}, {{subtitle}}',
  NOW(),
  NOW()
) ON CONFLICT (key) DO NOTHING;

-- Add email footer template field  
INSERT INTO app_settings (key, value, description, created_at, updated_at)
VALUES (
  'email_footer_template',
  '',
  'Custom email footer HTML template. Leave empty to use default. Available variables: {{company_name}}, {{support_email}}, {{primary_color}}, {{team}}, {{language}}',
  NOW(),
  NOW()
) ON CONFLICT (key) DO NOTHING;

-- Add email CSS styling field
INSERT INTO app_settings (key, value, description, created_at, updated_at)
VALUES (
  'email_css_styling',
  '',
  'Custom CSS styles for email templates. This will be injected into the <style> tag. Note: Email clients have limited CSS support.',
  NOW(),
  NOW()
) ON CONFLICT (key) DO NOTHING;

-- Add email template variables field
INSERT INTO app_settings (key, value, description, created_at, updated_at)
VALUES (
  'email_template_variables',
  '{"company_name": "string", "company_logo": "string", "primary_color": "string", "support_email": "string", "from_email": "string", "title": "string", "subtitle": "string", "team": "string", "language": "string"}',
  'Available variables for email templates (JSON format)',
  NOW(),
  NOW()
) ON CONFLICT (key) DO NOTHING;
