import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = supabaseAdmin() as any;

    // DB column is user_id (from original vendedores table, never renamed)
    const { data, error } = await admin
      .from('mp_accounts_propietarios')
      .select('id, user_id, mp_user_id, mp_email, is_active, token_expires_at, created_at')
      .eq('user_id', session.user.id)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching MP account:', error);
      return NextResponse.json({ error: 'Error al consultar cuenta MP' }, { status: 500 });
    }

    // Normalize for frontend: map user_id to propietario_id
    let account = null;
    if (data) {
      account = {
        ...data,
        propietario_id: data.user_id,
      };
    }

    return NextResponse.json({ account });
  } catch (error) {
    console.error('Error in MP account route:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
