'use client';

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

export default function LoginPage() {
  const router = useRouter();
  const { signIn, loading: authLoading } = useAuth();

  const [email, setEmail] = useState('admin@ceibo.ai');
  const [password, setPassword] = useState('password123');
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
        router.push('/');
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
        router.push('/');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error al conectar con el tenant.');
      setSubmitting(false);
    }
  };

  const isLoading = submitting || authLoading;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex flex-col justify-center items-center p-4">
      {/* Brand Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/25 mb-4">
          <Bot className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Ceibo AI</h1>
        <p className="text-sm text-slate-500 mt-1 font-medium">
          Dashboard B2B de Asistentes WhatsApp para PyMEs
        </p>
      </div>

      {/* Login Card */}
      <Card className="w-full max-w-md shadow-xl border-slate-200">
        <CardHeader className="space-y-1 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-slate-900">
              Iniciar Sesión
            </CardTitle>
            <Badge variant="success" className="text-xs bg-emerald-100 text-emerald-800">
              Supabase Auth
            </Badge>
          </div>
          <CardDescription>
            Accede al panel de control de tu empresa y métricas de ventas.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            {errorMessage && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@tuempresa.com"
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 pl-9 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 pl-9 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="brand"
              className="w-full font-semibold shadow-md shadow-emerald-600/20"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  <span>Ingresando...</span>
                </>
              ) : (
                <>
                  <span>Ingresar al Dashboard</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </CardContent>
        </form>

        {/* Quick Demo Tenant Switcher */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 rounded-b-xl space-y-2.5">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Acceso rápido a tenants demo:</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickTenant('admin@ceibo.ai')}
              disabled={isLoading}
              className="text-left p-2.5 rounded-lg border border-slate-200 bg-white hover:border-emerald-500 hover:bg-emerald-50/40 transition group text-xs disabled:opacity-50"
            >
              <div className="font-semibold text-slate-800 group-hover:text-emerald-700 flex items-center gap-1">
                <Building2 className="w-3 h-3 text-emerald-600" />
                Ceibo AI
              </div>
              <div className="text-[11px] text-slate-400">admin@ceibo.ai</div>
              <div className="text-[10px] text-emerald-600 font-medium mt-0.5">Enterprise</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickTenant('carlos@rival.com')}
              disabled={isLoading}
              className="text-left p-2.5 rounded-lg border border-slate-200 bg-white hover:border-blue-500 hover:bg-blue-50/40 transition group text-xs disabled:opacity-50"
            >
              <div className="font-semibold text-slate-800 group-hover:text-blue-700 flex items-center gap-1">
                <Building2 className="w-3 h-3 text-blue-600" />
                Rival Retail
              </div>
              <div className="text-[11px] text-slate-400">carlos@rival.com</div>
              <div className="text-[10px] text-blue-600 font-medium mt-0.5">Starter</div>
            </button>
          </div>

          <div className="flex items-center gap-2 pt-2 text-[11px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Aislamiento estricto por <code>empresa_id</code> y Row Level Security.</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
