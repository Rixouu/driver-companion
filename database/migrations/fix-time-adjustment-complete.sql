-- Fix the time adjustment condition and the null display issue
UPDATE notification_templates 
SET html_content = REPLACE(
  html_content,
  '{{#if time_based_discount}}',
  '{{#if time_based_discount > 0}}'
)
WHERE name = 'Quotation Sent' AND is_active = true;

-- Also fix the null display by wrapping time_based_rule_name in a conditional
UPDATE notification_templates 
SET html_content = REPLACE(
  html_content,
  '<div style="color: #6b7280; font-size: 10px;">{{time_based_rule_name}}</div>',
  '{{#if time_based_rule_name}}<div style="color: #6b7280; font-size: 10px;">{{time_based_rule_name}}</div>{{/if}}'
)
WHERE name = 'Quotation Sent' AND is_active = true;
