import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service-client'
import { generateEmailHeader, generateEmailFooter, generateEmailTemplate } from '@/lib/email/email-partials'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    
    // Get app settings for branding
    const { data: appSettingsData } = await supabase
      .from('app_settings')
      .select('*')

    const appSettings = appSettingsData?.reduce((acc, item) => {
      try {
        acc[item.key] = JSON.parse(item.value);
      } catch (e) {
        acc[item.key] = item.value;
      }
      return acc
    }, {}) || {}

    // Quotation Rejected Template
    const quotationRejectedTemplate = {
      name: 'Quotation Rejected',
      type: 'email',
      category: 'quotation',
      subject: 'Quotation Update - #{{quotation_id}}',
      html_content: `
        <p>Hello {{customer_name}},</p>
        <p>Thank you for your interest in our services. We have received your quotation request and after careful consideration, we regret to inform you that we are unable to proceed with your quotation at this time.</p>

        <!-- Quotation Details Block -->
        <div class="info-block" style="background:#f8f9fa; padding:20px; border-radius:8px; margin:20px 0;">
          <h3 style="margin:0 0 12px 0; color:#32325D; text-transform: uppercase; font-size:16px;">Quotation Details</h3>
          <div style="background:#F8FAFC; border-radius:8px; padding:12px; line-height: 1.6;">
            <p style="margin: 8px 0; font-size: 14px; color: #32325D;"><strong>Quotation ID:</strong> {{quotation_id}}</p>
            <p style="margin: 8px 0; font-size: 14px; color: #32325D;"><strong>Service Type:</strong> {{service_type}}</p>
            <p style="margin: 8px 0; font-size: 14px; color: #32325D;"><strong>Vehicle Type:</strong> {{vehicle_type}}</p>
            <p style="margin: 8px 0; font-size: 14px; color: #32325D;"><strong>Requested Date:</strong> {{requested_date}}</p>
            <p style="margin: 8px 0; font-size: 14px; color: #32325D;"><strong>Status:</strong> <span style="color:#dc2626; font-weight:600;">Rejected</span></p>
          </div>
        </div>

        <!-- Rejection Reason Block -->
        {{#if rejection_reason}}
        <div class="info-block" style="background:#fef2f2; padding:20px; border-radius:8px; margin:20px 0; border-left: 4px solid #dc2626;">
          <h3 style="margin:0 0 12px 0; color:#dc2626; text-transform: uppercase; font-size:16px;">Reason for Rejection</h3>
          <div style="background:#FEF7F7; border-radius:8px; padding:12px; line-height: 1.6;">
            <p style="margin: 0; font-size: 14px; color: #7f1d1d;">{{rejection_reason}}</p>
          </div>
        </div>
        {{/if}}

        <!-- Alternative Options Block -->
        <div class="info-block" style="background:#f0f9ff; padding:20px; border-radius:8px; margin:20px 0; border-left: 4px solid #0ea5e9;">
          <h3 style="margin:0 0 12px 0; color:#0ea5e9; text-transform: uppercase; font-size:16px;">Alternative Options</h3>
          <div style="background:#F0F9FF; border-radius:8px; padding:12px; line-height: 1.6;">
            <p style="margin: 0 0 12px; font-size: 14px; color: #0c4a6e;">We understand this may be disappointing. Here are some alternatives we can offer:</p>
            <ul style="margin: 0; padding-left: 20px; color: #0c4a6e;">
              <li style="margin: 8px 0; font-size: 14px;">Different vehicle options that may be available</li>
              <li style="margin: 8px 0; font-size: 14px;">Alternative dates for your service</li>
              <li style="margin: 8px 0; font-size: 14px;">Modified service packages to better fit your needs</li>
              <li style="margin: 8px 0; font-size: 14px;">Referral to our partner companies for specialized services</li>
            </ul>
          </div>
        </div>

        <!-- Next Steps Block -->
        <div style="padding: 16px; background: #F8FAFC; border-radius: 8px; border: 1px solid #E2E8F0; margin: 20px 0;">
          <h3 style="margin: 0 0 12px; color: #32325D; font-size: 16px;">What's Next?</h3>
          <p style="margin: 0 0 12px; font-size: 14px; color: #64748B; line-height: 1.6;">
            If you would like to discuss alternative options or have any questions, please don't hesitate to contact us:
          </p>
          <div style="text-align: center; margin: 16px 0;">
            <a href="mailto:{{contact_email}}" class="button" style="background-color:{{primary_color}}; color:white; padding:12px 24px; text-decoration:none; border-radius:6px; display:inline-block; margin:8px; font-weight:600; box-shadow:0 2px 4px rgba(0,0,0,0.1);">
              Contact Us
            </a>
            <a href="{{website_url}}" class="button" style="background-color:transparent; color:{{primary_color}}; padding:12px 24px; text-decoration:none; border-radius:6px; display:inline-block; margin:8px; font-weight:600; border:2px solid {{primary_color}};">
              Visit Our Website
            </a>
          </div>
        </div>

        <p>We appreciate your understanding and hope to serve you in the future.</p>
        <p>Best regards,</p>
        <p>{{from_name}}</p>
      `,
      text_content: `
        Quotation Update - #{{quotation_id}}

        Hello {{customer_name}},

        Thank you for your interest in our services. We have received your quotation request and after careful consideration, we regret to inform you that we are unable to proceed with your quotation at this time.

        Quotation Details:
        • Quotation ID: {{quotation_id}}
        • Service Type: {{service_type}}
        • Vehicle Type: {{vehicle_type}}
        • Requested Date: {{requested_date}}
        • Status: Rejected

        {{#if rejection_reason}}
        Reason for Rejection:
        {{rejection_reason}}
        {{/if}}

        Alternative Options:
        We understand this may be disappointing. Here are some alternatives we can offer:
        • Different vehicle options that may be available
        • Alternative dates for your service
        • Modified service packages to better fit your needs
        • Referral to our partner companies for specialized services

        What's Next?
        If you would like to discuss alternative options or have any questions, please don't hesitate to contact us at {{contact_email}} or visit our website at {{website_url}}.

        We appreciate your understanding and hope to serve you in the future.

        Best regards,
        {{from_name}}
      `,
      variables: {
        customer_name: 'string',
        quotation_id: 'string',
        service_type: 'string',
        vehicle_type: 'string',
        requested_date: 'string',
        rejection_reason: 'string',
        contact_email: 'string',
        website_url: 'string',
        primary_color: 'string',
        from_name: 'string'
      },
      is_active: true,
      is_default: false,
    }

    // Store only the core content - header/footer will be generated dynamically by template service
    const fullHtmlContent = quotationRejectedTemplate.html_content

    // Check if template already exists
    const { data: existingTemplate } = await supabase
      .from('notification_templates')
      .select('id')
      .eq('name', 'Quotation Rejected')
      .eq('type', 'email')
      .eq('category', 'quotation')
      .single()

    let data, error

    if (existingTemplate) {
      // Update existing template
      const { data: updateData, error: updateError } = await supabase
        .from('notification_templates')
        .update({
          subject: quotationRejectedTemplate.subject,
          html_content: fullHtmlContent,
          text_content: quotationRejectedTemplate.text_content,
          variables: quotationRejectedTemplate.variables,
          is_active: true,
          is_default: false,
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
          ...quotationRejectedTemplate,
          html_content: fullHtmlContent,
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
      message: existingTemplate ? 'Quotation Rejected template updated successfully' : 'Quotation Rejected template created successfully',
      template: data
    })

  } catch (error) {
    console.error('Error creating Quotation Rejected template:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    )
  }
}
