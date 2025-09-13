-- =============================================================================
-- ADVANCED NOTIFICATIONS & BRANDING SYSTEM
-- =============================================================================
-- This migration creates tables for advanced notification management and branding

-- =============================================================================
-- STEP 1: NOTIFICATION TEMPLATES
-- =============================================================================

-- Email templates for different notification types
CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL, -- 'email', 'push', 'sms'
  category VARCHAR(100) NOT NULL, -- 'booking', 'quotation', 'maintenance', 'system'
  subject VARCHAR(500),
  html_content TEXT,
  text_content TEXT,
  variables JSONB DEFAULT '{}', -- Available template variables
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES user_profiles(id),
  UNIQUE(name, type, category)
);

-- Notification preferences for users
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  notification_type VARCHAR(100) NOT NULL, -- 'email', 'push', 'sms'
  category VARCHAR(100) NOT NULL, -- 'booking', 'quotation', 'maintenance', 'system'
  is_enabled BOOLEAN DEFAULT true,
  frequency VARCHAR(50) DEFAULT 'immediate', -- 'immediate', 'daily', 'weekly', 'never'
  quiet_hours_start TIME DEFAULT '22:00',
  quiet_hours_end TIME DEFAULT '08:00',
  timezone VARCHAR(50) DEFAULT 'UTC',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, notification_type, category)
);

-- Notification schedules for automated reports
CREATE TABLE IF NOT EXISTS notification_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  notification_type VARCHAR(100) NOT NULL,
  template_id UUID REFERENCES notification_templates(id),
  schedule_cron VARCHAR(100) NOT NULL, -- Cron expression
  recipients JSONB NOT NULL, -- Array of user IDs or email addresses
  is_active BOOLEAN DEFAULT true,
  last_sent_at TIMESTAMP WITH TIME ZONE,
  next_send_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES user_profiles(id)
);

-- =============================================================================
-- STEP 2: BRANDING & WHITE-LABELING
-- =============================================================================

-- Company branding settings
CREATE TABLE IF NOT EXISTS company_branding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name VARCHAR(255) NOT NULL,
  logo_url TEXT,
  logo_dark_url TEXT, -- For dark mode
  favicon_url TEXT,
  primary_color VARCHAR(7) DEFAULT '#3b82f6', -- Hex color
  secondary_color VARCHAR(7) DEFAULT '#64748b',
  accent_color VARCHAR(7) DEFAULT '#f59e0b',
  background_color VARCHAR(7) DEFAULT '#ffffff',
  text_color VARCHAR(7) DEFAULT '#1f2937',
  font_family VARCHAR(100) DEFAULT 'Inter',
  font_size_base INTEGER DEFAULT 16,
  border_radius VARCHAR(10) DEFAULT '8px',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email branding settings
CREATE TABLE IF NOT EXISTS email_branding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  header_html TEXT,
  footer_html TEXT,
  email_signature TEXT,
  social_links JSONB DEFAULT '{}', -- Social media links
  contact_info JSONB DEFAULT '{}', -- Contact information
  unsubscribe_text TEXT DEFAULT 'Unsubscribe from these emails',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PDF/document branding
CREATE TABLE IF NOT EXISTS document_branding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  header_html TEXT,
  footer_html TEXT,
  watermark_text VARCHAR(255),
  watermark_opacity DECIMAL(3,2) DEFAULT 0.1,
  page_margins JSONB DEFAULT '{"top": "20mm", "right": "15mm", "bottom": "20mm", "left": "15mm"}',
  font_family VARCHAR(100) DEFAULT 'Arial',
  font_size INTEGER DEFAULT 12,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Client portal customization
CREATE TABLE IF NOT EXISTS client_portal_branding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  welcome_message TEXT,
  custom_css TEXT,
  custom_js TEXT,
  footer_text TEXT,
  terms_of_service_url TEXT,
  privacy_policy_url TEXT,
  support_email VARCHAR(255),
  support_phone VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- STEP 3: NOTIFICATION LOGS & TRACKING
-- =============================================================================

-- Notification delivery logs
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id),
  template_id UUID REFERENCES notification_templates(id),
  notification_type VARCHAR(100) NOT NULL,
  recipient VARCHAR(255) NOT NULL, -- Email, phone, or user ID
  subject VARCHAR(500),
  status VARCHAR(50) NOT NULL, -- 'pending', 'sent', 'delivered', 'failed', 'bounced'
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- STEP 4: INDEXES FOR PERFORMANCE
-- =============================================================================

-- Notification templates indexes
CREATE INDEX IF NOT EXISTS idx_notification_templates_type_category ON notification_templates(type, category);
CREATE INDEX IF NOT EXISTS idx_notification_templates_active ON notification_templates(is_active) WHERE is_active = true;

-- Notification preferences indexes
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user ON notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_type_category ON notification_preferences(notification_type, category);

-- Notification schedules indexes
CREATE INDEX IF NOT EXISTS idx_notification_schedules_active ON notification_schedules(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_notification_schedules_next_send ON notification_schedules(next_send_at) WHERE is_active = true;

-- Notification logs indexes
CREATE INDEX IF NOT EXISTS idx_notification_logs_user ON notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON notification_logs(status);
CREATE INDEX IF NOT EXISTS idx_notification_logs_created_at ON notification_logs(created_at);

-- =============================================================================
-- STEP 5: DEFAULT DATA
-- =============================================================================

-- Insert default company branding
INSERT INTO company_branding (company_name, primary_color, secondary_color, accent_color) 
VALUES ('Driver Japan', '#3b82f6', '#64748b', '#f59e0b')
ON CONFLICT DO NOTHING;

-- Insert default email branding
INSERT INTO email_branding (email_signature, contact_info) 
VALUES (
  'Best regards,\nThe Driver Japan Team',
  '{"phone": "+81-3-1234-5678", "email": "support@driverjapan.com", "website": "https://driverjapan.com"}'
)
ON CONFLICT DO NOTHING;

-- Insert default document branding
INSERT INTO document_branding (header_html, footer_html) 
VALUES (
  '<div style="text-align: center; padding: 20px; border-bottom: 2px solid #3b82f6;"><h1>Driver Japan</h1></div>',
  '<div style="text-align: center; padding: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">© 2024 Driver Japan. All rights reserved.</div>'
)
ON CONFLICT DO NOTHING;

-- Insert default client portal branding
INSERT INTO client_portal_branding (welcome_message, support_email, support_phone) 
VALUES (
  'Welcome to your Driver Japan portal. Manage your bookings and track your trips.',
  'support@driverjapan.com',
  '+81-3-1234-5678'
)
ON CONFLICT DO NOTHING;

-- Insert default notification templates
INSERT INTO notification_templates (name, type, category, subject, html_content, text_content, variables, is_default) VALUES
('Booking Confirmation', 'email', 'booking', 'Booking Confirmed - {{booking_id}}', 
 '<h2>Your booking has been confirmed!</h2><p>Booking ID: {{booking_id}}</p><p>Pickup: {{pickup_location}}</p><p>Date: {{pickup_date}}</p>',
 'Your booking has been confirmed! Booking ID: {{booking_id}}', 
 '{"booking_id": "string", "pickup_location": "string", "pickup_date": "string"}', true),

('Trip Reminder', 'email', 'booking', 'Trip Reminder - {{booking_id}}', 
 '<h2>Your trip is coming soon!</h2><p>Booking ID: {{booking_id}}</p><p>Time until trip: {{time_until}}</p>',
 'Your trip is coming soon! Booking ID: {{booking_id}}', 
 '{"booking_id": "string", "time_until": "string"}', true),

('Quotation Created', 'email', 'quotation', 'New Quotation - {{quotation_id}}', 
 '<h2>New quotation created</h2><p>Quotation ID: {{quotation_id}}</p><p>Amount: {{amount}}</p>',
 'New quotation created. Quotation ID: {{quotation_id}}', 
 '{"quotation_id": "string", "amount": "string"}', true),

('Maintenance Due', 'email', 'maintenance', 'Vehicle Maintenance Due - {{vehicle_id}}', 
 '<h2>Vehicle maintenance is due</h2><p>Vehicle: {{vehicle_name}}</p><p>Service: {{service_type}}</p>',
 'Vehicle maintenance is due. Vehicle: {{vehicle_name}}', 
 '{"vehicle_id": "string", "vehicle_name": "string", "service_type": "string"}', true),

('System Alert', 'email', 'system', 'System Alert - {{alert_type}}', 
 '<h2>System Alert</h2><p>Type: {{alert_type}}</p><p>Message: {{message}}</p>',
 'System Alert: {{alert_type}} - {{message}}', 
 '{"alert_type": "string", "message": "string"}', true)
ON CONFLICT (name, type, category) DO NOTHING;

-- =============================================================================
-- STEP 6: FUNCTIONS FOR NOTIFICATION MANAGEMENT
-- =============================================================================

-- Function to get user notification preferences
CREATE OR REPLACE FUNCTION get_user_notification_preferences(p_user_id UUID)
RETURNS TABLE (
  notification_type VARCHAR(100),
  category VARCHAR(100),
  is_enabled BOOLEAN,
  frequency VARCHAR(50),
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  timezone VARCHAR(50)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    np.notification_type,
    np.category,
    np.is_enabled,
    np.frequency,
    np.quiet_hours_start,
    np.quiet_hours_end,
    np.timezone
  FROM notification_preferences np
  WHERE np.user_id = p_user_id
  ORDER BY np.notification_type, np.category;
END;
$$ LANGUAGE plpgsql;

-- Function to get active notification templates
CREATE OR REPLACE FUNCTION get_active_notification_templates(p_type VARCHAR(100) DEFAULT NULL, p_category VARCHAR(100) DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  name VARCHAR(255),
  type VARCHAR(100),
  category VARCHAR(100),
  subject VARCHAR(500),
  html_content TEXT,
  text_content TEXT,
  variables JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    nt.id,
    nt.name,
    nt.type,
    nt.category,
    nt.subject,
    nt.html_content,
    nt.text_content,
    nt.variables
  FROM notification_templates nt
  WHERE nt.is_active = true
    AND (p_type IS NULL OR nt.type = p_type)
    AND (p_category IS NULL OR nt.category = p_category)
  ORDER BY nt.is_default DESC, nt.name;
END;
$$ LANGUAGE plpgsql;

-- Function to log notification delivery
CREATE OR REPLACE FUNCTION log_notification_delivery(
  p_user_id UUID,
  p_template_id UUID,
  p_notification_type VARCHAR(100),
  p_recipient VARCHAR(255),
  p_subject VARCHAR(500),
  p_status VARCHAR(50),
  p_error_message TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO notification_logs (
    user_id, template_id, notification_type, recipient, subject, 
    status, error_message, metadata, sent_at
  ) VALUES (
    p_user_id, p_template_id, p_notification_type, p_recipient, p_subject,
    p_status, p_error_message, p_metadata, NOW()
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- STEP 7: TRIGGERS FOR UPDATED_AT
-- =============================================================================

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_notification_templates_updated_at
  BEFORE UPDATE ON notification_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_schedules_updated_at
  BEFORE UPDATE ON notification_schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_branding_updated_at
  BEFORE UPDATE ON company_branding
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_branding_updated_at
  BEFORE UPDATE ON email_branding
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_branding_updated_at
  BEFORE UPDATE ON document_branding
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_portal_branding_updated_at
  BEFORE UPDATE ON client_portal_branding
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- VERIFICATION
-- =============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Advanced Notifications & Branding system created successfully';
  RAISE NOTICE 'Tables created: notification_templates, notification_preferences, notification_schedules';
  RAISE NOTICE 'Branding tables created: company_branding, email_branding, document_branding, client_portal_branding';
  RAISE NOTICE 'Logging table created: notification_logs';
  RAISE NOTICE 'Default data and functions installed';
END $$;
