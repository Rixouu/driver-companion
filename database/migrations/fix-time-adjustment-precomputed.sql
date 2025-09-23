-- Fix time-based pricing display using pre-computed data instead of template conditions
-- This avoids the template engine's boolean evaluation issues

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
  '            <!-- Time-based Pricing Adjustment - Using pre-computed data -->
            {{#if show_time_adjustment}}
            <div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid #e2e8f0;">
              <div style="color: #f97316; font-weight: 600; margin-bottom: 2px;">{{language == "ja" ? "時間調整" : "Time Adjustment"}} ({{time_adjustment_display.percentage}}%): +{{formatCurrency time_adjustment_display.amount currency}}</div>
              {{#if time_adjustment_display.rule_name}}<div style="color: #6b7280; font-size: 10px;">{{time_adjustment_display.rule_name}}</div>{{/if}}
            </div>
            {{/if}}'
)
WHERE name = 'Quotation Sent' AND type = 'email';
