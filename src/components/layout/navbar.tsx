'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { MessageCircleMore, ChevronDown } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { BrandMark } from './sidebar';
import { useBotActivity } from '@/hooks/use-bot-activity';
import { cn } from '@/lib/utils';

interface NavbarProps {
  onMenuToggle?: () => void;
}

export function Navbar({ onMenuToggle }: NavbarProps) {
  const router = useRouter();
  const { user, perfil, empresa, signOut } = useAuth();
  const { isOperative, loading: loadingActivity } = useBotActivity();

  const tenantName = empresa?.name || 'Cargando...';
  const tenantPlan = (empresa?.plan || 'enterprise').toUpperCase();
  const userName = perfil?.full_name || '';
  const userEmail = user?.email || '';

  const userInitials =
    userName
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'AD';

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (err) {
      console.error('Error logging out:', err);
    }
  };

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur-md">
      <div className="flex min-h-16 items-center gap-3 px-4 sm:px-6 xl:px-8">
        {/* Mobile Brand Fallback & Menu Toggle */}
        <div className="flex items-center gap-2 lg:hidden">
          <button
            type="button"
            onClick={onMenuToggle}
            className="flex items-center gap-2 rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Abrir menú de navegación"
          >
            <BrandMark />
            <span className="hidden font-display text-sm font-bold sm:block">
              Ceibo AI
            </span>
          </button>
        </div>

        {/* Tenant Identity & WhatsApp Status */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-bold">{tenantName}</p>
            <span className="hidden rounded bg-ceibo-soft px-2 py-1 text-[10px] font-bold text-ceibo sm:inline">
              {tenantPlan}
            </span>
          </div>
          <div className="mt-0.5 hidden items-center gap-1.5 text-[11px] text-muted-foreground sm:flex">
            <MessageCircleMore className={cn("size-3.5", isOperative ? "text-success" : "text-muted-foreground")} />
            <span className={cn("font-semibold", isOperative ? "text-success" : "text-muted-foreground")}>
              {loadingActivity ? 'Cargando...' : isOperative ? 'Operativo' : 'Sin actividad reciente'}
            </span>
          </div>
        </div>

        {/* User Profile & Action Menu */}
        <div className="ml-auto flex items-center gap-3 border-l border-border pl-3">
          <div className="hidden text-right md:block">
            <p className="text-xs font-bold">{userName}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{userEmail}</p>
          </div>
          <div
            className="grid size-9 place-items-center rounded-md bg-accent font-display text-xs font-bold text-accent-foreground select-none"
            title={`${userName} (${userEmail})`}
          >
            {userInitials}
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
          >
            <ChevronDown className="size-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
