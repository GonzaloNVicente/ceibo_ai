-- =============================================================================
-- Ceibo AI - Multi-tenant, paso C (correcciones de seguridad; seguro de aplicar YA)
--
-- 1) chat_analytics_daily corria como su dueño (postgres) y se saltaba el RLS, con SELECT para
--    el rol anon: cualquiera con la clave publica podia leer las metricas de TODAS las empresas.
--    (La migracion 20260921 ya lo intentaba con security_invoker, pero la vista se recreo despues
--    al agregar valor_estimado y se perdio el ajuste.)
--    Con security_invoker el RLS de chat_analytics aplica al usuario que consulta.
-- 2) empresa_integrations guarda el secreto del webhook: se le quita SELECT al rol ceibo_readonly
--    (el que usan los nodos donde el LLM escribe SQL). Con RLS sin politicas ya no veria filas,
--    pero se cierra tambien por permisos (defensa en profundidad).
-- 3) Funciones SECURITY DEFINER que un usuario NO autenticado no deberia poder invocar.
--    (current_user_empresa_id / get_user_empresa_id se dejan: las usan las politicas RLS.)
-- =============================================================================

-- 1) Vista diaria
alter view public.chat_analytics_daily set (security_invoker = true);
revoke all on public.chat_analytics_daily from anon;
revoke insert, update, delete, truncate, references, trigger on public.chat_analytics_daily from authenticated;

-- 2) Secretos por empresa fuera del alcance del rol de solo lectura
revoke all on public.empresa_integrations from ceibo_readonly;

-- 3) Funciones que requieren sesion
revoke execute on function public.delete_knowledge_document(bigint) from anon, public;
revoke execute on function public.update_empresa_settings(text, text, text) from anon, public;
