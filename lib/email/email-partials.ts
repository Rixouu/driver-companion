import { getTeamAddress, getTeamFooterHtml } from '@/lib/team-addresses'

export interface EmailTemplateData {
  customerName: string
  language: 'en' | 'ja'
  team: 'japan' | 'thailand'
  logoUrl?: string
}

export function getTeamCompanyName(team: 'japan' | 'thailand'): string {
  const address = getTeamAddress(team)
  return address.companyName
}

export function generateEmailHeader(data: EmailTemplateData & { title: string; subtitle?: string }) {
  const { customerName, language, team, title, subtitle, logoUrl = 'https://japandriver.com/img/driver-invoice-logo.png' } = data
  
  return `
    <!-- Header -->
    <tr>
      <td style="background:linear-gradient(135deg,#E03E2D 0%,#F45C4C 100%);">
        <table width="100%" role="presentation">
          <tr>
            <td align="center" style="padding:24px;">
              <table cellpadding="0" cellspacing="0" style="background:#FFFFFF; border-radius:50%; width:64px; height:64px; margin:0 auto 12px;">
                <tr><td align="center" valign="middle" style="text-align:center;">
                    <img src="${logoUrl}" width="48" height="48" alt="Driver logo" style="display:block; margin:0 auto;">
                </td></tr>
              </table>
              <h1 style="margin:0; font-size:24px; color:#FFF; font-weight:600;">
                ${title}
              </h1>
              ${subtitle ? `
                <p style="margin:4px 0 0; font-size:14px; color:rgba(255,255,255,0.85);">
                  ${subtitle}
                </p>
              ` : ''}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `
}

export function generateEmailFooter(data: EmailTemplateData) {
  const { language, team } = data
  const isJapanese = language === 'ja'
  
  return `
    <!-- Footer -->
    <tr>
      <td style="padding:32px 24px; background:#f8f9fa; border-top:1px solid #e2e8f0;">
        <div style="text-align:center;">
          ${getTeamFooterHtml(team, isJapanese)}
        </div>
      </td>
    </tr>
  `
}

export function generateEmailStyles() {
  return `
    <style>
      body, table, td, a {
        -webkit-text-size-adjust:100%;
        -ms-text-size-adjust:100%;
        font-family: 'Noto Sans Thai', 'Noto Sans', sans-serif;
      }
      table, td { mso-table-lspace:0; mso-table-rspace:0; }
      img {
        border:0;
        line-height:100%;
        outline:none;
        text-decoration:none;
        -ms-interpolation-mode:bicubic;
      }
      table { border-collapse:collapse!important; }
      body {
        margin:0;
        padding:0;
        width:100%!important;
        background:#F2F4F6;
      }
      .greeting {
        color:#32325D;
        margin:24px 24px 16px;
        line-height:1.4;
        font-size: 14px;
      }
      @media only screen and (max-width:600px) {
        .container { width:100%!important; }
        .stack { display:block!important; width:100%!important; text-align:center!important; }
        .info-block .flex { flex-direction: column!important; gap: 15px!important; }
        .info-block .flex > div { width: 100%!important; }
        .info-block .flex .flex { flex-direction: column!important; gap: 15px!important; }
        .info-block .flex .flex > div { width: 100%!important; }
      }
      .details-table td, .details-table th {
        padding: 10px 0;
        font-size: 14px;
      }
      .details-table th {
         color: #8898AA;
         text-transform: uppercase;
         text-align: left;
      }
      .price-table th, .price-table td {
         padding: 10px 0;
         font-size: 14px;
      }
       .price-table th {
         color: #8898AA;
         text-transform: uppercase;
      }
      .button {
        background-color: #E03E2D;
        color: white;
        padding: 12px 24px;
        text-decoration: none;
        border-radius: 6px;
        display: inline-block;
        margin: 16px 0;
        font-weight: 600;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      .notes {
        background-color: #f8f9fa;
        border-left: 4px solid #E03E2D;
        padding: 16px;
        margin: 16px 0;
        border-radius: 4px;
      }
      .info-block {
        background:#f8f9fa; 
        padding:20px; 
        border-radius:8px; 
        margin:20px 0;
      }
      .info-block h3 {
        margin:0 0 12px 0; 
        color:#32325D;
      }
      .info-block p {
        margin:0; 
        color:#525f7f;
      }
      .info-block strong {
        color: #32325D;
      }
      .payment-info {
        background-color: #f0fdf4;
        border-left: 4px solid #059669;
        padding: 16px;
        margin: 16px 0;
        border-radius: 4px;
      }
      .payment-pending {
        background-color: #fef2f2;
        border-left: 4px solid #dc2626;
        padding: 16px;
        margin: 16px 0;
        border-radius: 4px;
      }
      /* Ensure light mode for email clients */
      body {
        background: #F2F4F6 !important;
        color: #32325D !important;
      }
      .container {
        background: #FFFFFF !important;
        color: #32325D !important;
      }
      .greeting {
        color: #32325D !important;
      }
      .info-block {
        background: #f8f9fa !important;
        color: #32325D !important;
      }
      .info-block h3 {
        color: #32325D !important;
      }
      .info-block p {
        color: #525f7f !important;
      }
      .info-block strong {
        color: #32325D !important;
      }
    </style>
  `
}

export function generateEmailTemplate(data: EmailTemplateData & { 
  title: string
  subtitle?: string
  content: string
}) {
  const { title, subtitle, content, team } = data
  const companyName = getTeamCompanyName(team)
  
  // Replace {{company_name}} variable in content with actual company name
  const processedContent = content.replace(/\{\{company_name\}\}/g, companyName)
  
  return `
    <!DOCTYPE html>
    <html lang="${data.language}">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${title}</title>
      ${generateEmailStyles()}
    </head>
    <body style="background:#F2F4F6; margin:0; padding:0;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
          <td align="center" style="padding:24px;">
            <table class="container" width="600" cellpadding="0" cellspacing="0" role="presentation"
                   style="background:#FFFFFF; border-radius:8px; overflow:hidden; max-width: 600px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
              
              ${generateEmailHeader({ ...data, title, subtitle })}
              
              <!-- Content -->
              <tr>
                <td style="padding:32px 24px;">
                  ${processedContent}
                </td>
              </tr>
              
              ${generateEmailFooter(data)}
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
}
