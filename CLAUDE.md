# CLAUDE.md — Ceibo AI

Contexto de proyecto para cualquier sesión de Claude Code que trabaje en este repo. Esto complementa (y en algunos puntos corrige) a `README.md` y `PROJECT.md`, que quedaron desactualizados en partes — ver "Documentación desactualizada" al final.

## Qué es esto

Ceibo AI es un asistente de ventas por WhatsApp basado en IA para corralones y distribuidoras de materiales de construcción en Argentina (proyecto académico de Universidad Austral que ganó el ILAN 2025, ahora en proceso de profesionalizarse como producto vendible). Fundador: Gonzalo Vicente.

**Este repo (`ceibo_ai`) es solo el frontend** — un dashboard Next.js para que el dueño del corralón vea métricas, leads e conversaciones de su asistente de IA. La lógica real del bot (RAG, clasificación, WhatsApp, memoria de conversación) vive **fuera de este repo**, en workflows de n8n, y escribe/lee de una base Supabase compartida.

```
WhatsApp Business API → n8n (orquestador + agente IA + RAG) → Supabase (ceibo-test) → este frontend (Next.js)
```

## Stack

- Next.js 14 (App Router) + TypeScript, Tailwind CSS
- Supabase (`@supabase/ssr`, `@supabase/supabase-js`) para auth, DB y storage
- Recharts para gráficos
- Arquitectura dual: si no hay `.env.local` con credenciales reales, la app cae automáticamente a un **cliente mock** en memoria (`src/lib/supabase/mock-client.ts`, `mock-data.ts`) — útil para iterar UI rápido, pero hay que tener presente que **cualquier fetch real a Supabase que falle en silencio puede quedar enmascarado por este fallback**. Ya hubo bugs así (ver "Bugs ya encontrados y resueltos").

## Supabase — proyecto real

- Proyecto: **`ceibo-test`**, ref `lnoxajdcyrseeymlsttl`, región `ca-central-1`.
- Hay un proyecto viejo llamado **"Prueba n8n"** (ref `wvskjqgnsqbvmfdaweqe`, ahora INACTIVE) que NO es el que usa este frontend — es un resabio de una etapa anterior del proyecto, antes de que existiera el dashboard. Si algo parece no coincidir con lo que ves en n8n, chequeá a qué proyecto apunta la credencial de Supabase en el nodo de n8n correspondiente.
- Credenciales reales viven en `.env.local` (gitignored, nunca en este repo) y en el gestor de credenciales de n8n — nunca hardcodeadas acá.

### Tablas (schema multi-tenant)

Todas las tablas de negocio tienen columna `empresa_id` (uuid) para aislar datos entre clientes, con RLS activado:

- `empresas` — tenants/clientes de Ceibo AI
- `perfiles` — perfiles de usuario, vinculados 1:1 a `auth.users` vía `id`, con `empresa_id` y `role`
- `chat_analytics` — **una fila por mensaje/consulta individual** (no agregado): `customer_phone`, `query_type`, `query_text`, `related_product_id`, `bot_response`, `is_escalated`, `resolution_status`, `customer_name`, `empresa_id`. Tiene `empresa_id NOT NULL` con **default** seteado al tenant de prueba (Ceibo AI Tech Solutions) como red de seguridad.
- `chat_analytics_daily` — **vista** que agrega `chat_analytics` por día y `empresa_id` (total consultas, resueltas por IA, derivadas a humano, horas ahorradas ≈ resueltas_ia × 0.2). El Dashboard lee de esta vista, no de la tabla base.
- `n8n_chat_histories` — memoria de conversación de LangChain (`session_id`, `message` jsonb), poblada automáticamente por el nodo "Postgres Chat Memory" de n8n. También tiene `empresa_id NOT NULL` con default — el nodo de LangChain no tiene forma de setear esa columna manualmente, así que el default es obligatorio, no opcional.
- `documents` — vector store del RAG (`content`, `metadata`, `embedding vector`)
- `record_manager` / `tabular_document_rows` — metadata e ingestión de documentos/catálogos

RLS usa dos funciones `SECURITY DEFINER` equivalentes y redundantes (`current_user_empresa_id()` y `get_user_empresa_id()`, creadas en pasadas distintas) — ambas funcionan, no hace falta unificarlas salvo que moleste la duplicación.

Hay un rol de solo lectura, `ceibo_readonly`, con `SELECT` en todo el schema `public` — pensado para los nodos de n8n que solo consultan (nunca escriben), como red de seguridad adicional.

### Pendiente de decisión: duplicados en `chat_analytics`

Hoy `chat_analytics` inserta **una fila por mensaje**, lo que genera leads duplicados en el frontend cuando un mismo cliente manda varios mensajes. Dirección acordada (no implementada todavía): agregar `UNIQUE` en `customer_phone` y cambiar el nodo de n8n a modo **upsert** (insert-or-update por `customer_phone`), en vez de una función RPC o un link explícito por `session_id` — más simple, y `n8n_chat_histories` ya comparte el mismo `customer_phone` como clave natural para cruzar ambas tablas desde el frontend.

## n8n

- El bot corre en n8n Cloud (`ceibocc.app.n8n.cloud`). Workflow principal: **"HOLY RAG - Conversación copy"** (hay una versión vieja "HOLY RAG - Conversación" sin el fix de multi-tenant, no usar). Ingesta de documentos: **"HOLY RAG - Ingesta"**.
- **Blocker recurrente conocido: límite de ejecuciones del plan de n8n Cloud.** Si dejan de llegar mensajes/datos nuevos sin motivo aparente, lo primero a chequear es el uso del plan en n8n (Settings → Usage), no asumir que es un bug de código.

### Bugs ya encontrados y resueltos (no repetirlos)

1. **Usuario admin creado por SQL directo, no por el flujo real de Supabase Auth** → faltaba `aud = 'authenticated'` en `auth.users` y la fila correspondiente en `auth.identities`. Si en el futuro se crea un usuario a mano por SQL en vez de por signup real, hay que setear ambas cosas o el login falla con "Invalid login credentials" sin pista real del motivo.
2. **Nodo "Execute a SQL query2" (lookup de SKU) pisaba `query_type`/`is_escalated`/`resolution_status`** al no seleccionarlos explícitamente — la escalación a CRM nunca disparaba. Ya arreglado, pero si se toca ese nodo de nuevo, verificar que la query siga trayendo esos 3 campos.
3. **Falta el prefijo `=` en expresiones de n8n** (`Execute a SQL query2` y `query_tabular_rows` tenían `{{ ... }}` sin `=` adelante) → n8n las trataba como texto literal, no como expresión evaluada. Cualquier nodo de n8n con `{{ }}` que no arranque con `=` está probablemente roto de la misma forma.
4. **`Create a row` (insert a `chat_analytics`) no tenía `empresa_id`** → ahora está hardcodeado al tenant de prueba. Si se suma un segundo cliente real, este nodo necesita lógica real para resolver el `empresa_id` correcto, no seguir hardcodeado.
5. **Dashboard mostraba datos mock indefinidamente sin avisar** cuando el fetch real a Supabase fallaba — el catch solo hacía `console.error` y la UI se quedaba con el estado inicial de mentira. Se agregó un banner de error visible en `src/app/dashboard/page.tsx`. **Las pantallas de Inbox y Chats también tenían este problema** (peor aún: estaban *hardcodeadas* a usar el cliente mock siempre, sin importar sesión real) — ya se corrigió el fetch real, pero last known state es que el banner de error se agregó al estado pero puede no estar renderizado en el JSX de esas dos pantallas. **Verificar antes de asumir que está resuelto.**

## Frontend — rutas

⚠️ **Esto contradice lo que dice README.md — confiá en el código, no en el README para esto:**

- `/` → **landing page de marketing** (`src/app/page.tsx`), no el dashboard.
- `/dashboard` → el dashboard real (autenticado).
- `/login` → login, redirige a `/dashboard` tras autenticar (ya corregido; antes redirigía a `/` por error).
- `/inbox`, `/chats`, `/documents`, `/settings` → funcionales con Supabase real (no "Próximamente" como dice el README — esa etiqueta quedó vieja de una versión anterior del sidebar).

## Documentación desactualizada — ojo

- `README.md` describe `/` como el dashboard y las pantallas internas como "Próximamente" — **no es así**, ver arriba.
- `PROJECT.md` describe un trabajo de "clonado visual 1:1" contra un proyecto de referencia (`ceibo_ref`) con paleta terracota/verde bosque (OKLCH, fuentes Sora/Manrope) que aparentemente targeteaba `src/app/page.tsx` como si fuera el dashboard — pero `page.tsx` sigue siendo la landing. Antes de confiar en las rutas/estructura que describe ese doc, verificar contra el código real.
- Hay carpetas `.agents/` con nombres de subagentes (`auditor_*`, `challenger_*`, `teamwork_preview_*`, etc.) — son artefactos de sesiones de Antigravity usando `/teamwork-preview` (orquestación multi-agente). No son parte del código de la app, se pueden ignorar salvo que se esté auditando qué hizo cada subagente.

## Cómo trabajar acá

- Antes de tocar un nodo de n8n o una tabla de Supabase, confirmá contra el proyecto real (`ceibo-test`, no "Prueba n8n").
- Si algo se ve raro en el frontend (datos que no cambian, siempre los mismos números), sospechá primero del fallback a mock silencioso antes de asumir un bug de lógica.
- Test credential para probar login real (no mock): `admin@ceibo.ai` / `password123` — visible además como acceso rápido en la propia pantalla de login.
