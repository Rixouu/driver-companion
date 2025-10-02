-- Add missing 'both' team header partials to prevent fallback to hardcoded data
-- This fixes the header font-family issue when team = 'both'

-- Add Universal Quotation Header
INSERT INTO partial_templates (name, type, document_type, team, content, variables, is_active) VALUES 
(
  'Universal Team Address',
  'header',
  'quotation',
  'both',
  '<div style="padding:16px; background:#f8f9fa; border-radius:8px;">
    <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #111827; font-weight: 600;">Driver Company Limited</h3>
    <p style="margin: 0 0 4px 0; color: #111827; font-size: 13px; line-height: 1.4;">Global Service Provider</p>
    <p style="margin: 0 0 4px 0; color: #111827; font-size: 13px; line-height: 1.4;">Contact: {{contact_email}}</p>
    <p style="margin: 0; color: #111827; font-size: 13px;">www.japandriver.com</p>
  </div>',
  ARRAY['{{contact_email}}'],
  true
);

-- Add Universal Invoice Header
INSERT INTO partial_templates (name, type, document_type, team, content, variables, is_active) VALUES 
(
  'Universal Team Address',
  'header',
  'invoice',
  'both',
  '<div style="padding:16px; background:#f8f9fa; border-radius:8px;">
    <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #111827; font-weight: 600;">Driver Company Limited</h3>
    <p style="margin: 0 0 4px 0; color: #111827; font-size: 13px; line-height: 1.4;">Global Service Provider</p>
    <p style="margin: 0 0 4px 0; color: #111827; font-size: 13px; line-height: 1.4;">Contact: {{contact_email}}</p>
    <p style="margin: 0; color: #111827; font-size: 13px;">www.japandriver.com</p>
  </div>',
  ARRAY['{{contact_email}}'],
  true
);
