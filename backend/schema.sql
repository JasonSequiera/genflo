-- ══════════════════════════════════════════════════
-- GenFlo — Supabase Database Schema
-- Run this ENTIRE file in Supabase → SQL Editor → New Query
-- ══════════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Profiles ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY,  -- matches Supabase auth.users id
  name TEXT NOT NULL,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Cycles ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cycles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  cycle_length INT DEFAULT 28,
  period_length INT DEFAULT 5,
  conditions TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ── Daily Logs ────────────────────────────────────
CREATE TABLE IF NOT EXISTS daily_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  log_date DATE DEFAULT CURRENT_DATE,
  mood TEXT,
  energy INT CHECK (energy BETWEEN 1 AND 10),
  oiliness INT CHECK (oiliness BETWEEN 0 AND 100),
  hydration INT CHECK (hydration BETWEEN 0 AND 100),
  sensitivity INT CHECK (sensitivity BETWEEN 0 AND 100),
  breakouts INT CHECK (breakouts BETWEEN 0 AND 10),
  symptoms TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, log_date)
);

-- ── Supplement Logs ───────────────────────────────
CREATE TABLE IF NOT EXISTS supplement_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  log_date DATE DEFAULT CURRENT_DATE,
  supplement TEXT NOT NULL,
  time_of_day TEXT CHECK (time_of_day IN ('am', 'pm')),
  taken BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, log_date, supplement)
);

-- ── Partners ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS partners (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  partner_name TEXT,
  partner_email TEXT,
  calendar_token TEXT,
  schedule JSONB DEFAULT '[]',
  visibility JSONB DEFAULT '{
    "show_phase": true,
    "show_mood": true,
    "show_energy": true,
    "show_symptoms": false,
    "show_skin": false
  }',
  connected BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ── Nudges ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS nudges (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_email TEXT,
  message TEXT NOT NULL,
  mood TEXT,
  read BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Saved Dates ───────────────────────────────────
CREATE TABLE IF NOT EXISTS saved_dates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  score FLOAT,
  tags TEXT[] DEFAULT '{}',
  jamie_tip TEXT,
  when_suggestion TEXT,
  where_suggestion TEXT,
  planned BOOLEAN DEFAULT FALSE,
  planned_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Aria Messages ─────────────────────────────────
CREATE TABLE IF NOT EXISTS aria_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('user', 'aria')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════════════
-- Row Level Security (RLS) — users only see their own data
-- ══════════════════════════════════════════════════
ALTER TABLE profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE cycles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplement_logs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE partners         ENABLE ROW LEVEL SECURITY;
ALTER TABLE nudges           ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_dates      ENABLE ROW LEVEL SECURITY;
ALTER TABLE aria_messages    ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/update their own
CREATE POLICY "profiles_own" ON profiles FOR ALL USING (auth.uid() = id);

-- Cycles: users manage their own
CREATE POLICY "cycles_own" ON cycles FOR ALL USING (auth.uid() = user_id);

-- Logs: users manage their own
CREATE POLICY "logs_own" ON daily_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "supplements_own" ON supplement_logs FOR ALL USING (auth.uid() = user_id);

-- Partners: users manage their own
CREATE POLICY "partners_own" ON partners FOR ALL USING (auth.uid() = user_id);

-- Nudges: senders can see their nudges
CREATE POLICY "nudges_sender" ON nudges FOR ALL USING (auth.uid() = sender_id);

-- Saved dates: users manage their own
CREATE POLICY "dates_own" ON saved_dates FOR ALL USING (auth.uid() = user_id);

-- Aria messages: users manage their own
CREATE POLICY "aria_own" ON aria_messages FOR ALL USING (auth.uid() = user_id);

-- ══════════════════════════════════════════════════
-- Done! Your GenFlo database is ready 🌿
-- ══════════════════════════════════════════════════
