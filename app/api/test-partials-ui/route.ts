import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    console.log('Testing partials UI integration...')
    const supabase = await getSupabaseServerClient()
    
    // Test fetching all partial types including email
    const { data: partials, error } = await supabase
      .from('partial_templates')
      .select('*')
      .eq('is_active', true)
      .order('last_modified', { ascending: false })

    if (error) {
      console.error('Error fetching partials:', error)
      return NextResponse.json({ 
        success: false, 
        error: `Failed to fetch partials: ${error.message}` 
      }, { status: 500 })
    }

    // Transform snake_case to camelCase to match frontend interface
    const transformedPartials = partials?.map(partial => ({
      id: partial.id,
      name: partial.name,
      type: partial.type,
      documentType: partial.document_type,
      team: partial.team,
      content: partial.content,
      isActive: partial.is_active,
      lastModified: partial.last_modified,
      variables: partial.variables || []
    })) || []
    
    // Count by type and document type
    const stats = {
      total: transformedPartials.length,
      byType: {
        header: transformedPartials.filter(p => p.type === 'header').length,
        footer: transformedPartials.filter(p => p.type === 'footer').length,
        css: transformedPartials.filter(p => p.type === 'css').length
      },
      byDocumentType: {
        quotation: transformedPartials.filter(p => p.documentType === 'quotation').length,
        invoice: transformedPartials.filter(p => p.documentType === 'invoice').length,
        email: transformedPartials.filter(p => p.documentType === 'email').length
      },
      byTeam: {
        japan: transformedPartials.filter(p => p.team === 'japan').length,
        thailand: transformedPartials.filter(p => p.team === 'thailand').length,
        both: transformedPartials.filter(p => p.team === 'both').length
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Partials UI integration test successful',
      stats,
      partials: transformedPartials.slice(0, 5) // Return first 5 for preview
    })
    
  } catch (error) {
    console.error('Error testing partials UI:', error)
    return NextResponse.json({ 
      success: false, 
      error: `Partials UI test failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 })
  }
}
