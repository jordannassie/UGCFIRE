-- UGCFire: Brand Factory tables
-- Safe to run multiple times (uses IF NOT EXISTS / IF NOT EXISTS checks)

-- strategy_runs already exists from migration 002.
-- Add approval/factory columns if not already present.
alter table public.strategy_runs
  add column if not exists approved_at timestamptz,
  add column if not exists setup_level text,
  add column if not exists selected_idea_count text,
  add column if not exists selected_commercial_style text,
  add column if not exists selected_production_type text,
  add column if not exists confidence_label text;
