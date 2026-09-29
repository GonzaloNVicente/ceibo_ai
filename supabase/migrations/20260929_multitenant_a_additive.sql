-- =============================================================================
-- Ceibo AI - Multi-tenant, paso A (ADITIVO: no rompe el workflow actual)
--
--   1) Sincroniza el repo con lo que ya existe en ceibo-test (estimated_amount y la
--      sobrecarga de 8 parametros de chat_close_turn, que faltaban en 20260921).
--   2) empresa_integrations: webhook + secreto del envio de mensajes humanos POR empresa.
--      Solo la lee el servidor (service_role). Ningun usuario del front puede leerla.
--   3) match_documents tenant-aware: si el filtro trae empresa_id, filtra por la COLUMNA
--      documents.empresa_id. Sin empresa_id se comporta como antes (modo tolerante).
--      El paso B lo vuelve obligatorio, una vez que n8n lo envia.
-- =============================================================================

-- 1) Drift: columnas y funcion ya aplicadas en ceibo-test ------------------------
alter table public.chat_analytics add column if not exists estimated_amount numeric;
alter table public.chat_sessions  add column if not exists estimated_amount numeric;

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

  -- Presupuesto, Pedido y Reclamo siempre requieren humano
  v_esc := coalesce(p_is_escalated, false)
        or coalesce(v_status = 'derivado', false)
        or coalesce(v_type in ('pedido_presupuesto', 'pedido', 'reclamo'), false);

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

-- 2) Integraciones por empresa (solo servidor) ------------------------------------
create table if not exists public.empresa_integrations (
  empresa_id uuid primary key references public.empresas(id) on delete cascade,
  human_msg_webhook_url text,
  human_msg_webhook_secret text,
  updated_at timestamptz not null default now()
);

-- RLS activado y SIN politicas: anon/authenticated no ven nada. Solo service_role (bypass RLS).
alter table public.empresa_integrations enable row level security;
revoke all on public.empresa_integrations from public, anon, authenticated;

comment on table public.empresa_integrations is
  'Config sensible por empresa (webhook n8n de mensajes humanos + secreto). Solo accesible con service_role desde el servidor de Next.js.';

-- 3) match_documents tenant-aware (modo tolerante) --------------------------------
-- n8n (Supabase Vector Store > Metadata Filter) debe mandar {"empresa_id": "<uuid>"}.
create or replace function public.match_documents(
  query_embedding vector,
  match_count integer default null,
  filter jsonb default '{}'::jsonb
)
returns table (id bigint, content text, metadata jsonb, similarity double precision)
language plpgsql
set search_path = public
as $$
#variable_conflict use_column
declare
  v_empresa uuid := nullif(filter->>'empresa_id', '')::uuid;
  v_meta jsonb := filter - 'empresa_id';
begin
  return query
  select d.id, d.content, d.metadata, 1 - (d.embedding <=> query_embedding) as similarity
  from public.documents d
  where d.metadata @> v_meta
    and (v_empresa is null or d.empresa_id = v_empresa)
  order by d.embedding <=> query_embedding
  limit match_count;
end;
$$;
