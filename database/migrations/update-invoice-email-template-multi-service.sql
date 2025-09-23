-- Enhanced Invoice Email Template with per-service pickup/dropoff details
-- Shows individual service locations, passengers, bags, and flight info
UPDATE notification_templates 
SET html_content = '<div style="margin-bottom: 20px;">
  <h2 style="color: #2d3748; margin: 0 0 8px 0; font-size: 18px;">Hello {{customer_name}},</h2>
  <p style="margin: 0; color: #4a5568; font-size: 14px;">Please find your invoice for the quotation below.</p>
</div>

<!-- Service & Invoice Details - Enhanced for Multiple Services -->
<div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
  <h3 style="margin: 0 0 16px 0; color: #2d3748; text-transform: uppercase; font-size: 16px; font-weight: bold;">Service & Invoice Details</h3>
  <div style="background: white; padding: 20px; border-radius: 6px;">
    
    <!-- Invoice Information -->
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
    
    <!-- Individual Service Details -->
    <div style="margin-bottom: 20px;">
      <h4 style="margin: 0 0 12px 0; color: #2d3748; font-size: 14px; font-weight: bold;">SERVICE DETAILS</h4>
      
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
              <strong style="color: #6b7280; font-size: 11px; display: block; margin-bottom: 2px;">Duration:</strong>
              <span style="color: #4a5568; font-size: 12px;">{{duration_hours}}h{{#if service_days}} ({{service_days}} day(s) × {{hours_per_day}}h/day){{/if}}</span>
            </td>
            <td style="width: 50%; padding: 4px 0 4px 8px; vertical-align: top;">
              <strong style="color: #6b7280; font-size: 11px; display: block; margin-bottom: 2px;">Date & Time:</strong>
              <span style="color: #4a5568; font-size: 12px;">{{pickup_date}} at {{pickup_time}}</span>
            </td>
          </tr>
        </table>
        
        <!-- Location Details (if available) -->
        {{#if pickup_location}}
        <table style="width: 100%; margin-bottom: 8px;">
          <tr>
            <td style="width: 50%; padding: 4px 8px 4px 0; vertical-align: top;">
              <strong style="color: #6b7280; font-size: 11px; display: block; margin-bottom: 2px;">Pickup:</strong>
              <span style="color: #4a5568; font-size: 12px;">{{pickup_location}}</span>
            </td>
            <td style="width: 50%; padding: 4px 0 4px 8px; vertical-align: top;">
              <strong style="color: #6b7280; font-size: 11px; display: block; margin-bottom: 2px;">Drop-off:</strong>
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
              <strong style="color: #6b7280; font-size: 11px; display: block; margin-bottom: 2px;">Passengers:</strong>
              <span style="color: #4a5568; font-size: 12px;">{{number_of_passengers}}</span>
            </td>
            <td style="width: 50%; padding: 4px 0 4px 8px; vertical-align: top;">
              {{#if number_of_bags}}
              <strong style="color: #6b7280; font-size: 11px; display: block; margin-bottom: 2px;">Bags:</strong>
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
              <strong style="color: #6b7280; font-size: 11px; display: block; margin-bottom: 2px;">Flight:</strong>
              <span style="color: #4a5568; font-size: 12px;">{{flight_number}}{{#if terminal}} (Terminal: {{terminal}}){{/if}}</span>
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
          <div style="color: #6b7280; font-size: 10px; margin-bottom: 4px;">Rate Details:</div>
          <div style="color: #4a5568; font-size: 11px; line-height: 1.4;">
            <div>Hourly Rate: {{formatCurrency unit_price currency}} × {{duration_hours}}h/day</div>
            <div>Number of Days: × {{service_days}}</div>
            <div>Subtotal: {{formatCurrency total_price currency}}</div>
          </div>
        </div>
        {{/if}}
      </div>
      {{/each}}
    </div>
    
    <!-- Price Breakdown Summary -->
    <div style="background: #f8fafc; padding: 16px; border-radius: 6px; margin-top: 16px;">
      <h4 style="margin: 0 0 12px 0; color: #2d3748; font-size: 14px; font-weight: bold;">PRICE SUMMARY</h4>
      
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
<div style="background: #FF2800; padding: 24px; border-radius: 8px; margin: 20px 0; text-align: center;">
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
