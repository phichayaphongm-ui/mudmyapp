'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

function CallbackInner() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function handleCallback() {
      try {
        const hash = window.location.hash || '';
        const params = new URLSearchParams(window.location.search);

        if (hash.includes('access_token') || params.has('code')) {
          const { error: sessionError } = await supabase.auth.getSession();
          if (sessionError && !cancelled) {
            console.warn('Auth session parse warning:', sessionError.message);
          }
        }

        const next = params.get('next') || '/dashboard';
        const err = params.get('error');
        const errDesc = params.get('error_description');

        if (err && !cancelled) {
          setError(errDesc || err);
          setTimeout(() => router.replace('/login'), 2500);
          return;
        }

        if (!cancelled) {
          router.replace(next);
        }
      } catch (e: any) {
        if (!cancelled) {
          console.error('OAuth callback error:', e);
          setError(e?.message || 'OAuth callback failed');
          setTimeout(() => router.replace('/login'), 2500);
        }
      }
    }

    handleCallback();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-orange-50 via-white to-amber-50 p-6">
      <div className="w-full max-w-md rounded-3xl border border-white/70 bg-white/80 backdrop-blur-sm p-8 shadow-[0_20px_60px_rgba(0,0,0,0.08)] text-center space-y-5">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-200">
          {error ? (
            <span className="text-white text-2xl font-black">!</span>
          ) : (
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          )}
        </div>
        <div className="space-y-1">
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            {error ? 'เกิดข้อผิดพลาด' : 'กำลังเข้าสู่ระบบ...'}
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            {error
              ? `Error: ${error}. กำลังกลับไปหน้า Login อัตโนมัติ`
              : 'กำลังตรวจสอบข้อมูลจาก Google และเตรียมเข้าสู่ระบบให้กับคุณ'}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-amber-50">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
      </div>
    }>
      <CallbackInner />
    </Suspense>
  );
}
