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

export async function generateEmailHeader(data: EmailTemplateData & { title: string; subtitle?: string; primaryColor?: string; secondaryColor?: string; customHeaderTemplate?: string }) {
  const { customHeaderTemplate, ...headerData } = data
  
  // Use custom template if provided, otherwise use default
  const template = customHeaderTemplate || DEFAULT_HEADER_TEMPLATE
  
  return await generateEmailHeaderFromTemplate(template, headerData)
}

export async function generateEmailFooter(data: EmailTemplateData & { customFooterTemplate?: string }) {
  const { customFooterTemplate, ...footerData } = data
  
  // Use custom template if provided, otherwise use default
  const template = customFooterTemplate || DEFAULT_FOOTER_TEMPLATE
  
  return await generateEmailFooterFromTemplate(template, footerData)
}

export async function generateEmailStyles(primaryColor: string = '#FF2800', customCSS?: string, customCSSTemplate?: string, team: 'japan' | 'thailand' | 'both' = 'both') {
  // Use custom CSS template if provided, otherwise use default
  const template = customCSSTemplate || DEFAULT_CSS_TEMPLATE
  
  return await generateEmailStylesFromTemplate(template, primaryColor, customCSS, team)
}

export async function generateEmailTemplate(data: EmailTemplateData & { 
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
  
  // Generate async components
  const [headerHTML, footerHTML, stylesHTML] = await Promise.all([
    generateEmailHeader({ ...data, title, subtitle, primaryColor, secondaryColor, customHeaderTemplate }),
    generateEmailFooter({ ...data, customFooterTemplate }),
    generateEmailStyles(primaryColor, customCSS, customCSSTemplate, team)
  ])
  
  return `
    <!DOCTYPE html>
    <html lang="${data.language}">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${title}</title>
      ${stylesHTML}
    </head>
    <body style="background:#F2F4F6; margin:0; padding:0;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
          <td align="center" style="padding:24px;">
            <table class="container" width="600" cellpadding="0" cellspacing="0" role="presentation"
                   style="background:#FFFFFF; border-radius:8px; overflow:hidden; max-width: 600px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
              
              ${headerHTML}
              
              <!-- Content -->
              <tr>
                <td style="padding:32px 24px;">
                  ${processedContent}
                </td>
              </tr>
              
              ${footerHTML}
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
}

