-- =============================================================================
-- Ceibo AI - Dashboard "Tiempo y Dinero" (rediseño)
--
--   1) Clasificador ampliado. Nuevos query_type (el bot de n8n los manda; el normalizador acepta
--      tambien los nombres en texto natural y los guarda siempre en su forma canonica):
--        consulta_precio, consulta_stock, consulta_horarios, consulta_envios, consulta_pagos,
--        consulta_general, pedido (incluye presupuesto), reclamo,
--        sin_datos           -> el bot no tenia informacion para responder: se DERIVA al equipo
--        spam, numero_equivocado, sin_contenido  -> "sin valor": NO se derivan y no cuentan
--                                                   como tiempo ahorrado
--   2) chat_close_turn: sin_datos siempre se deriva; las categorias "sin valor" nunca.
--   3) get_dashboard_overview(): una sola llamada con todo lo que muestra el dashboard nuevo
--      (fichas por categoria, tiempo, dinero, grafico por bucket y periodo anterior).
--
-- Unidad de conteo: la CONSULTA (una fila de chat_analytics por cada mensaje de cliente que el bot
-- responde). Cada consulta cae en UNA sola categoria, asi que las fichas suman el total:
--      pedido -> ventas | reclamo -> reclamos | spam/equivocado/sin contenido -> sin valor
--      | derivada a un humano por otro motivo -> sin datos | el resto -> resueltas por Ceibo
-- El DINERO se cuenta por cliente (sesion): ultimo monto estimado de cada cliente con pedido dentro
-- del periodo, sin sumar dos veces al que repite el mismo presupuesto.
--
-- SECURITY INVOKER: aplica el RLS de quien consulta (solo ve su empresa). Idempotente.
-- =============================================================================

-- 1) Normalizador de tipo de consulta -------------------------------------------------------
create or replace function public.normalize_query_type(p text)
returns text language sql immutable set search_path = public as $$
  select case
    when p is null or btrim(p) = '' or upper(btrim(p)) = 'N/A' then null
    when lower(btrim(p)) in ('precio','precios','consulta_precio','consulta precio') then 'consulta_precio'
    when lower(btrim(p)) in ('stock','disponibilidad','disponibilidad y stock','consulta_stock','consulta stock') then 'consulta_stock'
    when lower(btrim(p)) in ('horarios','horario','ubicacion','ubicación','horarios y ubicacion','horarios y ubicación','consulta_horarios') then 'consulta_horarios'
    when lower(btrim(p)) in ('envio','envío','envios','envíos','consulta_envios') then 'consulta_envios'
    when lower(btrim(p)) in ('pago','pagos','forma de pago','formas de pago','medios de pago','consulta_pagos') then 'consulta_pagos'
    when lower(btrim(p)) in ('pedido','pedidos','presupuesto','presupuestos','pedido_presupuesto',
                             'pedido presupuesto','pedido / presupuesto') then 'pedido'
    when lower(btrim(p)) in ('reclamo','reclamos') then 'reclamo'
    when lower(btrim(p)) in ('sin datos','sin_datos','sin datos para responder','sin informacion','sin información') then 'sin_datos'
    when lower(btrim(p)) in ('spam','publicidad','spam o publicidad','spam_publicidad') then 'spam'
    when lower(btrim(p)) in ('numero equivocado','número equivocado','numero_equivocado','equivocado') then 'numero_equivocado'
    when lower(btrim(p)) in ('sin contenido','sin_contenido','saludo','saludos','sticker','mensaje sin contenido') then 'sin_contenido'
    when lower(btrim(p)) in ('consulta general','consulta_general','general') then 'consulta_general'
    else regexp_replace(lower(btrim(p)), '\s+', '_', 'g')
  end
$$;

-- Prioridad de la categoria de una SESION (solo sube). "Sin valor" no pisa a la categoria real.
create or replace function public.query_type_rank(p text)
returns int language sql immutable set search_path = public as $$
  select case p
    when 'reclamo' then 7
    when 'pedido' then 6
    when 'pedido_presupuesto' then 6
    when 'sin_datos' then 5
    when 'consulta_stock' then 4
    when 'consulta_precio' then 3
    when 'consulta_horarios' then 2
    when 'consulta_envios' then 2
    when 'consulta_pagos' then 2
    when 'consulta_general' then 1
    else 0
  end
$$;

-- 2) chat_close_turn: reglas de derivacion con las categorias nuevas ----------------------------
create or replace function public.chat_close_turn(
  p_session_id uuid,
  p_bot_text text,
  p_query_text text,
  p_query_type text,
  p_resolution_status text,
  p_is_escalated boolean,
  p_related_product_id text,
  p_estimated_amount numeric default null
)
returns table (create_lead boolean, escalated boolean, status text, qtype text)
language plpgsql
set search_path = public
as $$
#variable_conflict use_column
declare
  s public.chat_sessions%rowtype;
  v_type text := public.normalize_query_type(p_query_type);
  v_status text := public.normalize_resolution_status(p_resolution_status);
  v_esc boolean;
  v_product text := nullif(nullif(btrim(p_related_product_id), ''), 'N/A');
  v_lead boolean;
  v_new_status text;
begin
  select * into s from public.chat_sessions where id = p_session_id for update;
  if not found then
    raise exception 'chat_close_turn: sesion % inexistente', p_session_id;
  end if;

  -- Pedido/presupuesto, reclamo y "sin datos" siempre requieren a un humano.
  -- Spam, numero equivocado y mensajes sin contenido nunca se derivan.
  v_esc := (
        coalesce(p_is_escalated, false)
     or coalesce(v_status = 'derivado', false)
     or coalesce(v_type in ('pedido_presupuesto', 'pedido', 'reclamo', 'sin_datos'), false)
  ) and coalesce(v_type not in ('spam', 'numero_equivocado', 'sin_contenido'), true);

  insert into public.chat_analytics
    (empresa_id, session_id, customer_phone, customer_name, query_type, query_text,
     related_product_id, bot_response, is_escalated, resolution_status, estimated_amount)
  values
    (s.empresa_id, s.id, s.customer_phone, s.customer_name, v_type, p_query_text,
     v_product, p_bot_text, v_esc, case when v_esc then 'derivado' else 'resuelto' end,
     p_estimated_amount);

  insert into public.n8n_chat_histories (session_id, empresa_id, message_text, sender_type)
  values (s.id, s.empresa_id, coalesce(p_bot_text, ''), 'bot');

  v_lead := s.lead_created_at is null and v_esc;
  v_new_status := case when (s.is_escalated or v_esc or s.resolution_status = 'derivado')
                       then 'derivado' else 'resuelto' end;

  update public.chat_sessions set
    query_type = case when public.query_type_rank(v_type) > public.query_type_rank(s.query_type)
                      then v_type else s.query_type end,
    related_product_id = coalesce(v_product, s.related_product_id),
    is_escalated = s.is_escalated or v_esc,
    resolution_status = v_new_status,
    estimated_amount = coalesce(p_estimated_amount, s.estimated_amount),
    lead_created_at = case when v_lead then now() else s.lead_created_at end,
    last_message_text = left(coalesce(p_bot_text, ''), 500),
    last_message_at = now()
  where id = s.id;

  return query select v_lead, v_esc, v_new_status, v_type;
end;
$$;

revoke all on function public.chat_close_turn(uuid, text, text, text, text, boolean, text, numeric)
  from public, anon, authenticated;
grant execute on function public.chat_close_turn(uuid, text, text, text, text, boolean, text, numeric)
  to service_role;

-- 3) Resumen de un intervalo [p_from, p_to) (helper interno) -------------------------------------
create or replace function public._dashboard_overview_summary(p_from timestamptz, p_to timestamptz)
returns jsonb
language sql
stable
set search_path = public
as $$
  with base as (
    select a.id, a.session_id, a.query_type, a.estimated_amount, a.created_at,
      case
        when a.query_type in ('pedido', 'pedido_presupuesto') then 'ventas'
        when a.query_type = 'reclamo' then 'reclamos'
        when a.query_type in ('spam', 'numero_equivocado', 'sin_contenido') then 'sin_valor'
        when a.is_escalated then 'sin_datos'
        else 'resueltas'
      end as cat
    from public.chat_analytics a
    where a.empresa_id = public.current_user_empresa_id()
      and a.created_at >= p_from
      and a.created_at <  p_to
  ),
  counts as (
    select
      count(*)                                         as total,
      count(*) filter (where cat = 'resueltas')        as resueltas,
      count(*) filter (where cat = 'ventas')           as ventas,
      count(*) filter (where cat = 'reclamos')         as reclamos,
      count(*) filter (where cat = 'sin_datos')        as sin_datos,
      count(*) filter (where cat = 'sin_valor')        as sin_valor,
      count(*) filter (where cat = 'resueltas' and query_type = 'consulta_precio')   as r_precios,
      count(*) filter (where cat = 'resueltas' and query_type = 'consulta_stock')    as r_stock,
      count(*) filter (where cat = 'resueltas' and query_type = 'consulta_horarios') as r_horarios,
      count(*) filter (where cat = 'resueltas' and query_type = 'consulta_envios')   as r_envios,
      count(*) filter (where cat = 'resueltas' and query_type = 'consulta_pagos')    as r_pagos,
      count(*) filter (where cat = 'resueltas'
                       and (query_type is null or query_type not in
                            ('consulta_precio','consulta_stock','consulta_horarios','consulta_envios','consulta_pagos')))
                                                       as r_otras,
      count(*) filter (where query_type = 'spam')              as v_spam,
      count(*) filter (where query_type = 'numero_equivocado') as v_equivocado,
      count(*) filter (where query_type = 'sin_contenido')     as v_sin_contenido
    from base
  ),
  ped_sessions as (
    -- una fila por cliente (sesion) con pedido en el periodo, con su ULTIMO monto conocido
    select coalesce(b.session_id, b.id) as sid,
           (array_agg(b.session_id))[1] as session_id,
           (array_agg(b.estimated_amount order by b.created_at desc)
              filter (where b.estimated_amount is not null))[1] as monto
    from base b
    where b.cat = 'ventas'
    group by coalesce(b.session_id, b.id)
  ),
  ped_status as (
    select ps.sid,
           coalesce(ps.monto, 0) as monto,
           -- "sin asignar" = el pedido sigue abierto y ningun vendedor lo tomo
           (s.id is not null and s.assigned_to is null and s.resolution_status = 'derivado') as sin_asignar
    from ped_sessions ps
    left join public.chat_sessions s on s.id = ps.session_id
  ),
  money as (
    select coalesce(sum(monto), 0)                                  as valor,
           count(*) filter (where monto > 0)                        as clientes_con_monto,
           coalesce(sum(monto) filter (where sin_asignar), 0)       as valor_sin_asignar
    from ped_status
  ),
  split as (
    select count(*) filter (where not st.sin_asignar) as n_con_vendedor,
           count(*) filter (where st.sin_asignar)     as n_sin_asignar
    from base b
    join ped_status st on st.sid = coalesce(b.session_id, b.id)
    where b.cat = 'ventas'
  ),
  resp as (
    -- velocidad de respuesta REAL del bot: segundos entre el mensaje del cliente y la respuesta
    select percentile_cont(0.5) within group (order by m.secs) as mediana,
           count(*) as n
    from (
      select extract(epoch from (h.created_at - h.prev_at)) as secs
      from (
        select x.created_at, x.sender_type,
               lag(x.sender_type) over w as prev_type,
               lag(x.created_at)  over w as prev_at
        from public.n8n_chat_histories x
        where x.empresa_id = public.current_user_empresa_id()
          and x.created_at >= p_from - interval '1 hour'
          and x.created_at <  p_to
        window w as (partition by x.session_id order by x.created_at)
      ) h
      where h.sender_type = 'bot' and h.prev_type = 'user'
        and h.created_at >= p_from
        and h.created_at - h.prev_at < interval '10 minutes'
    ) m
  )
  select jsonb_build_object(
    'total',            c.total,
    'resueltas',        c.resueltas,
    'ventas',           c.ventas,
    'reclamos',         c.reclamos,
    'sin_datos',        c.sin_datos,
    'sin_valor',        c.sin_valor,
    'derivadas',        c.ventas + c.reclamos + c.sin_datos,
    'resueltas_detalle', jsonb_build_object(
        'precios', c.r_precios, 'stock', c.r_stock, 'horarios', c.r_horarios,
        'envios', c.r_envios, 'pagos', c.r_pagos, 'otras', c.r_otras),
    'sin_valor_detalle', jsonb_build_object(
        'spam', c.v_spam, 'numero_equivocado', c.v_equivocado, 'sin_contenido', c.v_sin_contenido),
    'ventas_valor',               m.valor,
    'ventas_clientes_con_monto',  m.clientes_con_monto,
    'ventas_con_vendedor_n',      s.n_con_vendedor,
    'ventas_con_vendedor_valor',  m.valor - m.valor_sin_asignar,
    'ventas_sin_asignar_n',       s.n_sin_asignar,
    'ventas_sin_asignar_valor',   m.valor_sin_asignar,
    'respuesta_mediana_seg',      round(r.mediana::numeric, 1),
    'respuesta_n',                r.n
  )
  from counts c, money m, split s, resp r;
$$;

-- 4) API para el front ------------------------------------------------------------------------
create or replace function public.get_dashboard_overview(
  p_from date,
  p_to date,
  p_granularity text default 'day'
)
returns jsonb
language plpgsql
stable
set search_path = public
as $$
declare
  v_empresa   uuid := public.current_user_empresa_id();
  v_tz        text;
  v_gran      text := lower(coalesce(p_granularity, 'day'));
  v_days      int;
  v_prev_from date;
  v_prev_to   date;
  v_buckets   jsonb;
begin
  if v_empresa is null then
    raise exception 'UNAUTHORIZED: sin empresa asociada';
  end if;
  if p_from is null or p_to is null or p_to < p_from then
    raise exception 'Rango de fechas invalido';
  end if;

  v_days := (p_to - p_from) + 1;
  if v_days > 731 then
    raise exception 'El rango maximo es de 731 dias';
  end if;
  if v_gran not in ('day', 'week', 'month') then
    raise exception 'Granularidad invalida: %', p_granularity;
  end if;

  select nullif(btrim(e.timezone), '') into v_tz from public.empresas e where e.id = v_empresa;
  if v_tz is null or not exists (select 1 from pg_timezone_names where name = v_tz) then
    v_tz := 'America/Argentina/Buenos_Aires';
  end if;

  with b as (
    select a.id, a.session_id, a.estimated_amount, a.created_at,
           a.created_at at time zone v_tz as local_ts,
           case
             when a.query_type in ('pedido', 'pedido_presupuesto') then 'ventas'
             when a.query_type = 'reclamo' then 'reclamos'
             when a.query_type in ('spam', 'numero_equivocado', 'sin_contenido') then 'sin_valor'
             when a.is_escalated then 'sin_datos'
             else 'resueltas'
           end as cat
    from public.chat_analytics a
    where a.empresa_id = v_empresa
      and a.created_at >= (p_from::timestamp at time zone v_tz)
      and a.created_at <  ((p_to + 1)::timestamp at time zone v_tz)
  ),
  series as (
    select gs::date as bucket
    from generate_series(
      date_trunc(v_gran, p_from::timestamp),
      date_trunc(v_gran, p_to::timestamp),
      ('1 ' || v_gran)::interval
    ) gs
  ),
  agg as (
    select date_trunc(v_gran, local_ts)::date as d,
           count(*)                                                    as total,
           count(*) filter (where cat = 'resueltas')                   as resueltas,
           count(*) filter (where cat in ('ventas','reclamos','sin_datos')) as derivadas
    from b
    group by 1
  ),
  ped as (
    -- el valor de cada cliente se atribuye al bucket de su PRIMER pedido del periodo:
    -- asi la suma de las barras coincide con el total
    select coalesce(session_id, id) as sid,
           min(local_ts) as first_ts,
           (array_agg(estimated_amount order by created_at desc)
              filter (where estimated_amount is not null))[1] as monto
    from b
    where cat = 'ventas'
    group by 1
  ),
  val as (
    select date_trunc(v_gran, first_ts)::date as d, coalesce(sum(monto), 0) as valor
    from ped
    group by 1
  )
  select jsonb_agg(
    jsonb_build_object(
      'date',      s.bucket,
      'total',     coalesce(g.total, 0),
      'resueltas', coalesce(g.resueltas, 0),
      'derivadas', coalesce(g.derivadas, 0),
      'valor',     coalesce(v.valor, 0)
    )
    order by s.bucket
  )
  into v_buckets
  from series s
  left join agg g on g.d = s.bucket
  left join val v on v.d = s.bucket;

  v_prev_to   := p_from - 1;
  v_prev_from := p_from - v_days;

  return jsonb_build_object(
    'timezone',    v_tz,
    'from',        p_from,
    'to',          p_to,
    'granularity', v_gran,
    'buckets',     coalesce(v_buckets, '[]'::jsonb),
    'summary',     public._dashboard_overview_summary(
                     p_from::timestamp at time zone v_tz,
                     (p_to + 1)::timestamp at time zone v_tz),
    'previous',    jsonb_build_object(
                     'from', v_prev_from,
                     'to',   v_prev_to,
                     'summary', public._dashboard_overview_summary(
                       v_prev_from::timestamp at time zone v_tz,
                       (v_prev_to + 1)::timestamp at time zone v_tz))
  );
end;
$$;

revoke all on function public._dashboard_overview_summary(timestamptz, timestamptz) from public, anon;
revoke all on function public.get_dashboard_overview(date, date, text)              from public, anon;
grant execute on function public._dashboard_overview_summary(timestamptz, timestamptz) to authenticated, service_role;
grant execute on function public.get_dashboard_overview(date, date, text)              to authenticated, service_role;
