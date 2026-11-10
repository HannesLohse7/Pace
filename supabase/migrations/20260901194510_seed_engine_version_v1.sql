insert into engine_version (version, description)
values (
  'v1',
  'Rule-based adaptation engine v1: on a missed workout (illness, travel, or poor-recovery report), trims the next remaining planned workout this week by ~20% rather than redistributing the lost volume elsewhere -- an "ease back in" adjustment, not a make-up session.'
)
on conflict (version) do nothing;
