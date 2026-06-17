-- Add daily message selection column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS today_message text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS message_selected_at date;
