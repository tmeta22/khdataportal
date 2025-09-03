-- Create admin_settings table for storing contact info and other admin configurations
CREATE TABLE IF NOT EXISTS admin_settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(255) UNIQUE NOT NULL,
  contact_info JSONB,
  settings JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access
CREATE POLICY "Admin can manage settings" ON admin_settings
  FOR ALL USING (true);

-- Insert default contact info structure
INSERT INTO admin_settings (key, contact_info) 
VALUES ('contact_info', '{"email":"","phone":"","address":"","description":""}')
ON CONFLICT (key) DO NOTHING;
