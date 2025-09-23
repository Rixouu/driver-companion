-- =============================================================================
-- FIX QUOTATION REJECTED EMAIL TEMPLATE - Clean Structure Fix
-- =============================================================================

UPDATE notification_templates 
SET html_content = '<!-- Main Email Container -->
<div style="max-width: 600px; margin: 0 auto; background: #ffffff; font-family: Arial, sans-serif;">

<!-- Greeting -->
<div style="margin-bottom: 25px;">
  <h2 style="color: #2d3748; margin: 0 0 10px 0;">{{language == "ja" ? "こんにちは" : "Hello"}} {{customer_name}},</h2>
  <p style="margin: 0; color: #4a5568;">{{language == "ja" ? "当社のサービスにご関心をお寄せいただき、ありがとうございます。お客様の見積書リクエストを受け取りましたが、慎重に検討した結果、この時点ではお客様の見積書を進めることができないことをお知らせいたします。" : "Thank you for your interest in our services. We have received your quotation request and after careful consideration, we regret to inform you that we are unable to proceed with your quotation at this time."}}</p>
</div>

<!-- Rejection Confirmation Block -->
<div style="background: #ffffff; padding: 24px; border-radius: 8px; margin: 24px 0; border: 1px solid #e2e8f0; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
  
  <!-- Header Section -->
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td style="padding-bottom: 16px; border-bottom: 2px solid #f1f5f9;">
        <table cellpadding="0" cellspacing="0">
          <tr>
            <td style="vertical-align: top; padding-right: 16px;">
              <table cellpadding="0" cellspacing="0" style="background: #dc2626; width: 40px; height: 40px; border-radius: 8px;">
                <tr>
                  <td style="text-align: center; vertical-align: middle; width: 40px; height: 40px;">
                    <span style="color: white; font-size: 18px; font-weight: bold;">✗</span>
                  </td>
                </tr>
              </table>
            </td>
            <td style="vertical-align: top;">
              <h3 style="margin: 0; color: #2d3748; font-size: 20px; font-weight: 700;">{{language == "ja" ? "見積書却下" : "Quotation Rejected"}}</h3>
              <p style="margin: 4px 0 0; color: #718096; font-size: 14px;">{{language == "ja" ? "お客様の見積書リクエストが却下されました" : "Your quotation request has been declined"}}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
  
  <!-- Content Section -->
  <div style="text-align: center; padding: 20px; background: #fef2f2; border-radius: 6px; border: 1px solid #fecaca; margin-top: 20px;">
    <div style="background: white; padding: 16px; border-radius: 6px; margin: 16px 0; border-left: 4px solid #dc2626;">
      <p style="margin: 0 0 8px 0; color: #2d3748; font-size: 14px; font-weight: 600;">{{language == "ja" ? "却下理由" : "Reason for Rejection"}}:</p>
      <p style="margin: 0; color: #4a5568; font-size: 13px; line-height: 1.5;">{{rejection_reason}}</p>
    </div>
  </div>
</div>

<!-- Quotation Details -->
<div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
  <h3 style="margin: 0 0 15px 0; color: #2d3748; text-transform: uppercase; font-size: 16px;">
    {{language == "ja" ? "却下された見積書詳細" : "Rejected Quotation Details"}}
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
          <strong style="color: #2d3748; font-size: 13px; display: block; margin-bottom: 4px;">{{language == "ja" ? "リクエスト日" : "Requested Date"}}:</strong>
          <span style="color: #4a5568; font-size: 13px;">{{requested_date}}</span>
        </td>
      </tr>
    </table>
    
    <!-- Service Details -->
    <div style="margin-bottom: 20px;">
      <h4 style="margin: 0 0 12px 0; color: #2d3748; font-size: 14px; font-weight: bold;">{{language == "ja" ? "サービス詳細" : "SERVICE DETAILS"}}</h4>
      
      {{#each quotation_items}}
      <div style="background: #f8fafc; padding: 16px; border-radius: 6px; margin-bottom: 12px; border-left: 4px solid #dc2626;">
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
      
      {{#unless quotation_items}}
      <div style="background: #f8fafc; padding: 16px; border-radius: 6px; margin-bottom: 12px; border-left: 4px solid #dc2626;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
          <div style="flex: 1;">
            <div style="font-weight: 600; color: #2d3748; font-size: 14px; margin-bottom: 4px;">{{service_name}}</div>
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
          <td style="padding: 4px 0; font-size: 12px; color: #2d3748;">{{short_description}}:</td>
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
        
        <!-- Time-based pricing adjustment -->
        {{#if time_based_discount}}
        <tr>
          <td style="padding: 4px 0; font-size: 12px; color: #f97316;">{{language == "ja" ? "時間調整" : "Time Adjustment"}}:</td>
          <td style="padding: 4px 0; font-size: 12px; color: #f97316; text-align: right;">+{{formatCurrency time_based_discount currency}}</td>
        </tr>
        {{/if}}
        
        <!-- Package pricing -->
        {{#if selected_package}}
        <tr>
          <td style="padding: 4px 0; font-size: 12px; color: #8b5cf6;">{{language == "ja" ? "パッケージ" : "Package"}}: {{selected_package.name}}</td>
          <td style="padding: 4px 0; font-size: 12px; color: #8b5cf6; text-align: right;">{{formatCurrency selected_package.base_price currency}}</td>
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
          <td style="padding: 10px 0 4px 0; border-top: 2px solid #dc2626; font-size: 14px; color: #dc2626; font-weight: bold;">{{language == "ja" ? "却下された合計金額" : "Rejected Total Amount"}}:</td>
          <td style="padding: 10px 0 4px 0; border-top: 2px solid #dc2626; font-size: 14px; color: #dc2626; font-weight: bold; text-align: right;">{{formatCurrency final_total currency}}</td>
        </tr>
      </table>
    </div>
  </div>
</div>

<!-- Next Steps & Contact Information -->
<div style="background: #FFFFFF; padding: 24px; border-radius: 8px; margin: 24px 0; border: 1px solid #e2e8f0; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
  
  <!-- Header Section -->
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td style="padding-bottom: 16px; border-bottom: 2px solid #f1f5f9;">
        <table cellpadding="0" cellspacing="0">
          <tr>
            <td style="vertical-align: top; padding-right: 16px;">
              <table cellpadding="0" cellspacing="0" style="background: #2d3748; width: 40px; height: 40px; border-radius: 8px;">
                <tr>
                  <td style="text-align: center; vertical-align: middle; width: 40px; height: 40px;">
                    <span style="color: white; font-size: 18px; font-weight: bold;">✉️</span>
                  </td>
                </tr>
              </table>
            </td>
            <td style="vertical-align: top;">
              <h3 style="margin: 0; color: #2d3748; font-size: 20px; font-weight: 700;">{{language == "ja" ? "次のステップ・お問い合わせ" : "Next Steps & Contact"}}</h3>
              <p style="margin: 4px 0 0; color: #718096; font-size: 14px;">{{language == "ja" ? "代替オプションについて話し合い、お問い合わせください" : "Discuss alternatives and get in touch"}}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
  
  <!-- Content Section -->
  <div style="text-align: center; padding: 20px; background: #f8fafc; border-radius: 6px; border: 1px solid #e2e8f0; margin-top: 20px;">
    <p style="margin: 0 0 20px 0; color: #4a5568; font-size: 14px; line-height: 1.5;">{{language == "ja" ? "代替オプションについて話し合いたい場合やご質問がございましたら、お気軽にお問い合わせください。" : "If you would like to discuss alternative options or have any questions, please don''t hesitate to contact us."}}</p>
    
    <!-- Email-Friendly Button Table -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
      <tr>
        <td style="text-align: center; padding: 0;">
          <table cellpadding="0" cellspacing="0" style="margin: 0 auto;">
            <tr>
              <!-- Contact Us Button -->
              <td style="padding-right: 12px;">
                <a href="mailto:{{contact_email}}" style="background: #FF2800; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 14px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); mso-padding-alt: 0;">
                  {{language == "ja" ? "お問い合わせ" : "Contact Us"}}
                </a>
              </td>
              <!-- Visit Website Button -->
              <td style="padding-left: 12px;">
                <a href="{{website_url}}" style="background: white; color: #FF2800; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 14px; border: 2px solid #FF2800; box-shadow: 0 2px 4px rgba(0,0,0,0.1); mso-padding-alt: 0;">
                  {{language == "ja" ? "ウェブサイトを訪問" : "Visit Our Website"}}
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>
</div>

{{#if error}}
<!-- Error Handling -->
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
WHERE name = 'Quotation Rejected'
AND type = 'email'
AND category = 'quotation';
