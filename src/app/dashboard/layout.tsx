import './dashboard.css';

// La tipografia (Inter) y el tema claro/oscuro ahora vienen del layout raiz y de globals.css.
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
