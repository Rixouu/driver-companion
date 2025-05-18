-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add the user as an admin
INSERT INTO admin_users (id, role)
VALUES ('1050a5cd-9caa-4737-b83e-9b4ed69a5cc7', 'admin')
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on the table
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for the admin_users table itself
CREATE POLICY "Admin users can read admin_users"
  ON admin_users
  FOR SELECT
  USING (
    auth.uid() IN (SELECT id FROM admin_users)
  ); 