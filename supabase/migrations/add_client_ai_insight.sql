-- Cache the AI-generated client insight so it's only regenerated when the user
-- explicitly asks (token usage stays on-demand, not automatic on every page load).
ALTER TABLE clients ADD COLUMN IF NOT EXISTS ai_insight text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS ai_insight_generated_at timestamp with time zone;
