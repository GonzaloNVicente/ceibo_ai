import React from 'react';
import Link from 'next/link';
import { Inbox, MessageSquare, Clock, Filter, Search, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function InboxPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Bandeja de Entrada WhatsApp
            </h1>
            <Badge variant="warning" className="text-xs">
              Próximamente
            </Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Gestión en tiempo real de leads y conversaciones activas de WhatsApp.
          </p>
        </div>

        <Link href="/">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al Dashboard</span>
          </Button>
        </Link>
      </div>

      <Card className="border-dashed border-2 border-slate-200 bg-white/70">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner">
            <Inbox className="w-8 h-8" />
          </div>

          <div className="max-w-md space-y-1">
            <h3 className="text-lg font-semibold text-slate-900">Módulo en Desarrollo</h3>
            <p className="text-sm text-slate-500">
              Aquí tu equipo de ventas podrá visualizar las conversaciones entrantes de WhatsApp, tomar el control de chats derivados y enviar respuestas manuales directamente.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-xs text-slate-600 font-mono">
            <span>Ruta: <code>/inbox</code></span>
            <span>•</span>
            <span>Estado: Estructura M1 lista</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
