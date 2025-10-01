-- =============================================================================
-- SIMPLE PDF TEMPLATES SETUP FOR SUPABASE
-- =============================================================================
-- Run this in your Supabase SQL Editor

-- Drop existing tables if they exist
DROP TABLE IF EXISTS pdf_template_variables CASCADE;
DROP TABLE IF EXISTS pdf_templates CASCADE;

-- Create PDF templates table
CREATE TABLE pdf_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('quotation', 'invoice', 'report')),
  variant VARCHAR(100) NOT NULL DEFAULT 'default',
  location VARCHAR(20) NOT NULL CHECK (location IN ('server', 'client')),
  file_path TEXT NOT NULL,
  function_name VARCHAR(255) NOT NULL,
  description TEXT,
  template_data JSONB NOT NULL DEFAULT '{}',
  translations JSONB NOT NULL DEFAULT '{}',
  company_info JSONB NOT NULL DEFAULT '{}',
  styling JSONB NOT NULL DEFAULT '{}',
  layout JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  team VARCHAR(20) CHECK (team IN ('japan', 'thailand', 'both')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create PDF template variables table
CREATE TABLE pdf_template_variables (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID REFERENCES pdf_templates(id) ON DELETE CASCADE,
  variable_name VARCHAR(100) NOT NULL,
  variable_type VARCHAR(50) NOT NULL CHECK (variable_type IN ('text', 'number', 'currency', 'date', 'boolean', 'array', 'object')),
  default_value TEXT,
  description TEXT,
  is_required BOOLEAN DEFAULT false,
  validation_rules JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(template_id, variable_name)
);

-- Create indexes
CREATE INDEX idx_pdf_templates_type ON pdf_templates(type);
CREATE INDEX idx_pdf_templates_team ON pdf_templates(team);
CREATE INDEX idx_pdf_templates_active ON pdf_templates(is_active);
CREATE INDEX idx_pdf_template_variables_template_id ON pdf_template_variables(template_id);

-- Enable RLS
ALTER TABLE pdf_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdf_template_variables ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view active templates" ON pdf_templates
  FOR SELECT USING (is_active = true);

CREATE POLICY "Authenticated users can view all templates" ON pdf_templates
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Service role can manage templates" ON pdf_templates
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Users can view variables for active templates" ON pdf_template_variables
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM pdf_templates 
      WHERE pdf_templates.id = pdf_template_variables.template_id 
      AND pdf_templates.is_active = true
    )
  );

CREATE POLICY "Authenticated users can view all variables" ON pdf_template_variables
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Service role can manage variables" ON pdf_template_variables
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Insert essential templates only
INSERT INTO pdf_templates (name, type, variant, location, file_path, function_name, description, team, is_default, template_data, styling) VALUES
('Quotation Template', 'quotation', 'main', 'server', 'lib/html-pdf-generator.ts', 'generateQuotationHtml', 'Main quotation template with all statuses and signatures', 'both', true, 
 '{"showTeamInfo": true, "showLanguageToggle": true, "statusConfigs": {"send": {"showSignature": false, "showStatusBadge": true, "statusBadgeColor": "#3B82F6", "statusBadgeName": "SENT"}, "pending": {"showSignature": false, "showStatusBadge": true, "statusBadgeColor": "#F59E0B", "statusBadgeName": "PENDING"}, "approved": {"showSignature": true, "showStatusBadge": true, "statusBadgeColor": "#10B981", "statusBadgeName": "APPROVED"}, "rejected": {"showSignature": true, "showStatusBadge": true, "statusBadgeColor": "#EF4444", "statusBadgeName": "REJECTED"}, "paid": {"showSignature": true, "showStatusBadge": true, "statusBadgeColor": "#10B981", "statusBadgeName": "PAID"}, "converted": {"showSignature": true, "showStatusBadge": true, "statusBadgeColor": "#8B5CF6", "statusBadgeName": "CONVERTED"}}}',
 '{"primaryColor": "#FF2600", "fontFamily": "Noto Sans Thai, Noto Sans, sans-serif", "fontSize": "14px"}'),
('Invoice Template', 'invoice', 'main', 'server', 'app/api/quotations/generate-invoice-pdf/route.ts', 'generateInvoiceHtml', 'Main invoice template with payment status and team info', 'both', true,
 '{"showTeamInfo": true, "showLanguageToggle": true, "statusConfigs": {"send": {"showSignature": false, "showStatusBadge": true, "statusBadgeColor": "#3B82F6", "statusBadgeName": "SENT"}, "pending": {"showSignature": false, "showStatusBadge": true, "statusBadgeColor": "#F59E0B", "statusBadgeName": "PENDING"}, "approved": {"showSignature": true, "showStatusBadge": true, "statusBadgeColor": "#10B981", "statusBadgeName": "APPROVED"}, "rejected": {"showSignature": true, "showStatusBadge": true, "statusBadgeColor": "#EF4444", "statusBadgeName": "REJECTED"}, "paid": {"showSignature": true, "showStatusBadge": true, "statusBadgeColor": "#10B981", "statusBadgeName": "PAID"}, "converted": {"showSignature": true, "showStatusBadge": true, "statusBadgeColor": "#8B5CF6", "statusBadgeName": "CONVERTED"}}}',
 '{"primaryColor": "#FF2600", "fontFamily": "Noto Sans Thai, Noto Sans, sans-serif", "fontSize": "14px"}');

-- Grant permissions
GRANT SELECT ON pdf_templates TO authenticated;
GRANT SELECT ON pdf_template_variables TO authenticated;
GRANT ALL ON pdf_templates TO service_role;
GRANT ALL ON pdf_template_variables TO service_role;
