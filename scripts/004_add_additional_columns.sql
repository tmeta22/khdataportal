-- Add additional columns for Reference, Official Note, and Note by Checker
ALTER TABLE provinces ADD COLUMN IF NOT EXISTS reference TEXT;
ALTER TABLE provinces ADD COLUMN IF NOT EXISTS official_note TEXT;
ALTER TABLE provinces ADD COLUMN IF NOT EXISTS note_by_checker TEXT;

ALTER TABLE districts ADD COLUMN IF NOT EXISTS reference TEXT;
ALTER TABLE districts ADD COLUMN IF NOT EXISTS official_note TEXT;
ALTER TABLE districts ADD COLUMN IF NOT EXISTS note_by_checker TEXT;

ALTER TABLE communes ADD COLUMN IF NOT EXISTS reference TEXT;
ALTER TABLE communes ADD COLUMN IF NOT EXISTS official_note TEXT;
ALTER TABLE communes ADD COLUMN IF NOT EXISTS note_by_checker TEXT;

ALTER TABLE villages ADD COLUMN IF NOT EXISTS reference TEXT;
ALTER TABLE villages ADD COLUMN IF NOT EXISTS official_note TEXT;
ALTER TABLE villages ADD COLUMN IF NOT EXISTS note_by_checker TEXT;
