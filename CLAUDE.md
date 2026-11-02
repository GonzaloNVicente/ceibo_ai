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
- `get_dashboard_overview(p_from date, p_to date, p_granularity 'day'|'week'|'month')` → jsonb con **todo** lo que muestra el dashboard actual (fichas por categoría, tiempo, dinero, buckets y período anterior). SECURITY INVOKER (RLS). Ver "Dashboard Tiempo y Dinero". Requiere la migración F.
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

### Estado del workflow (2026-11-02): BORRADOR ≠ PUBLICADO

- **Publicada (lo que atiende el WhatsApp real):** versión `1d883a46-6671-40c7-9299-b7bbe54137f2` (23/09). **El borrador tiene más cambios sin publicar** (versión `6227397e-0689-438a-a324-267ada449a42`): decisión del equipo, no se publicó todavía. Tampoco están en producción los cambios de septiembre (pedido y presupuesto unificados, presupuesto con varios productos, filtro de temas ajenos). Para volver atrás desde el borrador: `ccc88bbf-d821-4703-94e7-e590cf2cc2be`.
- **Clasificador** (`Basic LLM Chain1`, corre después del AI Agent): 12 categorías — Precio, Stock, Horarios, Envíos, Pagos, Consulta general, Pedido (incluye presupuesto), Reclamo, Sin datos, Spam, Número equivocado, Sin contenido — con un "paso a paso" obligatorio en orden: Reclamo → Pedido → Sin contenido → Spam / Número equivocado → Sin datos → tema. Se deriva (`is_escalated = true`) Pedido, Reclamo, Sin datos o si el cliente pide hablar con una persona; Spam, Número equivocado y Sin contenido nunca. `Structured Output Parser1`: `query_type` string libre con la lista en la descripción.
- **Modelo del clasificador:** `OpenAI Chat Model3` pasó de `gpt-4o-mini` a **`gpt-4o`, temperatura 0** (el mini daba resultados inestables y nunca usaba "Sin datos"). Costo aproximado **US$ 0,004 por mensaje** (antes 0,0003): tenerlo en cuenta al calcular el costo por cliente.
- **Monto de un pedido:** el campo `estimated_quantity` **ya no existe**. El clasificador extrae `items[]` (`producto`, `cantidad`, `precio_unitario`) y `Execute a SQL query2` calcula `estimated_amount = Σ cantidad × precio_unitario`. **Monto "híbrido" (aplicado en el borrador, 2026-11-02):** cada producto se busca en el catálogo (`tabular_document_rows`, coincidencia por nombre con `ILIKE`); si coincide con **exactamente una** fila se usa el **precio del catálogo**, y si hay 0 o varias coincidencias se usa el `precio_unitario` que anotó el LLM como respaldo (así un precio mal leído por el modelo se corrige solo). Sin cantidad no hay monto. Detalle y casos probados en `supabase/n8n-monto-hibrido.md`. Sigue siendo una **estimación** (cantidad que dijo el cliente × precio de lista, no una venta cerrada). Limitaciones: un nombre informal ("bolsa de cemento") o ambiguo cae en el precio del modelo, y **la consulta no filtra por `empresa_id`**: solo ve el catálogo del tenant de prueba porque usa la credencial de solo lectura (`ceibo_readonly`, limitada por RLS a ese tenant). **Antes de sumar un segundo cliente** hay que usar su propia credencial de solo lectura o agregar `t.empresa_id = <empresa del CONFIG>` a la consulta. `related_product_id` ahora es la lista de productos separada por comas.
- Los **stickers e imágenes nunca llegan al clasificador** (el nodo "Solo mensajes de texto" los descarta): "Sin contenido" cubre solo texto como "hola" o 👍.
- Las ejecuciones de prueba crean leads en **Zoho CRM** (nodo "Create a lead"): quedaron 19 de prueba llamados "QA Clasif ..." para borrar a mano.

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
- `20261102_f_dashboard_overview.sql` — clasificador ampliado (`normalize_query_type`, `query_type_rank`, `chat_close_turn`) y `get_dashboard_overview()` para el dashboard "Tiempo y Dinero". **Aplicada** (2026-11-02).
- Los cambios hechos en n8n están documentados en `supabase/n8n-multitenant-changes.md`.

Aplicadas todas en `ceibo-test` (la F el 2026-11-02; verificada con `get_dashboard_overview()` ejecutada con el rol `authenticated`, o sea bajo RLS). Ojo: de `chat_close_turn` sigue existiendo la **sobrecarga vieja de 7 parámetros** (sin `sin_datos` ni "sin valor"); el workflow usa la de 8, la vieja es código muerto. `supabase/schema.sql`, `full_setup.sql` y `seed.sql` son de etapas anteriores y **no reflejan** el estado actual.

## Categorías de consulta (`query_type`)

Valores canónicos (los guarda `normalize_query_type()`, que también acepta el texto natural que mande el LLM de n8n):

| `query_type` | Qué es | ¿Se deriva a un humano? |
|---|---|---|
| `pedido` | Pedido **o presupuesto** (una sola categoría: para el cliente ambos son una oportunidad de venta) | Siempre |
| `reclamo` | Reclamo | Siempre |
| `sin_datos` | El bot no tenía información para responder | Siempre |
| `consulta_precio`, `consulta_stock`, `consulta_horarios`, `consulta_envios`, `consulta_pagos`, `consulta_general` | Consultas que el bot resuelve | Solo si el bot lo marca (cliente pide hablar con una persona) |
| `spam`, `numero_equivocado`, `sin_contenido` | **Sin valor** (publicidad, número equivocado, saludos/stickers) | **Nunca**; no cuentan como tiempo ahorrado |

- **Pedido y presupuesto son una sola categoría.** En la UI se muestra "Pedido / Presupuesto". **No reintroducir `presupuestos_count`** ni un filtro/etiqueta separada. La columna `presupuestos_count` de la vista `chat_analytics_daily` queda en 0 (no se recrea la vista para no perder `security_invoker`). El front tolera filas viejas `pedido_presupuesto`.
- `chat_close_turn` aplica la regla de derivación (pedido, reclamo y `sin_datos` siempre; `sin_valor` nunca). `query_type_rank` decide la categoría "pegajosa" de la sesión; lo "sin valor" no pisa a la categoría real.
- **El clasificador de n8n ya manda las 12 categorías, pero solo en el BORRADOR del workflow** (ver sección n8n: lo publicado sigue siendo la versión del 23/09). Mientras no se publique, el bot real no usa las categorías nuevas: los datos reales caen en "Otras consultas" y "Sin valor" queda en 0. Los 33 registros que hoy hay en `chat_analytics` son todos de las categorías viejas. Guía y prompt: `supabase/n8n-clasificador-categorias.md`.

## Dashboard "Tiempo y Dinero"

Diseño de los profesores mentores (referencia: `Dashboard.dc.html`, un único componente con `tab` = tiempo|dinero y `status` = ok|loading|empty|error). **Se copió fiel, solo dentro del dashboard:** tipografía **Inter** y paleta azul/verde/rojo estilo Apple, aisladas bajo `.cb-dash` (`src/app/dashboard/dashboard.css`; la fuente ahora se carga en el layout raíz). Desde la estandarización visual el resto de la app usa el mismo sistema (ver "Sistema de diseño").

Estructura de `src/app/dashboard/page.tsx` (de arriba abajo):
1. Línea de contexto ("Ceibo AI Tech Solutions · ● Asistente activo · actualizado hace X") + selector de período (Hoy, 7 días, 30 días, Este mes, Personalizado; 90 días y Mes pasado funcionan por URL).
2. **"Qué hizo Ceibo con cada consulta"**: 6 fichas que **suman el total** (recibidas, resueltas solo por Ceibo, posibles ventas derivadas, reclamos derivados, sin datos para responder, sin valor). "Resueltas" y "Sin valor" abren un desglose (Escape o click afuera lo cierra).
3. **Dos tarjetas-pestaña** (Tiempo azul / Dinero verde). La pestaña activa vive en la URL: `?vista=dinero` (por defecto Tiempo).
4. **Detalle de la pestaña activa**: Tiempo = gráfico de horas devueltas por período + "Sin Ceibo y con Ceibo" + velocidad de respuesta / % sin intervención / llegaron al equipo. Dinero = gráfico del valor por período + reparto con vendedor / sin asignar (con link "Asignar vendedor" a `/inbox`) + pedido promedio / pedidos nuevos vs. anterior / esperando a un vendedor.
5. Pie "Cómo calculamos estos números" + **Descargar informe** (= `window.print()` con CSS de impresión: oculta el menú y la barra superior, muestra **las dos vistas** y se guarda como PDF).

Estados: cargando (esqueletos; el refresco de fondo no parpadea), sin datos (sugiere un período MÁS largo, nunca el ya elegido), error de conexión (banner con "Reintentar"; **el banner de error debe seguir visible**, ver bug 5). **Modo oscuro activo** (clase `dark` en `<html>`, ver "Sistema de diseño").

Componentes en `src/components/dashboard/`: `tiles-row`, `focus-tabs`, `panels` (`TimePanel`, `MoneyPanel`, gráfico y tarjetas), `states`, `period-filter`, `icons`. La lógica pura (números, dinero, gráficos, fichas) está en `src/lib/dashboard-overview.ts`, con tests (`node tests/e2e/test-dashboard-overview.mjs`).

### Datos y definiciones

- **Una sola llamada** por período: `get_dashboard_overview(p_from, p_to, p_granularity)` (migración F), que devuelve fichas, tiempo, dinero, buckets del gráfico y el período anterior. Fechas **locales de la empresa** (`empresas.timezone`), no UTC. El período vive en la URL (`?rango=30d`, `?rango=custom&desde=…&hasta=…`, `&vista=dinero`); sin parámetros = 30 días.
- **Unidad: la consulta** (una fila de `chat_analytics` = un mensaje de cliente que el bot respondió). Cada consulta cae en **una sola categoría** (por eso las fichas suman): pedido → ventas · reclamo → reclamos · spam/equivocado/sin contenido → sin valor · derivada por otro motivo → sin datos · el resto → resueltas.
- **Horas devueltas** = consultas **resueltas solo por Ceibo** × 12 min (`MINUTES_SAVED_PER_AI_RESOLUTION` en `src/lib/constants.ts`; la base lo repite como `* 0.2`: si se cambia, cambiar ambos). **No cuenta** las "sin valor". Jornadas = horas ÷ 8. Menos de 60 min se muestra en minutos.
- **"Llegaron a tu equipo"** = ventas + reclamos + sin datos. **"Se resuelven sin intervención"** = el resto (incluye lo sin valor). "Sin Ceibo / Con Ceibo" = 100% vs. lo que llega al equipo.
- **Velocidad de respuesta** = mediana REAL, en segundos, entre el mensaje del cliente y la respuesta del bot (`n8n_chat_histories`, pares de menos de 10 min). No es una suposición.
- **Dinero** se cuenta **por cliente (sesión)**: último monto estimado de cada cliente con pedido en el período (no suma dos veces al que repite el presupuesto). El valor de cada cliente se atribuye al bucket de su **primer** pedido, para que **la suma de las barras = el total**. "Sin asignar" = pedido abierto (`resolution_status = 'derivado'`) sin `assigned_to`; "con vendedor" = el resto. Los **conteos** de ventas son por consulta (coinciden con la ficha); el **pedido promedio** = valor ÷ clientes con monto. Solo hay monto cuando el cliente menciona una cantidad.
- **Período anterior** de igual duración, para "▲ 18% vs. período anterior" (solo si hay una variación calculable).
- **Modo demo** (cliente mock, sin RPC): la misma estructura se arma en el navegador desde las filas diarias (`buildOverviewFromDailyRows`); las categorías se reparten para que también sumen el total.
- Código anterior que ya no usa el dashboard pero sigue en el repo: `get_dashboard_metrics()` (migración D), `getDashboardMetrics`, `getRecent30Days`, `getEscalatedOrders`, `getProductCatalog` y los helpers `maskPhone` / `summarizeProduct`.

## Sistema de diseño (toda la app) y modo oscuro

Un solo estándar visual en todas las pantallas (dashboard, Inbox, Chats, Base de Conocimiento, Configuración, Login y landing), tomado del dashboard de los profesores. **No hardcodear colores: usar los tokens.**

- **Tipografía:** Inter (`--font-sans`, cargada en `src/app/layout.tsx`). Ya no se usan Sora ni Manrope; `.font-display` es un alias de Inter.
- **Tokens** en `src/app/globals.css` (claro en `:root`, oscuro en `.dark`); Tailwind los lee con `color-mix` (`tailwind.config.ts`). Fondo `#F5F5F7`, tarjetas blancas `rounded-card` (22px) con sombra suave (`shadow-panel`/`shadow-hi`), sin bordes.
- **Componentes base** (`src/components/ui/`): botones tipo pastilla (variantes default/primary azul, secondary, outline, ghost, destructive), `Badge` pastilla teñida, campos grises (`.ui-field`), control segmentado (`.ui-seg` / `.ui-seg-item` con `aria-pressed`), `.ui-page-title`, `.ui-label`. Menú lateral **claro estilo Apple** (item activo en blanco).
- **Modo oscuro:** interruptor claro/oscuro/automático en la barra superior (`ThemeToggle`). `ThemeProvider` (`src/contexts/theme-context.tsx`) guarda la elección en `localStorage` (`ceibo.theme`, por defecto claro) y pone la clase `dark` en `<html>`; un script inline en el `<head>` (`THEME_INIT_SCRIPT`, `src/lib/theme.ts`) la aplica antes de hidratar para evitar el parpadeo. El dashboard sigue la misma clase (`.dark .cb-dash`).
- **Contraste:** se verificó con un escaneo automático (WCAG AA) en claro y oscuro. Los textos chicos sobre pastillas teñidas usan `info-strong`, `success`, `warning`, `negative`; no bajar esos tokens de oscuridad.

## Semántica de color

**Bueno = verde, malo = rojo.** Un mismo color significa lo mismo en toda la app (el dashboard tiene su propia paleta equivalente).

- **Verde (`success`)**: resultados buenos y dinero ("Atendido", "Con un vendedor"). **Rojo (`negative`)**: lo malo o lo que pide acción ("Pendiente", "Atención requerida", contador de pendientes, errores). `Badge variant="destructive"` usa este rojo.
- **Azul (`primary` / `info`, texto chico `info-strong`)**: acciones e información (botón principal, ítem activo, burbujas del asesor, plan). **Naranja** (`warning`): estados intermedios y MODO DEMO.
- **Terracota (`ceibo`): SOLO el logo** (`BrandMark`). Las variantes `ceibo`/`ceibo-soft` de `Badge` son alias de `info`.
- Usar `text-negative` (no `text-destructive`) para texto chico en rojo.
- **El dashboard tiene su propia paleta** (variables `--blue`, `--green`, `--red` bajo `.cb-dash`): ahí azul = Tiempo, verde = Dinero y lo bueno, rojo = lo malo.


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
