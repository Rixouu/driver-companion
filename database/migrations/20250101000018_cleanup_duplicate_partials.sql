-- Clean up all duplicate partials and keep only one of each unique combination
-- This fixes the duplicate entries issue in the partials management interface

-- Delete all existing partials
DELETE FROM partial_templates;

-- Reinsert clean, unique partials for headers
INSERT INTO partial_templates (name, type, document_type, team, content, variables, is_active) VALUES 
-- Japan Quotation Header
(
  'Japan Quotation Header',
  'header',
  'quotation',
  'japan',
  '<div style="padding:16px; background:#f8f9fa; border-radius:8px;">
    <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #111827; font-weight: 600;">Driver (Japan) Company Limited</h3>
    <p style="margin: 0 0 4px 0; color: #111827; font-size: 13px; line-height: 1.4;">#47 11F TOC Bldg 7-22-17 Nishi-Gotanda</p>
    <p style="margin: 0 0 4px 0; color: #111827; font-size: 13px; line-height: 1.4;">Shinagawa-Ku Tokyo Japan 141-0031</p>
    <p style="margin: 0; color: #111827; font-size: 13px;">Tax ID: T2020001153198</p>
  </div>',
  ARRAY['{{company_name}}', '{{company_address}}', '{{tax_id}}'],
  true
),

-- Japan Invoice Header
(
  'Japan Invoice Header',
  'header',
  'invoice',
  'japan',
  '<div style="padding:16px; background:#f8f9fa; border-radius:8px;">
    <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #111827; font-weight: 600;">Driver (Japan) Company Limited</h3>
    <p style="margin: 0 0 4px 0; color: #111827; font-size: 13px; line-height: 1.4;">#47 11F TOC Bldg 7-22-17 Nishi-Gotanda</p>
    <p style="margin: 0 0 4px 0; color: #111827; font-size: 13px; line-height: 1.4;">Shinagawa-Ku Tokyo Japan 141-0031</p>
    <p style="margin: 0; color: #111827; font-size: 13px;">Tax ID: T2020001153198</p>
  </div>',
  ARRAY['{{company_name}}', '{{company_address}}', '{{tax_id}}'],
  true
),

-- Thailand Quotation Header
(
  'Thailand Quotation Header',
  'header',
  'quotation',
  'thailand',
  '<div style="padding:16px; background:#f8f9fa; border-radius:8px;">
    <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #111827; font-weight: 600;">Driver (Thailand) Company Limited</h3>
    <p style="margin: 0 0 4px 0; color: #111827; font-size: 13px; line-height: 1.4;">580/17 Soi Ramkhamhaeng 39</p>
    <p style="margin: 0 0 4px 0; color: #111827; font-size: 13px; line-height: 1.4;">Wang Thong Lang, Bangkok 10310, Thailand</p>
    <p style="margin: 0; color: #111827; font-size: 13px;">Tax ID: 0105566135845</p>
  </div>',
  ARRAY['{{company_name}}', '{{company_address}}', '{{tax_id}}'],
  true
),

-- Thailand Invoice Header
(
  'Thailand Invoice Header',
  'header',
  'invoice',
  'thailand',
  '<div style="padding:16px; background:#f8f9fa; border-radius:8px;">
    <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #111827; font-weight: 600;">Driver (Thailand) Company Limited</h3>
    <p style="margin: 0 0 4px 0; color: #111827; font-size: 13px; line-height: 1.4;">580/17 Soi Ramkhamhaeng 39</p>
    <p style="margin: 0 0 4px 0; color: #111827; font-size: 13px; line-height: 1.4;">Wang Thong Lang, Bangkok 10310, Thailand</p>
    <p style="margin: 0; color: #111827; font-size: 13px;">Tax ID: 0105566135845</p>
  </div>',
  ARRAY['{{company_name}}', '{{company_address}}', '{{tax_id}}'],
  true
),

-- Universal Quotation Header
(
  'Universal Quotation Header',
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
),

-- Universal Invoice Header
(
  'Universal Invoice Header',
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

-- Insert footers
INSERT INTO partial_templates (name, type, document_type, team, content, variables, is_active) VALUES 
-- Japan Quotation Footer
(
  'Japan Quotation Footer',
  'footer',
  'quotation',
  'japan',
  '<p style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold; color: #111827;">
    ご利用いただきありがとうございます。
  </p>
  <p style="margin: 0 0 5px 0; font-size: 13px; color: #111827;">
    この見積書に関するお問い合わせは {{contact_email}} までご連絡ください。
  </p>
  <p style="margin: 10px 0 0 0; font-size: 13px; color: #666;">
    {{company_name}} • www.japandriver.com
  </p>',
  ARRAY['{{contact_email}}', '{{company_name}}'],
  true
),

-- Japan Invoice Footer
(
  'Japan Invoice Footer',
  'footer',
  'invoice',
  'japan',
  '<p style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold; color: #111827; font-family: ''Noto Sans Thai'', ''Noto Sans'', ''Noto Sans JP'', -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial, sans-serif;">
    ご利用いただきありがとうございます。
  </p>
  <p style="margin: 0 0 5px 0; font-size: 13px; color: #111827; font-family: ''Noto Sans Thai'', ''Noto Sans'', ''Noto Sans JP'', -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial, sans-serif;">
    この請求書に関するお問い合わせは {{contact_email}} までご連絡ください。
  </p>
  <p style="margin: 10px 0 0 0; font-size: 13px; color: #666; font-family: ''Noto Sans Thai'', ''Noto Sans'', ''Noto Sans JP'', -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial, sans-serif;">
    {{company_name}} • www.japandriver.com
  </p>',
  ARRAY['{{contact_email}}', '{{company_name}}'],
  true
),

-- Thailand Quotation Footer
(
  'Thailand Quotation Footer',
  'footer',
  'quotation',
  'thailand',
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
),

-- Thailand Invoice Footer
(
  'Thailand Invoice Footer',
  'footer',
  'invoice',
  'thailand',
  '<p style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold; color: #111827; font-family: ''Noto Sans Thai'', ''Noto Sans'', ''Noto Sans JP'', -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial, sans-serif;">
    Thank you for your business!
  </p>
  <p style="margin: 0 0 5px 0; font-size: 13px; color: #111827; font-family: ''Noto Sans Thai'', ''Noto Sans'', ''Noto Sans JP'', -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial, sans-serif;">
    If you have any questions about this invoice, please contact us at {{contact_email}}
  </p>
  <p style="margin: 10px 0 0 0; font-size: 13px; color: #666; font-family: ''Noto Sans Thai'', ''Noto Sans'', ''Noto Sans JP'', -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial, sans-serif;">
    {{company_name}} • www.japandriver.com
  </p>',
  ARRAY['{{contact_email}}', '{{company_name}}'],
  true
),

-- Universal Quotation Footer
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
),

-- Universal Invoice Footer
(
  'Universal Invoice Footer',
  'footer',
  'invoice',
  'both',
  '<p style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold; color: #111827; font-family: ''Noto Sans Thai'', ''Noto Sans'', ''Noto Sans JP'', -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial, sans-serif;">
    Thank you for your business!
  </p>
  <p style="margin: 0 0 5px 0; font-size: 13px; color: #111827; font-family: ''Noto Sans Thai'', ''Noto Sans'', ''Noto Sans JP'', -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial, sans-serif;">
    If you have any questions about this invoice, please contact us at {{contact_email}}
  </p>
  <p style="margin: 10px 0 0 0; font-size: 13px; color: #666; font-family: ''Noto Sans Thai'', ''Noto Sans'', ''Noto Sans JP'', -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial, sans-serif;">
    {{company_name}} • www.japandriver.com
  </p>',
  ARRAY['{{contact_email}}', '{{company_name}}'],
  true
);
