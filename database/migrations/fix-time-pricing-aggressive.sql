-- AGGRESSIVE FIX: Remove ALL time-based pricing blocks and replace with simple condition
-- This will completely eliminate the time adjustment display for Charter Services

UPDATE notification_templates
SET html_content = REGEXP_REPLACE(
  html_content,
  '<!-- Time-based Pricing Adjustment.*?{{/if}}',
  '<!-- Time-based Pricing Adjustment - Only for Airport Transfer -->
            {{#if show_time_adjustment == "yes"}}
            <div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid #e2e8f0;">
              <div style="color: #f97316; font-weight: 600; margin-bottom: 2px;">{{language == "ja" ? "時間調整" : "Time Adjustment"}} ({{time_based_discount_percentage}}%): +{{formatCurrency time_based_discount currency}}</div>
              {{#if time_based_rule_name}}<div style="color: #6b7280; font-size: 10px;">{{time_based_rule_name}}</div>{{/if}}
            </div>
            {{/if}}',
  'g'
)
WHERE name = 'Quotation Sent' AND type = 'email';
