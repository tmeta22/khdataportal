-- Add missing 'type' columns to districts and communes tables
-- These columns are needed for the import functionality

ALTER TABLE districts ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'district';
ALTER TABLE communes ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'commune';

-- Update existing records with appropriate types
UPDATE districts SET type = 'district' WHERE type IS NULL OR type = '';
UPDATE communes SET type = 'commune' WHERE type IS NULL OR type = '';

-- Add indexes for the new type columns
CREATE INDEX IF NOT EXISTS idx_districts_type ON districts(type);
CREATE INDEX IF NOT EXISTS idx_communes_type ON communes(type);
