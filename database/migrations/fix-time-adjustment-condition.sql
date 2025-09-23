-- Fix the time adjustment condition to use time_based_discount instead of time_based_rule_name
UPDATE notification_templates 
SET html_content = REPLACE(
  html_content,
  '{{#if time_based_rule_name}}',
  '{{#if time_based_discount}}'
)
WHERE name = 'Quotation Sent' AND is_active = true;
