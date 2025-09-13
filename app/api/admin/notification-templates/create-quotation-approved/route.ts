import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service-client'
import { generateEmailTemplate } from '@/lib/email/email-partials'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient()

    // Get app settings for branding
    const { data: appSettings } = await supabase
      .from('app_settings')
      .select('*')
      .single()

    // Define the Quotation Approved template
    const quotationApprovedTemplate = {
      name: 'Quotation Approved',
      type: 'email',
      category: 'quotation',
      subject: 'Your Quotation has been Approved - #{{quotation_id}}',
      html_content: `
        <p>Hello {{customer_name}},</p>
        
        <p>Great news! Your quotation has been approved.</p>
        
        <div style="background:#f8f9fa; padding:20px; border-radius:8px; margin:20px 0;">
          <h3 style="margin:0 0 12px 0; color:#32325D;">Quotation Details</h3>
          <p style="margin:0; color:#525f7f;">
            <strong>Quotation ID:</strong> {{quotation_id}}<br>
            <strong>Title:</strong> {{quotation_title}}<br>
            <strong>Total Amount:</strong> {{currency}} {{total_amount}}<br>
            <strong>Status:</strong> <span style="color:#059669; font-weight:600;">Approved</span><br>
            <strong>Date:</strong> {{approval_date}}
          </p>
        </div>
        
        {{#if approval_notes}}
          <div style="background-color: #f0fdf4; border-left: 4px solid #059669; padding: 16px; margin: 16px 0; border-radius: 4px;">
            <h4 style="margin:0 0 8px 0; color:#32325D;">Approval Notes:</h4>
            <p style="margin:0; color:#525f7f;">{{approval_notes}}</p>
          </div>
        {{/if}}
        
        <p>You can now proceed with the next steps. If you have any questions or need assistance, please don't hesitate to contact us.</p>
        
        <p>Thank you for choosing {{company_name}}!</p>
      `,
      text_content: `
        Your Quotation has been Approved - #{{quotation_id}}

        Hello {{customer_name}},

        Great news! Your quotation has been approved.

        Quotation Details:
        - Quotation ID: {{quotation_id}}
        - Title: {{quotation_title}}
        - Total Amount: {{currency}} {{total_amount}}
        - Status: Approved
        - Date: {{approval_date}}

        {{#if approval_notes}}
        Approval Notes:
        {{approval_notes}}
        {{/if}}

        You can now proceed with the next steps. If you have any questions or need assistance, please don't hesitate to contact us.

        Thank you for choosing {{company_name}}!
      `,
      variables: {
        customer_name: 'string',
        quotation_id: 'string',
        quotation_title: 'string',
        total_amount: 'string',
        currency: 'string',
        approval_date: 'string',
        approval_notes: 'string',
        company_name: 'string'
      },
      is_active: true,
      is_default: true,
    }

    // Store only the core content - header/footer will be generated dynamically by template service
    const fullHtmlContent = quotationApprovedTemplate.html_content

    // Check if template already exists
    const { data: existingTemplate } = await supabase
      .from('notification_templates')
      .select('id')
      .eq('name', 'Quotation Approved')
      .eq('type', 'email')
      .eq('category', 'quotation')
      .single()

    let data, error

    if (existingTemplate) {
      // Update existing template
      const { data: updateData, error: updateError } = await supabase
        .from('notification_templates')
        .update({
          subject: quotationApprovedTemplate.subject,
          html_content: fullHtmlContent,
          text_content: quotationApprovedTemplate.text_content,
          variables: quotationApprovedTemplate.variables,
          is_active: true,
          is_default: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingTemplate.id)
        .select()
        .single()
      
      data = updateData
      error = updateError
    } else {
      // Insert new template
      const { data: insertData, error: insertError } = await supabase
        .from('notification_templates')
        .insert({
          ...quotationApprovedTemplate,
          html_content: fullHtmlContent, // Store the full HTML with header/footer
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
      
      data = insertData
      error = insertError
    }

    if (error) throw error

    return NextResponse.json({ 
      success: true, 
      message: existingTemplate ? 'Quotation Approved template updated successfully' : 'Quotation Approved template created successfully',
      template: data
    })

  } catch (error) {
    console.error('Error creating Quotation Approved template:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    )
  }
}
