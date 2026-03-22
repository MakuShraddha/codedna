-- ============================================================
--  CodeDNA — Supabase Schema
--  Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── Scans table ──────────────────────────────────────────────
create table if not exists public.scans (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid references auth.users(id) on delete cascade,
  title         text,

  -- Code A
  code_a        text not null,
  language_a    text,
  features_a    jsonb,          -- { vector: [], lines: N, complexity: '...' }
  fingerprint_a text,

  -- Code B (null for single scans)
  code_b        text,
  language_b    text,
  features_b    jsonb,
  fingerprint_b text,

  -- Comparison result
  similarity    integer,         -- 0–100
  label         text,
  breakdown     jsonb,           -- array of { feature, a, b, diff }

  -- Metadata
  is_comparison boolean default false,
  created_at    timestamptz default now()
);

-- Row Level Security — users only see their own scans
alter table public.scans enable row level security;

create policy "Users can read own scans"
  on public.scans for select
  using (auth.uid() = user_id);

create policy "Users can insert own scans"
  on public.scans for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own scans"
  on public.scans for delete
  using (auth.uid() = user_id);

-- Index for fast lookup
create index if not exists scans_user_id_idx on public.scans(user_id);
create index if not exists scans_created_at_idx on public.scans(created_at desc);

-- ── Public anonymous scans (no login required) ──────────────
-- These are auto-cleaned after 24h by a cron job (optional)
create table if not exists public.anon_scans (
  id            uuid primary key default uuid_generate_v4(),
  session_id    text,            -- random client-side ID

  code_a        text not null,
  language_a    text,
  features_a    jsonb,
  fingerprint_a text,

  code_b        text,
  language_b    text,
  features_b    jsonb,
  fingerprint_b text,

  similarity    integer,
  label         text,
  is_comparison boolean default false,
  created_at    timestamptz default now()
);

-- Anyone can insert/read anonymous scans
alter table public.anon_scans enable row level security;

create policy "Anyone can insert anon scans"
  on public.anon_scans for insert
  with check (true);

create policy "Anyone can read anon scans by session"
  on public.anon_scans for select
  using (true);
