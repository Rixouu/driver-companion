-- Make service and breakdown sections less tall - minimal changes only
UPDATE notification_templates 
SET html_content = '<div style="margin-bottom: 15px;">
  <h2 style="color: #2d3748; margin: 0 0 5px 0; font-size: 18px;">Hello {{customer_name}},</h2>
  <p style="margin: 0; color: #4a5568; font-size: 14px;">Please find your invoice for the quotation below.</p>
</div>

<!-- Compact Service & Invoice Details -->
<div style="background: #f8fafc; padding: 12px; border-radius: 6px; margin: 12px 0; border-left: 4px solid #3b82f6;">
  <h3 style="margin: 0 0 8px 0; color: #2d3748; text-transform: uppercase; font-size: 13px;">Service & Invoice Details</h3>
  <div style="background: white; padding: 8px; border-radius: 4px;">
    <!-- Service Info Row -->
    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb;">
      <div>
        <strong style="color: #2d3748; font-size: 11px;">Service:</strong><br>
        <span style="color: #4a5568; font-size: 11px;">{{service_type}}</span>
      </div>
      <div>
        <strong style="color: #2d3748; font-size: 11px;">Vehicle:</strong><br>
        <span style="color: #4a5568; font-size: 11px;">{{vehicle_type}}</span>
      </div>
      <div>
        <strong style="color: #2d3748; font-size: 11px;">Duration:</strong><br>
        <span style="color: #4a5568; font-size: 11px;">{{duration_hours}}h{{#if service_days}} ({{service_days}}d){{/if}}</span>
      </div>
    </div>
    
    <!-- Date & Location Row -->
    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb;">
      <div>
        <strong style="color: #2d3748; font-size: 11px;">Date & Time:</strong><br>
        <span style="color: #4a5568; font-size: 11px;">{{date}} at {{time}}</span>
      </div>
      <div>
        <strong style="color: #2d3748; font-size: 11px;">Pickup:</strong><br>
        <span style="color: #4a5568; font-size: 11px;">{{pickup_location}}</span>
      </div>
      <div>
        <strong style="color: #2d3748; font-size: 11px;">Drop-off:</strong><br>
        <span style="color: #4a5568; font-size: 11px;">{{dropoff_location}}</span>
      </div>
    </div>
    
    <!-- Invoice Info Row -->
    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 8px;">
      <div>
        <strong style="color: #2d3748; font-size: 11px;">Invoice ID:</strong><br>
        <span style="color: #2d3748; font-size: 11px; font-weight: bold;">{{quotation_id}}</span>
      </div>
      <div>
        <strong style="color: #2d3748; font-size: 11px;">Issue Date:</strong><br>
        <span style="color: #4a5568; font-size: 11px;">{{issue_date}}</span>
      </div>
      <div>
        <strong style="color: #2d3748; font-size: 11px;">Due Date:</strong><br>
        <span style="color: #4a5568; font-size: 11px;">{{due_date}}</span>
      </div>
    </div>
    
    <!-- Price Breakdown - More Compact -->
    <div style="background: #f8fafc; padding: 8px; border-radius: 4px; margin-top: 8px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
        <span style="font-size: 11px; color: #2d3748;">Subtotal:</span>
        <span style="font-size: 11px; color: #2d3748;">{{formatCurrency service_total currency}}</span>
      </div>
      {{#if tax_percentage}}
      <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
        <span style="font-size: 11px; color: #2d3748;">Tax ({{tax_percentage}}%):</span>
        <span style="font-size: 11px; color: #2d3748;">{{formatCurrency tax_amount currency}}</span>
      </div>
      {{/if}}
      {{#if promotion_discount}}
      <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
        <span style="font-size: 11px; color: #2d3748;">Discount:</span>
        <span style="font-size: 11px; color: #2d3748;">-{{formatCurrency promotion_discount currency}}</span>
      </div>
      {{/if}}
      <hr style="border: none; border-top: 1px solid #2d3748; margin: 6px 0;">
      <div style="display: flex; justify-content: space-between;">
        <span style="font-size: 13px; color: #2d3748; font-weight: bold;">Total Amount:</span>
        <span style="font-size: 13px; color: #2d3748; font-weight: bold;">{{formatCurrency total_amount currency}}</span>
      </div>
    </div>
  </div>
</div>

<div style="background: #f0f9ff; padding: 12px; border-radius: 6px; margin: 12px 0; border-left: 4px solid #3b82f6;">
  <h3 style="margin: 0 0 8px 0; color: #2d3748; text-transform: uppercase; font-size: 13px;">PDF Attachment</h3>
  <div style="background: white; padding: 8px; border-radius: 4px;">
    <p style="margin: 0; font-size: 11px; color: #2d3748;">A PDF copy of this invoice is attached to this email.</p>
  </div>
</div>

<!-- Payment Link -->
<div style="text-align: left; margin: 15px 0; padding: 12px; background: #fef2f2; border-radius: 6px; border-left: 4px solid #ff2800;">
  <h3 style="margin: 0 0 8px 0; color: #2d3748; text-transform: uppercase; font-size: 13px;">Payment</h3>
  <div style="background: white; padding: 8px; border-radius: 4px; text-align:center;">
    <p style="margin: 0 0 8px 0; font-size: 11px; color: #2d3748;">Please click the button below to complete your payment securely.</p>
    <a href="{{payment_link}}" style="background: #ff2800; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: 600; font-size: 13px;">
      Pay Now
    </a>
    <p style="margin: 8px 0 4px 0; font-size: 9px; color: #94a3b8; text-align: center;">Or copy and paste this link into your browser:</p>
    <p style="margin: 0; font-size: 9px; color: #3b82f6; text-align: center; word-break: break-all;">{{payment_link}}</p>
  </div>
</div>'
WHERE name = 'Invoice Email';
