-- Update Quotation Approved Email Template with Enhanced Design
-- This template follows the same design patterns as the improved Quotation Sent and Invoice Send templates

UPDATE notification_templates 
SET html_content = '<!-- Greeting -->
<div style="margin-bottom: 25px;">
  <h2 style="color: #2d3748; margin: 0 0 10px 0;">{{language == "ja" ? "こんにちは" : "Hello"}} {{customer_name}},</h2>
  <p style="margin: 0; color: #4a5568;">{{language == "ja" ? "素晴らしいニュースです！お客様の見積書が承認されました。" : "Great news! Your quotation has been approved."}}</p>
</div>

<!-- Approval Confirmation Block - Enhanced Design -->
<div style="background: #ffffff; padding: 24px; border-radius: 8px; margin: 24px 0; border: 1px solid #e2e8f0; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
  
  <!-- Header Section -->
  <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 2px solid #f1f5f9;">
    <div style="background: #059669; width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
      <span style="color: white; font-size: 18px; font-weight: bold;">✓</span>
    </div>
    <div>
      <h3 style="margin: 0; color: #2d3748; font-size: 20px; font-weight: 700;">{{language == "ja" ? "見積書承認完了" : "Quotation Approved"}}</h3>
      <p style="margin: 4px 0 0; color: #718096; font-size: 14px;">{{language == "ja" ? "お客様の見積書が正式に承認されました" : "Your quotation has been officially approved"}}</p>
    </div>
  </div>
  
  <!-- Content Section -->
  <div style="text-align: center; padding: 20px; background: #f0fdf4; border-radius: 6px; border: 1px solid #bbf7d0;">
    <p style="margin: 0 0 16px 0; color: #166534; font-size: 16px; font-weight: 600;">{{language == "ja" ? "おめでとうございます！" : "Congratulations!"}}</p>
    <p style="margin: 0 0 16px 0; color: #4a5568; font-size: 14px; line-height: 1.5;">{{language == "ja" ? "お客様の見積書が承認されました。次のステップに進むことができます。" : "Your quotation has been approved and you can now proceed to the next steps."}}</p>
    
    {{#if approval_notes}}
    <div style="background: white; padding: 16px; border-radius: 6px; margin: 16px 0; border-left: 4px solid #059669;">
      <p style="margin: 0 0 8px 0; color: #2d3748; font-size: 14px; font-weight: 600;">{{language == "ja" ? "承認メモ" : "Approval Notes"}}:</p>
      <p style="margin: 0; color: #4a5568; font-size: 13px; line-height: 1.5;">{{approval_notes}}</p>
    </div>
    {{/if}}
  </div>
</div>

<!-- Quotation Details - Enhanced for Multiple Services -->
<div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; ">
  <h3 style="margin: 0 0 15px 0; color: #2d3748; text-transform: uppercase; font-size: 16px;">
    {{language == "ja" ? "承認済み見積書詳細" : "Approved Quotation Details"}}
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
          <strong style="color: #2d3748; font-size: 13px; display: block; margin-bottom: 4px;">{{language == "ja" ? "承認日" : "Approval Date"}}:</strong>
          <span style="color: #4a5568; font-size: 13px;">{{approval_date}}</span>
        </td>
      </tr>
    </table>
    
    <!-- Individual Service Details -->
    <div style="margin-bottom: 20px;">
      <h4 style="margin: 0 0 12px 0; color: #2d3748; font-size: 14px; font-weight: bold;">{{language == "ja" ? "サービス詳細" : "SERVICE DETAILS"}}</h4>
      
      {{#each quotation_items}}
      <div style="background: #f8fafc; padding: 16px; border-radius: 6px; margin-bottom: 12px; border-left: 4px solid #059669;">
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
      </div>
      {{/each}}
      
      <!-- Fallback for single service (if no quotation_items) -->
      {{#unless quotation_items}}
      <div style="background: #f8fafc; padding: 16px; border-radius: 6px; margin-bottom: 12px; border-left: 4px solid #059669;">
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
          <td style="padding: 10px 0 4px 0; border-top: 2px solid #059669; font-size: 14px; color: #059669; font-weight: bold;">{{language == "ja" ? "承認済み合計金額" : "Approved Total Amount"}}:</td>
          <td style="padding: 10px 0 4px 0; border-top: 2px solid #059669; font-size: 14px; color: #059669; font-weight: bold; text-align: right;">{{formatCurrency final_total currency}}</td>
        </tr>
      </table>
    </div>
  </div>
</div>

<!-- Next Steps - Clean Professional Design -->
<div style="background: #ffffff; padding: 24px; border-radius: 8px; margin: 24px 0; border: 1px solid #e2e8f0; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
  
  <!-- Header Section -->
  <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #f1f5f9;">
    <div style="background: #2d3748; width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
      <span style="color: white; font-size: 18px; font-weight: bold;">★</span>
    </div>
    <div>
      <h3 style="margin: 0; color: #2d3748; font-size: 20px; font-weight: 700;">{{language == "ja" ? "次のステップ" : "Next Steps"}}</h3>
      <p style="margin: 4px 0 0; color: #718096; font-size: 14px;">{{language == "ja" ? "承認後の手続きについて" : "What happens after approval"}}</p>
    </div>
  </div>
  
  <!-- Steps Container -->
  <div>
    <!-- Step 1 -->
    <div style="display: flex; align-items: flex-start; gap: 16px; margin-bottom: 20px;">
      <div style="background: #2d3748; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold; flex-shrink: 0; margin-top: 2px;">1</div>
      <div>
        <p style="margin: 0; color: #2d3748; font-size: 15px; font-weight: 600; line-height: 1.4;">{{language == "ja" ? "予約確定" : "Booking Confirmation"}}</p>
        <p style="margin: 6px 0 0; color: #4a5568; font-size: 14px; line-height: 1.5;">{{language == "ja" ? "承認された見積書に基づいて、お客様の予約を確定いたします。" : "We will confirm your booking based on the approved quotation."}}</p>
      </div>
    </div>
    
    <!-- Step 2 -->
    <div style="display: flex; align-items: flex-start; gap: 16px; margin-bottom: 20px;">
      <div style="background: #2d3748; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold; flex-shrink: 0; margin-top: 2px;">2</div>
      <div>
        <p style="margin: 0; color: #2d3748; font-size: 15px; font-weight: 600; line-height: 1.4;">{{language == "ja" ? "支払い手続き" : "Payment Processing"}}</p>
        <p style="margin: 6px 0 0; color: #4a5568; font-size: 14px; line-height: 1.5;">{{language == "ja" ? "お支払い方法についてご案内いたします。安全で便利な決済オプションをご提供します。" : "We will guide you through payment options and provide secure, convenient payment methods."}}</p>
      </div>
    </div>
    
    <!-- Step 3 -->
    <div style="display: flex; align-items: flex-start; gap: 16px;">
      <div style="background: #2d3748; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold; flex-shrink: 0; margin-top: 2px;">3</div>
      <div>
        <p style="margin: 0; color: #2d3748; font-size: 15px; font-weight: 600; line-height: 1.4;">{{language == "ja" ? "サービス提供" : "Service Delivery"}}</p>
        <p style="margin: 6px 0 0; color: #4a5568; font-size: 14px; line-height: 1.5;">{{language == "ja" ? "お客様のご指定日時に、最高品質のサービスを提供いたします。" : "We will deliver our highest quality service at your specified date and time."}}</p>
      </div>
    </div>
  </div>
  
  <!-- Footer Accent -->
  <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; text-align: center;">
    <p style="margin: 0; color: #718096; font-size: 13px; font-style: italic;">{{language == "ja" ? "お客様のご満足が私たちの使命です" : "Your satisfaction is our commitment"}}</p>
  </div>
</div>

<!-- Contact Information Block -->
<div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2d3748;">
  <h3 style="margin: 0 0 15px 0; color: #2d3748; text-transform: uppercase; font-size: 16px;">
    {{language == "ja" ? "お問い合わせ" : "Contact Information"}}
  </h3>
  <div style="background: white; padding: 15px; border-radius: 6px;">
    <p style="margin: 8px 0; font-size: 14px; color: #2d3748;">
      {{language == "ja" ? "ご質問やご不明な点がございましたら、お気軽にお問い合わせください。専任のコンシェルジュチームが24時間以内にお答えいたします。" : "If you have any questions or concerns, please do not hesitate to contact us. Our dedicated concierge team will respond within 24 hours."}}
    </p>
    <p style="margin: 8px 0; font-size: 14px; color: #2d3748;">
      <strong>{{language == "ja" ? "サポートメール" : "Support Email"}}:</strong> {{support_email}}
    </p>
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
{{/if}}',
    updated_at = NOW()
WHERE name = 'Quotation Approved';
