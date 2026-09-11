import React from 'react';
import Link from 'next/link';
import { FileUp, FileText, Sparkles, ArrowLeft, UploadCloud } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function DocumentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Carga de Documentos y Catálogo
            </h1>
            <Badge variant="warning" className="text-xs">
              Próximamente
            </Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Entrenamiento de conocimiento de tu asistente comercial con PDFs, listas de precios y FAQs.
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
          <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center shadow-inner">
            <UploadCloud className="w-8 h-8" />
          </div>

          <div className="max-w-md space-y-1">
            <h3 className="text-lg font-semibold text-slate-900">Base de Conocimiento RAG</h3>
            <p className="text-sm text-slate-500">
              Sube catálogos comerciales, listas de precios en Excel o PDFs con políticas de envío para que el bot responda con precisión inmediata a las consultas de tus compradores.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-xs text-slate-600 font-mono">
            <span>Ruta: <code>/documents</code></span>
            <span>•</span>
            <span>Estado: Estructura M1 lista</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
