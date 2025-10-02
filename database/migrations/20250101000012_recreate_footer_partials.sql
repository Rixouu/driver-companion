-- Delete all existing footer partials and recreate them properly
-- This fixes the table wrapper issue that was breaking the HTML structure

-- Delete all footer partials
DELETE FROM partial_templates WHERE type = 'footer';

-- Reinsert Japan Quotation Footer (correct format - just <p> tags)
INSERT INTO partial_templates (name, type, document_type, team, content, variables, is_active) VALUES
(
  'Japan Quotation Footer',
  'footer',
  'quotation',
  'japan',
  '<p style="margin: 0 0 10px 0; font-weight: bold;">
    ご利用いただきありがとうございます。
  </p>
  <p style="margin: 0 0 5px 0;">
    この見積書に関するお問い合わせは {{contact_email}} までご連絡ください。
  </p>
  <p style="margin: 10px 0 0 0;">
    {{company_name}} • www.japandriver.com
  </p>',
  ARRAY['{{contact_email}}', '{{company_name}}'],
  true
);

-- Reinsert Japan Invoice Footer (correct format - just <p> tags)
INSERT INTO partial_templates (name, type, document_type, team, content, variables, is_active) VALUES
(
  'Japan Invoice Footer',
  'footer',
  'invoice',
  'japan',
  '<p style="margin: 0 0 10px 0; font-weight: bold;">
    ご利用いただきありがとうございます。
  </p>
  <p style="margin: 0 0 5px 0;">
    この請求書に関するお問い合わせは {{contact_email}} までご連絡ください。
  </p>
  <p style="margin: 10px 0 0 0;">
    {{company_name}} • www.japandriver.com
  </p>',
  ARRAY['{{contact_email}}', '{{company_name}}'],
  true
);

-- Reinsert Thailand Quotation Footer (correct format - just <p> tags)
INSERT INTO partial_templates (name, type, document_type, team, content, variables, is_active) VALUES
(
  'Thailand Quotation Footer',
  'footer',
  'quotation',
  'thailand',
  '<p style="margin: 0 0 10px 0; font-weight: bold;">
    Thank you for your business!
  </p>
  <p style="margin: 0 0 5px 0;">
    If you have any questions about this quotation, please contact us at {{contact_email}}
  </p>
  <p style="margin: 10px 0 0 0;">
    {{company_name}} • www.japandriver.com
  </p>',
  ARRAY['{{contact_email}}', '{{company_name}}'],
  true
);

-- Reinsert Thailand Invoice Footer (correct format - just <p> tags)
INSERT INTO partial_templates (name, type, document_type, team, content, variables, is_active) VALUES
(
  'Thailand Invoice Footer',
  'footer',
  'invoice',
  'thailand',
  '<p style="margin: 0 0 10px 0; font-weight: bold;">
    Thank you for your business!
  </p>
  <p style="margin: 0 0 5px 0;">
    If you have any questions about this invoice, please contact us at {{contact_email}}
  </p>
  <p style="margin: 10px 0 0 0;">
    {{company_name}} • www.japandriver.com
  </p>',
  ARRAY['{{contact_email}}', '{{company_name}}'],
  true
);
