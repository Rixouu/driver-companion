import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service-client'

// =============================================================================
// POPULATE UNIFIED EMAIL TEMPLATES - Clean Database Setup
// =============================================================================

const UNIFIED_TEMPLATES = [
  // =============================================================================
  // QUOTATION TEMPLATES
  // =============================================================================
  
  {
    name: 'Quotation Sent',
    type: 'email',
    category: 'quotation',
    subject: '{{language == "ja" ? "ドライバーからの見積書" : "Your Quotation from Driver"}} - {{quotation_id}}',
    html_content: `
      <!DOCTYPE html>
      <html lang="{{language}}">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{{quotation_id}} - {{company_name}}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 30px; padding: 20px; background: linear-gradient(135deg, {{primary_color}}, #e53e3e); border-radius: 8px;">
          <h1 style="color: white; margin: 0; font-size: 24px;">{{company_name}}</h1>
          <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">{{language == "ja" ? "プレミアム輸送サービス" : "Premium Transportation Services"}}</p>
        </div>

        <!-- Greeting -->
        <div style="margin-bottom: 25px;">
          <h2 style="color: #2d3748; margin: 0 0 10px 0;">{{language == "ja" ? "こんにちは" : "Hello"}} {{customer_name}},</h2>
          <p style="margin: 0; color: #4a5568;">{{greeting_text}}</p>
        </div>

        <!-- Service Summary -->
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid {{primary_color}};">
          <h3 style="margin: 0 0 15px 0; color: #2d3748; text-transform: uppercase; font-size: 16px;">
            {{language == "ja" ? "サービス詳細" : "Service Summary"}}
          </h3>
          <div style="background: white; padding: 15px; border-radius: 6px;">
            <p style="margin: 8px 0; font-size: 14px; color: #2d3748;"><strong>{{language == "ja" ? "サービス" : "Service"}}:</strong> {{service_type}}</p>
            <p style="margin: 8px 0; font-size: 14px; color: #2d3748;"><strong>{{language == "ja" ? "車両" : "Vehicle"}}:</strong> {{vehicle_type}}</p>
            <p style="margin: 8px 0; font-size: 14px; color: #2d3748;"><strong>{{language == "ja" ? "時間" : "Duration"}}:</strong> {{duration_hours}} {{language == "ja" ? "時間" : "hours"}}{{#if service_days}} × {{service_days}} {{language == "ja" ? "日" : "days"}}{{/if}}</p>
            <p style="margin: 8px 0; font-size: 14px; color: #2d3748;"><strong>{{language == "ja" ? "出発地" : "From"}}:</strong> {{pickup_location}}</p>
            <p style="margin: 8px 0; font-size: 14px; color: #2d3748;"><strong>{{language == "ja" ? "到着地" : "To"}}:</strong> {{dropoff_location}}</p>
            <p style="margin: 8px 0; font-size: 14px; color: #2d3748;"><strong>{{language == "ja" ? "日時" : "Date & Time"}}:</strong> {{date}} at {{time}}</p>
          </div>
        </div>

        <!-- Price Details -->
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 15px 0; color: #2d3748; text-transform: uppercase; font-size: 16px;">
            {{language == "ja" ? "料金詳細" : "Price Details"}}
          </h3>
          <table width="100%" cellpadding="0" cellspacing="0" style="background: white; border-radius: 6px; overflow: hidden;">
            <tr>
              <td style="padding: 15px; border-bottom: 1px solid #e2e8f0;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #2d3748;">{{vehicle_type}}</td>
                    <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #2d3748;">{{formatCurrency service_total currency}}</td>
                  </tr>
                  {{#if selected_package}}
                  <tr>
                    <td style="padding: 8px 0; color: #8b5cf6;">{{language == "ja" ? "パッケージ" : "Package"}}: {{selected_package.name}}</td>
                    <td style="padding: 8px 0; text-align: right; color: #8b5cf6;">{{formatCurrency selected_package.base_price currency}}</td>
                  </tr>
                  {{/if}}
                  {{#if promotion_discount}}
                  <tr>
                    <td style="padding: 8px 0; color: #10b981;">{{language == "ja" ? "プロモーション" : "Promotion"}}: {{selected_promotion_name}}</td>
                    <td style="padding: 8px 0; text-align: right; color: #10b981;">-{{formatCurrency promotion_discount currency}}</td>
                  </tr>
                  {{/if}}
                  {{#if regular_discount}}
                  <tr>
                    <td style="padding: 8px 0; color: #e53e3e;">{{language == "ja" ? "割引" : "Discount"}} ({{discount_percentage}}%)</td>
                    <td style="padding: 8px 0; text-align: right; color: #e53e3e;">-{{formatCurrency regular_discount currency}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-top: 1px solid #e2e8f0; font-weight: 600;">{{language == "ja" ? "小計" : "Subtotal"}}</td>
                    <td style="padding: 8px 0; text-align: right; border-top: 1px solid #e2e8f0; font-weight: 600;">{{formatCurrency subtotal currency}}</td>
                  </tr>
                  {{/if}}
                  {{#if tax_amount}}
                  <tr>
                    <td style="padding: 8px 0; color: #666;">{{language == "ja" ? "税金" : "Tax"}} ({{tax_percentage}}%)</td>
                    <td style="padding: 8px 0; text-align: right; color: #666;">+{{formatCurrency tax_amount currency}}</td>
                  </tr>
                  {{/if}}
                  <tr style="background: #f7fafc;">
                    <td style="padding: 12px 8px; border-top: 2px solid {{primary_color}}; font-weight: 700; font-size: 16px;">{{language == "ja" ? "合計金額" : "Total Amount Due"}}</td>
                    <td style="padding: 12px 8px; text-align: right; border-top: 2px solid {{primary_color}}; font-weight: 700; font-size: 16px; color: {{primary_color}};">{{formatCurrency final_total currency}}</td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </div>

        <!-- CTA Section -->
        {{#if magic_link}}
        <div style="text-align: center; margin: 30px 0; padding: 20px; background: #f7fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
          <p style="margin: 0 0 15px; font-size: 14px; color: #4a5568;">
            {{language == "ja" ? "オンラインで見積書を確認してください：" : "Please view your quotation online:"}}
          </p>
          <a href="{{magic_link}}" style="background: {{primary_color}}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            {{language == "ja" ? "オンラインで見積書を確認" : "View Quotation Online"}}
          </a>
          <p style="margin: 10px 0 0; font-size: 12px; color: #94a3b8;">
            {{language == "ja" ? "このリンクは7日間有効です" : "This link is valid for 7 days"}}
          </p>
        </div>
        {{/if}}

        <!-- Footer -->
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center;">
          <p style="margin: 0 0 10px; color: #4a5568;">
            {{language == "ja" ? "オンライン見積もりから、承諾、辞退、コメント、印刷ができます。" : "From your online quote you can accept, decline, comment or print."}}
          </p>
          <p style="margin: 0 0 10px; color: #4a5568;">
            {{language == "ja" ? "よろしくお願いいたします。" : "We look forward to working with you."}}
          </p>
          <p style="margin: 0; color: #2d3748; font-weight: 600;">{{from_name}}</p>
        </div>

      </body>
      </html>
    `,
    text_content: `
      {{language == "ja" ? "ドライバーからの見積書" : "Your Quotation from Driver"}} - {{quotation_id}}

      {{language == "ja" ? "こんにちは" : "Hello"}} {{customer_name}},

      {{greeting_text}}

      {{language == "ja" ? "サービス詳細" : "Service Summary"}}:
      - {{language == "ja" ? "サービス" : "Service"}}: {{service_type}}
      - {{language == "ja" ? "車両" : "Vehicle"}}: {{vehicle_type}}
      - {{language == "ja" ? "時間" : "Duration"}}: {{duration_hours}} {{language == "ja" ? "時間" : "hours"}}{{#if service_days}} × {{service_days}} {{language == "ja" ? "日" : "days"}}{{/if}}
      - {{language == "ja" ? "出発地" : "From"}}: {{pickup_location}}
      - {{language == "ja" ? "到着地" : "To"}}: {{dropoff_location}}
      - {{language == "ja" ? "日時" : "Date & Time"}}: {{date}} at {{time}}

      {{language == "ja" ? "料金詳細" : "Price Details"}}:
      {{vehicle_type}}: {{formatCurrency service_total currency}}
      {{#if selected_package}}
      {{language == "ja" ? "パッケージ" : "Package"}} {{selected_package.name}}: {{formatCurrency selected_package.base_price currency}}
      {{/if}}
      {{#if promotion_discount}}
      {{language == "ja" ? "プロモーション" : "Promotion"}} {{selected_promotion_name}}: -{{formatCurrency promotion_discount currency}}
      {{/if}}
      {{#if regular_discount}}
      {{language == "ja" ? "割引" : "Discount"}} ({{discount_percentage}}%): -{{formatCurrency regular_discount currency}}
      {{language == "ja" ? "小計" : "Subtotal"}}: {{formatCurrency subtotal currency}}
      {{/if}}
      {{#if tax_amount}}
      {{language == "ja" ? "税金" : "Tax"}} ({{tax_percentage}}%): +{{formatCurrency tax_amount currency}}
      {{/if}}
      {{language == "ja" ? "合計金額" : "Total Amount Due"}}: {{formatCurrency final_total currency}}

      {{#if magic_link}}
      {{language == "ja" ? "オンラインで見積書を確認" : "View your quotation online"}}: {{magic_link}}
      {{/if}}

      {{language == "ja" ? "オンライン見積もりから、承諾、辞退、コメント、印刷ができます。" : "From your online quote you can accept, decline, comment or print."}}

      {{language == "ja" ? "よろしくお願いいたします。" : "We look forward to working with you."}}

      {{from_name}}
    `,
    variables: {
      quotation_id: 'string',
      customer_name: 'string',
      service_type: 'string',
      vehicle_type: 'string',
      duration_hours: 'number',
      service_days: 'number',
      pickup_location: 'string',
      dropoff_location: 'string',
      date: 'string',
      time: 'string',
      currency: 'string',
      total_amount: 'number',
      final_total: 'number',
      magic_link: 'string',
      language: 'string'
    },
    is_active: true,
    is_default: true
  },

  // =============================================================================
  // BOOKING TEMPLATES
  // =============================================================================
  
  {
    name: 'Booking Confirmed',
    type: 'email',
    category: 'booking',
    subject: '{{language == "ja" ? "予約確認" : "Booking Confirmed"}} - {{booking_id}}',
    html_content: `
      <!DOCTYPE html>
      <html lang="{{language}}">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{{booking_id}} - {{company_name}}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 30px; padding: 20px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 8px;">
          <h1 style="color: white; margin: 0; font-size: 24px;">{{language == "ja" ? "予約確認" : "Booking Confirmed"}}</h1>
          <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">{{company_name}}</p>
        </div>

        <!-- Greeting -->
        <div style="margin-bottom: 25px;">
          <h2 style="color: #2d3748; margin: 0 0 10px 0;">{{language == "ja" ? "こんにちは" : "Hello"}} {{customer_name}},</h2>
          <p style="margin: 0; color: #4a5568;">{{greeting_text}}</p>
        </div>

        <!-- Booking Details -->
        <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
          <h3 style="margin: 0 0 15px 0; color: #2d3748; text-transform: uppercase; font-size: 16px;">
            {{language == "ja" ? "予約詳細" : "Booking Details"}}
          </h3>
          <div style="background: white; padding: 15px; border-radius: 6px;">
            <p style="margin: 8px 0; font-size: 14px; color: #2d3748;"><strong>{{language == "ja" ? "予約ID" : "Booking ID"}}:</strong> {{booking_id}}</p>
            <p style="margin: 8px 0; font-size: 14px; color: #2d3748;"><strong>{{language == "ja" ? "サービス" : "Service"}}:</strong> {{service_name}}</p>
            <p style="margin: 8px 0; font-size: 14px; color: #2d3748;"><strong>{{language == "ja" ? "車両" : "Vehicle"}}:</strong> {{vehicle_make}} {{vehicle_model}}</p>
            <p style="margin: 8px 0; font-size: 14px; color: #2d3748;"><strong>{{language == "ja" ? "定員" : "Capacity"}}:</strong> {{vehicle_capacity}} {{language == "ja" ? "名" : "passengers"}}</p>
            <p style="margin: 8px 0; font-size: 14px; color: #2d3748;"><strong>{{language == "ja" ? "出発地" : "From"}}:</strong> {{pickup_location}}</p>
            <p style="margin: 8px 0; font-size: 14px; color: #2d3748;"><strong>{{language == "ja" ? "到着地" : "To"}}:</strong> {{dropoff_location}}</p>
            <p style="margin: 8px 0; font-size: 14px; color: #2d3748;"><strong>{{language == "ja" ? "日時" : "Date & Time"}}:</strong> {{date}} at {{time}}</p>
            <p style="margin: 8px 0; font-size: 14px; color: #2d3748;"><strong>{{language == "ja" ? "料金" : "Price"}}:</strong> {{formatCurrency price_amount price_currency}}</p>
          </div>
        </div>

        <!-- Payment Status -->
        {{#if payment_data}}
        <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
          <h3 style="margin: 0 0 15px 0; color: #2d3748; text-transform: uppercase; font-size: 16px;">
            {{language == "ja" ? "支払い情報" : "Payment Information"}}
          </h3>
          <div style="background: white; padding: 15px; border-radius: 6px;">
            <p style="margin: 8px 0; font-size: 14px; color: #2d3748;"><strong>{{language == "ja" ? "支払い方法" : "Payment Method"}}:</strong> {{payment_data.payment_method}}</p>
            <p style="margin: 8px 0; font-size: 14px; color: #2d3748;"><strong>{{language == "ja" ? "取引ID" : "Transaction ID"}}:</strong> {{payment_data.transaction_id}}</p>
            <p style="margin: 8px 0; font-size: 14px; color: #2d3748;"><strong>{{language == "ja" ? "支払い日時" : "Paid At"}}:</strong> {{formatDate payment_data.paid_at language}}</p>
          </div>
        </div>
        {{/if}}

        <!-- Footer -->
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center;">
          <p style="margin: 0 0 10px; color: #4a5568;">
            {{language == "ja" ? "ご質問がございましたら、お気軽にお問い合わせください。" : "If you have any questions, please don't hesitate to contact us."}}
          </p>
          <p style="margin: 0; color: #2d3748; font-weight: 600;">{{from_name}}</p>
        </div>

      </body>
      </html>
    `,
    text_content: `
      {{language == "ja" ? "予約確認" : "Booking Confirmed"}} - {{booking_id}}

      {{language == "ja" ? "こんにちは" : "Hello"}} {{customer_name}},

      {{greeting_text}}

      {{language == "ja" ? "予約詳細" : "Booking Details"}}:
      - {{language == "ja" ? "予約ID" : "Booking ID"}}: {{booking_id}}
      - {{language == "ja" ? "サービス" : "Service"}}: {{service_name}}
      - {{language == "ja" ? "車両" : "Vehicle"}}: {{vehicle_make}} {{vehicle_model}}
      - {{language == "ja" ? "定員" : "Capacity"}}: {{vehicle_capacity}} {{language == "ja" ? "名" : "passengers"}}
      - {{language == "ja" ? "出発地" : "From"}}: {{pickup_location}}
      - {{language == "ja" ? "到着地" : "To"}}: {{dropoff_location}}
      - {{language == "ja" ? "日時" : "Date & Time"}}: {{date}} at {{time}}
      - {{language == "ja" ? "料金" : "Price"}}: {{formatCurrency price_amount price_currency}}

      {{#if payment_data}}
      {{language == "ja" ? "支払い情報" : "Payment Information"}}:
      - {{language == "ja" ? "支払い方法" : "Payment Method"}}: {{payment_data.payment_method}}
      - {{language == "ja" ? "取引ID" : "Transaction ID"}}: {{payment_data.transaction_id}}
      - {{language == "ja" ? "支払い日時" : "Paid At"}}: {{formatDate payment_data.paid_at language}}
      {{/if}}

      {{language == "ja" ? "ご質問がございましたら、お気軽にお問い合わせください。" : "If you have any questions, please don't hesitate to contact us."}}

      {{from_name}}
    `,
    variables: {
      booking_id: 'string',
      customer_name: 'string',
      service_name: 'string',
      vehicle_make: 'string',
      vehicle_model: 'string',
      vehicle_capacity: 'number',
      pickup_location: 'string',
      dropoff_location: 'string',
      date: 'string',
      time: 'string',
      price_amount: 'number',
      price_currency: 'string',
      payment_data: 'object',
      language: 'string'
    },
    is_active: true,
    is_default: true
  },

  // =============================================================================
  // SYSTEM TEMPLATES
  // =============================================================================
  
  {
    name: 'System Notification',
    type: 'email',
    category: 'system',
    subject: '{{subject}} - {{company_name}}',
    html_content: `
      <div style="margin-bottom: 25px;">
        <h2 style="color: #2d3748; margin: 0 0 10px 0;">{{title}}</h2>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #4a5568; white-space: pre-line;">{{message}}</p>
        </div>
      </div>
    `,
    text_content: `
      {{title}}

      {{message}}
    `,
    variables: {
      subject: 'string',
      title: 'string',
      message: 'string',
      language: 'string'
    },
    is_active: true,
    is_default: true
  }
]

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 [UNIFIED-TEMPLATE-POPULATE] Starting template population')
    
    const supabase = createServiceClient()
    
    // Clear existing templates first
    console.log('🧹 [UNIFIED-TEMPLATE-POPULATE] Clearing existing templates')
    await supabase.from('notification_templates').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    
    // Insert new templates
    console.log(`📝 [UNIFIED-TEMPLATE-POPULATE] Inserting ${UNIFIED_TEMPLATES.length} templates`)
    
    const { data, error } = await supabase
      .from('notification_templates')
      .insert(UNIFIED_TEMPLATES)
      .select()

    if (error) {
      console.error('❌ [UNIFIED-TEMPLATE-POPULATE] Error inserting templates:', error)
      return NextResponse.json({ 
        error: 'Failed to insert templates',
        details: error.message 
      }, { status: 500 })
    }

    console.log(`✅ [UNIFIED-TEMPLATE-POPULATE] Successfully inserted ${data?.length || 0} templates`)

    return NextResponse.json({
      success: true,
      message: `Successfully populated ${data?.length || 0} unified email templates`,
      templates: data
    })

  } catch (error) {
    console.error('❌ [UNIFIED-TEMPLATE-POPULATE] Unexpected error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
