-- Update Invoice Email Template with service type labels and time-based pricing fixes
-- This applies the same fixes we used for quotation sent template

UPDATE notification_templates 
SET html_content = '<!-- Main Email Container -->
<div style="max-width: 600px; margin: 0 auto; background: #ffffff; font-family: Arial, sans-serif;">

<!-- Greeting -->
<div style="margin-bottom: 25px;">
  <h2 style="color: #2d3748; margin: 0 0 8px 0; font-size: 18px;">{{language == "ja" ? "こんにちは" : "Hello"}} {{customer_name}},</h2>
  <p style="margin: 0; color: #4a5568; font-size: 14px;">{{language == "ja" ? "以下の見積書の請求書をお送りいたします。" : "Please find your invoice for the quotation below."}}</p>
</div>

<!-- Service & Invoice Details - Enhanced for Multiple Services -->
<div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
  <h3 style="margin: 0 0 16px 0; color: #2d3748; text-transform: uppercase; font-size: 16px; font-weight: bold;">{{language == "ja" ? "サービス・請求書詳細" : "Service & Invoice Details"}}</h3>
  <div style="background: white; padding: 20px; border-radius: 6px;">
    
    <!-- Invoice Information -->
    <table style="width: 100%; margin-bottom: 20px; padding-bottom: 20px; border-bottom: 2px solid #e5e7eb;">
      <tr>
        <td style="width: 50%; padding: 8px 16px 8px 0; vertical-align: top;">
          <strong style="color: #2d3748; font-size: 13px; display: block; margin-bottom: 4px;">{{language == "ja" ? "請求書ID" : "Invoice ID"}}:</strong>
          <span style="color: #2d3748; font-size: 13px; font-weight: bold;">{{quotation_id}}</span>
        </td>
        <td style="width: 50%; padding: 8px 0 8px 16px; vertical-align: top;">
          <strong style="color: #2d3748; font-size: 13px; display: block; margin-bottom: 4px;">{{language == "ja" ? "発行日" : "Issue Date"}}:</strong>
          <span style="color: #4a5568; font-size: 13px;">{{issue_date}}</span>
        </td>
      </tr>
    </table>
    
    <!-- Individual Service Details -->
    <div style="margin-bottom: 20px;">
      <h4 style="margin: 0 0 12px 0; color: #2d3748; font-size: 14px; font-weight: bold;">{{language == "ja" ? "サービス詳細" : "SERVICE DETAILS"}}</h4>
      
      {{#each quotation_items}}
      <div style="background: #f8fafc; padding: 16px; border-radius: 6px; margin-bottom: 12px; border-left: 4px solid #2d3748;">
        <!-- Service Type Label and Price -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <div>
            {{#if service_type_charter}}
              <span style="background: #2d3748; color: white; padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; text-transform: uppercase;">CHARTER SERVICES</span>
            {{/if}}
            {{#if service_type_airport}}
              <span style="background: #10b981; color: white; padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; text-transform: uppercase;">AIRPORT TRANSFER</span>
            {{/if}}
          </div>
          <div style="font-weight: 600; color: #2d3748; font-size: 16px; padding-left: 16px;">{{formatCurrency total_price currency}}</div>
        </div>
        
        <div style="margin-bottom: 12px;">
          <div style="font-weight: 600; color: #2d3748; font-size: 14px; margin-bottom: 4px;">{{short_description}}</div>
          <div style="color: #6b7280; font-size: 12px;">{{vehicle_type}}</div>
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
            <div>{{language == "ja" ? "基本料金" : "Base Price"}}: {{formatCurrency unit_price currency}}</div>
            <div>{{language == "ja" ? "日数" : "Number of Days"}}: × {{service_days}}</div>
            <div>{{language == "ja" ? "小計" : "Subtotal"}}: {{formatCurrency total_price currency}}</div>
            
            <!-- HIDDEN PRIMING TEST 3 - This primes the template engine but renders nothing -->
            {{#if time_based_discount > 0}}
            <!-- This block is intentionally empty - it just primes the engine -->
            {{/if}}
            
            <!-- Time-based Pricing Adjustment - Only for Airport Transfer -->
            {{#if service_type_airport}}
            {{#if time_based_discount > 0}}
            <div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid #e2e8f0;">
              <div style="color: #f97316; font-weight: 600; margin-bottom: 2px;">{{language == "ja" ? "時間調整" : "Time Adjustment"}} ({{time_based_discount_percentage}}%): +{{formatCurrency time_based_discount currency}}</div>
              {{#if time_based_rule_name}}<div style="color: #6b7280; font-size: 10px;">{{time_based_rule_name}}</div>{{/if}}
            </div>
            {{/if}}
            {{/if}}
          </div>
        </div>
        {{/if}}
      </div>
      {{/each}}
    </div>
    
    <!-- Price Breakdown Summary -->
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
        
        <!-- Subtotal before discounts -->
        <tr>
          <td style="padding: 8px 0 4px 0; font-size: 12px; color: #6b7280;">{{language == "ja" ? "小計" : "Subtotal"}}:</td>
          <td style="padding: 8px 0 4px 0; font-size: 12px; color: #6b7280; text-align: right;">{{formatCurrency subtotal currency}}</td>
        </tr>
        
        <!-- Package pricing -->
        {{#if selected_package}}
        <tr>
          <td style="padding: 4px 0; font-size: 12px; color: #8b5cf6;">{{language == "ja" ? "パッケージ" : "Package"}}: {{selected_package.name}}</td>
          <td style="padding: 4px 0; font-size: 12px; color: #8b5cf6; text-align: right;">{{formatCurrency selected_package.base_price currency}}</td>
        </tr>
        {{/if}}
        
        <!-- Time-based pricing discount -->
        {{#if time_based_discount}}
        <tr>
          <td style="padding: 4px 0; font-size: 12px; color: #10b981;">{{language == "ja" ? "時間割引" : "Time-based Discount"}}:</td>
          <td style="padding: 4px 0; font-size: 12px; color: #10b981; text-align: right;">-{{formatCurrency time_based_discount currency}}</td>
        </tr>
        {{/if}}
        
        <!-- Regular discount -->
        {{#if regular_discount}}
        <tr>
          <td style="padding: 4px 0; font-size: 12px; color: #dc2626;">{{language == "ja" ? "割引" : "Discount"}} ({{discount_percentage}}%):</td>
          <td style="padding: 4px 0; font-size: 12px; color: #dc2626; text-align: right;">-{{formatCurrency regular_discount currency}}</td>
        </tr>
        {{/if}}
        
        <!-- Promotion discount -->
        {{#if promotion_discount}}
        <tr>
          <td style="padding: 4px 0; font-size: 12px; color: #10b981;">{{language == "ja" ? "プロモーション" : "Promotion"}}: {{selected_promotion_name}}</td>
          <td style="padding: 4px 0; font-size: 12px; color: #10b981; text-align: right;">-{{formatCurrency promotion_discount currency}}</td>
        </tr>
        {{/if}}
        
        <!-- Promo code discount -->
        {{#if promo_code_discount}}
        <tr>
          <td style="padding: 4px 0; font-size: 12px; color: #10b981;">{{language == "ja" ? "プロモコード" : "Promo Code"}}: {{promo_code}}</td>
          <td style="padding: 4px 0; font-size: 12px; color: #10b981; text-align: right;">-{{formatCurrency promo_code_discount currency}}</td>
        </tr>
        {{/if}}
        
        <!-- Refund amount -->
        {{#if refund_amount}}
        <tr>
          <td style="padding: 4px 0; font-size: 12px; color: #10b981;">{{language == "ja" ? "返金" : "Refund"}}:</td>
          <td style="padding: 4px 0; font-size: 12px; color: #10b981; text-align: right;">-{{formatCurrency refund_amount currency}}</td>
        </tr>
        {{/if}}
        
        <!-- Tax -->
        {{#if tax_amount}}
        <tr>
          <td style="padding: 4px 0; font-size: 12px; color: #2d3748;">{{language == "ja" ? "税金" : "Tax"}} ({{tax_percentage}}%):</td>
          <td style="padding: 4px 0; font-size: 12px; color: #2d3748; text-align: right;">+{{formatCurrency tax_amount currency}}</td>
        </tr>
        {{/if}}
        
        <!-- Final total -->
        <tr>
          <td style="padding: 10px 0 4px 0; border-top: 2px solid #2d3748; font-size: 14px; color: #2d3748; font-weight: bold;">{{language == "ja" ? "合計金額" : "Total Amount Due"}}:</td>
          <td style="padding: 10px 0 4px 0; border-top: 2px solid #2d3748; font-size: 14px; color: #2d3748; font-weight: bold; text-align: right;">{{formatCurrency total_amount currency}}</td>
        </tr>
      </table>
    </div>
  </div>
</div>

<!-- Secure Payment CTA Block - Enhanced Design -->
<div style="background: #FF2800; padding: 24px; border-radius: 8px; margin: 20px 0; text-align: center; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
  <!-- Title -->
  <h3 style="margin: 0 0 12px 0; color: white; font-size: 18px; font-weight: bold;">{{language == "ja" ? "セキュア支払い" : "Secure Payment"}}</h3>
  
  <!-- Instruction -->
  <p style="margin: 0 0 20px 0; color: white; font-size: 14px; opacity: 0.9;">{{language == "ja" ? "以下のセキュアリンクからお支払いを完了してください：" : "Please complete your payment using this secure link:"}}</p>
  
  <!-- Payment Button -->
  <div style="margin-bottom: 16px;">
    <a href="{{payment_link}}" style="background: white; color: #FF2800; padding: 16px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
      {{language == "ja" ? "セキュアリンクで支払う" : "Pay via Secure Link"}}
    </a>
  </div>
  
  <!-- Alternative Link -->
  <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(255, 255, 255, 0.2);">
    <p style="margin: 0 0 8px 0; color: white; font-size: 12px; opacity: 0.8;">{{language == "ja" ? "または、このリンクをブラウザにコピー＆ペーストしてください：" : "Or copy and paste this link into your browser:"}}</p>
    <p style="margin: 0; color: white; font-size: 11px; word-break: break-all; background: rgba(255, 255, 255, 0.1); padding: 8px 12px; border-radius: 4px;">{{payment_link}}</p>
  </div>
</div>

<!-- Official Quotation PDF Block - Enhanced Design -->
<div style="background: #ffffff; padding: 24px; border-radius: 8px; margin: 24px 0; border: 1px solid #e2e8f0; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
  
  <!-- Header Section -->
  <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 2px solid #f1f5f9;">
    <div style="background: #FF2800; width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
      <span style="color: white; font-size: 18px; font-weight: bold;">🗒️</span>
    </div>
    <div>
      <h3 style="margin: 0; color: #2d3748; font-size: 20px; font-weight: 700;">{{language == "ja" ? "公式見積書PDF" : "Official Quotation PDF"}}</h3>
      <p style="margin: 4px 0 0; color: #718096; font-size: 14px;">{{language == "ja" ? "詳細な見積書が添付されています" : "Detailed quotation attached to this email"}}</p>
    </div>
  </div>
  
  <!-- Content Section -->
  <div style="text-align: center; padding: 20px; background: #f8fafc; border-radius: 6px; border: 1px solid #e2e8f0;">
    <p style="margin: 0 0 16px 0; color: #4a5568; font-size: 14px; line-height: 1.5;">{{language == "ja" ? "詳細な見積書PDFがこのメールに添付されています。記録と会計目的でご利用ください。" : "A detailed PDF copy of this quotation has been attached to this email for your records and accounting purposes."}}</p>
    
    <!-- Check Attachments Button -->
    <div style="background: #FF2800; color: white; border-radius: 6px; padding: 12px 24px; display: inline-block; text-decoration: none;">
      <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
        <span style="font-size: 14px; font-weight: 600;">{{language == "ja" ? "メール添付ファイルを確認" : "Check email attachments"}}</span>
      </div>
    </div>
  </div>
</div>

{{#if error}}
<!-- Error Handling - Clean Professional Design -->
<div style="background: #ffffff; padding: 24px; border-radius: 8px; margin: 24px 0; border: 1px solid #e2e8f0; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
  
  <!-- Header Section -->
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td style="padding-bottom: 16px; border-bottom: 2px solid #f1f5f9;">
        <table cellpadding="0" cellspacing="0">
          <tr>
            <td style="vertical-align: top; padding-right: 16px;">
              <table cellpadding="0" cellspacing="0" style="background: #ef4444; width: 40px; height: 40px; border-radius: 8px;">
                <tr>
                  <td style="text-align: center; vertical-align: middle; width: 40px; height: 40px;">
                    <span style="color: white; font-size: 18px; font-weight: bold;">!</span>
                  </td>
                </tr>
              </table>
            </td>
            <td style="vertical-align: top;">
              <h3 style="margin: 0; color: #2d3748; font-size: 20px; font-weight: 700;">{{language == "ja" ? "エラー" : "Error"}}</h3>
              <p style="margin: 4px 0 0; color: #718096; font-size: 14px;">{{language == "ja" ? "問題が発生しました" : "An issue has occurred"}}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
  
  <!-- Content Section -->
  <div style="text-align: center; padding: 20px; background: #fef2f2; border-radius: 6px; border: 1px solid #fecaca; margin-top: 20px;">
    <p style="margin: 0; color: #b91c1c; font-size: 14px; line-height: 1.5; font-weight: 600;">{{error}}</p>
  </div>
</div>
{{/if}}

</div>
<!-- End Main Email Container -->'
WHERE name = 'Invoice Email';