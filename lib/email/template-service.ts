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
      const template = await this.getTemplate(templateName)
      if (!template) {
        console.error(`Template ${templateName} not found`)
        return null
      }

      // Get app settings for branding
      const { data: settings } = await this.supabase
        .from('app_settings' as any)
        .select('*')

      const appSettings = settings?.reduce((acc: any, item: any) => {
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

      // Simple template variable replacement
      const replaceVariables = (content: string): string => {
        return content.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
          const trimmedKey = key.trim()
          return (allVariables as any)[trimmedKey]?.toString() || match
        })
      }

      // Extract core content from template (remove existing header/footer if present)
      const contentMatch = template.html_content.match(/<td style="padding:32px 24px;">\s*([\s\S]*?)\s*<\/td>/)
      const coreHtml = contentMatch ? contentMatch[1].trim() : template.html_content

      // Replace variables in core content
      const renderedCoreHtml = replaceVariables(coreHtml)

      // Generate full HTML with header/footer using the new function
      const fullHtml = generateEmailTemplate({
        customerName: (allVariables as any).customer_name || '{{customer_name}}',
        language: language as 'en' | 'ja',
        team: team as 'japan' | 'thailand',
        logoUrl: (allVariables as any).logo_url,
        title: template.subject,
        content: renderedCoreHtml
      })

      // Replace variables in subject and text
      const renderedSubject = replaceVariables(template.subject)
      const renderedText = replaceVariables(template.text_content)

      return {
        subject: renderedSubject,
        html: fullHtml,
        text: renderedText
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
