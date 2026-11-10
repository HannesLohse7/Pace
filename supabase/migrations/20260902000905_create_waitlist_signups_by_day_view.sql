-- Daily waitlist signups plus a running total, for the SQL editor.
-- security_invoker makes the view enforce waitlist_signups' own RLS;
-- the revoke keeps it off the REST API regardless.
create or replace view public.waitlist_signups_by_day
with (security_invoker = true) as
select
  date_trunc('day', created_at)::date as signup_date,
  count(*)::bigint as signups,
  sum(count(*)) over (order by date_trunc('day', created_at)::date)::bigint as cumulative_signups
from public.waitlist_signups
group by 1
order by 1;

revoke all on public.waitlist_signups_by_day from anon, authenticated;
