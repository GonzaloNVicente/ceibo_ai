import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AppShell } from '@/components/layout/app-shell';
import { AuthProvider } from '@/contexts/auth-context';
import { ThemeProvider } from '@/contexts/theme-context';
import { ToastProvider } from '@/contexts/toast-context';
import { ToastContainer } from '@/components/ui/toast';
import { THEME_INIT_SCRIPT } from '@/lib/theme';

// Tipografia unica de toda la app (la del diseño nuevo del dashboard)
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-sans',
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
    // suppressHydrationWarning: el script del <head> agrega la clase `dark` antes de que React hidrate
    <html lang="es" suppressHydrationWarning className={`${inter.variable} h-full bg-background text-foreground`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full font-sans bg-background text-foreground antialiased">
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <AppShell>{children}</AppShell>
              <ToastContainer />
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
