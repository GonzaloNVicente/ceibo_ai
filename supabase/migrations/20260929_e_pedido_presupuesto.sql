-- =============================================================================
-- Ceibo AI - Pedido y presupuesto pasan a ser UNA sola categoria
--
-- Para el cliente la diferencia no aporta: ambos son una oportunidad de venta concreta.
-- Valor canonico en la base: query_type = 'pedido'. El normalizador acepta tambien
-- 'presupuesto' / 'pedido_presupuesto' (lo que pueda mandar el LLM de n8n) y los guarda como 'pedido',
-- asi que el workflow sigue funcionando aunque su prompt aun distinga las dos.
--
--   1) normalize_query_type: presupuesto -> pedido
--   2) query_type_rank: pedido sube a 5 (era 4; pedido_presupuesto era 5)
--   3) datos existentes: 'pedido_presupuesto' -> 'pedido' en chat_analytics y chat_sessions
--   4) get_dashboard_metrics / _dashboard_summary: un solo contador `pedidos_count`
--      (se elimina `presupuestos_count`)
--
-- NO se toca la vista chat_analytics_daily (recrearla hace perder security_invoker). Su columna
-- presupuestos_count queda en 0 desde ahora; solo la usa el modo demo.
-- Idempotente: se puede ejecutar mas de una vez.
-- =============================================================================

-- 1) Normalizador ----------------------------------------------------------------
create or replace function public.normalize_query_type(p text)
returns text language sql immutable set search_path = public as $$
  select case
    when p is null or btrim(p) = '' or upper(btrim(p)) = 'N/A' then null
    when lower(btrim(p)) in ('precio','consulta_precio','consulta precio') then 'consulta_precio'
    when lower(btrim(p)) in ('stock','consulta_stock','consulta stock') then 'consulta_stock'
    when lower(btrim(p)) in ('pedido','pedidos','presupuesto','presupuestos',
                             'pedido_presupuesto','pedido presupuesto','pedido / presupuesto') then 'pedido'
    when lower(btrim(p)) in ('reclamo','reclamos') then 'reclamo'
    when lower(btrim(p)) in ('consulta general','consulta_general','general') then 'consulta_general'
    else regexp_replace(lower(btrim(p)), '\s+', '_', 'g')
  end
$$;

-- 2) Prioridad de la categoria de la sesion (solo sube) -----------------------------
create or replace function public.query_type_rank(p text)
returns int language sql immutable set search_path = public as $$
  select case p
    when 'reclamo' then 6
    when 'pedido' then 5
    when 'pedido_presupuesto' then 5
    when 'consulta_stock' then 3
    when 'consulta_precio' then 2
    when 'consulta_general' then 1
    else 0
  end
$$;

-- 3) Datos existentes -----------------------------------------------------------------
update public.chat_analytics set query_type = 'pedido' where query_type = 'pedido_presupuesto';
update public.chat_sessions  set query_type = 'pedido' where query_type = 'pedido_presupuesto';

-- 4) Dashboard: un solo contador --------------------------------------------------------
create or replace function public._dashboard_summary(p_from timestamptz, p_to timestamptz)
returns jsonb
language sql
stable
set search_path = public
as $$
  with base as (
    select a.*
    from public.chat_analytics a
    where a.empresa_id = public.current_user_empresa_id()
      and a.created_at >= p_from
      and a.created_at <  p_to
  ),
  counts as (
    select
      count(*) filter (where not is_escalated)                                   as ia,
      count(*) filter (where is_escalated)                                       as humano,
      count(*) filter (where query_type in ('pedido', 'pedido_presupuesto'))     as pedidos,
      count(*) filter (where query_type = 'reclamo')                             as reclamos
    from base
  ),
  leads as (
    -- ultimo monto conocido de cada cliente (sesion) con pedido/presupuesto en el periodo
    select distinct on (coalesce(session_id, id)) estimated_amount
    from base
    where query_type in ('pedido', 'pedido_presupuesto')
      and estimated_amount is not null
    order by coalesce(session_id, id), created_at desc
  )
  select jsonb_build_object(
    'resueltas_ia',     c.ia,
    'derivadas_humano', c.humano,
    'total_consultas',  c.ia + c.humano,
    'horas_ahorradas',  round(c.ia * 0.2, 1),
    'pedidos_count',    c.pedidos,
    'reclamos_count',   c.reclamos,
    'valor_estimado',   coalesce((select sum(estimated_amount) from leads), 0),
    'leads_con_monto',  (select count(*) from leads)
  )
  from counts c;
$$;

create or replace function public.get_dashboard_metrics(
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
    select
      a.created_at at time zone v_tz as local_ts,
      a.is_escalated,
      a.query_type
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
    select
      date_trunc(v_gran, local_ts)::date as bucket,
      count(*) filter (where not is_escalated)                               as ia,
      count(*) filter (where is_escalated)                                   as humano,
      count(*) filter (where query_type in ('pedido', 'pedido_presupuesto')) as pedidos,
      count(*) filter (where query_type = 'reclamo')                         as reclamos
    from b
    group by 1
  )
  select jsonb_agg(
    jsonb_build_object(
      'date',             s.bucket,
      'resueltas_ia',     coalesce(g.ia, 0),
      'derivadas_humano', coalesce(g.humano, 0),
      'total_consultas',  coalesce(g.ia, 0) + coalesce(g.humano, 0),
      'horas_ahorradas',  round(coalesce(g.ia, 0) * 0.2, 1),
      'pedidos_count',    coalesce(g.pedidos, 0),
      'reclamos_count',   coalesce(g.reclamos, 0)
    )
    order by s.bucket
  )
  into v_buckets
  from series s
  left join agg g using (bucket);

  v_prev_to   := p_from - 1;
  v_prev_from := p_from - v_days;

  return jsonb_build_object(
    'timezone',    v_tz,
    'from',        p_from,
    'to',          p_to,
    'granularity', v_gran,
    'buckets',     coalesce(v_buckets, '[]'::jsonb),
    'summary',     public._dashboard_summary(
                     p_from::timestamp at time zone v_tz,
                     (p_to + 1)::timestamp at time zone v_tz),
    'previous',    jsonb_build_object(
                     'from', v_prev_from,
                     'to',   v_prev_to,
                     'summary', public._dashboard_summary(
                       v_prev_from::timestamp at time zone v_tz,
                       (v_prev_to + 1)::timestamp at time zone v_tz))
  );
end;
$$;

-- create or replace conserva los permisos existentes; se reafirman por si acaso
revoke all on function public._dashboard_summary(timestamptz, timestamptz) from public, anon;
revoke all on function public.get_dashboard_metrics(date, date, text)      from public, anon;
grant execute on function public._dashboard_summary(timestamptz, timestamptz) to authenticated, service_role;
grant execute on function public.get_dashboard_metrics(date, date, text)      to authenticated, service_role;
