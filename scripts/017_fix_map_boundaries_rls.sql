-- Fix RLS policies for map_boundaries table to allow boundary imports

-- Allow authenticated users to insert boundaries
CREATE POLICY "Allow authenticated users to insert boundaries" ON map_boundaries
FOR INSERT TO authenticated
WITH CHECK (true);

-- Allow authenticated users to select boundaries
CREATE POLICY "Allow authenticated users to select boundaries" ON map_boundaries
FOR SELECT TO authenticated
USING (true);

-- Allow authenticated users to update boundaries
CREATE POLICY "Allow authenticated users to update boundaries" ON map_boundaries
FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated users to delete boundaries
CREATE POLICY "Allow authenticated users to delete boundaries" ON map_boundaries
FOR DELETE TO authenticated
USING (true);

-- Also allow public read access for map display
CREATE POLICY "Allow public read access to boundaries" ON map_boundaries
FOR SELECT TO anon
USING (true);
