-- Create census data table for Provisional Census 2019 and future years
CREATE TABLE IF NOT EXISTS census_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  year INTEGER NOT NULL DEFAULT 2019,
  pro_code VARCHAR(10) NOT NULL,
  provinces_kh TEXT,
  provinces TEXT NOT NULL,
  households BIGINT,
  males BIGINT,
  females BIGINT,
  total BIGINT,
  household_size DECIMAL(10,2),
  area_km2 DECIMAL(15,2),
  pop_km2 DECIMAL(15,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Add constraints
  CONSTRAINT census_data_year_pro_code_unique UNIQUE (year, pro_code),
  CONSTRAINT census_data_year_check CHECK (year >= 1900 AND year <= 2100),
  CONSTRAINT census_data_households_check CHECK (households >= 0),
  CONSTRAINT census_data_males_check CHECK (males >= 0),
  CONSTRAINT census_data_females_check CHECK (females >= 0),
  CONSTRAINT census_data_total_check CHECK (total >= 0),
  CONSTRAINT census_data_household_size_check CHECK (household_size >= 0),
  CONSTRAINT census_data_area_check CHECK (area_km2 >= 0),
  CONSTRAINT census_data_pop_density_check CHECK (pop_km2 >= 0)
);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_census_data_year ON census_data(year);
CREATE INDEX IF NOT EXISTS idx_census_data_pro_code ON census_data(pro_code);
CREATE INDEX IF NOT EXISTS idx_census_data_provinces ON census_data(provinces);

-- Add RLS (Row Level Security)
ALTER TABLE census_data ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for authenticated users
CREATE POLICY "Allow all operations for authenticated users" ON census_data
  FOR ALL USING (true);
