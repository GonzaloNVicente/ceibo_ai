-- =============================================================================
-- CEIBO AI - Supabase Seed Script
-- Run this in your Supabase SQL Editor to populate the dashboard with real data.
-- =============================================================================

-- 1. Create a dummy tenant (Empresa)
INSERT INTO public.empresas (id, name, slug, plan)
VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Ceibo AI Tech Solutions', 'ceibo-tech', 'enterprise')
ON CONFLICT (slug) DO NOTHING;

-- 2. Create an auth user (Bypassing email confirmation for demo)
-- NOTE: We use the pgcrypto extension to hash the password 'password123'
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, confirmation_token, recovery_token, email_change_token_new, email_change)
VALUES (
    'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22',
    '00000000-0000-0000-0000-000000000000',
    'admin@ceibo.ai',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider": "email", "providers": ["email"]}',
    '{}',
    now(),
    now(),
    'authenticated',
    '',
    '',
    '',
    ''
) ON CONFLICT (id) DO NOTHING;

-- 3. Link the user to the tenant via perfiles
INSERT INTO public.perfiles (id, empresa_id, full_name, role, email)
VALUES ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Admin Ceibo', 'admin', 'admin@ceibo.ai')
ON CONFLICT (id) DO NOTHING;

-- 4. Generate 30 days of dummy chat analytics
DO $$
DECLARE
    v_empresa_id UUID := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    v_date DATE;
    v_chats_per_day INT;
    i INT;
    j INT;
BEGIN
    FOR i IN 0..29 LOOP
        v_date := current_date - i;
        v_chats_per_day := floor(random() * 50 + 50); -- Between 50 and 100 chats per day
        
        FOR j IN 1..v_chats_per_day LOOP
            INSERT INTO public.chat_analytics (empresa_id, created_at, customer_phone, query_type, is_escalated)
            VALUES (
                v_empresa_id,
                v_date + (random() * interval '23 hours'),
                '+54911' || floor(random() * 90000000 + 10000000)::text,
                CASE floor(random() * 3) WHEN 0 THEN 'pricing' WHEN 1 THEN 'support' ELSE 'sales' END,
                random() > 0.8 -- 20% escalated to human
            );
        END LOOP;
    END LOOP;
END $$;
