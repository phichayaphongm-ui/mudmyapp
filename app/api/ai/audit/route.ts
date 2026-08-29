import { NextRequest, NextResponse } from 'next/server';
import { auditUserReadiness } from '@/lib/services/ai';
import type { User, Pin } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { user, pins } = body as { user: User; pins: Pin[] };

    if (!user) {
      console.error('AI Audit API: User data is missing');
      return NextResponse.json({ error: 'User data is required' }, { status: 400 });
    }

    const result = await auditUserReadiness(user, pins || []);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('AI Audit API Error:', error);
    return NextResponse.json({ 
      error: 'Failed to perform AI audit',
      details: error?.message || 'Unknown error'
    }, { status: 500 });
  }
}
