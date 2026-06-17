-- Add streak columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS streak_count int default 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_active_date date;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS longest_streak int default 0;

-- Create indexes for streak queries
CREATE INDEX IF NOT EXISTS idx_profiles_streak_count ON profiles(streak_count);
CREATE INDEX IF NOT EXISTS idx_profiles_last_active_date ON profiles(last_active_date);
