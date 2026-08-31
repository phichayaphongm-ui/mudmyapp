import { NextResponse } from 'next/server';
import { buildOmisePromptpaySource } from '@/lib/omise';

const omiseApiUrl = 'https://api.omise.co';

export async function POST(request: Request) {
  try {
    const { amount, email, description, name, phone, userId, pinId } = await request.json();

    if (!process.env.OMISE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'OMISE_SECRET_KEY is not configured. Please add your Omise secret key in environment variables.' },
        { status: 500 }
      );
    }

    const numericAmount = Number(amount ?? 10);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return NextResponse.json({ error: 'Invalid payment amount' }, { status: 400 });
    }

    const sourcePayload = buildOmisePromptpaySource({
      amount: numericAmount,
      description: description || 'Mudmy pin payment',
      email,
      phone,
      name,
    });

    const secretKey = process.env.OMISE_SECRET_KEY.trim();

    const response = await fetch(`${omiseApiUrl}/sources`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`,
        'Content-Type': 'application/json',
        'Omise-Version': process.env.OMISE_API_VERSION || '2019-05-29',
      },
      body: JSON.stringify(sourcePayload),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data?.message || 'Omise source creation failed' },
        { status: response.status || 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      source: data,
      userId,
      pinId,
      amount: numericAmount,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
