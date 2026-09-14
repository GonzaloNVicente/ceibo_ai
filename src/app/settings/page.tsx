"use client";

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Building2,
  Bot,
  Smartphone,
  Users,
  ShieldCheck,
  CheckCircle2,
  Save,
  PhoneCall,
  Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type SettingsTab = 'general' | 'bot' | 'whatsapp' | 'team';

export default function SettingsPage() {
  const { user, perfil } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      alert('Configuración guardada exitosamente');
    }, 1000);
  };

  const tabs = [
    { id: 'general' as const, label: 'General', icon: Building2 },
    { id: 'bot' as const, label: 'Asistente de IA', icon: Bot },
    { id: 'whatsapp' as const, label: 'WhatsApp API', icon: Smartphone },
    { id: 'team' as const, label: 'Equipo y Accesos', icon: Users },
  ];

  return (
    <div className="space-y-6 max-w-6xl pb-10">
      {/* Header section with Enterprise badge and Sora title */}
      <div>
        <div className="mb-2.5 flex items-center gap-2">
          <span className="rounded bg-ceibo-soft px-2 py-1 text-[10px] font-bold text-ceibo">
            ENTERPRISE CONFIG
          </span>
          <span className="text-xs text-muted-foreground font-mono">Tenant ID: [CEI-AR-7F42A9]</span>
        </div>
        <h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl text-foreground">
          Configuración del Sistema
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Administrá los datos corporativos de tu empresa, el comportamiento del asistente virtual y las conexiones activas.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Sidebar Vertical Tabs */}
        <aside className="w-full md:w-60 shrink-0">
          <nav className="flex flex-row md:flex-col gap-1.5 p-1.5 rounded-lg border border-border bg-card shadow-panel overflow-x-auto">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex h-10 items-center gap-2.5 rounded-md px-3 text-sm font-semibold transition-colors text-left whitespace-nowrap',
                    isActive
                      ? 'bg-sidebar text-sidebar-foreground shadow-xs'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Tab Panels */}
        <div className="flex-1 w-full space-y-6">
          {activeTab === 'general' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Perfil de la Empresa</CardTitle>
                <CardDescription>
                  Esta información es visible para tu equipo comercial y en los reportes operativos.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Nombre de la Empresa
                  </label>
                  <Input 
                    type="text" 
                    defaultValue={perfil?.full_name?.split(' ')[0] || 'Mi Empresa SRL'}
                    className="h-10"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Email de Contacto Corporativo
                  </label>
                  <Input 
                    type="email" 
                    defaultValue={user?.email || 'admin@empresa.com'}
                    disabled
                    className="h-10 bg-muted/50 cursor-not-allowed text-muted-foreground font-mono text-xs"
                  />
                  <p className="text-xs text-muted-foreground">Para actualizar el email principal comunicate con soporte técnico.</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Zona Horaria Comercial
                  </label>
                  <select 
                    aria-label="Zona Horaria Comercial"
                    className="h-10 w-full rounded-md border border-border bg-card px-3 text-sm text-foreground shadow-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                  >
                    <option>Buenos Aires (GMT-3)</option>
                    <option>Santiago de Chile (GMT-4)</option>
                    <option>Bogotá / Lima (GMT-5)</option>
                    <option>Ciudad de México (GMT-6)</option>
                  </select>
                </div>
              </CardContent>
              <CardFooter className="border-t border-border pt-4 flex justify-end">
                <Button 
                  variant="primary"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="shadow-action"
                >
                  <Save className="size-4" />
                  <span>{isSaving ? 'Guardando...' : 'Guardar Cambios'}</span>
                </Button>
              </CardFooter>
            </Card>
          )}

          {activeTab === 'bot' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Comportamiento del Asistente Virtual</CardTitle>
                <CardDescription>
                  Personalizá los parámetros de respuesta del bot con inteligencia artificial.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Nombre Público del Asistente
                  </label>
                  <Input 
                    type="text" 
                    defaultValue="Bot de Ventas Ceibo"
                    className="h-10"
                  />
                  <p className="text-xs text-muted-foreground">Así se presentará la IA al entablar contacto por WhatsApp.</p>
                </div>

                <div className="rounded-lg border border-accent/20 bg-accent/5 p-4">
                  <div className="flex gap-3">
                    <div className="grid size-9 shrink-0 place-items-center rounded-md bg-accent text-accent-foreground">
                      <ShieldCheck className="size-5" strokeWidth={1.8} />
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground text-sm">Comportamiento Asistido y Optimizado</h4>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        Para garantizar la máxima tasa de conversión comercial, el modelo de lenguaje de Ceibo responde de forma cordial, empática y se fundamenta <strong>estrictamente</strong> en los documentos indexados en tu <em>Base de Conocimiento</em> para cotizaciones y precios.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t border-border pt-4 flex justify-end">
                <Button 
                  variant="primary"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="shadow-action"
                >
                  <Save className="size-4" />
                  <span>{isSaving ? 'Guardando...' : 'Guardar Cambios'}</span>
                </Button>
              </CardFooter>
            </Card>
          )}

          {activeTab === 'whatsapp' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Conexión con WhatsApp Business API</CardTitle>
                <CardDescription>
                  Gestioná las credenciales y el estado operativo de tu línea oficial.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 rounded-lg border border-success/25 bg-success/10 flex items-start gap-3.5">
                  <div className="size-9 rounded-full bg-success/20 text-success flex items-center justify-center shrink-0 mt-0.5">
                    <PhoneCall className="size-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-foreground">Línea Oficial Conectada</h3>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-success">
                        <span className="live-pulse size-1.5 rounded-full bg-success" /> En Línea
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 font-mono">
                      Operando bajo el número: <strong className="text-foreground">+54 9 11 5482-0916</strong>
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Última sincronización: hace 2 minutos · Latencia: 140ms
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                      Meta App ID
                    </label>
                    <Input 
                      type="text" 
                      defaultValue="104857395029481"
                      className="h-10 font-mono text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                      Token de Acceso Permanente (System User)
                    </label>
                    <Input 
                      type="password" 
                      defaultValue="EAAXXXXXXXXXXXXX992848102384"
                      className="h-10 font-mono text-xs"
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t border-border pt-4 flex items-center justify-between">
                <Button 
                  variant="ghost" 
                  className="text-destructive hover:bg-destructive/10 text-xs"
                  onClick={() => alert('Para desconectar tu línea contactá al administrador.')}
                >
                  Desconectar Línea
                </Button>
                <Button 
                  variant="primary"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="shadow-action"
                >
                  <Save className="size-4" />
                  <span>{isSaving ? 'Guardando...' : 'Actualizar Credenciales'}</span>
                </Button>
              </CardFooter>
            </Card>
          )}

          {activeTab === 'team' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Equipo Comercial y Accesos</CardTitle>
                <CardDescription>
                  Invitá a tus vendedores y supervisores para gestionar el Inbox de leads y responder chats.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead className="text-right">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>
                        <div className="font-semibold text-foreground">{perfil?.full_name || 'Admin'}</div>
                        <div className="text-xs text-muted-foreground font-mono">{user?.email || 'admin@ceibo.ai'}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="ceibo">
                          Administrador
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground font-medium">
                        (Tu cuenta)
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <div className="font-semibold text-foreground">Gonzalo Vicente</div>
                        <div className="text-xs text-muted-foreground font-mono">ventas@ceibo.ai</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="neutral">
                          Agente Comercial
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="secondary" size="sm" onClick={() => alert('Edición de usuario')}>
                          Editar
                        </Button>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
              <CardFooter className="border-t border-border pt-4 flex justify-end">
                <Button 
                  variant="secondary"
                  onClick={() => alert('Invitación enviada por email.')}
                >
                  + Invitar Miembro
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
