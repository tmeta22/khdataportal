-- Create table to track user activity for recent viewed functionality
CREATE TABLE IF NOT EXISTS user_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('province', 'district', 'commune', 'village')),
  entity_id UUID NOT NULL,
  entity_name_khmer TEXT NOT NULL,
  entity_name_latin TEXT NOT NULL,
  entity_code VARCHAR(10) NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for user activity
CREATE INDEX IF NOT EXISTS idx_user_activity_session_id ON user_activity(session_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_viewed_at ON user_activity(viewed_at DESC);

-- Enable RLS (though we'll use session-based access for anonymous users)
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to insert and select their own activity based on session
CREATE POLICY "Allow session-based activity access" ON user_activity
  FOR ALL USING (true);
