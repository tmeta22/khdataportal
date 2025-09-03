-- Enable Row Level Security for all administrative tables
ALTER TABLE provinces ENABLE ROW LEVEL SECURITY;
ALTER TABLE districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE communes ENABLE ROW LEVEL SECURITY;
ALTER TABLE villages ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Allow public read access to provinces" ON provinces FOR SELECT USING (true);
CREATE POLICY "Allow public read access to districts" ON districts FOR SELECT USING (true);
CREATE POLICY "Allow public read access to communes" ON communes FOR SELECT USING (true);
CREATE POLICY "Allow public read access to villages" ON villages FOR SELECT USING (true);

-- Create policies for authenticated users to manage data
CREATE POLICY "Allow authenticated users to insert provinces" ON provinces FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Allow authenticated users to update provinces" ON provinces FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow authenticated users to delete provinces" ON provinces FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to insert districts" ON districts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Allow authenticated users to update districts" ON districts FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow authenticated users to delete districts" ON districts FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to insert communes" ON communes FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Allow authenticated users to update communes" ON communes FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow authenticated users to delete communes" ON communes FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to insert villages" ON villages FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Allow authenticated users to update villages" ON villages FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow authenticated users to delete villages" ON villages FOR DELETE USING (auth.uid() IS NOT NULL);
