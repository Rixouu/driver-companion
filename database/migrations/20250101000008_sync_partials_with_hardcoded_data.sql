-- Sync database partials with hardcoded team addresses data
-- This ensures the database partials match exactly what's in lib/team-addresses.ts

-- Update Japan Team Address for Quotation
UPDATE partial_templates 
SET content = '<!-- Japan Team Address -->
<div style="padding:16px; background:#f8f9fa; border-radius:8px;">
  <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #111827; font-weight: 600;">Driver (Japan) Company Limited</h3>
  <p style="margin: 0 0 4px 0; color: #111827; font-size: 13px; line-height: 1.4;">#47 11F TOC Bldg 7-22-17 Nishi-Gotanda</p>
  <p style="margin: 0 0 4px 0; color: #111827; font-size: 13px; line-height: 1.4;">Shinagawa-Ku Tokyo Japan 141-0031</p>
  <p style="margin: 0; color: #111827; font-size: 13px;">Tax ID: T2020001153198</p>
</div>',
variables = ARRAY['{{company_name}}', '{{company_address}}', '{{tax_id}}']
WHERE name = 'Japan Team Address' AND document_type = 'quotation';

-- Update Japan Team Address for Invoice
UPDATE partial_templates 
SET content = '<!-- Japan Team Address -->
<div style="padding:16px; background:#f8f9fa; border-radius:8px;">
  <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #111827; font-weight: 600;">Driver (Japan) Company Limited</h3>
  <p style="margin: 0 0 4px 0; color: #111827; font-size: 13px; line-height: 1.4;">#47 11F TOC Bldg 7-22-17 Nishi-Gotanda</p>
  <p style="margin: 0 0 4px 0; color: #111827; font-size: 13px; line-height: 1.4;">Shinagawa-Ku Tokyo Japan 141-0031</p>
  <p style="margin: 0; color: #111827; font-size: 13px;">Tax ID: T2020001153198</p>
</div>',
variables = ARRAY['{{company_name}}', '{{company_address}}', '{{tax_id}}']
WHERE name = 'Japan Team Address' AND document_type = 'invoice';

-- Update Thailand Team Address for Quotation
UPDATE partial_templates 
SET content = '<!-- Thailand Team Address -->
<div style="padding:16px; background:#f8f9fa; border-radius:8px;">
  <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #111827; font-weight: 600;">Driver (Thailand) Company Limited</h3>
  <p style="margin: 0 0 4px 0; color: #111827; font-size: 13px; line-height: 1.4;">580/17 Soi Ramkhamhaeng 39</p>
  <p style="margin: 0 0 4px 0; color: #111827; font-size: 13px; line-height: 1.4;">Wang Thong Lang, Bangkok 10310, Thailand</p>
  <p style="margin: 0; color: #111827; font-size: 13px;">Tax ID: 0105566135845</p>
</div>',
variables = ARRAY['{{company_name}}', '{{company_address}}', '{{tax_id}}']
WHERE name = 'Thailand Team Address' AND document_type = 'quotation';

-- Update Thailand Team Address for Invoice
UPDATE partial_templates 
SET content = '<!-- Thailand Team Address -->
<div style="padding:16px; background:#f8f9fa; border-radius:8px;">
  <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #111827; font-weight: 600;">Driver (Thailand) Company Limited</h3>
  <p style="margin: 0 0 4px 0; color: #111827; font-size: 13px; line-height: 1.4;">580/17 Soi Ramkhamhaeng 39</p>
  <p style="margin: 0 0 4px 0; color: #111827; font-size: 13px; line-height: 1.4;">Wang Thong Lang, Bangkok 10310, Thailand</p>
  <p style="margin: 0; color: #111827; font-size: 13px;">Tax ID: 0105566135845</p>
</div>',
variables = ARRAY['{{company_name}}', '{{company_address}}', '{{tax_id}}']
WHERE name = 'Thailand Team Address' AND document_type = 'invoice';

-- Update Japan Quotation Footer to match hardcoded data
UPDATE partial_templates 
SET content = '<!-- Japan Quotation Footer -->
<tr>
  <td style="padding:32px 24px; background:#f8f9fa; border-top:1px solid #e2e8f0;">
    <div style="text-align:center;">
      <p style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold; color: #111827;">
        ご利用いただきありがとうございます。
      </p>
      <p style="margin: 0 0 5px 0; font-size: 13px; color: #111827;">
        この見積書に関するお問い合わせは booking@japandriver.com までご連絡ください。
      </p>
      <p style="margin: 10px 0 0 0; font-size: 13px; color: #666;">
        Driver (Japan) Company Limited • www.japandriver.com
      </p>
    </div>
  </td>
</tr>',
variables = ARRAY['{{contact_email}}', '{{company_name}}']
WHERE name = 'Japan Quotation Footer';

-- Update Japan Invoice Footer to match hardcoded data
UPDATE partial_templates 
SET content = '<!-- Japan Invoice Footer -->
<tr>
  <td style="padding:32px 24px; background:#f8f9fa; border-top:1px solid #e2e8f0;">
    <div style="text-align:center;">
      <p style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold; color: #111827;">
        ご利用いただきありがとうございます。
      </p>
      <p style="margin: 0 0 5px 0; font-size: 13px; color: #111827;">
        この請求書に関するお問い合わせは booking@japandriver.com までご連絡ください。
      </p>
      <p style="margin: 10px 0 0 0; font-size: 13px; color: #666;">
        Driver (Japan) Company Limited • www.japandriver.com
      </p>
    </div>
  </td>
</tr>',
variables = ARRAY['{{contact_email}}', '{{company_name}}']
WHERE name = 'Japan Invoice Footer';

-- Update Thailand Quotation Footer to match hardcoded data
UPDATE partial_templates 
SET content = '<!-- Thailand Quotation Footer -->
<tr>
  <td style="padding:32px 24px; background:#f8f9fa; border-top:1px solid #e2e8f0;">
    <div style="text-align:center;">
      <p style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold; color: #111827;">
        Thank you for your business!
      </p>
      <p style="margin: 0 0 5px 0; font-size: 13px; color: #111827;">
        If you have any questions about this quotation, please contact us at booking@japandriver.com
      </p>
      <p style="margin: 10px 0 0 0; font-size: 13px; color: #666;">
        Driver (Thailand) Company Limited • www.japandriver.com
      </p>
    </div>
  </td>
</tr>',
variables = ARRAY['{{contact_email}}', '{{company_name}}']
WHERE name = 'Thailand Quotation Footer';

-- Update Thailand Invoice Footer to match hardcoded data
UPDATE partial_templates 
SET content = '<!-- Thailand Invoice Footer -->
<tr>
  <td style="padding:32px 24px; background:#f8f9fa; border-top:1px solid #e2e8f0;">
    <div style="text-align:center;">
      <p style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold; color: #111827;">
        Thank you for your business!
      </p>
      <p style="margin: 0 0 5px 0; font-size: 13px; color: #111827;">
        If you have any questions about this invoice, please contact us at booking@japandriver.com
      </p>
      <p style="margin: 10px 0 0 0; font-size: 13px; color: #666;">
        Driver (Thailand) Company Limited • www.japandriver.com
      </p>
    </div>
  </td>
</tr>',
variables = ARRAY['{{contact_email}}', '{{company_name}}']
WHERE name = 'Thailand Invoice Footer';
