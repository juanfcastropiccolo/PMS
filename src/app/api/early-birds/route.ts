import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'El email es requerido' }, { status: 400 });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'El formato del email no es válido' }, { status: 400 });
    }

    const admin = supabaseAdmin();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (admin.from('early_birds') as any).insert({ email: email.toLowerCase().trim() });

    if (error) {
      // Duplicado (UNIQUE constraint)
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Este email ya está registrado. ¡Te avisaremos cuando lancemos!' },
          { status: 409 }
        );
      }
      console.error('Error insertando early bird:', error);
      return NextResponse.json({ error: 'Error al registrar el email' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Error procesando la solicitud' }, { status: 500 });
  }
}
