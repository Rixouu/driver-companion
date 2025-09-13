import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const { data: themes, error } = await supabase
      .from('ui_themes')
      .select('*')
      .eq('is_active', true)
      .order('is_default', { ascending: false })
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching UI themes:', error)
      return NextResponse.json({ error: 'Failed to fetch UI themes' }, { status: 500 })
    }

    return NextResponse.json(themes)
  } catch (error) {
    console.error('Error in UI themes API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const body = await request.json()

    // Check if user is authenticated and has admin role
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate required fields
    const { name, display_name, description, settings, is_default = false } = body
    if (!name || !display_name || !settings) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // If this is being set as default, unset other defaults
    if (is_default) {
      await supabase
        .from('ui_themes')
        .update({ is_default: false })
        .eq('is_default', true)
    }

    const { data: theme, error } = await supabase
      .from('ui_themes')
      .insert({
        name,
        display_name,
        description,
        settings,
        is_default,
        created_by: user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating UI theme:', error)
      return NextResponse.json({ error: 'Failed to create UI theme' }, { status: 500 })
    }

    return NextResponse.json(theme)
  } catch (error) {
    console.error('Error in UI themes POST API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const body = await request.json()

    // Check if user is authenticated and has admin role
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, name, display_name, description, settings, is_default } = body
    if (!id) {
      return NextResponse.json({ error: 'Theme ID is required' }, { status: 400 })
    }

    // If this is being set as default, unset other defaults
    if (is_default) {
      await supabase
        .from('ui_themes')
        .update({ is_default: false })
        .eq('is_default', true)
        .neq('id', id)
    }

    const { data: theme, error } = await supabase
      .from('ui_themes')
      .update({
        name,
        display_name,
        description,
        settings,
        is_default,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating UI theme:', error)
      return NextResponse.json({ error: 'Failed to update UI theme' }, { status: 500 })
    }

    return NextResponse.json(theme)
  } catch (error) {
    console.error('Error in UI themes PUT API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
