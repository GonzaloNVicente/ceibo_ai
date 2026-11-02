import React from 'react';
import Link from 'next/link';
import { ArrowRight, Bot, ShieldCheck, Zap, BarChart3, MessageSquareText } from 'lucide-react';
import { BrandMark } from '@/components/layout/sidebar';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 lg:px-12 border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <BrandMark />
          <span className="text-xl font-semibold tracking-tight text-foreground">Ceibo AI</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
            Iniciar Sesión
          </Link>
          <Link 
            href="/dashboard" 
            className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110 transition"
          >
            Ver Demo <ArrowRight className="size-4" />
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-32 lg:pt-36 lg:pb-40">
        {/* Abstract Background Glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/15 rounded-full blur-[120px] opacity-50 -z-10 pointer-events-none" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-success/10 rounded-full blur-[100px] opacity-40 -z-10 pointer-events-none" />
        
        <div className="mx-auto max-w-5xl px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-success/10 px-3 py-1.5 text-sm font-semibold text-success mb-8">
            <span className="relative flex size-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
              <span className="relative inline-flex rounded-full size-2.5 bg-success"></span>
            </span>
            Asistentes entrenados y operativos 24/7
          </div>
          
          <h1 className="text-5xl font-bold tracking-tight sm:text-7xl lg:text-[80px] leading-[1.1] mb-8">
            Revolucioná tus ventas por WhatsApp con <span className="text-primary">Inteligencia Artificial</span>
          </h1>
          
          <p className="mx-auto max-w-2xl text-lg sm:text-xl text-muted-foreground mb-12 leading-relaxed">
            Ceibo AI automatiza el primer contacto, califica prospectos, responde consultas frecuentes y escala leads comerciales listos para cerrar, liberando el tiempo de tu equipo de ventas.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/dashboard"
              className="flex items-center gap-2 rounded-full bg-foreground px-8 py-4 text-base font-semibold text-background hover:opacity-90 transition"
            >
              Explorar el Dashboard <ArrowRight className="size-5" />
            </Link>
            <Link 
              href="/login"
              className="flex items-center gap-2 rounded-full bg-card px-8 py-4 text-base font-semibold text-foreground shadow-panel hover:bg-secondary transition-colors"
            >
              Contactar Ventas
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">Construido para escalar B2B</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">Nuestra plataforma te da el control total sobre la operación automatizada de tu empresa.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card p-8 rounded-card shadow-panel">
              <div className="size-12 rounded-xl bg-warning/10 text-warning flex items-center justify-center mb-6">
                <MessageSquareText className="size-6" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Respuestas Contextuales</h3>
              <p className="text-muted-foreground leading-relaxed">El asistente entiende la intención del cliente y responde basándose en tu propia base de conocimiento institucional.</p>
            </div>
            
            <div className="bg-card p-8 rounded-card shadow-panel">
              <div className="size-12 rounded-xl bg-success/10 text-success flex items-center justify-center mb-6">
                <BarChart3 className="size-6" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Métricas en Tiempo Real</h3>
              <p className="text-muted-foreground leading-relaxed">Visualizá cuántas horas de trabajo ahorrás y qué porcentaje de consultas resuelve la IA sin intervención humana.</p>
            </div>
            
            <div className="bg-card p-8 rounded-card shadow-panel">
              <div className="size-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                <ShieldCheck className="size-6" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Seguridad Multi-Tenant</h3>
              <p className="text-muted-foreground leading-relaxed">Tu base de conocimiento y los chats de tus clientes están aislados criptográficamente para tu empresa exclusivamente.</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="border-t border-border py-12 text-center">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Ceibo AI Tech Solutions. Desarrollado para el futuro de las ventas.
        </p>
      </footer>
    </div>
  );
}
