import { Inter } from 'next/font/google';
import './dashboard.css';

// Tipografia del diseño nuevo del dashboard: se carga solo para esta ruta
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <div className={inter.variable}>{children}</div>;
}
