import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    console.log('🔄 Starting PDF templates cleanup...')

    // First, delete all existing templates
    const { error: deleteError } = await supabase
      .from('pdf_templates')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

    if (deleteError) {
      console.error('❌ Error deleting existing templates:', deleteError)
      return NextResponse.json({ error: 'Failed to delete existing templates' }, { status: 500 })
    }

    // Insert only the 2 essential templates
    const { data: templates, error: insertError } = await supabase
      .from('pdf_templates')
      .insert([
        {
          name: 'Quotation Template',
          type: 'quotation',
          variant: 'main',
          location: 'server',
          file_path: 'lib/html-pdf-generator.ts',
          function_name: 'generateQuotationHtml',
          description: 'Main quotation template with all statuses and signatures',
          team: 'both',
          is_default: true,
          is_active: true,
          template_data: {
            showTeamInfo: true,
            showLanguageToggle: true,
            statusConfigs: {
              send: { showSignature: false, showStatusBadge: true, statusBadgeColor: '#3B82F6', statusBadgeName: 'SENT' },
              pending: { showSignature: false, showStatusBadge: true, statusBadgeColor: '#F59E0B', statusBadgeName: 'PENDING' },
              approved: { showSignature: true, showStatusBadge: true, statusBadgeColor: '#10B981', statusBadgeName: 'APPROVED' },
              rejected: { showSignature: true, showStatusBadge: true, statusBadgeColor: '#EF4444', statusBadgeName: 'REJECTED' },
              paid: { showSignature: true, showStatusBadge: true, statusBadgeColor: '#10B981', statusBadgeName: 'PAID' },
              converted: { showSignature: true, showStatusBadge: true, statusBadgeColor: '#8B5CF6', statusBadgeName: 'CONVERTED' }
            }
          },
          styling: {
            primaryColor: '#FF2600',
            fontFamily: 'Noto Sans Thai, Noto Sans, sans-serif',
            fontSize: '14px'
          }
        },
        {
          name: 'Invoice Template',
          type: 'invoice',
          variant: 'main',
          location: 'server',
          file_path: 'app/api/quotations/generate-invoice-pdf/route.ts',
          function_name: 'generateInvoiceHtml',
          description: 'Main invoice template with payment status and team info',
          team: 'both',
          is_default: true,
          is_active: true,
          template_data: {
            showTeamInfo: true,
            showLanguageToggle: true,
            statusConfigs: {
              send: { showSignature: false, showStatusBadge: true, statusBadgeColor: '#3B82F6', statusBadgeName: 'SENT' },
              pending: { showSignature: false, showStatusBadge: true, statusBadgeColor: '#F59E0B', statusBadgeName: 'PENDING' },
              approved: { showSignature: true, showStatusBadge: true, statusBadgeColor: '#10B981', statusBadgeName: 'APPROVED' },
              rejected: { showSignature: true, showStatusBadge: true, statusBadgeColor: '#EF4444', statusBadgeName: 'REJECTED' },
              paid: { showSignature: true, showStatusBadge: true, statusBadgeColor: '#10B981', statusBadgeName: 'PAID' },
              converted: { showSignature: true, showStatusBadge: true, statusBadgeColor: '#8B5CF6', statusBadgeName: 'CONVERTED' }
            }
          },
          styling: {
            primaryColor: '#FF2600',
            fontFamily: 'Noto Sans Thai, Noto Sans, sans-serif',
            fontSize: '14px'
          }
        }
      ])
      .select()

    if (insertError) {
      console.error('❌ Error inserting new templates:', insertError)
      return NextResponse.json({ error: 'Failed to insert new templates' }, { status: 500 })
    }

    console.log('✅ PDF templates cleanup completed successfully!')
    console.log(`📊 Created ${templates?.length || 0} templates`)

    return NextResponse.json({
      success: true,
      message: 'PDF templates cleaned up successfully',
      templates: templates?.length || 0
    })

  } catch (error) {
    console.error('❌ Error running cleanup:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
