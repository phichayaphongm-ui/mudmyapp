import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { checkRateLimit, getRequestIdentity } from '@/lib/server/rate-limit';

export async function POST(request: Request) {
  try {
    if (!checkRateLimit(`payment-charge:${getRequestIdentity(request, 'unknown')}`, 5, 60_000)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }
    const { amount, email, description, userId, pinId, paymentId } = await request.json();

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'STRIPE_SECRET_KEY is not configured.' },
        { status: 500 }
      );
    }

    if (!userId || !pinId || !paymentId) {
      return NextResponse.json({ error: 'Missing payment details' }, { status: 400 });
    }

    const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');
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

    let user: any = null;
    let authError: any = null;

    if (bearerToken) {
      const authRes = await supabase.auth.getUser(bearerToken);
      user = authRes.data.user;
      authError = authRes.error;
    } else {
      const authRes = await supabase.auth.getUser();
      user = authRes.data.user;
      authError = authRes.error;
    }

    if (authError || !user || user.id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .select('id, user_id, pin_id, amount, status')
      .eq('id', paymentId)
      .eq('user_id', user.id)
      .eq('pin_id', pinId)
      .maybeSingle();

    if (paymentError || !payment) {
      console.error('Payment query error or not found:', paymentError, 'paymentId:', paymentId);
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }
    if (payment.status === 'paid') {
      return NextResponse.json({ error: 'Payment already completed' }, { status: 409 });
    }

    const numericAmount = Number(amount ?? 10);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return NextResponse.json({ error: 'Invalid payment amount' }, { status: 400 });
    }
    if (Math.round(numericAmount * 100) !== Math.round(Number(payment.amount) * 100)) {
      return NextResponse.json({ error: 'Payment amount does not match the payment record' }, { status: 400 });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY.trim());
    const configuredOrigin = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://mudmy.app';
    const origin = configuredOrigin.replace(/\/$/, '');
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: email || undefined,
      line_items: [{
        price_data: {
          currency: 'thb',
          product_data: { name: description || 'Mudmy pin listing' },
          unit_amount: Math.round(numericAmount * 100),
        },
        quantity: 1,
      }],
      metadata: { paymentId, userId, pinId },
      success_url: `${origin}/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/create-pin?payment=cancelled`,
    });

    return NextResponse.json({
      ok: true,
      url: session.url,
      sessionId: session.id,
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Stripe charge API error:', error);
    return NextResponse.json({ error: 'Unable to create payment session' }, { status: 500 });
  }
}
