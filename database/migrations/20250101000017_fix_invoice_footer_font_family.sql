-- Fix invoice footer font-family to match the invoice generator's font stack
-- This ensures consistent font-family between invoice and quotation templates

-- Update Japan Invoice Footer
UPDATE partial_templates 
SET content = '<p style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold; color: #111827; font-family: ''Noto Sans Thai'', ''Noto Sans'', ''Noto Sans JP'', -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial, sans-serif;">
    ご利用いただきありがとうございます。
  </p>
  <p style="margin: 0 0 5px 0; font-size: 13px; color: #111827; font-family: ''Noto Sans Thai'', ''Noto Sans'', ''Noto Sans JP'', -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial, sans-serif;">
    この請求書に関するお問い合わせは {{contact_email}} までご連絡ください。
  </p>
  <p style="margin: 10px 0 0 0; font-size: 13px; color: #666; font-family: ''Noto Sans Thai'', ''Noto Sans'', ''Noto Sans JP'', -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial, sans-serif;">
    {{company_name}} • www.japandriver.com
  </p>'
WHERE type = 'footer' AND document_type = 'invoice' AND team = 'japan';

-- Update Thailand Invoice Footer
UPDATE partial_templates 
SET content = '<p style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold; color: #111827; font-family: ''Noto Sans Thai'', ''Noto Sans'', ''Noto Sans JP'', -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial, sans-serif;">
    Thank you for your business!
  </p>
  <p style="margin: 0 0 5px 0; font-size: 13px; color: #111827; font-family: ''Noto Sans Thai'', ''Noto Sans'', ''Noto Sans JP'', -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial, sans-serif;">
    If you have any questions about this invoice, please contact us at {{contact_email}}
  </p>
  <p style="margin: 10px 0 0 0; font-size: 13px; color: #666; font-family: ''Noto Sans Thai'', ''Noto Sans'', ''Noto Sans JP'', -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial, sans-serif;">
    {{company_name}} • www.japandriver.com
  </p>'
WHERE type = 'footer' AND document_type = 'invoice' AND team = 'thailand';

-- Update Universal Invoice Footer
UPDATE partial_templates 
SET content = '<p style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold; color: #111827; font-family: ''Noto Sans Thai'', ''Noto Sans'', ''Noto Sans JP'', -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial, sans-serif;">
    Thank you for your business!
  </p>
  <p style="margin: 0 0 5px 0; font-size: 13px; color: #111827; font-family: ''Noto Sans Thai'', ''Noto Sans'', ''Noto Sans JP'', -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial, sans-serif;">
    If you have any questions about this invoice, please contact us at {{contact_email}}
  </p>
  <p style="margin: 10px 0 0 0; font-size: 13px; color: #666; font-family: ''Noto Sans Thai'', ''Noto Sans'', ''Noto Sans JP'', -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial, sans-serif;">
    {{company_name}} • www.japandriver.com
  </p>'
WHERE type = 'footer' AND document_type = 'invoice' AND team = 'both';
