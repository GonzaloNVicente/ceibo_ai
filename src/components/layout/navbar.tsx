'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  ShieldCheck,
  LogOut,
  Bell,
  Smartphone,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';

interface NavbarProps {
  onMenuToggle?: () => void;
}

export function Navbar({ onMenuToggle }: NavbarProps) {
  const router = useRouter();
  const { user, perfil, empresa, signOut } = useAuth();

  const tenantName = empresa?.name || 'Ceibo AI Tech Solutions';
  const tenantPlan = (empresa?.plan || 'enterprise').toUpperCase();
  const userName = perfil?.full_name || 'Sofía Rodríguez';
  const userEmail = user?.email || 'admin@ceibo.ai';
  const empresaId = perfil?.empresa_id || empresa?.id || '11111111-1111-4111-a111-111111111111';

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (err) {
      console.error('Error logging out:', err);
    }
  };

  return (
    <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-sm px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Left: Tenant Selector / Display */}
      <div className="flex items-center gap-4">
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            aria-label="Abrir menú"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900 text-sm">{tenantName}</span>
              <Badge variant="success" className="text-[10px] py-0 px-2 bg-emerald-50 text-emerald-700 border-emerald-200">
                <ShieldCheck className="w-3 h-3 mr-1" />
                {tenantPlan}
              </Badge>
            </div>
            <p className="text-[11px] text-slate-500 font-mono">ID: {empresaId.slice(0, 13)}...</p>
          </div>
        </div>
      </div>

      {/* Right: Status & User Nav */}
      <div className="flex items-center gap-3 md:gap-5">
        {/* WhatsApp Channel Indicator */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-600">
          <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
          <span>Canal: <strong className="font-medium text-slate-800">+54 9 11 5555-0199</strong></span>
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>

        {/* Notifications Icon */}
        <button
          className="relative p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          title="Notificaciones"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full" />
        </button>

        {/* User Profile Navigation */}
        <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-white flex items-center justify-center text-xs font-semibold shadow-inner">
              {userName
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-900 leading-tight">{userName}</span>
              <span className="text-[11px] text-slate-500">{userEmail}</span>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="h-8 px-2.5 text-slate-600 hover:text-red-600 hover:bg-red-50 text-xs flex items-center gap-1.5 cursor-pointer"
            title="Cerrar sesión"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Salir</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
