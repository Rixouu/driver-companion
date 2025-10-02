-- Team Address sections for headers and footers
-- These are the team address parts that get switched in header/footer templates

-- Japan Team Address - Used in both header and footer
UPDATE partial_templates 
SET content = '<!-- Japan Team Address -->
<div style="padding:16px; background:#f8f9fa; border-radius:8px;">
  <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #111827; font-weight: 600;">Driver (Japan) Company Limited</h3>
  <p style="margin: 0 0 4px 0; color: #111827; font-size: 13px; line-height: 1.4;">#47 11F TOC Bldg 7-22-17 Nishi-Gotanda, Shinagawa-Ku Tokyo Japan 141-0031</p>
  <p style="margin: 0; color: #111827; font-size: 13px;">Tel: +81-3-1234-5678 | Email: booking@japandriver.com</p>
</div>',
variables = ARRAY['{{company_name}}', '{{company_address}}', '{{tax_id}}']
WHERE name = 'Japan Quotation Header';

-- Thailand Team Address - Used in both header and footer  
UPDATE partial_templates 
SET content = '<!-- Thailand Team Address -->
<div style="padding:16px; background:#f8f9fa; border-radius:8px;">
  <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #111827; font-weight: 600;">Driver (Thailand) Company Limited</h3>
  <p style="margin: 0 0 4px 0; color: #111827; font-size: 13px; line-height: 1.4;">580/17 Soi Ramkhamhaeng 39, Wang Thong Lang, Bangkok 10310, Thailand</p>
  <p style="margin: 0; color: #111827; font-size: 13px;">Tel: +81-3-1234-5678 | Email: booking@japandriver.com</p>
</div>',
variables = ARRAY['{{company_name}}', '{{company_address}}', '{{tax_id}}']
WHERE name = 'Japan Invoice Header';

-- Thailand Team Address - Used in both header and footer
UPDATE partial_templates 
SET content = '<!-- Thailand Team Address -->
<div style="padding:16px; background:#f8f9fa; border-radius:8px;">
  <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #111827; font-weight: 600;">Driver (Thailand) Company Limited</h3>
  <p style="margin: 0 0 4px 0; color: #111827; font-size: 13px; line-height: 1.4;">580/17 Soi Ramkhamhaeng 39, Wang Thong Lang, Bangkok 10310, Thailand</p>
  <p style="margin: 0; color: #111827; font-size: 13px;">Tel: +81-3-1234-5678 | Email: booking@japandriver.com</p>
</div>',
variables = ARRAY['{{company_name}}', '{{company_address}}', '{{tax_id}}']
WHERE name = 'Thailand Invoice Header';

-- Universal Team Address - Default Japan address
UPDATE partial_templates 
SET content = '<!-- Universal Team Address -->
<div style="padding:16px; background:#f8f9fa; border-radius:8px;">
  <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #111827; font-weight: 600;">Driver (Japan) Company Limited</h3>
  <p style="margin: 0 0 4px 0; color: #111827; font-size: 13px; line-height: 1.4;">#47 11F TOC Bldg 7-22-17 Nishi-Gotanda, Shinagawa-Ku Tokyo Japan 141-0031</p>
  <p style="margin: 0; color: #111827; font-size: 13px;">Tel: +81-3-1234-5678 | Email: booking@japandriver.com</p>
</div>',
variables = ARRAY['{{company_name}}', '{{company_address}}', '{{tax_id}}']
WHERE name = 'Universal Header';

-- Update the names to reflect they are team address sections
UPDATE partial_templates SET name = 'Japan Team Address' WHERE name = 'Japan Quotation Header';
UPDATE partial_templates SET name = 'Thailand Team Address' WHERE name = 'Japan Invoice Header';
UPDATE partial_templates SET name = 'Thailand Team Address' WHERE name = 'Thailand Invoice Header';
UPDATE partial_templates SET name = 'Universal Team Address' WHERE name = 'Universal Header';
