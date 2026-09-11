# Ceibo AI - B2B SaaS WhatsApp Sales Assistant Dashboard

Ceibo AI es una plataforma B2B SaaS moderna diseñada para PyMEs que implementan asistentes de ventas inteligentes sobre WhatsApp. Permite a los directores comerciales y dueños de negocio monitorear métricas clave en tiempo real, visualizar el ahorro de horas operativas y auditar la resolución automatizada de consultas versus la derivación a agentes humanos.

---

## 🚀 Stack Tecnológico

- **Framework**: [Next.js 14.2 (App Router)](https://nextjs.org/)
- **Lenguaje**: TypeScript 5
- **UI & Estilos**: [Tailwind CSS v3.4](https://tailwindcss.com/) con paleta Slate / Emerald WhatsApp
- **Iconografía**: [Lucide React](https://lucide.dev/)
- **Visualización de Datos**: [Recharts](https://recharts.org/) (gráficos comparativos de 30 días)
- **Base de Datos & Autenticación**: Supabase (`@supabase/ssr`, `@supabase/supabase-js`) con arquitectura dual (Live Supabase + Mock Engine local)
- **Aislamiento Multi-Tenant**: Columna discriminadora `empresa_id` con Row Level Security (RLS) y clientes con alcance de tenant.

---

## 📁 Estructura del Proyecto

```
ceibo_ai/
├── src/
│   ├── app/
│   │   ├── layout.tsx             # Root layout con tipografía Inter y AppShell
│   │   ├── globals.css            # Directivas Tailwind y variables de diseño
│   │   ├── page.tsx               # Dashboard principal con métricas y gráfico
│   │   ├── login/
│   │   │   └── page.tsx           # Pantalla de autenticación B2B y selección de tenant
│   │   ├── inbox/
│   │   │   └── page.tsx           # Bandeja de entrada de WhatsApp (Próximamente)
│   │   ├── chats/
│   │   │   └── page.tsx           # Historial y transcripción de conversaciones (Próximamente)
│   │   ├── documents/
│   │   │   └── page.tsx           # Carga de catálogo y documentación RAG (Próximamente)
│   │   └── settings/
│   │       └── page.tsx           # Configuración de empresa y canal WhatsApp (Próximamente)
│   ├── components/
│   │   ├── layout/
│   │   │   ├── sidebar.tsx        # Navegación lateral B2B con badges informativos
│   │   │   ├── navbar.tsx         # Barra superior con selector de tenant y perfil
│   │   │   └── app-shell.tsx      # Contenedor reactivo con navegación integrada
│   │   └── ui/
│   │       ├── button.tsx         # Botón reutilizable con variantes B2B
│   │       ├── card.tsx           # Componente de tarjeta estructurada
│   │       └── badge.tsx          # Insignia de estado y tags
│   └── lib/
│       └── utils.ts               # Utilidades de clases (`cn`) y formateo numérico
├── .env.example
├── .env.local
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

---

## 🛠️ Instalación y Ejecución

1. **Instalar dependencias**:
   ```bash
   npm install
   ```

2. **Iniciar servidor de desarrollo**:
   ```bash
   npm run dev
   ```
   Abrir [http://localhost:3000](http://localhost:3000) en el navegador.

3. **Compilar para producción**:
   ```bash
   npm run build
   npm run start
   ```

4. **Verificación de tipos TypeScript**:
   ```bash
   npm run typecheck
   ```

---

## 🔐 Configuración de Autenticación y Multi-Tenancy

Ceibo AI cuenta con modo dual out-of-the-box:
- **Modo Mock (por defecto sin credenciales)**: Permite probar la aplicación de forma inmediata y aislada con tenants de muestra preconfigurados (`Ceibo Demo SMB` vs `Rival Retail`).
- **Modo Supabase en la nube**: Configura tus variables en `.env.local` con `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

---

## 🧭 Navegación del Sistema

| Ruta | Descripción | Estado |
|---|---|---|
| `/` | Dashboard principal (Métricas de ventas, horas ahorradas y evolución 30 días) | Activo |
| `/login` | Ingreso B2B y cambio de cuenta/tenant | Activo |
| `/inbox` | Bandeja unificada de conversaciones WhatsApp | Próximamente |
| `/chats` | Registro detallado de sesiones de chat y logs IA | Próximamente |
| `/documents` | Repositorio documental para entrenamiento RAG | Próximamente |
| `/settings` | Configuración de empresa, webhook y número WhatsApp | Próximamente |
