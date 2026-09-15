-- =============================================================================
-- CEIBO AI - SCRIPT MAESTRO DE CONFIGURACIÓN Y DATOS
-- =============================================================================

-- Habilitar extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Limpieza total
DROP TABLE IF EXISTS public.n8n_chat_histories CASCADE;
DROP VIEW IF EXISTS public.chat_analytics_daily CASCADE;
DROP TABLE IF EXISTS public.chat_analytics CASCADE;
DROP TABLE IF EXISTS public.perfiles CASCADE;
DROP TABLE IF EXISTS public.empresas CASCADE;
DELETE FROM auth.users WHERE email = 'admin@ceibo.ai';

-- 2. Crear Tabla: empresas
CREATE TABLE public.empresas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    plan TEXT NOT NULL DEFAULT 'starter' CHECK (plan IN ('starter', 'growth', 'enterprise')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Crear Tabla: perfiles
CREATE TABLE public.perfiles (
    id UUID PRIMARY KEY,
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    email TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Crear Tabla: chat_analytics
CREATE TABLE public.chat_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    customer_phone TEXT,
    query_type TEXT,
    query_text TEXT,
    related_product_id TEXT,
    bot_response TEXT,
    is_escalated BOOLEAN NOT NULL DEFAULT false,
    resolution_status TEXT,
    customer_name TEXT,
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE
);

-- 5. Crear Vista: chat_analytics_daily
CREATE OR REPLACE VIEW public.chat_analytics_daily AS
SELECT
    empresa_id,
    DATE(created_at) as date,
    COUNT(*) FILTER (WHERE is_escalated = false) as resueltas_ia,
    COUNT(*) FILTER (WHERE is_escalated = true) as derivadas_humano,
    COUNT(*) as total_consultas,
    (COUNT(*) FILTER (WHERE is_escalated = false) * 0.2)::NUMERIC(10, 1) as horas_ahorradas
FROM public.chat_analytics
GROUP BY empresa_id, DATE(created_at);

-- 6. Crear Tabla: n8n_chat_histories
CREATE TABLE public.n8n_chat_histories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id TEXT NOT NULL,
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    message_text TEXT NOT NULL,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'bot', 'human_agent')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Funciones y RLS
CREATE OR REPLACE FUNCTION public.current_user_empresa_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT empresa_id FROM public.perfiles WHERE id = auth.uid();
$$;

ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.n8n_chat_histories ENABLE ROW LEVEL SECURITY;

CREATE POLICY empresas_tenant_isolation ON public.empresas FOR SELECT USING (id = public.current_user_empresa_id());
CREATE POLICY perfiles_tenant_isolation ON public.perfiles FOR ALL USING (empresa_id = public.current_user_empresa_id()) WITH CHECK (empresa_id = public.current_user_empresa_id());
CREATE POLICY chat_analytics_tenant_isolation ON public.chat_analytics FOR ALL USING (empresa_id = public.current_user_empresa_id()) WITH CHECK (empresa_id = public.current_user_empresa_id());
CREATE POLICY n8n_chat_histories_tenant_isolation ON public.n8n_chat_histories FOR ALL USING (empresa_id = public.current_user_empresa_id()) WITH CHECK (empresa_id = public.current_user_empresa_id());

-- =============================================================================
-- INYECTAR DATOS DEMO
-- =============================================================================

INSERT INTO public.empresas (id, name, slug, plan) VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Ceibo AI Tech Solutions', 'ceibo-tech', 'enterprise') ON CONFLICT DO NOTHING;

INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, confirmation_token, recovery_token, email_change_token_new, email_change)
VALUES ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', '00000000-0000-0000-0000-000000000000', 'admin@ceibo.ai', crypt('password123', gen_salt('bf')), now(), '{"provider": "email", "providers": ["email"]}', '{}', now(), now(), 'authenticated', '', '', '', '') ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES (gen_random_uuid(), 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', format('{"sub":"%s","email":"%s"}', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 'admin@ceibo.ai')::jsonb, 'email', now(), now(), now());

INSERT INTO public.perfiles (id, empresa_id, full_name, role, email) VALUES ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Admin Ceibo', 'admin', 'admin@ceibo.ai') ON CONFLICT (id) DO NOTHING;

DO $$
DECLARE
    v_empresa_id UUID := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    v_date DATE;
    v_chats_per_day INT;
BEGIN
    FOR i IN 0..29 LOOP
        v_date := current_date - i;
        v_chats_per_day := floor(random() * 50 + 50);
        FOR j IN 1..v_chats_per_day LOOP
            INSERT INTO public.chat_analytics (empresa_id, created_at, customer_phone, query_type, is_escalated)
            VALUES (v_empresa_id, v_date + (random() * interval '23 hours'), '+54911' || floor(random() * 90000000 + 10000000)::text, CASE floor(random() * 3) WHEN 0 THEN 'pricing' WHEN 1 THEN 'support' ELSE 'sales' END, random() > 0.8);
        END LOOP;
    END LOOP;
END $$;
