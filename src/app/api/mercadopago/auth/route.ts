import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { env } from '@/lib/env';

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.redirect(new URL('/auth/login', env.app.url));
    }

    const { clientId, redirectUri } = env.mercadoPago;

    if (!clientId) {
      console.error('MP_CLIENT_ID not configured');
      return NextResponse.redirect(new URL('/dashboard/cobros?mp_linked=error', env.app.url));
    }

    // Encode user ID in state for security
    const state = Buffer.from(JSON.stringify({ userId: session.user.id })).toString('base64url');

    const authUrl = new URL('https://auth.mercadopago.com.ar/authorization');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('state', state);

    return NextResponse.redirect(authUrl.toString());
  } catch (error) {
    console.error('Error initiating MP OAuth:', error);
    return NextResponse.redirect(new URL('/dashboard/cobros?mp_linked=error', env.app.url));
  }
}
