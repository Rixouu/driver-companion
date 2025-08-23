-- Create quotation_magic_links table for secure quote access
CREATE TABLE IF NOT EXISTS quotation_magic_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  customer_email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_quotation_magic_links_token ON quotation_magic_links(token);
CREATE INDEX IF NOT EXISTS idx_quotation_magic_links_quotation_id ON quotation_magic_links(quotation_id);
CREATE INDEX IF NOT EXISTS idx_quotation_magic_links_customer_email ON quotation_magic_links(customer_email);
CREATE INDEX IF NOT EXISTS idx_quotation_magic_links_expires_at ON quotation_magic_links(expires_at);

-- Add columns to quotations table for magic link tracking
ALTER TABLE quotations 
ADD COLUMN IF NOT EXISTS magic_link_generated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS magic_link_expires_at TIMESTAMP WITH TIME ZONE;

-- Add RLS policies for security
ALTER TABLE quotation_magic_links ENABLE ROW LEVEL SECURITY;

-- Policy: Only service role can access magic links (for API operations)
CREATE POLICY "Service role can manage magic links" ON quotation_magic_links
  FOR ALL USING (auth.role() = 'service_role');

-- Function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_quotation_magic_links_updated_at 
  BEFORE UPDATE ON quotation_magic_links 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comment
COMMENT ON TABLE quotation_magic_links IS 'Stores magic link tokens for secure quote access without authentication';
COMMENT ON COLUMN quotation_magic_links.token IS 'Unique token for magic link access';
COMMENT ON COLUMN quotation_magic_links.expires_at IS 'When the magic link expires';
COMMENT ON COLUMN quotation_magic_links.is_used IS 'Whether the magic link has been used';
COMMENT ON COLUMN quotation_magic_links.used_at IS 'When the magic link was used';
