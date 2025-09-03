-- Temporarily disable RLS for data management operations
-- This allows our custom authentication system to work properly

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to insert provinces" ON provinces;
DROP POLICY IF EXISTS "Allow authenticated users to update provinces" ON provinces;
DROP POLICY IF EXISTS "Allow authenticated users to delete provinces" ON provinces;

DROP POLICY IF EXISTS "Allow authenticated users to insert districts" ON districts;
DROP POLICY IF EXISTS "Allow authenticated users to update districts" ON districts;
DROP POLICY IF EXISTS "Allow authenticated users to delete districts" ON districts;

DROP POLICY IF EXISTS "Allow authenticated users to insert communes" ON communes;
DROP POLICY IF EXISTS "Allow authenticated users to update communes" ON communes;
DROP POLICY IF EXISTS "Allow authenticated users to delete communes" ON communes;

DROP POLICY IF EXISTS "Allow authenticated users to insert villages" ON villages;
DROP POLICY IF EXISTS "Allow authenticated users to update villages" ON villages;
DROP POLICY IF EXISTS "Allow authenticated users to delete villages" ON villages;

-- Create permissive policies for data management
-- Since we're using custom auth, we'll allow all operations and handle auth in the application layer
CREATE POLICY "Allow all insert operations" ON provinces FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update operations" ON provinces FOR UPDATE USING (true);
CREATE POLICY "Allow all delete operations" ON provinces FOR DELETE USING (true);

CREATE POLICY "Allow all insert operations" ON districts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update operations" ON districts FOR UPDATE USING (true);
CREATE POLICY "Allow all delete operations" ON districts FOR DELETE USING (true);

CREATE POLICY "Allow all insert operations" ON communes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update operations" ON communes FOR UPDATE USING (true);
CREATE POLICY "Allow all delete operations" ON communes FOR DELETE USING (true);

CREATE POLICY "Allow all insert operations" ON villages FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update operations" ON villages FOR UPDATE USING (true);
CREATE POLICY "Allow all delete operations" ON villages FOR DELETE USING (true);
