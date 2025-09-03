-- Create boundary tables for storing GeoJSON data
CREATE TABLE IF NOT EXISTS province_boundaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  province_id UUID REFERENCES provinces(id) ON DELETE CASCADE,
  geojson JSONB NOT NULL,
  properties JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS district_boundaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  district_id UUID REFERENCES districts(id) ON DELETE CASCADE,
  geojson JSONB NOT NULL,
  properties JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS commune_boundaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  commune_id UUID REFERENCES communes(id) ON DELETE CASCADE,
  geojson JSONB NOT NULL,
  properties JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_province_boundaries_province_id ON province_boundaries(province_id);
CREATE INDEX IF NOT EXISTS idx_district_boundaries_district_id ON district_boundaries(district_id);
CREATE INDEX IF NOT EXISTS idx_commune_boundaries_commune_id ON commune_boundaries(commune_id);

-- Enable RLS
ALTER TABLE province_boundaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE district_boundaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE commune_boundaries ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Allow public read access to province boundaries" ON province_boundaries FOR SELECT USING (true);
CREATE POLICY "Allow public read access to district boundaries" ON district_boundaries FOR SELECT USING (true);
CREATE POLICY "Allow public read access to commune boundaries" ON commune_boundaries FOR SELECT USING (true);

-- Create policies for authenticated insert/update/delete
CREATE POLICY "Allow authenticated insert to province boundaries" ON province_boundaries FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated update to province boundaries" ON province_boundaries FOR UPDATE USING (true);
CREATE POLICY "Allow authenticated delete to province boundaries" ON province_boundaries FOR DELETE USING (true);

CREATE POLICY "Allow authenticated insert to district boundaries" ON district_boundaries FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated update to district boundaries" ON district_boundaries FOR UPDATE USING (true);
CREATE POLICY "Allow authenticated delete to district boundaries" ON district_boundaries FOR DELETE USING (true);

CREATE POLICY "Allow authenticated insert to commune boundaries" ON commune_boundaries FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated update to commune boundaries" ON commune_boundaries FOR UPDATE USING (true);
CREATE POLICY "Allow authenticated delete to commune boundaries" ON commune_boundaries FOR DELETE USING (true);
