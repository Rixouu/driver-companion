-- Migrate existing email partials to the database
-- This migration adds the existing email header and footer templates for Japan and Thailand teams

INSERT INTO partial_templates (name, type, document_type, team, content, variables, is_active) VALUES
(
  'Japan Email Header',
  'header',
  'quotation',
  'japan',
  '<!-- Header -->
<tr>
  <td style="background:linear-gradient(135deg,{{primary_color}} 0%,{{secondary_color}} 100%);">
    <table width="100%" role="presentation">
      <tr>
        <td align="center" style="padding:24px;">
          <table cellpadding="0" cellspacing="0" style="background:#FFFFFF; border-radius:50%; width:64px; height:64px; margin:0 auto 12px;">
            <tr><td align="center" valign="middle" style="text-align:center;">
                <img src="{{logo_url}}" width="48" height="48" alt="Driver logo" style="display:block; margin:0 auto;">
            </td></tr>
          </table>
          <h1 style="margin:0; font-size:24px; color:#FFF; font-weight:600;">
            {{title}}
          </h1>
          {{#if subtitle}}
            <p style="margin:4px 0 0; font-size:14px; color:rgba(255,255,255,0.85);">
              {{subtitle}}
            </p>
          {{/if}}
        </td>
      </tr>
    </table>
  </td>
</tr>',
  ARRAY['{{primary_color}}', '{{secondary_color}}', '{{logo_url}}', '{{title}}', '{{subtitle}}'],
  true
),
(
  'Thailand Email Header',
  'header',
  'quotation',
  'thailand',
  '<!-- Header -->
<tr>
  <td style="background:linear-gradient(135deg,{{primary_color}} 0%,{{secondary_color}} 100%);">
    <table width="100%" role="presentation">
      <tr>
        <td align="center" style="padding:24px;">
          <table cellpadding="0" cellspacing="0" style="background:#FFFFFF; border-radius:50%; width:64px; height:64px; margin:0 auto 12px;">
            <tr><td align="center" valign="middle" style="text-align:center;">
                <img src="{{logo_url}}" width="48" height="48" alt="Driver logo" style="display:block; margin:0 auto;">
            </td></tr>
          </table>
          <h1 style="margin:0; font-size:24px; color:#FFF; font-weight:600;">
            {{title}}
          </h1>
          {{#if subtitle}}
            <p style="margin:4px 0 0; font-size:14px; color:rgba(255,255,255,0.85);">
              {{subtitle}}
            </p>
          {{/if}}
        </td>
      </tr>
    </table>
  </td>
</tr>',
  ARRAY['{{primary_color}}', '{{secondary_color}}', '{{logo_url}}', '{{title}}', '{{subtitle}}'],
  true
),
(
  'Japan Email Footer',
  'footer',
  'quotation',
  'japan',
  '<!-- Footer -->
<tr>
  <td style="padding:32px 24px; background:#f8f9fa; border-top:1px solid #e2e8f0;">
    <div style="text-align:center;">
      <p style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold; color: #111827;">
        ご利用いただきありがとうございます。
      </p>
      <p style="margin: 0 0 5px 0; font-size: 13px; color: #111827;">
        この請求書に関するお問い合わせは {{contact_email}} までご連絡ください。
      </p>
      <p style="margin: 10px 0 0 0; font-size: 13px; color: #666;">
        {{company_name}} • www.japandriver.com
      </p>
    </div>
  </td>
</tr>',
  ARRAY['{{contact_email}}', '{{company_name}}'],
  true
),
(
  'Thailand Email Footer',
  'footer',
  'quotation',
  'thailand',
  '<!-- Footer -->
<tr>
  <td style="padding:32px 24px; background:#f8f9fa; border-top:1px solid #e2e8f0;">
    <div style="text-align:center;">
      <p style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold; color: #111827;">
        Thank you for your business!
      </p>
      <p style="margin: 0 0 5px 0; font-size: 13px; color: #111827;">
        If you have any questions about this invoice, please contact us at {{contact_email}}
      </p>
      <p style="margin: 10px 0 0 0; font-size: 13px; color: #666;">
        {{company_name}} • www.japandriver.com
      </p>
    </div>
  </td>
</tr>',
  ARRAY['{{contact_email}}', '{{company_name}}'],
  true
),
(
  'Japan Invoice Header',
  'header',
  'invoice',
  'japan',
  '<!-- Header -->
<tr>
  <td style="background:linear-gradient(135deg,{{primary_color}} 0%,{{secondary_color}} 100%);">
    <table width="100%" role="presentation">
      <tr>
        <td align="center" style="padding:24px;">
          <table cellpadding="0" cellspacing="0" style="background:#FFFFFF; border-radius:50%; width:64px; height:64px; margin:0 auto 12px;">
            <tr><td align="center" valign="middle" style="text-align:center;">
                <img src="{{logo_url}}" width="48" height="48" alt="Driver logo" style="display:block; margin:0 auto;">
            </td></tr>
          </table>
          <h1 style="margin:0; font-size:24px; color:#FFF; font-weight:600;">
            {{title}}
          </h1>
          {{#if subtitle}}
            <p style="margin:4px 0 0; font-size:14px; color:rgba(255,255,255,0.85);">
              {{subtitle}}
            </p>
          {{/if}}
        </td>
      </tr>
    </table>
  </td>
</tr>',
  ARRAY['{{primary_color}}', '{{secondary_color}}', '{{logo_url}}', '{{title}}', '{{subtitle}}'],
  true
),
(
  'Thailand Invoice Header',
  'header',
  'invoice',
  'thailand',
  '<!-- Header -->
<tr>
  <td style="background:linear-gradient(135deg,{{primary_color}} 0%,{{secondary_color}} 100%);">
    <table width="100%" role="presentation">
      <tr>
        <td align="center" style="padding:24px;">
          <table cellpadding="0" cellspacing="0" style="background:#FFFFFF; border-radius:50%; width:64px; height:64px; margin:0 auto 12px;">
            <tr><td align="center" valign="middle" style="text-align:center;">
                <img src="{{logo_url}}" width="48" height="48" alt="Driver logo" style="display:block; margin:0 auto;">
            </td></tr>
          </table>
          <h1 style="margin:0; font-size:24px; color:#FFF; font-weight:600;">
            {{title}}
          </h1>
          {{#if subtitle}}
            <p style="margin:4px 0 0; font-size:14px; color:rgba(255,255,255,0.85);">
              {{subtitle}}
            </p>
          {{/if}}
        </td>
      </tr>
    </table>
  </td>
</tr>',
  ARRAY['{{primary_color}}', '{{secondary_color}}', '{{logo_url}}', '{{title}}', '{{subtitle}}'],
  true
),
(
  'Japan Invoice Footer',
  'footer',
  'invoice',
  'japan',
  '<!-- Footer -->
<tr>
  <td style="padding:32px 24px; background:#f8f9fa; border-top:1px solid #e2e8f0;">
    <div style="text-align:center;">
      <p style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold; color: #111827;">
        ご利用いただきありがとうございます。
      </p>
      <p style="margin: 0 0 5px 0; font-size: 13px; color: #111827;">
        この請求書に関するお問い合わせは {{contact_email}} までご連絡ください。
      </p>
      <p style="margin: 10px 0 0 0; font-size: 13px; color: #666;">
        {{company_name}} • www.japandriver.com
      </p>
    </div>
  </td>
</tr>',
  ARRAY['{{contact_email}}', '{{company_name}}'],
  true
),
(
  'Thailand Invoice Footer',
  'footer',
  'invoice',
  'thailand',
  '<!-- Footer -->
<tr>
  <td style="padding:32px 24px; background:#f8f9fa; border-top:1px solid #e2e8f0;">
    <div style="text-align:center;">
      <p style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold; color: #111827;">
        Thank you for your business!
      </p>
      <p style="margin: 0 0 5px 0; font-size: 13px; color: #111827;">
        If you have any questions about this invoice, please contact us at {{contact_email}}
      </p>
      <p style="margin: 10px 0 0 0; font-size: 13px; color: #666;">
        {{company_name}} • www.japandriver.com
      </p>
    </div>
  </td>
</tr>',
  ARRAY['{{contact_email}}', '{{company_name}}'],
  true
);
