-- Add optional map URL for event venue location.

alter table public.events
add column if not exists venue_map_url text;
