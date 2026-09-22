-- =============================================================================
-- Ceibo AI: sesiones de chat (1 fila por cliente) + log por consulta + historial
--   chat_sessions      -> lead / conversacion (Inbox y Chats)
--   chat_analytics     -> 1 fila por consulta (Dashboard, via chat_analytics_daily)
--   n8n_chat_histories -> mensajes (user | bot | human_agent), session_id = chat_sessions.id
--
-- Ya aplicada en el proyecto Supabase "ceibo-test". Este archivo es para versionarla
-- en el repo (supabase/migrations/) y para recrear el esquema en otros entornos.
-- Requiere: empresas, perfiles, chat_analytics, n8n_chat_histories, current_user_empresa_id().
-- =============================================================================

-- 1) Normalizadores de vocabulario (n8n escribe "Precio", el front espera "consulta_precio")
create or replace function public.normalize_query_type(p text)
returns text language sql immutable set search_path = public as $$
  select case
    when p is null or btrim(p) = '' or upper(btrim(p)) = 'N/A' then null
    when lower(btrim(p)) in ('precio','consulta_precio','consulta precio') then 'consulta_precio'
    when lower(btrim(p)) in ('stock','consulta_stock','consulta stock') then 'consulta_stock'
    when lower(btrim(p)) in ('presupuesto','pedido_presupuesto','pedido presupuesto') then 'pedido_presupuesto'
    when lower(btrim(p)) in ('reclamo','reclamos') then 'reclamo'
    when lower(btrim(p)) = 'pedido' then 'pedido'
    when lower(btrim(p)) in ('consulta general','consulta_general','general') then 'consulta_general'
    else regexp_replace(lower(btrim(p)), '\s+', '_', 'g')
  end
$$;

create or replace function public.query_type_rank(p text)
returns int language sql immutable set search_path = public as $$
  select case p
    when 'reclamo' then 6
    when 'pedido_presupuesto' then 5
    when 'pedido' then 4
    when 'consulta_stock' then 3
    when 'consulta_precio' then 2
    when 'consulta_general' then 1
    else 0
  end
$$;

create or replace function public.normalize_resolution_status(p text)
returns text language sql immutable set search_path = public as $$
  select case
    when p is null or btrim(p) = '' then null
    when lower(btrim(p)) like 'deriv%' or lower(btrim(p)) in ('escalado','pendiente') then 'derivado'
    else 'resuelto'
  end
$$;

-- 2) Tabla de sesiones (una por empresa + telefono)
create table public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null default 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid
    references public.empresas(id) on delete cascade,
  customer_phone text not null,
  customer_name text,
  query_type text,
  related_product_id text,
  is_escalated boolean not null default false,
  resolution_status text not null default 'resuelto' check (resolution_status in ('resuelto','derivado')),
  assigned_to uuid references public.perfiles(id) on delete set null,
  bot_paused boolean not null default false,
  lead_created_at timestamptz,
  last_message_text text,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create unique index chat_sessions_empresa_phone_uidx on public.chat_sessions (empresa_id, customer_phone);
create index chat_sessions_empresa_last_msg_idx on public.chat_sessions (empresa_id, last_message_at desc);

alter table public.chat_sessions enable row level security;
create policy chat_sessions_tenant_isolation on public.chat_sessions
  for all
  using (empresa_id = public.current_user_empresa_id())
  with check (empresa_id = public.current_user_empresa_id());

comment on table public.chat_sessions is
  'Una fila por (empresa, cliente de WhatsApp). Alimenta Inbox y Chats. query_type/is_escalated son "pegajosos": solo suben, salvo resolve_chat_session().';

-- 3) Vinculos
alter table public.chat_analytics
  add column session_id uuid references public.chat_sessions(id) on delete set null;
create index chat_analytics_session_idx on public.chat_analytics (session_id);

alter table public.n8n_chat_histories
  alter column session_id type uuid using session_id::uuid;
alter table public.n8n_chat_histories
  add constraint n8n_chat_histories_session_fk
  foreign key (session_id) references public.chat_sessions(id) on delete cascade;

-- 4) RPC para n8n (solo service_role / owner)
create or replace function public.chat_open_turn(
  p_phone text,
  p_name text,
  p_text text,
  p_empresa_id uuid default 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid
)
returns table (session_id uuid, is_new_session boolean, bot_paused boolean)
language plpgsql
set search_path = public
as $$
#variable_conflict use_column
declare
  v_id uuid;
  v_new boolean;
  v_paused boolean;
begin
  insert into public.chat_sessions as s
    (empresa_id, customer_phone, customer_name, last_message_text, last_message_at)
  values
    (p_empresa_id, p_phone, nullif(btrim(p_name), ''), left(p_text, 500), now())
  on conflict (empresa_id, customer_phone) do update
    set customer_name = coalesce(nullif(btrim(excluded.customer_name), ''), s.customer_name),
        last_message_text = excluded.last_message_text,
        last_message_at = excluded.last_message_at
  returning s.id, (s.xmax = 0), s.bot_paused into v_id, v_new, v_paused;

  insert into public.n8n_chat_histories (session_id, empresa_id, message_text, sender_type)
  values (v_id, p_empresa_id, coalesce(p_text, ''), 'user');

  return query select v_id, v_new, v_paused;
end;
$$;

create or replace function public.chat_close_turn(
  p_session_id uuid,
  p_bot_text text,
  p_query_text text,
  p_query_type text,
  p_resolution_status text,
  p_is_escalated boolean,
  p_related_product_id text
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

  -- Presupuesto y Reclamo siempre requieren humano
  v_esc := coalesce(p_is_escalated, false)
        or coalesce(v_status = 'derivado', false)
        or coalesce(v_type in ('pedido_presupuesto', 'reclamo'), false);

  insert into public.chat_analytics
    (empresa_id, session_id, customer_phone, customer_name, query_type, query_text,
     related_product_id, bot_response, is_escalated, resolution_status)
  values
    (s.empresa_id, s.id, s.customer_phone, s.customer_name, v_type, p_query_text,
     v_product, p_bot_text, v_esc, case when v_esc then 'derivado' else 'resuelto' end);

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
    lead_created_at = case when v_lead then now() else s.lead_created_at end,
    last_message_text = left(coalesce(p_bot_text, ''), 500),
    last_message_at = now()
  where id = s.id;

  return query select v_lead, v_esc, v_new_status, v_type;
end;
$$;

revoke all on function public.chat_open_turn(text, text, text, uuid) from public, anon, authenticated;
revoke all on function public.chat_close_turn(uuid, text, text, text, text, boolean, text) from public, anon, authenticated;
grant execute on function public.chat_open_turn(text, text, text, uuid) to service_role;
grant execute on function public.chat_close_turn(uuid, text, text, text, text, boolean, text) to service_role;

-- 5) RPC para el frontend (respetan RLS: security invoker)
create or replace function public.assign_chat_session(p_session_id uuid)
returns public.chat_sessions
language sql
set search_path = public
as $$
  update public.chat_sessions
     set assigned_to = auth.uid(), bot_paused = true
   where id = p_session_id
  returning *;
$$;

create or replace function public.resolve_chat_session(p_session_id uuid)
returns public.chat_sessions
language sql
set search_path = public
as $$
  update public.chat_sessions
     set resolution_status = 'resuelto', is_escalated = false, bot_paused = false, lead_created_at = null
   where id = p_session_id
  returning *;
$$;

create or replace function public.send_human_message(p_session_id uuid, p_text text)
returns public.n8n_chat_histories
language plpgsql
set search_path = public
as $$
declare
  s public.chat_sessions;
  m public.n8n_chat_histories;
begin
  if btrim(coalesce(p_text, '')) = '' then
    raise exception 'El mensaje no puede estar vacio';
  end if;

  update public.chat_sessions
     set bot_paused = true,
         assigned_to = coalesce(assigned_to, auth.uid()),
         last_message_text = left(p_text, 500),
         last_message_at = now()
   where id = p_session_id
  returning * into s;

  if not found then
    raise exception 'Sesion inexistente o sin acceso';
  end if;

  insert into public.n8n_chat_histories (session_id, empresa_id, message_text, sender_type)
  values (s.id, s.empresa_id, p_text, 'human_agent')
  returning * into m;

  return m;
end;
$$;

revoke all on function public.assign_chat_session(uuid) from public, anon;
revoke all on function public.resolve_chat_session(uuid) from public, anon;
revoke all on function public.send_human_message(uuid, text) from public, anon;
grant execute on function public.assign_chat_session(uuid) to authenticated;
grant execute on function public.resolve_chat_session(uuid) to authenticated;
grant execute on function public.send_human_message(uuid, text) to authenticated;

-- 6) La vista diaria pasa a respetar RLS del usuario que consulta (antes corria como owner)
alter view public.chat_analytics_daily set (security_invoker = true);

-- 7) Realtime para Inbox/Chats
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.chat_sessions, public.n8n_chat_histories;
  end if;
end $$;
