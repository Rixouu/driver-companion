-- Restore the template to a working state by reverting all time-based pricing changes
-- This will restore the original template structure

UPDATE notification_templates
SET html_content = REPLACE(
  html_content,
  '            {{time_adjustment_html}}',
  '            <!-- Time-based Pricing Adjustment - Only for Airport Transfer -->
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

-- Fix any broken template syntax
UPDATE notification_templates
SET html_content = REPLACE(
  html_content,
  '{{#if subtitle}}',
  ''
)
WHERE name = 'Quotation Sent' AND type = 'email';

UPDATE notification_templates
SET html_content = REPLACE(
  html_content,
  '{{/if}}',
  ''
)
WHERE name = 'Quotation Sent' AND type = 'email';
