import { NextRequest, NextResponse } from 'next/server';
import { auditUserReadiness } from '@/lib/services/ai';
import type { User, Pin } from '@/lib/types';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { checkRateLimit, getRequestIdentity } from '@/lib/server/rate-limit';

export async function POST(req: NextRequest) {
  try {
    if (!checkRateLimit(`ai-audit:${getRequestIdentity(req, 'unknown')}`, 5, 60_000)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }
    const contentLength = Number(req.headers.get('content-length') || 0);
    if (contentLength > 256 * 1024) {
      return NextResponse.json({ error: 'Request body is too large' }, { status: 413 });
    }
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7).trim() : null;

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookiesToSet) => cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
        },
      },
    );
    const { data: { user: authUser }, error: authError } = bearerToken
      ? await supabase.auth.getUser(bearerToken)
      : await supabase.auth.getUser();
    if (authError || !authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();

    const { user, pins } = body as { user: User; pins: Pin[] };

    if (!user || user.id !== authUser.id) {
      console.error('AI Audit API: User data is missing');
      return NextResponse.json({ error: 'Invalid user data' }, { status: 400 });
    }

    const ownedPins = Array.isArray(pins)
      ? pins.filter((pin) => pin && pin.ownerId === authUser.id).slice(0, 100)
      : [];

    const result = await auditUserReadiness(user, ownedPins);
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error: any) {
    console.error('AI Audit API Error:', error);
    return NextResponse.json({ error: 'Failed to perform AI audit' }, { status: 500 });
  }
}
