-- Borrado de usuario juan@integralo.io
-- Ejecutar manualmente en Supabase SQL Editor (con rol owner / postgres)
-- UUID: cbbc8f8c-51c9-4c68-9c08-34d3e243847c

-- 1) Limpiar dependencias que bloquean el DELETE (FK NO ACTION / NOT NULL)
delete from public.user_roles
where user_id = 'cbbc8f8c-51c9-4c68-9c08-34d3e243847c';

-- Si querés conservar estacionamientos, seteá el propietario en NULL
update public.estacionamientos
set propietario_id = null
where propietario_id = 'cbbc8f8c-51c9-4c68-9c08-34d3e243847c';

delete from public.mp_accounts_propietarios
where user_id = 'cbbc8f8c-51c9-4c68-9c08-34d3e243847c';

-- 2) Borrar usuario en auth.users
delete from auth.users
where id = 'cbbc8f8c-51c9-4c68-9c08-34d3e243847c';
