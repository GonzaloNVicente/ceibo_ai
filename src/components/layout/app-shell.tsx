'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { CircleUserRound } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sidebar } from './sidebar';
import { Navbar } from './navbar';

interface AppShellProps {
  children: React.ReactNode;
}

const SIDEBAR_STORAGE_KEY = 'ceibo.sidebar.collapsed';

function isEditableTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el || !el.tagName) return false;
  return el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName);
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Recordar la preferencia del usuario (el almacenamiento puede no estar disponible)
  useEffect(() => {
    try {
      if (localStorage.getItem(SIDEBAR_STORAGE_KEY) === '1') setSidebarCollapsed(true);
    } catch {
      /* sin almacenamiento: queda expandida */
    }
  }, []);

  const toggleSidebar = useCallback(() => {
    const next = !sidebarCollapsed;
    setSidebarCollapsed(next);
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, next ? '1' : '0');
    } catch {
      /* ignorar */
    }
  }, [sidebarCollapsed]);

  // Atajo Ctrl/Cmd + B (no interfiere mientras se escribe en un campo)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === 'b') {
        if (isEditableTarget(e.target)) return;
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [toggleSidebar]);

  // Auth pages (login) have clean dedicated layout without sidebar/navbar
  const isAuthPage = pathname === '/login';
  const isLandingPage = pathname === '/';

  if (isAuthPage || isLandingPage) {
    return <main className="min-h-screen bg-background text-foreground">{children}</main>;
  }

  return (
    <div id="dashboard" className="min-h-screen bg-background text-foreground">
      {/* Desktop Fixed Sidebar (se pliega a una franja de iconos) */}
      <Sidebar collapsed={sidebarCollapsed} onToggleCollapse={toggleSidebar} />

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="fixed inset-y-0 left-0 z-50 w-[252px] bg-sidebar text-sidebar-foreground shadow-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <Sidebar onNavigate={() => setMobileMenuOpen(false)} isMobile />
          </div>
        </div>
      )}

      {/* Main Content Column: offset = ancho de la barra (252px expandida / 72px plegada) */}
      <div
        className={cn(
          'flex min-h-screen min-w-0 flex-col transition-[padding] duration-200 motion-reduce:transition-none',
          sidebarCollapsed ? 'lg:pl-[72px]' : 'lg:pl-[252px]'
        )}
      >
        <Navbar onMenuToggle={() => setMobileMenuOpen((prev) => !prev)} />
        <main className="mx-auto w-full max-w-[1500px] flex-1 px-4 py-6 sm:px-6 xl:px-8 xl:py-8">
          {children}

          {/* Mobile Bottom Status Bar */}
          <div className="mt-5 flex items-center justify-between text-[11px] text-muted-foreground lg:hidden">
            <span className="flex items-center gap-2 font-semibold text-success">
              <span className="live-pulse size-2 rounded-full bg-success" />
              Bot WhatsApp operativo 24/7
            </span>
            <CircleUserRound className="size-4" />
          </div>
        </main>
      </div>
    </div>
  );
}
