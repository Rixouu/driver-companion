-- Update only the Next Steps & Contact Information section in Quotation Rejected template
UPDATE notification_templates 
SET html_content = REPLACE(
  html_content,
  '<!-- Next Steps & Contact Information - Combined Block -->
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
</div>',
  '<!-- Next Steps & Contact Information - Combined Block with White Background Button -->
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
</div>'
)
WHERE name = 'Quotation Rejected';
