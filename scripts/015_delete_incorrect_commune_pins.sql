-- Delete the 4 specific commune pins that are at wrong locations
-- These communes have incorrect coordinate data and need to be removed

DELETE FROM communes WHERE code IN ('110203', '110402', '110504', '110302');

-- Log the deletion for reference
-- Deleted communes:
-- - Roya (code: 110203)
-- - Pu Chrey (code: 110402) 
-- - Romonea (code: 110504)
-- - Saen Monourom (code: 110302)
