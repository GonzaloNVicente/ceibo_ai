-- =============================================================================
-- CEIBO AI - Supabase Seed Data
-- =============================================================================
-- Realistic multi-tenant seed data for Ceibo AI Tech Solutions (Tenant A)
-- and Rival Retail Corp (Tenant B), with 30 days of WhatsApp chat analytics.
-- =============================================================================

-- 1. Insert Empresas (Tenants)
INSERT INTO public.empresas (id, name, slug, plan) VALUES
    ('11111111-1111-4111-a111-111111111111', 'Ceibo AI Tech Solutions', 'ceibo-tech', 'enterprise'),
    ('22222222-2222-4222-b222-222222222222', 'Rival Retail Corp', 'rival-retail', 'starter')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    plan = EXCLUDED.plan;

-- 2. Insert Perfiles (User Profiles mapped to Auth users)
INSERT INTO public.perfiles (id, empresa_id, full_name, role, email) VALUES
    ('11111111-0000-0000-0000-000000000001', '11111111-1111-4111-a111-111111111111', 'Sofía Rodríguez', 'admin', 'admin@ceibo.ai'),
    ('11111111-0000-0000-0000-000000000002', '11111111-1111-4111-a111-111111111111', 'Lucas Benítez', 'member', 'member@ceibo.ai'),
    ('22222222-0000-0000-0000-000000000003', '22222222-2222-4222-b222-222222222222', 'Carlos Gómez', 'admin', 'carlos@rival.com')
ON CONFLICT (id) DO UPDATE SET
    empresa_id = EXCLUDED.empresa_id,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    email = EXCLUDED.email;

-- 3. Insert Raw Individual Chat Analytics Rows (Simulating Production)
DO $$
DECLARE
    ceibo_id UUID := '11111111-1111-4111-a111-111111111111';
    rival_id UUID := '22222222-2222-4222-b222-222222222222';
BEGIN
    -- Tenant A (Ceibo AI Tech Solutions)
    INSERT INTO public.chat_analytics (
        empresa_id, created_at, customer_phone, query_type, query_text, related_product_id, bot_response, is_escalated, resolution_status, customer_name
    )
    SELECT 
        ceibo_id,
        (timezone('utc', now()) - (d.day || ' days')::interval) - (random() * 24 || ' hours')::interval,
        '54911' || floor(random() * 10000000)::text,
        CASE floor(random() * 3) WHEN 0 THEN 'consulta_stock' WHEN 1 THEN 'pedido_presupuesto' ELSE 'consulta_precio' END,
        'Dummy query ' || i,
        'PROD_' || floor(random() * 10),
        'Dummy response',
        (random() < 0.2),
        CASE WHEN random() < 0.2 THEN 'derivado' ELSE 'resuelto' END,
        'Customer ' || i
    FROM generate_series(0, 30) AS d(day)
    CROSS JOIN generate_series(1, 120 + floor(random() * 50)::int) AS i;

    -- Tenant B (Rival Retail Corp)
    INSERT INTO public.chat_analytics (
        empresa_id, created_at, customer_phone, query_type, query_text, related_product_id, bot_response, is_escalated, resolution_status, customer_name
    )
    SELECT 
        rival_id,
        (timezone('utc', now()) - (d.day || ' days')::interval) - (random() * 24 || ' hours')::interval,
        '54911' || floor(random() * 10000000)::text,
        CASE floor(random() * 3) WHEN 0 THEN 'consulta_stock' WHEN 1 THEN 'pedido_presupuesto' ELSE 'consulta_precio' END,
        'Dummy query ' || i,
        'PROD_' || floor(random() * 10),
        'Dummy response',
        (random() < 0.2),
        CASE WHEN random() < 0.2 THEN 'derivado' ELSE 'resuelto' END,
        'Customer ' || i
    FROM generate_series(0, 30) AS d(day)
    CROSS JOIN generate_series(1, 30 + floor(random() * 20)::int) AS i;
END $$;
