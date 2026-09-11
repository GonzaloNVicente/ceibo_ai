-- =============================================================================
-- CEIBO AI - Supabase Multi-Tenant Database Schema & DDL
-- =============================================================================
-- B2B SaaS WhatsApp Sales Assistant Dashboard for SMBs
-- Architected for strict tenant isolation via discriminator column 'empresa_id'
-- and PostgreSQL Row Level Security (RLS).
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Clean up existing tables if rebuilding
DROP TABLE IF EXISTS public.chat_analytics CASCADE;
DROP TABLE IF EXISTS public.perfiles CASCADE;
DROP TABLE IF EXISTS public.empresas CASCADE;

-- -----------------------------------------------------------------------------
-- 1. Table: empresas (Tenants)
-- -----------------------------------------------------------------------------
CREATE TABLE public.empresas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    plan TEXT NOT NULL DEFAULT 'starter' CHECK (plan IN ('starter', 'growth', 'enterprise')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE public.empresas IS 'Tenants / Companies utilizing Ceibo AI WhatsApp sales platform.';

-- -----------------------------------------------------------------------------
-- 2. Table: perfiles (User Profiles)
-- -----------------------------------------------------------------------------
CREATE TABLE public.perfiles (
    id UUID PRIMARY KEY,
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    email TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE public.perfiles IS 'User profiles mapped to auth users and scoped to an empresa tenant.';

-- -----------------------------------------------------------------------------
-- 3. Table: chat_analytics (WhatsApp Conversations & Performance Metrics)
-- -----------------------------------------------------------------------------
CREATE TABLE public.chat_analytics (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    resueltas_ia INT NOT NULL DEFAULT 0 CHECK (resueltas_ia >= 0),
    derivadas_humano INT NOT NULL DEFAULT 0 CHECK (derivadas_humano >= 0),
    total_consultas INT NOT NULL DEFAULT 0 CHECK (total_consultas >= 0),
    horas_ahorradas NUMERIC(10, 1) NOT NULL DEFAULT 0.0 CHECK (horas_ahorradas >= 0.0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_empresa_analytics_date UNIQUE (empresa_id, date)
);

COMMENT ON TABLE public.chat_analytics IS 'Daily aggregated WhatsApp interaction metrics per tenant.';

-- -----------------------------------------------------------------------------
-- 4. Indexes for Performance & Scoped Queries
-- -----------------------------------------------------------------------------
CREATE INDEX idx_empresas_slug ON public.empresas(slug);
CREATE INDEX idx_perfiles_empresa_id ON public.perfiles(empresa_id);
CREATE INDEX idx_perfiles_email ON public.perfiles(email);
CREATE INDEX idx_chat_analytics_empresa_date ON public.chat_analytics(empresa_id, date ASC);

-- -----------------------------------------------------------------------------
-- 5. Helper Function: current_user_empresa_id()
-- -----------------------------------------------------------------------------
-- Returns the tenant ID (empresa_id) of the currently authenticated Supabase user.
-- Marked STABLE SECURITY DEFINER to securely resolve the tenant within RLS policies.
CREATE OR REPLACE FUNCTION public.current_user_empresa_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT empresa_id
    FROM public.perfiles
    WHERE id = auth.uid();
$$;

COMMENT ON FUNCTION public.current_user_empresa_id IS 'Resolves active empresa_id for the authenticated session user.';

-- -----------------------------------------------------------------------------
-- 6. Row Level Security (RLS) Policies
-- -----------------------------------------------------------------------------
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_analytics ENABLE ROW LEVEL SECURITY;

-- Policy: empresas - users can only view their own company record
CREATE POLICY empresas_tenant_isolation ON public.empresas
    FOR SELECT
    USING (id = public.current_user_empresa_id());

-- Policy: perfiles - users can only view profiles belonging to their company
CREATE POLICY perfiles_tenant_isolation ON public.perfiles
    FOR ALL
    USING (empresa_id = public.current_user_empresa_id())
    WITH CHECK (empresa_id = public.current_user_empresa_id());

-- Policy: chat_analytics - users can only read and manage their company's analytics
CREATE POLICY chat_analytics_tenant_isolation ON public.chat_analytics
    FOR ALL
    USING (empresa_id = public.current_user_empresa_id())
    WITH CHECK (empresa_id = public.current_user_empresa_id());
