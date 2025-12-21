-- ============================================================================
-- SCRIPT: Eliminar usuario juan@integralo.io de forma segura
-- ============================================================================
-- Este script elimina el usuario y todos sus datos relacionados
-- ID del usuario: 55601e33-1ea4-4cf4-9300-c604fb11ba72
-- ============================================================================

-- PASO 1: Eliminar datos relacionados (por si acaso)
-- ============================================================================

-- 1.1: Eliminar roles de PMS
DELETE FROM public.user_roles 
WHERE user_id = '55601e33-1ea4-4cf4-9300-c604fb11ba72';

-- 1.2: Eliminar notificaciones
DELETE FROM public.notificaciones 
WHERE usuario_id = '55601e33-1ea4-4cf4-9300-c604fb11ba72';

-- 1.3: Eliminar audit logs
DELETE FROM public.audit_log 
WHERE usuario_id = '55601e33-1ea4-4cf4-9300-c604fb11ba72';

-- 1.4: Eliminar reseñas
DELETE FROM public.resenas 
WHERE user_id = '55601e33-1ea4-4cf4-9300-c604fb11ba72';

-- 1.5: Eliminar reservas
DELETE FROM public.reservas 
WHERE user_id = '55601e33-1ea4-4cf4-9300-c604fb11ba72';

-- 1.6: Eliminar KYC submissions
DELETE FROM public.kyc_submissions 
WHERE user_id = '55601e33-1ea4-4cf4-9300-c604fb11ba72';

-- 1.7: Eliminar cuentas de Mercado Pago
DELETE FROM public.mp_accounts_propietarios 
WHERE user_id = '55601e33-1ea4-4cf4-9300-c604fb11ba72';

-- 1.8: Eliminar estacionamientos (esto eliminará fotos en cascada)
DELETE FROM public.estacionamientos 
WHERE propietario_id = '55601e33-1ea4-4cf4-9300-c604fb11ba72';

-- 1.9: Eliminar datos fiscales (si existen)
DELETE FROM public.datos_fiscales 
WHERE user_id = '55601e33-1ea4-4cf4-9300-c604fb11ba72';

-- 1.10: Eliminar de otras tablas posibles
DELETE FROM public.user_routes 
WHERE user_id = '55601e33-1ea4-4cf4-9300-c604fb11ba72';

DELETE FROM public.navigation_points 
WHERE user_id = '55601e33-1ea4-4cf4-9300-c604fb11ba72';

DELETE FROM public.navigation_stats 
WHERE user_id = '55601e33-1ea4-4cf4-9300-c604fb11ba72';

DELETE FROM public.navigation_logs 
WHERE user_id = '55601e33-1ea4-4cf4-9300-c604fb11ba72';

DELETE FROM public.nps_ratings 
WHERE user_id = '55601e33-1ea4-4cf4-9300-c604fb11ba72';

DELETE FROM public.promo_clicks 
WHERE user_id = '55601e33-1ea4-4cf4-9300-c604fb11ba72';

DELETE FROM public.spotter_photos 
WHERE user_id = '55601e33-1ea4-4cf4-9300-c604fb11ba72';

DELETE FROM public.photo_validation_logs 
WHERE user_id = '55601e33-1ea4-4cf4-9300-c604fb11ba72';

DELETE FROM public.alerts 
WHERE created_by = '55601e33-1ea4-4cf4-9300-c604fb11ba72';

DELETE FROM public.alert_votes 
WHERE user_id = '55601e33-1ea4-4cf4-9300-c604fb11ba72';

-- PASO 2: Eliminar de tablas de autenticación
-- ============================================================================

-- 2.1: Eliminar identidades OAuth
DELETE FROM auth.identities 
WHERE user_id = '55601e33-1ea4-4cf4-9300-c604fb11ba72';

-- 2.2: Eliminar sesiones
DELETE FROM auth.sessions 
WHERE user_id = '55601e33-1ea4-4cf4-9300-c604fb11ba72';

-- 2.3: Eliminar refresh tokens
DELETE FROM auth.refresh_tokens 
WHERE user_id = '55601e33-1ea4-4cf4-9300-c604fb11ba72';

-- 2.4: Eliminar MFA factors (si existen)
DELETE FROM auth.mfa_factors 
WHERE user_id = '55601e33-1ea4-4cf4-9300-c604fb11ba72';

-- 2.5: Eliminar one-time tokens (si existen)
DELETE FROM auth.one_time_tokens 
WHERE user_id = '55601e33-1ea4-4cf4-9300-c604fb11ba72';

-- PASO 3: Finalmente, eliminar el usuario
-- ============================================================================

DELETE FROM auth.users 
WHERE id = '55601e33-1ea4-4cf4-9300-c604fb11ba72';

-- PASO 4: Verificar que se eliminó
-- ============================================================================

SELECT COUNT(*) as usuarios_con_ese_email
FROM auth.users 
WHERE email = 'juan@integralo.io';

-- Resultado esperado: 0

-- ============================================================================
-- FIN DEL SCRIPT
-- ============================================================================

-- NOTA: Si el script falla en algún paso, revisa el mensaje de error.
-- Puede ser que necesites ejecutar por partes o verificar políticas RLS.

