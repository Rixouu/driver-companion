import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: templateId } = await params
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    const body = await request.json()
    
    
    // First, try to find the template by the string ID (like "quotation-server-main")
    let actualTemplateId = templateId
    
    // If it's not a UUID, try to find it by name or other identifier
    if (!templateId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      const { data: existingTemplates } = await supabase
        .from('pdf_templates')
        .select('id, name, type, variant')
        .or(`name.ilike.%${templateId}%,type.eq.${templateId.split('-')[0]}`)
      
      if (existingTemplates && existingTemplates.length > 0) {
        actualTemplateId = existingTemplates[0].id
      } else {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 })
      }
    }
    
    // Transform the template data to match database schema
    const templateData = {
      name: body.name,
      type: body.type,
      description: body.description,
      template_data: {
        showTeamInfo: body.config.showTeamInfo,
        showLanguageToggle: body.config.showLanguageToggle,
        statusConfigs: body.config.statusConfigs
      },
      styling: body.config.styling,
      is_active: body.isActive,
      team: body.team,
      updated_at: new Date().toISOString()
    }


    // Update the template in the database
    const { data, error } = await supabase
      .from('pdf_templates')
      .update(templateData)
      .eq('id', actualTemplateId)
      .select()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to update template' }, { status: 500 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      message: 'Template updated successfully',
      template: data[0]
    })

  } catch (error) {
    console.error('Error updating template:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
