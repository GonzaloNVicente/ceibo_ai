# n8n: ampliar el clasificador de consultas

> **ESTADO (2026-11-02): APLICADO en el BORRADOR del workflow, NO PUBLICADO.** La migración F ya está aplicada. Los
> cambios se verificaron leyendo el workflow: 12 categorías, `gpt-4o` con temperatura 0, parser actualizado. Lo que
> atiende el WhatsApp real sigue siendo la versión publicada del 23/09 (`1d883a46-6671-40c7-9299-b7bbe54137f2`).
> **El paso 2 de abajo quedó OBSOLETO:** el flujo actual ya no usa `estimated_quantity`; el clasificador extrae `items[]`
> (`producto`, `cantidad`, `precio_unitario`) y `Execute a SQL query2` calcula el monto. El resto de esta guía queda como
> referencia de las categorías y las reglas de derivación.

Para que las fichas del dashboard ("Qué hizo Ceibo con cada consulta") muestren datos reales, el bot tiene que
clasificar cada consulta con las categorías nuevas. **Primero** hay que aplicar la migración
`supabase/migrations/20261102_f_dashboard_overview.sql` en el SQL Editor (es la que enseña a la base a
reconocer y derivar esas categorías). **Después** se hace este cambio en n8n.

Workflow: **HOLY RAG - Conversación copy** (ID `ZMrhkzMWbCpxBMTd`). Guardar antes una versión para poder volver.
Se tocan **solo** dos nodos: `Basic LLM Chain1` (el texto del prompt) y `Structured Output Parser1` (una descripción).
No cambiar nombres de campos, credenciales, modelos ni el resto del flujo.

## Prompt para la IA que edita n8n (copiar y pegar)

````text
En el workflow "HOLY RAG - Conversación copy" (ID ZMrhkzMWbCpxBMTd) modificá SOLO el texto del prompt del nodo
"Basic LLM Chain1" y la descripción del campo query_type del nodo "Structured Output Parser1".
Guardá antes una versión del workflow para poder volver atrás. No toques credenciales, modelos, nombres de
campos, ni ningún otro nodo.

1) En "Basic LLM Chain1", reemplazá TODO el bloque que va desde
   "Clasificá la consulta del cliente en una de estas categorías..." hasta el final del párrafo que empieza con
   "IMPORTANTE: marcá is_escalated = true..." por el texto de abajo. Dejá intacto el resto del prompt
   (resolution_status, company_name, address, related_product_id y estimated_quantity).

   --- TEXTO NUEVO (empieza en la próxima línea) ---
   Clasificá la consulta del cliente en UNA sola de estas categorías y escribila exactamente así en query_type:
   Precio, Stock, Horarios, Envíos, Pagos, Consulta general, Pedido, Reclamo, Sin datos, Spam, Número equivocado o Sin contenido.

   Cómo elegir:
   - Precio: pregunta cuánto cuesta un producto.
   - Stock: pregunta si hay o está disponible un producto.
   - Horarios: pregunta por horarios de atención o por la ubicación del local.
   - Envíos: pregunta por envíos, costos de envío, zonas o demoras de entrega.
   - Pagos: pregunta por formas de pago, cuotas, facturación o medios de pago.
   - Consulta general: cualquier otra consulta que el bot pudo responder (políticas, garantías, preguntas sobre la empresa u otras no relacionadas con el negocio).
   - Pedido: el cliente quiere comprar, reservar o retirar productos, O pide un presupuesto o cotización (con o sin cantidad, para una obra o una compra puntual). Pedido y presupuesto son la MISMA categoría: usá siempre "Pedido". Ejemplos: "dale, reserváme 10 bolsas", "paso a buscarlas mañana", "pasame un presupuesto para 200 ladrillos". Si solo pregunta el precio de un producto, es Precio.
   - Reclamo: reporta un problema con un pedido, una entrega o un producto, o pide hablar con una persona por una queja. No es una consulta nueva de venta.
   - Sin datos: el bot NO tenía la información para responder (la herramienta no devolvió nada útil y el bot dijo que no tiene ese dato o que lo deriva con un vendedor), o el cliente pidió expresamente hablar con una persona sin ser un reclamo.
   - Spam: publicidad, ofertas no pedidas, cadenas o mensajes automáticos ajenos al negocio.
   - Número equivocado: el cliente aclara que se equivocó de número o escribe a otro negocio.
   - Sin contenido: saludos sueltos, stickers, emojis o mensajes vacíos que no contienen ninguna consulta.
   Si una consulta encaja en más de una categoría, usá esta prioridad: Reclamo, Pedido, Sin datos y, por último, las categorías de tema (Precio, Stock, Horarios, Envíos, Pagos, Consulta general).

   Reglas de derivación (is_escalated):
   - is_escalated = true SIEMPRE que query_type sea "Pedido", "Reclamo" o "Sin datos": en esos casos un vendedor humano tiene que tomar la conversación.
   - is_escalated = true también si el cliente pide explícitamente hablar con una persona.
   - is_escalated = false para Precio, Stock, Horarios, Envíos, Pagos y Consulta general (salvo el pedido explícito de hablar con una persona).
   - is_escalated = false SIEMPRE para Spam, Número equivocado y Sin contenido.
   Indicá también 'resolution_status': "Derivado" si is_escalated es true, o "Resuelto" si el bot pudo responder por sí solo.
   --- FIN DEL TEXTO NUEVO ---

2) En el mismo prompt, en el párrafo de estimated_quantity, asegurate de que diga "Si la categoría es Pedido Y el cliente
   mencionó explícitamente una cantidad numérica..." y "...o la categoría no es Pedido, poné 'estimated_quantity' en null".
   (Si todavía menciona "Presupuesto", sacalo: Pedido y presupuesto son una sola categoría.)

3) En "Structured Output Parser1", en el schema manual, dejá "query_type" como { "type": "string" } y agregale esta
   descripción: "Una de: Precio, Stock, Horarios, Envíos, Pagos, Consulta general, Pedido, Reclamo, Sin datos, Spam, Número equivocado, Sin contenido".
   No agregues enum ni cambies los demás campos.

VERIFICACIÓN: probá con estos mensajes de WhatsApp (o con pin data) y confirmá el query_type, is_escalated y
resolution_status que se guardan:
- "¿cuánto sale la bolsa de cemento?"                 -> Precio, false, Resuelto
- "¿tienen cal hidratada?"                            -> Stock, false, Resuelto
- "¿hasta qué hora atienden los sábados?"             -> Horarios, false, Resuelto
- "¿hacen envíos a Gualeguaychú?"                     -> Envíos, false, Resuelto
- "¿puedo pagar en cuotas?"                           -> Pagos, false, Resuelto
- "dale, reserváme 10 bolsas de cemento"              -> Pedido, true, Derivado (estimated_quantity = 10)
- "necesito un presupuesto para una losa de 40 m2"    -> Pedido, true, Derivado
- "me llegó mal el pedido, quiero hablar con alguien" -> Reclamo, true, Derivado
- una pregunta cuya respuesta NO está en el catálogo ni en las FAQ -> Sin datos, true, Derivado
- "Aprovechá 50% off en tu seguro, entrá a ..."       -> Spam, false, Resuelto
- "perdón, me equivoqué de número"                    -> Número equivocado, false, Resuelto
- "hola"  / un sticker                                -> Sin contenido, false, Resuelto
Reportame qué nodos modificaste y los resultados de cada prueba.
````

## Cómo se ve en la base

`normalize_query_type()` convierte esas etiquetas a valores canónicos (`consulta_precio`, `consulta_stock`,
`consulta_horarios`, `consulta_envios`, `consulta_pagos`, `consulta_general`, `pedido`, `reclamo`, `sin_datos`,
`spam`, `numero_equivocado`, `sin_contenido`) y `chat_close_turn` aplica la derivación. Si el bot manda una etiqueta
desconocida, se guarda en minúsculas con guiones bajos y cae en "Otras consultas" del dashboard.

Hasta que n8n use las categorías nuevas, todo sigue funcionando: lo nuevo se cuenta como "Otras consultas" y las
fichas "Sin datos" y "Sin valor" muestran los datos que existan (hoy, 0 en "Sin valor").
