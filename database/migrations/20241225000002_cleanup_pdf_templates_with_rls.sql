-- =============================================================================
-- CLEANUP AND RLS POLICIES FOR PDF TEMPLATES
-- =============================================================================
-- This migration cleans up the PDF templates tables and adds proper RLS policies

-- First, drop existing tables if they exist (in case of re-runs)
DROP TABLE IF EXISTS pdf_template_variables CASCADE;
DROP TABLE IF EXISTS pdf_templates CASCADE;

-- =============================================================================
-- CREATE PDF TEMPLATES TABLE WITH PROPER STRUCTURE
-- =============================================================================
CREATE TABLE pdf_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('quotation', 'invoice', 'report')),
  variant VARCHAR(100) NOT NULL DEFAULT 'default',
  location VARCHAR(20) NOT NULL CHECK (location IN ('server', 'client')),
  file_path TEXT NOT NULL,
  function_name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Template content (JSONB for flexibility)
  template_data JSONB NOT NULL DEFAULT '{}',
  
  -- Translations for different languages
  translations JSONB NOT NULL DEFAULT '{}',
  
  -- Company information for different teams
  company_info JSONB NOT NULL DEFAULT '{}',
  
  -- Styling configuration
  styling JSONB NOT NULL DEFAULT '{}',
  
  -- Layout configuration
  layout JSONB NOT NULL DEFAULT '{}',
  
  -- Template settings
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  team VARCHAR(20) CHECK (team IN ('japan', 'thailand', 'both')),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Constraints
  CONSTRAINT unique_default_per_type_team UNIQUE (type, team, is_default) DEFERRABLE INITIALLY DEFERRED
);

-- =============================================================================
-- CREATE PDF TEMPLATE VARIABLES TABLE
-- =============================================================================
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

-- =============================================================================
-- CREATE INDEXES FOR PERFORMANCE
-- =============================================================================
CREATE INDEX idx_pdf_templates_type ON pdf_templates(type);
CREATE INDEX idx_pdf_templates_team ON pdf_templates(team);
CREATE INDEX idx_pdf_templates_active ON pdf_templates(is_active);
CREATE INDEX idx_pdf_templates_location ON pdf_templates(location);
CREATE INDEX idx_pdf_templates_variant ON pdf_templates(variant);
CREATE INDEX idx_pdf_template_variables_template_id ON pdf_template_variables(template_id);
CREATE INDEX idx_pdf_template_variables_name ON pdf_template_variables(variable_name);

-- =============================================================================
-- CREATE UPDATED_AT TRIGGER
-- =============================================================================
CREATE OR REPLACE FUNCTION update_pdf_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_pdf_templates_updated_at
  BEFORE UPDATE ON pdf_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_pdf_templates_updated_at();

-- =============================================================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- =============================================================================
ALTER TABLE pdf_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdf_template_variables ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- RLS POLICIES FOR PDF_TEMPLATES TABLE
-- =============================================================================

-- Policy: Users can view all active templates
CREATE POLICY "Users can view active templates" ON pdf_templates
  FOR SELECT
  USING (is_active = true);

-- Policy: Authenticated users can view all templates (for admin purposes)
CREATE POLICY "Authenticated users can view all templates" ON pdf_templates
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Only service role can insert templates
CREATE POLICY "Service role can insert templates" ON pdf_templates
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Policy: Only service role can update templates
CREATE POLICY "Service role can update templates" ON pdf_templates
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: Only service role can delete templates
CREATE POLICY "Service role can delete templates" ON pdf_templates
  FOR DELETE
  TO service_role
  USING (true);

-- =============================================================================
-- RLS POLICIES FOR PDF_TEMPLATE_VARIABLES TABLE
-- =============================================================================

-- Policy: Users can view variables for active templates
CREATE POLICY "Users can view variables for active templates" ON pdf_template_variables
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM pdf_templates 
      WHERE pdf_templates.id = pdf_template_variables.template_id 
      AND pdf_templates.is_active = true
    )
  );

-- Policy: Authenticated users can view all variables
CREATE POLICY "Authenticated users can view all variables" ON pdf_template_variables
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Only service role can insert variables
CREATE POLICY "Service role can insert variables" ON pdf_template_variables
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Policy: Only service role can update variables
CREATE POLICY "Service role can update variables" ON pdf_template_variables
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: Only service role can delete variables
CREATE POLICY "Service role can delete variables" ON pdf_template_variables
  FOR DELETE
  TO service_role
  USING (true);

-- =============================================================================
-- INSERT DEFAULT PDF TEMPLATES
-- =============================================================================

-- Insert quotation templates
INSERT INTO pdf_templates (name, type, variant, location, file_path, function_name, description, template_data, translations, company_info, styling, layout, team, is_default) VALUES

-- Quotation Server Template
('Quotation Server Template', 'quotation', 'main', 'server', 'lib/html-pdf-generator.ts', 'generateQuotationHtml', 'Main server-side quotation template with full features', 
 '{
   "header": {
     "logo_url": "{{logo_url}}",
     "company_name": "{{company_name}}",
     "company_address": "{{company_address}}",
     "tax_id": "{{tax_id}}",
     "primary_color": "{{primary_color}}"
   },
   "body": {
     "quotation_title": "{{quotation_title}}",
     "quotation_number": "{{quotation_number}}",
     "quotation_date": "{{quotation_date}}",
     "expiry_date": "{{expiry_date}}",
     "customer_info": "{{customer_info}}",
     "service_info": "{{service_info}}",
     "price_details": "{{price_details}}",
     "terms_conditions": "{{terms_conditions}}"
   },
   "footer": {
     "contact_info": "{{contact_info}}",
     "website": "{{website}}",
     "legal_disclaimer": "{{legal_disclaimer}}"
   }
 }',
 '{
   "en": {
     "quotation": "QUOTATION",
     "quotationNumber": "Quotation #:",
     "quotationDate": "Quotation Date:",
     "expiryDate": "Expiry Date:",
     "validFor": "Valid for:",
     "days": "days",
     "customerInfo": "CUSTOMER INFO:",
     "billingAddress": "BILLING ADDRESS:",
     "serviceInfo": "SERVICE INFO:",
     "serviceType": "Service Type:",
     "vehicleType": "Vehicle Type:",
     "pickupDate": "Pickup Date:",
     "pickupTime": "Pickup Time:",
     "duration": "Duration:",
     "hours": "hours",
     "priceDetails": "PRICE DETAILS:",
     "description": "Description",
     "price": "Price",
     "subtotal": "Subtotal",
     "discount": "Discount",
     "tax": "Tax",
     "total": "Total Amount",
     "termsAndConditions": "Terms and Conditions",
     "thanksMessage": "Thank you for considering our services!",
     "contactMessage": "If you have any questions about this quotation, please contact us at {{contact_email}}"
   },
   "ja": {
     "quotation": "見積書",
     "quotationNumber": "見積書番号:",
     "quotationDate": "見積書発行日:",
     "expiryDate": "有効期限:",
     "validFor": "有効期間:",
     "days": "日",
     "customerInfo": "お客様情報:",
     "billingAddress": "請求先住所:",
     "serviceInfo": "サービス情報:",
     "serviceType": "サービス種別:",
     "vehicleType": "車両タイプ:",
     "pickupDate": "お迎え日:",
     "pickupTime": "お迎え時間:",
     "duration": "所要時間:",
     "hours": "時間",
     "priceDetails": "料金詳細:",
     "description": "内容",
     "price": "価格",
     "subtotal": "小計",
     "discount": "割引",
     "tax": "税金",
     "total": "合計",
     "termsAndConditions": "利用規約",
     "thanksMessage": "弊社サービスをご検討いただき、ありがとうございます！",
     "contactMessage": "この見積書についてご質問がございましたら、{{contact_email}}までお問い合わせください。"
   }
 }',
 '{
   "japan": {
     "name": "Driver Japan",
     "address": "1-2-3 Shibuya, Tokyo, Japan 150-0002",
     "taxId": "Tax ID: 123456789",
     "email": "info@japandriver.com",
     "website": "https://japandriver.com"
   },
   "thailand": {
     "name": "Driver (Thailand) Company Limited",
     "address": "580/17 Soi Ramkhamhaeng 39, Wang Thong Lang, Bangkok 10310, Thailand",
     "taxId": "Tax ID: 0105566135845",
     "email": "info@driverthailand.com",
     "website": "https://japandriver.com"
   }
 }',
 '{
   "primaryColor": "#FF2800",
   "fontFamily": "Noto Sans Thai, Noto Sans, sans-serif",
   "fontSize": "14px",
   "lineHeight": "1.6"
 }',
 '{
   "showLabels": true,
   "showSignature": true,
   "showTerms": true,
   "showFooter": true
 }',
 'both', true),

-- Quotation Client Template
('Quotation Client Template', 'quotation', 'simple', 'client', 'components/quotations/quotation-pdf-button.tsx', 'generateClientQuotationHtml', 'Client-side quotation template for quick generation',
 '{
   "header": {
     "logo_url": "{{logo_url}}",
     "company_name": "{{company_name}}",
     "company_address": "{{company_address}}",
     "tax_id": "{{tax_id}}",
     "primary_color": "{{primary_color}}"
   },
   "body": {
     "quotation_title": "{{quotation_title}}",
     "quotation_number": "{{quotation_number}}",
     "quotation_date": "{{quotation_date}}",
     "customer_info": "{{customer_info}}",
     "service_info": "{{service_info}}",
     "price_details": "{{price_details}}"
   },
   "footer": {
     "contact_info": "{{contact_info}}",
     "website": "{{website}}"
   }
 }',
 '{
   "en": {
     "quotation": "QUOTATION",
     "quotationNumber": "Quotation #:",
     "quotationDate": "Quotation Date:",
     "total": "TOTAL:",
     "companyName": "Driver (Thailand) Company Limited",
     "thanksMessage": "Thank you for considering our services!",
     "contactMessage": "If you have any questions about this quotation, please contact us at info@japandriver.com"
   },
   "ja": {
     "quotation": "見積書",
     "quotationNumber": "見積書番号:",
     "quotationDate": "見積書発行日:",
     "total": "合計:",
     "companyName": "Driver (Thailand) Company Limited",
     "thanksMessage": "弊社サービスをご検討いただき、ありがとうございます！",
     "contactMessage": "この見積書についてご質問がございましたら、info@japandriver.comまでお問い合わせください。"
   }
 }',
 '{
   "japan": {
     "name": "Driver Japan",
     "address": "1-2-3 Shibuya, Tokyo, Japan 150-0002",
     "taxId": "Tax ID: 123456789",
     "email": "info@japandriver.com",
     "website": "https://japandriver.com"
   },
   "thailand": {
     "name": "Driver (Thailand) Company Limited",
     "address": "580/17 Soi Ramkhamhaeng 39, Wang Thong Lang, Bangkok 10310, Thailand",
     "taxId": "Tax ID: 0105566135845",
     "email": "info@driverthailand.com",
     "website": "https://japandriver.com"
   }
 }',
 '{
   "primaryColor": "#FF2800",
   "fontFamily": "Noto Sans Thai, Noto Sans, sans-serif",
   "fontSize": "14px",
   "lineHeight": "1.6"
 }',
 '{
   "showLabels": false,
   "showSignature": false,
   "showTerms": false,
   "showFooter": true
 }',
 'both', false),

-- Invoice HTML Template
('Invoice HTML Template', 'invoice', 'html', 'client', 'components/quotations/quotation-invoice-button.tsx', 'generateInvoice', 'HTML-based invoice template with dynamic content',
 '{
   "header": {
     "logo_url": "{{logo_url}}",
     "company_name": "{{company_name}}",
     "company_address": "{{company_address}}",
     "tax_id": "{{tax_id}}",
     "primary_color": "{{primary_color}}"
   },
   "body": {
     "invoice_title": "{{invoice_title}}",
     "invoice_number": "{{invoice_number}}",
     "invoice_date": "{{invoice_date}}",
     "due_date": "{{due_date}}",
     "booking_ref": "{{booking_ref}}",
     "customer_info": "{{customer_info}}",
     "service_details": "{{service_details}}",
     "price_details": "{{price_details}}"
   },
   "footer": {
     "contact_info": "{{contact_info}}",
     "website": "{{website}}",
     "legal_disclaimer": "{{legal_disclaimer}}"
   }
 }',
 '{
   "en": {
     "invoice": "INVOICE",
     "invoiceNumber": "Invoice #:",
     "invoiceDate": "Invoice Date:",
     "dueDate": "Due Date:",
     "bookingRef": "Booking Ref:",
     "billTo": "BILL TO:",
     "serviceDetails": "SERVICE DETAILS:",
     "serviceDescription": "Service Description",
     "date": "Date",
     "quantity": "Quantity",
     "price": "Price",
     "subtotal": "Subtotal:",
     "total": "TOTAL:",
     "thanksMessage": "Thank you for your business!",
     "contactMessage": "If you have any questions about this invoice, please contact us at {{contact_email}}"
   },
   "ja": {
     "invoice": "請求書",
     "invoiceNumber": "請求書番号:",
     "invoiceDate": "請求書発行日:",
     "dueDate": "支払期限:",
     "bookingRef": "予約番号:",
     "billTo": "請求先:",
     "serviceDetails": "サービス詳細:",
     "serviceDescription": "サービス内容",
     "date": "日付",
     "quantity": "数量",
     "price": "価格",
     "subtotal": "小計:",
     "total": "合計:",
     "thanksMessage": "ご利用いただき、ありがとうございます！",
     "contactMessage": "この請求書についてご質問がございましたら、{{contact_email}}までお問い合わせください。"
   }
 }',
 '{
   "japan": {
     "name": "Driver Japan",
     "address": "1-2-3 Shibuya, Tokyo, Japan 150-0002",
     "taxId": "Tax ID: 123456789",
     "email": "info@japandriver.com",
     "website": "https://japandriver.com"
   },
   "thailand": {
     "name": "Driver (Thailand) Company Limited",
     "address": "580/17 Soi Ramkhamhaeng 39, Wang Thong Lang, Bangkok 10310, Thailand",
     "taxId": "Tax ID: 0105566135845",
     "email": "info@driverthailand.com",
     "website": "https://japandriver.com"
   }
 }',
 '{
   "primaryColor": "#FF2800",
   "fontFamily": "Noto Sans Thai, Noto Sans, sans-serif",
   "fontSize": "14px",
   "lineHeight": "1.6"
 }',
 '{
   "showLabels": true,
   "showSignature": false,
   "showTerms": false,
   "showFooter": true
 }',
 'both', true),

-- Invoice PDF-lib Template
('Invoice PDF-lib Template', 'invoice', 'programmatic', 'server', 'lib/pdf/generate-invoice-pdf.ts', 'generateInvoicePDF', 'PDF-lib based invoice template for server generation',
 '{
   "header": {
     "logo_url": "{{logo_url}}",
     "company_name": "{{company_name}}",
     "company_address": "{{company_address}}",
     "tax_id": "{{tax_id}}",
     "primary_color": "{{primary_color}}"
   },
   "body": {
     "invoice_title": "{{invoice_title}}",
     "invoice_number": "{{invoice_number}}",
     "invoice_date": "{{invoice_date}}",
     "due_date": "{{due_date}}",
     "booking_ref": "{{booking_ref}}",
     "customer_info": "{{customer_info}}",
     "service_details": "{{service_details}}",
     "price_details": "{{price_details}}"
   },
   "footer": {
     "contact_info": "{{contact_info}}",
     "website": "{{website}}",
     "legal_disclaimer": "{{legal_disclaimer}}"
   }
 }',
 '{
   "en": {
     "invoice": "INVOICE",
     "invoiceNumber": "Invoice #:",
     "invoiceDate": "Invoice Date:",
     "dueDate": "Due Date:",
     "bookingRef": "Booking Ref:",
     "billTo": "BILL TO:",
     "serviceDetails": "SERVICE DETAILS:",
     "serviceDescription": "Service Description",
     "date": "Date",
     "quantity": "Quantity",
     "price": "Price",
     "subtotal": "Subtotal:",
     "total": "TOTAL:",
     "thanksMessage": "Thank you for your business!",
     "contactMessage": "If you have any questions about this invoice, please contact us at {{contact_email}}"
   },
   "ja": {
     "invoice": "請求書",
     "invoiceNumber": "請求書番号:",
     "invoiceDate": "請求書発行日:",
     "dueDate": "支払期限:",
     "bookingRef": "予約番号:",
     "billTo": "請求先:",
     "serviceDetails": "サービス詳細:",
     "serviceDescription": "サービス内容",
     "date": "日付",
     "quantity": "数量",
     "price": "価格",
     "subtotal": "小計:",
     "total": "合計:",
     "thanksMessage": "ご利用いただき、ありがとうございます！",
     "contactMessage": "この請求書についてご質問がございましたら、{{contact_email}}までお問い合わせください。"
   }
 }',
 '{
   "japan": {
     "name": "Driver Japan",
     "address": "1-2-3 Shibuya, Tokyo, Japan 150-0002",
     "taxId": "Tax ID: 123456789",
     "email": "info@japandriver.com",
     "website": "https://japandriver.com"
   },
   "thailand": {
     "name": "Driver (Thailand) Company Limited",
     "address": "580/17 Soi Ramkhamhaeng 39, Wang Thong Lang, Bangkok 10310, Thailand",
     "taxId": "Tax ID: 0105566135845",
     "email": "info@driverthailand.com",
     "website": "https://japandriver.com"
   }
 }',
 '{
   "primaryColor": "#FF2800",
   "fontFamily": "Noto Sans Thai, Noto Sans, sans-serif",
   "fontSize": "14px",
   "lineHeight": "1.6"
 }',
 '{
   "showLabels": true,
   "showSignature": false,
   "showTerms": false,
   "showFooter": true
 }',
 'japan', false);

-- =============================================================================
-- INSERT COMMON TEMPLATE VARIABLES
-- =============================================================================

-- Insert common variables for quotation templates
INSERT INTO pdf_template_variables (template_id, variable_name, variable_type, default_value, description, is_required)
SELECT 
  t.id,
  var_name,
  var_type,
  var_default,
  var_desc,
  var_required
FROM pdf_templates t
CROSS JOIN (VALUES
  ('quotation_id', 'text', '', 'Quotation ID', true),
  ('customer_name', 'text', '', 'Customer name', true),
  ('customer_email', 'text', '', 'Customer email', true),
  ('service_type', 'text', '', 'Type of service', true),
  ('vehicle_type', 'text', '', 'Vehicle type', true),
  ('pickup_location', 'text', '', 'Pickup location', true),
  ('dropoff_location', 'text', '', 'Dropoff location', true),
  ('pickup_date', 'date', '', 'Pickup date', true),
  ('pickup_time', 'text', '', 'Pickup time', true),
  ('duration_hours', 'number', '0', 'Duration in hours', true),
  ('total_amount', 'currency', '0', 'Total amount', true),
  ('currency', 'text', 'JPY', 'Currency code', true),
  ('primary_color', 'text', '#FF2800', 'Primary brand color', false),
  ('logo_url', 'text', '', 'Company logo URL', false),
  ('company_name', 'text', '', 'Company name', true),
  ('company_address', 'text', '', 'Company address', true),
  ('tax_id', 'text', '', 'Tax ID', true),
  ('contact_email', 'text', '', 'Contact email', true)
) AS vars(var_name, var_type, var_default, var_desc, var_required)
WHERE t.type = 'quotation';

-- Insert common variables for invoice templates
INSERT INTO pdf_template_variables (template_id, variable_name, variable_type, default_value, description, is_required)
SELECT 
  t.id,
  var_name,
  var_type,
  var_default,
  var_desc,
  var_required
FROM pdf_templates t
CROSS JOIN (VALUES
  ('invoice_id', 'text', '', 'Invoice ID', true),
  ('quotation_id', 'text', '', 'Related quotation ID', false),
  ('customer_name', 'text', '', 'Customer name', true),
  ('customer_email', 'text', '', 'Customer email', true),
  ('booking_ref', 'text', '', 'Booking reference', true),
  ('service_description', 'text', '', 'Service description', true),
  ('total_amount', 'currency', '0', 'Total amount', true),
  ('currency', 'text', 'JPY', 'Currency code', true),
  ('due_date', 'date', '', 'Payment due date', true),
  ('primary_color', 'text', '#FF2800', 'Primary brand color', false),
  ('logo_url', 'text', '', 'Company logo URL', false),
  ('company_name', 'text', '', 'Company name', true),
  ('company_address', 'text', '', 'Company address', true),
  ('tax_id', 'text', '', 'Tax ID', true),
  ('contact_email', 'text', '', 'Contact email', true)
) AS vars(var_name, var_type, var_default, var_desc, var_required)
WHERE t.type = 'invoice';

-- =============================================================================
-- CREATE HELPER FUNCTIONS FOR TEMPLATE MANAGEMENT
-- =============================================================================

-- Function to get active templates by type and team
CREATE OR REPLACE FUNCTION get_active_templates(
  template_type VARCHAR DEFAULT NULL,
  template_team VARCHAR DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  name VARCHAR,
  type VARCHAR,
  variant VARCHAR,
  location VARCHAR,
  file_path TEXT,
  function_name VARCHAR,
  description TEXT,
  template_data JSONB,
  translations JSONB,
  company_info JSONB,
  styling JSONB,
  layout JSONB,
  team VARCHAR,
  is_default BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT 
    t.id,
    t.name,
    t.type,
    t.variant,
    t.location,
    t.file_path,
    t.function_name,
    t.description,
    t.template_data,
    t.translations,
    t.company_info,
    t.styling,
    t.layout,
    t.team,
    t.is_default,
    t.created_at,
    t.updated_at
  FROM pdf_templates t
  WHERE t.is_active = true
    AND (template_type IS NULL OR t.type = template_type)
    AND (template_team IS NULL OR t.team = template_team OR t.team = 'both')
  ORDER BY t.is_default DESC, t.created_at DESC;
$$;

-- Function to get template variables
CREATE OR REPLACE FUNCTION get_template_variables(template_uuid UUID)
RETURNS TABLE (
  id UUID,
  variable_name VARCHAR,
  variable_type VARCHAR,
  default_value TEXT,
  description TEXT,
  is_required BOOLEAN,
  validation_rules JSONB
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT 
    v.id,
    v.variable_name,
    v.variable_type,
    v.default_value,
    v.description,
    v.is_required,
    v.validation_rules
  FROM pdf_template_variables v
  WHERE v.template_id = template_uuid
  ORDER BY v.variable_name;
$$;

-- =============================================================================
-- GRANT PERMISSIONS
-- =============================================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

-- Grant permissions on tables
GRANT SELECT ON pdf_templates TO authenticated;
GRANT SELECT ON pdf_template_variables TO authenticated;
GRANT ALL ON pdf_templates TO service_role;
GRANT ALL ON pdf_template_variables TO service_role;

-- Grant permissions on functions
GRANT EXECUTE ON FUNCTION get_active_templates TO authenticated;
GRANT EXECUTE ON FUNCTION get_template_variables TO authenticated;
GRANT EXECUTE ON FUNCTION get_active_templates TO service_role;
GRANT EXECUTE ON FUNCTION get_template_variables TO service_role;

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Verify tables were created
SELECT 
  table_name, 
  table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('pdf_templates', 'pdf_template_variables')
ORDER BY table_name;

-- Verify RLS is enabled
SELECT 
  schemaname, 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('pdf_templates', 'pdf_template_variables')
ORDER BY tablename;

-- Verify policies were created
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual 
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('pdf_templates', 'pdf_template_variables')
ORDER BY tablename, policyname;

-- Verify data was inserted
SELECT 
  name, 
  type, 
  variant, 
  location, 
  team, 
  is_active, 
  is_default 
FROM pdf_templates 
ORDER BY type, variant;

-- Verify variables were inserted
SELECT 
  t.name as template_name,
  v.variable_name,
  v.variable_type,
  v.is_required
FROM pdf_template_variables v
JOIN pdf_templates t ON v.template_id = t.id
ORDER BY t.name, v.variable_name;
