-- UGCFire Schema Migration v1

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  role text not null default 'client' check (role in ('client', 'admin')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "Users can read own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Admin read all profiles" on public.profiles for select using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- plans
create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  price_monthly integer not null,
  videos_per_month integer not null,
  description text,
  is_active boolean default true,
  created_at timestamptz default now()
);
alter table public.plans enable row level security;
create policy "Anyone can read plans" on public.plans for select using (true);

-- companies
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  website text,
  owner_user_id uuid references auth.users(id) on delete cascade,
  plan_id uuid references public.plans(id),
  onboarding_status text not null default 'needs_plan' check (onboarding_status in ('needs_plan','needs_agreement','needs_checkout','needs_brand_brief','completed')),
  billing_status text not null default 'inactive' check (billing_status in ('inactive','active_mock','past_due_mock','canceled_mock')),
  subscription_status text not null default 'none' check (subscription_status in ('none','active_mock','canceled_mock')),
  showcase_permission boolean default true,
  is_demo boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.companies enable row level security;
create policy "Owner can read own company" on public.companies for select using (owner_user_id = auth.uid());
create policy "Owner can update own company" on public.companies for update using (owner_user_id = auth.uid());
create policy "Owner can insert company" on public.companies for insert with check (owner_user_id = auth.uid());
create policy "Admin all companies" on public.companies for all using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- agreements
create table if not exists public.agreements (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  user_id uuid references auth.users(id),
  plan_id uuid references public.plans(id),
  agreement_version text not null default '1.0',
  contract_title text not null,
  contract_body text not null,
  signed_name text not null,
  signed_email text not null,
  accepted_checkbox boolean not null default false,
  showcase_rights_checkbox boolean not null default false,
  signed_at timestamptz default now(),
  ip_address text,
  user_agent text,
  created_at timestamptz default now()
);
alter table public.agreements enable row level security;
create policy "Owner can read own agreements" on public.agreements for select using (user_id = auth.uid());
create policy "Owner can insert agreements" on public.agreements for insert with check (user_id = auth.uid());
create policy "Admin all agreements" on public.agreements for all using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- brand_briefs
create table if not exists public.brand_briefs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade unique,
  company_name text not null,
  website text,
  offer text,
  target_customer text,
  brand_voice text,
  video_styles text,
  examples text,
  notes text,
  assets_url text,
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.brand_briefs enable row level security;
create policy "Owner can manage own brief" on public.brand_briefs for all using (
  exists (select 1 from public.companies c where c.id = company_id and c.owner_user_id = auth.uid())
);
create policy "Admin all briefs" on public.brand_briefs for all using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- content_items
create table if not exists public.content_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  title text not null,
  description text,
  week_label text,
  content_type text,
  media_type text not null default 'video' check (media_type in ('photo','video','carousel','graphic','other')),
  status text not null default 'in_production' check (status in ('in_production','ready_for_review','revision_requested','approved','delivered','archived')),
  file_url text,
  thumbnail_url text,
  file_name text,
  file_size bigint,
  uploaded_by uuid references auth.users(id),
  uploaded_at timestamptz default now(),
  approved_at timestamptz,
  delivered_at timestamptz,
  deleted_at timestamptz,
  can_showcase boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.content_items enable row level security;
create policy "Owner can read own content" on public.content_items for select using (
  exists (select 1 from public.companies c where c.id = company_id and c.owner_user_id = auth.uid())
);
create policy "Owner can update own content" on public.content_items for update using (
  exists (select 1 from public.companies c where c.id = company_id and c.owner_user_id = auth.uid())
);
create policy "Admin all content" on public.content_items for all using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- content_revisions
create table if not exists public.content_revisions (
  id uuid primary key default gen_random_uuid(),
  content_item_id uuid references public.content_items(id) on delete cascade,
  company_id uuid references public.companies(id),
  requested_by uuid references auth.users(id),
  revision_note text not null,
  status text not null default 'open' check (status in ('open','in_progress','completed')),
  created_at timestamptz default now(),
  completed_at timestamptz
);
alter table public.content_revisions enable row level security;
create policy "Owner can manage own revisions" on public.content_revisions for all using (
  exists (select 1 from public.companies c where c.id = company_id and c.owner_user_id = auth.uid())
);
create policy "Admin all revisions" on public.content_revisions for all using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- messages
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  content_item_id uuid references public.content_items(id) on delete set null,
  sender_user_id uuid references auth.users(id),
  sender_role text not null check (sender_role in ('client','admin')),
  message text not null,
  attachment_url text,
  created_at timestamptz default now(),
  read_at timestamptz
);
alter table public.messages enable row level security;
create policy "Owner can manage own messages" on public.messages for all using (
  exists (select 1 from public.companies c where c.id = company_id and c.owner_user_id = auth.uid())
);
create policy "Admin all messages" on public.messages for all using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- client_uploads
create table if not exists public.client_uploads (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  uploaded_by uuid references auth.users(id),
  file_url text not null,
  file_name text not null,
  file_type text,
  file_size bigint,
  upload_category text not null default 'Other',
  title text not null,
  notes text,
  status text not null default 'submitted' check (status in ('submitted','reviewed','used','archived')),
  created_at timestamptz default now(),
  reviewed_at timestamptz,
  archived_at timestamptz
);
alter table public.client_uploads enable row level security;
create policy "Owner can manage own uploads" on public.client_uploads for all using (
  exists (select 1 from public.companies c where c.id = company_id and c.owner_user_id = auth.uid())
);
create policy "Admin all uploads" on public.client_uploads for all using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- billing_records
create table if not exists public.billing_records (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade unique,
  plan_id uuid references public.plans(id),
  billing_status text not null default 'inactive' check (billing_status in ('inactive','active_mock','past_due_mock','canceled_mock')),
  subscription_status text not null default 'none' check (subscription_status in ('none','active_mock','canceled_mock')),
  mock_mode boolean default true,
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.billing_records enable row level security;
create policy "Owner can read own billing" on public.billing_records for select using (
  exists (select 1 from public.companies c where c.id = company_id and c.owner_user_id = auth.uid())
);
create policy "Admin all billing" on public.billing_records for all using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- activity_logs
create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  actor_user_id uuid references auth.users(id),
  actor_role text check (actor_role in ('client','admin')),
  event_type text not null,
  event_message text not null,
  metadata jsonb,
  created_at timestamptz default now()
);
alter table public.activity_logs enable row level security;
create policy "Owner can read own logs" on public.activity_logs for select using (
  exists (select 1 from public.companies c where c.id = company_id and c.owner_user_id = auth.uid())
);
create policy "Anyone can insert logs" on public.activity_logs for insert with check (true);
create policy "Admin all logs" on public.activity_logs for all using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- notifications
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  user_id uuid references auth.users(id),
  title text not null,
  message text not null,
  type text not null default 'info',
  read_at timestamptz,
  created_at timestamptz default now()
);
alter table public.notifications enable row level security;
create policy "User can manage own notifications" on public.notifications for all using (user_id = auth.uid());
create policy "Admin all notifications" on public.notifications for all using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- Seed plans
insert into public.plans (name, slug, price_monthly, videos_per_month, description, is_active) values
  ('Growth', 'growth', 2500, 8, '8 content deliverables per month. Photos + videos included.', true),
  ('Scale', 'scale', 5000, 20, '20 content deliverables per month. Photos + videos included.', true)
on conflict (slug) do nothing;

-- Trigger: auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', coalesce(new.raw_user_meta_data->>'role', 'client'));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
