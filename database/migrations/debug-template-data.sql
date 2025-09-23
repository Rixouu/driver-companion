-- Debug: Add debug information to see what data is being passed to the template
-- This will help us understand why the time-based pricing condition is not working

UPDATE notification_templates
SET html_content = REPLACE(
  html_content,
  '            <!-- Time-based Pricing Adjustment - Only for Airport Transfer -->
            {{#if service_type_airport}}
            {{#if time_based_discount}}
            <div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid #e2e8f0;">
              <div style="color: #f97316; font-weight: 600; margin-bottom: 2px;">{{language == "ja" ? "時間調整" : "Time Adjustment"}} ({{time_based_discount_percentage}}%): +{{formatCurrency time_based_discount currency}}</div>
              {{#if time_based_rule_name}}<div style="color: #6b7280; font-size: 10px;">{{time_based_rule_name}}</div>{{/if}}
            </div>
            {{/if}}
            {{/if}}',
  '            <!-- DEBUG: Service Type and Time-based Data -->
            <div style="background: #f0f0f0; padding: 8px; margin: 4px 0; font-size: 10px; border: 1px solid #ccc;">
              <div>DEBUG - service_type_airport: {{service_type_airport}}</div>
              <div>DEBUG - service_type_charter: {{service_type_charter}}</div>
              <div>DEBUG - time_based_discount: {{time_based_discount}}</div>
              <div>DEBUG - time_based_adjustment: {{time_based_adjustment}}</div>
              <div>DEBUG - service_type_name: {{service_type_name}}</div>
            </div>
            
            <!-- Time-based Pricing Adjustment - Only for Airport Transfer -->
            {{#if service_type_airport}}
            {{#if time_based_discount}}
            <div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid #e2e8f0;">
              <div style="color: #f97316; font-weight: 600; margin-bottom: 2px;">{{language == "ja" ? "時間調整" : "Time Adjustment"}} ({{time_based_discount_percentage}}%): +{{formatCurrency time_based_discount currency}}</div>
              {{#if time_based_rule_name}}<div style="color: #6b7280; font-size: 10px;">{{time_based_rule_name}}</div>{{/if}}
            </div>
            {{/if}}
            {{/if}}'
)
WHERE name = 'Quotation Sent' AND type = 'email';
