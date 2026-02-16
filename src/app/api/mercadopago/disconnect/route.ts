import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { userId } = await request.json();

    if (userId !== session.user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = supabaseAdmin() as any;

    // Check for pending withdrawals
    const { data: pendingWithdrawals } = await admin
      .from('withdrawals')
      .select('id')
      .eq('propietario_id', userId)
      .in('estado', ['pendiente', 'procesando']);

    if (pendingWithdrawals && pendingWithdrawals.length > 0) {
      return NextResponse.json(
        {
          error: 'No podés desconectar tu cuenta mientras tenés retiros pendientes',
          pendingCount: pendingWithdrawals.length,
        },
        { status: 400 }
      );
    }

    // Deactivate MP account (DB column is user_id)
    const { error: mpError } = await admin
      .from('mp_accounts_propietarios')
      .update({ is_active: false })
      .eq('user_id', userId);

    if (mpError) {
      console.error('Error deactivating MP account:', mpError);
      return NextResponse.json({ error: 'Error al desconectar' }, { status: 500 });
    }

    // Deactivate associated cuentas_cobro
    const { error: cuentaError } = await admin
      .from('cuentas_cobro')
      .update({ activa: false })
      .eq('propietario_id', userId)
      .eq('tipo', 'mercado_pago')
      .not('mp_account_id', 'is', null);

    if (cuentaError) {
      console.error('Error deactivating cuenta_cobro:', cuentaError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error disconnecting MP:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
