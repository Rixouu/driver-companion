-- Enhanced Quotation Sent Email Template with multi-service support
-- Matches the invoice template style and handles multiple services
UPDATE notification_templates 
SET html_content = '<!-- Greeting -->
<div style="margin-bottom: 25px;">
  <h2 style="color: #2d3748; margin: 0 0 10px 0;">{{language == "ja" ? "こんにちは" : "Hello"}} {{customer_name}},</h2>
  <p style="margin: 0; color: #4a5568;">{{greeting_text}}</p>
</div>

<!-- Quotation Details - Enhanced for Multiple Services -->
<div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
  <h3 style="margin: 0 0 15px 0; color: #2d3748; text-transform: uppercase; font-size: 16px;">
    {{language == "ja" ? "見積書詳細" : "Quotation Details"}}
  </h3>
  <div style="background: white; padding: 15px; border-radius: 6px;">
    
    <!-- Quotation Information -->
    <table style="width: 100%; margin-bottom: 20px; padding-bottom: 20px; border-bottom: 2px solid #e5e7eb;">
      <tr>
        <td style="width: 50%; padding: 8px 16px 8px 0; vertical-align: top;">
          <strong style="color: #2d3748; font-size: 13px; display: block; margin-bottom: 4px;">{{language == "ja" ? "見積書ID" : "Quotation ID"}}:</strong>
          <span style="color: #2d3748; font-size: 13px; font-weight: bold;">{{quotation_id}}</span>
        </td>
        <td style="width: 50%; padding: 8px 0 8px 16px; vertical-align: top;">
          <strong style="color: #2d3748; font-size: 13px; display: block; margin-bottom: 4px;">{{language == "ja" ? "有効期限" : "Valid Until"}}:</strong>
          <span style="color: #4a5568; font-size: 13px;">{{expiry_date}}</span>
        </td>
      </tr>
    </table>
    
    <!-- Individual Service Details -->
    <div style="margin-bottom: 20px;">
      <h4 style="margin: 0 0 12px 0; color: #2d3748; font-size: 14px; font-weight: bold;">{{language == "ja" ? "サービス詳細" : "SERVICE DETAILS"}}</h4>
      
      {{#each quotation_items}}
      <div style="background: #f8fafc; padding: 16px; border-radius: 6px; margin-bottom: 12px; border-left: 4px solid #2d3748;">
        <!-- Service Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
          <div style="flex: 1;">
            <div style="font-weight: 600; color: #2d3748; font-size: 14px; margin-bottom: 4px;">{{description}}</div>
            <div style="color: #6b7280; font-size: 12px;">{{service_type_name}} - {{vehicle_type}}</div>
          </div>
          <div style="font-weight: 600; color: #2d3748; font-size: 14px;">{{formatCurrency total_price currency}}</div>
        </div>
        
        <!-- Service Details Grid -->
        <table style="width: 100%; margin-bottom: 8px;">
          <tr>
            <td style="width: 50%; padding: 4px 8px 4px 0; vertical-align: top;">
              <strong style="color: #6b7280; font-size: 11px; display: block; margin-bottom: 2px;">{{language == "ja" ? "時間" : "Duration"}}:</strong>
              <span style="color: #4a5568; font-size: 12px;">{{duration_hours}}h{{#if service_days}} ({{service_days}} day(s) × {{hours_per_day}}h/day){{/if}}</span>
            </td>
            <td style="width: 50%; padding: 4px 0 4px 8px; vertical-align: top;">
              <strong style="color: #6b7280; font-size: 11px; display: block; margin-bottom: 2px;">{{language == "ja" ? "日時" : "Date & Time"}}:</strong>
              <span style="color: #4a5568; font-size: 12px;">{{pickup_date}} at {{pickup_time}}</span>
            </td>
          </tr>
        </table>
        
        <!-- Location Details (if available) -->
        {{#if pickup_location}}
        <table style="width: 100%; margin-bottom: 8px;">
          <tr>
            <td style="width: 50%; padding: 4px 8px 4px 0; vertical-align: top;">
              <strong style="color: #6b7280; font-size: 11px; display: block; margin-bottom: 2px;">{{language == "ja" ? "ピックアップ" : "Pickup"}}:</strong>
              <span style="color: #4a5568; font-size: 12px;">{{pickup_location}}</span>
            </td>
            <td style="width: 50%; padding: 4px 0 4px 8px; vertical-align: top;">
              <strong style="color: #6b7280; font-size: 11px; display: block; margin-bottom: 2px;">{{language == "ja" ? "ドロップオフ" : "Drop-off"}}:</strong>
              <span style="color: #4a5568; font-size: 12px;">{{dropoff_location}}</span>
            </td>
          </tr>
        </table>
        {{/if}}
        
        <!-- Passenger & Bag Details (if available) -->
        {{#if number_of_passengers}}
        <table style="width: 100%; margin-bottom: 8px;">
          <tr>
            <td style="width: 50%; padding: 4px 8px 4px 0; vertical-align: top;">
              <strong style="color: #6b7280; font-size: 11px; display: block; margin-bottom: 2px;">{{language == "ja" ? "乗客数" : "Passengers"}}:</strong>
              <span style="color: #4a5568; font-size: 12px;">{{number_of_passengers}}</span>
            </td>
            <td style="width: 50%; padding: 4px 0 4px 8px; vertical-align: top;">
              {{#if number_of_bags}}
              <strong style="color: #6b7280; font-size: 11px; display: block; margin-bottom: 2px;">{{language == "ja" ? "バッグ数" : "Bags"}}:</strong>
              <span style="color: #4a5568; font-size: 12px;">{{number_of_bags}}</span>
              {{/if}}
            </td>
          </tr>
        </table>
        {{/if}}
        
        <!-- Flight Details (if available) -->
        {{#if flight_number}}
        <table style="width: 100%; margin-bottom: 8px;">
          <tr>
            <td style="width: 50%; padding: 4px 8px 4px 0; vertical-align: top;">
              <strong style="color: #6b7280; font-size: 11px; display: block; margin-bottom: 2px;">{{language == "ja" ? "フライト" : "Flight"}}:</strong>
              <span style="color: #4a5568; font-size: 12px;">{{flight_number}}{{#if terminal}} ({{language == "ja" ? "ターミナル" : "Terminal"}}: {{terminal}}){{/if}}</span>
            </td>
            <td style="width: 50%; padding: 4px 0 4px 8px; vertical-align: top;">
              <!-- Empty for now, could add more flight details -->
            </td>
          </tr>
        </table>
        {{/if}}
        
        <!-- Rate Details -->
        {{#if service_days}}
        <div style="background: white; padding: 8px; border-radius: 4px; margin-top: 8px;">
          <div style="color: #6b7280; font-size: 10px; margin-bottom: 4px;">{{language == "ja" ? "料金詳細" : "Rate Details"}}:</div>
          <div style="color: #4a5568; font-size: 11px; line-height: 1.4;">
            <div>{{language == "ja" ? "時間料金" : "Hourly Rate"}}: {{formatCurrency unit_price currency}} × {{duration_hours}}h/day</div>
            <div>{{language == "ja" ? "日数" : "Number of Days"}}: × {{service_days}}</div>
            <div>{{language == "ja" ? "小計" : "Subtotal"}}: {{formatCurrency total_price currency}}</div>
          </div>
        </div>
        {{/if}}
      </div>
      {{/each}}
      
      <!-- Fallback for single service (if no quotation_items) -->
      {{#unless quotation_items}}
      <div style="background: #f8fafc; padding: 16px; border-radius: 6px; margin-bottom: 12px; border-left: 4px solid #2d3748;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
          <div style="flex: 1;">
            <div style="font-weight: 600; color: #2d3748; font-size: 14px; margin-bottom: 4px;">{{service_name}} {{service_days_display}}</div>
            <div style="color: #6b7280; font-size: 12px;">{{service_type}} - {{vehicle_type}}</div>
          </div>
          <div style="font-weight: 600; color: #2d3748; font-size: 14px;">{{formatCurrency total_amount currency}}</div>
        </div>
        
        <table style="width: 100%; margin-bottom: 8px;">
          <tr>
            <td style="width: 50%; padding: 4px 8px 4px 0; vertical-align: top;">
              <strong style="color: #6b7280; font-size: 11px; display: block; margin-bottom: 2px;">{{language == "ja" ? "日時" : "Date & Time"}}:</strong>
              <span style="color: #4a5568; font-size: 12px;">{{date}} at {{time}}</span>
            </td>
            <td style="width: 50%; padding: 4px 0 4px 8px; vertical-align: top;">
              <strong style="color: #6b7280; font-size: 11px; display: block; margin-bottom: 2px;">{{language == "ja" ? "金額" : "Amount"}}:</strong>
              <span style="color: #4a5568; font-size: 12px;">{{formatCurrency total_amount currency}}</span>
            </td>
          </tr>
        </table>
      </div>
      {{/unless}}
    </div>
    
    <!-- Price Summary -->
    <div style="background: #f8fafc; padding: 16px; border-radius: 6px; margin-top: 16px;">
      <h4 style="margin: 0 0 12px 0; color: #2d3748; font-size: 14px; font-weight: bold;">{{language == "ja" ? "料金概要" : "PRICE SUMMARY"}}</h4>
      
      <table style="width: 100%;">
        {{#each quotation_items}}
        <tr>
          <td style="padding: 4px 0; font-size: 12px; color: #2d3748;">{{description}}:</td>
          <td style="padding: 4px 0; font-size: 12px; color: #2d3748; text-align: right;">{{formatCurrency total_price currency}}</td>
        </tr>
        {{/each}}
        {{#unless quotation_items}}
        <tr>
          <td style="padding: 4px 0; font-size: 12px; color: #2d3748;">{{vehicle_type}}:</td>
          <td style="padding: 4px 0; font-size: 12px; color: #2d3748; text-align: right;">{{formatCurrency service_total currency}}</td>
        </tr>
        {{/unless}}
        {{#if selected_package}}
        <tr>
          <td style="padding: 4px 0; font-size: 12px; color: #8b5cf6;">{{language == "ja" ? "パッケージ" : "Package"}}: {{selected_package.name}}</td>
          <td style="padding: 4px 0; font-size: 12px; color: #8b5cf6; text-align: right;">{{formatCurrency selected_package.base_price currency}}</td>
        </tr>
        {{/if}}
        {{#if promotion_discount}}
        <tr>
          <td style="padding: 4px 0; font-size: 12px; color: #10b981;">{{language == "ja" ? "プロモーション" : "Promotion"}}: {{selected_promotion_name}}</td>
          <td style="padding: 4px 0; font-size: 12px; color: #10b981; text-align: right;">-{{formatCurrency promotion_discount currency}}</td>
        </tr>
        {{/if}}
        {{#if regular_discount}}
        <tr>
          <td style="padding: 4px 0; font-size: 12px; color: #dc2626;">{{language == "ja" ? "割引" : "Discount"}} ({{discount_percentage}}%):</td>
          <td style="padding: 4px 0; font-size: 12px; color: #dc2626; text-align: right;">-{{formatCurrency regular_discount currency}}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; font-size: 12px; color: #2d3748;">{{language == "ja" ? "小計" : "Subtotal"}}:</td>
          <td style="padding: 4px 0; font-size: 12px; color: #2d3748; text-align: right;">{{formatCurrency subtotal currency}}</td>
        </tr>
        {{/if}}
        {{#if tax_amount}}
        <tr>
          <td style="padding: 4px 0; font-size: 12px; color: #2d3748;">{{language == "ja" ? "税金" : "Tax"}} ({{tax_percentage}}%):</td>
          <td style="padding: 4px 0; font-size: 12px; color: #2d3748; text-align: right;">+{{formatCurrency tax_amount currency}}</td>
        </tr>
        {{/if}}
        <tr>
          <td style="padding: 10px 0 4px 0; border-top: 2px solid #2d3748; font-size: 14px; color: #2d3748; font-weight: bold;">{{language == "ja" ? "合計金額" : "Total Amount Due"}}:</td>
          <td style="padding: 10px 0 4px 0; border-top: 2px solid #2d3748; font-size: 14px; color: #2d3748; font-weight: bold; text-align: right;">{{formatCurrency final_total currency}}</td>
        </tr>
      </table>
    </div>
  </div>
</div>

<!-- Magic Link CTA Section - Enhanced Design -->
<div style="text-align: center; margin: 30px 0; padding: 20px; background: #fef2f2; border-radius: 8px; border-left: 4px solid #FF2800;">
  <div style="background: white; padding: 20px; border-radius: 6px;">
    <h3 style="margin: 0 0 12px 0; color: #FF2800; font-size: 16px; font-weight: bold;">{{language == "ja" ? "オンライン見積書" : "View Quotation Online"}}</h3>
    <p style="margin: 0 0 16px 0; color: #4a5568; font-size: 14px;">{{language == "ja" ? "以下のセキュアリンクから見積書をご確認ください：" : "Please view your quotation using this secure link:"}}</p>
    <a href="{{magic_link}}" style="background: #FF2800; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 14px; box-shadow: 0 2px 4px rgba(255, 40, 0, 0.2);">
      {{language == "ja" ? "セキュアリンクで見積書を表示" : "View Quote via Secure Link"}}
    </a>
    <p style="margin: 12px 0 0 0; font-size: 12px; color: #94a3b8;">
      {{language == "ja" ? "このリンクは7日間有効です" : "This link is valid for 7 days"}}
    </p>
  </div>
</div>

<!-- Next Steps -->
<div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2d3748;">
  <h3 style="margin: 0 0 15px 0; color: #2d3748; text-transform: uppercase; font-size: 16px;">
    {{language == "ja" ? "次のステップ" : "Next Steps"}}
  </h3>
  <div style="background: white; padding: 15px; border-radius: 6px;">
    <p style="margin: 0 0 12px; color: #4a5568;">{{language == "ja" ? "見積書をご確認いただき、ご質問がございましたらお気軽にお問い合わせください。" : "Please review the quotation and contact us if you have any questions."}}</p>
    <p style="margin: 0; color: #4a5568;">{{language == "ja" ? "お客様のご利用をお待ちしております。" : "We look forward to serving you."}}</p>
  </div>
</div>

{{#if error}}
<div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
  <h3 style="margin: 0 0 15px 0; color: #b91c1c; text-transform: uppercase; font-size: 16px;">
    {{language == "ja" ? "エラー" : "Error"}}
  </h3>
  <div style="background: white; padding: 15px; border-radius: 6px;">
    <p style="margin: 8px 0; font-size: 14px; color: #b91c1c;">{{error}}</p>
  </div>
</div>
{{/if}}'
WHERE name = 'Quotation Sent';
