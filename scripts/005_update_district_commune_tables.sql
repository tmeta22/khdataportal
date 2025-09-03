-- Add type and parent_district_id columns to districts table
ALTER TABLE districts ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'district';
ALTER TABLE districts ADD COLUMN IF NOT EXISTS parent_district_id INTEGER REFERENCES districts(id);

-- Add type column to communes table  
ALTER TABLE communes ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'commune';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_districts_type ON districts(type);
CREATE INDEX IF NOT EXISTS idx_districts_parent ON districts(parent_district_id);
CREATE INDEX IF NOT EXISTS idx_communes_type ON communes(type);
