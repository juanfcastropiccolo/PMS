-- =====================================================
-- SCRIPT: Asignar rol de propietario a tu usuario
-- =====================================================
-- Ejecuta este script en Supabase SQL Editor para poder acceder al PMS

-- 1. Asignar rol de propietario a juanfcastropiccolo@gmail.com
INSERT INTO public.user_roles (user_id, role, permissions, asignado_at)
VALUES (
  '3c429b7f-4ff6-4251-8f69-a6b7b0182070',  -- Tu user_id
  'propietario',
  '[]'::jsonb,
  NOW()
)
ON CONFLICT DO NOTHING;

-- 2. Verificar que se creó correctamente
SELECT 
  ur.id, 
  ur.user_id, 
  ur.role, 
  au.email,
  ur.asignado_at
FROM public.user_roles ur
JOIN auth.users au ON au.id = ur.user_id
WHERE ur.user_id = '3c429b7f-4ff6-4251-8f69-a6b7b0182070';

-- =====================================================
-- NOTA: Una vez ejecutado, podrás hacer login en el PMS
-- =====================================================

-- Para crear más propietarios en el futuro, usa este template:
-- INSERT INTO public.user_roles (user_id, role, permissions, asignado_at)
-- VALUES (
--   'USER_ID_AQUI',
--   'propietario',
--   '[]'::jsonb,
--   NOW()
-- );

-- Para crear un super admin:
-- INSERT INTO public.user_roles (user_id, role, permissions, asignado_at)
-- VALUES (
--   'USER_ID_AQUI',
--   'super_admin',
--   '[]'::jsonb,
--   NOW()
-- );

