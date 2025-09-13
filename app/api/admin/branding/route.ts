import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service-client'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'company', 'email', 'document', 'client_portal'
    
    if (!type) {
      // Return all branding data
      const [companyResult, emailResult, documentResult, clientPortalResult] = await Promise.all([
        supabase.from('company_branding').select('*').eq('is_active', true).single(),
        supabase.from('email_branding').select('*').eq('is_active', true).single(),
        supabase.from('document_branding').select('*').eq('is_active', true).single(),
        supabase.from('client_portal_branding').select('*').eq('is_active', true).single()
      ])

      return NextResponse.json({
        company: companyResult.data,
        email: emailResult.data,
        document: documentResult.data,
        client_portal: clientPortalResult.data
      })
    }

    // Return specific branding type
    const tableName = type === 'client_portal' ? 'client_portal_branding' : `${type}_branding`
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('is_active', true)
      .single()

    if (error && error.code !== 'PGRST116') throw error

    return NextResponse.json(data)

  } catch (error) {
    console.error('Error fetching branding data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const { type, ...brandingData } = await request.json()
    
    if (!type) {
      return NextResponse.json(
        { error: 'Branding type is required' },
        { status: 400 }
      )
    }

    const tableName = type === 'client_portal' ? 'client_portal_branding' : `${type}_branding`
    
    // Deactivate existing branding
    await supabase
      .from(tableName)
      .update({ is_active: false })
      .eq('is_active', true)

    // Insert new branding
    const { data, error } = await supabase
      .from(tableName)
      .insert([{ ...brandingData, is_active: true }])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)

  } catch (error) {
    console.error('Error creating branding:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const { type, id, ...updateData } = await request.json()
    
    if (!type || !id) {
      return NextResponse.json(
        { error: 'Branding type and ID are required' },
        { status: 400 }
      )
    }

    const tableName = type === 'client_portal' ? 'client_portal_branding' : `${type}_branding`
    
    const { data, error } = await supabase
      .from(tableName)
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)

  } catch (error) {
    console.error('Error updating branding:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
