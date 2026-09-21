'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Gauge,
  Inbox,
  MessageCircleMore,
  BookOpen,
  Settings,
  Bot,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function BrandMark() {
  return (
    <div className="grid size-11 shrink-0 place-items-center rounded-md bg-primary font-display text-lg font-bold text-primary-foreground shadow-action">
      C
    </div>
  );
}

export const navItems = [
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
}

export function Sidebar({ className, onNavigate, isMobile }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        isMobile
          ? 'flex h-full w-[252px] flex-col bg-sidebar text-sidebar-foreground'
          : 'fixed inset-y-0 left-0 z-30 hidden w-[252px] flex-col bg-sidebar text-sidebar-foreground lg:flex',
        className
      )}
    >
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-6 py-7">
        <BrandMark />
        <div>
          <p className="font-display text-[17px] font-bold leading-none text-sidebar-accent-foreground">
            Ceibo AI
          </p>
          <p className="mt-1 text-[11px] font-medium text-sidebar-foreground/55">
            Ventas por WhatsApp
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav aria-label="Navegación principal" className="space-y-1 px-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname === item.href || pathname.startsWith(item.href + '/');

          return (
            <Link
              key={item.label}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              onClick={onNavigate}
              className={cn(
                'flex h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/65 hover:bg-sidebar-accent/55 hover:text-sidebar-accent-foreground'
              )}
            >
              <Icon className="size-[18px]" strokeWidth={1.8} />
              <span>{item.label}</span>
              {item.count ? (
                <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-[11px] text-primary-foreground">
                  {item.count}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      {/* Footer / Bot WhatsApp Operational Status */}
      <div className="mt-auto p-4">
        <div className="border-t border-sidebar-border pt-4">
          <div className="flex items-start gap-3 rounded-md bg-sidebar-accent/65 p-3.5">
            <div className="relative mt-0.5">
              <Bot className="size-5 text-sidebar-accent-foreground" strokeWidth={1.8} />
              <span className="live-pulse absolute -right-1 -top-1 size-2.5 rounded-full border-2 border-sidebar-accent bg-success" />
            </div>
            <div>
              <p className="text-xs font-bold text-sidebar-accent-foreground">Bot WhatsApp</p>
              <p className="mt-1 text-[11px] font-semibold text-success">Operativo</p>
              <p className="mt-1 text-[11px] leading-4 text-sidebar-foreground/55">
                Atención comercial automatizada activa 24/7
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
