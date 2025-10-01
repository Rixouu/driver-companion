import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    // Fetch templates from database
    const { data: templates, error } = await supabase
      .from('pdf_templates')
      .select('*')
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
    }

    // Transform database data to match frontend interface
    const transformedTemplates = templates?.map(template => ({
      id: template.id,
      name: template.name,
      type: template.type,
      status: 'active', // Default status
      variant: template.variant,
      location: template.location,
      filePath: template.file_path,
      functionName: template.function_name,
      description: template.description || '',
      team: template.team || 'both',
      hasSignature: template.template_data?.showSignature || false,
      hasStatusBadge: template.template_data?.showStatusBadge || false,
      isActive: template.is_active || false,
      lastModified: template.updated_at || template.created_at,
      config: {
        statuses: template.template_data?.statuses || [],
        showSignature: template.template_data?.showSignature || false,
        showStatusBadge: template.template_data?.showStatusBadge || false,
        showTeamInfo: template.template_data?.showTeamInfo || false,
        showLanguageToggle: template.template_data?.showLanguageToggle || false,
        features: template.template_data?.features || [],
        styling: template.styling || {
          primaryColor: '#FF2600',
          fontFamily: 'Noto Sans Thai, Noto Sans, sans-serif',
          fontSize: '14px'
        }
      }
    })) || []

    return NextResponse.json({ 
      templates: transformedTemplates,
      count: transformedTemplates.length
    })

  } catch (error) {
    console.error('Error fetching templates:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
