-- Create recent_updates table for tracking administrative updates
CREATE TABLE IF NOT EXISTS recent_updates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  province_id UUID REFERENCES provinces(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_recent_updates_date ON recent_updates(date DESC);
CREATE INDEX IF NOT EXISTS idx_recent_updates_province ON recent_updates(province_id);

-- Insert sample recent updates
INSERT INTO recent_updates (type, title, description, province_id) VALUES
('administrative', 'Administrative boundary adjustments completed', 'Updated administrative boundaries based on latest government decree', NULL),
('demographic', 'Population census data updated', 'Latest population figures from 2024 census incorporated', NULL),
('geographic', 'New sub-district formations approved', 'Three new sub-districts officially recognized by Ministry of Interior', NULL),
('infrastructure', 'Infrastructure development projects initiated', 'New road construction and public facility improvements', NULL);
