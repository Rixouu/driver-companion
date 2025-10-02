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

// Client-safe default templates (without database dependencies)
const DEFAULT_HEADER_TEMPLATE = `
  <tr>
    <td style="background: {{primaryColor}}; padding: 24px; text-align: center;">
      <img src="{{logoUrl}}" alt="{{company_name}}" style="max-height: 40px; max-width: 200px;" />
      <h1 style="color: white; margin: 16px 0 8px 0; font-size: 24px; font-weight: bold;">{{title}}</h1>
      {{#if subtitle}}<p style="color: white; margin: 0; font-size: 16px; opacity: 0.9;">{{subtitle}}</p>{{/if}}
    </td>
  </tr>
`

const DEFAULT_FOOTER_TEMPLATE = `
  <tr>
    <td style="background: #F8F9FA; padding: 24px; text-align: center; border-top: 1px solid #E5E7EB;">
      <p style="margin: 0 0 8px 0; font-size: 14px; color: #6B7280;">{{company_name}}</p>
      <p style="margin: 0; font-size: 12px; color: #9CA3AF;">{{footer_html}}</p>
    </td>
  </tr>
`

const DEFAULT_CSS_TEMPLATE = `
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; }
    h1, h2, h3 { color: {{primaryColor}}; }
    a { color: {{primaryColor}}; text-decoration: none; }
    .button { 
      background: {{primaryColor}}; 
      color: white; 
      padding: 12px 24px; 
      border-radius: 6px; 
      display: inline-block; 
      text-decoration: none; 
    }
  </style>
`

// Client-safe template processing
function processTemplate(template: string, variables: Record<string, any>): string {
  let processed = template
  
  // Replace simple variables
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
    processed = processed.replace(regex, String(value || ''))
  })
  
  // Handle simple conditionals
  processed = processed.replace(/\{\{#if\s+([^}]+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, condition, content) => {
    const variableName = condition.trim()
    return variables[variableName] ? content : ''
  })
  
  return processed
}

export async function generateEmailHeaderClient(data: EmailTemplateData & { 
  title: string
  subtitle?: string
  primaryColor?: string
  secondaryColor?: string
  customHeaderTemplate?: string 
}) {
  const { customHeaderTemplate, team, logoUrl = 'https://japandriver.com/img/driver-invoice-logo.png', primaryColor = '#FF2800' } = data
  const companyName = getTeamCompanyName(team)
  
  const template = customHeaderTemplate || DEFAULT_HEADER_TEMPLATE
  
  return processTemplate(template, {
    ...data,
    company_name: companyName,
    logoUrl,
    primaryColor
  })
}

export async function generateEmailFooterClient(data: EmailTemplateData & { 
  customFooterTemplate?: string 
}) {
  const { customFooterTemplate, team } = data
  const companyName = getTeamCompanyName(team)
  const footerHtml = getTeamFooterHtml(team)
  
  const template = customFooterTemplate || DEFAULT_FOOTER_TEMPLATE
  
  return processTemplate(template, {
    ...data,
    company_name: companyName,
    footer_html: footerHtml
  })
}

export async function generateEmailStylesClient(
  primaryColor: string = '#FF2800', 
  customCSS?: string, 
  customCSSTemplate?: string, 
  team: 'japan' | 'thailand' | 'both' = 'both'
) {
  const template = customCSSTemplate || DEFAULT_CSS_TEMPLATE
  
  return processTemplate(template, {
    primaryColor,
    customCSS: customCSS || ''
  })
}

export async function generateEmailTemplateClient(data: EmailTemplateData & { 
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
    generateEmailHeaderClient({ ...data, title, subtitle, primaryColor, secondaryColor, customHeaderTemplate }),
    generateEmailFooterClient({ ...data, customFooterTemplate }),
    generateEmailStylesClient(primaryColor, customCSS, customCSSTemplate, team)
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
