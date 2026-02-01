-- Corrige error "Database error saving new user" en signup
-- Ejecutar manualmente en Supabase SQL Editor (con rol owner del schema public)

-- El trigger de auth.users inserta en public.users sin user_type.
-- Como user_type es NOT NULL, el INSERT falla.
-- Solución: definir un DEFAULT para user_type.

alter table public.users
  alter column user_type set default 'propietario';

-- (Opcional) Si querés que el trigger establezca user_type explícitamente
-- podés actualizar la función handle_new_user para incluirlo en el INSERT.
