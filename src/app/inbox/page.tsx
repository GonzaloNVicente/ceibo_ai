"use client";

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { ChatSession } from '@/lib/supabase/types';
import { useAuth } from '@/contexts/auth-context';
import { createTenantScopedClient } from '@/lib/supabase/tenant-client';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import {
  Search,
  Clock,
  CheckCircle2,
  HelpCircle,
  ShieldCheck,
  UserCheck,
  Filter,
} from 'lucide-react';

type StatusTab = 'all' | 'derivado' | 'resuelto' | 'uncategorized';

function getLeadStatus(lead: ChatSession): 'uncategorized' | 'derivado' | 'resuelto' {
  if (!lead.query_type) return 'uncategorized';
  if (lead.resolution_status === 'derivado' || lead.is_escalated) return 'derivado';
  return 'resuelto';
}

export default function InboxPage() {
  const { user, perfil } = useAuth();
  const [leads, setLeads] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState<string | null>(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    async function loadLeads() {
      if (!user) return;
      try {
        setLoading(true);
        setErrorState(null);
        const supabase = createClient();
        const tenantClient = createTenantScopedClient(supabase);
        const data = await tenantClient.getLeads();
        setLeads(data);
      } catch (err: any) {
        console.error('Failed to load leads:', err);
        setErrorState(err.message || 'Error al cargar los leads desde la base de datos');
      } finally {
        setLoading(false);
      }
    }

    loadLeads();
  }, [user]);

  const handleAssign = async (id: string) => {
    try {
      const supabaseClient = createClient();
      const tenantClient = createTenantScopedClient(supabaseClient);
      const updatedSession = await tenantClient.assignSession(id);
      setLeads(prev => prev.map(lead => lead.id === id ? { ...lead, ...updatedSession, assigned: { full_name: perfil?.full_name || null } } : lead));
    } catch (err: any) {
      console.error(err);
      alert('Error al asignar: ' + err.message);
    }
  };

  const handleResolve = async (id: string) => {
    try {
      const supabaseClient = createClient();
      const tenantClient = createTenantScopedClient(supabaseClient);
      const updatedSession = await tenantClient.resolveSession(id);
      setLeads(prev => prev.map(lead => lead.id === id ? { ...lead, ...updatedSession } : lead));
    } catch (err: any) {
      console.error(err);
      alert('Error al resolver: ' + err.message);
    }
  };

  const formatQueryType = (type: string | null | undefined, productId: string | null) => {
    if (!type) return 'Sin categorizar';
    const typeStr = type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    return productId ? `${typeStr} · ${productId}` : typeStr;
  };

  // Computed properties
  const pendientesCount = leads.filter(l => getLeadStatus(l) === 'derivado').length;
  const atendidosCount = leads.filter(l => getLeadStatus(l) === 'resuelto').length;
  const uncategorizedCount = leads.filter(l => getLeadStatus(l) === 'uncategorized').length;
  const totalCount = leads.length;

  // Filter and sort
  const filteredLeads = useMemo(() => {
    let result = [...leads];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(l => 
        l.customer_name?.toLowerCase().includes(q) || 
        l.customer_phone?.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(l => getLeadStatus(l) === statusFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      if (typeFilter === 'uncategorized') {
        result = result.filter(l => !l.query_type);
      } else {
        result = result.filter(l => l.query_type === typeFilter);
      }
    }

    // Sort: Uncategorized y Pendientes primero (por fecha desc), Atendidos después (por fecha desc)
    result.sort((a, b) => {
      const statusA = getLeadStatus(a);
      const statusB = getLeadStatus(b);
      const aIsHighPriority = statusA === 'derivado' || statusA === 'uncategorized';
      const bIsHighPriority = statusB === 'derivado' || statusB === 'uncategorized';
      
      if (aIsHighPriority && !bIsHighPriority) return -1;
      if (!aIsHighPriority && bIsHighPriority) return 1;
      
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateB - dateA;
    });

    return result;
  }, [leads, searchQuery, statusFilter, typeFilter]);

  return (
    <div className="space-y-6">
      {errorState && (
        <div className="rounded-md bg-destructive/15 p-4 text-destructive border border-destructive/30 shadow-sm">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-5" />
            <h3 className="font-semibold text-lg">Error de Conexión a Base de Datos</h3>
          </div>
          <p className="mt-1 text-sm">{errorState}</p>
        </div>
      )}

      {/* Header section with live-pulse status and Sora display font */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2.5 flex items-center gap-2">
            <span className="inline-flex h-7 items-center gap-2 rounded-full border border-success/25 bg-success/10 px-2.5 text-xs font-bold text-success">
              <span className="live-pulse size-2 rounded-full bg-success" /> En Vivo
            </span>
            <span className="text-xs text-muted-foreground">{totalCount} leads registrados</span>
          </div>
          <h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl text-foreground">
            Inbox de Leads WhatsApp
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gestión comercial y asignación de leads calificados por la IA en tiempo real.
          </p>
        </div>
        
        {/* Search & Type filter */}
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Buscar cliente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
          <div className="relative">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              aria-label="Filtrar por tipo de consulta"
              className="h-10 rounded-md border border-border bg-card px-3 text-sm text-foreground shadow-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
            >
              <option value="all">Todos los tipos</option>
              <option value="pedido_presupuesto">Presupuesto</option>
              <option value="reclamo">Reclamo</option>
              <option value="consulta_stock">Consulta Stock</option>
              <option value="consulta_precio">Consulta Precio</option>
              <option value="consulta_general">Consulta General</option>
              <option value="pedido">Pedido</option>
              <option value="uncategorized">Sin categorizar</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Leads Table Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Leads Calificados</CardTitle>
              <CardDescription>
                Seguimiento comercial de clientes según nivel de prioridad y estado
              </CardDescription>
            </div>
          </div>
          
          {/* Status Tabs */}
          <div className="flex flex-wrap gap-2 pt-4 border-b border-border pb-3">
            <button 
              onClick={() => setStatusFilter('all')}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
                statusFilter === 'all'
                  ? "bg-sidebar text-sidebar-foreground shadow-xs"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              Todos <span className="ml-1 rounded bg-background/20 px-1.5 py-0.5 text-[10px]">{totalCount}</span>
            </button>
            <button 
              onClick={() => setStatusFilter('derivado')}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
                statusFilter === 'derivado'
                  ? "bg-ceibo-soft text-ceibo border border-ceibo/30 font-bold"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Clock className="size-3" />
              Pendientes <span className="ml-1 rounded bg-ceibo/15 px-1.5 py-0.5 text-[10px] text-ceibo font-bold">{pendientesCount}</span>
            </button>
            <button 
              onClick={() => setStatusFilter('resuelto')}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
                statusFilter === 'resuelto'
                  ? "bg-success/15 text-success border border-success/30 font-bold"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <CheckCircle2 className="size-3" />
              Atendidos <span className="ml-1 rounded bg-success/20 px-1.5 py-0.5 text-[10px] text-success font-bold">{atendidosCount}</span>
            </button>
            <button 
              onClick={() => setStatusFilter('uncategorized')}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
                statusFilter === 'uncategorized'
                  ? "bg-muted text-foreground border border-border font-bold"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <HelpCircle className="size-3" />
              Sin clasificar <span className="ml-1 rounded bg-muted-foreground/20 px-1.5 py-0.5 text-[10px]">{uncategorizedCount}</span>
            </button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center text-muted-foreground text-sm animate-pulse">
              Cargando leads calificados...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Detalle</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="text-muted-foreground text-xs font-mono">
                      {new Date(lead.last_message_at || lead.created_at).toLocaleString('es-AR', { 
                        day: '2-digit', month: '2-digit', year: '2-digit',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-foreground">
                        {lead.customer_name || 'Desconocido'}
                      </div>
                      {lead.customer_phone && (
                        <div className="text-xs text-muted-foreground">
                          +{lead.customer_phone}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-foreground">
                        {formatQueryType(lead.query_type, lead.related_product_id)}
                      </div>
                      <div className="text-xs text-muted-foreground truncate max-w-xs" title={lead.last_message_text || ''}>
                        {lead.last_message_text || 'Sin mensajes'}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getLeadStatus(lead) === 'uncategorized' ? (
                        <Badge variant="warning">
                          <HelpCircle className="size-3 mr-1" />
                          Sin clasificar
                        </Badge>
                      ) : getLeadStatus(lead) === 'derivado' ? (
                        <Badge variant="ceibo">
                          <Clock className="size-3 mr-1" />
                          Pendiente
                        </Badge>
                      ) : (
                        <Badge variant="success">
                          <CheckCircle2 className="size-3 mr-1" />
                          Atendido
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {getLeadStatus(lead) === 'derivado' && (
                        <div className="flex justify-end gap-2">
                          {lead.assigned_to ? (
                            <Button 
                              variant="outline"
                              size="sm"
                              onClick={() => handleResolve(lead.id)}
                            >
                              <CheckCircle2 className="size-3.5 mr-1" />
                              Resolver
                            </Button>
                          ) : (
                            <Button 
                              variant="secondary" 
                              size="sm" 
                              onClick={() => handleAssign(lead.id)}
                            >
                              <UserCheck className="size-3.5 mr-1" />
                              Asignar
                            </Button>
                          )}
                        </div>
                      )}
                      {lead.assigned?.full_name && (
                        <div className="text-[10px] text-muted-foreground mt-1">
                          Asignado a: {lead.assigned.full_name}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredLeads.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="p-8 text-center text-muted-foreground">
                      No hay leads que coincidan con los filtros aplicados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
