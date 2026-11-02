# n8n: monto de un pedido "híbrido" (precio del catálogo primero)

> **ESTADO (2026-11-02): APLICADO en el BORRADOR del workflow, NO PUBLICADO.** Se verificó leyendo el workflow: la consulta
> del nodo es idéntica a la de este documento, el Query Replacement sigue igual y la credencial es la de solo lectura.
> Versión del borrador con el cambio: `bfb7e283-dcfe-4c54-8de8-919a5b0ad495`; para volver atrás: `6227397e-0689-438a-a324-267ada449a42`.
> Los 6 casos de prueba dieron lo esperado (probados contra el catálogo real).
>
> **Pendiente antes de sumar un 2º cliente:** la consulta no filtra por `empresa_id`. Se apoya en que la credencial de solo
> lectura está limitada por RLS al tenant de prueba. Agregar `t.empresa_id = $5::uuid` (pasando el `empresa_id` del nodo
> `CONFIG` en el Query Replacement) la haría segura aunque alguien cambie la credencial.

## Por qué

Hoy `Execute a SQL query2` calcula `estimated_amount = Σ cantidad × precio_unitario` con el precio que el modelo de IA
**lee de la respuesta del bot**. Si lo lee mal, el monto queda mal y nada lo detecta. La versión híbrida busca primero
el precio en el catálogo (`tabular_document_rows`) y usa el del modelo solo como respaldo:

- Si el producto coincide con **exactamente una** fila del catálogo → se usa el precio del catálogo.
- Si hay 0 coincidencias o más de una (nombre ambiguo) → se usa el precio que anotó el modelo.
- Los pedidos de varios productos siguen funcionando (cada producto se valora por separado).
- Sin cantidad no hay monto (igual que ahora).

Limitación: si el modelo escribe un nombre genérico ("arena") y en el catálogo hay un solo producto que lo contiene,
se usa ese. Casi siempre es correcto, pero no es infalible.

## Prompt para la IA que edita n8n (copiar y pegar)

````text
En el workflow "HOLY RAG - Conversación copy" (ID ZMrhkzMWbCpxBMTd), modificá SOLO el nodo "Execute a SQL query2"
(Postgres, Execute Query). Guardá antes una versión para poder volver atrás. No toques ningún otro nodo.

Objetivo: que el monto de un pedido use el precio del CATÁLOGO (tabla tabular_document_rows) cuando el producto
coincide con una única fila, y el precio que anotó el modelo solo como respaldo.

1) Reemplazá el campo Query por esto, pegado tal cual (es SQL con parámetros $1..$4; NO le agregues {{ }}):

WITH items AS (
  SELECT (elem->>'producto') AS producto,
         NULLIF(elem->>'cantidad','')::numeric AS cantidad,
         NULLIF(elem->>'precio_unitario','')::numeric AS precio_llm
  FROM jsonb_array_elements($1::jsonb) AS elem
),
priced AS (
  SELECT i.producto, i.cantidad, i.precio_llm, m.n_match, m.precio_catalogo
  FROM items i
  LEFT JOIN LATERAL (
    SELECT count(*) AS n_match,
           max(NULLIF(regexp_replace(t.row_data->>'Precio ARS', '[^0-9.]', '', 'g'), '')::numeric) AS precio_catalogo
    FROM tabular_document_rows t
    WHERE length(btrim(coalesce(i.producto, ''))) > 2
      AND t.row_data->>'Producto' ILIKE '%' || replace(regexp_replace(btrim(i.producto), '[%_\\]', ' ', 'g'), ' ', '%') || '%'
  ) m ON true
)
SELECT $2::text AS query_type,
       $3::boolean AS is_escalated,
       $4::text AS resolution_status,
       COALESCE(NULLIF(string_agg(producto, ', '), ''), 'N/A') AS related_product_id,
       NULLIF(SUM(CASE
         WHEN cantidad IS NOT NULL
          AND COALESCE(CASE WHEN n_match = 1 THEN precio_catalogo END, precio_llm) IS NOT NULL
         THEN cantidad * COALESCE(CASE WHEN n_match = 1 THEN precio_catalogo END, precio_llm)
         ELSE 0 END), 0) AS estimated_amount
FROM priced;

2) NO cambies el Query Replacement (sigue igual: [ JSON.stringify($json.output.items ?? []), query_type, is_escalated,
   resolution_status ]), ni las credenciales (debe seguir usando la de solo lectura), ni los nombres de las columnas de
   salida: query_type, is_escalated, resolution_status, related_product_id, estimated_amount.

3) PROBALO SOLO EN ESE NODO (con "Ejecutar paso" y datos fijados / pin data). NO corras el workflow completo: el flujo
   completo crea leads en Zoho CRM. Fijá como entrada del nodo items = $1 y probá estos casos:
   a) [{"producto":"Cemento Portland 50 kg","cantidad":10,"precio_unitario":12500}]  -> estimated_amount = 125000
   b) [{"producto":"Cemento Portland 50 kg","cantidad":10,"precio_unitario":1250}]   -> estimated_amount = 125000 (corrige al catálogo)
   c) [{"producto":"Cemento Portland 50 kg","cantidad":10,"precio_unitario":12500},{"producto":"Ladrillo Hueco 12x18x33","cantidad":100,"precio_unitario":900}] -> 217000
   d) [{"producto":"producto inexistente xyz","cantidad":3,"precio_unitario":100}]    -> 300 (respaldo: precio del modelo)
   e) [{"producto":"Cemento Portland 50 kg","cantidad":null,"precio_unitario":12500}] -> estimated_amount = null
   f) []                                                                                -> related_product_id = "N/A", estimated_amount = null
   Reportame los resultados de cada caso y confirmá que las 5 columnas de salida se mantienen.
````

## Resultados de la prueba previa (solo lectura, catálogo real)

| Caso | Solo modelo (hoy) | Híbrida |
|---|---|---|
| Precio bien leído (10 × cemento a $12.500) | $125.000 | $125.000 |
| Modelo lee $1.250 en vez de $12.500 | $12.500 | **$125.000** |
| "arena" con precio equivocado del modelo (catálogo: Arena Fina $28.500, 2 u.) | $10.000 | **$57.000** |
| Varios productos (cemento + ladrillo) | $215.000 | $217.000 |
| Producto fuera del catálogo | $300 | $300 |
| Sin cantidad | sin monto | sin monto |

Como el catálogo se consulta con la credencial de solo lectura (`ceibo_readonly`), por ahora solo ve el catálogo del
tenant actual. Para un cliente nuevo hay que usar su propia credencial de solo lectura (ver el checklist de alta en
`CLAUDE.md`).
