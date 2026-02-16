import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code || !state) {
      return NextResponse.redirect(new URL('/dashboard/cobros?mp_linked=error', env.app.url));
    }

    // Decode state to get userId
    let userId: string;
    try {
      const decoded = JSON.parse(Buffer.from(state, 'base64url').toString());
      userId = decoded.userId;
    } catch {
      return NextResponse.redirect(new URL('/dashboard/cobros?mp_linked=error', env.app.url));
    }

    if (!userId) {
      return NextResponse.redirect(new URL('/dashboard/cobros?mp_linked=error', env.app.url));
    }

    const { clientId, clientSecret, redirectUri } = env.mercadoPago;

    // Exchange code for tokens
    const tokenResponse = await fetch('https://api.mercadopago.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      console.error('MP token exchange failed:', await tokenResponse.text());
      return NextResponse.redirect(new URL('/dashboard/cobros?mp_linked=error', env.app.url));
    }

    const tokenData = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = tokenData;

    // Get MP user info
    const userResponse = await fetch('https://api.mercadopago.com/users/me', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!userResponse.ok) {
      console.error('MP user info failed:', await userResponse.text());
      return NextResponse.redirect(new URL('/dashboard/cobros?mp_linked=error', env.app.url));
    }

    const mpUser = await userResponse.json();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = supabaseAdmin() as any;

    // Upsert in mp_accounts_propietarios
    const { data: mpAccount, error: mpError } = await admin
      .from('mp_accounts_propietarios')
      .upsert(
        {
          propietario_id: userId,
          mp_user_id: String(mpUser.id),
          mp_email: mpUser.email,
          access_token,
          refresh_token,
          token_expires_at: new Date(Date.now() + expires_in * 1000).toISOString(),
          is_active: true,
        },
        { onConflict: 'propietario_id' }
      )
      .select('id')
      .single();

    if (mpError) {
      console.error('Error saving MP account:', mpError);
      return NextResponse.redirect(new URL('/dashboard/cobros?mp_linked=error', env.app.url));
    }

    // Upsert corresponding cuenta_cobro
    const { error: cuentaError } = await admin.from('cuentas_cobro').upsert(
      {
        propietario_id: userId,
        tipo: 'mercado_pago',
        mp_email: mpUser.email,
        mp_account_id: mpAccount.id,
        verificada: true,
        activa: true,
        es_principal: true,
      },
      { onConflict: 'mp_account_id' }
    );

    if (cuentaError) {
      console.error('Error saving cuenta_cobro:', cuentaError);
    }

    return NextResponse.redirect(new URL('/dashboard/cobros?mp_linked=success', env.app.url));
  } catch (error) {
    console.error('Error in MP callback:', error);
    return NextResponse.redirect(new URL('/dashboard/cobros?mp_linked=error', env.app.url));
  }
}
