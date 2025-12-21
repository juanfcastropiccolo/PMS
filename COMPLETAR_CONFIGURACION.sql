-- ============================================================================
-- COMPLETAR CONFIGURACIÓN: VISTAS, RLS Y STORAGE
-- ============================================================================
-- Script para completar la configuración del PMS después de la migración
-- ============================================================================

-- ============================================================================
-- PASO 1: CREAR VISTAS PARA CONSULTAS OPTIMIZADAS
-- ============================================================================

-- Vista de estacionamientos con información del propietario
CREATE OR REPLACE VIEW v_estacionamientos_con_propietario AS
SELECT 
  e.*,
  u.email as propietario_email,
  u.raw_user_meta_data->>'nombre' as propietario_nombre,
  u.raw_user_meta_data->>'telefono' as propietario_telefono,
  (
    SELECT json_agg(
      json_build_object(
        'id', f.id,
        'url', f.url,
        'es_principal', f.es_principal,
        'orden', f.orden
      ) ORDER BY f.orden
    )
    FROM fotos_estacionamiento f
    WHERE f.estacionamiento_id = e.id
  ) as fotos,
  (
    SELECT COUNT(*)
    FROM reservas r
    WHERE r.estacionamiento_id = e.id 
      AND r.estado IN ('confirmada', 'completada')
  ) as reservas_activas,
  (
    SELECT COUNT(*)
    FROM reservas r
    WHERE r.estacionamiento_id = e.id 
      AND r.hora_inicio >= NOW()
      AND r.estado = 'confirmada'
  ) as reservas_proximas
FROM estacionamientos e
LEFT JOIN auth.users u ON e.propietario_id = u.id;

COMMENT ON VIEW v_estacionamientos_con_propietario IS 'Vista completa de estacionamientos con datos del propietario y fotos';

-- Vista de dashboard para propietarios
CREATE OR REPLACE VIEW v_dashboard_propietario AS
SELECT 
  COALESCE(e.propietario_id, e.user_id) as propietario_id,
  COUNT(DISTINCT e.id) as total_estacionamientos,
  COUNT(DISTINCT CASE WHEN e.activo = true THEN e.id END) as estacionamientos_activos,
  COUNT(DISTINCT CASE WHEN e.estado_verificacion = 'pendiente' THEN e.id END) as pendientes_aprobacion,
  COUNT(DISTINCT r.id) as total_reservas,
  COUNT(DISTINCT CASE WHEN r.estado IN ('confirmada', 'completada') THEN r.id END) as reservas_activas,
  COALESCE(SUM(CASE WHEN r.estado = 'completada' THEN r.monto_estacionamiento ELSE 0 END), 0) as ingresos_totales,
  COALESCE(SUM(CASE 
    WHEN r.estado = 'completada' AND r.created_at >= NOW() - INTERVAL '30 days' 
    THEN r.monto_estacionamiento ELSE 0 END), 0) as ingresos_ultimo_mes,
  COALESCE(AVG(e.calificacion_promedio), 0) as calificacion_promedio_general,
  COUNT(DISTINCT re.id) as total_resenas
FROM estacionamientos e
LEFT JOIN reservas r ON r.estacionamiento_id = e.id
LEFT JOIN resenas re ON re.estacionamiento_id = e.id AND re.estado_moderacion = 'activa'
WHERE e.es_marketplace = true
GROUP BY COALESCE(e.propietario_id, e.user_id);

COMMENT ON VIEW v_dashboard_propietario IS 'Estadísticas agregadas por propietario para dashboard del PMS';

-- Vista de dashboard para administradores
CREATE OR REPLACE VIEW v_dashboard_admin AS
SELECT 
  COUNT(DISTINCT e.id) as total_estacionamientos,
  COUNT(DISTINCT CASE WHEN e.activo = true THEN e.id END) as estacionamientos_activos,
  COUNT(DISTINCT CASE WHEN e.estado_verificacion = 'pendiente' THEN e.id END) as pendientes_aprobacion,
  COUNT(DISTINCT COALESCE(e.propietario_id, e.user_id)) as total_propietarios,
  COUNT(DISTINCT r.id) as total_reservas,
  COUNT(DISTINCT CASE WHEN r.created_at >= NOW() - INTERVAL '30 days' THEN r.id END) as reservas_ultimo_mes,
  COALESCE(SUM(r.monto_total), 0) as ingresos_totales_plataforma,
  COALESCE(SUM(CASE WHEN r.created_at >= NOW() - INTERVAL '30 days' THEN r.monto_total ELSE 0 END), 0) as ingresos_ultimo_mes,
  COALESCE(SUM(r.comision_parkit), 0) as comisiones_totales,
  COALESCE(AVG(re.calificacion), 0) as calificacion_promedio_plataforma,
  COUNT(DISTINCT re.id) as total_resenas
FROM estacionamientos e
LEFT JOIN reservas r ON r.estacionamiento_id = e.id
LEFT JOIN resenas re ON re.estacionamiento_id = e.id AND re.estado_moderacion = 'activa'
WHERE e.es_marketplace = true;

COMMENT ON VIEW v_dashboard_admin IS 'Estadísticas globales de la plataforma para administradores';

-- ============================================================================
-- PASO 2: HABILITAR RLS EN TABLAS NUEVAS
-- ============================================================================

ALTER TABLE fotos_estacionamiento ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- También habilitar RLS en estacionamientos (estaba deshabilitado)
ALTER TABLE estacionamientos ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PASO 3: POLÍTICAS RLS PARA ESTACIONAMIENTOS
-- ============================================================================

-- Limpiar policies existentes que puedan entrar en conflicto
DROP POLICY IF EXISTS "Propietarios pueden ver sus estacionamientos" ON estacionamientos;
DROP POLICY IF EXISTS "Propietarios pueden crear estacionamientos" ON estacionamientos;
DROP POLICY IF EXISTS "Propietarios pueden actualizar sus estacionamientos" ON estacionamientos;
DROP POLICY IF EXISTS "Admins pueden ver todos los estacionamientos" ON estacionamientos;
DROP POLICY IF EXISTS "Admins pueden actualizar estacionamientos" ON estacionamientos;
DROP POLICY IF EXISTS "Público puede ver estacionamientos activos" ON estacionamientos;

-- Propietarios pueden ver sus propios estacionamientos
CREATE POLICY "Propietarios pueden ver sus estacionamientos"
  ON estacionamientos FOR SELECT
  USING (
    auth.uid() = COALESCE(propietario_id, user_id)
  );

-- Propietarios pueden crear estacionamientos
CREATE POLICY "Propietarios pueden crear estacionamientos"
  ON estacionamientos FOR INSERT
  WITH CHECK (
    auth.uid() = COALESCE(propietario_id, user_id)
  );

-- Propietarios pueden actualizar sus estacionamientos
CREATE POLICY "Propietarios pueden actualizar sus estacionamientos"
  ON estacionamientos FOR UPDATE
  USING (
    auth.uid() = COALESCE(propietario_id, user_id)
  );

-- Admins pueden ver todos los estacionamientos
CREATE POLICY "Admins pueden ver todos los estacionamientos"
  ON estacionamientos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- Admins pueden actualizar cualquier estacionamiento
CREATE POLICY "Admins pueden actualizar estacionamientos"
  ON estacionamientos FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- Público puede ver estacionamientos activos y verificados del marketplace
CREATE POLICY "Público puede ver estacionamientos activos"
  ON estacionamientos FOR SELECT
  USING (
    activo = true AND 
    verificado = true AND 
    es_marketplace = true
  );

-- ============================================================================
-- PASO 4: POLÍTICAS RLS PARA FOTOS_ESTACIONAMIENTO
-- ============================================================================

-- Propietarios pueden gestionar fotos de sus estacionamientos
CREATE POLICY "Propietarios pueden gestionar fotos"
  ON fotos_estacionamiento FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM estacionamientos 
      WHERE id = estacionamiento_id 
        AND (propietario_id = auth.uid() OR user_id = auth.uid())
    )
  );

-- Público puede ver fotos de estacionamientos activos
CREATE POLICY "Público puede ver fotos"
  ON fotos_estacionamiento FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM estacionamientos 
      WHERE id = estacionamiento_id 
        AND activo = true 
        AND verificado = true
        AND es_marketplace = true
    )
  );

-- Admins pueden ver todas las fotos
CREATE POLICY "Admins pueden ver todas las fotos"
  ON fotos_estacionamiento FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- ============================================================================
-- PASO 5: POLÍTICAS RLS PARA RESERVAS
-- ============================================================================

-- Habilitar RLS en reservas si no está habilitado
ALTER TABLE reservas ENABLE ROW LEVEL SECURITY;

-- Limpiar policies existentes
DROP POLICY IF EXISTS "Usuarios pueden ver sus reservas" ON reservas;
DROP POLICY IF EXISTS "Propietarios pueden ver reservas" ON reservas;
DROP POLICY IF EXISTS "Propietarios pueden actualizar reservas" ON reservas;
DROP POLICY IF EXISTS "Admins pueden ver todas las reservas" ON reservas;

-- Usuarios pueden ver sus propias reservas
CREATE POLICY "Usuarios pueden ver sus reservas"
  ON reservas FOR SELECT
  USING (auth.uid() = user_id);

-- Propietarios pueden ver reservas de sus estacionamientos
CREATE POLICY "Propietarios pueden ver reservas"
  ON reservas FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM estacionamientos 
      WHERE id = estacionamiento_id 
        AND (propietario_id = auth.uid() OR user_id = auth.uid())
    )
  );

-- Propietarios pueden actualizar reservas de sus estacionamientos
CREATE POLICY "Propietarios pueden actualizar reservas"
  ON reservas FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM estacionamientos 
      WHERE id = estacionamiento_id 
        AND (propietario_id = auth.uid() OR user_id = auth.uid())
    )
  );

-- Admins pueden ver todas las reservas
CREATE POLICY "Admins pueden ver todas las reservas"
  ON reservas FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- ============================================================================
-- PASO 6: POLÍTICAS RLS PARA RESENAS
-- ============================================================================

-- Habilitar RLS
ALTER TABLE resenas ENABLE ROW LEVEL SECURITY;

-- Limpiar policies existentes
DROP POLICY IF EXISTS "Público puede ver reseñas activas" ON resenas;
DROP POLICY IF EXISTS "Usuarios pueden crear reseñas" ON resenas;
DROP POLICY IF EXISTS "Propietarios pueden responder reseñas" ON resenas;

-- Público puede ver reseñas activas
CREATE POLICY "Público puede ver reseñas activas"
  ON resenas FOR SELECT
  USING (estado_moderacion = 'activa' AND aprobado = true);

-- Usuarios pueden crear reseñas de sus reservas completadas
CREATE POLICY "Usuarios pueden crear reseñas"
  ON resenas FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM reservas 
      WHERE id = reserva_id 
        AND user_id = auth.uid() 
        AND estado = 'completada'
    )
  );

-- Propietarios pueden responder reseñas (solo actualizar respuesta_propietario)
CREATE POLICY "Propietarios pueden responder reseñas"
  ON resenas FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM estacionamientos 
      WHERE id = estacionamiento_id 
        AND (propietario_id = auth.uid() OR user_id = auth.uid())
    )
  );

-- ============================================================================
-- PASO 7: POLÍTICAS RLS PARA KYC_SUBMISSIONS
-- ============================================================================

-- Habilitar RLS
ALTER TABLE kyc_submissions ENABLE ROW LEVEL SECURITY;

-- Limpiar policies existentes
DROP POLICY IF EXISTS "Usuarios pueden ver su propio KYC" ON kyc_submissions;
DROP POLICY IF EXISTS "Usuarios pueden crear su KYC" ON kyc_submissions;
DROP POLICY IF EXISTS "Usuarios pueden actualizar su KYC pendiente" ON kyc_submissions;
DROP POLICY IF EXISTS "Admins pueden gestionar todos los KYC" ON kyc_submissions;

-- Usuarios pueden ver su propio KYC
CREATE POLICY "Usuarios pueden ver su KYC"
  ON kyc_submissions FOR SELECT
  USING (auth.uid() = user_id);

-- Usuarios pueden crear su KYC
CREATE POLICY "Usuarios pueden crear su KYC"
  ON kyc_submissions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Usuarios pueden actualizar su KYC si está pendiente o requiere info
CREATE POLICY "Usuarios pueden actualizar su KYC pendiente"
  ON kyc_submissions FOR UPDATE
  USING (
    auth.uid() = user_id AND 
    estado IN ('pendiente', 'en_revision')
  );

-- Admins pueden gestionar todos los KYC
CREATE POLICY "Admins pueden gestionar KYC"
  ON kyc_submissions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- ============================================================================
-- PASO 8: POLÍTICAS RLS PARA USER_ROLES
-- ============================================================================

-- Usuarios pueden ver sus propios roles
CREATE POLICY "Usuarios pueden ver sus roles"
  ON user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Super admins pueden gestionar roles
CREATE POLICY "Super admins pueden gestionar roles"
  ON user_roles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

-- ============================================================================
-- PASO 9: POLÍTICAS RLS PARA NOTIFICACIONES
-- ============================================================================

-- Usuarios pueden ver sus notificaciones
CREATE POLICY "Usuarios pueden ver sus notificaciones"
  ON notificaciones FOR SELECT
  USING (auth.uid() = usuario_id);

-- Usuarios pueden actualizar sus notificaciones (marcar como leída)
CREATE POLICY "Usuarios pueden actualizar sus notificaciones"
  ON notificaciones FOR UPDATE
  USING (auth.uid() = usuario_id);

-- Sistema puede crear notificaciones (sin restricción, se hará desde Edge Functions)
CREATE POLICY "Sistema puede crear notificaciones"
  ON notificaciones FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- PASO 10: POLÍTICAS RLS PARA AUDIT_LOG
-- ============================================================================

-- Solo admins pueden ver audit log
CREATE POLICY "Admins pueden ver audit log"
  ON audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- Sistema puede insertar en audit log
CREATE POLICY "Sistema puede insertar audit log"
  ON audit_log FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- PASO 11: POLÍTICAS RLS PARA MP_ACCOUNTS_PROPIETARIOS
-- ============================================================================

-- Habilitar RLS
ALTER TABLE mp_accounts_propietarios ENABLE ROW LEVEL SECURITY;

-- Limpiar policies existentes
DROP POLICY IF EXISTS "Propietarios pueden ver su cuenta MP" ON mp_accounts_propietarios;
DROP POLICY IF EXISTS "Admins pueden ver cuentas MP" ON mp_accounts_propietarios;

-- Propietarios pueden ver su cuenta MP
CREATE POLICY "Propietarios pueden ver su cuenta MP"
  ON mp_accounts_propietarios FOR SELECT
  USING (auth.uid() = user_id);

-- Propietarios pueden actualizar su cuenta MP
CREATE POLICY "Propietarios pueden actualizar su cuenta MP"
  ON mp_accounts_propietarios FOR UPDATE
  USING (auth.uid() = user_id);

-- Propietarios pueden crear su cuenta MP
CREATE POLICY "Propietarios pueden crear su cuenta MP"
  ON mp_accounts_propietarios FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins pueden ver todas las cuentas MP
CREATE POLICY "Admins pueden ver cuentas MP"
  ON mp_accounts_propietarios FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- ============================================================================
-- PASO 12: CREAR STORAGE BUCKETS Y POLÍTICAS
-- ============================================================================

-- Bucket para fotos de estacionamientos (público)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'parking-images', 
  'parking-images', 
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET 
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

-- Políticas de storage para fotos de estacionamientos
DROP POLICY IF EXISTS "Propietarios pueden subir fotos parking" ON storage.objects;
CREATE POLICY "Propietarios pueden subir fotos parking"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'parking-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Propietarios pueden actualizar fotos parking" ON storage.objects;
CREATE POLICY "Propietarios pueden actualizar fotos parking"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'parking-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Propietarios pueden eliminar fotos parking" ON storage.objects;
CREATE POLICY "Propietarios pueden eliminar fotos parking"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'parking-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Público puede ver fotos parking" ON storage.objects;
CREATE POLICY "Público puede ver fotos parking"
ON storage.objects FOR SELECT
USING (bucket_id = 'parking-images');

-- Bucket para documentos KYC (privado)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'kyc-documents', 
  'kyc-documents', 
  false,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE
SET 
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];

-- Políticas de storage para documentos KYC
DROP POLICY IF EXISTS "Usuarios pueden subir documentos KYC" ON storage.objects;
CREATE POLICY "Usuarios pueden subir documentos KYC"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'kyc-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Usuarios pueden ver sus documentos KYC" ON storage.objects;
CREATE POLICY "Usuarios pueden ver sus documentos KYC"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'kyc-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Admins pueden ver documentos KYC" ON storage.objects;
CREATE POLICY "Admins pueden ver documentos KYC"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'kyc-documents' AND
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
  )
);

-- ============================================================================
-- FIN DE LA CONFIGURACIÓN
-- ============================================================================

