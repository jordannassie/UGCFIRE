-- 003_pricing_update.sql
-- Adds yearly pricing, Enterprise plan, and billing_interval support

-- Extend plans table
alter table public.plans
  add column if not exists yearly_price integer,
  add column if not exists sales_only boolean not null default false,
  add column if not exists sort_order integer not null default 0;

-- Extend billing_records with interval + cancel_at_period_end
alter table public.billing_records
  add column if not exists billing_interval text check (billing_interval in ('monthly', 'yearly')),
  add column if not exists cancel_at_period_end boolean not null default false;

-- Update existing plans with yearly prices and sort order
update public.plans set yearly_price = 24000, sort_order = 1 where slug = 'growth';
update public.plans set yearly_price = 48000, sort_order = 2 where slug = 'scale';

-- Seed Enterprise plan (sales-only, no self-serve checkout)
insert into public.plans (name, slug, price_monthly, yearly_price, videos_per_month, description, sales_only, sort_order, is_active)
values (
  'Enterprise',
  'enterprise',
  0,
  null,
  0,
  'Custom content volume for brands that need more. Dedicated creative strategist, custom workflows, and priority support.',
  true,
  3,
  true
)
on conflict (slug) do update set
  sales_only = true,
  sort_order = 3,
  description = excluded.description;
