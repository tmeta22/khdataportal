-- Add missing administrative types: Municipality, Khan, Sangkat
-- Update existing tables to support type field and documentation fields

-- Add type and documentation fields to provinces table
ALTER TABLE provinces 
ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'province',
ADD COLUMN IF NOT EXISTS reference TEXT,
ADD COLUMN IF NOT EXISTS official_note TEXT,
ADD COLUMN IF NOT EXISTS note_by_checker TEXT;

-- Add type and documentation fields to districts table  
ALTER TABLE districts
ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'district',
ADD COLUMN IF NOT EXISTS reference TEXT,
ADD COLUMN IF NOT EXISTS official_note TEXT,
ADD COLUMN IF NOT EXISTS note_by_checker TEXT;

-- Add type and documentation fields to communes table
ALTER TABLE communes
ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'commune', 
ADD COLUMN IF NOT EXISTS reference TEXT,
ADD COLUMN IF NOT EXISTS official_note TEXT,
ADD COLUMN IF NOT EXISTS note_by_checker TEXT;

-- Add documentation fields to villages table
ALTER TABLE villages
ADD COLUMN IF NOT EXISTS reference TEXT,
ADD COLUMN IF NOT EXISTS official_note TEXT,
ADD COLUMN IF NOT EXISTS note_by_checker TEXT;

-- Create municipalities table (separate from districts for proper hierarchy)
CREATE TABLE IF NOT EXISTS municipalities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(10) UNIQUE NOT NULL,
  name_khmer TEXT NOT NULL,
  name_latin TEXT NOT NULL,
  province_id UUID NOT NULL REFERENCES provinces(id) ON DELETE CASCADE,
  type VARCHAR(20) DEFAULT 'municipality',
  reference TEXT,
  official_note TEXT,
  note_by_checker TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create khan table (districts for Phnom Penh)
CREATE TABLE IF NOT EXISTS khan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(10) UNIQUE NOT NULL,
  name_khmer TEXT NOT NULL,
  name_latin TEXT NOT NULL,
  province_id UUID NOT NULL REFERENCES provinces(id) ON DELETE CASCADE,
  type VARCHAR(20) DEFAULT 'khan',
  reference TEXT,
  official_note TEXT,
  note_by_checker TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sangkat table (communes for Phnom Penh)
CREATE TABLE IF NOT EXISTS sangkat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(10) UNIQUE NOT NULL,
  name_khmer TEXT NOT NULL,
  name_latin TEXT NOT NULL,
  khan_id UUID NOT NULL REFERENCES khan(id) ON DELETE CASCADE,
  type VARCHAR(20) DEFAULT 'sangkat',
  reference TEXT,
  official_note TEXT,
  note_by_checker TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for new tables
CREATE INDEX IF NOT EXISTS idx_municipalities_province_id ON municipalities(province_id);
CREATE INDEX IF NOT EXISTS idx_khan_province_id ON khan(province_id);
CREATE INDEX IF NOT EXISTS idx_sangkat_khan_id ON sangkat(khan_id);

-- Create search indexes for new tables
CREATE INDEX IF NOT EXISTS idx_municipalities_name_latin ON municipalities USING gin(to_tsvector('english', name_latin));
CREATE INDEX IF NOT EXISTS idx_municipalities_name_khmer ON municipalities USING gin(to_tsvector('simple', name_khmer));
CREATE INDEX IF NOT EXISTS idx_khan_name_latin ON khan USING gin(to_tsvector('english', name_latin));
CREATE INDEX IF NOT EXISTS idx_khan_name_khmer ON khan USING gin(to_tsvector('simple', name_khmer));
CREATE INDEX IF NOT EXISTS idx_sangkat_name_latin ON sangkat USING gin(to_tsvector('english', name_latin));
CREATE INDEX IF NOT EXISTS idx_sangkat_name_khmer ON sangkat USING gin(to_tsvector('simple', name_khmer));

-- Update existing district records that should be municipalities
UPDATE districts SET type = 'municipality' WHERE code IN (
  SELECT code FROM districts WHERE name_latin LIKE '%Municipality%' OR name_khmer LIKE '%ក្រុង%'
);

-- Update Phnom Penh districts to be khan
UPDATE districts SET type = 'khan' 
WHERE province_id = (SELECT id FROM provinces WHERE code = '12' LIMIT 1);

-- Update Phnom Penh communes to be sangkat  
UPDATE communes SET type = 'sangkat'
WHERE district_id IN (
  SELECT id FROM districts WHERE province_id = (SELECT id FROM provinces WHERE code = '12' LIMIT 1)
);
