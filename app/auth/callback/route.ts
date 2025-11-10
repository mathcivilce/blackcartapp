import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const token_hash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type');
  const next = requestUrl.searchParams.get('next') || '/reset-password';

  console.log('🔐 Auth Callback:', { token_hash: token_hash?.substring(0, 10) + '...', type, next });

  // Create Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  if (token_hash && type) {
    try {
      // Verify the OTP token with proper type
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash,
        type: 'recovery' as any, // Force recovery type for password reset
      });

      console.log('🔐 Verify OTP result:', { 
        hasSession: !!data?.session, 
        hasUser: !!data?.user,
        error: error?.message 
      });

      if (error) {
        console.error('❌ Verification error:', error);
        const errorUrl = new URL('/login', request.url);
        errorUrl.searchParams.set('error', error.message || 'Invalid or expired reset link');
        return NextResponse.redirect(errorUrl);
      }

      if (data.session) {
        // Set session cookies
        const cookieStore = await cookies();
        cookieStore.set('sb-access-token', data.session.access_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7, // 7 days
          path: '/',
        });

        cookieStore.set('sb-refresh-token', data.session.refresh_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7, // 7 days
          path: '/',
        });

        console.log('✅ Session cookies set, redirecting to:', next);
        // Redirect to reset password page
        return NextResponse.redirect(new URL(next, request.url));
      }
    } catch (err) {
      console.error('❌ Callback error:', err);
    }
  }

  // If verification failed, redirect to login with error
  console.log('❌ Verification failed, redirecting to login');
  const errorUrl = new URL('/login', request.url);
  errorUrl.searchParams.set('error', 'Invalid or expired reset link');
  return NextResponse.redirect(errorUrl);
}

