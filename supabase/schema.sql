-- ==============================================================================
-- PERFECT FLOW: Dedicated 'flow' Schema Setup in Supabase
-- ==============================================================================
-- Run this script in your Supabase SQL Editor:
-- (Supabase Dashboard -> Your Project -> SQL Editor -> New Query -> Run)
-- This creates a dedicated 'flow' schema completely isolated from Perfect Call
-- and Whiteboard (Perfect Board).
-- ==============================================================================

-- 1. Create the dedicated schema for Perfect Flow
CREATE SCHEMA IF NOT EXISTS flow;

-- 2. Grant permissions on schema 'flow' to Supabase roles
GRANT USAGE ON SCHEMA flow TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA flow TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA flow TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA flow TO postgres, anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA flow GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA flow GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA flow GRANT ALL ON ROUTINES TO postgres, anon, authenticated, service_role;

-- 3. Create the state table inside schema 'flow'
CREATE TABLE IF NOT EXISTS flow.app_state (
    id TEXT PRIMARY KEY DEFAULT 'current',
    version TEXT NOT NULL DEFAULT '1.0.0',
    last_updated TIMESTAMPTZ NOT NULL DEFAULT now(),
    state_data JSONB NOT NULL
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE flow.app_state ENABLE ROW LEVEL SECURITY;

-- 5. Policies for clinical operations
DROP POLICY IF EXISTS "Allow read access to flow state" ON flow.app_state;
CREATE POLICY "Allow read access to flow state"
    ON flow.app_state FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Allow update access to flow state" ON flow.app_state;
CREATE POLICY "Allow update access to flow state"
    ON flow.app_state FOR ALL
    USING (true)
    WITH CHECK (true);

-- 6. Add flow.app_state to Supabase Realtime publication
-- Broadcasts changes via WebSocket to all 65" touchscreen displays and workstations
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

-- 7. Performance index on last_updated
CREATE INDEX IF NOT EXISTS idx_flow_app_state_updated ON flow.app_state (last_updated DESC);

-- ==============================================================================
-- 8. (Optional Convenience View)
-- Creates a view in the public schema pointing to flow.app_state so that
-- queries work seamlessly even before adding 'flow' to Exposed Schemas in settings.
-- ==============================================================================
CREATE OR REPLACE VIEW public.flow_app_state AS 
    SELECT * FROM flow.app_state;

GRANT SELECT ON public.flow_app_state TO postgres, anon, authenticated, service_role;
