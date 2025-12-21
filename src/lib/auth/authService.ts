import { supabase } from '@/lib/supabaseClient';

export interface User {
  id: string;
  email: string;
  roles: ('propietario' | 'admin' | 'super_admin')[];
  metadata: {
    nombre?: string;
    telefono?: string;
    foto_perfil?: string;
    [key: string]: any;
  };
}

export const authService = {
  // Login
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // Obtener roles del usuario
    const roles = await this.getUserRoles(data.user.id);

    return {
      user: data.user,
      session: data.session,
      roles,
    };
  },

  // Logout
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Obtener usuario actual
  async getCurrentUser(): Promise<User | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const roles = await this.getUserRoles(user.id);

    return {
      id: user.id,
      email: user.email!,
      roles,
      metadata: user.user_metadata,
    };
  },

  // Obtener roles del usuario (usando API route con service role)
  async getUserRoles(userId: string): Promise<('propietario' | 'admin' | 'super_admin')[]> {
    try {
      console.log('📞 [authService] Llamando a /api/auth/check-role con userId:', userId);
      
      // Llamar a la API route que usa service role para bypass RLS
      const response = await fetch('/api/auth/check-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      console.log('📡 [authService] Response status:', response.status);

      if (!response.ok) {
        console.error('❌ [authService] Error fetching roles from API:', response.statusText);
        return [];
      }

      const result = await response.json();
      console.log('📦 [authService] Response data:', result);
      
      const { roles } = result;
      console.log('✅ [authService] Roles finales:', roles);
      
      return roles || [];
    } catch (error) {
      console.error('❌ [authService] Error fetching roles:', error);
      return [];
    }
  },

  // Verificar si es admin
  async isAdmin(userId: string): Promise<boolean> {
    const roles = await this.getUserRoles(userId);
    return roles.includes('admin') || roles.includes('super_admin');
  },

  // Registro (solo propietarios)
  async signUp(email: string, password: string, metadata: any) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });

    if (error) throw error;

    // Asignar rol de propietario por defecto
    if (data.user) {
      const { error: roleError } = await supabase.from('user_roles').insert({
        user_id: data.user.id,
        role: 'propietario',
        permissions: [],
        asignado_at: new Date().toISOString(),
      });

      if (roleError) {
        console.error('Error assigning default role:', roleError);
      }
    }

    return data;
  },

  // Resetear contraseña
  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) throw error;
  },

  // Actualizar contraseña
  async updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;
  },

  // Actualizar perfil
  async updateProfile(metadata: any) {
    const { error } = await supabase.auth.updateUser({
      data: metadata,
    });

    if (error) throw error;
  },
};

