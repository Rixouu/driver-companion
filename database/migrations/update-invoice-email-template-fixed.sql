-- Update Invoice Email template with proper table-based 2-column layout
-- This fixes the CSS Grid issues and template rendering problems

UPDATE notification_templates 
SET html_content = '<div style="margin-bottom: 20px;">
  <h2 style="color: #2d3748; margin: 0 0 8px 0; font-size: 18px;">Hello {{customer_name}},</h2>
  <p style="margin: 0; color: #4a5568; font-size: 14px;">Please find your invoice for the quotation below.</p>
</div>

<!-- Service & Invoice Details - Table-based Layout for Email Compatibility -->
<div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
  <h3 style="margin: 0 0 16px 0; color: #2d3748; text-transform: uppercase; font-size: 16px; font-weight: bold;">Service & Invoice Details</h3>
  <div style="background: white; padding: 20px; border-radius: 6px;">
    
    <!-- Service Details - 2x2 Table Layout -->
    <table style="width: 100%; margin-bottom: 20px; padding-bottom: 20px; border-bottom: 2px solid #e5e7eb;">
      <tr>
        <td style="width: 50%; padding: 8px 16px 8px 0; vertical-align: top;">
          <strong style="color: #2d3748; font-size: 13px; display: block; margin-bottom: 4px;">Service:</strong>
          <span style="color: #4a5568; font-size: 13px;">{{service_type}}</span>
        </td>
        <td style="width: 50%; padding: 8px 0 8px 16px; vertical-align: top;">
          <strong style="color: #2d3748; font-size: 13px; display: block; margin-bottom: 4px;">Vehicle:</strong>
          <span style="color: #4a5568; font-size: 13px;">{{vehicle_type}}</span>
        </td>
      </tr>
      <tr>
        <td style="width: 50%; padding: 8px 16px 8px 0; vertical-align: top;">
          <strong style="color: #2d3748; font-size: 13px; display: block; margin-bottom: 4px;">Duration:</strong>
          <span style="color: #4a5568; font-size: 13px;">{{duration_hours}}h{{#if service_days}} ({{service_days}} day(s) × {{hours_per_day}}h/day){{/if}}</span>
        </td>
        <td style="width: 50%; padding: 8px 0 8px 16px; vertical-align: top;">
          <strong style="color: #2d3748; font-size: 13px; display: block; margin-bottom: 4px;">Date & Time:</strong>
          <span style="color: #4a5568; font-size: 13px;">{{date}} at {{time}}</span>
        </td>
      </tr>
    </table>
    
    <!-- Location Details - 2x2 Table Layout (only show if locations exist) -->
    {{#if pickup_location}}
    <table style="width: 100%; margin-bottom: 20px; padding-bottom: 20px; border-bottom: 2px solid #e5e7eb;">
      <tr>
        <td style="width: 50%; padding: 8px 16px 8px 0; vertical-align: top;">
          <strong style="color: #2d3748; font-size: 13px; display: block; margin-bottom: 4px;">Pickup:</strong>
          <span style="color: #4a5568; font-size: 13px;">{{pickup_location}}</span>
        </td>
        <td style="width: 50%; padding: 8px 0 8px 16px; vertical-align: top;">
          <strong style="color: #2d3748; font-size: 13px; display: block; margin-bottom: 4px;">Drop-off:</strong>
          <span style="color: #4a5568; font-size: 13px;">{{dropoff_location}}</span>
        </td>
      </tr>
      <tr>
        <td style="width: 50%; padding: 8px 16px 8px 0; vertical-align: top;">
          <strong style="color: #2d3748; font-size: 13px; display: block; margin-bottom: 4px;">Invoice ID:</strong>
          <span style="color: #2d3748; font-size: 13px; font-weight: bold;">{{quotation_id}}</span>
        </td>
        <td style="width: 50%; padding: 8px 0 8px 16px; vertical-align: top;">
          <strong style="color: #2d3748; font-size: 13px; display: block; margin-bottom: 4px;">Issue Date:</strong>
          <span style="color: #4a5568; font-size: 13px;">{{issue_date}}</span>
        </td>
      </tr>
    </table>
    {{else}}
    <!-- Invoice ID and Issue Date only if no locations -->
    <table style="width: 100%; margin-bottom: 20px; padding-bottom: 20px; border-bottom: 2px solid #e5e7eb;">
      <tr>
        <td style="width: 50%; padding: 8px 16px 8px 0; vertical-align: top;">
          <strong style="color: #2d3748; font-size: 13px; display: block; margin-bottom: 4px;">Invoice ID:</strong>
          <span style="color: #2d3748; font-size: 13px; font-weight: bold;">{{quotation_id}}</span>
        </td>
        <td style="width: 50%; padding: 8px 0 8px 16px; vertical-align: top;">
          <strong style="color: #2d3748; font-size: 13px; display: block; margin-bottom: 4px;">Issue Date:</strong>
          <span style="color: #4a5568; font-size: 13px;">{{issue_date}}</span>
        </td>
      </tr>
    </table>
    {{/if}}
    
    <!-- Price Breakdown - Enhanced to match PDF format -->
    <div style="background: #f8fafc; padding: 16px; border-radius: 6px; margin-top: 16px;">
      <h4 style="margin: 0 0 12px 0; color: #2d3748; font-size: 14px; font-weight: bold;">PRICE DETAILS</h4>
      
      <!-- Service Items - Table Layout -->
      <table style="width: 100%; margin-bottom: 12px;">
        {{#each quotation_items}}
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <div style="flex: 1;">
                <div style="font-weight: 600; color: #2d3748; font-size: 13px;">{{description}}</div>
                {{#if service_days}}
                <div style="color: #6b7280; font-size: 11px; margin-top: 2px;">
                  <div style="margin-top: 4px;">
                    <div>Hourly Rate ({{duration_hours}} hours / day): {{formatCurrency unit_price currency}}</div>
                    <div>Number of Days: × {{service_days}}</div>
                    <div>Pickup Date: {{pickup_date}}, Pickup Time: {{pickup_time}}</div>
                  </div>
                </div>
                {{/if}}
              </div>
              <div style="font-weight: 600; color: #2d3748; font-size: 13px; margin-left: 16px;">{{formatCurrency total_price currency}}</div>
            </div>
          </td>
        </tr>
        {{/each}}
      </table>
      
      <!-- Totals -->
      <div style="margin-top: 12px;">
        <table style="width: 100%;">
          <tr>
            <td style="padding: 4px 0; font-size: 12px; color: #2d3748;">Services Subtotal:</td>
            <td style="padding: 4px 0; font-size: 12px; color: #2d3748; text-align: right;">{{formatCurrency service_total currency}}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; font-size: 12px; color: #2d3748;">Subtotal:</td>
            <td style="padding: 4px 0; font-size: 12px; color: #2d3748; text-align: right;">{{formatCurrency service_total currency}}</td>
          </tr>
          {{#if discount_percentage}}
          <tr>
            <td style="padding: 4px 0; font-size: 12px; color: #dc2626;">Discount ({{discount_percentage}}%):</td>
            <td style="padding: 4px 0; font-size: 12px; color: #dc2626; text-align: right;">-{{formatCurrency regular_discount currency}}</td>
          </tr>
          {{/if}}
          {{#if tax_percentage}}
          <tr>
            <td style="padding: 4px 0; font-size: 12px; color: #2d3748;">Tax ({{tax_percentage}}%):</td>
            <td style="padding: 4px 0; font-size: 12px; color: #2d3748; text-align: right;">+{{formatCurrency tax_amount currency}}</td>
          </tr>
          {{/if}}
          <tr>
            <td style="padding: 10px 0 4px 0; border-top: 2px solid #2d3748; font-size: 14px; color: #2d3748; font-weight: bold;">Total Amount Due:</td>
            <td style="padding: 10px 0 4px 0; border-top: 2px solid #2d3748; font-size: 14px; color: #2d3748; font-weight: bold; text-align: right;">{{formatCurrency total_amount currency}}</td>
          </tr>
        </table>
      </div>
    </div>
  </div>
</div>

<div style="background: #f0f9ff; padding: 16px; border-radius: 6px; margin: 16px 0; border-left: 4px solid #3b82f6;">
  <h3 style="margin: 0 0 12px 0; color: #2d3748; text-transform: uppercase; font-size: 14px;">PDF Attachment</h3>
  <div style="background: white; padding: 12px; border-radius: 4px;">
    <p style="margin: 0; font-size: 12px; color: #2d3748;">A PDF copy of this invoice is attached to this email.</p>
  </div>
</div>

<!-- Payment Link -->
<div style="text-align: left; margin: 20px 0; padding: 16px; background: #fef2f2; border-radius: 6px; border-left: 4px solid #ff2800;">
  <h3 style="margin: 0 0 12px 0; color: #2d3748; text-transform: uppercase; font-size: 14px;">Payment</h3>
  <div style="background: white; padding: 12px; border-radius: 4px; text-align:center;">
    <p style="margin: 0 0 12px 0; font-size: 12px; color: #2d3748;">Please click the button below to complete your payment securely.</p>
    <a href="{{payment_link}}" style="background: #ff2800; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: 600; font-size: 14px;">
      Pay Now
    </a>
    <p style="margin: 12px 0 6px 0; font-size: 10px; color: #94a3b8; text-align: center;">Or copy and paste this link into your browser:</p>
    <p style="margin: 0; font-size: 10px; color: #3b82f6; text-align: center; word-break: break-all;">{{payment_link}}</p>
  </div>
</div>'
WHERE name = 'Invoice Email';
