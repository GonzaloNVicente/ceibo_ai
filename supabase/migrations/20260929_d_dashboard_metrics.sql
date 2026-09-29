-- =============================================================================
-- Ceibo AI - Dashboard por periodo: get_dashboard_metrics()
--
-- Reemplaza el `.limit(30)` sobre chat_analytics_daily (que tomaba los ultimos 30 DIAS CON
-- ACTIVIDAD, no los ultimos 30 dias de calendario) por un rango explicito elegido por el cliente.
--
--  * Rango [p_from, p_to] en fechas LOCALES de la empresa (empresas.timezone), ambos inclusive.
--    Antes se agrupaba por date(created_at) en UTC: en Argentina (UTC-3) una consulta a las 22:00
--    caia en el dia siguiente.
--  * Granularidad: 'day' | 'week' (lunes a domingo) | 'month'. Los buckets sin actividad vienen
--    en cero para que el grafico no tenga huecos.
--  * Devuelve tambien el periodo inmediatamente anterior, de la misma duracion, para comparar.
--  * Pipeline (valor_estimado) = suma del ULTIMO monto estimado de cada cliente (sesion) con
--    pedido o presupuesto dentro del periodo. No suma dos veces al cliente que pide el mismo
--    presupuesto mas de una vez.
--  * SECURITY INVOKER: aplica el RLS del usuario que consulta (solo ve su empresa).
--
-- El resto de columnas/reglas replica la vista chat_analytics_daily:
--   resueltas_ia = is_escalated false, derivadas_humano = is_escalated true,
--   horas_ahorradas = resueltas_ia * 0.2, pedido / pedido_presupuesto / reclamo por query_type.
-- =============================================================================

-- Resumen de un intervalo [p_from, p_to) de timestamps (helper interno) -----------------------
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
      count(*) filter (where not is_escalated)              as ia,
      count(*) filter (where is_escalated)                  as humano,
      count(*) filter (where query_type = 'pedido')         as pedidos,
      count(*) filter (where query_type = 'pedido_presupuesto') as presupuestos,
      count(*) filter (where query_type = 'reclamo')        as reclamos
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
    'resueltas_ia',       c.ia,
    'derivadas_humano',   c.humano,
    'total_consultas',    c.ia + c.humano,
    'horas_ahorradas',    round(c.ia * 0.2, 1),
    'pedidos_count',      c.pedidos,
    'presupuestos_count', c.presupuestos,
    'reclamos_count',     c.reclamos,
    'valor_estimado',     coalesce((select sum(estimated_amount) from leads), 0),
    'leads_con_monto',    (select count(*) from leads)
  )
  from counts c;
$$;

-- API para el front ------------------------------------------------------------------------
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
      count(*) filter (where not is_escalated)                  as ia,
      count(*) filter (where is_escalated)                      as humano,
      count(*) filter (where query_type = 'pedido')             as pedidos,
      count(*) filter (where query_type = 'pedido_presupuesto') as presupuestos,
      count(*) filter (where query_type = 'reclamo')            as reclamos
    from b
    group by 1
  )
  select jsonb_agg(
    jsonb_build_object(
      'date',               s.bucket,
      'resueltas_ia',       coalesce(g.ia, 0),
      'derivadas_humano',   coalesce(g.humano, 0),
      'total_consultas',    coalesce(g.ia, 0) + coalesce(g.humano, 0),
      'horas_ahorradas',    round(coalesce(g.ia, 0) * 0.2, 1),
      'pedidos_count',      coalesce(g.pedidos, 0),
      'presupuestos_count', coalesce(g.presupuestos, 0),
      'reclamos_count',     coalesce(g.reclamos, 0)
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

revoke all on function public._dashboard_summary(timestamptz, timestamptz) from public, anon;
revoke all on function public.get_dashboard_metrics(date, date, text)      from public, anon;
grant execute on function public._dashboard_summary(timestamptz, timestamptz) to authenticated, service_role;
grant execute on function public.get_dashboard_metrics(date, date, text)      to authenticated, service_role;
