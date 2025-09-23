-- Remove debug code only
-- This will clean up the template by removing all debug information

UPDATE notification_templates
SET html_content = REPLACE(
  html_content,
  '            <!-- DEBUG: Service Type and Time-based Data -->
            <div style="background: #f0f0f0; padding: 8px; margin: 4px 0; font-size: 10px; border: 1px solid #ccc;">
              <div>DEBUG - service_type_airport: {{service_type_airport}}</div>
              <div>DEBUG - service_type_charter: {{service_type_charter}}</div>
              <div>DEBUG - time_based_discount: {{time_based_discount}}</div>
              <div>DEBUG - time_based_adjustment: {{time_based_adjustment}}</div>
              <div>DEBUG - service_type_name: {{service_type_name}}</div>
            </div>
            ',
  ''
)
WHERE name = 'Quotation Sent' AND type = 'email';
