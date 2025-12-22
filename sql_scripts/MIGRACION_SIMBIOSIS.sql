-- ============================================================================
-- MIGRACIÓN SIMBIÓTICA: PMS + APP MÓVIL
-- ============================================================================
-- Este script extiende las tablas existentes de Parkit app para hacerlas
-- compatibles con el PMS, manteniendo una única fuente de verdad.
-- ============================================================================

-- ============================================================================
-- PASO 1: CREAR NUEVOS ENUMS (que no existen)
-- ============================================================================

-- Estado de verificación extendido
CREATE TYPE estado_verificacion_pms AS ENUM (
  'pendiente',
  'aprobado',
  'rechazado',
  'suspendido'
);

-- Tipo de KYC
CREATE TYPE tipo_kyc AS ENUM (
  'persona_fisica',
  'persona_juridica'
);

-- Estado de KYC
CREATE TYPE estado_kyc AS ENUM (
  'pendiente',
  'en_revision',
  'aprobado',
  'rechazado',
  'requiere_info'
);

-- Roles de usuario PMS
CREATE TYPE user_role_type AS ENUM (
  'propietario',
  'admin',
  'super_admin'
);

-- Tipos de notificación
CREATE TYPE tipo_notificacion AS ENUM (
  'estacionamiento_aprobado',
  'estacionamiento_rechazado',
  'nueva_reserva',
  'reserva_cancelada',
  'pago_recibido',
  'nueva_resena',
  'recordatorio',
  'sistema'
);

-- Acciones de auditoría
CREATE TYPE accion_audit AS ENUM (
  'crear',
  'actualizar',
  'eliminar',
  'aprobar',
  'rechazar',
  'suspender',
  'activar'
);

-- Estado de reserva extendido (agregar solo si no existe)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estado_reserva_parking') THEN
        CREATE TYPE estado_reserva_parking AS ENUM (
          'pendiente',
          'confirmada',
          'en_curso',
          'completada',
          'cancelada',
          'no_show'
        );
    END IF;
END $$;

COMMENT ON TYPE estado_verificacion_pms IS 'Estados de verificación para estacionamientos del PMS';
COMMENT ON TYPE tipo_kyc IS 'Tipo de verificación KYC según persona física o jurídica';
COMMENT ON TYPE estado_kyc IS 'Estados del proceso de verificación KYC';
COMMENT ON TYPE user_role_type IS 'Roles de usuario en el sistema PMS';
COMMENT ON TYPE tipo_notificacion IS 'Tipos de notificaciones del sistema';
COMMENT ON TYPE accion_audit IS 'Acciones registradas en el audit log';

-- ============================================================================
-- PASO 2: EXTENDER TABLA ESTACIONAMIENTOS
-- ============================================================================

-- Agregar campos del PMS a la tabla existente
ALTER TABLE estacionamientos
  -- Capacidad y estructura
  ADD COLUMN IF NOT EXISTS cantidad_pisos INTEGER DEFAULT 1 CHECK (cantidad_pisos > 0),
  ADD COLUMN IF NOT EXISTS distribucion_pisos JSONB DEFAULT '{}'::jsonb,
  
  -- Precios extendidos
  ADD COLUMN IF NOT EXISTS precio_por_dia DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS precio_por_mes DECIMAL(10, 2),
  
  -- Características estructuradas (fusionar con detalles actual)
  ADD COLUMN IF NOT EXISTS caracteristicas JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS altura_maxima DECIMAL(4, 2),
  ADD COLUMN IF NOT EXISTS abierto_24h BOOLEAN DEFAULT false,
  
  -- Estados de verificación mejorados
  ADD COLUMN IF NOT EXISTS estado_verificacion estado_verificacion_pms DEFAULT 'pendiente',
  ADD COLUMN IF NOT EXISTS motivo_rechazo TEXT,
  ADD COLUMN IF NOT EXISTS verificado_por UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS verificado_at TIMESTAMP WITH TIME ZONE,
  
  -- Mercado Pago
  ADD COLUMN IF NOT EXISTS mp_account_vinculada BOOLEAN DEFAULT false,
  
  -- Estadísticas (algunos ya existen, solo agregamos los faltantes)
  ADD COLUMN IF NOT EXISTS total_reservas INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_resenas INTEGER DEFAULT 0,
  
  -- Disponibilidad en tiempo real
  ADD COLUMN IF NOT EXISTS espacios_disponibles INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ultima_actualizacion_disponibilidad TIMESTAMP WITH TIME ZONE,
  
  -- Metadata (probablemente ya existe como detalles, pero por si acaso)
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Agregar constraints
ALTER TABLE estacionamientos
  DROP CONSTRAINT IF EXISTS valid_capacidad,
  ADD CONSTRAINT valid_capacidad CHECK (
    espacios_disponibles >= 0 AND 
    espacios_disponibles <= COALESCE(capacidad, espacios_disponibles + 1)
  );

ALTER TABLE estacionamientos
  DROP CONSTRAINT IF EXISTS valid_precios,
  ADD CONSTRAINT valid_precios CHECK (
    (precio_por_dia IS NULL OR precio_por_dia >= precio_hora * 8) AND
    (precio_por_mes IS NULL OR precio_por_mes >= COALESCE(precio_por_dia, 0) * 20)
  );

-- Actualizar comentarios
COMMENT ON COLUMN estacionamientos.distribucion_pisos IS 'JSON con distribución de capacidad por piso: {"1": 50, "2": 50}';
COMMENT ON COLUMN estacionamientos.caracteristicas IS 'Array de características: ["cubierto", "seguridad_24h", "camaras"]';
COMMENT ON COLUMN estacionamientos.espacios_disponibles IS 'Espacios libres en tiempo real';
COMMENT ON COLUMN estacionamientos.estado_verificacion IS 'Estado de verificación para el PMS (pendiente, aprobado, rechazado, suspendido)';

-- Crear índices adicionales si no existen
CREATE INDEX IF NOT EXISTS idx_estacionamientos_estado_verificacion ON estacionamientos(estado_verificacion);
CREATE INDEX IF NOT EXISTS idx_estacionamientos_mp_vinculada ON estacionamientos(mp_account_vinculada) WHERE mp_account_vinculada = true;

-- ============================================================================
-- PASO 3: EXTENDER TABLA RESERVAS
-- ============================================================================

ALTER TABLE reservas
  -- Información del vehículo
  ADD COLUMN IF NOT EXISTS vehiculo_info JSONB,
  
  -- Código QR para check-in
  ADD COLUMN IF NOT EXISTS codigo_qr TEXT,
  
  -- Check-in / Check-out
  ADD COLUMN IF NOT EXISTS checkin_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS checkout_at TIMESTAMP WITH TIME ZONE,
  
  -- Pagos extendidos (algunos pueden existir)
  ADD COLUMN IF NOT EXISTS payment_authorized_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS payment_captured_at TIMESTAMP WITH TIME ZONE,
  
  -- Notas del propietario
  ADD COLUMN IF NOT EXISTS notas_propietario TEXT,
  
  -- Cancelación extendida
  ADD COLUMN IF NOT EXISTS cancelada_por UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS motivo_cancelacion TEXT,
  
  -- Calificación en la reserva (puede ya existir)
  ADD COLUMN IF NOT EXISTS calificacion INTEGER CHECK (calificacion >= 1 AND calificacion <= 5),
  ADD COLUMN IF NOT EXISTS comentario_calificacion TEXT,
  ADD COLUMN IF NOT EXISTS calificado_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN reservas.vehiculo_info IS 'JSON con info del vehículo: {"marca": "Toyota", "modelo": "Corolla", "patente": "ABC123"}';
COMMENT ON COLUMN reservas.codigo_qr IS 'Código QR para check-in en el estacionamiento';
COMMENT ON COLUMN reservas.comision_parkit IS 'Comisión de la plataforma (ej: 10% del monto total)';

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_reservas_checkin ON reservas(checkin_at) WHERE checkin_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reservas_checkout ON reservas(checkout_at) WHERE checkout_at IS NOT NULL;

-- ============================================================================
-- PASO 4: EXTENDER TABLA RESENAS
-- ============================================================================

ALTER TABLE resenas
  -- Aspectos específicos de calificación
  ADD COLUMN IF NOT EXISTS limpieza INTEGER CHECK (limpieza >= 1 AND limpieza <= 5),
  ADD COLUMN IF NOT EXISTS seguridad INTEGER CHECK (seguridad >= 1 AND seguridad <= 5),
  ADD COLUMN IF NOT EXISTS accesibilidad INTEGER CHECK (accesibilidad >= 1 AND accesibilidad <= 5),
  ADD COLUMN IF NOT EXISTS relacion_precio_calidad INTEGER CHECK (relacion_precio_calidad >= 1 AND relacion_precio_calidad <= 5),
  
  -- Verificación
  ADD COLUMN IF NOT EXISTS es_verificada BOOLEAN DEFAULT false,
  
  -- Respuesta del propietario
  ADD COLUMN IF NOT EXISTS respuesta_propietario TEXT,
  ADD COLUMN IF NOT EXISTS respondida_at TIMESTAMP WITH TIME ZONE,
  
  -- Moderación (reportado ya existe)
  ADD COLUMN IF NOT EXISTS estado_moderacion VARCHAR(50) DEFAULT 'activa',
  ADD COLUMN IF NOT EXISTS motivo_reporte TEXT,
  
  -- Utilidad
  ADD COLUMN IF NOT EXISTS votos_utiles INTEGER DEFAULT 0;

COMMENT ON COLUMN resenas.es_verificada IS 'Si la reserva fue completada (reseña verificada)';
COMMENT ON COLUMN resenas.estado_moderacion IS 'Estado: activa, oculta, eliminada';

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_resenas_estado_moderacion ON resenas(estado_moderacion);
CREATE INDEX IF NOT EXISTS idx_resenas_es_verificada ON resenas(es_verificada) WHERE es_verificada = true;

-- ============================================================================
-- PASO 5: EXTENDER TABLA KYC_SUBMISSIONS
-- ============================================================================

ALTER TABLE kyc_submissions
  -- Tipo de KYC
  ADD COLUMN IF NOT EXISTS tipo tipo_kyc DEFAULT 'persona_fisica',
  ADD COLUMN IF NOT EXISTS estacionamiento_id UUID REFERENCES estacionamientos(id) ON DELETE SET NULL,
  
  -- Datos persona jurídica
  ADD COLUMN IF NOT EXISTS razon_social VARCHAR(255),
  ADD COLUMN IF NOT EXISTS cuit VARCHAR(20),
  ADD COLUMN IF NOT EXISTS tipo_sociedad VARCHAR(100),
  
  -- Documentos persona jurídica
  ADD COLUMN IF NOT EXISTS constancia_afip_url TEXT,
  ADD COLUMN IF NOT EXISTS estatuto_social_url TEXT,
  ADD COLUMN IF NOT EXISTS poder_representante_url TEXT,
  
  -- Datos de contacto adicionales
  ADD COLUMN IF NOT EXISTS telefono VARCHAR(50),
  ADD COLUMN IF NOT EXISTS email VARCHAR(255),
  
  -- Dirección fiscal extendida
  ADD COLUMN IF NOT EXISTS ciudad_fiscal VARCHAR(100),
  ADD COLUMN IF NOT EXISTS provincia_fiscal VARCHAR(100),
  ADD COLUMN IF NOT EXISTS codigo_postal_fiscal VARCHAR(10),
  
  -- Comentarios de revisión
  ADD COLUMN IF NOT EXISTS comentarios_revision TEXT;

-- Renombrar columna 'direccion' a 'direccion_fiscal' si es necesario
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'kyc_submissions' 
               AND column_name = 'direccion'
               AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                              WHERE table_name = 'kyc_submissions' 
                              AND column_name = 'direccion_fiscal')) THEN
        ALTER TABLE kyc_submissions RENAME COLUMN direccion TO direccion_fiscal;
    END IF;
END $$;

COMMENT ON COLUMN kyc_submissions.tipo IS 'Tipo de persona: física o jurídica';

-- Crear índice
CREATE INDEX IF NOT EXISTS idx_kyc_estacionamiento ON kyc_submissions(estacionamiento_id);

-- ============================================================================
-- PASO 6: RENOMBRAR Y EXTENDER VENDEDORES → MP_ACCOUNTS_PROPIETARIOS
-- ============================================================================

-- Opción A: Renombrar la tabla existente
ALTER TABLE vendedores RENAME TO mp_accounts_propietarios;

-- Agregar campos faltantes
ALTER TABLE mp_accounts_propietarios
  ADD COLUMN IF NOT EXISTS mp_email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS linked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Renombrar columnas para consistencia
ALTER TABLE mp_accounts_propietarios 
  RENAME COLUMN mercadopago_user_id TO mp_user_id;
ALTER TABLE mp_accounts_propietarios 
  RENAME COLUMN mercadopago_access_token TO access_token;
ALTER TABLE mp_accounts_propietarios 
  RENAME COLUMN mercadopago_refresh_token TO refresh_token;
ALTER TABLE mp_accounts_propietarios 
  RENAME COLUMN mercadopago_token_expires_at TO token_expires_at;

-- Mantener 'activo' como alias de 'is_active' (son lo mismo)
-- Si quieres usar solo is_active, puedes eliminar 'activo'

COMMENT ON TABLE mp_accounts_propietarios IS 'Cuentas de Mercado Pago vinculadas de propietarios';
COMMENT ON COLUMN mp_accounts_propietarios.access_token IS 'Token de acceso OAuth de Mercado Pago';
COMMENT ON COLUMN mp_accounts_propietarios.refresh_token IS 'Token para renovar el access_token';

-- ============================================================================
-- PASO 7: CREAR TABLAS NUEVAS (NO EXISTEN)
-- ============================================================================

-- 7.1: FOTOS_ESTACIONAMIENTO
CREATE TABLE IF NOT EXISTS fotos_estacionamiento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estacionamiento_id UUID NOT NULL REFERENCES estacionamientos(id) ON DELETE CASCADE,
  
  -- Información de la foto
  url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  orden INTEGER DEFAULT 0,
  es_principal BOOLEAN DEFAULT false,
  
  -- Metadata
  tamano_bytes INTEGER,
  tipo_mime VARCHAR(50),
  ancho_px INTEGER,
  alto_px INTEGER,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT orden_positivo CHECK (orden >= 0)
);

COMMENT ON TABLE fotos_estacionamiento IS 'Fotos de los estacionamientos del marketplace';
COMMENT ON COLUMN fotos_estacionamiento.url IS 'URL pública de Supabase Storage';
COMMENT ON COLUMN fotos_estacionamiento.storage_path IS 'Ruta en el bucket';
COMMENT ON COLUMN fotos_estacionamiento.orden IS 'Orden de visualización (0 = primera)';
COMMENT ON COLUMN fotos_estacionamiento.es_principal IS 'Foto principal del estacionamiento';

-- Índices
CREATE INDEX idx_fotos_estacionamiento ON fotos_estacionamiento(estacionamiento_id);
CREATE INDEX idx_fotos_orden ON fotos_estacionamiento(estacionamiento_id, orden);
CREATE UNIQUE INDEX idx_fotos_unica_principal 
  ON fotos_estacionamiento(estacionamiento_id) 
  WHERE es_principal = true;

-- 7.2: USER_ROLES
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role_type NOT NULL,
  
  -- Permisos específicos (opcional)
  permissions JSONB DEFAULT '[]'::jsonb,
  
  -- Metadata
  asignado_por UUID REFERENCES auth.users(id),
  asignado_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Un usuario puede tener múltiples roles
  UNIQUE(user_id, role)
);

COMMENT ON TABLE user_roles IS 'Roles asignados a usuarios del sistema PMS';
COMMENT ON COLUMN user_roles.role IS 'Rol del usuario: propietario, admin, super_admin';
COMMENT ON COLUMN user_roles.permissions IS 'Permisos específicos adicionales (opcional)';

-- Índices
CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role);

-- 7.3: NOTIFICACIONES
CREATE TABLE IF NOT EXISTS notificaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Destinatario
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Tipo y contenido
  tipo tipo_notificacion NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  mensaje TEXT NOT NULL,
  
  -- Referencia (opcional)
  referencia_tipo VARCHAR(50),
  referencia_id UUID,
  
  -- Estado
  leida BOOLEAN DEFAULT false,
  leida_at TIMESTAMP WITH TIME ZONE,
  
  -- Acción (opcional)
  action_url TEXT,
  action_label VARCHAR(100),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE notificaciones IS 'Notificaciones del sistema para usuarios del PMS';
COMMENT ON COLUMN notificaciones.referencia_tipo IS 'Tipo de entidad referenciada: estacionamiento, reserva, resena';
COMMENT ON COLUMN notificaciones.referencia_id IS 'ID de la entidad referenciada';

-- Índices
CREATE INDEX idx_notificaciones_usuario ON notificaciones(usuario_id);
CREATE INDEX idx_notificaciones_leida ON notificaciones(usuario_id, leida);
CREATE INDEX idx_notificaciones_created ON notificaciones(created_at DESC);
CREATE INDEX idx_notificaciones_tipo ON notificaciones(tipo);

-- 7.4: AUDIT_LOG
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Usuario que realizó la acción
  usuario_id UUID REFERENCES auth.users(id),
  usuario_email VARCHAR(255),
  usuario_rol VARCHAR(50),
  
  -- Acción
  accion accion_audit NOT NULL,
  entidad_tipo VARCHAR(100) NOT NULL,
  entidad_id UUID NOT NULL,
  
  -- Detalles
  descripcion TEXT,
  cambios JSONB,
  
  -- Metadata
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE audit_log IS 'Registro de auditoría de todas las acciones importantes del PMS';
COMMENT ON COLUMN audit_log.cambios IS 'JSON con valores antes y después del cambio';

-- Índices
CREATE INDEX idx_audit_usuario ON audit_log(usuario_id);
CREATE INDEX idx_audit_entidad ON audit_log(entidad_tipo, entidad_id);
CREATE INDEX idx_audit_created ON audit_log(created_at DESC);
CREATE INDEX idx_audit_accion ON audit_log(accion);

-- ============================================================================
-- PASO 8: FUNCIONES DE NEGOCIO
-- ============================================================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a tablas que no lo tienen
DROP TRIGGER IF EXISTS update_estacionamientos_updated_at ON estacionamientos;
CREATE TRIGGER update_estacionamientos_updated_at
  BEFORE UPDATE ON estacionamientos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_reservas_updated_at ON reservas;
CREATE TRIGGER update_reservas_updated_at
  BEFORE UPDATE ON reservas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_resenas_updated_at ON resenas;
CREATE TRIGGER update_resenas_updated_at
  BEFORE UPDATE ON resenas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_kyc_updated_at ON kyc_submissions;
CREATE TRIGGER update_kyc_updated_at
  BEFORE UPDATE ON kyc_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_mp_accounts_updated_at ON mp_accounts_propietarios;
CREATE TRIGGER update_mp_accounts_updated_at
  BEFORE UPDATE ON mp_accounts_propietarios
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Función para actualizar estadísticas de estacionamiento
CREATE OR REPLACE FUNCTION actualizar_estadisticas_estacionamiento()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE estacionamientos
  SET 
    total_reservas = (
      SELECT COUNT(*) 
      FROM reservas 
      WHERE estacionamiento_id = COALESCE(NEW.estacionamiento_id, OLD.estacionamiento_id)
    ),
    calificacion_promedio = (
      SELECT AVG(calificacion) 
      FROM resenas 
      WHERE estacionamiento_id = COALESCE(NEW.estacionamiento_id, OLD.estacionamiento_id)
        AND estado_moderacion = 'activa'
    ),
    numero_resenas = (
      SELECT COUNT(*) 
      FROM resenas 
      WHERE estacionamiento_id = COALESCE(NEW.estacionamiento_id, OLD.estacionamiento_id)
        AND estado_moderacion = 'activa'
    ),
    total_resenas = (
      SELECT COUNT(*) 
      FROM resenas 
      WHERE estacionamiento_id = COALESCE(NEW.estacionamiento_id, OLD.estacionamiento_id)
        AND estado_moderacion = 'activa'
    )
  WHERE id = COALESCE(NEW.estacionamiento_id, OLD.estacionamiento_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar stats cuando se crea/actualiza una reserva
DROP TRIGGER IF EXISTS trigger_actualizar_stats_reserva ON reservas;
CREATE TRIGGER trigger_actualizar_stats_reserva
  AFTER INSERT OR UPDATE ON reservas
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_estadisticas_estacionamiento();

-- Trigger para actualizar stats cuando se crea/actualiza una reseña
DROP TRIGGER IF EXISTS trigger_actualizar_stats_resena ON resenas;
CREATE TRIGGER trigger_actualizar_stats_resena
  AFTER INSERT OR UPDATE ON resenas
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_estadisticas_estacionamiento();

-- Función para crear notificación de aprobación/rechazo
CREATE OR REPLACE FUNCTION crear_notificacion_aprobacion()
RETURNS TRIGGER AS $$
BEGIN
  -- Si el estado cambió a aprobado
  IF NEW.estado_verificacion::text = 'aprobado' AND 
     (OLD.estado_verificacion IS NULL OR OLD.estado_verificacion::text != 'aprobado') THEN
    
    INSERT INTO notificaciones (
      usuario_id,
      tipo,
      titulo,
      mensaje,
      referencia_tipo,
      referencia_id,
      action_url,
      action_label
    ) VALUES (
      COALESCE(NEW.propietario_id, NEW.user_id),
      'estacionamiento_aprobado',
      '¡Tu estacionamiento fue aprobado!',
      'Tu estacionamiento "' || NEW.nombre || '" ha sido verificado y ya está visible en la app.',
      'estacionamiento',
      NEW.id,
      '/dashboard/estacionamientos/' || NEW.id,
      'Ver estacionamiento'
    );
  END IF;
  
  -- Si el estado cambió a rechazado
  IF NEW.estado_verificacion::text = 'rechazado' AND 
     (OLD.estado_verificacion IS NULL OR OLD.estado_verificacion::text != 'rechazado') THEN
    
    INSERT INTO notificaciones (
      usuario_id,
      tipo,
      titulo,
      mensaje,
      referencia_tipo,
      referencia_id,
      action_url,
      action_label
    ) VALUES (
      COALESCE(NEW.propietario_id, NEW.user_id),
      'estacionamiento_rechazado',
      'Tu estacionamiento requiere revisión',
      'Tu estacionamiento "' || NEW.nombre || '" necesita correcciones. Motivo: ' || 
      COALESCE(NEW.motivo_rechazo, 'Ver detalles en el panel.'),
      'estacionamiento',
      NEW.id,
      '/dashboard/estacionamientos/' || NEW.id || '/editar',
      'Corregir información'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para notificación de aprobación/rechazo
DROP TRIGGER IF EXISTS trigger_notificacion_aprobacion ON estacionamientos;
CREATE TRIGGER trigger_notificacion_aprobacion
  AFTER UPDATE ON estacionamientos
  FOR EACH ROW
  WHEN (OLD.estado_verificacion IS DISTINCT FROM NEW.estado_verificacion)
  EXECUTE FUNCTION crear_notificacion_aprobacion();

-- ============================================================================
-- FIN DE LA MIGRACIÓN SIMBIÓTICA
-- ============================================================================

