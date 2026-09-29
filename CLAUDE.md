# CLAUDE.md — Ceibo AI

Contexto de proyecto para cualquier sesión de Claude Code que trabaje en este repo. Esto complementa (y en algunos puntos corrige) a `README.md` y `PROJECT.md`, que quedaron desactualizados en partes — ver "Documentación desactualizada" al final.

## Qué es esto

Ceibo AI es un asistente de ventas por WhatsApp basado en IA para corralones y distribuidoras de materiales de construcción en Argentina (proyecto académico de Universidad Austral que ganó el ILAN 2025, ahora en proceso de profesionalizarse como producto vendible). Fundador: Gonzalo Vicente.

**Este repo (`ceibo_ai`) es solo el frontend** — un dashboard Next.js para que el dueño del corralón vea métricas, leads y conversaciones de su asistente de IA. La lógica real del bot (RAG, clasificación, WhatsApp, memoria de conversación) vive **fuera de este repo**, en workflows de n8n, y escribe/lee de una base Supabase compartida.

```
WhatsApp Business API → n8n (1 workflow POR CLIENTE: agente IA + RAG) → Supabase (ceibo-test) → este frontend (Next.js)
```

## Stack

- Next.js 14 (App Router) + TypeScript, Tailwind CSS
- Supabase (`@supabase/ssr`, `@supabase/supabase-js`) para auth, DB y storage
- Recharts para gráficos
- Arquitectura dual: si no hay credenciales reales en `.env.local`, la app cae a un **cliente mock** en memoria (`src/lib/supabase/mock-client.ts`, `mock-data.ts`). Ahora el navbar muestra un badge **MODO DEMO** cuando esto ocurre (`isLiveConfigured()` en `src/lib/supabase/client.ts`). Igual: un fetch real que falla en silencio puede quedar enmascarado — los banners de error de Dashboard, Inbox y Chats ya están renderizados (verificado).

## Supabase — proyecto real

- Proyecto: **`ceibo-test`**, ref `lnoxajdcyrseeymlsttl`, región `ca-central-1`.
- Hay un proyecto viejo **"Prueba n8n"** (ref `wvskjqgnsqbvmfdaweqe`, INACTIVE) que NO es el que usa este frontend. Si algo no coincide con n8n, chequeá a qué proyecto apunta la credencial del nodo.
- Credenciales reales viven en `.env.local` (gitignored) y en el gestor de credenciales de n8n — nunca hardcodeadas acá. Variables relevantes: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (**solo servidor**, nunca `NEXT_PUBLIC_`), `CEIBO_LEGACY_EMPRESA_ID`, `CEIBO_HUMAN_MSG_WEBHOOK_URL/SECRET` (fallback, ver abajo).

### Tablas (schema multi-tenant)

Todas las tablas de negocio tienen `empresa_id` (uuid) y RLS activado:

- `empresas` — tenants/clientes. Hoy: "Ceibo AI Tech Solutions" (`a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11`, enterprise, tenant de prueba/actual) y "Mi Empresa Real" (`197b1a6c-…`, starter, sin tráfico).
- `perfiles` — usuarios, 1:1 con `auth.users` vía `id`, con `empresa_id` y `role`. **Esto es lo que decide qué empresa ve cada usuario al loguearse.**
- `chat_sessions` — **una fila por (empresa, teléfono)** (índice único `chat_sessions_empresa_phone_uidx`). Es el lead/conversación que alimenta Inbox y Chats. `query_type` y `is_escalated` son "pegajosos" (solo suben, salvo `resolve_chat_session()`).
- `chat_analytics` — **una fila por consulta** (a propósito: el dashboard cuenta consultas), enlazada a la sesión por `session_id`. Incluye `estimated_amount`.
- `chat_analytics_daily` — **vista** que agrega `chat_analytics` por día (en UTC) y empresa. Tiene `security_invoker=true` (ver "Seguridad"). **El Dashboard ya no lee de acá** (solo el modo demo): usa `get_dashboard_metrics()`.
- `n8n_chat_histories` — mensajes de la conversación (`sender_type`: user | bot | human_agent), `session_id` = `chat_sessions.id`. Solo lo escriben las RPC.
- `n8n_agent_memory` — memoria del agente LangChain, la escribe el nodo "Postgres Chat Memory". **No tiene `empresa_id`**: por eso la clave de sesión va prefijada `"<empresa_id>:<telefono>"`.
- `documents` (vector store del RAG), `record_manager`, `tabular_document_rows` (catálogos/precios) — todas con `empresa_id`.
- `empresa_integrations` — webhook + secreto de envío de mensajes humanos **por empresa**. RLS sin políticas: solo `service_role` la lee (desde el servidor de Next.js).

### RPC (todas explícitas en `empresa_id`)

- `chat_open_turn(phone, name, text, empresa_id)` → upsert de la sesión + guarda el mensaje del usuario. **`empresa_id` es obligatorio** (sin default). Solo `service_role`.
- `chat_close_turn(session_id, bot_text, query_text, query_type, resolution_status, is_escalated, related_product_id, estimated_amount)` → inserta la consulta en `chat_analytics`, el mensaje del bot y actualiza la sesión. Solo `service_role`.
- `assign_chat_session`, `resolve_chat_session`, `send_human_message` → las usa el front (respetan RLS).
- `get_dashboard_metrics(p_from date, p_to date, p_granularity 'day'|'week'|'month')` → jsonb con buckets del gráfico, totales del período y del período anterior (misma duración). SECURITY INVOKER (RLS). Las fechas son **locales de la empresa** (`empresas.timezone`), inclusivas. Ver "Dashboard por período".
- `match_documents(query_embedding, match_count, filter)` → **el filtro debe incluir `empresa_id`** o falla; filtra por la columna `documents.empresa_id`.
- `delete_knowledge_document`, `update_empresa_settings` → SECURITY DEFINER, requieren sesión (sin acceso `anon`).

RLS usa `current_user_empresa_id()` y `get_user_empresa_id()` (equivalentes y redundantes; ambas las usan políticas, no revocarles `authenticated`).

## Modelo multi-tenant (decisión de arquitectura)

**Un workflow de n8n por cliente**, nunca uno compartido: cada cliente tiene su número de WhatsApp, credenciales, catálogo y webhooks propios. Todos escriben en el mismo Supabase, aislados por `empresa_id` + RLS.

- El `empresa_id` de cada workflow vive en **un solo lugar: el nodo `CONFIG`** (Set) al inicio. Al duplicar el workflow para otro cliente se cambia solo ese valor.
- Ya **no hay defaults de tenant** en `chat_sessions`, `chat_analytics`, `n8n_chat_histories`: un `empresa_id` faltante falla en voz alta en vez de caer en silencio en el tenant de prueba.
- **Excepción pendiente:** `documents`, `record_manager` y `tabular_document_rows` **conservan** el default `a0eebc99-…` porque la ingesta (workflow "HOLY RAG - Ingesta" y la subida desde `/documents`) todavía no pasa el `empresa_id` explícito. Hay que resolverlo antes de ingestar el catálogo de un segundo cliente.
- Envío de mensajes humanos: `src/app/api/send-whatsapp/route.ts` busca el webhook en `empresa_integrations` según la empresa de la sesión, valida que el teléfono pertenezca a una conversación de esa empresa, y rechaza (503) si la empresa no tiene webhook. Solo para `CEIBO_LEGACY_EMPRESA_ID` se usa el fallback de variables de entorno.

### Alta de un cliente nuevo (checklist)

1. Insertar la fila en `empresas`.
2. Crear el usuario por el **flujo real de Supabase Auth** (invitación/signup), no por SQL directo (ver bug 1), y su `perfil` con el `empresa_id`.
3. Duplicar el workflow "HOLY RAG - Conversación copy", cambiar `empresa_id` en `CONFIG`, conectar su número de WhatsApp (credencial y `phoneNumberId` de los nodos de envío).
4. Crear un **rol de solo lectura propio** para ese cliente (como `ceibo_readonly`, pero con políticas atadas a su `empresa_id`) y una credencial de n8n que lo use en los nodos donde el LLM escribe SQL (`query_tabular_rows`, `Get datasets from record_manager`, `Execute a SQL query2`). Hoy `ceibo_readonly` solo ve el tenant de prueba (políticas hardcodeadas): con otro cliente **no sirve tal cual**.
5. Cargar la fila en `empresa_integrations` (URL del webhook "Enviar mensaje humano" de SU workflow + un secreto propio, y ese mismo secreto en su nodo "Verificar secreto compartido").
6. Ingestar su catálogo con `empresa_id` correcto.

## n8n

- Corre en n8n Cloud (`ceibocc.app.n8n.cloud`). Workflow principal: **"HOLY RAG - Conversación copy"** (ID `ZMrhkzMWbCpxBMTd`; la versión "HOLY RAG - Conversación" sin el fix multi-tenant NO usar). Ingesta: **"HOLY RAG - Ingesta"**. Error handler: "Error Handler- HOLY RAG".
- El workflow historial de n8n guarda versiones: antes de cambios grandes, anotar el `versionId` para poder volver (`restore_workflow_version`).
- **Blocker recurrente conocido: límite de ejecuciones del plan de n8n Cloud.** Si dejan de llegar mensajes/datos sin motivo aparente, chequear primero el uso del plan (Settings → Usage). Con varios clientes en la misma cuenta, todos consumen la misma cuota.

### Reglas al tocar nodos

- Los nodos donde el LLM escribe SQL (`$fromAI('query')`) deben usar una credencial **solo lectura** (RLS por tenant), nunca la de escritura.
- No interpolar salida del LLM dentro de SQL: usar parámetros (`$1…`) con `queryReplacement`. `Execute a SQL query2` ya está parametrizado.
- Toda expresión `{{ }}` de n8n debe arrancar con `=`; si no, se trata como texto literal.
- Si se toca `Execute a SQL query2`, verificar que siga devolviendo `query_type`, `is_escalated`, `resolution_status`, `related_product_id` y `estimated_amount`.
- El nodo "Supabase Vector Store1" debe conservar el Metadata Filter `empresa_id` (sino `match_documents` falla).

### Bugs ya encontrados y resueltos (no repetirlos)

1. **Usuario admin creado por SQL directo** → faltaba `aud = 'authenticated'` en `auth.users` y la fila en `auth.identities`; el login fallaba con "Invalid login credentials" sin pista. Crear usuarios por el flujo real de Auth.
2. **`Execute a SQL query2` pisaba `query_type`/`is_escalated`/`resolution_status`** al no seleccionarlos → la escalación a CRM nunca disparaba.
3. **Falta del prefijo `=` en expresiones de n8n** → se trataban como texto literal.
4. **`empresa_id` hardcodeado/por defecto en la creación de filas** → resuelto: nodo `CONFIG` + parámetro obligatorio en `chat_open_turn`.
5. **Dashboard/Inbox/Chats mostraban datos mock sin avisar** cuando el fetch real fallaba → banners de error renderizados + badge MODO DEMO.
6. **Duplicados de leads** (una fila por mensaje) → resuelto con `chat_sessions` (una por empresa+teléfono). **No agregar `UNIQUE(customer_phone)` a `chat_analytics`**: es un log por consulta y rompería las métricas.
7. **Fuga de datos entre tenants (corregida el 2026-09-29):** la vista `chat_analytics_daily` corría como su dueño (se salteaba el RLS) y `anon` tenía `SELECT`; el RAG y la memoria del agente no filtraban por empresa. Ver "Seguridad".

## Seguridad — estado y pendientes

- `chat_analytics_daily` con `security_invoker=true`, sin acceso `anon`. **Si se vuelve a recrear la vista, hay que reponer `alter view … set (security_invoker = true)`** (así se perdió antes).
- `empresa_integrations` no es legible por `anon`, `authenticated` ni `ceibo_readonly`.
- La clave `SUPABASE_SERVICE_ROLE_KEY` es solo servidor (la usa `send-whatsapp/route.ts`); nunca con prefijo `NEXT_PUBLIC_`.
- **Pendiente: rotar el secreto** del nodo "Verificar secreto compartido" (está escrito en texto plano en el workflow) y pasarlo a uno distinto por empresa, sincronizado con `empresa_integrations`.
- **Pendiente:** `phoneNumberId` de "Enviar WhatsApp de vendedor" está fijo en el nodo (cambiarlo en cada copia del workflow).
- Advisors de Supabase sin resolver (baja prioridad): extensión `vector` en schema `public`, protección de contraseñas filtradas desactivada, `n8n_agent_memory` con RLS sin políticas (funciona porque n8n usa el rol dueño).
- **Pendiente:** probar el camino real del webhook de Meta con un WhatsApp de verdad post-cambios (la prueba hecha fue una ejecución manual).

## Migraciones

En `supabase/migrations/` (se aplican a mano en el SQL Editor de Supabase):

- `20260921_chat_sessions.sql` — modelo `chat_sessions` + RPC.
- `20260929_multitenant_a_additive.sql` — sincroniza el repo con la base (`estimated_amount`, `chat_close_turn` de 8 parámetros), crea `empresa_integrations`, `match_documents` tolerante.
- `20260929_multitenant_b_strict.sql` — quita defaults, `chat_open_turn` con `empresa_id` obligatorio, `match_documents` estricta.
- `20260929_multitenant_c_security_fixes.sql` — `security_invoker` en la vista, permisos.
- `20260929_d_dashboard_metrics.sql` — `get_dashboard_metrics()` y su helper `_dashboard_summary()` (dashboard por período).
- `20260929_e_pedido_presupuesto.sql` — unifica pedido y presupuesto (ver "Categorías de consulta"), migra los datos y reemplaza las funciones del dashboard (un solo `pedidos_count`).
- Los cambios hechos en n8n están documentados en `supabase/n8n-multitenant-changes.md`.

Aplicadas todas en `ceibo-test`. `supabase/schema.sql`, `full_setup.sql` y `seed.sql` son de etapas anteriores y **no reflejan** el estado actual.

## Categorías de consulta (`query_type`)

Valores canónicos: `consulta_general`, `consulta_precio`, `consulta_stock`, **`pedido`**, `reclamo`. **Pedido y presupuesto son una sola categoría** (para el cliente ambos son una oportunidad de venta): en la UI se muestra "Pedido / Presupuesto". `normalize_query_type()` acepta `presupuesto`, `pedido_presupuesto`, etc. y siempre guarda `pedido`, así que aunque el LLM de n8n siga distinguiendo, la base y el dashboard las cuentan juntas. Pedido, Reclamo escalan siempre a un humano (`chat_close_turn`).

- **No reintroducir `presupuestos_count`** ni un filtro/etiqueta separada de "Presupuesto". La columna `presupuestos_count` de la vista `chat_analytics_daily` queda en 0 (no se recrea la vista para no perder `security_invoker`).
- El front tolera filas viejas `pedido_presupuesto` (Inbox y `formatQueryType`).

## Dashboard por período

### Diseño ("Dos protagonistas") — `src/app/dashboard/page.tsx`

Una sola pantalla de escritorio, sin scroll: encabezado compacto con el selector de período → dos tarjetas protagonistas (**Tiempo ahorrado** y **Pedidos derivados**) → fila inferior (**gráfico de consultas** + **lista de pedidos derivados**). Componentes en `src/components/dashboard/`: `time-saved-card`, `pedidos-card`, `activity-chart` (barras apiladas en HTML/CSS, sin Recharts), `derived-orders-list`, `period-filter` (control segmentado).

- **El período elegido cambia todo:** tarjetas, gráfico grande y lista. Períodos visibles: Hoy, 7 días, 30 días, Este mes, Personalizado (90 días y Mes pasado siguen funcionando por URL y aparecen como un segmento extra cuando están activos).
- **El gráfico grande sigue el período:** cambian el título ("Consultas de los últimos 30 días", "…de este mes", "…del 5 Sep al 20 Sep"), la escala y la agrupación (≤31 días por día, ≤180 por semana, más por mes). Con **"Hoy"** (un solo día) muestra los 7 días que terminan hoy. Con más de 16 barras se ocultan los totales y se muestran ~8 etiquetas del eje.
- **El mini gráfico verde y el total "últimos 7 días"** de la tarjeta de tiempo ahorrado son **siempre los 7 días que terminan en el último día del período** (segunda llamada a `get_dashboard_metrics`, salvo que el período ya sea de 7 días).
- **Tarjeta de pedidos:** cuenta `chat_sessions` de tipo `pedido` con `resolution_status = 'derivado'` y actividad (`last_message_at`, en la zona horaria de la empresa) dentro del período; "Sin asignar" = `assigned_to` nulo. El **valor estimado** es la suma de `chat_sessions.estimated_amount` de esas mismas sesiones (coincide con la lista). No usa el `valor_estimado` de la función SQL.
- **Lista de pedidos:** `related_product_id` llega mezclado desde el bot (código `COR-001`, texto libre o lista con comas). Se traduce con el catálogo (`getProductCatalog()` → `tabular_document_rows`) y las listas se resumen ("X y 2 más"). La cantidad pedida no se guarda, no se muestra. Teléfonos enmascarados (`+54 9 336 ••• 3664`).
- **Tiempo real:** refresco cada 60 s, suscripción a cambios de `chat_sessions` (con debounce) y "actualizado hace X min" clickeable.
- **Tiempo ahorrado:** `MINUTES_SAVED_PER_AI_RESOLUTION` (12 min) vive solo en `src/lib/constants.ts`; menos de 60 min se muestra en minutos, desde una hora en horas con coma ("3,6 h"). La base lo repite en SQL (`* 0.2`): si se cambia, cambiar ambos.
- Los helpers de formato (es-AR, teléfono, tiempo relativo, producto) están en `src/lib/format.ts` con tests (`node tests/e2e/test-dashboard-format.mjs`).

### Período y datos

- El período vive en la URL: `/dashboard?rango=30d`, `?rango=custom&desde=YYYY-MM-DD&hasta=YYYY-MM-DD`, `&gran=week` (la agrupación manual ya no tiene control en pantalla). Sin parámetros = 30 días.
- Lógica pura y testeada en `src/lib/dashboard-range.ts` (`node tests/e2e/test-dashboard-range.mjs`).
- Las métricas salen de `get_dashboard_metrics()`, así que tarjetas y gráfico no pueden desincronizarse. La tarjeta de tiempo ahorrado compara contra el **período anterior de igual duración** (solo si hay una variación calculable).
- **Definición de pipeline en la función SQL (`valor_estimado`):** suma del **último** monto estimado de cada cliente (sesión) con `pedido` dentro del período. No suma dos veces al cliente que repite el mismo presupuesto. (El dashboard actual no lo muestra: ver "Tarjeta de pedidos".)
- Los días se cortan en la **zona horaria de la empresa**, no en UTC (antes una consulta a las 22:00 en Argentina caía en el día siguiente).
- Antes se usaba `.limit(30)` sobre la vista, que tomaba los últimos 30 *días con actividad* y no los últimos 30 días de calendario. `getRecent30Days()` sigue existiendo (lo usa `/api/analytics` y los tests viejos) pero **el dashboard ya no lo usa**.
- En modo demo (cliente mock) no hay RPC: el resultado se arma en el navegador desde las filas diarias del mock (`buildDashboardFromDailyRows`), y el pipeline es una suma simple.

## Semántica de color

**Bueno = verde, malo = rojo.** Un mismo color significa lo mismo en toda la app.

- **Verde (`success`)**: resultados buenos y dinero. Consultas resueltas por la IA, tiempo ahorrado, pedidos derivados ("listos para cerrar"), valor estimado, montos, "Con un vendedor", "Atendido", "0 reclamos", asistente activo. **Verde claro (`success-light`)**: token disponible para distinguir dos series verdes (hoy sin uso).
- **Rojo (`negative`)**: lo malo o lo que pide acción. Reclamos (si hay), "Sin asignar", "Pendiente"/"Atención requerida" (Inbox y Chats), el contador de pendientes de la barra lateral, errores de conexión. `Badge variant="destructive"` usa este rojo. (`destructive` sigue para banners y toasts de error.)
- **Terracota (`ceibo` / `primary`)**: **marca e identidad** — logo, botón principal ("Entrenar asistente"), login, landing, etiqueta del plan y burbujas del asesor en Chats. **Excepción pedida por el dueño:** el chip de **reclamos** del gráfico de consultas va en terracota. Fuera de eso, no usarla para indicar estado.
- **Azul (`info`, texto chico `info-strong`)**: informativo, ni bueno ni malo. En el gráfico de consultas las **resueltas por la IA** van en azul (barras, leyenda y chip "% resueltas por la IA") y las **derivadas a vendedor** en verde (son oportunidad de venta).
- Amarillo/ámbar (`Badge variant="warning"`): estados intermedios ("Sin clasificar", "Bot Pausado").
- Tokens en `src/app/globals.css` (`--success`, `--success-light`, `--negative`) y `tailwind.config.ts`. Ambos superan contraste 4.5:1 sobre blanco para texto; usar `text-negative` (no `text-destructive`) para texto chico en rojo.

## Barra lateral plegable

En escritorio la barra lateral se pliega a una franja de íconos (72px, con tooltips y el contador de Inbox como burbuja) con el botón de su encabezado o con `Ctrl/Cmd + B`. La preferencia se guarda en `localStorage` (`ceibo.sidebar.collapsed`). El estado vive en `AppShell` (`src/components/layout/app-shell.tsx`), que ajusta el margen del contenido (`lg:pl-[72px]` / `lg:pl-[252px]`). El drawer mobile nunca se pliega.

## Frontend — rutas

⚠️ **Esto contradice lo que dice README.md — confiá en el código:**

- `/` → **landing page de marketing** (`src/app/page.tsx`), no el dashboard.
- `/dashboard` → el dashboard real (autenticado).
- `/login` → redirige a `/dashboard` tras autenticar.
- `/inbox`, `/chats`, `/documents`, `/settings` → funcionales con Supabase real (no "Próximamente").

## Documentación desactualizada — ojo

- `README.md` describe `/` como el dashboard y las pantallas internas como "Próximamente" — **no es así**.
- `PROJECT.md` describe un "clonado visual 1:1" contra `ceibo_ref` que targeteaba `src/app/page.tsx` como si fuera el dashboard — pero `page.tsx` es la landing. Verificar contra el código real.
- Las carpetas `.agents/` son artefactos de sesiones de Antigravity (`/teamwork-preview`). No son parte de la app.
- `fix.js`, `fix-tests.js`, `fix-mojibake.js` (raíz) son scripts sueltos de arreglos de codificación; no son parte de la app.

## Cómo trabajar acá

- Antes de tocar un nodo de n8n o una tabla de Supabase, confirmá contra el proyecto real (`ceibo-test`, no "Prueba n8n").
- Si algo se ve raro en el frontend (datos que no cambian, siempre los mismos números), sospechá primero del fallback a mock silencioso (mirá si aparece MODO DEMO) antes de asumir un bug de lógica.
- Cuidado con la codificación UTF-8: hubo varios bugs de tildes corruptas (`conexin`, etc.) por herramientas de I/O. Revisar los diffs con tildes.
- El servidor de desarrollo corre con `npm run dev` en `http://localhost:3000` (hay `.claude/launch.json`). Node 20 funciona pero Supabase avisa que dejará de soportarlo: migrar a Node 22.
- Test credential para probar login real (no mock): `admin@ceibo.ai` / `password123` — visible además como acceso rápido en la pantalla de login.
- Hay un lead de prueba (`5491100000099`) en el tenant real, creado el 2026-09-29 al testear el workflow; suma 1 consulta al dashboard.
