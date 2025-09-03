-- Enable RLS on administrative tables
-- Since this is public data, we'll allow read access to everyone
-- but restrict write access to authenticated admin users only

ALTER TABLE provinces ENABLE ROW LEVEL SECURITY;
ALTER TABLE districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE communes ENABLE ROW LEVEL SECURITY;
ALTER TABLE villages ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read administrative data
CREATE POLICY "Allow public read access to provinces" ON provinces FOR SELECT USING (true);
CREATE POLICY "Allow public read access to districts" ON districts FOR SELECT USING (true);
CREATE POLICY "Allow public read access to communes" ON communes FOR SELECT USING (true);
CREATE POLICY "Allow public read access to villages" ON villages FOR SELECT USING (true);

-- Only allow authenticated users to modify data
CREATE POLICY "Allow admin insert on provinces" ON provinces FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Allow admin update on provinces" ON provinces FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow admin delete on provinces" ON provinces FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow admin insert on districts" ON districts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Allow admin update on districts" ON districts FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow admin delete on districts" ON districts FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow admin insert on communes" ON communes FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Allow admin update on communes" ON communes FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow admin delete on communes" ON communes FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow admin insert on villages" ON villages FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Allow admin update on villages" ON villages FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow admin delete on villages" ON villages FOR DELETE USING (auth.uid() IS NOT NULL);
