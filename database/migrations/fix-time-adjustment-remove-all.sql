-- Remove ALL time-based pricing sections from the template completely
-- This will force the template to only use the pre-generated HTML

-- First, remove the entire time-based pricing section
UPDATE notification_templates
SET html_content = REPLACE(
  html_content,
  '            <!-- Time-based Pricing Adjustment - Hidden for Charter Services -->
            <div style="{{#if service_type_charter}}display: none;{{/if}}">
            {{#if time_based_discount}}
            <div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid #e2e8f0;">
              <div style="color: #f97316; font-weight: 600; margin-bottom: 2px;">{{language == "ja" ? "時間調整" : "Time Adjustment"}} ({{time_based_discount_percentage}}%): +{{formatCurrency time_based_discount currency}}</div>
              {{#if time_based_rule_name}}<div style="color: #6b7280; font-size: 10px;">{{time_based_rule_name}}</div>{{/if}}
            </div>
            {{/if}}
            </div>',
  '            {{time_adjustment_html}}'
)
WHERE name = 'Quotation Sent' AND type = 'email';

-- Remove any other time-based pricing variations
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
  '            {{time_adjustment_html}}'
)
WHERE name = 'Quotation Sent' AND type = 'email';

-- Remove any remaining time-based pricing sections
UPDATE notification_templates
SET html_content = REPLACE(
  html_content,
  '            {{#if time_based_discount}}
            <div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid #e2e8f0;">
              <div style="color: #f97316; font-weight: 600; margin-bottom: 2px;">{{language == "ja" ? "時間調整" : "Time Adjustment"}} ({{time_based_discount_percentage}}%): +{{formatCurrency time_based_discount currency}}</div>
              {{#if time_based_rule_name}}<div style="color: #6b7280; font-size: 10px;">{{time_based_rule_name}}</div>{{/if}}
            </div>
            {{/if}}',
  '            {{time_adjustment_html}}'
)
WHERE name = 'Quotation Sent' AND type = 'email';

-- Remove any show_time_adjustment conditions
UPDATE notification_templates
SET html_content = REPLACE(
  html_content,
  '            {{#if show_time_adjustment}}
            <div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid #e2e8f0;">
              <div style="color: #f97316; font-weight: 600; margin-bottom: 2px;">{{language == "ja" ? "時間調整" : "Time Adjustment"}} ({{time_adjustment_percentage}}%): +{{formatCurrency time_adjustment_amount currency}}</div>
              {{#if time_adjustment_rule_name}}<div style="color: #6b7280; font-size: 10px;">{{time_adjustment_rule_name}}</div>{{/if}}
            </div>
            {{/if}}',
  '            {{time_adjustment_html}}'
)
WHERE name = 'Quotation Sent' AND type = 'email';

-- Remove any remaining time adjustment patterns
UPDATE notification_templates
SET html_content = REPLACE(
  html_content,
  '            <!-- Time-based Pricing Adjustment -->
            {{#if time_based_discount}}
            <div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid #e2e8f0;">
              <div style="color: #f97316; font-weight: 600; margin-bottom: 2px;">{{language == "ja" ? "時間調整" : "Time Adjustment"}} ({{time_based_discount_percentage}}%): +{{formatCurrency time_based_discount currency}}</div>
              {{#if time_based_rule_name}}<div style="color: #6b7280; font-size: 10px;">{{time_based_rule_name}}</div>{{/if}}
            </div>
            {{/if}}',
  '            {{time_adjustment_html}}'
)
WHERE name = 'Quotation Sent' AND type = 'email';
