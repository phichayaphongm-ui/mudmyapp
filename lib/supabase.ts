import { createClient } from '@supabase/supabase-js';

// Strip BOM and whitespace that may appear in Vercel env vars
const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/^\uFEFF/, '').trim();
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').replace(/^\uFEFF/, '').trim();

if (!supabaseUrl || !supabaseAnonKey) {
  // Warn instead of throw — throwing crashes static page generation at build time
  console.warn('[Supabase] Missing environment variables: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

// Use placeholder values during build if env vars are missing to avoid crash
const _url = supabaseUrl || 'https://placeholder.supabase.co';
const _key = supabaseAnonKey || 'placeholder_key';

export const supabase = createClient(_url, _key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
  global: {
    headers: {
      'X-Client-Info': 'mudmy-web',
    },
  },
  db: {
    schema: 'public',
  },
  // Add retry logic for connection errors
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

const connectionClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
    storageKey: 'mudmy-health-check',
  },
  global: {
    headers: {
      'X-Client-Info': 'mudmy-web-health-check',
    },
  },
  db: {
    schema: 'public',
  },
});

// Health check function
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    // Do not let a stale persisted user session affect the connectivity check.
    const { error } = await connectionClient.from('users').select('count').limit(1);
    if (error) {
      console.error('Supabase connection error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Supabase connection check failed:', err);
    return false;
  }
}
