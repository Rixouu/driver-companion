import { createServiceClient } from '@/lib/supabase/service-client'
import { generateEmailHeader, generateEmailFooter, generateEmailTemplate, getTeamCompanyName } from './email-partials'

interface EmailTemplate {
  id: string
  name: string
  type: string
  category: string
  subject: string
  html_content: string
  text_content: string
  variables: Record<string, string>
  is_active: boolean
  is_default: boolean
  created_at: string
  updated_at: string
}

interface TemplateVariables {
  [key: string]: string | number
}

export class EmailTemplateService {
  private supabase = createServiceClient()

  async getTemplate(templateName: string): Promise<EmailTemplate | null> {
    try {
      const { data, error } = await this.supabase
        .from('notification_templates' as any)
        .select('*')
        .eq('name', templateName)
        .eq('is_active', true)
        .single()

      if (error) {
        console.error('Error fetching template:', error)
        return null
      }

      return data as unknown as EmailTemplate
    } catch (error) {
      console.error('Error in getTemplate:', error)
      return null
    }
  }

  async renderTemplate(
    templateName: string, 
    variables: TemplateVariables,
    team: 'japan' | 'thailand' = 'japan',
    language: 'en' | 'ja' = 'en'
  ): Promise<{ subject: string; html: string; text: string } | null> {
    try {
      // Fetch template and app settings in parallel for better performance
      const [template, settingsResult] = await Promise.all([
        this.getTemplate(templateName),
        this.supabase
          .from('app_settings' as any)
          .select('*')
      ])

      if (!template) {
        console.error(`Template ${templateName} not found`)
        return null
      }

      const appSettings = settingsResult.data?.reduce((acc: any, item: any) => {
        try {
          acc[item.key] = JSON.parse(item.value)
        } catch (e) {
          acc[item.key] = item.value
        }
        return acc
      }, {} as Record<string, any>) || {}

      // Get team-based company name
      const teamCompanyName = getTeamCompanyName(team as 'japan' | 'thailand')

      // Merge variables with app settings
      const allVariables = {
        ...variables,
        language,
        team,
        primary_color: appSettings.primary_color || '#E03E2D',
        company_name: teamCompanyName,
        from_name: appSettings.from_name || teamCompanyName,
        support_email: appSettings.support_email || 'booking@japandriver.com',
        logo_url: appSettings.logo_url || 'https://japandriver.com/img/driver-invoice-logo.png'
      }

      // Enhanced template variable replacement with Handlebars-like processing
      const replaceVariables = (content: string): string => {
        return content.replace(/\{\{([^}]+)\}\}/g, (match, expression) => {
          try {
            const expr = expression.trim()
            
            // Handle ternary conditionals: {{language == "ja" ? "text1" : "text2"}}
            if (expr.includes('?') && expr.includes(':')) {
              const ternaryMatch = expr.match(/(.+?)\s*\?\s*"([^"]+)"\s*:\s*"([^"]+)"/)
              if (ternaryMatch) {
                const [, condition, trueValue, falseValue] = ternaryMatch
                const conditionResult = evalCondition(condition, allVariables)
                return conditionResult ? trueValue : falseValue
              }
            }
            
            // Handle function calls: {{formatCurrency total_amount currency}}
            if (expr.includes(' ')) {
              const parts = expr.split(/\s+/)
              const funcName = parts[0]
              if (funcName === 'formatCurrency' && parts.length >= 3) {
                const amount = (allVariables as any)[parts[1]] || 0
                const currency = (allVariables as any)[parts[2]] || 'JPY'
                return formatCurrency(amount, currency)
              }
              if (funcName === 'formatDate' && parts.length >= 2) {
                const date = (allVariables as any)[parts[1]]
                const lang = parts[2] ? (allVariables as any)[parts[2]] : language
                return formatDate(date, lang)
              }
            }
            
            // Handle simple variables: {{variable_name}}
            return (allVariables as any)[expr]?.toString() || match
            
          } catch (error) {
            console.warn('Template variable replacement error:', error, 'for expression:', expression)
            return match
          }
        })
      }
      
      // Helper functions
      const evalCondition = (condition: string, vars: any): boolean => {
        try {
          // Handle simple equality checks like: language == "ja"
          const eqMatch = condition.match(/(\w+)\s*==\s*"([^"]+)"/)
          if (eqMatch) {
            const [, varName, value] = eqMatch
            return vars[varName] === value
          }
          return false
        } catch {
          return false
        }
      }
      
      const formatCurrency = (amount: number, currency: string): string => {
        if (!amount || isNaN(amount)) return `${currency} 0`
        if (currency === 'JPY') {
          return `¥${Math.round(amount).toLocaleString()}`
        }
        if (currency === 'USD') {
          return `$${amount.toLocaleString()}`
        }
        return `${currency} ${amount.toLocaleString()}`
      }
      
      const formatDate = (date: string, lang: string = 'en'): string => {
        if (!date) return ''
        try {
          const dateObj = new Date(date)
          if (lang === 'ja') {
            return dateObj.toLocaleDateString('ja-JP')
          }
          return dateObj.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long', 
            day: 'numeric'
          })
        } catch {
          return date
        }
      }

      // Extract core content from template (remove existing header/footer if present)
      const contentMatch = template.html_content.match(/<td style="padding:32px 24px;">\s*([\s\S]*?)\s*<\/td>/)
      const coreHtml = contentMatch ? contentMatch[1].trim() : template.html_content

      // Handle conditional blocks first: {{#if condition}}...{{/if}}
      const processConditionals = (content: string): string => {
        return content.replace(/\{\{#if\s+(.+?)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, condition, block) => {
          const trimmedCondition = condition.trim()
          
          // First try complex condition evaluation
          let conditionResult = evalCondition(trimmedCondition, allVariables)
          
          // If no complex condition, check simple variable value
          if (conditionResult === false) {
            const varValue = (allVariables as any)[trimmedCondition]
            // Handle different falsy values properly
            if (varValue === '' || varValue === null || varValue === undefined || varValue === 0 || varValue === false) {
              conditionResult = false
            } else {
              conditionResult = Boolean(varValue)
            }
          }
          
          return conditionResult ? block : ''
        })
      }

      // Process conditionals first, then replace variables
      let processedHtml = processConditionals(coreHtml)
      processedHtml = replaceVariables(processedHtml)
      
      // Handle square bracket placeholders: [MAGIC_LINK], [VARIABLE_NAME]
      processedHtml = processedHtml.replace(/\[([A-Z_]+)\]/g, (match, varName) => {
        const lowerVarName = varName.toLowerCase()
        const replacement = (allVariables as any)[lowerVarName]?.toString()
        
        // Debug logging for troubleshooting
        if (!replacement && varName === 'MAGIC_LINK') {
          console.warn('⚠️ [TEMPLATE] MAGIC_LINK not found in variables')
        }
        
        return replacement || match
      })
      
      const renderedCoreHtml = processedHtml

      // Also process subject and text content
      let processedSubject = processConditionals(template.subject)
      processedSubject = replaceVariables(processedSubject)
      
      let processedText = processConditionals(template.text_content || '')
      processedText = replaceVariables(processedText)

      // Generate full HTML with header/footer using the new function
      const fullHtml = generateEmailTemplate({
        customerName: (allVariables as any).customer_name || '{{customer_name}}',
        language: language as 'en' | 'ja',
        team: team as 'japan' | 'thailand',
        logoUrl: (allVariables as any).logo_url,
        title: processedSubject, // Use processed subject for proper header rendering
        content: renderedCoreHtml
      })

      return {
        subject: processedSubject,
        html: fullHtml,
        text: processedText
      }
    } catch (error) {
      console.error('Error rendering template:', error)
      return null
    }
  }

  async updateTemplate(templateId: string, updates: Partial<EmailTemplate>): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('notification_templates' as any)
        .update(updates)
        .eq('id', templateId)

      if (error) {
        console.error('Error updating template:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in updateTemplate:', error)
      return false
    }
  }

  async getAllTemplates(): Promise<EmailTemplate[]> {
    try {
      const { data, error } = await this.supabase
        .from('notification_templates' as any)
        .select('*')
        .order('name')

      if (error) {
        console.error('Error fetching templates:', error)
        return []
      }

      return (data || []) as unknown as EmailTemplate[]
    } catch (error) {
      console.error('Error in getAllTemplates:', error)
      return []
    }
  }
}

// Export singleton instance
export const emailTemplateService = new EmailTemplateService()
