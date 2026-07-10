-- increment_activity is SECURITY DEFINER and previously trusted the
-- caller-supplied p_user_id with no check against the authenticated caller,
-- letting any authenticated user tamper with another user's activity/streak
-- data via a direct PostgREST RPC call. Add an auth.uid() guard; logic is
-- otherwise unchanged.
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
  IF p_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'unauthorized' USING ERRCODE = '42501';
  END IF;

  INSERT INTO daily_activity (user_id, date, action_count)
  VALUES (p_user_id, p_date, p_count)
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    action_count = daily_activity.action_count + p_count,
    updated_at = now();
END;
$$;
