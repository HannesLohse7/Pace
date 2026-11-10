-- Public marketing waitlist. Anonymous inserts allowed, no anonymous
-- reads. The Edge Function reads counts with the service role key.

create table waitlist_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  distance_interest text check (distance_interest in ('sprint', 'olympic', '70.3', 'ironman', 'not_sure')),
  source text,
  created_at timestamptz not null default now()
);

create index waitlist_signups_created_at_idx on waitlist_signups (created_at);

alter table waitlist_signups enable row level security;

create policy "anyone can join the waitlist" on waitlist_signups
  for insert to anon
  with check (true);

-- No select/update/delete policy for anon or authenticated.
