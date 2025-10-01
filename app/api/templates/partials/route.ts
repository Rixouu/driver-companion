import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    console.log('Fetching partials...')
    const supabase = await getSupabaseServerClient()
    
    // Simple query first to test
    const { data: partials, error } = await supabase
      .from('partial_templates')
      .select('*')
      .eq('is_active', true)
      .order('last_modified', { ascending: false })

    if (error) {
      console.error('Error fetching partials:', error)
      return NextResponse.json({ error: `Failed to fetch partials: ${error.message}` }, { status: 500 })
    }

    console.log('Successfully fetched partials:', partials?.length || 0)
    return NextResponse.json(partials || [])
  } catch (error) {
    console.error('Error in partials GET:', error)
    return NextResponse.json({ error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` }, { status: 500 })
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
