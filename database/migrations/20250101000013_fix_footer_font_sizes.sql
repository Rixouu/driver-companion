-- Fix footer font sizes to match the original hardcoded values
-- First line: 14px, other lines: 13px

-- Update Japan Quotation Footer
UPDATE partial_templates 
SET content = '<p style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold; color: #111827;">
    ご利用いただきありがとうございます。
  </p>
  <p style="margin: 0 0 5px 0; font-size: 13px; color: #111827;">
    この見積書に関するお問い合わせは {{contact_email}} までご連絡ください。
  </p>
  <p style="margin: 10px 0 0 0; font-size: 13px; color: #666;">
    {{company_name}} • www.japandriver.com
  </p>'
WHERE type = 'footer' AND document_type = 'quotation' AND team = 'japan';

-- Update Japan Invoice Footer
UPDATE partial_templates 
SET content = '<p style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold; color: #111827;">
    ご利用いただきありがとうございます。
  </p>
  <p style="margin: 0 0 5px 0; font-size: 13px; color: #111827;">
    この請求書に関するお問い合わせは {{contact_email}} までご連絡ください。
  </p>
  <p style="margin: 10px 0 0 0; font-size: 13px; color: #666;">
    {{company_name}} • www.japandriver.com
  </p>'
WHERE type = 'footer' AND document_type = 'invoice' AND team = 'japan';

-- Update Thailand Quotation Footer
UPDATE partial_templates 
SET content = '<p style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold; color: #111827;">
    Thank you for your business!
  </p>
  <p style="margin: 0 0 5px 0; font-size: 13px; color: #111827;">
    If you have any questions about this quotation, please contact us at {{contact_email}}
  </p>
  <p style="margin: 10px 0 0 0; font-size: 13px; color: #666;">
    {{company_name}} • www.japandriver.com
  </p>'
WHERE type = 'footer' AND document_type = 'quotation' AND team = 'thailand';

-- Update Thailand Invoice Footer
UPDATE partial_templates 
SET content = '<p style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold; color: #111827;">
    Thank you for your business!
  </p>
  <p style="margin: 0 0 5px 0; font-size: 13px; color: #111827;">
    If you have any questions about this invoice, please contact us at {{contact_email}}
  </p>
  <p style="margin: 10px 0 0 0; font-size: 13px; color: #666;">
    {{company_name}} • www.japandriver.com
  </p>'
WHERE type = 'footer' AND document_type = 'invoice' AND team = 'thailand';
