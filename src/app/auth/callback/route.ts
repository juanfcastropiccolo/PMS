import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Database } from '@/types/database';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');

  if (error) {
    return NextResponse.redirect(requestUrl.origin + '/auth/login?error=oauth_failed');
  }

  if (code) {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) {
      return NextResponse.redirect(requestUrl.origin + '/auth/login?error=oauth_failed');
    }
  } else {
    return NextResponse.redirect(requestUrl.origin + '/auth/login');
  }

  return NextResponse.redirect(requestUrl.origin + '/dashboard');
}

