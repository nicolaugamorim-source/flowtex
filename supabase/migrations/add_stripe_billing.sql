-- Stripe billing: customer/subscription linkage + trial abuse prevention

alter table profiles add column if not exists stripe_customer_id text unique;
alter table profiles add column if not exists stripe_subscription_id text unique;
alter table profiles add column if not exists trial_used_at timestamptz;

-- One row per payment method fingerprint that has ever consumed a trial.
-- Stripe's card fingerprint is stable across customers/accounts, so this
-- catches "new account, same card" trial abuse that an account-level flag can't.
create table if not exists used_trial_cards (
  card_fingerprint text primary key,
  user_id uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- One row per signup, hashed IP only (never store raw IPs). Used as a soft
-- signal: a repeat IP within the lookback window skips the trial but still
-- allows the signup itself, to avoid penalizing shared/office networks.
create table if not exists trial_signups (
  id uuid primary key default gen_random_uuid(),
  ip_hash text not null,
  user_id uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists trial_signups_ip_hash_idx on trial_signups(ip_hash, created_at);

-- No policies on purpose: these tables are only ever touched by the
-- service-role key (server-side), which bypasses RLS — never by the
-- anon/authenticated client, so they should be unreadable from the browser.
alter table used_trial_cards enable row level security;
alter table trial_signups enable row level security;
