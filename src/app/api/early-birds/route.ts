import { NextResponse } from 'next/server';
import type { Database } from '@/types/database';
import { supabaseAdmin } from '@/lib/supabase';

type EarlyBirdInsert = Database['public']['Tables']['early_birds']['Insert'];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, nombre_apellido, telefono } = body;

    if (!nombre_apellido || typeof nombre_apellido !== 'string' || nombre_apellido.trim().length < 2) {
      return NextResponse.json({ error: 'El nombre y apellido es requerido (mínimo 2 caracteres)' }, { status: 400 });
    }

    if (!telefono || typeof telefono !== 'string' || !/^[\d+\s\-()]+$/.test(telefono.trim())) {
      return NextResponse.json({ error: 'El teléfono es requerido y solo puede contener dígitos, +, espacios o guiones' }, { status: 400 });
    }

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'El email es requerido' }, { status: 400 });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'El formato del email no es válido' }, { status: 400 });
    }

    const admin = supabaseAdmin();
    const row: EarlyBirdInsert = {
      email: email.toLowerCase().trim(),
      nombre_apellido: nombre_apellido.trim(),
      telefono: telefono.trim(),
    };
    // Cast necesario: la versión de supabase-js no infiere bien esta tabla desde Database
    const { error } = await admin.from('early_birds').insert(row as never);

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
