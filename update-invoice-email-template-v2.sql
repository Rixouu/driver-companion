-- Better Invoice Email Template with proper layout and design
UPDATE notification_templates
SET html_content = '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice - Payment Required</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; background-color: #f8fafc; line-height: 1.6;">
  
  <!-- Main Container -->
  <div style="max-width: 600px; margin: 0 auto; background: white; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #dc2626, #b91c1c); color: white; padding: 20px; text-align: center;">
      <h1 style="margin: 0; font-size: 24px; font-weight: bold;">Invoice - Payment Required</h1>
      <p style="margin: 5px 0 0 0; font-size: 16px; opacity: 0.9;">#{{quotation_id}}</p>
    </div>
    
    <!-- Greeting -->
    <div style="padding: 25px 30px 20px;">
      <h2 style="margin: 0 0 8px 0; color: #1f2937; font-size: 20px;">Hello {{customer_name}},</h2>
      <p style="margin: 0; color: #6b7280; font-size: 16px;">Please find your invoice details below. Complete your payment to confirm your booking.</p>
    </div>
    
    <!-- Service Details Card -->
    <div style="margin: 0 30px 20px; background: #f9fafb; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb;">
      <div style="background: #3b82f6; color: white; padding: 15px 20px;">
        <h3 style="margin: 0; font-size: 16px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Service Details</h3>
      </div>
      <div style="padding: 20px;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
          <div>
            <div style="color: #6b7280; font-size: 14px; font-weight: 500; margin-bottom: 4px;">Service Type</div>
            <div style="color: #1f2937; font-size: 16px; font-weight: 600;">{{service_type}}</div>
          </div>
          <div>
            <div style="color: #6b7280; font-size: 14px; font-weight: 500; margin-bottom: 4px;">Vehicle</div>
            <div style="color: #1f2937; font-size: 16px; font-weight: 600;">{{vehicle_type}}</div>
          </div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
          <div>
            <div style="color: #6b7280; font-size: 14px; font-weight: 500; margin-bottom: 4px;">Date & Time</div>
            <div style="color: #1f2937; font-size: 16px; font-weight: 600;">{{date}} at {{time}}</div>
          </div>
          <div>
            <div style="color: #6b7280; font-size: 14px; font-weight: 500; margin-bottom: 4px;">Duration</div>
            <div style="color: #1f2937; font-size: 16px; font-weight: 600;">{{duration_hours}}h{{#if service_days}} ({{service_days}} days){{/if}}</div>
          </div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
          <div>
            <div style="color: #6b7280; font-size: 14px; font-weight: 500; margin-bottom: 4px;">Pickup Location</div>
            <div style="color: #1f2937; font-size: 16px; font-weight: 600;">{{pickup_location}}</div>
          </div>
          <div>
            <div style="color: #6b7280; font-size: 14px; font-weight: 500; margin-bottom: 4px;">Drop-off Location</div>
            <div style="color: #1f2937; font-size: 16px; font-weight: 600;">{{dropoff_location}}</div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Invoice Details Card -->
    <div style="margin: 0 30px 20px; background: #f9fafb; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb;">
      <div style="background: #059669; color: white; padding: 15px 20px;">
        <h3 style="margin: 0; font-size: 16px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Invoice Information</h3>
      </div>
      <div style="padding: 20px;">
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-bottom: 20px;">
          <div>
            <div style="color: #6b7280; font-size: 14px; font-weight: 500; margin-bottom: 4px;">Invoice ID</div>
            <div style="color: #1f2937; font-size: 16px; font-weight: 700;">{{quotation_id}}</div>
          </div>
          <div>
            <div style="color: #6b7280; font-size: 14px; font-weight: 500; margin-bottom: 4px;">Issue Date</div>
            <div style="color: #1f2937; font-size: 16px; font-weight: 600;">{{issue_date}}</div>
          </div>
          <div>
            <div style="color: #6b7280; font-size: 14px; font-weight: 500; margin-bottom: 4px;">Due Date</div>
            <div style="color: #1f2937; font-size: 16px; font-weight: 600;">{{due_date}}</div>
          </div>
        </div>
        
        <!-- Price Breakdown -->
        <div style="background: white; border-radius: 8px; padding: 20px; border: 1px solid #e5e7eb;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #f3f4f6;">
            <span style="color: #6b7280; font-size: 16px; font-weight: 500;">Subtotal</span>
            <span style="color: #1f2937; font-size: 16px; font-weight: 600;">{{formatCurrency service_total currency}}</span>
          </div>
          {{#if tax_percentage}}
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #f3f4f6;">
            <span style="color: #6b7280; font-size: 16px; font-weight: 500;">Tax ({{tax_percentage}}%)</span>
            <span style="color: #1f2937; font-size: 16px; font-weight: 600;">{{formatCurrency tax_amount currency}}</span>
          </div>
          {{/if}}
          {{#if promotion_discount}}
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #f3f4f6;">
            <span style="color: #6b7280; font-size: 16px; font-weight: 500;">Discount</span>
            <span style="color: #dc2626; font-size: 16px; font-weight: 600;">-{{formatCurrency promotion_discount currency}}</span>
          </div>
          {{/if}}
          <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 12px;">
            <span style="color: #1f2937; font-size: 18px; font-weight: 700;">Total Amount</span>
            <span style="color: #1f2937; font-size: 20px; font-weight: 700;">{{formatCurrency total_amount currency}}</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- PDF Attachment Notice -->
    <div style="margin: 0 30px 20px; background: #eff6ff; border-radius: 12px; padding: 20px; border-left: 4px solid #3b82f6;">
      <div style="display: flex; align-items: center;">
        <div style="background: #3b82f6; color: white; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px; font-size: 18px;">📄</div>
        <div>
          <h4 style="margin: 0 0 4px 0; color: #1e40af; font-size: 16px; font-weight: 600;">PDF Invoice Attached</h4>
          <p style="margin: 0; color: #1e40af; font-size: 14px;">A detailed PDF copy of this invoice is attached to this email for your records.</p>
        </div>
      </div>
    </div>
    
    <!-- Payment Section -->
    <div style="margin: 0 30px 30px; background: linear-gradient(135deg, #fef2f2, #fee2e2); border-radius: 12px; padding: 25px; border: 1px solid #fecaca; text-align: center;">
      <div style="margin-bottom: 20px;">
        <h3 style="margin: 0 0 8px 0; color: #dc2626; font-size: 18px; font-weight: 700;">Complete Your Payment</h3>
        <p style="margin: 0; color: #991b1b; font-size: 16px;">Click the button below to securely complete your payment and confirm your booking.</p>
      </div>
      
      <a href="{{payment_link}}" style="background: linear-gradient(135deg, #dc2626, #b91c1c); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 700; font-size: 16px; box-shadow: 0 4px 6px rgba(220, 38, 38, 0.3); transition: all 0.2s;">
        💳 Pay Now - {{formatCurrency total_amount currency}}
      </a>
      
      <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #fecaca;">
        <p style="margin: 0 0 8px 0; color: #991b1b; font-size: 14px; font-weight: 500;">Alternative Payment Method</p>
        <p style="margin: 0; color: #991b1b; font-size: 12px; word-break: break-all; background: white; padding: 8px 12px; border-radius: 6px; border: 1px solid #fecaca;">{{payment_link}}</p>
      </div>
    </div>
    
    <!-- Footer -->
    <div style="background: #f9fafb; padding: 25px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="margin: 0; color: #6b7280; font-size: 16px; font-weight: 600;">Thank you for choosing our services!</p>
      <p style="margin: 8px 0 0 0; color: #9ca3af; font-size: 14px;">If you have any questions, please contact our support team.</p>
    </div>
    
  </div>
</body>
</html>'
WHERE name = 'Invoice Email';
