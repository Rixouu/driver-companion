-- Fix Japan invoice header - it currently has Thailand data
-- Update the existing Thailand Team Address for Japan invoice to be Japan Team Address

UPDATE partial_templates 
SET name = 'Japan Team Address',
content = '<!-- Japan Team Address -->
<div style="padding:16px; background:#f8f9fa; border-radius:8px;">
  <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #111827; font-weight: 600;">Driver (Japan) Company Limited</h3>
  <p style="margin: 0 0 4px 0; color: #111827; font-size: 13px; line-height: 1.4;">#47 11F TOC Bldg 7-22-17 Nishi-Gotanda</p>
  <p style="margin: 0 0 4px 0; color: #111827; font-size: 13px; line-height: 1.4;">Shinagawa-Ku Tokyo Japan 141-0031</p>
  <p style="margin: 0; color: #111827; font-size: 13px;">Tax ID: T2020001153198</p>
</div>',
variables = ARRAY['{{company_name}}', '{{company_address}}', '{{tax_id}}']
WHERE name = 'Thailand Team Address' AND document_type = 'invoice' AND team = 'japan';
