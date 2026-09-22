"use client";

import { useEffect, useState, useRef, useMemo } from 'react';
import { ChatSession, ChatMessage } from '@/lib/supabase/types';
import { useAuth } from '@/contexts/auth-context';
import { createTenantScopedClient } from '@/lib/supabase/tenant-client';
import { createClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Search,
  Bot,
  UserCheck,
  Send,
  CheckCircle2,
  MessageSquare,
  Clock,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

export default function ChatsPage() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<ChatSession[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [errorLeads, setErrorLeads] = useState<string | null>(null);
  
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [errorMessages, setErrorMessages] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    async function loadSessions() {
      if (!user) return;
      try {
        setLoadingLeads(true);
        setErrorLeads(null);
        const supabase = createClient();
        const tenantClient = createTenantScopedClient(supabase);
        const data = await tenantClient.getLeads();
        setLeads(data);
      } catch (err: any) {
        console.error('Failed to load chat sessions:', err);
        setErrorLeads(err.message || 'Error al cargar las sesiones');
      } finally {
        setLoadingLeads(false);
      }
    }
    loadSessions();
  }, [user]);

  useEffect(() => {
    async function loadMessages() {
      if (!selectedSessionId || !user) return;
      try {
        setLoadingMessages(true);
        setErrorMessages(null);
        const supabase = createClient();
        const tenantClient = createTenantScopedClient(supabase);
        const data = await tenantClient.getChatMessages(selectedSessionId);
        setMessages(data);
      } catch (err: any) {
        console.error('Failed to load messages:', err);
        setErrorMessages(err.message || 'Error al cargar los mensajes');
      } finally {
        setLoadingMessages(false);
      }
    }
    loadMessages();
  }, [selectedSessionId, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const selectedSessionRef = useRef(selectedSessionId);
  useEffect(() => {
    selectedSessionRef.current = selectedSessionId;
  }, [selectedSessionId]);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    const channel = (supabase as any).channel('chat_updates')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'n8n_chat_histories' }, (payload: any) => {
        const newMsg = payload.new as ChatMessage;
        setMessages(prev => {
          if (newMsg.session_id === selectedSessionRef.current && !prev.some(m => m.id === newMsg.id)) {
            return [...prev, newMsg];
          }
          return prev;
        });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_sessions' }, (payload: any) => {
        if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
          const updatedSession = payload.new as ChatSession;
          setLeads(prev => {
            const exists = prev.some(l => l.id === updatedSession.id);
            let newLeads = exists 
              ? prev.map(l => l.id === updatedSession.id ? { ...l, ...updatedSession } : l)
              : [updatedSession, ...prev];
            return newLeads.sort((a, b) => new Date(b.last_message_at || b.created_at).getTime() - new Date(a.last_message_at || a.created_at).getTime());
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const selectedLead = leads.find(l => l.id === selectedSessionId);

  const filteredLeads = useMemo(() => {
    if (!searchQuery.trim()) return leads;
    const q = searchQuery.toLowerCase();
    return leads.filter(l => 
      l.customer_name?.toLowerCase().includes(q) || 
      l.customer_phone?.toLowerCase().includes(q)
    );
  }, [leads, searchQuery]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim() || !selectedLead) return;

    const text = newMessage.trim();
    setNewMessage('');

    try {
      const supabase = createClient();
      const tenantClient = createTenantScopedClient(supabase);
      const newMsg = await tenantClient.sendHumanMessage(selectedLead.id, text);
      
      setMessages(prev => [...prev, newMsg]);
      setLeads(prev => prev.map(l => l.id === selectedLead.id ? {
        ...l,
        last_message_text: text,
        last_message_at: newMsg.created_at,
        bot_paused: true
      } : l));
    } catch (err: any) {
      console.error(err);
      alert('Error enviando mensaje: ' + err.message);
    }
  };

  const handleResolve = async () => {
    if (!selectedLead) return;
    try {
      const supabase = createClient();
      const tenantClient = createTenantScopedClient(supabase);
      const updatedSession = await tenantClient.resolveSession(selectedLead.id);
      setLeads(prev => prev.map(l => l.id === selectedLead.id ? { ...l, ...updatedSession } : l));
    } catch (err: any) {
      console.error(err);
      alert('Error al resolver: ' + err.message);
    }
  };

  return (
    <div className="space-y-4">
      {(errorLeads || errorMessages) && (
        <div className="rounded-md bg-destructive/15 p-4 text-destructive border border-destructive/30 shadow-sm">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-5" />
            <h3 className="font-semibold text-lg">Error de Conexión a Base de Datos</h3>
          </div>
          <p className="mt-1 text-sm">{errorLeads || errorMessages}</p>
        </div>
      )}

      {/* Header section with live-pulse status and Sora display font */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="inline-flex h-7 items-center gap-2 rounded-full border border-success/25 bg-success/10 px-2.5 text-xs font-bold text-success">
              <span className="live-pulse size-2 rounded-full bg-success" /> En Vivo
            </span>
            <span className="text-xs text-muted-foreground">{leads.length} conversaciones registradas</span>
          </div>
          <h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl text-foreground">
            Conversaciones WhatsApp
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Monitoreo de conversaciones entre clientes, el asistente virtual y asesores comerciales.
          </p>
        </div>
      </div>
      
      {/* Chat 2-column container */}
      <div className="h-[calc(100vh-14rem)] min-h-[580px] overflow-hidden rounded-lg border border-border bg-card shadow-panel flex flex-col md:flex-row">
        {/* Left Pane: Sessions List */}
        <div className="w-full md:w-[320px] lg:w-[360px] shrink-0 flex flex-col border-r border-border bg-muted/20">
          {/* Search Header */}
          <div className="p-3.5 border-b border-border bg-card/70 backdrop-blur-xs">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input 
                type="text"
                placeholder="Buscar cliente o teléfono..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>
          </div>
          
          {/* Chat Sessions List */}
          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {loadingLeads ? (
              <div className="p-8 text-center text-xs text-muted-foreground animate-pulse">
                Cargando conversaciones...
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No se encontraron conversaciones.
              </div>
            ) : (
              filteredLeads.map((lead) => {
                const isSelected = selectedSessionId === lead.id;
                return (
                  <button
                    key={lead.id}
                    onClick={() => setSelectedSessionId(lead.id)}
                    className={cn(
                      "w-full text-left p-3.5 transition-colors flex items-center gap-3 border-l-4",
                      isSelected
                        ? "bg-muted/80 border-l-primary text-foreground"
                        : "border-l-transparent hover:bg-muted/40 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <div className="size-10 shrink-0 rounded-md bg-accent font-display text-xs font-bold text-accent-foreground flex items-center justify-center uppercase shadow-xs">
                      {(lead.customer_name?.[0] || 'U')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <span className="font-semibold text-sm truncate text-foreground">
                          {lead.customer_name || 'Desconocido'}
                        </span>
                        <span className="text-[11px] text-muted-foreground ml-2 shrink-0 font-mono">
                          {new Date(lead.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-xs text-muted-foreground truncate font-mono">
                          +{lead.customer_phone}
                        </p>
                        {lead.resolution_status === 'derivado' ? (
                          <span className="live-pulse size-2 rounded-full bg-ceibo shrink-0" title="Requiere atención humana" />
                        ) : (
                          <span className="size-2 rounded-full bg-success/60 shrink-0" title="Resuelto por IA" />
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: Active Chat Window */}
        <div className="flex-1 flex flex-col bg-background/50 relative overflow-hidden">
          {selectedSessionId && selectedLead ? (
            <>
              {/* Active Chat Header */}
              <div className="h-16 px-6 flex items-center justify-between border-b border-border bg-card/90 backdrop-blur-xs shrink-0 z-10">
                <div className="flex items-center gap-3">
                  <div className="size-10 shrink-0 rounded-md bg-accent font-display text-xs font-bold text-accent-foreground flex items-center justify-center uppercase shadow-xs">
                    {(selectedLead.customer_name?.[0] || 'U')}
                  </div>
                  <div>
                    <h2 className="font-display font-bold text-sm text-foreground leading-tight">
                      {selectedLead.customer_name || 'Cliente Desconocido'}
                    </h2>
                    <span className="text-xs text-muted-foreground">
                      +{selectedLead.customer_phone} · {selectedLead.query_type ? selectedLead.query_type.replace(/_/g, ' ') : 'Sin clasificar'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {selectedLead.bot_paused && (
                    <Badge variant="warning">
                      <ShieldCheck className="size-3 mr-1" />
                      Bot Pausado
                    </Badge>
                  )}
                  {selectedLead.resolution_status === 'derivado' ? (
                    <div className="flex gap-2 items-center">
                      <Badge variant="ceibo">
                        <Clock className="size-3 mr-1" />
                        Atención Requerida
                      </Badge>
                      <Button variant="outline" size="sm" onClick={handleResolve}>
                        <CheckCircle2 className="size-3 mr-1" />
                        Resolver / Reactivar bot
                      </Button>
                    </div>
                  ) : (
                    <Badge variant="success">
                      <CheckCircle2 className="size-3 mr-1" />
                      Resuelto por IA
                    </Badge>
                  )}
                </div>
              </div>

              {/* Message History */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {loadingMessages ? (
                  <div className="text-center text-xs text-muted-foreground mt-12 animate-pulse">
                    Cargando historial de mensajes...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-xs text-muted-foreground mt-12">
                    No hay mensajes en esta conversación.
                  </div>
                ) : (
                  <>
                    <div className="text-center my-2">
                      <span className="inline-block px-3 py-1 bg-muted/70 text-muted-foreground text-[11px] rounded-full font-medium">
                        Inicio de la conversación WhatsApp
                      </span>
                    </div>
                    
                    {messages.map((msg) => {
                      const isUser = msg.sender_type === 'user';
                      const isBot = msg.sender_type === 'bot';
                      const isAgent = msg.sender_type === 'human_agent';

                      return (
                        <div key={msg.id} className={cn("flex flex-col", isUser ? "items-start" : "items-end")}>
                          {isUser && (
                            /* Customer message: Forest green sidebar bubble */
                            <div className="max-w-[80%] sm:max-w-[70%] rounded-2xl rounded-tl-xs bg-sidebar text-white p-3.5 shadow-panel">
                              <div className="text-[10px] font-bold uppercase tracking-wider text-sidebar-foreground/70 mb-1">
                                Cliente ({selectedLead.customer_name || `+${selectedLead.customer_phone}`})
                              </div>
                              <p className="text-sm whitespace-pre-wrap leading-relaxed text-white">
                                {msg.message_text}
                              </p>
                              <span className="text-[10px] text-sidebar-foreground/60 mt-1.5 block text-right font-mono">
                                {new Date(msg.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          )}

                          {isBot && (
                            /* AI Bot message: White card with border and success indicator */
                            <div className="max-w-[80%] sm:max-w-[70%] rounded-2xl rounded-tr-xs bg-card border border-border text-card-foreground p-3.5 shadow-panel">
                              <div className="text-[10px] font-bold text-success uppercase flex items-center gap-1.5 mb-1">
                                <Bot className="size-3.5 text-success" />
                                Bot WhatsApp · IA
                              </div>
                              <p className="text-sm whitespace-pre-wrap leading-relaxed text-foreground">
                                {msg.message_text}
                              </p>
                              <span className="text-[10px] text-muted-foreground mt-1.5 block text-right font-mono">
                                {new Date(msg.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          )}

                          {isAgent && (
                            /* Human Agent message: Ceibo-soft tint with terracotta border */
                            <div className="max-w-[80%] sm:max-w-[70%] rounded-2xl rounded-tr-xs bg-ceibo-soft text-foreground border border-ceibo/25 p-3.5 shadow-action">
                              <div className="text-[10px] font-bold text-ceibo uppercase flex items-center gap-1.5 mb-1">
                                <UserCheck className="size-3.5 text-ceibo" />
                                Asesor Comercial (Tú)
                              </div>
                              <p className="text-sm whitespace-pre-wrap leading-relaxed text-foreground">
                                {msg.message_text}
                              </p>
                              <span className="text-[10px] text-ceibo/80 mt-1.5 block text-right font-mono">
                                {new Date(msg.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input / Composer */}
              <div className="p-3.5 bg-card border-t border-border shrink-0">
                {selectedLead.resolution_status === 'derivado' ? (
                  <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <Input 
                      type="text" 
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      placeholder="Escribir un mensaje como asesor comercial..."
                      className="flex-1 h-11"
                    />
                    <Button 
                      type="submit"
                      variant="primary"
                      disabled={!newMessage.trim()}
                      className="h-11 px-5 shadow-action shrink-0"
                    >
                      <Send className="size-4" />
                      <span>Enviar</span>
                    </Button>
                  </form>
                ) : (
                  <div className="text-center px-4 py-3 rounded-lg border border-accent/20 bg-accent/5 text-xs text-muted-foreground flex items-center justify-center gap-2">
                    <CheckCircle2 className="size-4 text-success" />
                    Esta consulta fue resuelta exitosamente por la IA. El chat está cerrado.
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Empty State */
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
              <div className="size-16 bg-muted/60 border border-border rounded-lg flex items-center justify-center mb-4 text-primary shadow-panel">
                <MessageSquare className="size-8" strokeWidth={1.8} />
              </div>
              <h3 className="font-display font-bold text-lg text-foreground mb-1">
                Ninguna conversación seleccionada
              </h3>
              <p className="text-sm text-center max-w-sm text-muted-foreground">
                Seleccioná un cliente de la lista de la izquierda para inspeccionar el diálogo en tiempo real con el asistente virtual.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
