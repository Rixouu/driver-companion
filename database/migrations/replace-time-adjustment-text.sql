-- Replace the problematic time adjustment text with a simple message
-- This will show "No Time-based Adjustment for this booking" for Charter Services

UPDATE notification_templates
SET html_content = REPLACE(
  html_content,
  '{{language == "ja" ? "時間調整" : "Time Adjustment"}} ({{time_based_discount_percentage}}%): +{{formatCurrency time_based_discount currency}}',
  '{{#if service_type_charter}}{{language == "ja" ? "この予約には時間調整はありません" : "No Time-based Adjustment for this booking"}}{{else}}{{language == "ja" ? "時間調整" : "Time Adjustment"}} ({{time_based_discount_percentage}}%): +{{formatCurrency time_based_discount currency}}{{/if}}'
)
WHERE name = 'Quotation Sent' AND type = 'email';
