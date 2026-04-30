create table if not exists fire_creator_profile (
  id           uuid primary key default gen_random_uuid(),
  display_name text not null default 'UGC Fire Team',
  title        text not null default 'Fire Creator',
  bio          text not null default 'Your UGC Fire creator helping produce and deliver your monthly content.',
  avatar_url   text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

alter table fire_creator_profile enable row level security;

create policy "service role full access fire_creator_profile"
  on fire_creator_profile for all using (true) with check (true);

-- Seed a single row so GET always has something to return
insert into fire_creator_profile (display_name, title, bio, avatar_url)
values ('UGC Fire Team', 'Fire Creator', 'Your UGC Fire creator helping produce and deliver your monthly content.', null)
on conflict do nothing;

-- Create the storage bucket for avatars (idempotent via insert ignore)
insert into storage.buckets (id, name, public)
values ('fire-creator-avatars', 'fire-creator-avatars', true)
on conflict (id) do nothing;

-- Storage RLS: allow public read and service role write on this bucket
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'service role storage fire-creator-avatars'
  ) then
    execute $p$
      create policy "service role storage fire-creator-avatars"
        on storage.objects for all
        using (bucket_id = 'fire-creator-avatars')
        with check (bucket_id = 'fire-creator-avatars')
    $p$;
  end if;
end
$$;
