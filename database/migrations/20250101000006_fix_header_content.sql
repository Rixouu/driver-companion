-- Fix header content to be meaningful and show actual company information
-- Make headers actually useful with company addresses and clear structure

-- Update Japan Quotation PDF Header with proper company info
UPDATE partial_templates 
SET content = '<!-- Japan Quotation PDF Header -->
<tr>
  <td style="background:linear-gradient(135deg,{{primary_color}} 0%,{{secondary_color}} 100%); padding:24px;">
    <table width="100%" role="presentation">
      <tr>
        <td align="center">
          <!-- Logo and Company Name -->
          <table cellpadding="0" cellspacing="0" style="background:#FFFFFF; border-radius:50%; width:64px; height:64px; margin:0 auto 16px;">
            <tr><td align="center" valign="middle" style="text-align:center;">
                <img src="{{logo_url}}" width="48" height="48" alt="Driver logo" style="display:block; margin:0 auto;">
            </td></tr>
          </table>
          <h1 style="margin:0; font-size:28px; color:#FFF; font-weight:600;">
            {{company_name}}
          </h1>
          <p style="margin:8px 0 0; font-size:16px; color:rgba(255,255,255,0.9);">
            {{company_address}}
          </p>
          <p style="margin:4px 0 0; font-size:14px; color:rgba(255,255,255,0.8);">
            Tel: {{company_phone}} | Email: {{company_email}}
          </p>
        </td>
      </tr>
    </table>
  </td>
</tr>',
variables = ARRAY['{{primary_color}}', '{{secondary_color}}', '{{logo_url}}', '{{company_name}}', '{{company_address}}', '{{company_phone}}', '{{company_email}}']
WHERE name = 'Japan Quotation Header';

-- Update Japan Invoice PDF Header with proper company info
UPDATE partial_templates 
SET content = '<!-- Japan Invoice PDF Header -->
<tr>
  <td style="background:linear-gradient(135deg,{{primary_color}} 0%,{{secondary_color}} 100%); padding:24px;">
    <table width="100%" role="presentation">
      <tr>
        <td align="center">
          <!-- Logo and Company Name -->
          <table cellpadding="0" cellspacing="0" style="background:#FFFFFF; border-radius:50%; width:64px; height:64px; margin:0 auto 16px;">
            <tr><td align="center" valign="middle" style="text-align:center;">
                <img src="{{logo_url}}" width="48" height="48" alt="Driver logo" style="display:block; margin:0 auto;">
            </td></tr>
          </table>
          <h1 style="margin:0; font-size:28px; color:#FFF; font-weight:600;">
            {{company_name}}
          </h1>
          <p style="margin:8px 0 0; font-size:16px; color:rgba(255,255,255,0.9);">
            {{company_address}}
          </p>
          <p style="margin:4px 0 0; font-size:14px; color:rgba(255,255,255,0.8);">
            Tel: {{company_phone}} | Email: {{company_email}}
          </p>
        </td>
      </tr>
    </table>
  </td>
</tr>',
variables = ARRAY['{{primary_color}}', '{{secondary_color}}', '{{logo_url}}', '{{company_name}}', '{{company_address}}', '{{company_phone}}', '{{company_email}}']
WHERE name = 'Japan Invoice Header';

-- Update Thailand Invoice PDF Header with proper company info
UPDATE partial_templates 
SET content = '<!-- Thailand Invoice PDF Header -->
<tr>
  <td style="background:linear-gradient(135deg,{{primary_color}} 0%,{{secondary_color}} 100%); padding:24px;">
    <table width="100%" role="presentation">
      <tr>
        <td align="center">
          <!-- Logo and Company Name -->
          <table cellpadding="0" cellspacing="0" style="background:#FFFFFF; border-radius:50%; width:64px; height:64px; margin:0 auto 16px;">
            <tr><td align="center" valign="middle" style="text-align:center;">
                <img src="{{logo_url}}" width="48" height="48" alt="Driver logo" style="display:block; margin:0 auto;">
            </td></tr>
          </table>
          <h1 style="margin:0; font-size:28px; color:#FFF; font-weight:600;">
            {{company_name}}
          </h1>
          <p style="margin:8px 0 0; font-size:16px; color:rgba(255,255,255,0.9);">
            {{company_address}}
          </p>
          <p style="margin:4px 0 0; font-size:14px; color:rgba(255,255,255,0.8);">
            Tel: {{company_phone}} | Email: {{company_email}}
          </p>
        </td>
      </tr>
    </table>
  </td>
</tr>',
variables = ARRAY['{{primary_color}}', '{{secondary_color}}', '{{logo_url}}', '{{company_name}}', '{{company_address}}', '{{company_phone}}', '{{company_email}}']
WHERE name = 'Thailand Invoice Header';

-- Update Universal Quotation PDF Header with proper company info
UPDATE partial_templates 
SET content = '<!-- Universal Quotation PDF Header -->
<tr>
  <td style="background:linear-gradient(135deg,{{primary_color}} 0%,{{secondary_color}} 100%); padding:24px;">
    <table width="100%" role="presentation">
      <tr>
        <td align="center">
          <!-- Logo and Company Name -->
          <table cellpadding="0" cellspacing="0" style="background:#FFFFFF; border-radius:50%; width:64px; height:64px; margin:0 auto 16px;">
            <tr><td align="center" valign="middle" style="text-align:center;">
                <img src="{{logo_url}}" width="48" height="48" alt="Driver logo" style="display:block; margin:0 auto;">
            </td></tr>
          </table>
          <h1 style="margin:0; font-size:28px; color:#FFF; font-weight:600;">
            {{company_name}}
          </h1>
          <p style="margin:8px 0 0; font-size:16px; color:rgba(255,255,255,0.9);">
            {{company_address}}
          </p>
          <p style="margin:4px 0 0; font-size:14px; color:rgba(255,255,255,0.8);">
            Tel: {{company_phone}} | Email: {{company_email}}
          </p>
          <p style="margin:8px 0 0; font-size:12px; color:rgba(255,255,255,0.7);">
            Team: {{team}} | Tax ID: {{tax_id}}
          </p>
        </td>
      </tr>
    </table>
  </td>
</tr>',
variables = ARRAY['{{primary_color}}', '{{secondary_color}}', '{{logo_url}}', '{{company_name}}', '{{company_address}}', '{{company_phone}}', '{{company_email}}', '{{team}}', '{{tax_id}}']
WHERE name = 'Universal Header';
