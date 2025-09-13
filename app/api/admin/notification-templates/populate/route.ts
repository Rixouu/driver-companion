import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service-client'

// ONLY the real email templates that actually exist in your system
const REAL_EMAIL_TEMPLATES = [
  {
    name: 'Quotation Sent',
    type: 'email',
    category: 'quotation',
    subject: '{{language == "ja" ? "ドライバーからの見積書" : "Your Quotation from Driver"}} - {{quotation_id}}',
    html_content: `
      <p>{{language == "ja" ? "こんにちは" : "Hello"}} {{customer_name}},</p>
      <p>{{language == "ja" ? "弊社サービスにご興味をお持ちいただき、ありがとうございます。ご依頼いただいた見積書を添付にてお送りいたします。" : "Thank you for your interest in our services. Please find attached your quotation."}}</p>
      <p>{{language == "ja" ? "ご質問がございましたら、またはこの見積もりを承諾される場合は、以下のボタンをクリックしてください。" : "If you have any questions or would like to proceed with this quotation, please click in the button below."}}</p>
      <p style="text-align:center;">
        <a href="{{magic_link}}" style="background-color:{{primary_color}}; color:white; padding:12px 24px; text-decoration:none; border-radius:6px; display:inline-block; margin:16px 0; font-weight:600; box-shadow:0 2px 4px rgba(0,0,0,0.1);">
          {{language == "ja" ? "オンラインで見積書を確認" : "View Your Quotation Online"}}
        </a>
      </p>
      <p>{{language == "ja" ? "オンライン見積もりから、承諾、辞退、コメント、印刷ができます。" : "From your online quote you can accept, decline, comment or print."}}</p>
      <p>{{language == "ja" ? "よろしくお願いいたします。" : "We look forward to working with you."}}</p>
      <p>{{language == "ja" ? "敬具" : "Best regards,"}}</p>
      <p>{{from_name}}</p>
    `,
    text_content: `
      {{language == "ja" ? "ドライバーからの見積書" : "Your Quotation from Driver"}} - {{quotation_id}}

      {{language == "ja" ? "こんにちは" : "Hello"}} {{customer_name}},

      {{language == "ja" ? "弊社サービスにご興味をお持ちいただき、ありがとうございます。ご依頼いただいた見積書を添付にてお送りいたします。" : "Thank you for your interest in our services. Please find attached your quotation."}}

      {{language == "ja" ? "ご質問がございましたら、またはこの見積もりを承諾される場合は、以下のボタンをクリックしてください。" : "If you have any questions or would like to proceed with this quotation, please click in the button below."}}
      {{magic_link}}

      {{language == "ja" ? "オンライン見積もりから、承諾、辞退、コメント、印刷ができます。" : "From your online quote you can accept, decline, comment or print."}}

      {{language == "ja" ? "よろしくお願いいたします。" : "We look forward to working with you."}}

      {{language == "ja" ? "敬具" : "Best regards,"}}
      {{from_name}}
    `,
    variables: {
      customer_name: 'string',
      quotation_id: 'string',
      magic_link: 'string',
      language: 'string',
      primary_color: 'string',
      from_name: 'string'
    },
    is_active: true,
    is_default: true,
  },
  {
    name: 'Booking Details',
    type: 'email',
    category: 'booking',
    subject: '{{language == "ja" ? "予約詳細" : "Your Booking Details"}} - {{booking_id}}',
    html_content: `
      <p>{{language == "ja" ? "こんにちは" : "Hello"}} {{customer_name}},</p>
      <p>{{language == "ja" ? "ご予約の詳細をお送りいたします。" : "Here are the details of your upcoming vehicle service booking."}}</p>

      <div style="background:#f8f9fa; padding:20px; border-radius:8px; margin:20px 0;">
        <h3 style="margin:0 0 12px 0; color:#32325D;">{{language == "ja" ? "サービス詳細" : "Service Details"}}</h3>
        <p style="margin:0; color:#525f7f;">
          <strong>{{language == "ja" ? "サービス名:" : "Service Type:"}}</strong> {{service_name}}<br>
          <strong>{{language == "ja" ? "日付:" : "Date:"}}</strong> {{booking_date}}<br>
          <strong>{{language == "ja" ? "時間:" : "Time:"}}</strong> {{booking_time}}<br>
          <strong>{{language == "ja" ? "ピックアップ場所:" : "Pickup Location:"}}</strong> {{pickup_location}}<br>
          <strong>{{language == "ja" ? "ドロップオフ場所:" : "Dropoff Location:"}}</strong> {{dropoff_location}}
        </p>
      </div>

      <div style="background:#f8f9fa; padding:20px; border-radius:8px; margin:20px 0;">
        <h3 style="margin:0 0 12px 0; color:#32325D;">{{language == "ja" ? "ドライバー・車両情報" : "Driver & Vehicle Information"}}</h3>
        <div style="background: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0;">
          <div style="display: flex; gap: 30px; align-items: flex-start;">
            <div style="width: 50%; min-width: 0;">
              <h4 style="margin: 0 0 16px 0; color: {{primary_color}}; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">{{language == "ja" ? "👤 ドライバー" : "👤 Driver"}}</h4>
              <div style="margin-bottom: 16px;">
                <div style="font-weight: 600; color: #32325D; margin-bottom: 4px;">{{language == "ja" ? "名前:" : "Name:"}}</div>
                <div style="color: #525f7f;">{{driver_name}}</div>
              </div>
              <div style="margin-bottom: 0;">
                <div style="font-weight: 600; color: #32325D; margin-bottom: 4px;">{{language == "ja" ? "電話:" : "Phone:"}}</div>
                <div style="color: #525f7f;">{{driver_phone}}</div>
              </div>
            </div>
            <div style="width: 50%; min-width: 0;">
              <h4 style="margin: 0 0 16px 0; color: {{primary_color}}; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">{{language == "ja" ? "🚗 車両" : "🚗 Vehicle"}}</h4>
              <div style="margin-bottom: 16px;">
                <div style="font-weight: 600; color: #32325D; margin-bottom: 4px;">{{language == "ja" ? "タイプ:" : "Type:"}}</div>
                <div style="color: #525f7f;">{{vehicle_type}}</div>
              </div>
              <div style="margin-bottom: 0;">
                <div style="font-weight: 600; color: #32325D; margin-bottom: 4px;">{{language == "ja" ? "ナンバープレート:" : "License Plate:"}}</div>
                <div style="color: #525f7f;">{{license_plate}}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <p style="text-align:center;">
        <a href="{{calendar_link}}" style="background-color:#4285F4; color:white; padding:12px 24px; text-decoration:none; border-radius:6px; display:inline-block; margin:16px 0; font-weight:600; box-shadow:0 2px 4px rgba(0,0,0,0.1);">
          {{language == "ja" ? "Googleカレンダーに追加" : "Add to Google Calendar"}}
        </a>
      </p>
      <p>{{language == "ja" ? "お客様をお迎えするのを楽しみにしております！" : "We look forward to serving you!"}}</p>
    `,
    text_content: `
      {{language == "ja" ? "予約詳細" : "Your Booking Details"}} - {{booking_id}}

      {{language == "ja" ? "こんにちは" : "Hello"}} {{customer_name}},

      {{language == "ja" ? "ご予約の詳細をお送りいたします。" : "Here are the details of your upcoming vehicle service booking."}}

      {{language == "ja" ? "サービス詳細:" : "Service Details:"}}
      {{language == "ja" ? "サービス名:" : "Service Type:"}} {{service_name}}
      {{language == "ja" ? "日付:" : "Date:"}} {{booking_date}}
      {{language == "ja" ? "時間:" : "Time:"}} {{booking_time}}
      {{language == "ja" ? "ピックアップ場所:" : "Pickup Location:"}} {{pickup_location}}
      {{language == "ja" ? "ドロップオフ場所:" : "Dropoff Location:"}} {{dropoff_location}}

      {{language == "ja" ? "ドライバー・車両情報:" : "Driver & Vehicle Information:"}}
      {{language == "ja" ? "ドライバー名:" : "Driver Name:"}} {{driver_name}}
      {{language == "ja" ? "ドライバー電話:" : "Driver Phone:"}} {{driver_phone}}
      {{language == "ja" ? "車両タイプ:" : "Vehicle Type:"}} {{vehicle_type}}
      {{language == "ja" ? "ナンバープレート:" : "License Plate:"}} {{license_plate}}

      {{language == "ja" ? "Googleカレンダーに追加:" : "Add to Google Calendar:"}} {{calendar_link}}

      {{language == "ja" ? "お客様をお迎えするのを楽しみにしております！" : "We look forward to serving you!"}}
    `,
    variables: {
      customer_name: 'string',
      booking_id: 'string',
      service_name: 'string',
      booking_date: 'string',
      booking_time: 'string',
      pickup_location: 'string',
      dropoff_location: 'string',
      driver_name: 'string',
      driver_phone: 'string',
      vehicle_type: 'string',
      license_plate: 'string',
      calendar_link: 'string',
      language: 'string',
      primary_color: 'string'
    },
    is_active: true,
    is_default: true,
  },
  {
    name: 'Trip Coming Soon Reminder',
    type: 'email',
    category: 'booking',
    subject: '{{language == "ja" ? "お客様の旅行がもうすぐです！" : "Your Trip is Coming Soon!"}} - {{booking_id}}',
    html_content: `
      <p style="text-align:center; font-size:20px; font-weight:bold; color:#32325D; margin-bottom:20px;">
        {{language == "ja" ? "お客様の旅行がもうすぐです！" : "Your Trip is Coming Soon!"}}
      </p>
      <p style="text-align:center; font-size:16px; color:#525f7f; margin-bottom:30px;">
        {{language == "ja" ? "旅行開始まであと{{hours_until_trip}}時間です！" : "Only {{hours_until_trip}} hours until your trip starts!"}}
      </p>

      <div style="background:#f8f9fa; padding:20px; border-radius:8px; margin:20px 0;">
        <h3 style="margin:0 0 12px 0; color:#32325D;">{{language == "ja" ? "旅行詳細" : "Trip Details"}}</h3>
        <p style="margin:0; color:#525f7f;">
          <strong>{{language == "ja" ? "予約ID:" : "Booking ID:"}}</strong> {{booking_id}}<br>
          <strong>{{language == "ja" ? "サービス:" : "Service:"}}</strong> {{service_name}}<br>
          <strong>{{language == "ja" ? "日付:" : "Date:"}}</strong> {{booking_date}}<br>
          <strong>{{language == "ja" ? "時間:" : "Time:"}}</strong> {{booking_time}}<br>
          <strong>{{language == "ja" ? "ピックアップ:" : "Pickup:"}}</strong> {{pickup_location}}<br>
          <strong>{{language == "ja" ? "ドロップオフ:" : "Dropoff:"}}</strong> {{dropoff_location}}
        </p>
      </div>

      <p style="text-align:center;">
        <a href="{{calendar_link}}" style="background-color:#4285F4; color:white; padding:12px 24px; text-decoration:none; border-radius:6px; display:inline-block; margin:16px 0; font-weight:600; box-shadow:0 2px 4px rgba(0,0,0,0.1);">
          {{language == "ja" ? "Googleカレンダーに追加" : "Add to Google Calendar"}}
        </a>
      </p>
      <p>{{language == "ja" ? "スムーズで楽しい体験を提供できることを楽しみにしています。" : "We look forward to providing you with a smooth and enjoyable experience."}}</p>
    `,
    text_content: `
      {{language == "ja" ? "お客様の旅行がもうすぐです！" : "Your Trip is Coming Soon!"}} - {{booking_id}}

      {{language == "ja" ? "旅行開始まであと{{hours_until_trip}}時間です！" : "Only {{hours_until_trip}} hours until your trip starts!"}}

      {{language == "ja" ? "旅行詳細:" : "Trip Details:"}}
      {{language == "ja" ? "予約ID:" : "Booking ID:"}} {{booking_id}}
      {{language == "ja" ? "サービス:" : "Service:"}} {{service_name}}
      {{language == "ja" ? "日付:" : "Date:"}} {{booking_date}}
      {{language == "ja" ? "時間:" : "Time:"}} {{booking_time}}
      {{language == "ja" ? "ピックアップ:" : "Pickup:"}} {{pickup_location}}
      {{language == "ja" ? "ドロップオフ:" : "Dropoff:"}} {{dropoff_location}}

      {{language == "ja" ? "Googleカレンダーに追加:" : "Add to Google Calendar:"}} {{calendar_link}}

      {{language == "ja" ? "スムーズで楽しい体験を提供できることを楽しみにしています。" : "We look forward to providing you with a smooth and enjoyable experience."}}
    `,
    variables: {
      customer_name: 'string',
      booking_id: 'string',
      service_name: 'string',
      booking_date: 'string',
      booking_time: 'string',
      pickup_location: 'string',
      dropoff_location: 'string',
      hours_until_trip: 'number',
      calendar_link: 'string',
      language: 'string'
    },
    is_active: true,
    is_default: true,
  },
  {
    name: 'Payment Complete',
    type: 'email',
    category: 'booking',
    subject: '{{language == "ja" ? "支払い完了" : "Payment Complete"}} - {{booking_id}}',
    html_content: `
      <p>{{language == "ja" ? "こんにちは" : "Hello"}} {{customer_name}},</p>
      <p>{{language == "ja" ? "お支払いが正常に完了いたしました。" : "Your payment has been completed successfully."}}</p>
      <p>{{language == "ja" ? "請求書と領収書をこのメールに添付いたします。" : "Please find the invoice and receipt attached to this email."}}</p>

      <div style="background:#f8f9fa; padding:20px; border-radius:8px; margin:20px 0;">
        <h3 style="margin:0 0 12px 0; color:#32325D;">{{language == "ja" ? "予約詳細" : "Booking Details"}}</h3>
        <p style="margin:0; color:#525f7f;">
          <strong>{{language == "ja" ? "予約ID:" : "Booking ID:"}}</strong> {{booking_id}}<br>
          <strong>{{language == "ja" ? "サービス:" : "Service:"}}</strong> {{service_name}}<br>
          <strong>{{language == "ja" ? "合計金額:" : "Total Amount:"}}</strong> {{total_amount}}<br>
          <strong>{{language == "ja" ? "ステータス:" : "Status:"}}</strong> <span style="color:#059669; font-weight:600;">{{language == "ja" ? "支払い完了" : "Payment Complete"}}</span><br>
          <strong>{{language == "ja" ? "日付:" : "Date:"}}</strong> {{payment_date}}
        </p>
      </div>
      <p>{{language == "ja" ? "ご利用いただき、ありがとうございます！" : "Thank you for your business!"}}</p>
    `,
    text_content: `
      {{language == "ja" ? "支払い完了" : "Payment Complete"}} - {{booking_id}}

      {{language == "ja" ? "こんにちは" : "Hello"}} {{customer_name}},

      {{language == "ja" ? "お支払いが正常に完了いたしました。" : "Your payment has been completed successfully."}}
      {{language == "ja" ? "請求書と領収書をこのメールに添付いたします。" : "Please find the invoice and receipt attached to this email."}}

      {{language == "ja" ? "予約詳細:" : "Booking Details:"}}
      {{language == "ja" ? "予約ID:" : "Booking ID:"}} {{booking_id}}
      {{language == "ja" ? "サービス:" : "Service:"}} {{service_name}}
      {{language == "ja" ? "合計金額:" : "Total Amount:"}} {{total_amount}}
      {{language == "ja" ? "ステータス:" : "Status:"}} {{language == "ja" ? "支払い完了" : "Payment Complete"}}
      {{language == "ja" ? "日付:" : "Date:"}} {{payment_date}}

      {{language == "ja" ? "ご利用いただき、ありがとうございます！" : "Thank you for your business!"}}
    `,
    variables: {
      customer_name: 'string',
      booking_id: 'string',
      service_name: 'string',
      total_amount: 'string',
      payment_date: 'string',
      language: 'string'
    },
    is_active: true,
    is_default: true,
  },
  {
    name: 'Quotation Approved',
    type: 'email',
    category: 'quotation',
    subject: '{{language == "ja" ? "見積書が承認されました！" : "Your Quotation has been Approved!"}} - {{quotation_id}}',
    html_content: `
      <p>{{language == "ja" ? "こんにちは" : "Hello"}} {{customer_name}},</p>
      <p>{{language == "ja" ? "見積書 <strong>#{{quotation_id}}</strong> が承認されました！" : "We are pleased to inform you that your quotation <strong>#{{quotation_id}}</strong> has been approved!"}}</p>
      <p>{{language == "ja" ? "優れたサービスを提供できることを楽しみにしています。" : "We look forward to providing you with excellent service."}}</p>
      {{#if notes}}
      <div style="background-color: #f8f9fa; border-left: 4px solid {{primary_color}}; padding: 16px; margin: 16px 0; border-radius: 4px;">
        <p style="margin:0; font-weight:bold;">{{language == "ja" ? "チームからのメモ:" : "Notes from our team:"}}</p>
        <p style="margin:0;">{{notes}}</p>
      </div>
      {{/if}}
      <p style="text-align:center;">
        <a href="{{quotation_url}}" style="background-color:{{primary_color}}; color:white; padding:12px 24px; text-decoration:none; border-radius:6px; display:inline-block; margin:16px 0; font-weight:600; box-shadow:0 2px 4px rgba(0,0,0,0.1);">
          {{language == "ja" ? "承認された見積書を表示" : "View Approved Quotation"}}
        </a>
      </p>
      <p>{{language == "ja" ? "敬具" : "Best regards,"}}</p>
      <p>{{from_name}}</p>
    `,
    text_content: `
      {{language == "ja" ? "見積書が承認されました！" : "Your Quotation has been Approved!"}} - {{quotation_id}}

      {{language == "ja" ? "こんにちは" : "Hello"}} {{customer_name}},

      {{language == "ja" ? "見積書 #{{quotation_id}} が承認されました！" : "We are pleased to inform you that your quotation #{{quotation_id}} has been approved!"}}
      {{language == "ja" ? "優れたサービスを提供できることを楽しみにしています。" : "We look forward to providing you with excellent service."}}

      {{#if notes}}
      {{language == "ja" ? "チームからのメモ:" : "Notes from our team:"}}
      {{notes}}
      {{/if}}

      {{language == "ja" ? "承認された見積書を表示:" : "View Approved Quotation:"}} {{quotation_url}}

      {{language == "ja" ? "敬具" : "Best regards,"}}
      {{from_name}}
    `,
    variables: {
      customer_name: 'string',
      quotation_id: 'string',
      quotation_url: 'string',
      notes: 'string',
      language: 'string',
      primary_color: 'string',
      from_name: 'string'
    },
    is_active: true,
    is_default: true,
  },
  {
    name: 'Quotation Reminder',
    type: 'email',
    category: 'quotation',
    subject: '{{language == "ja" ? "リマインダー: ドライバーからの見積書" : "Reminder: Your Quotation from Driver"}} - {{quotation_id}}',
    html_content: `
      <p>{{language == "ja" ? "こんにちは" : "Hello"}} {{customer_name}},</p>
      <p>{{language == "ja" ? "ドライバーからの見積書 <strong>#{{quotation_id}}</strong> についてのリマインダーです。" : "This is a friendly reminder about your quotation <strong>#{{quotation_id}}</strong> from Driver."}}</p>
      <p>{{language == "ja" ? "ご質問がございましたら、または進めたい場合は、オンラインで見積書をご確認ください：" : "If you have any questions or would like to proceed, please view your quotation online:"}}</p>
      <p style="text-align:center;">
        <a href="{{quotation_url}}" style="background-color:{{primary_color}}; color:white; padding:12px 24px; text-decoration:none; border-radius:6px; display:inline-block; margin:16px 0; font-weight:600; box-shadow:0 2px 4px rgba(0,0,0,0.1);">
          {{language == "ja" ? "見積書を確認" : "View Your Quotation"}}
        </a>
      </p>
      <p>{{language == "ja" ? "お返事をお待ちしております。" : "We look forward to hearing from you soon."}}</p>
      <p>{{language == "ja" ? "敬具" : "Best regards,"}}</p>
      <p>{{from_name}}</p>
    `,
    text_content: `
      {{language == "ja" ? "リマインダー: ドライバーからの見積書" : "Reminder: Your Quotation from Driver"}} - {{quotation_id}}

      {{language == "ja" ? "こんにちは" : "Hello"}} {{customer_name}},

      {{language == "ja" ? "ドライバーからの見積書 #{{quotation_id}} についてのリマインダーです。" : "This is a friendly reminder about your quotation #{{quotation_id}} from Driver."}}

      {{language == "ja" ? "ご質問がございましたら、または進めたい場合は、オンラインで見積書をご確認ください：" : "If you have any questions or would like to proceed, please view your quotation online:"}}
      {{quotation_url}}

      {{language == "ja" ? "お返事をお待ちしております。" : "We look forward to hearing from you soon."}}

      {{language == "ja" ? "敬具" : "Best regards,"}}
      {{from_name}}
    `,
    variables: {
      customer_name: 'string',
      quotation_id: 'string',
      quotation_url: 'string',
      language: 'string',
      primary_color: 'string',
      from_name: 'string'
    },
    is_active: true,
    is_default: true,
  },
  {
    name: 'Magic Link Payment',
    type: 'email',
    category: 'quotation',
    subject: '{{language == "ja" ? "見積書の安全な支払いリンク" : "Secure Payment Link for Quotation"}} - {{quotation_id}}',
    html_content: `
      <p>{{language == "ja" ? "こんにちは" : "Hello"}} {{customer_name}},</p>
      <p>{{language == "ja" ? "見積書 <strong>#{{quotation_id}}</strong> の支払いを完了するために、以下の安全なリンクをご利用ください。" : "Please use the secure link below to complete the payment for your quotation <strong>#{{quotation_id}}</strong>."}}</p>
      <p style="text-align:center;">
        <a href="{{magic_link}}" style="background-color:{{primary_color}}; color:white; padding:12px 24px; text-decoration:none; border-radius:6px; display:inline-block; margin:16px 0; font-weight:600; box-shadow:0 2px 4px rgba(0,0,0,0.1);">
          {{language == "ja" ? "支払いに進む" : "Proceed to Payment"}}
        </a>
      </p>
      <p>{{language == "ja" ? "このリンクは7日間有効です。" : "This link is valid for 7 days."}}</p>
      <p>{{language == "ja" ? "ご質問がございましたら、お問い合わせください。" : "If you have any questions, please contact us."}}</p>
      <p>{{language == "ja" ? "敬具" : "Best regards,"}}</p>
      <p>{{from_name}}</p>
    `,
    text_content: `
      {{language == "ja" ? "見積書の安全な支払いリンク" : "Secure Payment Link for Quotation"}} - {{quotation_id}}

      {{language == "ja" ? "こんにちは" : "Hello"}} {{customer_name}},

      {{language == "ja" ? "見積書 #{{quotation_id}} の支払いを完了するために、以下の安全なリンクをご利用ください。" : "Please use the secure link below to complete the payment for your quotation #{{quotation_id}}."}}
      {{language == "ja" ? "支払いに進む:" : "Proceed to Payment:"}} {{magic_link}}

      {{language == "ja" ? "このリンクは7日間有効です。" : "This link is valid for 7 days."}}

      {{language == "ja" ? "ご質問がございましたら、お問い合わせください。" : "If you have any questions, please contact us."}}

      {{language == "ja" ? "敬具" : "Best regards,"}}
      {{from_name}}
    `,
    variables: {
      customer_name: 'string',
      quotation_id: 'string',
      magic_link: 'string',
      language: 'string',
      primary_color: 'string',
      from_name: 'string'
    },
    is_active: true,
    is_default: true,
  }
]

export async function POST(request: Request) {
  try {
    const supabase = createServiceClient()
    
    const results = []
    for (const template of REAL_EMAIL_TEMPLATES) {
      // Check if template already exists
      const { data: existing } = await supabase
        .from('notification_templates' as any)
        .select('id')
        .eq('name', template.name)
        .eq('category', template.category)
        .single()

      if (!existing) {
        const { data, error } = await supabase
          .from('notification_templates' as any)
          .insert(template)
          .select()
          .single()

        if (error) {
          console.error(`Error inserting template ${template.name}:`, error)
        } else {
          results.push(data)
        }
      } else {
        // Update existing template
        const { data, error } = await supabase
          .from('notification_templates' as any)
          .update(template)
          .eq('id', existing.id)
          .select()
          .single()

        if (error) {
          console.error(`Error updating template ${template.name}:`, error)
        } else {
          results.push(data)
        }
      }
    }

    return NextResponse.json({ 
      message: 'Templates populated successfully', 
      results,
      count: results.length
    })

  } catch (error) {
    console.error('Error populating notification templates:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    )
  }
}