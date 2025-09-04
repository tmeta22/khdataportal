-- Create map_boundaries table for storing boundaries purely for map display
CREATE TABLE IF NOT EXISTS map_boundaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  boundary_id TEXT NOT NULL,
  boundary_type TEXT NOT NULL CHECK (boundary_type IN ('province', 'district', 'commune')),
  name TEXT,
  code TEXT,
  geojson JSONB NOT NULL,
  properties JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique constraint to prevent duplicate boundaries
CREATE UNIQUE INDEX IF NOT EXISTS map_boundaries_unique 
ON map_boundaries (boundary_id, boundary_type);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_map_boundaries_type ON map_boundaries (boundary_type);
CREATE INDEX IF NOT EXISTS idx_map_boundaries_code ON map_boundaries (code);
CREATE INDEX IF NOT EXISTS idx_map_boundaries_geojson ON map_boundaries USING GIN (geojson);

-- Enable RLS
ALTER TABLE map_boundaries ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access for map display
CREATE POLICY "Allow public read access to map boundaries" ON map_boundaries
  FOR SELECT USING (true);

-- Create policy to allow authenticated users to insert/update boundaries
CREATE POLICY "Allow authenticated users to manage map boundaries" ON map_boundaries
  FOR ALL USING (auth.role() = 'authenticated');
