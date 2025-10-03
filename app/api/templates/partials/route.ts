import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { handleApiError } from '@/lib/errors/error-handler'
import { DatabaseError } from '@/lib/errors/app-error'

export async function GET(request: NextRequest) {
  try {
    console.log('Fetching partials...')
    const supabase = await getSupabaseServerClient()
    
    // Get document type filter from query params
    const { searchParams } = new URL(request.url)
    const documentType = searchParams.get('documentType')
    
    // Build query with optional document type filter
    let query = supabase
      .from('partial_templates')
      .select('*')
      .eq('is_active', true)
      .order('last_modified', { ascending: false })
    
    if (documentType) {
      query = query.eq('document_type', documentType)
    }
    
    const { data: partials, error } = await query

    if (error) {
      throw new DatabaseError('Error fetching partials from database.', { cause: error })
    }

    console.log('Successfully fetched partials:', partials?.length || 0)
    
    // Transform snake_case to camelCase to match frontend interface
    const transformedPartials = partials?.map(partial => ({
      id: partial.id,
      name: partial.name,
      type: partial.type,
      documentType: partial.document_type, // Transform document_type to documentType
      team: partial.team,
      content: partial.content,
      isActive: partial.is_active, // Transform is_active to isActive
      lastModified: partial.last_modified, // Transform last_modified to lastModified
      variables: partial.variables || []
    })) || []
    
    return NextResponse.json(transformedPartials)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()
    const body = await request.json()
    
    const { data, error } = await supabase
      .from('partial_templates')
      .insert([{
        name: body.name,
        type: body.type,
        document_type: body.documentType,
        team: body.team,
        content: body.content,
        is_active: body.isActive,
        variables: body.variables,
        last_modified: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating partial:', error)
      return NextResponse.json({ error: 'Failed to create partial' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in partials POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()
    const body = await request.json()
    
    const { data, error } = await supabase
      .from('partial_templates')
      .update({
        name: body.name,
        type: body.type,
        document_type: body.documentType,
        team: body.team,
        content: body.content,
        is_active: body.isActive,
        variables: body.variables,
        last_modified: new Date().toISOString()
      })
      .eq('id', body.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating partial:', error)
      return NextResponse.json({ error: 'Failed to update partial' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in partials PUT:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
