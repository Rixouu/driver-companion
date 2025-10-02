-- Remove duplicate footer records and keep only one of each
-- This fixes the "contains 2 rows" error when using .single()

-- Delete all existing 'both' team footers
DELETE FROM partial_templates WHERE team = 'both';

-- Reinsert single Universal Quotation Footer
INSERT INTO partial_templates (name, type, document_type, team, content, variables, is_active) VALUES 
(
  'Universal Quotation Footer',
  'footer',
  'quotation',
  'both',
  '<p style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold; color: #111827;">
    Thank you for your business!
  </p>
  <p style="margin: 0 0 5px 0; font-size: 13px; color: #111827;">
    If you have any questions about this quotation, please contact us at {{contact_email}}
  </p>
  <p style="margin: 10px 0 0 0; font-size: 13px; color: #666;">
    {{company_name}} • www.japandriver.com
  </p>',
  ARRAY['{{contact_email}}', '{{company_name}}'],
  true
);

-- Reinsert single Universal Invoice Footer
INSERT INTO partial_templates (name, type, document_type, team, content, variables, is_active) VALUES 
(
  'Universal Invoice Footer',
  'footer',
  'invoice',
  'both',
  '<p style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold; color: #111827;">
    Thank you for your business!
  </p>
  <p style="margin: 0 0 5px 0; font-size: 13px; color: #111827;">
    If you have any questions about this invoice, please contact us at {{contact_email}}
  </p>
  <p style="margin: 10px 0 0 0; font-size: 13px; color: #666;">
    {{company_name}} • www.japandriver.com
  </p>',
  ARRAY['{{contact_email}}', '{{company_name}}'],
  true
);
