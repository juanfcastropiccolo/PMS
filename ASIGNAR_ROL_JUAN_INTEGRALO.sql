-- ============================================================================
-- ASIGNAR ROL DE PROPIETARIO A juan@integralo.io
-- ============================================================================
-- ID del usuario: cbbc8f8c-51c9-4c68-9c08-34d3e243847c
-- ============================================================================

-- Asignar rol de propietario
INSERT INTO public.user_roles (user_id, role, permissions, asignado_at)
VALUES (
  'cbbc8f8c-51c9-4c68-9c08-34d3e243847c',  -- juan@integralo.io
  'propietario',
  '[]'::jsonb,
  NOW()
)
ON CONFLICT (user_id, role) DO NOTHING;

-- Verificar que se asignó correctamente
SELECT 
  ur.id, 
  ur.role, 
  au.email,
  ur.asignado_at
FROM public.user_roles ur
JOIN auth.users au ON au.id = ur.user_id
WHERE ur.user_id = 'cbbc8f8c-51c9-4c68-9c08-34d3e243847c';

-- Resultado esperado: 
-- Deberías ver una fila con email 'juan@integralo.io' y role 'propietario'

