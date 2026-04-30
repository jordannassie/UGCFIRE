-- Leads pipeline tables

create table if not exists leads (
  id                  uuid primary key default gen_random_uuid(),
  google_place_id     text unique,
  business_name       text not null,
  category            text,
  city                text,
  phone               text,
  website             text,
  address             text,
  google_maps_url     text,
  rating              numeric,
  review_count        int,
  lead_score          int default 0,
  status              text default 'New',
  source              text default 'Google Places',
  last_contacted_at   timestamptz,
  next_follow_up_at   timestamptz,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

create table if not exists lead_notes (
  id          uuid primary key default gen_random_uuid(),
  lead_id     uuid references leads(id) on delete cascade not null,
  note        text not null,
  created_at  timestamptz default now()
);

create table if not exists lead_activities (
  id              uuid primary key default gen_random_uuid(),
  lead_id         uuid references leads(id) on delete cascade not null,
  activity_type   text not null,
  description     text,
  created_at      timestamptz default now()
);

-- Enable RLS (admin accesses via service role key, so these can be restrictive)
alter table leads           enable row level security;
alter table lead_notes      enable row level security;
alter table lead_activities enable row level security;

-- Service role bypasses RLS, so no policies needed for server-side access.
-- Add a basic policy so authenticated admins can also read directly if needed.
create policy "service role full access leads"
  on leads for all using (true) with check (true);

create policy "service role full access lead_notes"
  on lead_notes for all using (true) with check (true);

create policy "service role full access lead_activities"
  on lead_activities for all using (true) with check (true);
