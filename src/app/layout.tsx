import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AppShell } from '@/components/layout/app-shell';
import { AuthProvider } from '@/contexts/auth-context';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  fallback: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
});

export const metadata: Metadata = {
  title: 'Ceibo AI - Dashboard de Asistente de Ventas WhatsApp',
  description:
    'Plataforma B2B SaaS para PyMEs: Monitoreo en tiempo real, volumen de consultas WhatsApp, horas de venta ahorradas y análisis comparativo IA vs Humano.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${inter.variable} h-full bg-slate-50`}>
      <body className="min-h-full font-sans bg-slate-50 text-slate-900 antialiased">
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
