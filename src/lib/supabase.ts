import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Dedicated table and schema configuration
// Defaults to 'public' schema with table 'flow_app_state' (zero-config in Supabase Dashboard)
export const FLOW_SCHEMA = process.env.NEXT_PUBLIC_SUPABASE_SCHEMA || process.env.SUPABASE_FLOW_SCHEMA || 'public';
export const FLOW_TABLE = process.env.NEXT_PUBLIC_SUPABASE_TABLE || process.env.SUPABASE_FLOW_TABLE || (FLOW_SCHEMA === 'public' ? 'flow_app_state' : 'app_state');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && (supabaseAnonKey || supabaseServiceKey)
);

let serverClient: SupabaseClient<any, any, any> | null = null;

export function getSupabaseServerClient(): SupabaseClient<any, any, any> | null {
  if (!isSupabaseConfigured) return null;

  if (!serverClient) {
    const key = supabaseServiceKey || supabaseAnonKey;
    serverClient = createClient(supabaseUrl, key, {
      ...(FLOW_SCHEMA !== 'public' ? { db: { schema: FLOW_SCHEMA } } : {}),
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return serverClient;
}

let browserClient: SupabaseClient<any, any, any> | null = null;

export function getBrowserSupabase(): SupabaseClient<any, any, any> | null {
  if (typeof window === 'undefined') return null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return null;

  if (!browserClient) {
    browserClient = createClient(url, key, {
      ...(FLOW_SCHEMA !== 'public' ? { db: { schema: FLOW_SCHEMA } } : {}),
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
  }

  return browserClient;
}
