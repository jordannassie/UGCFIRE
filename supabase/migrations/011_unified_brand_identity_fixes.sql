-- Unified Migration: Auth, Admin Allowlist, Brand Sync, and RLS Fixes

-- 1. Admin Allowlist & Helper Functions
create table if not exists public.admin_allowed_emails (
  email text primary key check (email = lower(email)),
  created_at timestamptz default now()
);

alter table public.admin_allowed_emails enable row level security;

create or replace function public.current_user_is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select coalesce(auth.role(), '') = 'service_role'
    or exists (
      select 1
      from public.profiles
      where id = auth.uid()
        and role = 'admin'
    );
$$;

create or replace function public.is_admin_allowed_email(candidate_email text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_allowed_emails
    where email = lower(candidate_email)
  );
$$;

drop policy if exists "Admins can read allowed emails" on public.admin_allowed_emails;
create policy "Admins can read allowed emails"
on public.admin_allowed_emails
for select
using (public.current_user_is_admin());

drop policy if exists "Admins can manage allowed emails" on public.admin_allowed_emails;
create policy "Admins can manage allowed emails"
on public.admin_allowed_emails
for all
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

-- 2. Profile RLS and Triggers
create or replace function public.prevent_profile_role_self_promotion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if current_setting('app.profile_sync', true) = 'on'
    or coalesce(auth.role(), '') = 'service_role' then
    new.email = lower(new.email);
    new.updated_at = now();
    return new;
  end if;

  if new.role is distinct from old.role and not public.current_user_is_admin() then
    raise exception 'Only admins can change profile roles.';
  end if;

  new.email = lower(new.email);
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists prevent_profile_role_self_promotion on public.profiles;
create trigger prevent_profile_role_self_promotion
  before update on public.profiles
  for each row execute procedure public.prevent_profile_role_self_promotion();

drop policy if exists "Users can read own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Admin read all profiles" on public.profiles;
drop policy if exists "Admin update all profiles" on public.profiles;
drop policy if exists "Users can update own non-role profile fields" on public.profiles;
drop policy if exists "Admins can read all profiles" on public.profiles;
drop policy if exists "Admins can update all profiles" on public.profiles;

create policy "Users can read own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own non-role profile fields" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "Admins can read all profiles" on public.profiles for select using (public.current_user_is_admin());
create policy "Admins can update all profiles" on public.profiles for update using (public.current_user_is_admin()) with check (public.current_user_is_admin());

-- 3. Profile Sync RPC (handles auto-creation of companies)
create or replace function public.sync_current_auth_profile(profile_full_name text default null)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  current_email text := lower(auth.jwt()->>'email');
  assigned_role text;
  existing_company_id uuid;
begin
  if current_user_id is null then
    raise exception 'Not authenticated.';
  end if;

  if current_email is null or current_email = '' then
    raise exception 'Authenticated user email is missing.';
  end if;

  assigned_role := case
    when public.is_admin_allowed_email(current_email) then 'admin'
    else 'client'
  end;

  perform set_config('app.profile_sync', 'on', true);

  insert into public.profiles (id, email, full_name, role, updated_at)
  values (current_user_id, current_email, profile_full_name, assigned_role, now())
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(excluded.full_name, public.profiles.full_name),
        role = assigned_role,
        updated_at = now();

  if assigned_role = 'client' then
    select id into existing_company_id
    from public.companies
    where owner_user_id = current_user_id
    limit 1;

    if existing_company_id is null then
      insert into public.companies (name, owner_user_id, onboarding_status)
      values (
        coalesce(nullif(profile_full_name, ''), split_part(current_email, '@', 1)) || '''s Brand',
        current_user_id,
        'needs_plan'
      )
      returning id into existing_company_id;

      insert into public.activity_logs (company_id, actor_user_id, actor_role, event_type, event_message)
      values (existing_company_id, current_user_id, 'client', 'user_signed_up', coalesce(nullif(profile_full_name, ''), current_email) || ' signed up.');
    end if;
  end if;

  return assigned_role;
end;
$$;

grant execute on function public.sync_current_auth_profile(text) to authenticated;

-- 4. Redundant Company Cleanup & Unique Constraint
DELETE FROM public.companies a USING (
      SELECT MAX(ctid) as ctid, owner_user_id
      FROM public.companies 
      GROUP BY owner_user_id 
      HAVING COUNT(*) > 1
) b
WHERE a.owner_user_id = b.owner_user_id 
AND a.ctid <> b.ctid;

DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'companies_owner_user_id_key') THEN
    ALTER TABLE public.companies ADD CONSTRAINT companies_owner_user_id_key UNIQUE (owner_user_id);
  END IF;
END $$;

-- 5. Brand Brief RLS Fix
DROP POLICY IF EXISTS "Owner can manage own brief" ON public.brand_briefs;
CREATE POLICY "Owner can manage own brief" ON public.brand_briefs
FOR ALL 
USING (exists (select 1 from public.companies c where c.id = brand_briefs.company_id and c.owner_user_id = auth.uid()))
WITH CHECK (exists (select 1 from public.companies c where c.id = brand_briefs.company_id and c.owner_user_id = auth.uid()));

-- 6. Content Comments Table
create table if not exists public.content_comments (
  id uuid primary key default gen_random_uuid(),
  content_item_id uuid references public.content_items(id) on delete cascade,
  company_id uuid references public.companies(id) on delete cascade,
  sender_user_id uuid references auth.users(id),
  sender_role text not null check (sender_role in ('client', 'admin')),
  sender_name text,
  message text not null,
  is_internal boolean default false,
  created_at timestamptz default now()
);

alter table public.content_comments enable row level security;

drop policy if exists "Owner can manage own content comments" on public.content_comments;
create policy "Owner can manage own content comments" on public.content_comments for all using (
  exists (select 1 from public.companies c where c.id = company_id and c.owner_user_id = auth.uid())
);

drop policy if exists "Admin all content comments" on public.content_comments;
create policy "Admin all content comments" on public.content_comments for all using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- 7. Backfill existing admins
alter table public.profiles disable trigger prevent_profile_role_self_promotion;
update public.profiles p set role = 'admin', updated_at = now()
where exists (select 1 from public.admin_allowed_emails a where a.email = lower(p.email));
alter table public.profiles enable trigger prevent_profile_role_self_promotion;
