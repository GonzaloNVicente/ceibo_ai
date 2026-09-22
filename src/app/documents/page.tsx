"use client";

import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import {
  BookOpen,
  UploadCloud,
  Download,
  FileText,
  Trash2,
  Check,
  RefreshCw,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { createTenantScopedClient } from '@/lib/supabase/tenant-client';
import { createClient } from '@/lib/supabase/client';
import { RecordManagerDocument } from '@/lib/supabase/types';

export default function DocumentsPage() {
  const { user, perfil } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  const [documents, setDocuments] = useState<RecordManagerDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || !perfil?.empresa_id) return;
    const loadDocuments = async () => {
      try {
        const supabase = createClient();
        const client = createTenantScopedClient(supabase);
        const docs = await client.getKnowledgeDocuments();
        setDocuments(docs);
      } catch (err) {
        console.error('Error loading documents', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadDocuments();
  }, [user, perfil?.empresa_id]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (files: File[]) => {
    alert('La subida de archivos se realiza automáticamente desde n8n/Google Drive. La funcionalidad de drag & drop está deshabilitada por ahora.');
  };

  const handleDelete = (id: string) => {
    setDocuments(prev => prev.filter(doc => doc.id.toString() !== id));
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'processing':
        return (
          <Badge variant="warning">
            <RefreshCw className="size-3 mr-1 animate-spin" />
            Procesando
          </Badge>
        );
      case 'ready':
        return (
          <Badge variant="success">
            <Check className="size-3 mr-1" />
            Listo
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="destructive">
            <AlertCircle className="size-3 mr-1" />
            Error
          </Badge>
        );
      default:
        return (
          <Badge variant="neutral">
            Subiendo
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-6xl pb-10">
      {/* Header section with live status pill and Sora title */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="inline-flex h-7 items-center gap-2 rounded-full border border-success/25 bg-success/10 px-2.5 text-xs font-bold text-success">
              <BookOpen className="size-3.5" /> Cerebro IA Conectado
            </span>
            <span className="text-xs text-muted-foreground">{documents.length} documentos indexados</span>
          </div>
          <h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl text-foreground">
            Base de Conocimiento
          </h1>
          <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
            Subí los catálogos y listas de precios de tu empresa. La IA los procesa automáticamente para responder consultas de clientes con precisión técnica.
          </p>
        </div>

        <div>
          <Button 
            variant="primary" 
            className="shadow-action"
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadCloud className="size-4" />
            Subir Documento
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Upload Dropzone Card */}
        <Card className="lg:col-span-1 flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="text-base">Subir Archivos</CardTitle>
            <CardDescription>
              Formatos soportados: PDF, DOC, DOCX, XLS, XLSX, CSV, TXT.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div 
              className={cn(
                "border-2 border-dashed rounded-lg p-7 text-center transition-colors cursor-pointer",
                isDragging 
                  ? "border-primary bg-ceibo-soft/40" 
                  : "border-border bg-background/50 hover:bg-muted/30 hover:border-primary/50"
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden"
                multiple
                accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.html"
                onChange={handleFileInput}
              />
              <div className="mx-auto size-12 rounded-md bg-accent text-accent-foreground flex items-center justify-center mb-3 shadow-xs">
                <UploadCloud className="size-6" />
              </div>
              <p className="text-sm font-semibold text-foreground">
                Hacé clic o arrastrá archivos acá
              </p>
              <p className="text-xs text-muted-foreground mt-1.5">
                Máximo 20MB por archivo
              </p>
            </div>
            
            {/* Excel Advice Box */}
            <div className="rounded-lg border border-accent/20 bg-accent/5 p-4">
              <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <FileSpreadsheet className="size-4 text-primary" />
                ¿Vas a subir listas de precios en Excel?
              </h4>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                Para que la IA indexe los precios con precisión, los archivos Excel o CSV deben tener estructura tabular plana (sin celdas combinadas).
              </p>
              <Button 
                variant="secondary"
                size="sm"
                onClick={() => alert('Descargando plantilla_precios.xlsx...')}
                className="w-full mt-3 text-xs"
              >
                <Download className="size-3.5" />
                Descargar Plantilla Estándar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Documents List Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Documentos Activos ({documents.length})</CardTitle>
                <CardDescription>
                  Documentos que alimentan el contexto de respuestas del asistente virtual
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {documents.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-border rounded-lg">
                <FileText className="size-10 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-sm text-muted-foreground">No hay documentos cargados todavía.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead className="hidden sm:table-cell">Tamaño</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <FileText className="size-4 text-primary shrink-0" />
                          <div className="min-w-0">
                            <span className="font-semibold text-foreground truncate block max-w-[180px] sm:max-w-[280px]" title={doc.document_title}>
                              {doc.document_title}
                            </span>
                            <span className="text-[11px] text-muted-foreground sm:hidden font-mono">
                              {doc.data_type === 'tabular' ? 'Excel/CSV' : 'PDF/Word'}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono hidden sm:table-cell">
                        {doc.data_type === 'tabular' ? 'Excel/CSV' : 'PDF/Word'}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge('ready')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="icon-sm"
                          onClick={() => handleDelete(doc.id.toString())}
                          className="hover:text-destructive hover:bg-destructive/10 text-muted-foreground"
                          title="Eliminar documento"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
