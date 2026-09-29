-- =============================================================================
-- Ceibo AI - Multi-tenant, paso B (ESTRICTO)
--
-- NO APLICAR hasta que el workflow de n8n:
--   * pase el empresa_id como 4to parametro de chat_open_turn, y
--   * mande {"empresa_id": "<uuid>"} en el Metadata Filter del Supabase Vector Store.
-- Si se aplica antes, el bot deja de responder (falla a proposito en vez de mezclar tenants).
--
-- Objetivo: que un empresa_id faltante FALLE en voz alta, en lugar de caer en silencio en el
-- tenant de prueba "Ceibo AI Tech Solutions" (a0eebc99-...).
--
-- No se tocan los DEFAULT de documents / record_manager / tabular_document_rows: los usa la
-- ingesta (workflow "HOLY RAG - Ingesta" y la subida desde /documents). Se quitan cuando la
-- ingesta pase el empresa_id de forma explicita.
-- =============================================================================

-- 1) Sin tenant por defecto en las tablas que solo escriben las RPC ---------------
alter table public.chat_sessions       alter column empresa_id drop default;
alter table public.chat_analytics      alter column empresa_id drop default;
alter table public.n8n_chat_histories  alter column empresa_id drop default;

-- 2) chat_open_turn: empresa_id obligatorio (no se puede sacar un DEFAULT con CREATE OR REPLACE)
drop function if exists public.chat_open_turn(text, text, text, uuid);

create function public.chat_open_turn(
  p_phone text,
  p_name text,
  p_text text,
  p_empresa_id uuid
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
  if p_empresa_id is null then
    raise exception 'chat_open_turn: empresa_id es obligatorio';
  end if;
  if not exists (select 1 from public.empresas where id = p_empresa_id) then
    raise exception 'chat_open_turn: empresa % inexistente', p_empresa_id;
  end if;

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

revoke all on function public.chat_open_turn(text, text, text, uuid) from public, anon, authenticated;
grant execute on function public.chat_open_turn(text, text, text, uuid) to service_role;

-- 3) match_documents: empresa_id obligatorio en el filtro -------------------------
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
  if v_empresa is null then
    raise exception 'match_documents: el filtro debe incluir empresa_id';
  end if;

  return query
  select d.id, d.content, d.metadata, 1 - (d.embedding <=> query_embedding) as similarity
  from public.documents d
  where d.empresa_id = v_empresa
    and d.metadata @> v_meta
  order by d.embedding <=> query_embedding
  limit match_count;
end;
$$;
