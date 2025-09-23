import { getTeamAddress, getTeamFooterHtml } from '@/lib/team-addresses'
import { generateEmailHeaderFromTemplate, generateEmailFooterFromTemplate, generateEmailStylesFromTemplate, DEFAULT_HEADER_TEMPLATE, DEFAULT_FOOTER_TEMPLATE, DEFAULT_CSS_TEMPLATE } from './email-partials-manager'

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

export function generateEmailHeader(data: EmailTemplateData & { title: string; subtitle?: string; primaryColor?: string; secondaryColor?: string; customHeaderTemplate?: string }) {
  const { customHeaderTemplate, ...headerData } = data
  
  // Use custom template if provided, otherwise use default
  const template = customHeaderTemplate || DEFAULT_HEADER_TEMPLATE
  
  return generateEmailHeaderFromTemplate(template, headerData)
}

export function generateEmailFooter(data: EmailTemplateData & { customFooterTemplate?: string }) {
  const { customFooterTemplate, ...footerData } = data
  
  // Use custom template if provided, otherwise use default
  const template = customFooterTemplate || DEFAULT_FOOTER_TEMPLATE
  
  return generateEmailFooterFromTemplate(template, footerData)
}

export function generateEmailStyles(primaryColor: string = '#FF2800', customCSS?: string, customCSSTemplate?: string) {
  // Use custom CSS template if provided, otherwise use default
  const template = customCSSTemplate || DEFAULT_CSS_TEMPLATE
  
  return generateEmailStylesFromTemplate(template, primaryColor, customCSS)
}

export function generateEmailTemplate(data: EmailTemplateData & { 
  title: string
  subtitle?: string
  content: string
  primaryColor?: string
  secondaryColor?: string
  customCSS?: string
  customHeaderTemplate?: string
  customFooterTemplate?: string
  customCSSTemplate?: string
}) {
  const { title, subtitle, content, team, primaryColor = '#FF2800', secondaryColor, customCSS, customHeaderTemplate, customFooterTemplate, customCSSTemplate } = data
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
      ${generateEmailStyles(primaryColor, customCSS, customCSSTemplate)}
    </head>
    <body style="background:#F2F4F6; margin:0; padding:0;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
          <td align="center" style="padding:24px;">
            <table class="container" width="600" cellpadding="0" cellspacing="0" role="presentation"
                   style="background:#FFFFFF; border-radius:8px; overflow:hidden; max-width: 600px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
              
              ${generateEmailHeader({ ...data, title, subtitle, primaryColor, secondaryColor, customHeaderTemplate })}
              
              <!-- Content -->
              <tr>
                <td style="padding:32px 24px;">
                  ${processedContent}
                </td>
              </tr>
              
              ${generateEmailFooter({ ...data, customFooterTemplate })}
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
}
