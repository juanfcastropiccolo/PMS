import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Rutas públicas
  const publicRoutes = ['/auth/login', '/auth/register', '/auth/reset-password'];
  const isPublicRoute = publicRoutes.some((route) => req.nextUrl.pathname.startsWith(route));

  // Si no hay sesión y no es ruta pública, redirigir a login
  if (!session && !isPublicRoute) {
    return NextResponse.redirect(new URL('/auth/login', req.url));
  }

  // 🔒 SEGURIDAD: Verificar roles solo si hay sesión y NO es ruta pública
  // NOTA: Deshabilitado temporalmente porque RLS bloquea la lectura en middleware
  // La verificación de roles se hace en el AuthContext después del login
  /*
  if (session && !isPublicRoute) {
    try {
      const { data: userRoles, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id);

      if (error || !userRoles || userRoles.length === 0) {
        await supabase.auth.signOut();
        const redirectUrl = new URL('/auth/login', req.url);
        redirectUrl.searchParams.set('error', 'no_access');
        return NextResponse.redirect(redirectUrl);
      }
    } catch (err) {
      console.error('Error verificando roles en middleware:', err);
      return NextResponse.redirect(new URL('/auth/login', req.url));
    }
  }
  */

  // Si hay sesión y está en login, redirigir al dashboard
  if (session && req.nextUrl.pathname === '/auth/login') {
    // Verificar rol para redirigir al dashboard correcto
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id);

    const isAdmin = roles?.some((r) => r.role === 'admin' || r.role === 'super_admin');

    return NextResponse.redirect(new URL(isAdmin ? '/admin' : '/dashboard', req.url));
  }

  // Proteger rutas de admin
  if (req.nextUrl.pathname.startsWith('/admin')) {
    if (!session) {
      return NextResponse.redirect(new URL('/auth/login', req.url));
    }

    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id);

    const isAdmin = roles?.some((r) => r.role === 'admin' || r.role === 'super_admin');

    if (!isAdmin) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }

  return res;
}

export const config = {
  // Importante: excluir /api para que funcionen las API routes (ej: /api/auth/check-role)
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|public).*)'],
};

