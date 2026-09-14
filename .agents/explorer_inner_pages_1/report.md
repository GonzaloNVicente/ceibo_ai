# Comprehensive Analysis Report: Inner Pages Visual Parity & Architecture

**Project**: Ceibo AI (`ceibo_ai`)  
**Reference**: Ceibo Command Center (`ceibo_ref`)  
**Target Scope**: Inner Pages (`/inbox`, `/chats`, `/documents`, `/settings`) & UI Primitives  
**Author**: `explorer_inner_pages_1`  
**Date**: 2026-09-14T01:10:00Z  

---

## 1. Executive Summary

A comprehensive investigation was conducted comparing the reference Vite/TanStack Start application (`ceibo_ref`) with the current Next.js 14 App Router application (`ceibo_ai`).

### Key Discoveries:
1. **Reference Scope Boundary**: The reference project `ceibo_ref` has **only one functional route** (`/` located at `ceibo_ref/src/routes/index.tsx`). Its sidebar contains anchor navigation links (`#inbox`, `#chats`, `#base-de-conocimiento`, `#configuración`), but no dedicated sub-route pages or sub-views were implemented in `ceibo_ref`.
2. **Design Language System**: `ceibo_ref` defines a complete, distinctive design system in `ceibo_ref/src/styles.css`, `ceibo_ref/src/routes/index.tsx`, and `ceibo_ref/src/components/ui/*`. This design system is characterized by:
   - **Typography**: Dual font hierarchy — **Sora** (`var(--font-display)`) for headings, branding marks, numeric KPIs, and avatar initials; **Manrope** (`var(--font-sans)`) for body copy, tables, labels, and form controls.
   - **Color Palette (OKLCH)**: Terracotta primary (`#bf442b` / `oklch(0.555 0.163 33.5)`), Forest Green dark sidebar (`#12251e` / `oklch(0.244 0.028 169.1)`), Emerald success (`#0e724e` / `oklch(0.49 0.103 162.1)`), Canvas off-white background (`#f5f8f5` / `oklch(0.976 0.006 145.1)`), Soft terracotta badge fill (`oklch(0.94 0.025 36.5)`), and Pine charcoal text (`oklch(0.244 0.028 169.1)`).
   - **Component Textures & Elevation**: 3D action bevel shadow (`--shadow-action: 0 4px 0 oklch(0.41 0.117 33.5)`), soft panel shadow (`--shadow-panel: 0 16px 44px -34px oklch(0.244 0.028 169.1 / 42%)`), rounded-lg card containers, and live-pulse indicator animations.
3. **Current Inner Pages State in `ceibo_ai`**: The current inner pages (`src/app/inbox`, `src/app/chats`, `src/app/documents`, `src/app/settings`, and `src/app/login`) contain hardcoded Tailwind utility classes (`slate-50`, `slate-100`, `slate-200`, `slate-900`, `brand-600`, `blue-50`, `amber-100`) and standard sans fonts. They fail to reflect the reference design system, creating a stark visual dissonance between the rewritten App Shell/Dashboard and the inner pages.
4. **Supabase Mock-Data Wiring**: All 4 inner pages already feature complete, robust mock-data integration through `useAuth()`, `createClient()`, and `createTenantScopedClient()`. This functional wiring must be 100% preserved during the reskinning process.

---

## 2. Reference Project (`ceibo_ref`) Pattern Catalog

### 2.1 Route Architecture
In `ceibo_ref/src/routeTree.gen.ts` and `ceibo_ref/src/routes/`:
- `routes/__root.tsx`: Provides HTML shell, font imports (Google Fonts: Sora 500/600/700 & Manrope 400/500/600/700), global stylesheet (`styles.css`), and TanStack `QueryClientProvider` + `<Outlet />`.
- `routes/index.tsx`: Contains the Dashboard page, Sidebar component, Topbar component, MetricBand, ActivityChart, and Security Footer.
- `components/ui/*`: Contains standard shadcn/ui primitives (`button.tsx`, `card.tsx`, `badge.tsx`, `table.tsx`, `input.tsx`, `tabs.tsx`).

### 2.2 Design System Primitives & CSS Variables

| Token Name | OKLCH Value | Approximate Hex / Usage | Tailwind Utility Class |
|---|---|---|---|
| `--primary` / `--ceibo` | `oklch(0.555 0.163 33.5)` | `#bf442b` (Terracotta) | `bg-primary`, `text-ceibo`, `border-primary` |
| `--ceibo-soft` | `oklch(0.94 0.025 36.5)` | Light terracotta tint | `bg-ceibo-soft text-ceibo` |
| `--sidebar` | `oklch(0.244 0.028 169.1)` | `#12251e` (Deep Forest Pine) | `bg-sidebar text-sidebar-foreground` |
| `--sidebar-accent` | `oklch(0.368 0.041 166.1)` | Mid Forest Green | `bg-sidebar-accent` |
| `--background` | `oklch(0.976 0.006 145.1)` | `#f5f8f5` (Canvas warm off-white) | `bg-background` |
| `--card` | `oklch(1 0 0)` | `#ffffff` (Pure White) | `bg-card text-card-foreground` |
| `--foreground` | `oklch(0.244 0.028 169.1)` | `#12251e` (Dark Pine Charcoal) | `text-foreground` |
| `--muted` | `oklch(0.922 0.008 147.2)` | Very light sage/gray | `bg-muted text-muted-foreground` |
| `--muted-foreground` | `oklch(0.494 0.025 167.3)` | Medium sage slate | `text-muted-foreground` |
| `--border` / `--input` | `oklch(0.87 0.009 147.4)` | Light border line | `border-border`, `border-input` |
| `--success` | `oklch(0.49 0.103 162.1)` | `#0e724e` (Emerald Green) | `bg-success`, `text-success` |
| `--shadow-action` | `0 4px 0 oklch(0.41 0.117 33.5)` | 3D Terracotta button shadow | `shadow-action` |
| `--shadow-panel` | `0 16px 44px -34px oklch(0.244 0.028 169.1 / 42%)` | Soft card elevation shadow | `shadow-panel` |

### 2.3 Component Archetypes in `ceibo_ref`
1. **Header & Status Band**:
   - Status Pill:
     ```tsx
     <span className="inline-flex h-7 items-center gap-2 rounded-full border border-success/25 bg-success/10 px-2.5 text-xs font-bold text-success">
       <span className="live-pulse size-2 rounded-full bg-success" /> En Vivo
     </span>
     ```
   - Title: `font-display text-3xl font-bold leading-[1.08] sm:text-4xl text-foreground`
   - Subtitle: `mt-3 max-w-3xl text-sm leading-6 text-muted-foreground`
   - Actions:
     ```tsx
     <Button variant="secondary"><RefreshCw className="size-4" />Actualizar</Button>
     <Button variant="primary"><Sparkles className="size-4" />Entrenar Asistente</Button>
     ```

2. **Buttons (`ceibo_ref/src/components/ui/button.tsx`)**:
   - `primary` / `default`: `border border-primary bg-primary text-primary-foreground shadow-action hover:bg-primary/90`
   - `secondary` / `outline`: `border border-border bg-card text-foreground hover:border-primary/35 hover:bg-secondary`
   - `ghost`: `border border-transparent bg-transparent text-muted-foreground hover:bg-secondary hover:text-foreground`
   - `destructive`: `bg-destructive text-destructive-foreground hover:bg-destructive/90`

3. **Cards & Panels**:
   - Standard Card: `rounded-lg border border-border bg-card p-5 sm:p-6 shadow-panel`
   - Unified Section Card: `overflow-hidden rounded-lg border border-border bg-card shadow-panel`
   - Callout / Info Accent Card: `rounded-lg border border-accent/20 bg-accent/5 p-4`

4. **Badges**:
   - Enterprise / Plan: `rounded bg-ceibo-soft px-2 py-1 text-[10px] font-bold text-ceibo`
   - Live / Operativo: `rounded-full border border-success/25 bg-success/10 px-2.5 py-0.5 text-xs font-bold text-success`
   - Escalated / Pendiente: `rounded-full border border-ceibo/25 bg-ceibo-soft px-2.5 py-0.5 text-xs font-bold text-ceibo`
   - Muted / Neutral: `rounded-full border border-border bg-muted/60 px-2.5 py-0.5 text-xs font-semibold text-muted-foreground`

5. **Tables**:
   - Wrapper: `rounded-lg border border-border overflow-hidden bg-card shadow-panel`
   - Header: `thead bg-muted/40 border-b border-border` with `th h-10 px-4 text-left align-middle font-semibold text-xs text-muted-foreground uppercase tracking-wider`
   - Body: `tbody divide-y divide-border` with `tr hover:bg-muted/30 transition-colors` and `td p-4 align-middle text-sm text-foreground`

6. **Inputs & Form Controls**:
   - Input: `h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-primary`
   - Select: `h-9 rounded-md border border-input bg-card px-3 py-1 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-primary`

---

## 3. Detailed Page-by-Page Comparison & Discrepancies

### 3.1 Page 1: Inbox de Leads (`src/app/inbox/page.tsx`)

#### Current Deficiencies
- **Header**: Uses standard Tailwind sans `h1 className="text-3xl font-bold tracking-tight"` without `font-display` (Sora font). Lacks status pill and tenant contextual subtitle.
- **Filters & Search**: Controls use unstyled raw inputs with standard `border-input bg-transparent`.
- **Card**: Relies on the old `Card` component with hardcoded `border-slate-200 bg-white text-slate-950 shadow-sm`.
- **Tabs**: Tab switcher uses basic underline buttons (`border-b-2 ${statusFilter === ... ? 'border-primary text-primary' : ...}`).
- **Status Badges**: Uses non-reference Tailwind color scales:
  - `Sin categorizar`: `text-amber-600 border-amber-200 bg-amber-50`
  - `Pendiente`: `Badge variant="destructive"` (`bg-red-100 text-red-700`)
  - `Atendido`: `Badge variant="secondary"` (`bg-slate-100 text-slate-700`)
- **Action Buttons**: Asignar button uses unstyled `variant="outline"`.

#### Existing Supabase Mock-Data Wiring
- **Auth Hook**: `const { user, perfil } = useAuth();`
- **Data Query**:
  ```ts
  const supabase = createClient(); // or getBrowserMockClient()
  const tenantClient = getTenantScopedClient(supabase);
  const data = await tenantClient.getLeads();
  setLeads(data);
  ```
- **State Properties**:
  - `leads`: Array of `ChatAnalyticsRaw`
  - `searchQuery`: Filter by `customer_name` or `customer_phone`
  - `statusFilter`: Filter by `'all' | 'derivado' | 'resuelto' | 'uncategorized'`
  - `typeFilter`: Filter by query type (`pedido_presupuesto`, `reclamo`, `consulta_stock`, `consulta_precio`, `pedido`)
  - `handleAssign(id)`: Alerts `Asignado a ${perfil?.full_name || 'ti'}`
  - Sorting: Prioritizes `derivado` and uncategorized leads descending by date, followed by attended leads descending by date.

#### Concrete Reskin Plan
1. **Header**:
   ```tsx
   <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
     <div>
       <div className="mb-2 flex items-center gap-2">
         <span className="inline-flex h-7 items-center gap-2 rounded-full border border-success/25 bg-success/10 px-2.5 text-xs font-bold text-success">
           <span className="live-pulse size-2 rounded-full bg-success" /> En Vivo
         </span>
         <span className="text-xs text-muted-foreground">{totalCount} leads registrados</span>
       </div>
       <h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl text-foreground">
         Inbox de Leads WhatsApp
       </h1>
       <p className="mt-1 text-sm text-muted-foreground">
         Gestión comercial y asignación de leads calificados por la IA en tiempo real.
       </p>
     </div>
     <div className="flex flex-wrap items-center gap-2">
       {/* Search and type filter */}
     </div>
   </div>
   ```
2. **Tab Switcher**: Implement segmented pill tab bar (`inline-flex h-10 items-center rounded-lg bg-muted p-1 border border-border`) with count chips.
3. **Table Styling**: Enclose in `rounded-lg border border-border bg-card shadow-panel overflow-hidden` with `thead bg-muted/40 border-b border-border` and hover state `hover:bg-muted/30`.
4. **Badge Colors**:
   - `derivado` (Pendiente): `<Badge variant="ceibo"><Clock className="size-3 mr-1" /> Pendiente</Badge>`
   - `resuelto` (Atendido): `<Badge variant="success"><CheckCircle2 className="size-3 mr-1" /> Atendido</Badge>`
   - `uncategorized`: `<Badge variant="warning"><HelpCircle className="size-3 mr-1" /> Sin clasificar</Badge>`
5. **Action Button**: `<Button variant="secondary" size="sm" onClick={() => handleAssign(lead.id)}><UserCheck className="size-3.5" /> Asignar</Button>`.

---

### 3.2 Page 2: Conversaciones (`src/app/chats/page.tsx`)

#### Current Deficiencies
- **Layout Shell**: Enclosed in `border rounded-xl shadow-sm bg-white` with arbitrary hardcoded slate colors (`bg-slate-50/50`, `bg-slate-100`, `text-slate-900`, `text-slate-800`).
- **Sidebar List**:
  - Customer avatars use `bg-brand-100 text-brand-700` (emerald Tailwind hardcoding).
  - Selected item uses `bg-slate-100 border-l-4 border-l-brand-500`.
  - Alert dot uses raw `bg-red-500`.
- **Chat Bubbles**:
  - Customer bubble: `bg-white border text-slate-800`.
  - Agent / Bot bubble: `bg-brand-600 text-white` (harsh generic green).
- **Chat Input Bar**: Input has `bg-slate-100 focus:border-brand-500`. Send button is `bg-brand-600 text-white rounded-full` rather than using the reference primary button with `shadow-action`.
- **Closed Session Banner**: Styled with `bg-slate-50 border border-slate-200 text-slate-500`.

#### Existing Supabase Mock-Data Wiring
- **Auth Hook**: `const { user } = useAuth();`
- **Queries**:
  - Sessions: `tenantClient.getLeads()` -> `leads: ChatAnalyticsRaw[]`
  - Messages: `tenantClient.getChatMessages(selectedSessionId)` -> `messages: ChatMessage[]`
    - Fields: `id`, `session_id`, `empresa_id`, `message_text`, `sender_type` (`'user' | 'bot' | 'human_agent'`), `created_at`
- **State & Handlers**:
  - `selectedSessionId`: string | null
  - `handleSendMessage()`: Appends optimistic message with `sender_type: 'human_agent'`, clears input, scrolls smoothly into view.
  - Closed conversation barrier: If `selectedLead.resolution_status !== 'derivado'`, the input is replaced with a closed session notification.

#### Concrete Reskin Plan
1. **Container**:
   `h-[calc(100vh-13rem)] min-h-[580px] overflow-hidden rounded-lg border border-border bg-card shadow-panel flex flex-col md:flex-row`.
2. **Left Session Panel**:
   - Header with search: `border-b border-border bg-muted/20 p-3.5`.
   - Client Avatar: `size-10 rounded-md bg-accent font-display text-xs font-bold text-accent-foreground` (matches Topbar avatar!).
   - Selected Item: `bg-muted/80 border-l-4 border-l-primary text-foreground font-medium`.
   - Escalated status: `<span className="live-pulse size-2 rounded-full bg-ceibo" title="Requiere atención humana" />`.
3. **Right Chat Area**:
   - Chat Header: `h-16 px-6 flex items-center border-b border-border bg-card/90 backdrop-blur-xs`.
   - Message Area Background: `bg-background/40`.
   - User Bubble: `max-w-[75%] rounded-2xl rounded-tl-xs border border-border bg-card p-3.5 text-sm text-foreground shadow-xs`.
   - Bot Bubble: `max-w-[75%] rounded-2xl rounded-tr-xs bg-sidebar p-3.5 text-sm text-sidebar-foreground shadow-xs` with `<div className="text-[10px] font-bold text-success uppercase flex items-center gap-1"><Bot className="size-3" /> Bot WhatsApp</div>`.
   - Agent Bubble: `max-w-[75%] rounded-2xl rounded-tr-xs bg-primary p-3.5 text-sm text-primary-foreground shadow-action` with `<div className="text-[10px] font-bold text-primary-foreground/80 uppercase">Asesor Humano</div>`.
4. **Chat Input**:
   - Active: `border-t border-border bg-card p-3.5`.
   - Input: `h-11 flex-1 rounded-full border border-border bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-ring focus:border-primary`.
   - Send Button: `size-11 rounded-full bg-primary text-primary-foreground shadow-action hover:bg-primary/90 flex items-center justify-center transition-transform active:translate-y-px`.
   - Closed Session: `rounded-lg border border-accent/20 bg-accent/5 p-3.5 text-xs text-muted-foreground text-center`.

---

### 3.3 Page 3: Base de Conocimiento (`src/app/documents/page.tsx`)

#### Current Deficiencies
- **Header**: Standard `h1 className="text-3xl font-bold tracking-tight"` (no `font-display` Sora).
- **Upload Zone**:
  - Uses `border-slate-300 hover:border-brand-400 hover:bg-slate-50` and `border-brand-500 bg-brand-50`.
  - Icon container: `bg-white border-slate-100 text-slate-400`.
- **Excel Tip Box**: Uses `bg-slate-50 border-slate-200 text-slate-800` and `text-brand-500`.
- **Active Documents Table**:
  - Header: `bg-slate-50 border-b text-slate-500`.
  - File icon: `text-brand-500`.
  - Badges: `bg-amber-100 text-amber-800` (processing), `bg-green-100 text-green-800` (ready), `bg-red-100 text-red-800` (error).
  - Delete button: `text-slate-400 hover:text-red-500 hover:bg-red-50`.

#### Existing Functionality & Wiring
- **State**:
  - `documents`: Pre-seeded with 3 realistic documents (`Lista_Precios_Mayorista_Septiembre.pdf`, `Catalogo_Pinturas_2026.pdf`, `Preguntas_Frecuentes_Envios.docx`).
  - `isDragging`: Drag-and-drop state.
  - `fileInputRef`: Hidden input ref.
- **Handlers**:
  - Drag over/leave/drop handlers.
  - File upload simulation: Sets status to `'processing'` then transitions to `'ready'` after 3000ms.
  - Delete handler: `handleDelete(id)`.
  - Standard Excel template download simulation.

#### Concrete Reskin Plan
1. **Header**:
   ```tsx
   <div>
     <div className="mb-2 flex items-center gap-2">
       <span className="inline-flex h-7 items-center gap-2 rounded-full border border-success/25 bg-success/10 px-2.5 text-xs font-bold text-success">
         <BookOpen className="size-3.5" /> Cerebro IA Conectado
       </span>
       <span className="text-xs text-muted-foreground">{documents.length} documentos indexados</span>
     </div>
     <h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl text-foreground">
       Base de Conocimiento
     </h1>
     <p className="mt-1 text-sm text-muted-foreground">
       Subí los catálogos y listas de precios de tu empresa. La IA los procesa automáticamente para responderle a tus clientes con precisión técnica.
     </p>
   </div>
   ```
2. **Upload Card**:
   - Container: `border border-border bg-card shadow-panel rounded-lg`.
   - Dropzone: `rounded-lg border-2 border-dashed border-border hover:border-primary/50 bg-background/50 hover:bg-muted/30 p-8 text-center transition-colors cursor-pointer`.
   - Icon: `<div className="mx-auto size-12 rounded-md bg-accent text-accent-foreground grid place-items-center mb-3 shadow-xs"><UploadCloud className="size-6" /></div>`.
   - Excel Guidance Callout: `rounded-lg border border-accent/20 bg-accent/5 p-4 text-xs text-muted-foreground`.
   - Template Download: `<Button variant="secondary" className="w-full mt-3"><Download className="size-4" />Descargar Plantilla Estándar</Button>`.
3. **Documents List Card & Table**:
   - Container: `border border-border bg-card shadow-panel rounded-lg overflow-hidden`.
   - Header: `bg-muted/40 border-b border-border text-xs uppercase font-semibold text-muted-foreground`.
   - Badges:
     - `ready`: `<Badge variant="success"><Check className="size-3 mr-1" /> Listo</Badge>`
     - `processing`: `<Badge variant="warning"><RefreshCw className="size-3 mr-1 animate-spin" /> Indexando</Badge>`
     - `error`: `<Badge variant="ceibo"><AlertCircle className="size-3 mr-1" /> Error</Badge>`
   - Delete Button: `<Button variant="ghost" size="icon-sm" className="hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(doc.id)}><Trash2 className="size-4" /></Button>`.

---

### 3.4 Page 4: Configuración (`src/app/settings/page.tsx`)

#### Current Deficiencies
- **Header**: Standard sans `h1 className="text-3xl font-bold tracking-tight"`.
- **Sidebar Tabs**: Uses custom button elements in aside with `bg-brand-50 text-brand-700` and `text-slate-600 hover:bg-slate-100`.
- **Save Buttons**: Raw `bg-brand-600 text-white hover:bg-brand-700` instead of `Button variant="primary"` with `shadow-action`.
- **Callout Containers**:
  - Bot advice: `bg-blue-50 border-blue-100 text-blue-900`.
  - WhatsApp line status: `bg-green-50 border-green-200 text-green-900`.
- **Team Table**: `bg-slate-50` header, `bg-brand-100 text-brand-800` badges, `bg-slate-900` invite button.

#### Existing Supabase Mock-Data Wiring
- **Auth Hook**: `const { user, perfil } = useAuth();`
- **Fields**:
  - Enterprise Name: defaults to `perfil?.full_name?.split(' ')[0] || 'Mi Empresa SRL'`
  - Contact Email: defaults to `user?.email || 'admin@empresa.com'`
  - Team Table: lists `perfil?.full_name || 'Admin'` as Administrador and sales agents.
- **State**:
  - `activeTab`: `'general' | 'bot' | 'whatsapp' | 'team'`
  - `isSaving`: boolean state with 1000ms delay simulating save and alert notification.

#### Concrete Reskin Plan
1. **Header**:
   ```tsx
   <div>
     <div className="mb-2 flex items-center gap-2">
       <span className="rounded bg-ceibo-soft px-2 py-1 text-[10px] font-bold text-ceibo">
         ENTERPRISE CONFIG
       </span>
       <span className="text-xs text-muted-foreground">ID Tenant: [CEI-AR-7F42A9]</span>
     </div>
     <h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl text-foreground">
       Configuración del Sistema
     </h1>
     <p className="mt-1 text-sm text-muted-foreground">
       Administrá el perfil de tu empresa, el comportamiento del bot de ventas y credenciales de conexión.
     </p>
   </div>
   ```
2. **Sidebar Tabs**:
   Style as a vertical navigation card mirroring the main sidebar:
   ```tsx
   <aside className="w-full md:w-64 shrink-0">
     <nav className="flex flex-row md:flex-col gap-1.5 p-1.5 rounded-lg border border-border bg-card shadow-panel overflow-x-auto">
       {tabs.map(tab => (
         <button
           key={tab.id}
           onClick={() => setActiveTab(tab.id)}
           className={cn(
             'flex h-10 items-center gap-2.5 rounded-md px-3 text-sm font-semibold transition-colors text-left',
             activeTab === tab.id
               ? 'bg-sidebar text-sidebar-foreground shadow-xs'
               : 'text-muted-foreground hover:bg-muted hover:text-foreground'
           )}
         >
           <tab.icon className="size-4" />
           <span>{tab.label}</span>
         </button>
       ))}
     </nav>
   </aside>
   ```
3. **Form Cards & Buttons**:
   - Encased in `border border-border bg-card shadow-panel rounded-lg`.
   - Form inputs: `h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground focus:ring-1 focus:ring-ring focus:border-primary`.
   - Save button: `<Button variant="primary" onClick={handleSave} disabled={isSaving}>{isSaving ? 'Guardando...' : 'Guardar Cambios'}</Button>`.
4. **Callout Banners**:
   - AI Behavior Callout: Refactored to `rounded-lg border border-accent/20 bg-accent/5 p-4` with `ShieldCheck` icon.
   - WhatsApp Connection Callout: Refactored to `rounded-lg border border-success/25 bg-success/10 p-4` with live-pulse operational status.
5. **Team Table**: Standardized with `rounded-lg border border-border overflow-hidden bg-card`, `Badge variant="ceibo"` for Admin, and `<Button variant="secondary" size="sm">+ Invitar Miembro</Button>`.

---

### 3.5 Foundational Components: `src/components/ui/card.tsx` and `badge.tsx`

Currently, `src/components/ui/card.tsx` hardcodes slate classes:
```tsx
// CURRENT (violates reference system):
"rounded-xl border border-slate-200 bg-white text-slate-950 shadow-sm"
```
Proposed unified replacement:
```tsx
// PROPOSED:
export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-lg border border-border bg-card text-card-foreground shadow-panel",
        className
      )}
      {...props}
    />
  )
);

export const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("font-display font-bold text-foreground text-lg sm:text-xl", className)}
      {...props}
    />
  )
);
```

Currently, `src/components/ui/badge.tsx` uses:
```tsx
// CURRENT (violates reference system):
default: "border-transparent bg-slate-900 text-slate-50 shadow hover:bg-slate-800",
secondary: "border-transparent bg-slate-100 text-slate-700 hover:bg-slate-200",
destructive: "border-transparent bg-red-100 text-red-700 hover:bg-red-200",
outline: "text-slate-700 border border-slate-200",
success: "border-transparent bg-brand-100 text-brand-800 font-medium",
warning: "border-transparent bg-amber-100 text-amber-800",
```
Proposed unified replacement:
```tsx
// PROPOSED:
const variantStyles = {
  default: "border-primary bg-primary text-primary-foreground shadow-action",
  primary: "border-primary bg-primary text-primary-foreground shadow-action",
  secondary: "border-border bg-secondary text-secondary-foreground",
  ceibo: "border-ceibo/25 bg-ceibo-soft text-ceibo font-bold",
  success: "border-success/25 bg-success/10 text-success font-semibold",
  warning: "border-amber-500/25 bg-amber-500/10 text-amber-800 dark:text-amber-300 font-semibold",
  destructive: "border-destructive/25 bg-destructive/10 text-destructive font-semibold",
  outline: "border-border text-foreground bg-transparent",
};
```

---

## 4. Verification & Compatibility Assessment

1. **TypeScript Check**: Run `npx tsc --noEmit` to verify type compliance across all components and pages.
2. **E2E Test Suite**: Run `node tests/run-all-tests.mjs` to ensure that all 89/89 tests continue to pass. The test suite exercises:
   - Auth & Multi-Tenancy (14 tests)
   - Dashboard KPI Metrics (13 tests)
   - 30-Day Chart Data Pipeline (15 tests)
   - Navigation & Shell Routes (14 tests)
   - Multi-Tenant Data Isolation (13 tests)
   - Adversarial Multi-Tenancy & Auth Stress Suite (20 tests)
3. **No Regressions Guarantee**: Because all changes are purely visual / styling / class mappings while strictly preserving component contracts, state variables, and Supabase client calls, zero functional regressions will be introduced.

---

## 5. Implementation Roadmap for Implementer

| Task # | Target File | Scope of Work | Dependency |
|---|---|---|---|
| T1 | `src/components/ui/card.tsx` | Replace hardcoded slate classes with `border-border`, `bg-card`, `shadow-panel`, `font-display` | None |
| T2 | `src/components/ui/badge.tsx` | Add semantic `ceibo`, `success`, `warning`, `primary` variants matching reference | None |
| T3 | `src/app/inbox/page.tsx` | Reskin page header, filters, tab switcher, lead table rows, badges, and assign button | T1, T2 |
| T4 | `src/app/chats/page.tsx` | Reskin chat shell, session list with `GV`-style avatars, live pulse dots, chat bubbles, input | T1, T2 |
| T5 | `src/app/documents/page.tsx` | Reskin upload dropzone, helper tip box, active documents table, badges, delete button | T1, T2 |
| T6 | `src/app/settings/page.tsx` | Reskin vertical tabs to match sidebar aesthetic, card sections, callout banners, and team table | T1, T2 |
| T7 | `src/app/login/page.tsx` | Align login card, BrandMark, and demo tenant cards with reference token system | T1, T2 |
| T8 | Full Repository | Execute `npm run typecheck` and `npm run test:e2e` (89/89 tests passing) | T1-T7 |
