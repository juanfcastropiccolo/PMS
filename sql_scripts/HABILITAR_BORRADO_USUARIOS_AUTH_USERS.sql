-- Habilita el borrado libre en auth.users
-- Ejecutar manualmente en Supabase SQL Editor

-- (Opcional) Verificar owner actual
-- select tableowner from pg_catalog.pg_tables where schemaname='auth' and tablename='users';

-- IMPORTANTE:
-- Este script debe ejecutarlo el owner real de auth.users (normalmente postgres o supabase_auth_admin).
-- Si no sos owner, Postgres va a devolver "must be owner of table users".
--
-- En Supabase SQL Editor, selecciona el rol "postgres" (o el owner real)
-- en el selector de rol antes de ejecutar este archivo.

-- 1) Desactivar RLS para permitir DELETE sin políticas
alter table auth.users disable row level security;

-- 2) Permitir DELETE a roles de API
grant delete on table auth.users to authenticated;
grant delete on table auth.users to anon;

-- (Opcional) Si usas otros roles, agrega aquí los GRANT necesarios.
