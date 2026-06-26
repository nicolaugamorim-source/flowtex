CREATE OR REPLACE FUNCTION increment_activity(
  p_user_id uuid,
  p_date date,
  p_count int
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO daily_activity (user_id, date, action_count)
  VALUES (p_user_id, p_date, p_count)
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    action_count = daily_activity.action_count + p_count,
    updated_at = now();
END;
$$;
