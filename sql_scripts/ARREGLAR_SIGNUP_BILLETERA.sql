-- Corrige "Database error saving new user" en signup
-- Causa: trigger en auth.users llama crear_billetera_propietario()
-- y falla por no encontrar billetera_propietarios.
-- Ejecutar manualmente en Supabase SQL Editor (con rol owner).

create or replace function public.crear_billetera_propietario()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
BEGIN
  INSERT INTO public.billetera_propietarios (propietario_id)
  VALUES (NEW.id)
  ON CONFLICT (propietario_id) DO NOTHING;

  RETURN NEW;
END;
$$;
