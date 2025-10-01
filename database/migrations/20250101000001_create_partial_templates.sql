-- Create partial_templates table for managing header and footer templates
CREATE TABLE IF NOT EXISTS partial_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('header', 'footer')),
  document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('quotation', 'invoice')),
  team VARCHAR(50) NOT NULL CHECK (team IN ('japan', 'thailand', 'both')),
  content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  variables TEXT[] DEFAULT '{}',
  last_modified TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_partial_templates_type ON partial_templates(type);
CREATE INDEX IF NOT EXISTS idx_partial_templates_document_type ON partial_templates(document_type);
CREATE INDEX IF NOT EXISTS idx_partial_templates_team ON partial_templates(team);
CREATE INDEX IF NOT EXISTS idx_partial_templates_is_active ON partial_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_partial_templates_last_modified ON partial_templates(last_modified);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_partial_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.last_modified = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_partial_templates_updated_at
  BEFORE UPDATE ON partial_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_partial_templates_updated_at();

-- Insert some sample data
INSERT INTO partial_templates (name, type, document_type, team, content, variables) VALUES
(
  'Japan Quotation Header',
  'header',
  'quotation',
  'japan',
  '<div class="header">
    <div class="logo-section">
      <img src="{{logo_url}}" alt="Company Logo" class="logo">
      <h1>{{company_name}}</h1>
    </div>
    <div class="company-info">
      <p>{{company_address}}</p>
      <p>Tel: {{company_phone}} | Email: {{company_email}}</p>
    </div>
  </div>',
  ARRAY['{{company_name}}', '{{logo_url}}', '{{company_address}}', '{{company_phone}}', '{{company_email}}']
),
(
  'Thailand Invoice Footer',
  'footer',
  'invoice',
  'thailand',
  '<div class="footer">
    <div class="signature-section">
      <p>Authorized Signature:</p>
      <div class="signature-line"></div>
    </div>
    <div class="terms">
      <p>Payment Terms: {{payment_terms}}</p>
      <p>Thank you for your business!</p>
    </div>
  </div>',
  ARRAY['{{payment_terms}}']
),
(
  'Universal Header',
  'header',
  'quotation',
  'both',
  '<div class="header">
    <div class="logo-section">
      <img src="{{logo_url}}" alt="Company Logo" class="logo">
      <h1>{{company_name}}</h1>
    </div>
    <div class="company-info">
      <p>{{company_address}}</p>
      <p>Tel: {{company_phone}} | Email: {{company_email}}</p>
      <p>Team: {{team}}</p>
    </div>
  </div>',
  ARRAY['{{company_name}}', '{{logo_url}}', '{{company_address}}', '{{company_phone}}', '{{company_email}}', '{{team}}']
);
