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

    // Quotation Sent Template - Perfect Version
    const quotationSentTemplate = {
      name: 'Quotation Sent',
      type: 'email',
      category: 'quotation',
      subject: 'Your Quotation from {{company_name}} - #{{quotation_id}}',
      html_content: `
        <p>Hello {{customer_name}},</p>
        <p>{{greeting_text}}</p>

        <!-- Service Summary Block -->
        <div class="info-block" style="background:#f8f9fa; padding:20px; border-radius:8px; margin:20px 0;">
          <h3 style="margin:0 0 12px 0; color:#32325D; text-transform: uppercase; font-size:16px;">Service Summary</h3>
          <div style="background:#F8FAFC; border-radius:8px; padding:12px; line-height: 1.6;">
            {{#each quotation_items}}
            <p style="margin: 8px 0; font-size: 14px; color: #32325D;">• {{description}} - {{vehicle_type}}</p>
            {{/each}}
            {{#unless quotation_items}}
            <p style="margin: 8px 0; font-size: 14px; color: #32325D;">• {{service_type}}</p>
            <p style="margin: 8px 0; font-size: 14px; color: #32325D;">• {{vehicle_type}}</p>
            <p style="margin: 8px 0; font-size: 14px; color: #32325D;">• {{duration_hours}} hours{{#if service_days}} × {{service_days}} days{{/if}}</p>
            {{/unless}}
          </div>
        </div>

        <!-- Price Details Block -->
        <div class="info-block" style="background:#f8f9fa; padding:20px; border-radius:8px; margin:20px 0;">
          <h3 style="margin:0 0 12px 0; color:#32325D; text-transform: uppercase; font-size:16px;">Price Details</h3>
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#F8FAFC; border-radius:8px;">
            <tr>
              <td style="padding:12px;">
                <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                  <tr>
                    <th align="left" style="border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; font-size: 14px; color: #8898AA; text-transform: uppercase;">Description</th>
                    <th align="right" style="border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; font-size: 14px; color: #8898AA; text-transform: uppercase;">Price</th>
                  </tr>
                  {{#each quotation_items}}
                  <tr>
                    <td style="padding-top: 15px; padding-bottom: 5px;">
                      <div style="font-weight: medium; font-size: 14px;">{{description}}</div>
                      {{#if service_days}}
                      <div style="font-size: 13px; color: #666;">{{service_days}} days, {{hours_per_day}} hours/day</div>
                      {{/if}}
                    </td>
                    <td align="right" style="padding-top: 15px; padding-bottom: 5px; vertical-align: top;">{{formatCurrency total_price}}</td>
                  </tr>
                  {{/each}}
                  {{#unless quotation_items}}
                  <tr>
                    <td style="padding-top: 15px;">{{vehicle_type}}</td>
                    <td align="right" style="padding-top: 15px;">{{formatCurrency service_total}}</td>
                  </tr>
                  {{/unless}}
                  {{#if selected_package}}
                  <tr>
                    <td style="padding-top: 8px; padding-bottom: 5px;">
                      <div style="font-weight: medium; font-size: 14px; color: #8b5cf6;">Package: {{selected_package.name}}</div>
                    </td>
                    <td align="right" style="padding-top: 8px; padding-bottom: 5px; vertical-align: top; color: #8b5cf6; font-weight: 500;">{{formatCurrency selected_package.base_price}}</td>
                  </tr>
                  {{/if}}
                  {{#if promotion_discount}}
                  <tr>
                    <td style="color: #10b981; padding-top: 5px;">Promotion: {{selected_promotion_name}}</td>
                    <td align="right" style="color: #10b981; padding-top: 5px;">-{{formatCurrency promotion_discount}}</td>
                  </tr>
                  {{/if}}
                  {{#if regular_discount}}
                  <tr>
                    <td style="color: #e53e3e; padding-top: 5px;">Discount ({{discount_percentage}}%)</td>
                    <td align="right" style="color: #e53e3e; padding-top: 5px;">-{{formatCurrency regular_discount}}</td>
                  </tr>
                  <tr>
                    <td style="border-top: 1px solid #e2e8f0; padding-top: 10px; font-weight: 500;">Subtotal</td>
                    <td align="right" style="border-top: 1px solid #e2e8f0; padding-top: 10px; font-weight: 500;">{{formatCurrency subtotal}}</td>
                  </tr>
                  {{/if}}
                  {{#if tax_amount}}
                  <tr>
                    <td style="color: #666; padding-top: 5px;">Tax ({{tax_percentage}}%)</td>
                    <td align="right" style="color: #666; padding-top: 5px;">+{{formatCurrency tax_amount}}</td>
                  </tr>
                  {{/if}}
                  <tr>
                    <td style="border-top: 1px solid #e2e8f0; padding-top: 10px; font-weight: 700;">Total Amount Due</td>
                    <td align="right" style="border-top: 1px solid #e2e8f0; padding-top: 10px; font-weight: 700;">{{formatCurrency final_total}}</td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </div>

        <!-- CTA Section -->
        <div style="padding: 16px; background: #F8FAFC; border-radius: 8px; border: 1px solid #E2E8F0; margin: 20px 0;">
          <p style="margin: 0 0 12px; font-size: 14px; color: #64748B; line-height: 1.6; text-align: center;">
            Please view your quotation using this secure link:
          </p>
          <p style="text-align:center;">
            <a href="{{magic_link}}" class="button" style="background-color:{{primary_color}}; color:white; padding:12px 24px; text-decoration:none; border-radius:6px; display:inline-block; margin:16px 0; font-weight:600; box-shadow:0 2px 4px rgba(0,0,0,0.1);">
              View Quote via Secure Link
            </a>
          </p>
          <p style="margin: 8px 0 0; font-size: 12px; color: #94A3B8; line-height: 1.4; text-align: center;">
            This link is valid for 7 days
          </p>
        </div>

        <p>From your online quote you can accept, decline, comment or print.</p>
        <p>We look forward to working with you.</p>
        <p>Best regards,</p>
        <p>{{from_name}}</p>
      `,
      text_content: `
        Your Quotation from {{company_name}} - #{{quotation_id}}

        Hello {{customer_name}},

        {{greeting_text}}

        Service Summary:
        {{#each quotation_items}}
        • {{description}} - {{vehicle_type}}
        {{/each}}
        {{#unless quotation_items}}
        • {{service_type}}
        • {{vehicle_type}}
        • {{duration_hours}} hours{{#if service_days}} × {{service_days}} days{{/if}}
        {{/unless}}

        Price Details:
        {{#each quotation_items}}
        {{description}}: {{formatCurrency total_price}}
        {{/each}}
        {{#unless quotation_items}}
        {{vehicle_type}}: {{formatCurrency service_total}}
        {{/unless}}
        {{#if selected_package}}
        Package {{selected_package.name}}: {{formatCurrency selected_package.base_price}}
        {{/if}}
        {{#if promotion_discount}}
        Promotion {{selected_promotion_name}}: -{{formatCurrency promotion_discount}}
        {{/if}}
        {{#if regular_discount}}
        Discount ({{discount_percentage}}%): -{{formatCurrency regular_discount}}
        Subtotal: {{formatCurrency subtotal}}
        {{/if}}
        {{#if tax_amount}}
        Tax ({{tax_percentage}}%): +{{formatCurrency tax_amount}}
        {{/if}}
        Total Amount Due: {{formatCurrency final_total}}

        View your quotation online: {{magic_link}}

        From your online quote you can accept, decline, comment or print.

        We look forward to working with you.

        Best regards,
        {{from_name}}
      `,
      variables: {
        customer_name: 'string',
        quotation_id: 'string',
        magic_link: 'string',
        company_name: 'string',
        primary_color: 'string',
        from_name: 'string',
        greeting_text: 'string',
        service_type: 'string',
        vehicle_type: 'string',
        duration_hours: 'number',
        service_days: 'number',
        quotation_items: 'array',
        service_total: 'number',
        selected_package: 'object',
        promotion_discount: 'number',
        selected_promotion_name: 'string',
        regular_discount: 'number',
        discount_percentage: 'number',
        subtotal: 'number',
        tax_amount: 'number',
        tax_percentage: 'number',
        final_total: 'number',
        formatCurrency: 'function'
      },
      is_active: true,
      is_default: true,
    }

    // Store only the core content - header/footer will be generated dynamically by template service
    const fullHtmlContent = quotationSentTemplate.html_content

    // Check if template already exists
    const { data: existingTemplate } = await supabase
      .from('notification_templates')
      .select('id')
      .eq('name', 'Quotation Sent')
      .eq('type', 'email')
      .eq('category', 'quotation')
      .single()

    let data, error

    if (existingTemplate) {
      // Update existing template
      const { data: updateData, error: updateError } = await supabase
        .from('notification_templates')
        .update({
          subject: quotationSentTemplate.subject,
          html_content: fullHtmlContent,
          text_content: quotationSentTemplate.text_content,
          variables: quotationSentTemplate.variables,
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
          ...quotationSentTemplate,
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
      message: existingTemplate ? 'Quotation Sent template updated successfully' : 'Quotation Sent template created successfully',
      template: data
    })

  } catch (error) {
    console.error('Error creating Quotation Sent template:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    )
  }
}
