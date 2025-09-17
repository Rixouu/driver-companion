import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service-client'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    
    // Update the existing Invoice Email template to include payment link block
    const { data, error } = await supabase
      .from('notification_templates')
      .update({
        html_content: `<div style="margin-bottom: 25px;">
  <h2 style="color: #2d3748; margin: 0 0 10px 0;">Hello {{customer_name}},</h2>
  <p style="margin: 0; color: #4a5568;">Please find your invoice for the quotation below.</p>
</div>

<div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
  <h3 style="margin: 0 0 15px 0; color: #2d3748; text-transform: uppercase; font-size: 16px;">Invoice Details</h3>
  <div style="background: white; padding: 15px; border-radius: 6px;">
    <p style="margin: 8px 0; font-size: 14px; color: #2d3748;"><strong>Invoice ID:</strong> {{quotation_id}}</p>
    <p style="margin: 8px 0; font-size: 14px; color: #2d3748;"><strong>Amount:</strong> {{formatCurrency total_amount currency}}</p>
    <p style="margin: 8px 0; font-size: 14px; color: #2d3748;"><strong>Issue Date:</strong> {{formatDate created_at language}}</p>
    <p style="margin: 8px 0; font-size: 14px; color: #2d3748;"><strong>Due Date:</strong> {{formatDate due_date language}}</p>
  </div>
</div>

<div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
  <h3 style="margin: 0 0 15px 0; color: #2d3748; text-transform: uppercase; font-size: 16px;">PDF Attachment</h3>
  <div style="background: white; padding: 15px; border-radius: 6px;">
    <p style="margin: 8px 0; font-size: 14px; color: #2d3748;">A PDF copy of this invoice is attached to this email.</p>
  </div>
</div>

<div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
  <h3 style="margin: 0 0 15px 0; color: #2d3748; text-transform: uppercase; font-size: 16px;">Payment</h3>
  <div style="background: white; padding: 15px; border-radius: 6px;">
    <p style="margin: 8px 0 15px 0; font-size: 14px; color: #2d3748;">Please click the button below to complete your payment securely.</p>
    <div style="text-align: center; margin: 20px 0;">
      <a href="{{payment_link}}" style="display: inline-block; background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Pay Now</a>
    </div>
    <p style="margin: 15px 0 8px 0; font-size: 12px; color: #6b7280; text-align: center;">Or copy and paste this link into your browser:</p>
    <p style="margin: 0; font-size: 12px; color: #3b82f6; text-align: center; word-break: break-all;">{{payment_link}}</p>
  </div>
</div>`,
        text_content: `Invoice - Payment Required - #{{quotation_id}}

Hello {{customer_name}},

Please find your invoice for the quotation below.

Invoice Details:
Invoice ID: {{quotation_id}}
Amount: {{formatCurrency total_amount currency}}
Issue Date: {{formatDate created_at language}}
Due Date: {{formatDate due_date language}}

PDF Attachment:
A PDF copy of this invoice is attached to this email.

Payment:
Please click the link below to complete your payment securely:
{{payment_link}}

Thank you for your business!`,
        updated_at: new Date().toISOString()
      })
      .eq('name', 'Invoice Email')
      .eq('category', 'quotation')
      .select()

    if (error) {
      console.error('Error updating Invoice Email template:', error)
      return NextResponse.json({ 
        error: 'Failed to update template',
        details: error.message,
        code: error.code
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Invoice Email template updated successfully with payment link block',
      template: data[0]
    })

  } catch (error) {
    console.error('Error in update-invoice-email API:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
