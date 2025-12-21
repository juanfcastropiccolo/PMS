# 10. SCRIPTS SQL COMPLETOS PARA COPIAR Y PEGAR

> **IMPORTANTE:** Estos scripts deben ser ejecutados en el SQL Editor de Supabase en el orden indicado.
> Antes de ejecutar cualquier script, SIEMPRE verifica el schema actual usando el MCP de Supabase.

---

## ORDEN DE EJECUCIÓN

1. ✅ Funciones auxiliares
2. ✅ Enums y tipos
3. ✅ Tablas principales
4. ✅ Tablas relacionadas
5. ✅ Índices
6. ✅ Triggers
7. ✅ Vistas
8. ✅ RLS Policies
9. ✅ Storage Buckets

---

## SCRIPT 1: FUNCIONES AUXILIARES

```sql
-- ============================================================================
-- SCRIPT 1: FUNCIONES AUXILIARES
-- Descripción: Funciones que serán usadas por triggers y otras operaciones
-- ============================================================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_updated_at_column() IS 'Actualiza automáticamente el campo updated_at en cada UPDATE';
```

---

## SCRIPT 2: ENUMS Y TIPOS

```sql
-- ============================================================================
-- SCRIPT 2: ENUMS Y TIPOS
-- Descripción: Definición de tipos enumerados para el sistema
-- ============================================================================

-- Tipo de estacionamiento
CREATE TYPE tipo_estacionamiento AS ENUM (
  'cochera_privada',
  'playa_comercial',
  'garage_edificio'
);

-- Estado de verificación
CREATE TYPE estado_verificacion AS ENUM (
  'pendiente',
  'aprobado',
  'rechazado',
  'suspendido'
);

-- Estado de reserva
CREATE TYPE estado_reserva_parking AS ENUM (
  'pendiente',
  'confirmada',
  'en_curso',
  'completada',
  'cancelada',
  'no_show'
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

-- Roles de usuario
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

COMMENT ON TYPE tipo_estacionamiento IS 'Tipos de estacionamiento disponibles en la plataforma';
COMMENT ON TYPE estado_verificacion IS 'Estados posibles de verificación de un estacionamiento';
COMMENT ON TYPE estado_reserva_parking IS 'Estados del ciclo de vida de una reserva';
COMMENT ON TYPE tipo_kyc IS 'Tipo de verificación KYC según persona física o jurídica';
COMMENT ON TYPE estado_kyc IS 'Estados del proceso de verificación KYC';
COMMENT ON TYPE user_role_type IS 'Roles de usuario en el sistema PMS';
COMMENT ON TYPE tipo_notificacion IS 'Tipos de notificaciones del sistema';
COMMENT ON TYPE accion_audit IS 'Acciones registradas en el audit log';
```

---

## SCRIPT 3: TABLA ESTACIONAMIENTOS

```sql
-- ============================================================================
-- SCRIPT 3: TABLA ESTACIONAMIENTOS
-- Descripción: Tabla principal de estacionamientos del marketplace
-- ============================================================================

CREATE TABLE estacionamientos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  propietario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Información básica
  nombre VARCHAR(255) NOT NULL,
  tipo tipo_estacionamiento NOT NULL,
  descripcion TEXT,
  
  -- Ubicación
  direccion_completa TEXT NOT NULL,
  calle VARCHAR(255),
  numero VARCHAR(20),
  barrio VARCHAR(100),
  ciudad VARCHAR(100) DEFAULT 'Buenos Aires',
  provincia VARCHAR(100) DEFAULT 'Buenos Aires',
  codigo_postal VARCHAR(10),
  latitud DECIMAL(10, 8) NOT NULL,
  longitud DECIMAL(11, 8) NOT NULL,
  
  -- Capacidad y estructura
  capacidad_total INTEGER NOT NULL CHECK (capacidad_total > 0),
  cantidad_pisos INTEGER DEFAULT 1 CHECK (cantidad_pisos > 0),
  distribucion_pisos JSONB DEFAULT '{}'::jsonb,
  
  -- Horarios
  horarios JSONB NOT NULL DEFAULT '{}'::jsonb,
  abierto_24h BOOLEAN DEFAULT false,
  
  -- Precios
  precio_por_hora DECIMAL(10, 2) NOT NULL CHECK (precio_por_hora >= 0),
  precio_por_dia DECIMAL(10, 2),
  precio_por_mes DECIMAL(10, 2),
  moneda VARCHAR(3) DEFAULT 'ARS',
  
  -- Características
  caracteristicas JSONB DEFAULT '[]'::jsonb,
  altura_maxima DECIMAL(4, 2),
  
  -- Estados
  activo BOOLEAN DEFAULT false,
  verificado BOOLEAN DEFAULT false,
  estado_verificacion estado_verificacion DEFAULT 'pendiente',
  motivo_rechazo TEXT,
  
  -- Verificación y aprobación
  verificado_por UUID REFERENCES auth.users(id),
  verificado_at TIMESTAMP WITH TIME ZONE,
  
  -- Mercado Pago
  mp_account_vinculada BOOLEAN DEFAULT false,
  
  -- Estadísticas
  total_reservas INTEGER DEFAULT 0,
  calificacion_promedio DECIMAL(3, 2) CHECK (calificacion_promedio >= 0 AND calificacion_promedio <= 5),
  total_resenas INTEGER DEFAULT 0,
  
  -- Disponibilidad actual
  espacios_disponibles INTEGER DEFAULT 0,
  ultima_actualizacion_disponibilidad TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_capacidad CHECK (espacios_disponibles >= 0 AND espacios_disponibles <= capacidad_total),
  CONSTRAINT valid_precios CHECK (
    (precio_por_dia IS NULL OR precio_por_dia >= precio_por_hora * 8) AND
    (precio_por_mes IS NULL OR precio_por_mes >= precio_por_dia * 20)
  )
);

-- Comentarios
COMMENT ON TABLE estacionamientos IS 'Estacionamientos privados/comerciales del marketplace';
COMMENT ON COLUMN estacionamientos.propietario_id IS 'Usuario dueño del estacionamiento';
COMMENT ON COLUMN estacionamientos.distribucion_pisos IS 'JSON con distribución de capacidad por piso: {"1": 50, "2": 50}';
COMMENT ON COLUMN estacionamientos.horarios IS 'JSON con horarios por día: {"lunes": {"abre": "08:00", "cierra": "20:00"}}';
COMMENT ON COLUMN estacionamientos.caracteristicas IS 'Array de características: ["cubierto", "seguridad_24h", "camaras"]';
COMMENT ON COLUMN estacionamientos.espacios_disponibles IS 'Espacios libres en tiempo real';

-- Índices
CREATE INDEX idx_estacionamientos_propietario ON estacionamientos(propietario_id);
CREATE INDEX idx_estacionamientos_estado ON estacionamientos(estado_verificacion);
CREATE INDEX idx_estacionamientos_activo ON estacionamientos(activo) WHERE activo = true;
CREATE INDEX idx_estacionamientos_ubicacion ON estacionamientos(ciudad, barrio);
CREATE INDEX idx_estacionamientos_precio ON estacionamientos(precio_por_hora);

-- Índice geoespacial (si PostGIS está habilitado)
-- CREATE INDEX idx_estacionamientos_geo ON estacionamientos USING GIST (
--   ll_to_earth(latitud, longitud)
-- );

-- Trigger para updated_at
CREATE TRIGGER update_estacionamientos_updated_at
  BEFORE UPDATE ON estacionamientos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

## SCRIPT 4: TABLA FOTOS_ESTACIONAMIENTO

```sql
-- ============================================================================
-- SCRIPT 4: TABLA FOTOS_ESTACIONAMIENTO
-- Descripción: Fotos de los estacionamientos
-- ============================================================================

CREATE TABLE fotos_estacionamiento (
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

COMMENT ON TABLE fotos_estacionamiento IS 'Fotos de los estacionamientos';
COMMENT ON COLUMN fotos_estacionamiento.url IS 'URL pública de Supabase Storage';
COMMENT ON COLUMN fotos_estacionamiento.storage_path IS 'Ruta en el bucket';
COMMENT ON COLUMN fotos_estacionamiento.orden IS 'Orden de visualización (0 = primera)';
COMMENT ON COLUMN fotos_estacionamiento.es_principal IS 'Foto principal del estacionamiento';

-- Índices
CREATE INDEX idx_fotos_estacionamiento ON fotos_estacionamiento(estacionamiento_id);
CREATE INDEX idx_fotos_orden ON fotos_estacionamiento(estacionamiento_id, orden);
CREATE INDEX idx_fotos_principal ON fotos_estacionamiento(estacionamiento_id, es_principal) WHERE es_principal = true;

-- Constraint: Solo una foto principal por estacionamiento
CREATE UNIQUE INDEX idx_fotos_unica_principal 
  ON fotos_estacionamiento(estacionamiento_id) 
  WHERE es_principal = true;
```

---

## SCRIPT 5: TABLA RESERVAS_ESTACIONAMIENTO

```sql
-- ============================================================================
-- SCRIPT 5: TABLA RESERVAS_ESTACIONAMIENTO
-- Descripción: Reservas de espacios en estacionamientos
-- ============================================================================

CREATE TABLE reservas_estacionamiento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relaciones
  estacionamiento_id UUID NOT NULL REFERENCES estacionamientos(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Información de la reserva
  fecha_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
  fecha_fin TIMESTAMP WITH TIME ZONE NOT NULL,
  duracion_horas DECIMAL(5, 2) GENERATED ALWAYS AS (
    EXTRACT(EPOCH FROM (fecha_fin - fecha_inicio)) / 3600
  ) STORED,
  
  -- Vehículo (opcional)
  vehiculo_info JSONB,
  
  -- Código de reserva
  codigo_reserva VARCHAR(20) UNIQUE NOT NULL,
  codigo_qr TEXT,
  
  -- Precios
  precio_por_hora DECIMAL(10, 2) NOT NULL,
  monto_total DECIMAL(10, 2) NOT NULL CHECK (monto_total >= 0),
  moneda VARCHAR(3) DEFAULT 'ARS',
  
  -- Comisiones
  comision_parkit DECIMAL(10, 2) DEFAULT 0,
  monto_propietario DECIMAL(10, 2) GENERATED ALWAYS AS (
    monto_total - comision_parkit
  ) STORED,
  
  -- Estado
  estado estado_reserva_parking DEFAULT 'pendiente',
  
  -- Check-in / Check-out
  checkin_at TIMESTAMP WITH TIME ZONE,
  checkout_at TIMESTAMP WITH TIME ZONE,
  
  -- Pago
  payment_id TEXT,
  payment_status VARCHAR(50),
  payment_method VARCHAR(50),
  payment_authorized_at TIMESTAMP WITH TIME ZONE,
  payment_captured_at TIMESTAMP WITH TIME ZONE,
  
  -- Notas
  notas_usuario TEXT,
  notas_propietario TEXT,
  
  -- Cancelación
  cancelada_por UUID REFERENCES auth.users(id),
  cancelada_at TIMESTAMP WITH TIME ZONE,
  motivo_cancelacion TEXT,
  
  -- Calificación
  calificacion INTEGER CHECK (calificacion >= 1 AND calificacion <= 5),
  comentario_calificacion TEXT,
  calificado_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT fechas_validas CHECK (fecha_fin > fecha_inicio),
  CONSTRAINT duracion_minima CHECK (
    EXTRACT(EPOCH FROM (fecha_fin - fecha_inicio)) >= 1800
  )
);

COMMENT ON TABLE reservas_estacionamiento IS 'Reservas de espacios en estacionamientos';
COMMENT ON COLUMN reservas_estacionamiento.vehiculo_info IS 'JSON con info del vehículo: {"marca": "Toyota", "modelo": "Corolla", "patente": "ABC123"}';
COMMENT ON COLUMN reservas_estacionamiento.codigo_reserva IS 'Código único de reserva (ej: PRK-2024-A1B2C3)';
COMMENT ON COLUMN reservas_estacionamiento.comision_parkit IS 'Comisión de la plataforma (ej: 10% del monto total)';

-- Índices
CREATE INDEX idx_reservas_estacionamiento ON reservas_estacionamiento(estacionamiento_id);
CREATE INDEX idx_reservas_usuario ON reservas_estacionamiento(usuario_id);
CREATE INDEX idx_reservas_fechas ON reservas_estacionamiento(fecha_inicio, fecha_fin);
CREATE INDEX idx_reservas_estado ON reservas_estacionamiento(estado);
CREATE INDEX idx_reservas_codigo ON reservas_estacionamiento(codigo_reserva);
CREATE INDEX idx_reservas_payment ON reservas_estacionamiento(payment_id) WHERE payment_id IS NOT NULL;

-- Trigger updated_at
CREATE TRIGGER update_reservas_estacionamiento_updated_at
  BEFORE UPDATE ON reservas_estacionamiento
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

## SCRIPT 6: TABLA KYC_SUBMISSIONS

```sql
-- ============================================================================
-- SCRIPT 6: TABLA KYC_SUBMISSIONS
-- Descripción: Verificación KYC de propietarios
-- ============================================================================

CREATE TABLE kyc_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  estacionamiento_id UUID REFERENCES estacionamientos(id) ON DELETE SET NULL,
  
  -- Tipo de KYC
  tipo tipo_kyc NOT NULL,
  
  -- Datos persona física
  nombre_completo VARCHAR(255),
  dni VARCHAR(20),
  fecha_nacimiento DATE,
  nacionalidad VARCHAR(100),
  
  -- Documentos persona física
  foto_dni_frente_url TEXT,
  foto_dni_dorso_url TEXT,
  foto_selfie_url TEXT,
  
  -- Datos persona jurídica
  razon_social VARCHAR(255),
  cuit VARCHAR(20),
  tipo_sociedad VARCHAR(100),
  
  -- Documentos persona jurídica
  constancia_afip_url TEXT,
  estatuto_social_url TEXT,
  poder_representante_url TEXT,
  
  -- Datos de contacto
  telefono VARCHAR(50),
  email VARCHAR(255),
  
  -- Dirección fiscal
  direccion_fiscal TEXT,
  ciudad_fiscal VARCHAR(100),
  provincia_fiscal VARCHAR(100),
  codigo_postal_fiscal VARCHAR(10),
  
  -- Estado
  estado estado_kyc DEFAULT 'pendiente',
  
  -- Revisión
  revisado_por UUID REFERENCES auth.users(id),
  revisado_at TIMESTAMP WITH TIME ZONE,
  motivo_rechazo TEXT,
  comentarios_revision TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE kyc_submissions IS 'Verificación KYC de propietarios de estacionamientos';
COMMENT ON COLUMN kyc_submissions.tipo IS 'Tipo de persona: física o jurídica';
COMMENT ON COLUMN kyc_submissions.estado IS 'Estado del proceso de verificación';

-- Índices
CREATE INDEX idx_kyc_usuario ON kyc_submissions(usuario_id);
CREATE INDEX idx_kyc_estado ON kyc_submissions(estado);
CREATE INDEX idx_kyc_estacionamiento ON kyc_submissions(estacionamiento_id);

-- Trigger
CREATE TRIGGER update_kyc_submissions_updated_at
  BEFORE UPDATE ON kyc_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

## SCRIPT 7: TABLA USER_ROLES

```sql
-- ============================================================================
-- SCRIPT 7: TABLA USER_ROLES
-- Descripción: Roles de usuarios en el sistema
-- ============================================================================

CREATE TABLE user_roles (
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

COMMENT ON TABLE user_roles IS 'Roles asignados a usuarios del sistema';
COMMENT ON COLUMN user_roles.role IS 'Rol del usuario: propietario, admin, super_admin';
COMMENT ON COLUMN user_roles.permissions IS 'Permisos específicos adicionales (opcional)';

-- Índices
CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role);
```

---

## SCRIPT 8: TABLA RESENAS_ESTACIONAMIENTO

```sql
-- ============================================================================
-- SCRIPT 8: TABLA RESENAS_ESTACIONAMIENTO
-- Descripción: Reseñas y calificaciones de estacionamientos
-- ============================================================================

CREATE TABLE resenas_estacionamiento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relaciones
  estacionamiento_id UUID NOT NULL REFERENCES estacionamientos(id) ON DELETE CASCADE,
  reserva_id UUID NOT NULL REFERENCES reservas_estacionamiento(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Calificación
  calificacion INTEGER NOT NULL CHECK (calificacion >= 1 AND calificacion <= 5),
  
  -- Comentario
  comentario TEXT,
  
  -- Aspectos específicos (opcional)
  limpieza INTEGER CHECK (limpieza >= 1 AND limpieza <= 5),
  seguridad INTEGER CHECK (seguridad >= 1 AND seguridad <= 5),
  accesibilidad INTEGER CHECK (accesibilidad >= 1 AND accesibilidad <= 5),
  relacion_precio_calidad INTEGER CHECK (relacion_precio_calidad >= 1 AND relacion_precio_calidad <= 5),
  
  -- Verificación
  es_verificada BOOLEAN DEFAULT false,
  
  -- Respuesta del propietario
  respuesta_propietario TEXT,
  respondida_at TIMESTAMP WITH TIME ZONE,
  
  -- Moderación
  reportada BOOLEAN DEFAULT false,
  motivo_reporte TEXT,
  estado_moderacion VARCHAR(50) DEFAULT 'activa',
  
  -- Utilidad
  votos_utiles INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Una reseña por reserva
  UNIQUE(reserva_id)
);

COMMENT ON TABLE resenas_estacionamiento IS 'Reseñas y calificaciones de usuarios sobre estacionamientos';
COMMENT ON COLUMN resenas_estacionamiento.es_verificada IS 'Si la reserva fue completada (reseña verificada)';
COMMENT ON COLUMN resenas_estacionamiento.estado_moderacion IS 'Estado: activa, oculta, eliminada';

-- Índices
CREATE INDEX idx_resenas_estacionamiento ON resenas_estacionamiento(estacionamiento_id);
CREATE INDEX idx_resenas_usuario ON resenas_estacionamiento(usuario_id);
CREATE INDEX idx_resenas_calificacion ON resenas_estacionamiento(calificacion);
CREATE INDEX idx_resenas_estado ON resenas_estacionamiento(estado_moderacion);

-- Trigger
CREATE TRIGGER update_resenas_estacionamiento_updated_at
  BEFORE UPDATE ON resenas_estacionamiento
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

## SCRIPT 9: TABLA NOTIFICACIONES

```sql
-- ============================================================================
-- SCRIPT 9: TABLA NOTIFICACIONES
-- Descripción: Sistema de notificaciones
-- ============================================================================

CREATE TABLE notificaciones (
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

COMMENT ON TABLE notificaciones IS 'Notificaciones del sistema para usuarios';
COMMENT ON COLUMN notificaciones.referencia_tipo IS 'Tipo de entidad referenciada: estacionamiento, reserva, resena';
COMMENT ON COLUMN notificaciones.referencia_id IS 'ID de la entidad referenciada';

-- Índices
CREATE INDEX idx_notificaciones_usuario ON notificaciones(usuario_id);
CREATE INDEX idx_notificaciones_leida ON notificaciones(usuario_id, leida);
CREATE INDEX idx_notificaciones_created ON notificaciones(created_at DESC);
CREATE INDEX idx_notificaciones_tipo ON notificaciones(tipo);
```

---

## SCRIPT 10: TABLA AUDIT_LOG

```sql
-- ============================================================================
-- SCRIPT 10: TABLA AUDIT_LOG
-- Descripción: Registro de auditoría de acciones
-- ============================================================================

CREATE TABLE audit_log (
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

COMMENT ON TABLE audit_log IS 'Registro de auditoría de todas las acciones importantes';
COMMENT ON COLUMN audit_log.cambios IS 'JSON con valores antes y después del cambio';

-- Índices
CREATE INDEX idx_audit_usuario ON audit_log(usuario_id);
CREATE INDEX idx_audit_entidad ON audit_log(entidad_tipo, entidad_id);
CREATE INDEX idx_audit_created ON audit_log(created_at DESC);
CREATE INDEX idx_audit_accion ON audit_log(accion);
```

---

## SCRIPT 11: TABLA MP_ACCOUNTS_PROPIETARIOS

```sql
-- ============================================================================
-- SCRIPT 11: TABLA MP_ACCOUNTS_PROPIETARIOS
-- Descripción: Cuentas de Mercado Pago vinculadas
-- ============================================================================

CREATE TABLE mp_accounts_propietarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  propietario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  
  -- Información de MP
  mp_user_id VARCHAR(255) NOT NULL,
  mp_email VARCHAR(255),
  
  -- Tokens OAuth
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Estado
  is_active BOOLEAN DEFAULT true,
  linked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE mp_accounts_propietarios IS 'Cuentas de Mercado Pago vinculadas de propietarios';
COMMENT ON COLUMN mp_accounts_propietarios.access_token IS 'Token de acceso OAuth de Mercado Pago';
COMMENT ON COLUMN mp_accounts_propietarios.refresh_token IS 'Token para renovar el access_token';

-- Índices
CREATE INDEX idx_mp_accounts_propietario ON mp_accounts_propietarios(propietario_id);
CREATE INDEX idx_mp_accounts_mp_user ON mp_accounts_propietarios(mp_user_id);

-- Trigger
CREATE TRIGGER update_mp_accounts_propietarios_updated_at
  BEFORE UPDATE ON mp_accounts_propietarios
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

## SCRIPT 12: FUNCIONES DE NEGOCIO

```sql
-- ============================================================================
-- SCRIPT 12: FUNCIONES DE NEGOCIO
-- Descripción: Funciones para lógica de negocio
-- ============================================================================

-- Función para actualizar estadísticas de estacionamiento
CREATE OR REPLACE FUNCTION actualizar_estadisticas_estacionamiento()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE estacionamientos
  SET 
    total_reservas = (
      SELECT COUNT(*) 
      FROM reservas_estacionamiento 
      WHERE estacionamiento_id = COALESCE(NEW.estacionamiento_id, OLD.estacionamiento_id)
    ),
    calificacion_promedio = (
      SELECT AVG(calificacion) 
      FROM resenas_estacionamiento 
      WHERE estacionamiento_id = COALESCE(NEW.estacionamiento_id, OLD.estacionamiento_id)
        AND estado_moderacion = 'activa'
    ),
    total_resenas = (
      SELECT COUNT(*) 
      FROM resenas_estacionamiento 
      WHERE estacionamiento_id = COALESCE(NEW.estacionamiento_id, OLD.estacionamiento_id)
        AND estado_moderacion = 'activa'
    )
  WHERE id = COALESCE(NEW.estacionamiento_id, OLD.estacionamiento_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Función para generar código de reserva único
CREATE OR REPLACE FUNCTION generar_codigo_reserva()
RETURNS TRIGGER AS $$
DECLARE
  codigo TEXT;
  existe BOOLEAN;
BEGIN
  IF NEW.codigo_reserva IS NOT NULL THEN
    RETURN NEW;
  END IF;
  
  LOOP
    codigo := 'PRK-' || TO_CHAR(NOW(), 'YYYY') || '-' || 
              UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
    
    SELECT EXISTS(
      SELECT 1 FROM reservas_estacionamiento WHERE codigo_reserva = codigo
    ) INTO existe;
    
    EXIT WHEN NOT existe;
  END LOOP;
  
  NEW.codigo_reserva := codigo;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función para crear notificación de aprobación/rechazo
CREATE OR REPLACE FUNCTION crear_notificacion_aprobacion()
RETURNS TRIGGER AS $$
BEGIN
  -- Si el estado cambió a aprobado
  IF NEW.estado_verificacion = 'aprobado' AND 
     OLD.estado_verificacion != 'aprobado' THEN
    
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
      NEW.propietario_id,
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
  IF NEW.estado_verificacion = 'rechazado' AND 
     OLD.estado_verificacion != 'rechazado' THEN
    
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
      NEW.propietario_id,
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

COMMENT ON FUNCTION actualizar_estadisticas_estacionamiento() IS 'Actualiza stats de estacionamiento cuando cambian reservas o reseñas';
COMMENT ON FUNCTION generar_codigo_reserva() IS 'Genera código único para reservas (PRK-YYYY-XXXXXX)';
COMMENT ON FUNCTION crear_notificacion_aprobacion() IS 'Crea notificación cuando se aprueba o rechaza un estacionamiento';
```

---

## SCRIPT 13: TRIGGERS

```sql
-- ============================================================================
-- SCRIPT 13: TRIGGERS
-- Descripción: Triggers para automatizar acciones
-- ============================================================================

-- Trigger para actualizar stats cuando se crea/actualiza una reserva
CREATE TRIGGER trigger_actualizar_stats_reserva
  AFTER INSERT OR UPDATE ON reservas_estacionamiento
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_estadisticas_estacionamiento();

-- Trigger para actualizar stats cuando se crea/actualiza una reseña
CREATE TRIGGER trigger_actualizar_stats_resena
  AFTER INSERT OR UPDATE ON resenas_estacionamiento
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_estadisticas_estacionamiento();

-- Trigger para generar código de reserva
CREATE TRIGGER trigger_generar_codigo_reserva
  BEFORE INSERT ON reservas_estacionamiento
  FOR EACH ROW
  WHEN (NEW.codigo_reserva IS NULL)
  EXECUTE FUNCTION generar_codigo_reserva();

-- Trigger para notificación de aprobación/rechazo
CREATE TRIGGER trigger_notificacion_aprobacion
  AFTER UPDATE ON estacionamientos
  FOR EACH ROW
  WHEN (OLD.estado_verificacion IS DISTINCT FROM NEW.estado_verificacion)
  EXECUTE FUNCTION crear_notificacion_aprobacion();
```

---

## SCRIPT 14: VISTAS

```sql
-- ============================================================================
-- SCRIPT 14: VISTAS
-- Descripción: Vistas para consultas complejas
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
    FROM reservas_estacionamiento r
    WHERE r.estacionamiento_id = e.id 
      AND r.estado IN ('confirmada', 'en_curso')
  ) as reservas_activas,
  (
    SELECT COUNT(*)
    FROM reservas_estacionamiento r
    WHERE r.estacionamiento_id = e.id 
      AND r.fecha_inicio >= NOW()
      AND r.estado = 'confirmada'
  ) as reservas_proximas
FROM estacionamientos e
JOIN auth.users u ON e.propietario_id = u.id;

COMMENT ON VIEW v_estacionamientos_con_propietario IS 'Vista completa de estacionamientos con datos del propietario y fotos';

-- Vista de dashboard para propietarios
CREATE OR REPLACE VIEW v_dashboard_propietario AS
SELECT 
  e.propietario_id,
  COUNT(DISTINCT e.id) as total_estacionamientos,
  COUNT(DISTINCT CASE WHEN e.activo = true THEN e.id END) as estacionamientos_activos,
  COUNT(DISTINCT CASE WHEN e.estado_verificacion = 'pendiente' THEN e.id END) as pendientes_aprobacion,
  COUNT(DISTINCT r.id) as total_reservas,
  COUNT(DISTINCT CASE WHEN r.estado IN ('confirmada', 'en_curso') THEN r.id END) as reservas_activas,
  COALESCE(SUM(CASE WHEN r.estado = 'completada' THEN r.monto_propietario ELSE 0 END), 0) as ingresos_totales,
  COALESCE(SUM(CASE 
    WHEN r.estado = 'completada' AND r.created_at >= NOW() - INTERVAL '30 days' 
    THEN r.monto_propietario ELSE 0 END), 0) as ingresos_ultimo_mes,
  COALESCE(AVG(e.calificacion_promedio), 0) as calificacion_promedio_general,
  COUNT(DISTINCT re.id) as total_resenas
FROM estacionamientos e
LEFT JOIN reservas_estacionamiento r ON r.estacionamiento_id = e.id
LEFT JOIN resenas_estacionamiento re ON re.estacionamiento_id = e.id AND re.estado_moderacion = 'activa'
GROUP BY e.propietario_id;

COMMENT ON VIEW v_dashboard_propietario IS 'Estadísticas agregadas por propietario para dashboard';

-- Vista de dashboard para administradores
CREATE OR REPLACE VIEW v_dashboard_admin AS
SELECT 
  COUNT(DISTINCT e.id) as total_estacionamientos,
  COUNT(DISTINCT CASE WHEN e.activo = true THEN e.id END) as estacionamientos_activos,
  COUNT(DISTINCT CASE WHEN e.estado_verificacion = 'pendiente' THEN e.id END) as pendientes_aprobacion,
  COUNT(DISTINCT e.propietario_id) as total_propietarios,
  COUNT(DISTINCT r.id) as total_reservas,
  COUNT(DISTINCT CASE WHEN r.created_at >= NOW() - INTERVAL '30 days' THEN r.id END) as reservas_ultimo_mes,
  COALESCE(SUM(r.monto_total), 0) as ingresos_totales_plataforma,
  COALESCE(SUM(CASE WHEN r.created_at >= NOW() - INTERVAL '30 days' THEN r.monto_total ELSE 0 END), 0) as ingresos_ultimo_mes,
  COALESCE(SUM(r.comision_parkit), 0) as comisiones_totales,
  COALESCE(AVG(re.calificacion), 0) as calificacion_promedio_plataforma,
  COUNT(DISTINCT re.id) as total_resenas
FROM estacionamientos e
LEFT JOIN reservas_estacionamiento r ON r.estacionamiento_id = e.id
LEFT JOIN resenas_estacionamiento re ON re.estacionamiento_id = e.id AND re.estado_moderacion = 'activa';

COMMENT ON VIEW v_dashboard_admin IS 'Estadísticas globales de la plataforma para administradores';
```

---

## SCRIPT 15: RLS POLICIES

```sql
-- ============================================================================
-- SCRIPT 15: ROW LEVEL SECURITY POLICIES
-- Descripción: Políticas de seguridad a nivel de fila
-- ============================================================================

-- ============================================================================
-- ESTACIONAMIENTOS
-- ============================================================================

ALTER TABLE estacionamientos ENABLE ROW LEVEL SECURITY;

-- Propietarios pueden ver sus propios estacionamientos
CREATE POLICY "Propietarios pueden ver sus estacionamientos"
  ON estacionamientos FOR SELECT
  USING (auth.uid() = propietario_id);

-- Propietarios pueden crear estacionamientos
CREATE POLICY "Propietarios pueden crear estacionamientos"
  ON estacionamientos FOR INSERT
  WITH CHECK (auth.uid() = propietario_id);

-- Propietarios pueden actualizar sus estacionamientos
CREATE POLICY "Propietarios pueden actualizar sus estacionamientos"
  ON estacionamientos FOR UPDATE
  USING (auth.uid() = propietario_id);

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

-- Público puede ver estacionamientos activos y verificados
CREATE POLICY "Público puede ver estacionamientos activos"
  ON estacionamientos FOR SELECT
  USING (activo = true AND verificado = true);

-- ============================================================================
-- FOTOS_ESTACIONAMIENTO
-- ============================================================================

ALTER TABLE fotos_estacionamiento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Propietarios pueden gestionar fotos de sus estacionamientos"
  ON fotos_estacionamiento FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM estacionamientos 
      WHERE id = estacionamiento_id AND propietario_id = auth.uid()
    )
  );

CREATE POLICY "Público puede ver fotos de estacionamientos activos"
  ON fotos_estacionamiento FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM estacionamientos 
      WHERE id = estacionamiento_id AND activo = true AND verificado = true
    )
  );

-- ============================================================================
-- RESERVAS_ESTACIONAMIENTO
-- ============================================================================

ALTER TABLE reservas_estacionamiento ENABLE ROW LEVEL SECURITY;

-- Usuarios pueden ver sus propias reservas
CREATE POLICY "Usuarios pueden ver sus reservas"
  ON reservas_estacionamiento FOR SELECT
  USING (auth.uid() = usuario_id);

-- Propietarios pueden ver reservas de sus estacionamientos
CREATE POLICY "Propietarios pueden ver reservas de sus estacionamientos"
  ON reservas_estacionamiento FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM estacionamientos 
      WHERE id = estacionamiento_id AND propietario_id = auth.uid()
    )
  );

-- Propietarios pueden actualizar reservas de sus estacionamientos
CREATE POLICY "Propietarios pueden actualizar reservas"
  ON reservas_estacionamiento FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM estacionamientos 
      WHERE id = estacionamiento_id AND propietario_id = auth.uid()
    )
  );

-- Admins pueden ver todas las reservas
CREATE POLICY "Admins pueden ver todas las reservas"
  ON reservas_estacionamiento FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- ============================================================================
-- KYC_SUBMISSIONS
-- ============================================================================

ALTER TABLE kyc_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios pueden ver su propio KYC"
  ON kyc_submissions FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Usuarios pueden crear su KYC"
  ON kyc_submissions FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuarios pueden actualizar su KYC pendiente"
  ON kyc_submissions FOR UPDATE
  USING (auth.uid() = usuario_id AND estado IN ('pendiente', 'requiere_info'));

CREATE POLICY "Admins pueden gestionar todos los KYC"
  ON kyc_submissions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- ============================================================================
-- USER_ROLES
-- ============================================================================

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios pueden ver sus propios roles"
  ON user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins pueden gestionar roles"
  ON user_roles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- ============================================================================
-- RESENAS_ESTACIONAMIENTO
-- ============================================================================

ALTER TABLE resenas_estacionamiento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Público puede ver reseñas activas"
  ON resenas_estacionamiento FOR SELECT
  USING (estado_moderacion = 'activa');

CREATE POLICY "Usuarios pueden crear reseñas de sus reservas"
  ON resenas_estacionamiento FOR INSERT
  WITH CHECK (
    auth.uid() = usuario_id AND
    EXISTS (
      SELECT 1 FROM reservas_estacionamiento 
      WHERE id = reserva_id AND usuario_id = auth.uid() AND estado = 'completada'
    )
  );

CREATE POLICY "Propietarios pueden responder reseñas"
  ON resenas_estacionamiento FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM estacionamientos 
      WHERE id = estacionamiento_id AND propietario_id = auth.uid()
    )
  );

-- ============================================================================
-- NOTIFICACIONES
-- ============================================================================

ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios pueden ver sus notificaciones"
  ON notificaciones FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Usuarios pueden actualizar sus notificaciones"
  ON notificaciones FOR UPDATE
  USING (auth.uid() = usuario_id);

-- ============================================================================
-- AUDIT_LOG
-- ============================================================================

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Solo admins pueden ver audit log"
  ON audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- ============================================================================
-- MP_ACCOUNTS_PROPIETARIOS
-- ============================================================================

ALTER TABLE mp_accounts_propietarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Propietarios pueden ver su cuenta MP"
  ON mp_accounts_propietarios FOR SELECT
  USING (auth.uid() = propietario_id);

CREATE POLICY "Admins pueden ver todas las cuentas MP"
  ON mp_accounts_propietarios FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );
```

---

## SCRIPT 16: STORAGE BUCKETS Y POLICIES

```sql
-- ============================================================================
-- SCRIPT 16: STORAGE BUCKETS Y POLICIES
-- Descripción: Configuración de almacenamiento de archivos
-- ============================================================================

-- Bucket para fotos de estacionamientos (público)
INSERT INTO storage.buckets (id, name, public)
VALUES ('estacionamientos', 'estacionamientos', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage para fotos de estacionamientos
CREATE POLICY "Propietarios pueden subir fotos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'estacionamientos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Propietarios pueden actualizar sus fotos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'estacionamientos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Propietarios pueden eliminar sus fotos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'estacionamientos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Público puede ver fotos"
ON storage.objects FOR SELECT
USING (bucket_id = 'estacionamientos');

-- Bucket para documentos KYC (privado)
INSERT INTO storage.buckets (id, name, public)
VALUES ('kyc-documents', 'kyc-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage para KYC
CREATE POLICY "Usuarios pueden subir sus documentos KYC"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'kyc-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Usuarios pueden ver sus documentos KYC"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'kyc-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins pueden ver todos los documentos KYC"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'kyc-documents' AND
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
  )
);
```

---

## SCRIPT 17: DATOS INICIALES (OPCIONAL)

```sql
-- ============================================================================
-- SCRIPT 17: DATOS INICIALES
-- Descripción: Datos de ejemplo para testing (OPCIONAL - SOLO EN DEV)
-- ============================================================================

-- ADVERTENCIA: Solo ejecutar en entorno de desarrollo/testing
-- NO ejecutar en producción

-- Insertar rol de admin para un usuario específico
-- Reemplazar 'USER_UUID_AQUI' con el UUID real del usuario
INSERT INTO user_roles (user_id, role)
VALUES ('USER_UUID_AQUI', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Ejemplo de estacionamiento de prueba
-- (Descomentar y ajustar según necesidad)
/*
INSERT INTO estacionamientos (
  propietario_id,
  nombre,
  tipo,
  descripcion,
  direccion_completa,
  calle,
  numero,
  barrio,
  latitud,
  longitud,
  capacidad_total,
  precio_por_hora,
  horarios,
  caracteristicas
) VALUES (
  'USER_UUID_AQUI',
  'Estacionamiento Centro',
  'playa_comercial',
  'Estacionamiento seguro en el centro de la ciudad',
  'Av. Corrientes 1234, Buenos Aires',
  'Av. Corrientes',
  '1234',
  'Centro',
  -34.6037,
  -58.3816,
  100,
  150.00,
  '{"lunes": {"abre": "08:00", "cierra": "20:00"}}'::jsonb,
  '["cubierto", "seguridad_24h", "camaras"]'::jsonb
);
*/
```

---

## VERIFICACIÓN POST-INSTALACIÓN

Después de ejecutar todos los scripts, verifica que todo esté correcto:

```sql
-- Verificar tablas creadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE '%estacionamiento%' 
  OR table_name IN ('user_roles', 'kyc_submissions', 'notificaciones', 'audit_log', 'mp_accounts_propietarios')
ORDER BY table_name;

-- Verificar vistas creadas
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Verificar funciones creadas
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- Verificar triggers creados
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- Verificar buckets de storage
SELECT * FROM storage.buckets;

-- Verificar RLS habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename LIKE '%estacionamiento%'
ORDER BY tablename;
```

---

## ROLLBACK (EN CASO DE ERROR)

Si necesitas revertir los cambios:

```sql
-- ADVERTENCIA: Esto eliminará TODAS las tablas y datos del PMS
-- Solo usar en caso de emergencia

DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS notificaciones CASCADE;
DROP TABLE IF EXISTS resenas_estacionamiento CASCADE;
DROP TABLE IF EXISTS mp_accounts_propietarios CASCADE;
DROP TABLE IF EXISTS reservas_estacionamiento CASCADE;
DROP TABLE IF EXISTS fotos_estacionamiento CASCADE;
DROP TABLE IF EXISTS kyc_submissions CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS estacionamientos CASCADE;

DROP VIEW IF EXISTS v_dashboard_admin CASCADE;
DROP VIEW IF EXISTS v_dashboard_propietario CASCADE;
DROP VIEW IF EXISTS v_estacionamientos_con_propietario CASCADE;

DROP FUNCTION IF EXISTS crear_notificacion_aprobacion() CASCADE;
DROP FUNCTION IF EXISTS generar_codigo_reserva() CASCADE;
DROP FUNCTION IF EXISTS actualizar_estadisticas_estacionamiento() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

DROP TYPE IF EXISTS accion_audit CASCADE;
DROP TYPE IF EXISTS tipo_notificacion CASCADE;
DROP TYPE IF EXISTS user_role_type CASCADE;
DROP TYPE IF EXISTS estado_kyc CASCADE;
DROP TYPE IF EXISTS tipo_kyc CASCADE;
DROP TYPE IF EXISTS estado_reserva_parking CASCADE;
DROP TYPE IF EXISTS estado_verificacion CASCADE;
DROP TYPE IF EXISTS tipo_estacionamiento CASCADE;

-- Eliminar buckets de storage
DELETE FROM storage.buckets WHERE id IN ('estacionamientos', 'kyc-documents');
```

---

**FIN DE LOS SCRIPTS SQL COMPLETOS**

**IMPORTANTE:** Recuerda ejecutar estos scripts en el orden indicado y siempre verificar el schema actual antes de ejecutar cualquier cambio.

