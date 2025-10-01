-- =============================================================================
-- CLEANUP PDF TEMPLATES - REDUCE TO 2 ESSENTIAL TEMPLATES ONLY
-- =============================================================================
-- This migration removes duplicate templates and keeps only 2 essential ones

-- First, delete all existing templates
DELETE FROM pdf_templates;

-- Insert only the 2 essential templates with proper configuration
INSERT INTO pdf_templates (
  name, 
  type, 
  variant, 
  location, 
  file_path, 
  function_name, 
  description, 
  team, 
  is_default, 
  is_active,
  template_data, 
  styling
) VALUES
(
  'Quotation Template', 
  'quotation', 
  'main', 
  'server', 
  'lib/quotation-html-generator.ts', 
  'generateQuotationHtml', 
  'Main quotation template with all statuses and signatures', 
  'both', 
  true,
  true,
  '{
    "showTeamInfo": true, 
    "showLanguageToggle": true, 
    "statusConfigs": {
      "send": {
        "showSignature": false, 
        "showStatusBadge": true, 
        "statusBadgeColor": "#3B82F6", 
        "statusBadgeName": "SENT"
      }, 
      "pending": {
        "showSignature": false, 
        "showStatusBadge": true, 
        "statusBadgeColor": "#F59E0B", 
        "statusBadgeName": "PENDING"
      }, 
      "approved": {
        "showSignature": true, 
        "showStatusBadge": true, 
        "statusBadgeColor": "#10B981", 
        "statusBadgeName": "APPROVED"
      }, 
      "rejected": {
        "showSignature": true, 
        "showStatusBadge": true, 
        "statusBadgeColor": "#EF4444", 
        "statusBadgeName": "REJECTED"
      }, 
      "paid": {
        "showSignature": true, 
        "showStatusBadge": true, 
        "statusBadgeColor": "#10B981", 
        "statusBadgeName": "PAID"
      }, 
      "converted": {
        "showSignature": true, 
        "showStatusBadge": true, 
        "statusBadgeColor": "#8B5CF6", 
        "statusBadgeName": "CONVERTED"
      }
    }
  }',
  '{
    "primaryColor": "#FF2600", 
    "fontFamily": "Noto Sans Thai, Noto Sans, sans-serif", 
    "fontSize": "14px"
  }'
),
(
  'Invoice Template', 
  'invoice', 
  'main', 
  'server', 
  'lib/invoice-html-generator.ts', 
  'generateInvoiceHtml', 
  'Main invoice template with payment status and team info', 
  'both', 
  true,
  true,
  '{
    "showTeamInfo": true, 
    "showLanguageToggle": true, 
    "statusConfigs": {
      "send": {
        "showSignature": false, 
        "showStatusBadge": true, 
        "statusBadgeColor": "#3B82F6", 
        "statusBadgeName": "SENT"
      }, 
      "pending": {
        "showSignature": false, 
        "showStatusBadge": true, 
        "statusBadgeColor": "#F59E0B", 
        "statusBadgeName": "PENDING"
      }, 
      "approved": {
        "showSignature": true, 
        "showStatusBadge": true, 
        "statusBadgeColor": "#10B981", 
        "statusBadgeName": "APPROVED"
      }, 
      "rejected": {
        "showSignature": true, 
        "showStatusBadge": true, 
        "statusBadgeColor": "#EF4444", 
        "statusBadgeName": "REJECTED"
      }, 
      "paid": {
        "showSignature": true, 
        "showStatusBadge": true, 
        "statusBadgeColor": "#10B981", 
        "statusBadgeName": "PAID"
      }, 
      "converted": {
        "showSignature": true, 
        "showStatusBadge": true, 
        "statusBadgeColor": "#8B5CF6", 
        "statusBadgeName": "CONVERTED"
      }
    }
  }',
  '{
    "primaryColor": "#FF2600", 
    "fontFamily": "Noto Sans Thai, Noto Sans, sans-serif", 
    "fontSize": "14px"
  }'
);

-- Verify the cleanup
SELECT 
  id, 
  name, 
  type, 
  team, 
  location, 
  is_active, 
  is_default,
  created_at
FROM pdf_templates 
ORDER BY type, name;
