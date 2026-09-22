"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bot,
  ShieldCheck,
  Building2,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/auth-context';
import { BrandMark } from '@/components/layout/sidebar';

export default function LoginPage() {
  const router = useRouter();
  const { signIn, loading: authLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSubmitting(true);

    try {
      const res = await signIn(email, password);
      if (res?.error) {
        setErrorMessage(res.error);
        setSubmitting(false);
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error al iniciar sesión.');
      setSubmitting(false);
    }
  };

  const handleQuickTenant = async (tenantEmail: string) => {
    setEmail(tenantEmail);
    setPassword('password123');
    setErrorMessage(null);
    setSubmitting(true);

    try {
      const res = await signIn(tenantEmail, 'password123');
      if (res?.error) {
        setErrorMessage(res.error);
        setSubmitting(false);
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error al conectar con el tenant.');
      setSubmitting(false);
    }
  };

  const isLoading = submitting || authLoading;
  const showDemo = process.env.NEXT_PUBLIC_SHOW_DEMO_LOGINS === 'true';

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4">
      {/* Brand Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-primary font-display text-2xl font-bold text-primary-foreground shadow-action">
            C
          </div>
        </div>
        <h1 className="font-display text-3xl font-bold text-foreground">Ceibo AI</h1>
        <p className="text-sm text-muted-foreground mt-1 font-medium">
          Dashboard B2B de Asistentes WhatsApp para PyMEs
        </p>
      </div>

      {/* Login Card */}
      <Card className="w-full max-w-md shadow-panel border-border">
        <CardHeader className="space-y-1 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-display font-bold text-foreground">
              Iniciar Sesión
            </CardTitle>
            <Badge variant="ceibo">
              Supabase Auth
            </Badge>
          </div>
          <CardDescription>
            Accedé al panel de control de tu empresa y reportes operativos.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            {errorMessage && (
              <div className="p-3 rounded-lg bg-destructive/15 border border-destructive/30 text-destructive text-xs flex items-center gap-2">
                <AlertCircle className="size-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground uppercase tracking-wider block">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="size-4 text-muted-foreground absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@tuempresa.com"
                  className="w-full h-10 rounded-md border border-border bg-card px-3 py-2 pl-9 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary transition"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground uppercase tracking-wider block">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="size-4 text-muted-foreground absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-10 rounded-md border border-border bg-card px-3 py-2 pl-9 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary transition"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full font-semibold shadow-action h-10 mt-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  <span>Ingresando...</span>
                </>
              ) : (
                <>
                  <span>Ingresar al Dashboard</span>
                  <ArrowRight className="size-4 ml-2" />
                </>
              )}
            </Button>
          </CardContent>
        </form>

        {/* Quick Demo Tenant Switcher */}
        {showDemo && (
          <div className="px-6 py-4 bg-muted/20 border-t border-border rounded-b-xl space-y-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
              <span>Acceso rápido a tenants demo:</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickTenant('admin@ceibo.ai')}
                disabled={isLoading}
                className="text-left p-2.5 rounded-lg border border-border bg-card hover:border-primary/50 transition group text-xs disabled:opacity-50"
              >
                <div className="font-bold text-foreground flex items-center gap-1.5">
                  <Building2 className="size-3.5 text-ceibo" />
                  Ceibo AI
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">admin@ceibo.ai</div>
                <div className="text-[10px] text-ceibo font-bold mt-1 uppercase">Enterprise</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickTenant('carlos@rival.com')}
                disabled={isLoading}
                className="text-left p-2.5 rounded-lg border border-border bg-card hover:border-blue-500/50 transition group text-xs disabled:opacity-50"
              >
                <div className="font-bold text-foreground flex items-center gap-1.5">
                  <Building2 className="size-3.5 text-blue-600" />
                  Rival Retail
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">carlos@rival.com</div>
                <div className="text-[10px] text-blue-600 font-bold mt-1 uppercase">Starter</div>
              </button>
            </div>

            <div className="flex items-center gap-2 pt-1 text-[11px] text-muted-foreground">
              <ShieldCheck className="size-3.5 text-ceibo shrink-0" />
              <span>Aislamiento estricto por <code>empresa_id</code> y Row Level Security.</span>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
