// Email Partials Manager - Syncs branding interface with actual email partials
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

// Default header template - this is what gets loaded in the Header tab
export const DEFAULT_HEADER_TEMPLATE = `<!-- Header -->
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
</tr>`

// Default footer template - this is what gets loaded in the Footer tab
export const DEFAULT_FOOTER_TEMPLATE = `<!-- Footer -->
<tr>
  <td style="padding:32px 24px; background:#f8f9fa; border-top:1px solid #e2e8f0;">
    <div style="text-align:center;">
      {{team_footer_html}}
    </div>
  </td>
</tr>`

// Default CSS template - this is what gets loaded in the CSS tab
export const DEFAULT_CSS_TEMPLATE = `body, table, td, a {
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
  background-color: {{primary_color}};
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
  border-left: 4px solid {{primary_color}};
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
/* Force magic link text to be black with no underline */
.magic-link {
  color: black !important;
  text-decoration: none !important;
}
.magic-link:link {
  color: black !important;
  text-decoration: none !important;
}
.magic-link:visited {
  color: black !important;
  text-decoration: none !important;
}
.magic-link:hover {
  color: black !important;
  text-decoration: none !important;
}
.magic-link:active {
  color: black !important;
  text-decoration: none !important;
}`

// Function to generate header from custom template
export function generateEmailHeaderFromTemplate(
  template: string,
  data: EmailTemplateData & { title: string; subtitle?: string; primaryColor?: string; secondaryColor?: string }
) {
  const { customerName, language, team, title, subtitle, logoUrl = 'https://japandriver.com/img/driver-invoice-logo.png', primaryColor = '#FF2800', secondaryColor } = data
  
  // Use secondary color if provided, otherwise create a darker version of primary
  const gradientEnd = secondaryColor || `${primaryColor}dd`
  
  // Replace template variables
  let processedTemplate = template
    .replace(/\{\{primary_color\}\}/g, primaryColor)
    .replace(/\{\{secondary_color\}\}/g, gradientEnd)
    .replace(/\{\{logo_url\}\}/g, logoUrl)
    .replace(/\{\{title\}\}/g, title)
    .replace(/\{\{subtitle\}\}/g, subtitle || '')
    .replace(/\{\{#if subtitle\}\}\}([\s\S]*?)\{\{\/if\}\}/g, subtitle ? '$1' : '')
  
  return processedTemplate
}

// Function to generate footer from custom template
export function generateEmailFooterFromTemplate(
  template: string,
  data: EmailTemplateData
) {
  const { language, team } = data
  const isJapanese = language === 'ja'
  
  // Replace template variables
  let processedTemplate = template
    .replace(/\{\{team_footer_html\}\}/g, getTeamFooterHtml(team, isJapanese))
  
  return processedTemplate
}

// Function to generate CSS from custom template
export function generateEmailStylesFromTemplate(
  template: string,
  primaryColor: string = '#FF2800',
  customCSS?: string
) {
  // Replace template variables
  let processedTemplate = template
    .replace(/\{\{primary_color\}\}/g, primaryColor)
  
  return `
    <style>
      ${processedTemplate}
      ${customCSS || ''}
    </style>
  `
}
