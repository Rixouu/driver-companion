-- Update Quotation Sent Email Template with Sophisticated Luxury Design
-- This creates a truly elegant Next Steps block appropriate for a luxury limousine service

UPDATE notification_templates 
SET html_content = '
<!DOCTYPE html>
<html lang="{{language}}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{quotation_id}} - {{company_name}}</title>
</head>
<body style="font-family: ''Segoe UI'', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8fafc;">
  
  <!-- Header with Dynamic Primary Color -->
  <div style="text-align: center; margin-bottom: 30px; padding: 24px; background: linear-gradient(135deg, {{primary_color}} 0%, {{primary_color}}dd 100%); border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.12);">
    <div style="background: rgba(255,255,255,0.15); border-radius: 50%; width: 80px; height: 80px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
      <div style="background: white; border-radius: 50%; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; font-size: 24px; color: {{primary_color}};">🚗</div>
    </div>
    <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">{{company_name}}</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 16px; font-weight: 400;">{{language == "ja" ? "プレミアム輸送サービス" : "Premium Transportation Services"}}</p>
  </div>

  <!-- Greeting -->
  <div style="margin-bottom: 32px;">
    <h2 style="color: #1a202c; margin: 0 0 12px 0; font-size: 24px; font-weight: 600;">{{language == "ja" ? "こんにちは" : "Hello"}} {{customer_name}},</h2>
    <p style="margin: 0; color: #4a5568; font-size: 16px; line-height: 1.6;">{{greeting_text}}</p>
  </div>

  <!-- Service & Invoice Details - Enhanced Multi-Service Layout -->
  <div style="background: #ffffff; padding: 24px; border-radius: 12px; margin: 24px 0; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;">
    <h3 style="margin: 0 0 20px 0; color: #2d3748; text-transform: uppercase; font-size: 18px; font-weight: 700; letter-spacing: 0.5px;">{{language == "ja" ? "サービス詳細" : "Service & Invoice Details"}}</h3>
    
    {{#each quotation_items}}
    <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 16px; border-left: 4px solid {{primary_color}};">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
        <div style="flex: 1;">
          <h4 style="margin: 0 0 8px 0; color: #2d3748; font-size: 16px; font-weight: 600;">{{description}}</h4>
          <p style="margin: 0; color: #4a5568; font-size: 14px;">{{vehicle_type}}</p>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 18px; font-weight: 700; color: {{primary_color}};">{{formatCurrency total_price}}</div>
          {{#if service_days}}
          <div style="font-size: 12px; color: #718096; margin-top: 2px;">{{service_days}} days × {{hours_per_day}}h/day</div>
          {{/if}}
        </div>
      </div>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
        <div>
          <div style="font-size: 12px; color: #718096; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">{{language == "ja" ? "日時" : "Date & Time"}}</div>
          <div style="font-size: 14px; color: #2d3748;">{{pickup_date}} at {{pickup_time}}</div>
        </div>
        <div>
          <div style="font-size: 12px; color: #718096; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">{{language == "ja" ? "時間" : "Duration"}}</div>
          <div style="font-size: 14px; color: #2d3748;">{{duration_hours}}h{{#if service_days}} ({{service_days}} day(s) × {{hours_per_day}}h/day){{/if}}</div>
        </div>
      </div>
      
      {{#if pickup_location}}
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        <div>
          <div style="font-size: 12px; color: #718096; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">{{language == "ja" ? "出発地" : "Pickup Location"}}</div>
          <div style="font-size: 14px; color: #2d3748; line-height: 1.4;">{{pickup_location}}</div>
        </div>
        <div>
          <div style="font-size: 12px; color: #718096; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">{{language == "ja" ? "到着地" : "Drop-off Location"}}</div>
          <div style="font-size: 14px; color: #2d3748; line-height: 1.4;">{{dropoff_location}}</div>
        </div>
      </div>
      {{/if}}
      
      {{#if number_of_passengers}}
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px;">
        <div>
          <div style="font-size: 12px; color: #718096; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">{{language == "ja" ? "乗客数" : "Passengers"}}</div>
          <div style="font-size: 14px; color: #2d3748;">{{number_of_passengers}}</div>
        </div>
        {{#if number_of_bags}}
        <div>
          <div style="font-size: 12px; color: #718096; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">{{language == "ja" ? "荷物数" : "Bags"}}</div>
          <div style="font-size: 14px; color: #2d3748;">{{number_of_bags}}</div>
        </div>
        {{/if}}
      </div>
      {{/if}}
      
      {{#if flight_number}}
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px;">
        <div>
          <div style="font-size: 12px; color: #718096; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">{{language == "ja" ? "フライト番号" : "Flight Number"}}</div>
          <div style="font-size: 14px; color: #2d3748;">{{flight_number}}</div>
        </div>
        {{#if terminal}}
        <div>
          <div style="font-size: 12px; color: #718096; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">{{language == "ja" ? "ターミナル" : "Terminal"}}</div>
          <div style="font-size: 14px; color: #2d3748;">{{terminal}}</div>
        </div>
        {{/if}}
      </div>
      {{/if}}
    </div>
    {{/each}}
  </div>

  <!-- Price Details - Enhanced Layout -->
  <div style="background: #ffffff; padding: 24px; border-radius: 12px; margin: 24px 0; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;">
    <h3 style="margin: 0 0 20px 0; color: #2d3748; text-transform: uppercase; font-size: 18px; font-weight: 700; letter-spacing: 0.5px;">{{language == "ja" ? "料金詳細" : "Price Details"}}</h3>
    
    <div style="background: #f8fafc; padding: 20px; border-radius: 8px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background: white; border-radius: 6px; overflow: hidden;">
        <tr>
          <td style="padding: 20px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              {{#each quotation_items}}
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                  <div style="font-weight: 600; color: #2d3748; font-size: 15px;">{{description}}</div>
                  {{#if service_days}}
                  <div style="font-size: 13px; color: #718096; margin-top: 2px;">{{service_days}} days, {{hours_per_day}} hours/day</div>
                  {{/if}}
                </td>
                <td align="right" style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #2d3748; font-size: 15px;">{{formatCurrency total_price}}</td>
              </tr>
              {{/each}}
              {{#if selected_package}}
              <tr>
                <td style="padding: 12px 0; color: #8b5cf6; font-size: 15px;">{{language == "ja" ? "パッケージ" : "Package"}}: {{selected_package.name}}</td>
                <td align="right" style="padding: 12px 0; color: #8b5cf6; font-weight: 600; font-size: 15px;">{{formatCurrency selected_package.base_price}}</td>
              </tr>
              {{/if}}
              {{#if promotion_discount}}
              <tr>
                <td style="padding: 12px 0; color: #10b981; font-size: 15px;">{{language == "ja" ? "プロモーション" : "Promotion"}}: {{selected_promotion_name}}</td>
                <td align="right" style="padding: 12px 0; color: #10b981; font-weight: 600; font-size: 15px;">-{{formatCurrency promotion_discount}}</td>
              </tr>
              {{/if}}
              {{#if regular_discount}}
              <tr>
                <td style="padding: 12px 0; color: #e53e3e; font-size: 15px;">{{language == "ja" ? "割引" : "Discount"}} ({{discount_percentage}}%)</td>
                <td align="right" style="padding: 12px 0; color: #e53e3e; font-weight: 600; font-size: 15px;">-{{formatCurrency regular_discount}}</td>
              </tr>
              <tr>
                <td style="padding: 16px 0 12px; border-top: 2px solid #e2e8f0; font-weight: 600; font-size: 16px;">{{language == "ja" ? "小計" : "Subtotal"}}</td>
                <td align="right" style="padding: 16px 0 12px; border-top: 2px solid #e2e8f0; font-weight: 600; font-size: 16px;">{{formatCurrency subtotal}}</td>
              </tr>
              {{/if}}
              {{#if tax_amount}}
              <tr>
                <td style="padding: 12px 0; color: #666; font-size: 15px;">{{language == "ja" ? "税金" : "Tax"}} ({{tax_percentage}}%)</td>
                <td align="right" style="padding: 12px 0; color: #666; font-weight: 600; font-size: 15px;">+{{formatCurrency tax_amount}}</td>
              </tr>
              {{/if}}
              <tr style="background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);">
                <td style="padding: 20px 12px; border-top: 3px solid {{primary_color}}; font-weight: 700; font-size: 18px; color: #1a202c;">{{language == "ja" ? "合計金額" : "Total Amount Due"}}</td>
                <td align="right" style="padding: 20px 12px; border-top: 3px solid {{primary_color}}; font-weight: 700; font-size: 18px; color: {{primary_color}};">{{formatCurrency final_total}}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  </div>

  <!-- Official Quotation PDF Block -->
  <div style="background: #ffffff; padding: 24px; border-radius: 12px; margin: 24px 0; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 2px dashed #e2e8f0;">
    <div style="display: flex; align-items: center; margin-bottom: 16px;">
      <div style="background: #10b981; border-radius: 8px; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; margin-right: 16px;">
        <div style="color: white; font-size: 20px;">📄</div>
      </div>
      <div>
        <h3 style="margin: 0; color: #2d3748; font-size: 18px; font-weight: 600;">{{language == "ja" ? "公式見積書PDF" : "Official Quotation PDF"}}</h3>
        <p style="margin: 4px 0 0; color: #718096; font-size: 14px;">{{language == "ja" ? "詳細な見積書がメールに添付されています" : "Detailed quotation attached to this email"}}</p>
      </div>
    </div>
    <div style="text-align: center;">
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; display: inline-block;">
        <div style="color: #4a5568; font-size: 14px; margin-bottom: 8px;">{{language == "ja" ? "メールの添付ファイルを確認してください" : "Check your email attachments"}}</div>
        <div style="background: {{primary_color}}; color: white; padding: 8px 16px; border-radius: 6px; font-size: 14px; font-weight: 600; display: inline-block;">{{language == "ja" ? "PDFを確認" : "View PDF"}}</div>
      </div>
    </div>
  </div>

  <!-- View Quotation CTA Block -->
  <div style="background: {{primary_color}}; padding: 24px; border-radius: 12px; margin: 24px 0; text-align: center; box-shadow: 0 8px 32px rgba(0,0,0,0.15);">
    <h3 style="margin: 0 0 12px; color: white; font-size: 20px; font-weight: 700;">{{language == "ja" ? "オンラインで見積書を確認" : "View Your Quotation Online"}}</h3>
    <p style="margin: 0 0 20px; color: rgba(255,255,255,0.9); font-size: 16px; line-height: 1.5;">{{language == "ja" ? "詳細を確認し、承認、辞退、コメント、印刷ができます" : "Review details, accept, decline, comment, or print your quotation"}}</p>
    <a href="{{magic_link}}" style="background: white; color: {{primary_color}}; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 700; font-size: 16px; box-shadow: 0 4px 16px rgba(0,0,0,0.2); transition: all 0.3s ease;">{{language == "ja" ? "見積書を確認する" : "View Quotation"}}</a>
    <div style="margin-top: 16px;">
      <a href="{{magic_link}}" style="color: rgba(255,255,255,0.8); text-decoration: none; font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.3);">{{language == "ja" ? "または、このリンクをクリック" : "Or click this link"}}</a>
    </div>
    <p style="margin: 16px 0 0; color: rgba(255,255,255,0.7); font-size: 12px;">{{language == "ja" ? "このリンクは7日間有効です" : "This link is valid for 7 days"}}</p>
  </div>

  <!-- Next Steps - Sophisticated Luxury Design -->
  <div style="background: linear-gradient(135deg, #1a202c 0%, #2d3748 100%); padding: 32px; border-radius: 16px; margin: 32px 0; box-shadow: 0 12px 40px rgba(0,0,0,0.2); position: relative; overflow: hidden;">
    <!-- Decorative Elements -->
    <div style="position: absolute; top: -20px; right: -20px; width: 80px; height: 80px; background: linear-gradient(45deg, rgba(255,215,0,0.1), rgba(255,165,0,0.1)); border-radius: 50%;"></div>
    <div style="position: absolute; bottom: -30px; left: -30px; width: 120px; height: 120px; background: linear-gradient(45deg, rgba(255,215,0,0.05), rgba(255,165,0,0.05)); border-radius: 50%;"></div>
    
    <div style="position: relative; z-index: 2;">
      <div style="display: flex; align-items: center; margin-bottom: 24px;">
        <div style="background: linear-gradient(135deg, #ffd700, #ffb347); border-radius: 12px; width: 56px; height: 56px; display: flex; align-items: center; justify-content: center; margin-right: 20px; box-shadow: 0 4px 16px rgba(255,215,0,0.3);">
          <div style="color: #1a202c; font-size: 24px; font-weight: bold;">★</div>
        </div>
        <div>
          <h3 style="margin: 0; color: white; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">{{language == "ja" ? "次のステップ" : "Next Steps"}}</h3>
          <p style="margin: 4px 0 0; color: rgba(255,255,255,0.8); font-size: 16px; font-weight: 400;">{{language == "ja" ? "プレミアムサービス体験の準備" : "Preparing your premium service experience"}}</p>
        </div>
      </div>
      
      <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 24px; backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.1);">
        <div style="display: grid; gap: 16px;">
          <div style="display: flex; align-items: flex-start;">
            <div style="background: linear-gradient(135deg, #ffd700, #ffb347); border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; margin-right: 16px; flex-shrink: 0; box-shadow: 0 2px 8px rgba(255,215,0,0.3);">
              <div style="color: #1a202c; font-size: 14px; font-weight: bold;">1</div>
            </div>
            <div>
              <div style="color: white; font-size: 16px; font-weight: 600; margin-bottom: 4px;">{{language == "ja" ? "見積書の確認" : "Review Your Quotation"}}</div>
              <div style="color: rgba(255,255,255,0.7); font-size: 14px; line-height: 1.5;">{{language == "ja" ? "上記のリンクから詳細を確認し、サービス内容と料金をご確認ください" : "Click the link above to review all service details and pricing information"}}</div>
            </div>
          </div>
          
          <div style="display: flex; align-items: flex-start;">
            <div style="background: linear-gradient(135deg, #ffd700, #ffb347); border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; margin-right: 16px; flex-shrink: 0; box-shadow: 0 2px 8px rgba(255,215,0,0.3);">
              <div style="color: #1a202c; font-size: 14px; font-weight: bold;">2</div>
            </div>
            <div>
              <div style="color: white; font-size: 16px; font-weight: 600; margin-bottom: 4px;">{{language == "ja" ? "承認または修正" : "Approve or Request Changes"}}</div>
              <div style="color: rgba(255,255,255,0.7); font-size: 14px; line-height: 1.5;">{{language == "ja" ? "内容にご満足いただけましたら承認してください。修正が必要な場合はお気軽にお知らせください" : "Approve if satisfied, or let us know if any adjustments are needed"}}</div>
            </div>
          </div>
          
          <div style="display: flex; align-items: flex-start;">
            <div style="background: linear-gradient(135deg, #ffd700, #ffb347); border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; margin-right: 16px; flex-shrink: 0; box-shadow: 0 2px 8px rgba(255,215,0,0.3);">
              <div style="color: #1a202c; font-size: 14px; font-weight: bold;">3</div>
            </div>
            <div>
              <div style="color: white; font-size: 16px; font-weight: 600; margin-bottom: 4px;">{{language == "ja" ? "プレミアムサービス体験" : "Premium Service Experience"}}</div>
              <div style="color: rgba(255,255,255,0.7); font-size: 14px; line-height: 1.5;">{{language == "ja" ? "承認後、最高品質の輸送サービスをお楽しみいただけます" : "Once approved, enjoy our highest quality transportation service"}}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Footer -->
  <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #e2e8f0; text-align: center;">
    <p style="margin: 0 0 12px; color: #4a5568; font-size: 16px; line-height: 1.6;">
      {{language == "ja" ? "オンライン見積もりから、承諾、辞退、コメント、印刷ができます。" : "From your online quote you can accept, decline, comment or print."}}
    </p>
    <p style="margin: 0 0 16px; color: #4a5568; font-size: 16px; line-height: 1.6;">
      {{language == "ja" ? "よろしくお願いいたします。" : "We look forward to working with you."}}
    </p>
    <p style="margin: 0; color: #2d3748; font-weight: 600; font-size: 18px;">{{from_name}}</p>
  </div>

</body>
</html>
'
WHERE name = 'Quotation Sent' AND type = 'email';
