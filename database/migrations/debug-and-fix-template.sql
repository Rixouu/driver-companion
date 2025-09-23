-- Add debug output to template and fix the time adjustment
UPDATE notification_templates
SET html_content = REPLACE(
  html_content,
  '            <!-- Time-based Pricing Adjustment - Only for Airport Transfer -->
            {{#if time_based_discount}}
            <div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid #e2e8f0;">
              <div style="color: #f97316; font-weight: 600; margin-bottom: 2px;">{{language == "ja" ? "時間調整" : "Time Adjustment"}} ({{time_based_discount_percentage}}%): +{{formatCurrency time_based_discount currency}}</div>
              {{#if time_based_rule_name}}<div style="color: #6b7280; font-size: 10px;">{{time_based_rule_name}}</div>{{/if}}
            </div>
            {{/if}}',
  '            <!-- DEBUG: Template Values -->
            <div style="background: #f0f0f0; padding: 5px; margin: 5px 0; font-size: 10px; border: 1px solid #ccc;">
              DEBUG - service_type_name: {{service_type_name}}<br>
              DEBUG - isCharter: {{service_type_charter}}<br>
              DEBUG - isAirport: {{service_type_airport}}<br>
              DEBUG - time_based_discount: {{time_based_discount}}<br>
              DEBUG - time_based_discount_percentage: {{time_based_discount_percentage}}<br>
              DEBUG - time_based_rule_name: {{time_based_rule_name}}<br>
              DEBUG - show_time_adjustment: {{show_time_adjustment}}
            </div>
            
            <!-- Time-based Pricing Adjustment - Only for Airport Transfer -->
            {{#if time_based_discount}}
            {{#unless service_type_charter}}
            <div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid #e2e8f0;">
              <div style="color: #f97316; font-weight: 600; margin-bottom: 2px;">{{language == "ja" ? "時間調整" : "Time Adjustment"}} ({{time_based_discount_percentage}}%): +{{formatCurrency time_based_discount currency}}</div>
              {{#if time_based_rule_name}}<div style="color: #6b7280; font-size: 10px;">{{time_based_rule_name}}</div>{{/if}}
            </div>
            {{/unless}}
            {{/if}}'
)
WHERE name = 'Quotation Sent' AND type = 'email';
