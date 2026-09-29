# Cambios multi-tenant en el workflow de n8n

Workflow: **HOLY RAG - Conversación copy** (`ZMrhkzMWbCpxBMTd`). Todos son compatibles con la base
actual (migración A aplicada, B todavía no). Guardá primero una versión del workflow para poder volver.

Reemplazá `EMPRESA_ID` por `a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11` (tenant actual).

## 1. Nodo nuevo `CONFIG` (Set)
Entre **Solo mensajes de texto** y **Abrir turno**.
- Campo: `empresa_id` (string) = `EMPRESA_ID`. Activar "Include Other Input Fields".
- Es la única fuente de verdad del tenant. Al duplicar el workflow para otro cliente se cambia solo esto.

## 2. Nodo `Abrir turno`
- Query: `select * from public.chat_open_turn($1, $2, $3, $4::uuid);`
- Query Replacement (agregar el 4º elemento):
```
={{ [ $('Webhook').first().json.body.entry[0].changes[0].value.messages[0].from,
      $('Webhook').first().json.body.entry[0].changes[0].value.contacts?.[0]?.profile?.name ?? null,
      $('Webhook').first().json.body.entry[0].changes[0].value.messages[0].text.body,
      $('CONFIG').first().json.empresa_id ] }}
```

## 3. Nodo `Postgres Chat Memory` — Session Key
```
={{ $('CONFIG').first().json.empresa_id + ':' + $('Webhook').first().json.body.entry[0].changes[0].value.messages[0].from }}
```
Efecto: las conversaciones en curso pierden el contexto previo del agente una sola vez.

## 4. Nodo `Supabase Vector Store1` — Options → Metadata Filter
- Name: `empresa_id`
- Value: `={{ $('CONFIG').first().json.empresa_id }}`

## 5. Nodo `Execute a SQL query2` (quita la interpolación del texto del LLM)
Query:
```sql
WITH matched AS (
  SELECT
    row_data->>'Código' AS codigo,
    NULLIF(regexp_replace(row_data->>'Precio ARS', '[^0-9.]', '', 'g'), '')::numeric AS precio
  FROM tabular_document_rows
  WHERE length($1::text) > 0
    AND row_data->>'Producto' ILIKE '%' || $1::text || '%'
  LIMIT 1
)
SELECT
  $2::text AS query_type,
  $3::boolean AS is_escalated,
  $4::text AS resolution_status,
  COALESCE((SELECT codigo FROM matched), 'N/A') AS related_product_id,
  CASE
    WHEN $5::numeric IS NOT NULL AND (SELECT precio FROM matched) IS NOT NULL
    THEN $5::numeric * (SELECT precio FROM matched)
    ELSE NULL
  END AS estimated_amount;
```
Query Replacement:
```
={{ [ String($json.output.related_product_id ?? '').replace(/[%_\\]/g, ' ').trim().replace(/\s+/g, '%'),
      $json.output.query_type ?? null,
      $json.output.is_escalated === true || $json.output.is_escalated === 'true',
      $json.output.resolution_status ?? null,
      $json.output.estimated_quantity ?? null ] }}
```

## Prueba
Mandá un WhatsApp de prueba y verificá: (a) responde el bot, (b) aparece la sesión en `chat_sessions`
con el `empresa_id` correcto, (c) la respuesta usa el catálogo/FAQ. Recién después se aplica la
migración B (`20260929_multitenant_b_strict.sql`).

## Pendiente (no incluido acá)
- El secreto del nodo **Verificar secreto compartido** está escrito en texto plano: rotarlo.
- `phoneNumberId` de **Enviar WhatsApp de vendedor** está fijo en el nodo: cambiarlo en cada copia.
