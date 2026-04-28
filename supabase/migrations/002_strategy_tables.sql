-- Strategy AI: messages, memories, runs
-- Run in Supabase Dashboard → SQL Editor, or via Supabase CLI

-- Table 1: strategy_messages
create table if not exists strategy_messages (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid,
  user_id     uuid,
  role        text not null check (role in ('user', 'assistant', 'system')),
  content     text not null,
  metadata    jsonb default '{}'::jsonb,
  created_at  timestamptz default now()
);

create index if not exists strategy_messages_user_id_idx  on strategy_messages (user_id);
create index if not exists strategy_messages_client_id_idx on strategy_messages (client_id);

-- Table 2: strategy_memories
create table if not exists strategy_memories (
  id           uuid primary key default gen_random_uuid(),
  client_id    uuid,
  user_id      uuid,
  stage        text not null check (stage in ('brand', 'competitors', 'content', 'strategy', 'growth')),
  memory_type  text not null,
  title        text not null,
  summary      text not null,
  data         jsonb default '{}'::jsonb,
  source_type  text default 'chat',
  status       text default 'saved',
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

create index if not exists strategy_memories_user_id_idx  on strategy_memories (user_id);
create index if not exists strategy_memories_client_id_idx on strategy_memories (client_id);
create index if not exists strategy_memories_stage_idx     on strategy_memories (stage);

-- Table 3: strategy_runs
create table if not exists strategy_runs (
  id               uuid primary key default gen_random_uuid(),
  client_id        uuid,
  user_id          uuid,
  status           text default 'complete',
  input_snapshot   jsonb default '{}'::jsonb,
  output           jsonb not null,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

create index if not exists strategy_runs_user_id_idx   on strategy_runs (user_id);
create index if not exists strategy_runs_client_id_idx on strategy_runs (client_id);

-- Permissive RLS for MVP (tighten after auth is solidified)
alter table strategy_messages enable row level security;
alter table strategy_memories  enable row level security;
alter table strategy_runs       enable row level security;

create policy if not exists "allow all strategy_messages" on strategy_messages for all using (true) with check (true);
create policy if not exists "allow all strategy_memories"  on strategy_memories  for all using (true) with check (true);
create policy if not exists "allow all strategy_runs"       on strategy_runs       for all using (true) with check (true);
