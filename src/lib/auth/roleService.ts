import { supabase } from '@/lib/supabaseClient';

export type UserRole = 'propietario' | 'admin' | 'super_admin';

export interface UserRoleData {
  id: string;
  user_id: string;
  role: UserRole;
  permissions: unknown[];
  asignado_at: string;
}

/**
 * Verifica si el usuario tiene un rol válido en el sistema PMS
 */
export async function getUserRole(userId: string): Promise<UserRoleData | null> {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching user role:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getUserRole:', error);
    return null;
  }
}

/**
 * Verifica si el usuario tiene permiso para acceder al PMS
 */
export async function hasAccessToPMS(userId: string): Promise<boolean> {
  const role = await getUserRole(userId);
  return role !== null;
}

/**
 * Verifica si el usuario es super admin
 */
export async function isSuperAdmin(userId: string): Promise<boolean> {
  const role = await getUserRole(userId);
  return role?.role === 'super_admin';
}

/**
 * Verifica si el usuario es admin (incluye super_admin)
 */
export async function isAdmin(userId: string): Promise<boolean> {
  const role = await getUserRole(userId);
  return role?.role === 'admin' || role?.role === 'super_admin';
}

/**
 * Verifica si el usuario es propietario
 */
export async function isPropietario(userId: string): Promise<boolean> {
  const role = await getUserRole(userId);
  return role?.role === 'propietario';
}

