'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getTenantSession } from '@/lib/supabase/tenant-client';
import { AuthContextType, Empresa, Perfil } from '@/lib/supabase/types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  const refreshSession = useCallback(async () => {
    try {
      const session = await getTenantSession(supabase);
      if (session) {
        setUser(session.user);
        setPerfil(session.perfil);
        setEmpresa(session.empresa);
      } else {
        setUser(null);
        setPerfil(null);
        setEmpresa(null);
      }
    } catch (err) {
      console.error('Failed to load active tenant session:', err);
      setUser(null);
      setPerfil(null);
      setEmpresa(null);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const signIn = async (email: string, password: string): Promise<{ error?: string }> => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setLoading(false);
        return { error: error.message };
      }
      await refreshSession();
      return {};
    } catch (err: any) {
      setLoading(false);
      return { error: err?.message || 'Error desconocido al iniciar sesión.' };
    }
  };

  const signOut = async (): Promise<void> => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
      setPerfil(null);
      setEmpresa(null);
    } finally {
      setLoading(false);
    }
  };

  const switchTenant = async (tenantEmail: string): Promise<{ error?: string }> => {
    return signIn(tenantEmail, 'password123');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        perfil,
        empresa,
        loading,
        signIn,
        signOut,
        switchTenant,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
