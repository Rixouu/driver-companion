-- Fix footer font styling by removing hardcoded font-size and color
-- Let footers inherit the template's default styling

-- Update Japan Invoice Footer
UPDATE partial_templates 
SET content = '<!-- Footer -->
<tr>
  <td style="padding:32px 24px; background:#f8f9fa; border-top:1px solid #e2e8f0;">
    <div style="text-align:center;">
      <p style="margin: 0 0 10px 0; font-weight: bold;">
        ご利用いただきありがとうございます。
      </p>
      <p style="margin: 0 0 5px 0;">
        この請求書に関するお問い合わせは {{contact_email}} までご連絡ください。
      </p>
      <p style="margin: 10px 0 0 0;">
        {{company_name}} • www.japandriver.com
      </p>
    </div>
  </td>
</tr>'
WHERE type = 'footer' AND document_type = 'invoice' AND team = 'japan';

-- Update Japan Quotation Footer
UPDATE partial_templates 
SET content = '<!-- Footer -->
<tr>
  <td style="padding:32px 24px; background:#f8f9fa; border-top:1px solid #e2e8f0;">
    <div style="text-align:center;">
      <p style="margin: 0 0 10px 0; font-weight: bold;">
        ご利用いただきありがとうございます。
      </p>
      <p style="margin: 0 0 5px 0;">
        この見積書に関するお問い合わせは {{contact_email}} までご連絡ください。
      </p>
      <p style="margin: 10px 0 0 0;">
        {{company_name}} • www.japandriver.com
      </p>
    </div>
  </td>
</tr>'
WHERE type = 'footer' AND document_type = 'quotation' AND team = 'japan';

-- Update Thailand Invoice Footer
UPDATE partial_templates 
SET content = '<!-- Footer -->
<tr>
  <td style="padding:32px 24px; background:#f8f9fa; border-top:1px solid #e2e8f0;">
    <div style="text-align:center;">
      <p style="margin: 0 0 10px 0; font-weight: bold;">
        Thank you for your business!
      </p>
      <p style="margin: 0 0 5px 0;">
        If you have any questions about this invoice, please contact us at {{contact_email}}
      </p>
      <p style="margin: 10px 0 0 0;">
        {{company_name}} • www.japandriver.com
      </p>
    </div>
  </td>
</tr>'
WHERE type = 'footer' AND document_type = 'invoice' AND team = 'thailand';

-- Update Thailand Quotation Footer
UPDATE partial_templates 
SET content = '<!-- Footer -->
<tr>
  <td style="padding:32px 24px; background:#f8f9fa; border-top:1px solid #e2e8f0;">
    <div style="text-align:center;">
      <p style="margin: 0 0 10px 0; font-weight: bold;">
        Thank you for your business!
      </p>
      <p style="margin: 0 0 5px 0;">
        If you have any questions about this quotation, please contact us at {{contact_email}}
      </p>
      <p style="margin: 10px 0 0 0;">
        {{company_name}} • www.japandriver.com
      </p>
    </div>
  </td>
</tr>'
WHERE type = 'footer' AND document_type = 'quotation' AND team = 'thailand';
