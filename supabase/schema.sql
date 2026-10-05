-- ==============================================================================
-- PERFECT FLOW: Supabase PostgreSQL Schema & Realtime Setup
-- ==============================================================================
-- Run this script in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)
-- This creates the isolated table for Perfect Flow so it NEVER conflicts with 
-- Perfect Call or Whiteboard (Perfect Board) tables.
-- ==============================================================================

-- 1. Create table in public schema: public.flow_app_state
-- (Prefixing with flow_ ensures zero conflicts with other apps in the database)
CREATE TABLE IF NOT EXISTS public.flow_app_state (
    id TEXT PRIMARY KEY DEFAULT 'current',
    version TEXT NOT NULL DEFAULT '1.0.0',
    last_updated TIMESTAMPTZ NOT NULL DEFAULT now(),
    state_data JSONB NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.flow_app_state ENABLE ROW LEVEL SECURITY;

-- 3. Create Policies for Access
DROP POLICY IF EXISTS "Allow read access to flow_app_state" ON public.flow_app_state;
CREATE POLICY "Allow read access to flow_app_state"
    ON public.flow_app_state FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Allow update access to flow_app_state" ON public.flow_app_state;
CREATE POLICY "Allow update access to flow_app_state"
    ON public.flow_app_state FOR ALL
    USING (true)
    WITH CHECK (true);

-- 4. Enable Supabase Realtime Publication
-- Broadcasts state updates instantly via WebSocket to all connected 
-- 65" touchscreen monitors, desktop workstations, and mobile devices
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
          AND schemaname = 'public' 
          AND tablename = 'flow_app_state'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.flow_app_state;
    END IF;
END $$;

-- 5. Fast index on last_updated
CREATE INDEX IF NOT EXISTS idx_public_flow_app_state_updated ON public.flow_app_state (last_updated DESC);

-- ==============================================================================
-- (Optional) Dedicated 'flow' Schema: flow.app_state
-- If you configured SUPABASE_FLOW_SCHEMA=flow and SUPABASE_FLOW_TABLE=app_state:
-- ==============================================================================
CREATE SCHEMA IF NOT EXISTS flow;

CREATE TABLE IF NOT EXISTS flow.app_state (
    id TEXT PRIMARY KEY DEFAULT 'current',
    version TEXT NOT NULL DEFAULT '1.0.0',
    last_updated TIMESTAMPTZ NOT NULL DEFAULT now(),
    state_data JSONB NOT NULL
);

ALTER TABLE flow.app_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read access to flow state" ON flow.app_state;
CREATE POLICY "Allow read access to flow state"
    ON flow.app_state FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Allow update access to flow state" ON flow.app_state;
CREATE POLICY "Allow update access to flow state"
    ON flow.app_state FOR ALL
    USING (true)
    WITH CHECK (true);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
          AND schemaname = 'flow' 
          AND tablename = 'app_state'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE flow.app_state;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_flow_app_state_updated ON flow.app_state (last_updated DESC);
