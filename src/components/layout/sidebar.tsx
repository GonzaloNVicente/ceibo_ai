'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Inbox,
  MessageSquare,
  FileText,
  Settings,
  Bot,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  isComingSoon?: boolean;
}

const navItems: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    name: 'Inbox',
    href: '/inbox',
    icon: Inbox,
    isComingSoon: true,
  },
  {
    name: 'Chats',
    href: '/chats',
    icon: MessageSquare,
    isComingSoon: true,
  },
  {
    name: 'Carga de Documentos',
    href: '/documents',
    icon: FileText,
    isComingSoon: true,
  },
  {
    name: 'Configuración',
    href: '/settings',
    icon: Settings,
    isComingSoon: true,
  },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        'w-64 border-r border-slate-200 bg-white flex flex-col justify-between shrink-0 h-screen sticky top-0 shadow-sm',
        className
      )}
    >
      {/* Brand Header */}
      <div>
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <Bot className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-900 tracking-tight text-lg">Ceibo AI</span>
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
            </div>
            <span className="text-xs text-slate-500 font-medium">Asistente WhatsApp B2B</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1.5" aria-label="Sidebar Navigation">
          <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Módulos
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'group flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-emerald-50 text-emerald-800 shadow-sm border border-emerald-100/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      'w-5 h-5 transition-colors',
                      isActive ? 'text-emerald-600' : 'text-slate-400 group-hover:text-slate-600'
                    )}
                  />
                  <span>{item.name}</span>
                </div>

                {item.isComingSoon ? (
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0 font-medium bg-slate-100 text-slate-600 border border-slate-200"
                  >
                    Próximamente
                  </Badge>
                ) : isActive ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                ) : null}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / Tenant WhatsApp Status */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="rounded-lg border border-emerald-100 bg-emerald-50/60 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-950 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              Bot WhatsApp
            </span>
            <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-700">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Operativo
            </span>
          </div>
          <p className="text-[11px] text-emerald-800 leading-tight">
            Atención comercial automatizada activa 24/7.
          </p>
        </div>
      </div>
    </aside>
  );
}
