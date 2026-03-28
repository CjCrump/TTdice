-- ═══════════════════════════════════════════
--  TTDice — Supabase Database Schema
--  Run this in your Supabase SQL editor
--  Project > SQL Editor > New Query > Run
-- ═══════════════════════════════════════════

-- Enable UUID extension (usually already enabled)
create extension if not exists "pgcrypto";

-- ─── Sessions table (anonymous, browser-based) ───
create table if not exists sessions (
  id          uuid primary key default gen_random_uuid(),
  browser_id  text not null,           -- localStorage fingerprint
  created_at  timestamptz default now() not null,
  updated_at  timestamptz default now() not null
);

-- ─── Rolls table ───
create table if not exists rolls (
  id               uuid primary key default gen_random_uuid(),
  session_id       uuid references sessions(id) on delete set null,
  dice_notation    text not null,           -- e.g. "2×d6, 1×d20"
  individual_rolls int[] not null,          -- e.g. {3, 5, 14}
  bonus            int default 0,
  total            int not null,
  mode             text default 'normal',   -- 'normal' | 'advantage' | 'disadvantage'
  rolled_at        timestamptz default now() not null
);

-- ─── Presets table (future: saved dice combos) ───
create table if not exists presets (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid references sessions(id) on delete cascade,
  name         text not null,
  notation     text not null,              -- e.g. "2d6+3"
  created_at   timestamptz default now() not null
);

-- ─── Indexes ───
create index if not exists rolls_session_id_idx  on rolls(session_id);
create index if not exists rolls_rolled_at_idx   on rolls(rolled_at desc);
create index if not exists sessions_browser_idx  on sessions(browser_id);

-- ─── Row Level Security (RLS) ───
-- Enable RLS on all tables so the anon key can't read other sessions' data

alter table sessions enable row level security;
alter table rolls     enable row level security;
alter table presets   enable row level security;

-- Allow insert from anon (everyone can log rolls)
create policy "Allow anon insert sessions" on sessions
  for insert to anon with check (true);

create policy "Allow anon insert rolls" on rolls
  for insert to anon with check (true);

create policy "Allow anon insert presets" on presets
  for insert to anon with check (true);

-- Select: only own session rows (optional — remove if you want a public leaderboard)
-- create policy "Allow own session reads" on rolls
--   for select using (session_id = current_setting('app.session_id', true)::uuid);

-- ─── Global stats view (for a future /stats page) ───
create or replace view public.global_stats as
  select
    count(*)                                       as total_rolls,
    sum(array_length(individual_rolls, 1))         as total_dice,
    avg(total)::numeric(8,2)                       as avg_total,
    max(total)                                     as highest_roll,
    min(total)                                     as lowest_roll,
    date_trunc('day', now())                       as as_of
  from rolls;

-- Grant read access to global stats for anon
grant select on public.global_stats to anon;

-- ─── Done! ───
-- After running this, add your Supabase URL and anon key to config.js
-- The app will auto-connect and start logging rolls immediately.