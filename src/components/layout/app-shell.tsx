'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { CircleUserRound } from 'lucide-react';
import { Sidebar } from './sidebar';
import { Navbar } from './navbar';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Auth pages (login) have clean dedicated layout without sidebar/navbar
  const isAuthPage = pathname === '/login';
  const isLandingPage = pathname === '/';

  if (isAuthPage || isLandingPage) {
    return <main className="min-h-screen bg-background text-foreground">{children}</main>;
  }

  return (
    <div id="dashboard" className="min-h-screen bg-background text-foreground">
      {/* Desktop Fixed Sidebar */}
      <Sidebar />

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

      {/* Main Content Column with 252px Desktop Offset */}
      <div className="lg:pl-[252px] flex min-h-screen flex-col min-w-0">
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
