import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');
    const pinId = searchParams.get('pin_id');

    const stripeSecretKey = (process.env.STRIPE_SECRET_KEY || '').trim();
    if (!stripeSecretKey) {
      return NextResponse.json({ error: 'STRIPE_SECRET_KEY is not configured' }, { status: 500 });
    }

    const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7).trim() : null;

    const cookieStore = await cookies();
    const supabaseUserClient = createServerClient(
      (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim(),
      (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim(),
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookiesToSet) => cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
        },
      },
    );

    let user: any = null;
    if (bearerToken) {
      const authRes = await supabaseUserClient.auth.getUser(bearerToken);
      user = authRes.data.user;
    } else {
      const authRes = await supabaseUserClient.auth.getUser();
      user = authRes.data.user;
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stripe = new Stripe(stripeSecretKey);
    let session: Stripe.Checkout.Session | null = null;

    if (sessionId) {
      session = await stripe.checkout.sessions.retrieve(sessionId);
    } else if (pinId) {
      // Find session by searching recent checkout sessions or database payment record
      const supabaseAdmin = getSupabaseAdmin();
      const { data: paymentRecord } = await supabaseAdmin
        .from('payments')
        .select('stripe_session_id, id')
        .eq('pin_id', pinId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (paymentRecord?.stripe_session_id) {
        session = await stripe.checkout.sessions.retrieve(paymentRecord.stripe_session_id);
      } else {
        // Search Stripe for sessions matching pinId
        const recentSessions = await stripe.checkout.sessions.list({ limit: 20 });
        session = recentSessions.data.find(
          (s) => s.metadata?.pinId === pinId && s.metadata?.userId === user.id
        ) || null;
      }
    }

    if (!session) {
      return NextResponse.json({ ok: false, message: 'No checkout session found' }, { status: 200 });
    }

    if (session.payment_status !== 'paid') {
      return NextResponse.json({ ok: false, message: 'Payment is not paid yet' }, { status: 200 });
    }

    const targetPaymentId = session.metadata?.paymentId;
    const targetPinId = session.metadata?.pinId || pinId;
    const targetUserId = session.metadata?.userId || user.id;

    if (targetUserId !== user.id || !targetPinId) {
      return NextResponse.json({ error: 'Session metadata mismatch' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // 1. Update Payment Status
    if (targetPaymentId) {
      await supabaseAdmin
        .from('payments')
        .update({
          status: 'paid',
          method: 'stripe',
          stripe_session_id: session.id,
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', targetPaymentId);
    } else {
      await supabaseAdmin
        .from('payments')
        .update({
          status: 'paid',
          method: 'stripe',
          stripe_session_id: session.id,
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('pin_id', targetPinId)
        .eq('user_id', user.id);
    }

    // 2. Update Pin Status to active
    const { data: currentPin } = await supabaseAdmin
      .from('pins')
      .select('status')
      .eq('id', targetPinId)
      .eq('owner_id', user.id)
      .maybeSingle();

    if (currentPin && currentPin.status !== 'active') {
      await supabaseAdmin
        .from('pins')
        .update({
          status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', targetPinId)
        .eq('owner_id', user.id);

      // 3. Increment User Active Pins
      const { data: userData } = await supabaseAdmin
        .from('users')
        .select('active_pins')
        .eq('id', user.id)
        .maybeSingle();

      if (userData) {
        await supabaseAdmin
          .from('users')
          .update({ active_pins: (userData.active_pins || 0) + 1 })
          .eq('id', user.id);
      }
    }

    return NextResponse.json({
      ok: true,
      pinId: targetPinId,
      status: 'active',
      message: 'Payment verified and pin activated successfully',
    });
  } catch (error) {
    console.error('Error verifying payment session:', error);
    return NextResponse.json({ error: 'Failed to verify session' }, { status: 500 });
  }
}
