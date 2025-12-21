import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    console.log('🔍 [API] check-role recibió userId:', userId);

    if (!userId) {
      console.error('❌ [API] No se proporcionó userId');
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Usar supabaseAdmin para bypass RLS
    const admin = supabaseAdmin();
    
    console.log('📡 [API] Consultando user_roles con admin client...');
    
    const { data: roles, error } = await admin
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    if (error) {
      console.error('❌ [API] Error fetching roles:', error);
      return NextResponse.json({ roles: [] }, { status: 200 });
    }

    const rolesList = roles?.map((r) => r.role) || [];

    console.log('✅ [API] Roles encontrados:', rolesList);

    return NextResponse.json({ roles: rolesList }, { status: 200 });
  } catch (error) {
    console.error('❌ [API] Error in check-role API:', error);
    return NextResponse.json({ roles: [] }, { status: 200 });
  }
}

