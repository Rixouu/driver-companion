-- Enhanced Invoice Email Template with improved PDF and Payment blocks
-- Handles multiple services and matches the design requirements
UPDATE notification_templates 
SET html_content = '<div style="margin-bottom: 20px;">
  <h2 style="color: #2d3748; margin: 0 0 8px 0; font-size: 18px;">Hello {{customer_name}},</h2>
  <p style="margin: 0; color: #4a5568; font-size: 14px;">Please find your invoice for the quotation below.</p>
</div>

<!-- Service & Invoice Details - Table-based Layout for Email Compatibility -->
<div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; ">
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
                    {{#if pickup_location}}
                    <div>Pickup: {{pickup_location}}</div>
                    {{/if}}
                    {{#if dropoff_location}}
                    <div>Drop-off: {{dropoff_location}}</div>
                    {{/if}}
                    {{#if number_of_passengers}}
                    <div>Passengers: {{number_of_passengers}}</div>
                    {{/if}}
                    {{#if number_of_bags}}
                    <div>Bags: {{number_of_bags}}</div>
                    {{/if}}
                    {{#if flight_number}}
                    <div>Flight: {{flight_number}}{{#if terminal}} (Terminal: {{terminal}}){{/if}}</div>
                    {{/if}}
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

<!-- Official Invoice PDF Block - Enhanced Design -->
<div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px dashed #d1d5db;">
  <div style="text-align: center;">
    <!-- PDF Icon -->
    <div style="background: #dc2626; width: 60px; height: 60px; border-radius: 12px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
      <div style="color: white; font-size: 24px;">📄</div>
    </div>
    
    <!-- Title -->
    <h3 style="margin: 0 0 8px 0; color: #2d3748; font-size: 18px; font-weight: bold;">Official Invoice PDF</h3>
    
    <!-- Description -->
    <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 14px; line-height: 1.5;">A detailed PDF copy of this invoice has been attached to this email for your records and accounting purposes.</p>
    
    <!-- Check Attachments Button -->
    <div style="background: white; border: 1px solid #d1d5db; border-radius: 6px; padding: 12px 20px; display: inline-block;">
      <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
        <span style="color: #6b7280; font-size: 16px;">📎</span>
        <span style="color: #dc2626; font-size: 14px; font-weight: 600;">Check email attachments</span>
      </div>
    </div>
  </div>
</div>

<!-- Secure Payment Block - Enhanced Design -->
<div style="background: #dc2626; padding: 24px; border-radius: 8px; margin: 20px 0; text-align: center;">
  <!-- Title -->
  <h3 style="margin: 0 0 12px 0; color: white; font-size: 18px; font-weight: bold;">Secure Payment</h3>
  
  <!-- Instruction -->
  <p style="margin: 0 0 20px 0; color: white; font-size: 14px; opacity: 0.9;">Please click the button below to complete your payment securely.</p>
  
  <!-- Pay Now Button -->
  <div style="margin-bottom: 16px;">
    <a href="{{payment_link}}" style="background: white; color: #dc2626; padding: 16px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
      Pay Now - {{formatCurrency total_amount currency}}
    </a>
  </div>
  
  <!-- Alternative Link -->
  <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(255, 255, 255, 0.2);">
    <p style="margin: 0 0 8px 0; color: white; font-size: 12px; opacity: 0.8;">Or copy and paste this link into your browser:</p>
    <p style="margin: 0; color: white; font-size: 11px; word-break: break-all; background: rgba(255, 255, 255, 0.1); padding: 8px 12px; border-radius: 4px;">{{payment_link}}</p>
  </div>
</div>'
WHERE name = 'Invoice Email';
