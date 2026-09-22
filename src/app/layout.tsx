import type { Metadata } from 'next';
import { Manrope, Sora } from 'next/font/google';
import './globals.css';
import { AppShell } from '@/components/layout/app-shell';
import { AuthProvider } from '@/contexts/auth-context';
import { ToastProvider } from '@/contexts/toast-context';
import { ToastContainer } from '@/components/ui/toast';

const manrope = Manrope({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
  fallback: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
});

const sora = Sora({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
  fallback: ['ui-sans-serif', 'system-ui', 'sans-serif'],
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
    <html lang="es" className={`${manrope.variable} ${sora.variable} h-full bg-background text-foreground`}>
      <body className="min-h-full font-sans bg-background text-foreground antialiased" style={{ fontFamily: 'var(--font-sans), system-ui, sans-serif' }}>
        <AuthProvider>
          <ToastProvider>
            <AppShell>{children}</AppShell>
            <ToastContainer />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
