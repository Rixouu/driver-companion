-- Update Quotation Rejected Email Template with Combined Next Steps & Contact Block
-- and White Background for Visit Our Website Button

UPDATE notification_templates 
SET html_content = '<!-- Greeting -->
<div style="margin-bottom: 25px;">
  <h2 style="color: #2d3748; margin: 0 0 10px 0;">{{language == "ja" ? "こんにちは" : "Hello"}} {{customer_name}},</h2>
  <p style="margin: 0; color: #4a5568;">{{language == "ja" ? "当社のサービスにご関心をお寄せいただき、ありがとうございます。お客様の見積書リクエストを受け取りましたが、慎重に検討した結果、この時点ではお客様の見積書を進めることができないことをお知らせいたします。" : "Thank you for your interest in our services. We have received your quotation request and after careful consideration, we regret to inform you that we are unable to proceed with your quotation at this time."}}</p>
</div>

<!-- Rejection Confirmation Block - Enhanced Design -->
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

    {{#if rejection_reason}}
    <div style="background: white; padding: 16px; border-radius: 6px; margin: 16px 0; border-left: 4px solid #dc2626;">
      <p style="margin: 0 0 8px 0; color: #2d3748; font-size: 14px; font-weight: 600;">{{language == "ja" ? "却下理由" : "Reason for Rejection"}}:</p>
      <p style="margin: 0; color: #4a5568; font-size: 13px; line-height: 1.5;">{{rejection_reason}}</p>
    </div>
    {{/if}}
  </div>
</div>

<!-- Quotation Details - Enhanced for Multiple Services -->
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
    
    <!-- Individual Service Details -->
    <div style="margin-bottom: 20px;">
      <h4 style="margin: 0 0 12px 0; color: #2d3748; font-size: 14px; font-weight: bold;">{{language == "ja" ? "サービス詳細" : "SERVICE DETAILS"}}</h4>
      
      {{#each quotation_items}}
      <div style="background: #f8fafc; padding: 16px; border-radius: 6px; margin-bottom: 12px; border-left: 4px solid #dc2626;">
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
      <div style="background: #f8fafc; padding: 16px; border-radius: 6px; margin-bottom: 12px; border-left: 4px solid #dc2626;">
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
          <td style="padding: 10px 0 4px 0; border-top: 2px solid #dc2626; font-size: 14px; color: #dc2626; font-weight: bold;">{{language == "ja" ? "却下された合計金額" : "Rejected Total Amount"}}:</td>
          <td style="padding: 10px 0 4px 0; border-top: 2px solid #dc2626; font-size: 14px; color: #dc2626; font-weight: bold; text-align: right;">{{formatCurrency final_total currency}}</td>
        </tr>
      </table>
    </div>
  </div>
</div>

<!-- Alternative Options - Enhanced Design -->
<div style="background: #ffffff; padding: 24px; border-radius: 8px; margin: 24px 0; border: 1px solid #e2e8f0; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
  
  <!-- Header Section -->
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td style="padding-bottom: 16px; border-bottom: 2px solid #f1f5f9;">
        <table cellpadding="0" cellspacing="0">
          <tr>
            <td style="vertical-align: top; padding-right: 16px;">
              <table cellpadding="0" cellspacing="0" style="background: #0ea5e9; width: 40px; height: 40px; border-radius: 8px;">
                <tr>
                  <td style="text-align: center; vertical-align: middle; width: 40px; height: 40px;">
                    <span style="color: white; font-size: 18px; font-weight: bold;">💡</span>
                  </td>
                </tr>
              </table>
            </td>
            <td style="vertical-align: top;">
              <h3 style="margin: 0; color: #2d3748; font-size: 20px; font-weight: 700;">{{language == "ja" ? "代替オプション" : "Alternative Options"}}</h3>
              <p style="margin: 4px 0 0; color: #718096; font-size: 14px;">{{language == "ja" ? "お客様にご提案できる代替案" : "Alternative solutions we can offer"}}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
  
  <!-- Content Section -->
  <div style="text-align: center; padding: 20px; background: #f0f9ff; border-radius: 6px; border: 1px solid #93c5fd; margin-top: 20px;">
    <p style="margin: 0 0 16px 0; color: #1e40af; font-size: 14px; line-height: 1.5;">{{language == "ja" ? "この結果がお客様にとって残念であることを理解しております。以下に提供できる代替案をご紹介いたします：" : "We understand this may be disappointing. Here are some alternatives we can offer:"}}</p>
    
    <!-- Alternative Options List -->
    <div style="background: white; padding: 16px; border-radius: 6px; margin: 16px 0; text-align: left;">
      <div style="display: flex; align-items: flex-start; gap: 12px; margin-bottom: 12px;">
        <div style="background: #0ea5e9; color: white; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; flex-shrink: 0; margin-top: 2px;">1</div>
        <div style="color: #1e40af; font-size: 14px;">{{language == "ja" ? "利用可能な異なる車両オプション" : "Different vehicle options that may be available"}}</div>
      </div>
      <div style="display: flex; align-items: flex-start; gap: 12px; margin-bottom: 12px;">
        <div style="background: #0ea5e9; color: white; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; flex-shrink: 0; margin-top: 2px;">2</div>
        <div style="color: #1e40af; font-size: 14px;">{{language == "ja" ? "お客様のサービス用の代替日" : "Alternative dates for your service"}}</div>
      </div>
      <div style="display: flex; align-items: flex-start; gap: 12px; margin-bottom: 12px;">
        <div style="background: #0ea5e9; color: white; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; flex-shrink: 0; margin-top: 2px;">3</div>
        <div style="color: #1e40af; font-size: 14px;">{{language == "ja" ? "お客様のニーズにより適した修正されたサービスパッケージ" : "Modified service packages to better fit your needs"}}</div>
      </div>
      <div style="display: flex; align-items: flex-start; gap: 12px;">
        <div style="background: #0ea5e9; color: white; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; flex-shrink: 0; margin-top: 2px;">4</div>
        <div style="color: #1e40af; font-size: 14px;">{{language == "ja" ? "専門サービスのためのパートナー企業への紹介" : "Referral to our partner companies for specialized services"}}</div>
      </div>
    </div>
  </div>
</div>

<!-- Next Steps & Contact Information - Combined Block with White Background Button -->
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
                    <span style="color: white; font-size: 18px; font-weight: bold;">📞</span>
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
    <p style="margin: 0 0 16px 0; color: #4a5568; font-size: 14px; line-height: 1.5;">{{language == "ja" ? "代替オプションについて話し合いたい場合やご質問がございましたら、お気軽にお問い合わせください。" : "If you would like to discuss alternative options or have any questions, please don't hesitate to contact us."}}</p>
    
    <!-- Contact Buttons -->
    <div style="display: flex; justify-content: center; gap: 16px; flex-wrap: wrap; margin: 16px 0;">
      <a href="mailto:{{contact_email}}" style="background: #FF2800; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        {{language == "ja" ? "お問い合わせ" : "Contact Us"}}
      </a>
      <a href="{{website_url}}" style="background: white; color: #FF2800; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; border: 2px solid #FF2800; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        {{language == "ja" ? "ウェブサイトを訪問" : "Visit Our Website"}}
      </a>
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
{{/if}}'
WHERE name = 'Quotation Rejected';
