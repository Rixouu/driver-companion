-- Replace the "null" text with empty string for Charter Services

UPDATE notification_templates
SET html_content = REPLACE(
  html_content,
  '{{#if time_based_rule_name}}<div style="color: #6b7280; font-size: 10px;">{{time_based_rule_name}}</div>{{/if}}',
  '{{#if service_type_charter}}{{else}}{{#if time_based_rule_name}}<div style="color: #6b7280; font-size: 10px;">{{time_based_rule_name}}</div>{{/if}}{{/if}}'
)
WHERE name = 'Quotation Sent' AND type = 'email';
