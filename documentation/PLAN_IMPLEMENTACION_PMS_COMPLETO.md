# PLAN DE IMPLEMENTACIÓN COMPLETO - PARKIT MANAGEMENT SYSTEM (PMS)

> **Documento Maestro de Implementación**  
> **Versión:** 1.0  
> **Fecha:** Diciembre 2025  
> **Estado:** Plan Definitivo - Listo para Implementación

---

## 📋 TABLA DE CONTENIDOS

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Stack Tecnológico](#stack-tecnológico)
4. [Base de Datos y Migraciones](#base-de-datos-y-migraciones)
5. [Sistema de Autenticación y Roles](#sistema-de-autenticación-y-roles)
6. [Módulo de Propietarios](#módulo-de-propietarios)
7. [Módulo de Administradores](#módulo-de-administradores)
8. [Integraciones Externas](#integraciones-externas)
9. [Sistema de Notificaciones](#sistema-de-notificaciones)
10. [Plan de Desarrollo por Fases](#plan-de-desarrollo-por-fases)
11. [Diseño UI/UX](#diseño-uiux)
12. [Testing y QA](#testing-y-qa)
13. [Deployment y DevOps](#deployment-y-devops)
14. [Documentación y Mantenimiento](#documentación-y-mantenimiento)

---

## 1. RESUMEN EJECUTIVO

### 1.1 Objetivo del PMS

El **Parking Management System (PMS)** es una aplicación web administrativa que complementa la app móvil de Parkit, permitiendo:

- **A propietarios de estacionamientos**: Gestionar sus espacios privados/comerciales en el marketplace
- **Al equipo interno de Parkit**: Supervisar, aprobar y moderar contenidos de la plataforma

### 1.2 Alcance

✅ **INCLUYE:**
- Gestión completa de estacionamientos privados/comerciales (marketplace)
- Sistema de aprobación y verificación KYC
- Gestión de reservas y pagos
- Dashboard de métricas y analytics
- Integración con Mercado Pago
- Sistema de notificaciones
- Panel de administración global

❌ **NO INCLUYE:**
- Gestión de estacionamientos "free" (públicos reportados por comunidad)
- Integración con IZI Park (futuro)
- App móvil para propietarios (futuro)

### 1.3 Usuarios del Sistema

| Rol | Descripción | Acceso |
|-----|-------------|--------|
| **Propietario** | Dueño de estacionamiento privado/comercial | Portal de gestión personal |
| **Administrador Parkit** | Staff interno (Dev/Ops) | Portal administrativo global |
| **Conductor/Spotter** | Usuario final de la app móvil | NO usa el PMS |

---

## 2. ARQUITECTURA DEL SISTEMA

### 2.1 Arquitectura General

```
┌─────────────────────────────────────────────────────────────┐
│                    PARKIT ECOSYSTEM                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐         ┌──────────────┐                  │
│  │  App Móvil   │◄────────┤   PMS Web    │                  │
│  │  (Flutter)   │         │  (Next.js)   │                  │
│  └──────┬───────┘         └──────┬───────┘                  │
│         │                        │                           │
│         │                        │                           │
│         └────────┬───────────────┘                           │
│                  │                                           │
│                  ▼                                           │
│         ┌────────────────┐                                   │
│         │   SUPABASE     │                                   │
│         │  (PostgreSQL)  │                                   │
│         │   + Auth       │                                   │
│         │   + Storage    │                                   │
│         │   + Realtime   │                                   │
│         └────────┬───────┘                                   │
│                  │                                           │
│         ┌────────┴───────┐                                   │
│         │                │                                   │
│         ▼                ▼                                   │
│  ┌─────────────┐  ┌─────────────┐                           │
│  │ Mercado Pago│  │   Storage   │                           │
│  │   (Pagos)   │  │  (Archivos) │                           │
│  └─────────────┘  └─────────────┘                           │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Flujo de Datos

#### Flujo de Creación de Estacionamiento

```
Propietario → PMS → Supabase → Estado: Pendiente
                                    ↓
                              Admin revisa
                                    ↓
                            Aprueba/Rechaza
                                    ↓
                          Actualiza Supabase
                                    ↓
                          Notifica Propietario
                                    ↓
                        Visible en App Móvil (si aprobado)
```

#### Flujo de Reserva

```
Conductor (App) → Crea Reserva → Supabase
                                     ↓
                            Realtime Update
                                     ↓
                         PMS (Propietario ve)
                                     ↓
                            Procesa Pago (MP)
                                     ↓
                         Confirma en Supabase
                                     ↓
                    Notifica ambas partes
```

### 2.3 Componentes del Sistema

| Componente | Tecnología | Propósito |
|------------|-----------|-----------|
| **Frontend Web** | Next.js 14+ (App Router) | Interfaz de usuario PMS |
| **Backend** | Supabase + Edge Functions | API y lógica de negocio |
| **Base de Datos** | PostgreSQL (Supabase) | Almacenamiento de datos |
| **Autenticación** | Supabase Auth | Gestión de usuarios |
| **Storage** | Supabase Storage | Archivos y fotos |
| **Realtime** | Supabase Realtime | Sincronización en tiempo real |
| **Pagos** | Mercado Pago | Procesamiento de pagos |
| **Hosting** | Vercel | Deploy del frontend |

---

## 3. STACK TECNOLÓGICO

### 3.1 Frontend

#### Framework Principal
```json
{
  "framework": "Next.js",
  "version": "14.x",
  "router": "App Router",
  "language": "TypeScript 5.x"
}
```

#### Librerías UI
```json
{
  "ui_framework": "Material-UI (MUI) v5",
  "icons": "@mui/icons-material",
  "charts": "recharts",
  "forms": "react-hook-form + zod",
  "tables": "@tanstack/react-table",
  "calendar": "react-big-calendar",
  "notifications": "react-hot-toast",
  "modals": "@mui/material/Dialog"
}
```

#### Estado y Data Fetching
```json
{
  "state_management": "Zustand (opcional, para estado global)",
  "data_fetching": "@supabase/supabase-js",
  "realtime": "Supabase Realtime subscriptions"
}
```

### 3.2 Backend

#### Supabase Services
```typescript
// Servicios utilizados
{
  database: "PostgreSQL 15+",
  auth: "Supabase Auth (JWT)",
  storage: "Supabase Storage (S3-compatible)",
  realtime: "WebSocket subscriptions",
  edge_functions: "Deno runtime"
}
```

#### Edge Functions (Serverless)
```typescript
// Casos de uso
- OAuth Mercado Pago (intercambio de tokens)
- Webhooks de pagos
- Envío de emails
- Procesamiento de aprobaciones
- Generación de reportes
```

### 3.3 Base de Datos

**PostgreSQL con extensiones:**
- `uuid-ossp`: Generación de UUIDs
- `postgis`: Geolocalización (ya en uso)
- `pg_cron`: Tareas programadas (opcional)

### 3.4 DevOps

```yaml
hosting:
  frontend: Vercel
  backend: Supabase (managed)
  
ci_cd:
  git: GitHub
  pipeline: Vercel + GitHub Actions
  
environments:
  - development (local)
  - staging (Vercel preview)
  - production (Vercel)
  
monitoring:
  errors: Sentry
  analytics: Vercel Analytics
  logs: Supabase Logs
```

---

## 4. BASE DE DATOS Y MIGRACIONES

### 4.1 Análisis del Schema Actual

**Tablas Existentes Relevantes para PMS:**

#### Tabla `usuarios`
```sql
-- Ya existe, contiene:
- id (uuid)
- rol (enum: 'dueño', 'cuidador', 'pendiente')
- nombre, email, telefono
- foto_perfil_url
- direccion_completa, latitud, longitud
- mp_account_id (para Mercado Pago)
- created_at, updated_at
```

**⚠️ NOTA:** Esta tabla es de PetPals, NO de Parkit. Necesitamos crear nuevas tablas para el PMS de Parkit.

### 4.2 Nuevas Tablas Requeridas

#### 4.2.1 Tabla `estacionamientos`

```sql
-- Migration: 20251220000000_create_estacionamientos_table.sql

CREATE TYPE tipo_estacionamiento AS ENUM (
  'cochera_privada',
  'playa_comercial',
  'garage_edificio'
);

CREATE TYPE estado_verificacion AS ENUM (
  'pendiente',
  'aprobado',
  'rechazado',
  'suspendido'
);

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
  distribucion_pisos JSONB, -- {piso: capacidad} ej: {"1": 50, "2": 50}
  
  -- Horarios (JSONB para flexibilidad)
  horarios JSONB NOT NULL, -- {"lunes": {"abre": "08:00", "cierra": "20:00"}, ...}
  abierto_24h BOOLEAN DEFAULT false,
  
  -- Precios
  precio_por_hora DECIMAL(10, 2) NOT NULL CHECK (precio_por_hora >= 0),
  precio_por_dia DECIMAL(10, 2),
  precio_por_mes DECIMAL(10, 2),
  moneda VARCHAR(3) DEFAULT 'ARS',
  
  -- Características
  caracteristicas JSONB DEFAULT '[]'::jsonb, 
  -- ["cubierto", "seguridad_24h", "camaras", "cargador_electrico", "altura_maxima_2.5m"]
  altura_maxima DECIMAL(4, 2), -- en metros
  
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
  
  -- Índices
  CONSTRAINT valid_capacidad CHECK (espacios_disponibles >= 0 AND espacios_disponibles <= capacidad_total)
);

-- Índices para performance
CREATE INDEX idx_estacionamientos_propietario ON estacionamientos(propietario_id);
CREATE INDEX idx_estacionamientos_ubicacion ON estacionamientos USING GIST (
  ll_to_earth(latitud, longitud)
);
CREATE INDEX idx_estacionamientos_estado ON estacionamientos(estado_verificacion);
CREATE INDEX idx_estacionamientos_activo ON estacionamientos(activo) WHERE activo = true;

-- Trigger para updated_at
CREATE TRIGGER update_estacionamientos_updated_at
  BEFORE UPDATE ON estacionamientos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
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
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Admins pueden actualizar cualquier estacionamiento
CREATE POLICY "Admins pueden actualizar estacionamientos"
  ON estacionamientos FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Usuarios públicos (app móvil) pueden ver estacionamientos activos y verificados
CREATE POLICY "Público puede ver estacionamientos activos"
  ON estacionamientos FOR SELECT
  USING (activo = true AND verificado = true);
```

#### 4.2.2 Tabla `fotos_estacionamiento`

```sql
-- Migration: 20251220000001_create_fotos_estacionamiento_table.sql

CREATE TABLE fotos_estacionamiento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estacionamiento_id UUID NOT NULL REFERENCES estacionamientos(id) ON DELETE CASCADE,
  
  -- Información de la foto
  url TEXT NOT NULL, -- URL pública de Supabase Storage
  storage_path TEXT NOT NULL, -- Ruta en el bucket
  orden INTEGER DEFAULT 0, -- Para ordenar las fotos
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

-- Índices
CREATE INDEX idx_fotos_estacionamiento ON fotos_estacionamiento(estacionamiento_id);
CREATE INDEX idx_fotos_orden ON fotos_estacionamiento(estacionamiento_id, orden);

-- RLS
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
```

#### 4.2.3 Tabla `reservas_estacionamiento`

```sql
-- Migration: 20251220000002_create_reservas_estacionamiento_table.sql

CREATE TYPE estado_reserva_parking AS ENUM (
  'pendiente',
  'confirmada',
  'en_curso',
  'completada',
  'cancelada',
  'no_show'
);

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
  vehiculo_info JSONB, -- {"marca": "Toyota", "modelo": "Corolla", "patente": "ABC123", "color": "Blanco"}
  
  -- Código de reserva
  codigo_reserva VARCHAR(20) UNIQUE NOT NULL, -- Ej: "PRK-2024-A1B2C3"
  codigo_qr TEXT, -- URL del QR generado
  
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
  payment_id UUID REFERENCES payments(id),
  payment_status VARCHAR(50),
  payment_method VARCHAR(50),
  
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
    EXTRACT(EPOCH FROM (fecha_fin - fecha_inicio)) >= 1800 -- mínimo 30 minutos
  )
);

-- Índices
CREATE INDEX idx_reservas_estacionamiento ON reservas_estacionamiento(estacionamiento_id);
CREATE INDEX idx_reservas_usuario ON reservas_estacionamiento(usuario_id);
CREATE INDEX idx_reservas_fechas ON reservas_estacionamiento(fecha_inicio, fecha_fin);
CREATE INDEX idx_reservas_estado ON reservas_estacionamiento(estado);
CREATE INDEX idx_reservas_codigo ON reservas_estacionamiento(codigo_reserva);

-- Trigger updated_at
CREATE TRIGGER update_reservas_estacionamiento_updated_at
  BEFORE UPDATE ON reservas_estacionamiento
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
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
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
```

#### 4.2.4 Tabla `kyc_submissions`

```sql
-- Migration: 20251220000003_create_kyc_submissions_table.sql

CREATE TYPE tipo_kyc AS ENUM (
  'persona_fisica',
  'persona_juridica'
);

CREATE TYPE estado_kyc AS ENUM (
  'pendiente',
  'en_revision',
  'aprobado',
  'rechazado',
  'requiere_info'
);

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

-- Índices
CREATE INDEX idx_kyc_usuario ON kyc_submissions(usuario_id);
CREATE INDEX idx_kyc_estado ON kyc_submissions(estado);
CREATE INDEX idx_kyc_estacionamiento ON kyc_submissions(estacionamiento_id);

-- Trigger
CREATE TRIGGER update_kyc_submissions_updated_at
  BEFORE UPDATE ON kyc_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
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

CREATE POLICY "Admins pueden ver todos los KYC"
  ON kyc_submissions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
```

#### 4.2.5 Tabla `user_roles`

```sql
-- Migration: 20251220000004_create_user_roles_table.sql

CREATE TYPE user_role_type AS ENUM (
  'propietario',
  'admin',
  'super_admin'
);

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

-- Índices
CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role);

-- RLS
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
```

#### 4.2.6 Tabla `resenas_estacionamiento`

```sql
-- Migration: 20251220000005_create_resenas_estacionamiento_table.sql

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
  seguridad INTEGER CHECK (seguridad >= 1 AND limpieza <= 5),
  accesibilidad INTEGER CHECK (accesibilidad >= 1 AND accesibilidad <= 5),
  relacion_precio_calidad INTEGER CHECK (relacion_precio_calidad >= 1 AND relacion_precio_calidad <= 5),
  
  -- Verificación
  es_verificada BOOLEAN DEFAULT false, -- Si la reserva fue completada
  
  -- Respuesta del propietario
  respuesta_propietario TEXT,
  respondida_at TIMESTAMP WITH TIME ZONE,
  
  -- Moderación
  reportada BOOLEAN DEFAULT false,
  motivo_reporte TEXT,
  estado_moderacion VARCHAR(50) DEFAULT 'activa', -- activa, oculta, eliminada
  
  -- Utilidad
  votos_utiles INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Una reseña por reserva
  UNIQUE(reserva_id)
);

-- Índices
CREATE INDEX idx_resenas_estacionamiento ON resenas_estacionamiento(estacionamiento_id);
CREATE INDEX idx_resenas_usuario ON resenas_estacionamiento(usuario_id);
CREATE INDEX idx_resenas_calificacion ON resenas_estacionamiento(calificacion);

-- Trigger
CREATE TRIGGER update_resenas_estacionamiento_updated_at
  BEFORE UPDATE ON resenas_estacionamiento
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
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
```

#### 4.2.7 Tabla `notificaciones`

```sql
-- Migration: 20251220000006_create_notificaciones_table.sql

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

CREATE TABLE notificaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Destinatario
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Tipo y contenido
  tipo tipo_notificacion NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  mensaje TEXT NOT NULL,
  
  -- Referencia (opcional)
  referencia_tipo VARCHAR(50), -- 'estacionamiento', 'reserva', 'resena'
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

-- Índices
CREATE INDEX idx_notificaciones_usuario ON notificaciones(usuario_id);
CREATE INDEX idx_notificaciones_leida ON notificaciones(usuario_id, leida);
CREATE INDEX idx_notificaciones_created ON notificaciones(created_at DESC);

-- RLS
ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios pueden ver sus notificaciones"
  ON notificaciones FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Usuarios pueden actualizar sus notificaciones"
  ON notificaciones FOR UPDATE
  USING (auth.uid() = usuario_id);
```

#### 4.2.8 Tabla `audit_log`

```sql
-- Migration: 20251220000007_create_audit_log_table.sql

CREATE TYPE accion_audit AS ENUM (
  'crear',
  'actualizar',
  'eliminar',
  'aprobar',
  'rechazar',
  'suspender',
  'activar'
);

CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Usuario que realizó la acción
  usuario_id UUID REFERENCES auth.users(id),
  usuario_email VARCHAR(255),
  usuario_rol VARCHAR(50),
  
  -- Acción
  accion accion_audit NOT NULL,
  entidad_tipo VARCHAR(100) NOT NULL, -- 'estacionamiento', 'reserva', 'kyc', etc.
  entidad_id UUID NOT NULL,
  
  -- Detalles
  descripcion TEXT,
  cambios JSONB, -- Antes y después
  
  -- Metadata
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_audit_usuario ON audit_log(usuario_id);
CREATE INDEX idx_audit_entidad ON audit_log(entidad_tipo, entidad_id);
CREATE INDEX idx_audit_created ON audit_log(created_at DESC);

-- RLS
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Solo admins pueden ver audit log"
  ON audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );
```

### 4.3 Funciones y Triggers

#### 4.3.1 Función `update_updated_at_column()`

```sql
-- Migration: 20251220000008_create_update_updated_at_function.sql

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

#### 4.3.2 Función `actualizar_estadisticas_estacionamiento()`

```sql
-- Migration: 20251220000009_create_actualizar_estadisticas_function.sql

CREATE OR REPLACE FUNCTION actualizar_estadisticas_estacionamiento()
RETURNS TRIGGER AS $$
BEGIN
  -- Actualizar total de reservas y calificación promedio
  UPDATE estacionamientos
  SET 
    total_reservas = (
      SELECT COUNT(*) 
      FROM reservas_estacionamiento 
      WHERE estacionamiento_id = NEW.estacionamiento_id
    ),
    calificacion_promedio = (
      SELECT AVG(calificacion) 
      FROM resenas_estacionamiento 
      WHERE estacionamiento_id = NEW.estacionamiento_id AND estado_moderacion = 'activa'
    ),
    total_resenas = (
      SELECT COUNT(*) 
      FROM resenas_estacionamiento 
      WHERE estacionamiento_id = NEW.estacionamiento_id AND estado_moderacion = 'activa'
    )
  WHERE id = NEW.estacionamiento_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para reservas
CREATE TRIGGER trigger_actualizar_stats_reserva
  AFTER INSERT OR UPDATE ON reservas_estacionamiento
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_estadisticas_estacionamiento();

-- Trigger para reseñas
CREATE TRIGGER trigger_actualizar_stats_resena
  AFTER INSERT OR UPDATE ON resenas_estacionamiento
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_estadisticas_estacionamiento();
```

#### 4.3.3 Función `generar_codigo_reserva()`

```sql
-- Migration: 20251220000010_create_generar_codigo_reserva_function.sql

CREATE OR REPLACE FUNCTION generar_codigo_reserva()
RETURNS TRIGGER AS $$
DECLARE
  codigo TEXT;
  existe BOOLEAN;
BEGIN
  -- Generar código único
  LOOP
    codigo := 'PRK-' || TO_CHAR(NOW(), 'YYYY') || '-' || 
              UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
    
    -- Verificar si existe
    SELECT EXISTS(
      SELECT 1 FROM reservas_estacionamiento WHERE codigo_reserva = codigo
    ) INTO existe;
    
    EXIT WHEN NOT existe;
  END LOOP;
  
  NEW.codigo_reserva := codigo;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generar_codigo_reserva
  BEFORE INSERT ON reservas_estacionamiento
  FOR EACH ROW
  WHEN (NEW.codigo_reserva IS NULL)
  EXECUTE FUNCTION generar_codigo_reserva();
```

#### 4.3.4 Función `crear_notificacion_aprobacion()`

```sql
-- Migration: 20251220000011_create_notificacion_aprobacion_function.sql

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
      referencia_id
    ) VALUES (
      NEW.propietario_id,
      'estacionamiento_aprobado',
      '¡Tu estacionamiento fue aprobado!',
      'Tu estacionamiento "' || NEW.nombre || '" ha sido verificado y ya está visible en la app.',
      'estacionamiento',
      NEW.id
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
      referencia_id
    ) VALUES (
      NEW.propietario_id,
      'estacionamiento_rechazado',
      'Tu estacionamiento requiere revisión',
      'Tu estacionamiento "' || NEW.nombre || '" necesita correcciones. Motivo: ' || 
      COALESCE(NEW.motivo_rechazo, 'Ver detalles en el panel.'),
      'estacionamiento',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notificacion_aprobacion
  AFTER UPDATE ON estacionamientos
  FOR EACH ROW
  WHEN (OLD.estado_verificacion IS DISTINCT FROM NEW.estado_verificacion)
  EXECUTE FUNCTION crear_notificacion_aprobacion();
```

### 4.4 Vistas Útiles

#### 4.4.1 Vista `v_estacionamientos_con_propietario`

```sql
-- Migration: 20251220000012_create_views.sql

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
    WHERE r.estacionamiento_id = e.id AND r.estado = 'confirmada'
  ) as reservas_activas
FROM estacionamientos e
JOIN auth.users u ON e.propietario_id = u.id;
```

#### 4.4.2 Vista `v_dashboard_propietario`

```sql
CREATE OR REPLACE VIEW v_dashboard_propietario AS
SELECT 
  e.propietario_id,
  COUNT(DISTINCT e.id) as total_estacionamientos,
  COUNT(DISTINCT CASE WHEN e.activo = true THEN e.id END) as estacionamientos_activos,
  COUNT(DISTINCT CASE WHEN e.estado_verificacion = 'pendiente' THEN e.id END) as pendientes_aprobacion,
  COUNT(DISTINCT r.id) as total_reservas,
  COUNT(DISTINCT CASE WHEN r.estado = 'confirmada' THEN r.id END) as reservas_activas,
  COALESCE(SUM(CASE WHEN r.estado = 'completada' THEN r.monto_propietario ELSE 0 END), 0) as ingresos_totales,
  COALESCE(SUM(CASE 
    WHEN r.estado = 'completada' AND r.created_at >= NOW() - INTERVAL '30 days' 
    THEN r.monto_propietario ELSE 0 END), 0) as ingresos_ultimo_mes,
  COALESCE(AVG(e.calificacion_promedio), 0) as calificacion_promedio_general
FROM estacionamientos e
LEFT JOIN reservas_estacionamiento r ON r.estacionamiento_id = e.id
GROUP BY e.propietario_id;
```

#### 4.4.3 Vista `v_dashboard_admin`

```sql
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
  COALESCE(AVG(re.calificacion), 0) as calificacion_promedio_plataforma
FROM estacionamientos e
LEFT JOIN reservas_estacionamiento r ON r.estacionamiento_id = e.id
LEFT JOIN resenas_estacionamiento re ON re.estacionamiento_id = e.id AND re.estado_moderacion = 'activa';
```

### 4.5 Storage Buckets

```sql
-- Migration: 20251220000013_create_storage_buckets.sql

-- Bucket para fotos de estacionamientos
INSERT INTO storage.buckets (id, name, public)
VALUES ('estacionamientos', 'estacionamientos', true);

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
VALUES ('kyc-documents', 'kyc-documents', false);

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

## 5. SISTEMA DE AUTENTICACIÓN Y ROLES

### 5.1 Flujo de Autenticación

```typescript
// lib/auth/authService.ts

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface User {
  id: string;
  email: string;
  roles: ('propietario' | 'admin' | 'super_admin')[];
  metadata: {
    nombre?: string;
    telefono?: string;
    foto_perfil?: string;
  };
}

export const authService = {
  // Login
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    
    // Obtener roles del usuario
    const roles = await this.getUserRoles(data.user.id);
    
    return {
      user: data.user,
      session: data.session,
      roles,
    };
  },
  
  // Logout
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },
  
  // Obtener usuario actual
  async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;
    
    const roles = await this.getUserRoles(user.id);
    
    return {
      id: user.id,
      email: user.email!,
      roles,
      metadata: user.user_metadata,
    };
  },
  
  // Obtener roles del usuario
  async getUserRoles(userId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error fetching roles:', error);
      return ['propietario']; // Default role
    }
    
    return data.map(r => r.role);
  },
  
  // Verificar si es admin
  async isAdmin(userId: string): Promise<boolean> {
    const roles = await this.getUserRoles(userId);
    return roles.includes('admin') || roles.includes('super_admin');
  },
  
  // Registro (solo propietarios)
  async signUp(email: string, password: string, metadata: any) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });
    
    if (error) throw error;
    
    // Asignar rol de propietario por defecto
    if (data.user) {
      await supabase.from('user_roles').insert({
        user_id: data.user.id,
        role: 'propietario',
      });
    }
    
    return data;
  },
  
  // Resetear contraseña
  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    
    if (error) throw error;
  },
  
  // Actualizar contraseña
  async updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    
    if (error) throw error;
  },
};
```

### 5.2 Middleware de Autenticación

```typescript
// middleware.ts

import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  
  const {
    data: { session },
  } = await supabase.auth.getSession();
  
  // Rutas públicas
  const publicRoutes = ['/auth/login', '/auth/register', '/auth/reset-password'];
  const isPublicRoute = publicRoutes.some(route => req.nextUrl.pathname.startsWith(route));
  
  // Si no hay sesión y no es ruta pública, redirigir a login
  if (!session && !isPublicRoute) {
    return NextResponse.redirect(new URL('/auth/login', req.url));
  }
  
  // Si hay sesión y está en login, redirigir al dashboard
  if (session && req.nextUrl.pathname === '/auth/login') {
    // Verificar rol para redirigir al dashboard correcto
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id);
    
    const isAdmin = roles?.some(r => r.role === 'admin' || r.role === 'super_admin');
    
    return NextResponse.redirect(
      new URL(isAdmin ? '/admin' : '/dashboard', req.url)
    );
  }
  
  // Proteger rutas de admin
  if (req.nextUrl.pathname.startsWith('/admin')) {
    if (!session) {
      return NextResponse.redirect(new URL('/auth/login', req.url));
    }
    
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id);
    
    const isAdmin = roles?.some(r => r.role === 'admin' || r.role === 'super_admin');
    
    if (!isAdmin) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }
  
  return res;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
```

### 5.3 Context Provider

```typescript
// contexts/AuthContext.tsx

'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { authService, User } from '@/lib/auth/authService';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isPropietario: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  
  useEffect(() => {
    // Cargar usuario al montar
    loadUser();
  }, []);
  
  const loadUser = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const signIn = async (email: string, password: string) => {
    const { user: authUser, roles } = await authService.signIn(email, password);
    
    const userData: User = {
      id: authUser.id,
      email: authUser.email!,
      roles,
      metadata: authUser.user_metadata,
    };
    
    setUser(userData);
    
    // Redirigir según rol
    const isAdmin = roles.includes('admin') || roles.includes('super_admin');
    router.push(isAdmin ? '/admin' : '/dashboard');
  };
  
  const signOut = async () => {
    await authService.signOut();
    setUser(null);
    router.push('/auth/login');
  };
  
  const isAdmin = user?.roles.includes('admin') || user?.roles.includes('super_admin') || false;
  const isPropietario = user?.roles.includes('propietario') || false;
  
  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signOut,
        isAdmin,
        isPropietario,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

### 5.4 Páginas de Autenticación

#### Login Page

```typescript
// app/auth/login/page.tsx

'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Box, 
  Card, 
  CardContent, 
  TextField, 
  Button, 
  Typography,
  Alert,
  Link as MuiLink,
  CircularProgress
} from '@mui/material';
import Link from 'next/link';
import Image from 'next/image';

export default function LoginPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await signIn(email, password);
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #00B4D8 0%, #0077B6 100%)',
        padding: 2,
      }}
    >
      <Card sx={{ maxWidth: 450, width: '100%' }}>
        <CardContent sx={{ p: 4 }}>
          {/* Logo */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h4" sx={{ color: '#00B4D8', fontWeight: 700 }}>
              Parkit
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Management System
            </Typography>
          </Box>
          
          {/* Error */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          {/* Form */}
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              sx={{ mb: 2 }}
            />
            
            <TextField
              fullWidth
              label="Contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              sx={{ mb: 3 }}
            />
            
            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                mb: 2,
                bgcolor: '#00B4D8',
                '&:hover': { bgcolor: '#0077B6' },
              }}
            >
              {loading ? <CircularProgress size={24} /> : 'Iniciar Sesión'}
            </Button>
          </form>
          
          {/* Links */}
          <Box sx={{ textAlign: 'center' }}>
            <Link href="/auth/reset-password" passHref legacyBehavior>
              <MuiLink variant="body2" sx={{ color: '#00B4D8' }}>
                ¿Olvidaste tu contraseña?
              </MuiLink>
            </Link>
            
            <Typography variant="body2" sx={{ mt: 2 }}>
              ¿No tienes cuenta?{' '}
              <Link href="/auth/register" passHref legacyBehavior>
                <MuiLink sx={{ color: '#00B4D8', fontWeight: 600 }}>
                  Regístrate aquí
                </MuiLink>
              </Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
```

---

## 6. MÓDULO DE PROPIETARIOS

### 6.1 Dashboard Principal

```typescript
// app/dashboard/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
} from '@mui/material';
import {
  Store as StoreIcon,
  AttachMoney as MoneyIcon,
  EventAvailable as ReservasIcon,
  Star as StarIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface DashboardStats {
  total_estacionamientos: number;
  estacionamientos_activos: number;
  pendientes_aprobacion: number;
  total_reservas: number;
  reservas_activas: number;
  ingresos_totales: number;
  ingresos_ultimo_mes: number;
  calificacion_promedio_general: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadStats();
  }, [user]);
  
  const loadStats = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('v_dashboard_propietario')
        .select('*')
        .eq('propietario_id', user.id)
        .single();
      
      if (error) throw error;
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return <Box>Cargando...</Box>;
  }
  
  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#2D3748' }}>
            Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Bienvenido, {user?.metadata.nombre || user?.email}
          </Typography>
        </Box>
        
        <Link href="/dashboard/estacionamientos/nuevo" passHref>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            sx={{
              bgcolor: '#00B4D8',
              '&:hover': { bgcolor: '#0077B6' },
            }}
          >
            Nuevo Estacionamiento
          </Button>
        </Link>
      </Box>
      
      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Total Estacionamientos */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 2,
                    bgcolor: '#E8F7FA',
                    color: '#00B4D8',
                    mr: 2,
                  }}
                >
                  <StoreIcon />
                </Box>
                <Typography variant="h6" color="text.secondary">
                  Estacionamientos
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700 }}>
                {stats?.total_estacionamientos || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {stats?.estacionamientos_activos || 0} activos
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Reservas */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 2,
                    bgcolor: '#E8F7FA',
                    color: '#00B4D8',
                    mr: 2,
                  }}
                >
                  <ReservasIcon />
                </Box>
                <Typography variant="h6" color="text.secondary">
                  Reservas
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700 }}>
                {stats?.total_reservas || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {stats?.reservas_activas || 0} activas
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Ingresos */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 2,
                    bgcolor: '#E8F7FA',
                    color: '#38A169',
                    mr: 2,
                  }}
                >
                  <MoneyIcon />
                </Box>
                <Typography variant="h6" color="text.secondary">
                  Ingresos
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700 }}>
                ${(stats?.ingresos_totales || 0).toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ${(stats?.ingresos_ultimo_mes || 0).toLocaleString()} este mes
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Calificación */}
        <Grid item xs={12} sm={6} md=3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 2,
                    bgcolor: '#E8F7FA',
                    color: '#FFB800',
                    mr: 2,
                  }}
                >
                  <StarIcon />
                </Box>
                <Typography variant="h6" color="text.secondary">
                  Calificación
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700 }}>
                {(stats?.calificacion_promedio_general || 0).toFixed(1)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                de 5.0
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Pendientes de Aprobación */}
      {stats && stats.pendientes_aprobacion > 0 && (
        <Card sx={{ mb: 4, borderLeft: '4px solid #FF9500' }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Tienes {stats.pendientes_aprobacion} estacionamiento(s) pendiente(s) de aprobación
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Nuestro equipo está revisando tu solicitud. Te notificaremos cuando sea aprobada.
            </Typography>
          </CardContent>
        </Card>
      )}
      
      {/* Quick Actions */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Acciones Rápidas
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Link href="/dashboard/estacionamientos" passHref>
                  <Button fullWidth variant="outlined">
                    Ver Mis Estacionamientos
                  </Button>
                </Link>
                <Link href="/dashboard/reservas" passHref>
                  <Button fullWidth variant="outlined">
                    Ver Reservas
                  </Button>
                </Link>
                <Link href="/dashboard/finanzas" passHref>
                  <Button fullWidth variant="outlined">
                    Ver Finanzas
                  </Button>
                </Link>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Próximas Reservas
              </Typography>
              {/* Lista de próximas reservas */}
              <Typography variant="body2" color="text.secondary">
                No hay reservas próximas
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
```

### 6.2 Gestión de Estacionamientos

#### Lista de Estacionamientos

```typescript
// app/dashboard/estacionamientos/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Chip,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  MoreVert as MoreIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Estacionamiento {
  id: string;
  nombre: string;
  direccion_completa: string;
  tipo: string;
  capacidad_total: number;
  precio_por_hora: number;
  activo: boolean;
  verificado: boolean;
  estado_verificacion: string;
  calificacion_promedio: number;
  total_reservas: number;
  fotos: Array<{ url: string; es_principal: boolean }>;
}

export default function EstacionamientosPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [estacionamientos, setEstacionamientos] = useState<Estacionamiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  useEffect(() => {
    loadEstacionamientos();
  }, [user]);
  
  const loadEstacionamientos = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('v_estacionamientos_con_propietario')
        .select('*')
        .eq('propietario_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setEstacionamientos(data || []);
    } catch (error) {
      console.error('Error loading estacionamientos:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, id: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedId(id);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedId(null);
  };
  
  const handleEdit = () => {
    if (selectedId) {
      router.push(`/dashboard/estacionamientos/${selectedId}/editar`);
    }
    handleMenuClose();
  };
  
  const handleToggleActivo = async () => {
    if (!selectedId) return;
    
    const estacionamiento = estacionamientos.find(e => e.id === selectedId);
    if (!estacionamiento) return;
    
    try {
      const { error } = await supabase
        .from('estacionamientos')
        .update({ activo: !estacionamiento.activo })
        .eq('id', selectedId);
      
      if (error) throw error;
      
      // Recargar
      loadEstacionamientos();
    } catch (error) {
      console.error('Error toggling activo:', error);
    }
    
    handleMenuClose();
  };
  
  const getEstadoChip = (estado: string) => {
    const config = {
      pendiente: { label: 'Pendiente', color: 'warning' as const },
      aprobado: { label: 'Aprobado', color: 'success' as const },
      rechazado: { label: 'Rechazado', color: 'error' as const },
      suspendido: { label: 'Suspendido', color: 'default' as const },
    };
    
    const { label, color } = config[estado as keyof typeof config] || config.pendiente;
    
    return <Chip label={label} color={color} size="small" />;
  };
  
  if (loading) {
    return <Box>Cargando...</Box>;
  }
  
  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Mis Estacionamientos
        </Typography>
        
        <Link href="/dashboard/estacionamientos/nuevo" passHref>
          <Button
            variant="contained"
            sx={{
              bgcolor: '#00B4D8',
              '&:hover': { bgcolor: '#0077B6' },
            }}
          >
            + Nuevo Estacionamiento
          </Button>
        </Link>
      </Box>
      
      {/* Lista */}
      {estacionamientos.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
              No tienes estacionamientos registrados
            </Typography>
            <Link href="/dashboard/estacionamientos/nuevo" passHref>
              <Button variant="contained">
                Crear Mi Primer Estacionamiento
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {estacionamientos.map((estacionamiento) => {
            const fotoPrincipal = estacionamiento.fotos?.find(f => f.es_principal) || estacionamiento.fotos?.[0];
            
            return (
              <Grid item xs={12} sm={6} md={4} key={estacionamiento.id}>
                <Card>
                  {/* Imagen */}
                  <CardMedia
                    component="img"
                    height="200"
                    image={fotoPrincipal?.url || '/placeholder-parking.jpg'}
                    alt={estacionamiento.nombre}
                  />
                  
                  <CardContent>
                    {/* Header con estado */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                          {estacionamiento.nombre}
                        </Typography>
                        {getEstadoChip(estacionamiento.estado_verificacion)}
                      </Box>
                      
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, estacionamiento.id)}
                      >
                        <MoreIcon />
                      </IconButton>
                    </Box>
                    
                    {/* Dirección */}
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {estacionamiento.direccion_completa}
                    </Typography>
                    
                    {/* Stats */}
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Capacidad
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {estacionamiento.capacidad_total} espacios
                        </Typography>
                      </Box>
                      
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Precio/hora
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          ${estacionamiento.precio_por_hora}
                        </Typography>
                      </Box>
                      
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Reservas
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {estacionamiento.total_reservas}
                        </Typography>
                      </Box>
                    </Box>
                    
                    {/* Acciones */}
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Link href={`/dashboard/estacionamientos/${estacionamiento.id}`} passHref style={{ flex: 1 }}>
                        <Button fullWidth variant="outlined" size="small">
                          Ver Detalles
                        </Button>
                      </Link>
                      
                      <Link href={`/dashboard/estacionamientos/${estacionamiento.id}/editar`} passHref style={{ flex: 1 }}>
                        <Button fullWidth variant="contained" size="small">
                          Editar
                        </Button>
                      </Link>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
      
      {/* Menu contextual */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEdit}>
          <EditIcon sx={{ mr: 1 }} fontSize="small" />
          Editar
        </MenuItem>
        <MenuItem onClick={handleToggleActivo}>
          <ViewIcon sx={{ mr: 1 }} fontSize="small" />
          {estacionamientos.find(e => e.id === selectedId)?.activo ? 'Desactivar' : 'Activar'}
        </MenuItem>
      </Menu>
    </Box>
  );
}
```

### 6.3 Formulario de Creación/Edición

Este archivo es muy extenso, por lo que voy a continuar con las secciones más importantes. El archivo completo incluiría:

- Formulario completo con todos los campos
- Validación con Zod
- Upload de fotos
- Integración con Google Places API
- Manejo de horarios
- Características seleccionables

---

## 7. MÓDULO DE ADMINISTRADORES

### 7.1 Dashboard Admin

```typescript
// app/admin/page.tsx

'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import {
  Store as StoreIcon,
  People as PeopleIcon,
  AttachMoney as MoneyIcon,
  EventAvailable as ReservasIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { supabase } from '@/lib/supabase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface AdminStats {
  total_estacionamientos: number;
  estacionamientos_activos: number;
  pendientes_aprobacion: number;
  total_propietarios: number;
  total_reservas: number;
  reservas_ultimo_mes: number;
  ingresos_totales_plataforma: number;
  ingresos_ultimo_mes: number;
  comisiones_totales: number;
  calificacion_promedio_plataforma: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendientes, setPendientes] = useState([]);
  
  useEffect(() => {
    loadStats();
    loadPendientes();
  }, []);
  
  const loadStats = async () => {
    try {
      const { data, error } = await supabase
        .from('v_dashboard_admin')
        .select('*')
        .single();
      
      if (error) throw error;
      setStats(data);
    } catch (error) {
      console.error('Error loading admin stats:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const loadPendientes = async () => {
    try {
      const { data, error } = await supabase
        .from('v_estacionamientos_con_propietario')
        .select('*')
        .eq('estado_verificacion', 'pendiente')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      setPendientes(data || []);
    } catch (error) {
      console.error('Error loading pendientes:', error);
    }
  };
  
  if (loading) {
    return <Box>Cargando...</Box>;
  }
  
  return (
    <Box>
      {/* Header */}
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 4 }}>
        Dashboard Administrativo
      </Typography>
      
      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box sx={{ p: 1, borderRadius: 2, bgcolor: '#E8F7FA', color: '#00B4D8', mr: 2 }}>
                  <StoreIcon />
                </Box>
                <Typography variant="h6" color="text.secondary">
                  Estacionamientos
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700 }}>
                {stats?.total_estacionamientos || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {stats?.estacionamientos_activos || 0} activos
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box sx={{ p: 1, borderRadius: 2, bgcolor: '#FFF4E5', color: '#FF9500', mr: 2 }}>
                  <WarningIcon />
                </Box>
                <Typography variant="h6" color="text.secondary">
                  Pendientes
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700 }}>
                {stats?.pendientes_aprobacion || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Requieren aprobación
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box sx={{ p: 1, borderRadius: 2, bgcolor: '#E8F7FA', color: '#00B4D8', mr: 2 }}>
                  <PeopleIcon />
                </Box>
                <Typography variant="h6" color="text.secondary">
                  Propietarios
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700 }}>
                {stats?.total_propietarios || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box sx={{ p: 1, borderRadius: 2, bgcolor: '#E8F5E9', color: '#38A169', mr: 2 }}>
                  <MoneyIcon />
                </Box>
                <Typography variant="h6" color="text.secondary">
                  Comisiones
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700 }}>
                ${(stats?.comisiones_totales || 0).toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total acumulado
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Pendientes de Aprobación */}
      {pendientes.length > 0 && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Pendientes de Aprobación
            </Typography>
            
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Propietario</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pendientes.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.nombre}</TableCell>
                    <TableCell>{item.propietario_nombre || item.propietario_email}</TableCell>
                    <TableCell>{item.tipo}</TableCell>
                    <TableCell>{new Date(item.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Link href={`/admin/aprobaciones/${item.id}`} passHref>
                        <Button size="small">Revisar</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      
      {/* Gráficos y más estadísticas */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Reservas Últimos 30 Días
              </Typography>
              {/* Aquí iría el gráfico con recharts */}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Actividad Reciente
              </Typography>
              {/* Lista de actividad reciente */}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
```

---

Debido a la extensión del documento, voy a continuar creando el archivo con las secciones restantes. El plan completo incluirá todas las secciones mencionadas en la tabla de contenidos.

¿Te gustaría que continúe con el resto del documento? Puedo crear archivos adicionales para:

1. Módulo de Aprobaciones (Admin)
2. Integraciones con Mercado Pago
3. Sistema de Notificaciones
4. Plan de Desarrollo por Fases Detallado
5. Guías de Testing
6. Scripts de Deployment
7. Documentación de API

¿Continúo con el documento completo?
