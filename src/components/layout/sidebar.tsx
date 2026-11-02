'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Gauge,
  Inbox,
  MessageCircleMore,
  BookOpen,
  Settings,
  Bot,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/auth-context';
import { useBotActivity } from '@/hooks/use-bot-activity';

/** Logo de la marca: la terracota se usa SOLO aca (el resto de la app usa la paleta azul/verde/rojo). */
export function BrandMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'grid size-10 shrink-0 place-items-center rounded-xl bg-ceibo text-lg font-bold text-white shadow-sm',
        className
      )}
    >
      C
    </div>
  );
}

export const navItems: { label: string; href: string; icon: any; count?: number }[] = [
  { label: 'Dashboard', href: '/dashboard', icon: Gauge },
  { label: 'Inbox', href: '/inbox', icon: Inbox },
  { label: 'Chats', href: '/chats', icon: MessageCircleMore },
  { label: 'Base de Conocimiento', href: '/documents', icon: BookOpen },
  { label: 'Configuración', href: '/settings', icon: Settings },
];

interface SidebarProps {
  className?: string;
  onNavigate?: () => void;
  isMobile?: boolean;
  /** Solo escritorio: barra plegada a una franja de iconos */
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function Sidebar({ className, onNavigate, isMobile, collapsed, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();
  const { user, perfil } = useAuth();
  const { isOperative, loading: loadingActivity } = useBotActivity();
  const [pendingCount, setPendingCount] = useState(0);

  // El drawer mobile nunca se pliega
  const isCollapsed = Boolean(collapsed) && !isMobile;
  const botStatusText = loadingActivity ? 'Cargando...' : isOperative ? 'Operativo' : 'Sin actividad reciente';

  useEffect(() => {
    if (!user || !perfil?.empresa_id) return;
    const supabase = createClient() as any;

    // Initial fetch
    supabase
      .from('chat_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('empresa_id', perfil.empresa_id)
      .eq('resolution_status', 'derivado')
      .then(({ count }: { count: number | null }) => setPendingCount(count || 0));

    // Realtime subscription
    const channel = supabase.channel('sidebar_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_sessions' }, () => {
        // Just re-fetch the count on any change to avoid complex state tracking
        supabase
          .from('chat_sessions')
          .select('*', { count: 'exact', head: true })
          .eq('empresa_id', perfil.empresa_id)
          .eq('resolution_status', 'derivado')
          .then(({ count }: { count: number | null }) => setPendingCount(count || 0));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, perfil?.empresa_id]);

  const toggleButton = onToggleCollapse && !isMobile && (
    <button
      type="button"
      onClick={onToggleCollapse}
      aria-label={isCollapsed ? 'Mostrar barra lateral' : 'Ocultar barra lateral'}
      aria-expanded={!isCollapsed}
      title={isCollapsed ? 'Mostrar barra lateral (Ctrl+B)' : 'Ocultar barra lateral (Ctrl+B)'}
      className="grid size-9 shrink-0 place-items-center rounded-[10px] text-sidebar-foreground transition-colors hover:bg-black/[0.05] hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:hover:bg-white/[0.07]"
    >
      {isCollapsed ? (
        <PanelLeftOpen className="size-[18px]" strokeWidth={1.8} />
      ) : (
        <PanelLeftClose className="size-[18px]" strokeWidth={1.8} />
      )}
    </button>
  );

  return (
    <aside
      className={cn(
        isMobile
          ? 'flex h-full w-[252px] flex-col bg-sidebar text-sidebar-foreground'
          : cn(
              'fixed inset-y-0 left-0 z-30 hidden flex-col overflow-hidden border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 motion-reduce:transition-none lg:flex',
              isCollapsed ? 'w-[72px]' : 'w-[252px]'
            ),
        className
      )}
    >
      {/* Brand Header */}
      {isCollapsed ? (
        <div className="flex flex-col items-center gap-3 px-3 py-5">
          <BrandMark />
          {toggleButton}
        </div>
      ) : (
        <div className="flex items-center gap-3 px-5 py-6">
          <BrandMark />
          <div className="min-w-0">
            <p className="text-[17px] font-semibold leading-none tracking-tight text-sidebar-accent-foreground">
              Ceibo AI
            </p>
            <p className="mt-1 truncate text-[11px] font-medium text-sidebar-foreground">
              Ventas por WhatsApp
            </p>
          </div>
          {toggleButton && <div className="ml-auto -mr-2">{toggleButton}</div>}
        </div>
      )}

      {/* Navigation */}
      <nav aria-label="Navegación principal" className="space-y-1 px-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname === item.href || pathname.startsWith(item.href + '/');
          const badge = item.label === 'Inbox' && pendingCount > 0 ? pendingCount : item.count || 0;

          return (
            <Link
              key={item.label}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              aria-label={isCollapsed && badge ? `${item.label} (${badge})` : undefined}
              title={isCollapsed ? item.label : undefined}
              onClick={onNavigate}
              className={cn(
                'relative flex h-10 items-center rounded-[10px] text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                isCollapsed ? 'justify-center' : 'gap-3 px-3',
                isActive
                  ? 'bg-sidebar-accent font-semibold text-sidebar-accent-foreground shadow-sm dark:shadow-none'
                  : 'font-medium text-sidebar-foreground hover:bg-black/[0.05] hover:text-sidebar-accent-foreground dark:hover:bg-white/[0.06]'
              )}
            >
              <Icon className={cn('size-[18px] shrink-0', isActive && 'text-primary')} strokeWidth={1.8} />
              {isCollapsed ? (
                <>
                  <span className="sr-only">{item.label}</span>
                  {badge > 0 && (
                    <span
                      aria-hidden="true"
                      className="absolute right-1.5 top-1.5 min-w-4 rounded-full bg-[#D70015] px-1 text-center text-[9px] font-bold leading-4 text-white"
                    >
                      {badge > 99 ? '99+' : badge}
                    </span>
                  )}
                </>
              ) : (
                <>
                  <span className="truncate">{item.label}</span>
                  {item.label === 'Inbox' && pendingCount > 0 ? (
                    <span className="ml-auto rounded-full bg-[#D70015] px-2 py-0.5 text-[11px] font-bold text-white">
                      {pendingCount}
                    </span>
                  ) : item.count ? (
                    <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-[11px] font-bold text-primary-foreground">
                      {item.count}
                    </span>
                  ) : null}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer / Bot WhatsApp Operational Status */}
      <div className={cn('mt-auto', isCollapsed ? 'p-3' : 'p-4')}>
        {isCollapsed ? (
          <div
            className="relative mx-auto grid size-11 place-items-center rounded-2xl bg-card shadow-panel"
            title={`Bot WhatsApp: ${botStatusText}`}
            role="img"
            aria-label={`Bot WhatsApp: ${botStatusText}`}
          >
            <Bot className={cn('size-5', isOperative ? 'text-foreground' : 'text-muted-foreground')} strokeWidth={1.8} />
            {isOperative && <span className="live-pulse absolute right-1.5 top-1.5 size-2.5 rounded-full border-2 border-card bg-success-light" />}
          </div>
        ) : (
          <div className="flex items-start gap-3 rounded-2xl bg-card p-3.5 shadow-panel">
            <div className="relative mt-0.5">
              <Bot className={cn('size-5', isOperative ? 'text-foreground' : 'text-muted-foreground')} strokeWidth={1.8} />
              {isOperative && <span className="live-pulse absolute -right-1 -top-1 size-2.5 rounded-full border-2 border-card bg-success-light" />}
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">Bot WhatsApp</p>
              <p className={cn('mt-0.5 text-[11px] font-semibold', isOperative ? 'text-success' : 'text-muted-foreground')}>
                {botStatusText}
              </p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
