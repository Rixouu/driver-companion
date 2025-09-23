import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service-client'
import { DEFAULT_HEADER_TEMPLATE, DEFAULT_FOOTER_TEMPLATE, DEFAULT_CSS_TEMPLATE } from '@/lib/email/email-partials-manager'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    
    // Initialize default email templates in app_settings
    const defaultTemplates = [
      {
        key: 'email_header_template',
        value: DEFAULT_HEADER_TEMPLATE,
        description: 'Default email header template with dynamic color support'
      },
      {
        key: 'email_footer_template', 
        value: DEFAULT_FOOTER_TEMPLATE,
        description: 'Default email footer template with team-specific content'
      },
      {
        key: 'email_css_template',
        value: DEFAULT_CSS_TEMPLATE,
        description: 'Default email CSS template with dynamic color support'
      }
    ]

    // Insert or update each template
    for (const template of defaultTemplates) {
      const { error } = await supabase
        .from('app_settings')
        .upsert({
          key: template.key,
          value: template.value,
          description: template.description,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'key'
        })

      if (error) {
        console.error(`Error upserting ${template.key}:`, error)
        return NextResponse.json({ 
          error: `Failed to initialize ${template.key}`,
          details: error.message 
        }, { status: 500 })
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Default email templates initialized successfully',
      templates: defaultTemplates.map(t => t.key)
    })

  } catch (error) {
    console.error('Error initializing default email templates:', error)
    return NextResponse.json({ 
      error: 'Failed to initialize default email templates',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
