-- Update Invoice Email Template to match PDF reference format
-- Enhanced service details with 2x2 grid layout for service information

UPDATE notification_templates 
SET html_content = '<div style="margin-bottom: 20px;">
  <h2 style="color: #2d3748; margin: 0 0 8px 0; font-size: 18px;">Hello {{customer_name}},</h2>
  <p style="margin: 0; color: #4a5568; font-size: 14px;">Please find your invoice for the quotation below.</p>
</div>

<!-- Service & Invoice Details - Enhanced Layout -->
<div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
  <h3 style="margin: 0 0 16px 0; color: #2d3748; text-transform: uppercase; font-size: 16px; font-weight: bold;">Service & Invoice Details</h3>
  <div style="background: white; padding: 20px; border-radius: 6px;">
    
    <!-- Service Details - 2x2 Grid -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; padding-bottom: 20px; border-bottom: 2px solid #e5e7eb;">
      <div>
        <strong style="color: #2d3748; font-size: 13px; display: block; margin-bottom: 4px;">Service:</strong>
        <span style="color: #4a5568; font-size: 13px;">{{service_type}}</span>
      </div>
      <div>
        <strong style="color: #2d3748; font-size: 13px; display: block; margin-bottom: 4px;">Vehicle:</strong>
        <span style="color: #4a5568; font-size: 13px;">{{vehicle_type}}</span>
      </div>
      <div>
        <strong style="color: #2d3748; font-size: 13px; display: block; margin-bottom: 4px;">Duration:</strong>
        <span style="color: #4a5568; font-size: 13px;">{{duration_hours}}h{{#if service_days}} ({{service_days}} day(s)){{/if}}</span>
      </div>
      <div>
        <strong style="color: #2d3748; font-size: 13px; display: block; margin-bottom: 4px;">Date & Time:</strong>
        <span style="color: #4a5568; font-size: 13px;">{{date}} at {{time}}</span>
      </div>
    </div>
    
    <!-- Location Details - 2x2 Grid -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; padding-bottom: 20px; border-bottom: 2px solid #e5e7eb;">
      <div>
        <strong style="color: #2d3748; font-size: 13px; display: block; margin-bottom: 4px;">Pickup:</strong>
        <span style="color: #4a5568; font-size: 13px;">{{pickup_location}}</span>
      </div>
      <div>
        <strong style="color: #2d3748; font-size: 13px; display: block; margin-bottom: 4px;">Drop-off:</strong>
        <span style="color: #4a5568; font-size: 13px;">{{dropoff_location}}</span>
      </div>
      <div>
        <strong style="color: #2d3748; font-size: 13px; display: block; margin-bottom: 4px;">Invoice ID:</strong>
        <span style="color: #2d3748; font-size: 13px; font-weight: bold;">{{quotation_id}}</span>
      </div>
      <div>
        <strong style="color: #2d3748; font-size: 13px; display: block; margin-bottom: 4px;">Issue Date:</strong>
        <span style="color: #4a5568; font-size: 13px;">{{issue_date}}</span>
      </div>
    </div>
    
    <!-- Price Breakdown - Enhanced to match PDF format -->
    <div style="background: #f8fafc; padding: 16px; border-radius: 6px; margin-top: 16px;">
      <h4 style="margin: 0 0 12px 0; color: #2d3748; font-size: 14px; font-weight: bold;">PRICE DETAILS</h4>
      
      <!-- Service Items - Enhanced Layout -->
      {{#each quotation_items}}
      <div style="margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px;">
          <div style="flex: 1;">
            <div style="font-weight: 600; color: #2d3748; font-size: 13px;">{{description}}</div>
            {{#if service_days}}
            <div style="color: #6b7280; font-size: 11px; margin-top: 2px;">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 4px;">
                <div>Hourly Rate ({{duration_hours}} hours / day): {{formatCurrency unit_price currency}}</div>
                <div>Number of Days: × {{service_days}}</div>
                <div>Pickup Date: {{pickup_date}}, Pickup Time: {{pickup_time}}</div>
                <div></div>
              </div>
            </div>
            {{/if}}
          </div>
          <div style="font-weight: 600; color: #2d3748; font-size: 13px;">{{formatCurrency total_price currency}}</div>
        </div>
      </div>
      {{/each}}
      
      <!-- Totals -->
      <div style="margin-top: 12px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
          <span style="font-size: 12px; color: #2d3748;">Services Subtotal:</span>
          <span style="font-size: 12px; color: #2d3748;">{{formatCurrency service_total currency}}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
          <span style="font-size: 12px; color: #2d3748;">Subtotal:</span>
          <span style="font-size: 12px; color: #2d3748;">{{formatCurrency service_total currency}}</span>
        </div>
        {{#if discount_percentage}}
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
          <span style="font-size: 12px; color: #dc2626;">Discount ({{discount_percentage}}%):</span>
          <span style="font-size: 12px; color: #dc2626;">-{{formatCurrency regular_discount currency}}</span>
        </div>
        {{/if}}
        {{#if tax_percentage}}
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
          <span style="font-size: 12px; color: #2d3748;">Tax ({{tax_percentage}}%):</span>
          <span style="font-size: 12px; color: #2d3748;">+{{formatCurrency tax_amount currency}}</span>
        </div>
        {{/if}}
        <hr style="border: none; border-top: 2px solid #2d3748; margin: 10px 0;">
        <div style="display: flex; justify-content: space-between;">
          <span style="font-size: 14px; color: #2d3748; font-weight: bold;">Total Amount Due:</span>
          <span style="font-size: 14px; color: #2d3748; font-weight: bold;">{{formatCurrency total_amount currency}}</span>
        </div>
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
