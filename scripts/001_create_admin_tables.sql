-- Create administrative hierarchy tables for Cambodia
CREATE TABLE IF NOT EXISTS provinces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(10) UNIQUE NOT NULL,
  name_khmer TEXT NOT NULL,
  name_latin TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS districts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(10) UNIQUE NOT NULL,
  name_khmer TEXT NOT NULL,
  name_latin TEXT NOT NULL,
  province_id UUID NOT NULL REFERENCES provinces(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS communes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(10) UNIQUE NOT NULL,
  name_khmer TEXT NOT NULL,
  name_latin TEXT NOT NULL,
  district_id UUID NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS villages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(10) UNIQUE NOT NULL,
  name_khmer TEXT NOT NULL,
  name_latin TEXT NOT NULL,
  commune_id UUID NOT NULL REFERENCES communes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_districts_province_id ON districts(province_id);
CREATE INDEX IF NOT EXISTS idx_communes_district_id ON communes(district_id);
CREATE INDEX IF NOT EXISTS idx_villages_commune_id ON villages(commune_id);

-- Create search indexes
CREATE INDEX IF NOT EXISTS idx_provinces_name_latin ON provinces USING gin(to_tsvector('english', name_latin));
CREATE INDEX IF NOT EXISTS idx_provinces_name_khmer ON provinces USING gin(to_tsvector('simple', name_khmer));
CREATE INDEX IF NOT EXISTS idx_districts_name_latin ON districts USING gin(to_tsvector('english', name_latin));
CREATE INDEX IF NOT EXISTS idx_districts_name_khmer ON districts USING gin(to_tsvector('simple', name_khmer));
CREATE INDEX IF NOT EXISTS idx_communes_name_latin ON communes USING gin(to_tsvector('english', name_latin));
CREATE INDEX IF NOT EXISTS idx_communes_name_khmer ON communes USING gin(to_tsvector('simple', name_khmer));
CREATE INDEX IF NOT EXISTS idx_villages_name_latin ON villages USING gin(to_tsvector('english', name_latin));
CREATE INDEX IF NOT EXISTS idx_villages_name_khmer ON villages USING gin(to_tsvector('simple', name_khmer));
