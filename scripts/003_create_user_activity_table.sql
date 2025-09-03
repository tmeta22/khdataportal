-- Create user activity tracking table for recently viewed items
CREATE TABLE IF NOT EXISTS user_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) NOT NULL,
  region_type VARCHAR(50) NOT NULL,
  region_id UUID NOT NULL,
  region_name_latin VARCHAR(255) NOT NULL,
  region_name_khmer VARCHAR(255),
  region_code VARCHAR(10),
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for user activity
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;

-- Allow public read/write for session-based tracking
CREATE POLICY "Allow session-based access to user_activity" ON user_activity FOR ALL USING (true);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_user_activity_session_id ON user_activity(session_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_viewed_at ON user_activity(viewed_at DESC);
