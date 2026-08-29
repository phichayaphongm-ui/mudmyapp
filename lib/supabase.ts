import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check .env.local file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
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
