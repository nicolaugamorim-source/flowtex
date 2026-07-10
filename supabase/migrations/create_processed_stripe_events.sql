-- One row per processed Stripe webhook event id. Stripe retries delivery on
-- any non-2xx response or timeout, so the webhook handler inserts the event
-- id here before running any side effects; a unique-constraint violation on
-- insert means the event was already processed, and the handler short-circuits
-- to a 200 without re-sending emails/notifications.
create table if not exists processed_stripe_events (
  event_id text primary key,
  processed_at timestamptz not null default now()
);

-- No policies on purpose: this table is only ever touched by the
-- service-role key (server-side), which bypasses RLS — never by the
-- anon/authenticated client, so it should be unreadable from the browser.
alter table processed_stripe_events enable row level security;
