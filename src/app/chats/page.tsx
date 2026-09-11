import React from 'react';
import Link from 'next/link';
import { MessageSquare, Search, Sparkles, ArrowLeft, History } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function ChatsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Historial y Transcripciones de Chats
            </h1>
            <Badge variant="warning" className="text-xs">
              Próximamente
            </Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Auditoría de conversaciones completas y análisis de interacciones cliente-IA.
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
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner">
            <History className="w-8 h-8" />
          </div>

          <div className="max-w-md space-y-1">
            <h3 className="text-lg font-semibold text-slate-900">Auditoría de Conversaciones</h3>
            <p className="text-sm text-slate-500">
              Revisa el historial de mensajes completos intercambiados entre el asistente Ceibo AI y tus clientes por WhatsApp, identificando motivos de derivación y preguntas frecuentes.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-xs text-slate-600 font-mono">
            <span>Ruta: <code>/chats</code></span>
            <span>•</span>
            <span>Estado: Estructura M1 lista</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
