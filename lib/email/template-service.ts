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
  [key: string]: string | number | any[]
}

// Helper functions for template processing
function formatCurrency(amount: number | string, currency: string = 'JPY'): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(numAmount)) return '0'
  
  const formatter = new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })
  
  return formatter.format(numAmount)
}

function formatDate(date: string | Date, language: string = 'en'): string {
  if (!date) return ''
  
  const dateObj = typeof date === 'string' ? new Date(date) : date
  if (isNaN(dateObj.getTime())) return ''
  
  const locale = language === 'ja' ? 'ja-JP' : 'en-US'
  return dateObj.toLocaleDateString(locale)
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
        primary_color: appSettings.primary_color || '#FF2800',
        secondary_color: appSettings.secondary_color,
        company_name: teamCompanyName,
        from_name: appSettings.from_name || teamCompanyName,
        support_email: appSettings.support_email || 'booking@japandriver.com',
        logo_url: appSettings.logo_url || 'https://japandriver.com/img/driver-invoice-logo.png',
        custom_css: appSettings.email_css_styling,
        custom_header_template: appSettings.email_header_template,
        custom_footer_template: appSettings.email_footer_template,
        custom_css_template: appSettings.email_css_template
      }

      // Enhanced template variable replacement with Handlebars-like processing
      const replaceVariables = (content: string): string => {
        // First, handle Handlebars block helpers like {{#if}}
        let processedContent = content.replace(/\{\{#if\s+([^}]+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, condition, blockContent) => {
          try {
            const conditionResult = evalCondition(condition.trim(), allVariables)
            return conditionResult ? blockContent : ''
          } catch (error) {
            console.warn('Handlebars block condition error:', error, 'for condition:', condition)
            return ''
          }
        })

        // Handle {{#unless}} blocks
        processedContent = processedContent.replace(/\{\{#unless\s+([^}]+)\}\}([\s\S]*?)\{\{\/unless\}\}/g, (match, condition, blockContent) => {
          try {
            const conditionResult = evalCondition(condition.trim(), allVariables)
            return !conditionResult ? blockContent : ''
          } catch (error) {
            console.warn('Handlebars unless block condition error:', error, 'for condition:', condition)
            return ''
          }
        })


        // Then handle simple variable replacement
        return processedContent.replace(/\{\{([^}]+)\}\}/g, (match, expression) => {
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
          
          // Handle comparison operators like: time_based_discount > 0
          const comparisonMatch = condition.match(/(\w+)\s*([><=!]+)\s*(\d+)/)
          if (comparisonMatch) {
            const [, varName, operator, value] = comparisonMatch
            const varValue = parseFloat(vars[varName]) || 0
            const compareValue = parseFloat(value)
            const result = (() => {
              switch (operator) {
                case '>': return varValue > compareValue
                case '>=': return varValue >= compareValue
                case '<': return varValue < compareValue
                case '<=': return varValue <= compareValue
                case '==': return varValue === compareValue
                case '!=': return varValue !== compareValue
                default: return false
              }
            })()
            console.log('🔍 [TEMPLATE] Comparison:', varName, operator, value, 'varValue:', vars[varName], 'parsed:', varValue, 'result:', result)
            return result
          }
          
          // Handle contains function like: contains service_type_name "Charter"
          const containsMatch = condition.match(/contains\s+(\w+)\s+"([^"]+)"/)
          if (containsMatch) {
            const [, varName, searchValue] = containsMatch
            const varValue = vars[varName]
            return varValue && varValue.toString().toLowerCase().includes(searchValue.toLowerCase())
          }
          
          // Handle truthy checks like: service_days
          if (condition.match(/^\w+$/)) {
            const varName = condition.trim()
            const varValue = vars[varName]
            // Properly handle null, undefined, empty string, and 0
            if (varValue === null || varValue === undefined || varValue === '' || varValue === 0 || varValue === false) {
              return false
            }
            return Boolean(varValue)
          }
          
          // Handle complex conditions like: service_days && service_type_charter
          if (condition.includes('&&')) {
            const parts = condition.split('&&').map(p => p.trim())
            return parts.every(part => evalCondition(part, vars))
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

      // Process {{#each}} blocks first, then conditionals, then replace variables
      const processEachBlocks = (content: string, vars: any): string => {
        return content.replace(/\{\{#each\s+([^}]+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (match, arrayName, blockContent) => {
          try {
            const array = vars[arrayName.trim()]
            if (!Array.isArray(array) || array.length === 0) {
              return ''
            }
            
            return array.map((item: any) => {
              let itemContent = blockContent
              
              // First, handle nested {{#if}} blocks within the each block
              itemContent = itemContent.replace(/\{\{#if\s+([^}]+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (ifMatch, condition, ifBlockContent) => {
                try {
                  const conditionResult = evalCondition(condition.trim(), { ...vars, ...item })
                  return conditionResult ? ifBlockContent : ''
                } catch (error) {
                  console.warn('Handlebars nested if condition error:', error, 'for condition:', condition)
                  return ''
                }
              })
              
              // Replace variables within the each block with item properties
              itemContent = itemContent.replace(/\{\{([^}]+)\}\}/g, (varMatch: string, expression: string) => {
                const expr = expression.trim()
                
                // Handle ternary conditionals: {{language == "ja" ? "text1" : "text2"}}
                if (expr.includes('?') && expr.includes(':')) {
                  const ternaryMatch = expr.match(/(.+?)\s*\?\s*"([^"]+)"\s*:\s*"([^"]+)"/)
                  if (ternaryMatch) {
                    const [, condition, trueValue, falseValue] = ternaryMatch
                    const conditionResult = evalCondition(condition, { ...vars, ...item })
                    return conditionResult ? trueValue : falseValue
                  }
                }
                
                // Handle function calls: {{formatCurrency total_price currency}}
                if (expr.includes(' ')) {
                  const parts = expr.split(/\s+/)
                  const funcName = parts[0]
                  if (funcName === 'formatCurrency' && parts.length >= 3) {
                    const amount = item[parts[1]] || 0
                    const currency = vars[parts[2]] || 'JPY'
                    return formatCurrency(amount, currency)
                  }
                  if (funcName === 'formatDate' && parts.length >= 2) {
                    const date = item[parts[1]]
                    const lang = parts[2] ? vars[parts[2]] : language
                    return formatDate(date, lang)
                  }
                }
                
                // Handle nested properties like item.property
                if (expr.includes('.')) {
                  const parts = expr.split('.')
                  let value = item
                  for (const part of parts) {
                    value = value?.[part]
                  }
                  return value !== undefined ? String(value) : ''
                }
                return item[expr] !== undefined ? String(item[expr]) : ''
              })
              return itemContent
            }).join('')
          } catch (error) {
            console.warn('Handlebars each block error:', error, 'for array:', arrayName)
            return ''
          }
        })
      }

      let processedHtml = coreHtml
      processedHtml = processEachBlocks(processedHtml, allVariables)
      processedHtml = processConditionals(processedHtml)
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
        primaryColor: (allVariables as any).primary_color || '#FF2800',
        secondaryColor: (allVariables as any).secondary_color,
        customCSS: (allVariables as any).custom_css,
        customHeaderTemplate: (allVariables as any).custom_header_template,
        customFooterTemplate: (allVariables as any).custom_footer_template,
        customCSSTemplate: (allVariables as any).custom_css_template,
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
