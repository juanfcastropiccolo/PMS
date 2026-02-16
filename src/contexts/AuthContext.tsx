'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authService, User } from '@/lib/auth/authService';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isPropietario: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Error loading user:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { user: authUser, roles } = await authService.signIn(email, password);

      console.log('🔐 Login exitoso:', { email: authUser.email, roles });

      // 🔒 SEGURIDAD: Verificar que el usuario tenga un rol válido
      if (!roles || roles.length === 0) {
        console.error('❌ Usuario sin roles:', authUser.email);
        await authService.signOut(); // Cerrar sesión automáticamente
        throw new Error(
          'No tienes permisos para acceder al PMS. Este sistema es exclusivo para propietarios de estacionamientos registrados. Por favor, contacta al administrador para solicitar acceso.'
        );
      }

      const userData: User = {
        id: authUser.id,
        email: authUser.email!,
        roles,
        metadata: authUser.user_metadata,
      };

      setUser(userData);

      console.log('✅ Usuario autenticado:', userData);

      // Redirigir según rol
      const isAdmin = roles.includes('admin') || roles.includes('super_admin');
      router.push(isAdmin ? '/admin' : '/dashboard');
    } catch (error) {
      console.error('❌ Error en signIn:', error);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      await authService.signInWithGoogle();
    } catch (error) {
      console.error('❌ Error en signInWithGoogle:', error);
      throw error;
    }
  };

  const signOut = async () => {
    await authService.signOut();
    setUser(null);
    router.push('/auth/login');
  };

  const refreshUser = async () => {
    await loadUser();
  };

  const isAdmin = user?.roles.includes('admin') || user?.roles.includes('super_admin') || false;
  const isPropietario = user?.roles.includes('propietario') || false;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signInWithGoogle,
        signOut,
        isAdmin,
        isPropietario,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

