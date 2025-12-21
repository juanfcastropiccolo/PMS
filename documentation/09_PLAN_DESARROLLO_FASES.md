# 9. PLAN DE DESARROLLO POR FASES

## Metodología de Desarrollo

- **Enfoque:** Iterativo e incremental
- **Duración estimada total:** 12-16 semanas
- **Sprints:** 2 semanas cada uno
- **Testing:** Continuo en cada fase
- **Deployment:** Staging después de cada fase, Producción al final

---

## FASE 0: PREPARACIÓN Y SETUP (Semana 1)

### 0.1 Configuración del Proyecto

#### Crear Repositorio

```bash
# Crear proyecto Next.js
npx create-next-app@latest parkit-pms --typescript --tailwind --app --src-dir

cd parkit-pms

# Instalar dependencias
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
npm install @mui/material @mui/icons-material @emotion/react @emotion/styled
npm install react-hook-form zod @hookform/resolvers
npm install @tanstack/react-table
npm install recharts
npm install react-hot-toast
npm install date-fns
npm install zustand

# Dev dependencies
npm install -D @types/node @types/react @types/react-dom
npm install -D eslint prettier eslint-config-prettier
npm install -D @testing-library/react @testing-library/jest-dom jest
```

#### Estructura de Carpetas

```
parkit-pms/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── reset-password/
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/
│   │   │   ├── estacionamientos/
│   │   │   ├── reservas/
│   │   │   ├── finanzas/
│   │   │   └── perfil/
│   │   ├── (admin)/
│   │   │   ├── admin/
│   │   │   ├── aprobaciones/
│   │   │   ├── usuarios/
│   │   │   ├── transacciones/
│   │   │   └── reportes/
│   │   ├── api/
│   │   │   ├── mercadopago/
│   │   │   └── webhooks/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── admin/
│   │   ├── common/
│   │   └── layout/
│   ├── contexts/
│   │   ├── AuthContext.tsx
│   │   └── ThemeContext.tsx
│   ├── lib/
│   │   ├── supabase.ts
│   │   ├── auth/
│   │   ├── mercadopago/
│   │   └── utils/
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useEstacionamientos.ts
│   │   └── useReservas.ts
│   ├── types/
│   │   ├── database.ts
│   │   ├── estacionamiento.ts
│   │   └── reserva.ts
│   └── styles/
│       └── globals.css
├── public/
├── supabase/
│   └── migrations/
├── .env.local
├── .env.example
├── next.config.js
├── tsconfig.json
└── package.json
```

#### Variables de Entorno

```env
# .env.example

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Mercado Pago
NEXT_PUBLIC_MP_PUBLIC_KEY=
MP_ACCESS_TOKEN=
MP_CLIENT_ID=
MP_CLIENT_SECRET=
NEXT_PUBLIC_MP_REDIRECT_URI=
MP_WEBHOOK_SECRET=
NEXT_PUBLIC_MP_WEBHOOK_URL=

# Email (opcional)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=
```

### 0.2 Configuración de Supabase

#### Ejecutar Migraciones Base

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Link al proyecto
supabase link --project-ref your-project-ref

# Ejecutar migraciones
supabase db push
```

#### Crear Migraciones Iniciales

```sql
-- Ejecutar en orden:
-- 1. 20251220000000_create_estacionamientos_table.sql
-- 2. 20251220000001_create_fotos_estacionamiento_table.sql
-- 3. 20251220000002_create_reservas_estacionamiento_table.sql
-- 4. 20251220000003_create_kyc_submissions_table.sql
-- 5. 20251220000004_create_user_roles_table.sql
-- 6. 20251220000005_create_resenas_estacionamiento_table.sql
-- 7. 20251220000006_create_notificaciones_table.sql
-- 8. 20251220000007_create_audit_log_table.sql
-- 9. 20251220000008_create_update_updated_at_function.sql
-- 10. 20251220000009_create_actualizar_estadisticas_function.sql
-- 11. 20251220000010_create_generar_codigo_reserva_function.sql
-- 12. 20251220000011_create_notificacion_aprobacion_function.sql
-- 13. 20251220000012_create_views.sql
-- 14. 20251220000013_create_storage_buckets.sql
-- 15. 20251220000014_create_mp_accounts_propietarios.sql
```

### 0.3 Configuración de Theme y Estilos

```typescript
// src/lib/theme.ts

import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: {
      main: '#00B4D8',
      light: '#90E0EF',
      dark: '#0077B6',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#023E8A',
      light: '#0077B6',
      dark: '#03045E',
      contrastText: '#FFFFFF',
    },
    success: {
      main: '#38A169',
    },
    error: {
      main: '#E53E3E',
    },
    warning: {
      main: '#FF9500',
    },
    background: {
      default: '#FFFFFF',
      paper: '#F8FFFE',
    },
    text: {
      primary: '#2D3748',
      secondary: '#718096',
    },
  },
  typography: {
    fontFamily: 'Roboto, sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 700,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 700,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 700,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        },
      },
    },
  },
});
```

### 0.4 Criterios de Completitud

- ✅ Proyecto Next.js creado y configurado
- ✅ Todas las dependencias instaladas
- ✅ Estructura de carpetas creada
- ✅ Variables de entorno configuradas
- ✅ Supabase conectado y migraciones ejecutadas
- ✅ Theme configurado
- ✅ Repositorio Git inicializado
- ✅ README.md con instrucciones de setup

**Duración:** 3-5 días

---

## FASE 1: AUTENTICACIÓN Y ROLES (Semana 2)

### 1.1 Implementar Sistema de Autenticación

#### Tareas

1. **Crear AuthContext**
   - Provider con estado de usuario
   - Funciones de login/logout
   - Verificación de roles

2. **Páginas de Auth**
   - Login page
   - Register page (solo propietarios)
   - Reset password page
   - Verificación de email

3. **Middleware de Protección**
   - Proteger rutas privadas
   - Redireccionamiento según rol
   - Refresh de sesión

4. **Gestión de Roles**
   - Crear tabla user_roles
   - Asignar rol por defecto (propietario)
   - Función para verificar permisos

#### Archivos a Crear

```
src/
├── contexts/
│   └── AuthContext.tsx
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── reset-password/page.tsx
│   └── middleware.ts
├── lib/
│   └── auth/
│       ├── authService.ts
│       └── roleService.ts
└── hooks/
    └── useAuth.ts
```

#### Testing

```typescript
// tests/auth.test.ts

describe('Authentication', () => {
  it('should login successfully', async () => {
    const { user } = await authService.signIn('test@test.com', 'password');
    expect(user).toBeDefined();
    expect(user.email).toBe('test@test.com');
  });
  
  it('should assign default role on registration', async () => {
    const { user } = await authService.signUp('new@test.com', 'password', {});
    const roles = await authService.getUserRoles(user.id);
    expect(roles).toContain('propietario');
  });
  
  it('should redirect admin to admin dashboard', async () => {
    // Test middleware redirection
  });
});
```

### 1.2 Criterios de Completitud

- ✅ Usuario puede registrarse como propietario
- ✅ Usuario puede iniciar sesión
- ✅ Usuario puede cerrar sesión
- ✅ Usuario puede resetear contraseña
- ✅ Roles se asignan correctamente
- ✅ Middleware protege rutas según rol
- ✅ Sesión persiste en refresh
- ✅ Tests de autenticación pasan

**Duración:** 5-7 días

---

## FASE 2: DASHBOARD PROPIETARIO (Semanas 3-4)

### 2.1 Dashboard Principal

#### Tareas

1. **Layout del Dashboard**
   - Sidebar con navegación
   - Header con perfil de usuario
   - Breadcrumbs
   - Notificaciones

2. **Dashboard Home**
   - Cards de estadísticas
   - Gráficos de ingresos
   - Lista de próximas reservas
   - Alertas importantes

3. **Vista de Estadísticas**
   - Implementar vista v_dashboard_propietario
   - Queries para obtener stats
   - Componentes de visualización

#### Archivos a Crear

```
src/
├── components/
│   ├── layout/
│   │   ├── DashboardLayout.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── Breadcrumbs.tsx
│   └── dashboard/
│       ├── StatsCard.tsx
│       ├── RevenueChart.tsx
│       └── UpcomingReservations.tsx
└── app/
    └── (dashboard)/
        └── dashboard/
            └── page.tsx
```

### 2.2 Lista de Estacionamientos

#### Tareas

1. **Página de Lista**
   - Grid de cards de estacionamientos
   - Filtros y búsqueda
   - Ordenamiento
   - Paginación

2. **Card de Estacionamiento**
   - Foto principal
   - Información básica
   - Estado de verificación
   - Acciones rápidas

3. **Menu Contextual**
   - Editar
   - Activar/Desactivar
   - Ver detalles
   - Ver reservas

#### Archivos a Crear

```
src/
├── components/
│   └── dashboard/
│       ├── EstacionamientoCard.tsx
│       ├── EstacionamientoFilters.tsx
│       └── EstacionamientoMenu.tsx
├── app/
│   └── (dashboard)/
│       └── estacionamientos/
│           └── page.tsx
└── hooks/
    └── useEstacionamientos.ts
```

### 2.3 Criterios de Completitud

- ✅ Dashboard muestra estadísticas correctas
- ✅ Gráficos se renderizan correctamente
- ✅ Lista de estacionamientos funciona
- ✅ Filtros y búsqueda operativos
- ✅ Cards muestran información correcta
- ✅ Menu contextual funciona
- ✅ Responsive en mobile y tablet
- ✅ Loading states implementados

**Duración:** 10-12 días

---

## FASE 3: GESTIÓN DE ESTACIONAMIENTOS (Semanas 5-6)

### 3.1 Formulario de Creación

#### Tareas

1. **Formulario Multi-Step**
   - Step 1: Información básica
   - Step 2: Ubicación
   - Step 3: Características
   - Step 4: Precios y horarios
   - Step 5: Fotos
   - Step 6: Revisión

2. **Validaciones**
   - Esquema Zod para cada step
   - Validación en tiempo real
   - Mensajes de error claros

3. **Upload de Fotos**
   - Drag & drop
   - Preview de imágenes
   - Compresión automática
   - Límite de tamaño y cantidad

4. **Integración Google Places**
   - Autocomplete de direcciones
   - Obtener coordenadas
   - Validar dirección

#### Archivos a Crear

```
src/
├── components/
│   └── estacionamientos/
│       ├── FormularioEstacionamiento.tsx
│       ├── Step1InfoBasica.tsx
│       ├── Step2Ubicacion.tsx
│       ├── Step3Caracteristicas.tsx
│       ├── Step4PreciosHorarios.tsx
│       ├── Step5Fotos.tsx
│       ├── Step6Revision.tsx
│       ├── ImageUploader.tsx
│       └── AddressAutocomplete.tsx
├── app/
│   └── (dashboard)/
│       └── estacionamientos/
│           └── nuevo/
│               └── page.tsx
├── lib/
│   └── validations/
│       └── estacionamientoSchema.ts
└── hooks/
    └── useImageUpload.ts
```

#### Validación con Zod

```typescript
// lib/validations/estacionamientoSchema.ts

import { z } from 'zod';

export const step1Schema = z.object({
  nombre: z.string().min(3, 'Mínimo 3 caracteres').max(255),
  tipo: z.enum(['cochera_privada', 'playa_comercial', 'garage_edificio']),
  descripcion: z.string().min(10, 'Mínimo 10 caracteres').max(1000),
});

export const step2Schema = z.object({
  direccion_completa: z.string().min(5),
  calle: z.string().min(2),
  numero: z.string().min(1),
  barrio: z.string().optional(),
  ciudad: z.string().default('Buenos Aires'),
  provincia: z.string().default('Buenos Aires'),
  codigo_postal: z.string().optional(),
  latitud: z.number().min(-90).max(90),
  longitud: z.number().min(-180).max(180),
});

export const step3Schema = z.object({
  capacidad_total: z.number().min(1).max(10000),
  cantidad_pisos: z.number().min(1).max(50),
  altura_maxima: z.number().min(1.5).max(10).optional(),
  caracteristicas: z.array(z.string()),
});

export const step4Schema = z.object({
  precio_por_hora: z.number().min(0),
  precio_por_dia: z.number().min(0).optional(),
  precio_por_mes: z.number().min(0).optional(),
  horarios: z.record(z.object({
    abre: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
    cierra: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  })),
  abierto_24h: z.boolean(),
});

export const estacionamientoCompleteSchema = z.object({
  ...step1Schema.shape,
  ...step2Schema.shape,
  ...step3Schema.shape,
  ...step4Schema.shape,
});
```

### 3.2 Edición de Estacionamiento

#### Tareas

1. **Cargar datos existentes**
2. **Mismo formulario que creación**
3. **Validar cambios**
4. **Actualizar en BD**

### 3.3 Detalle de Estacionamiento

#### Tareas

1. **Vista de solo lectura**
2. **Todas las secciones de información**
3. **Galería de fotos**
4. **Estadísticas específicas**
5. **Botón de editar**

### 3.4 Criterios de Completitud

- ✅ Formulario multi-step funciona
- ✅ Validaciones operativas
- ✅ Upload de fotos funciona
- ✅ Google Places integrado
- ✅ Datos se guardan correctamente
- ✅ Edición funciona
- ✅ Vista de detalle completa
- ✅ Responsive
- ✅ Tests E2E pasan

**Duración:** 12-14 días

---

## FASE 4: MÓDULO DE APROBACIÓN (ADMIN) (Semana 7)

### 4.1 Dashboard Admin

#### Tareas

1. **Dashboard global**
   - Estadísticas de plataforma
   - Gráficos de crecimiento
   - Alertas de pendientes

2. **Lista de pendientes**
   - Tabla de solicitudes
   - Filtros
   - Acciones rápidas

### 4.2 Página de Revisión

#### Tareas

1. **Vista completa de solicitud**
   - Todos los datos del estacionamiento
   - Documentos KYC
   - Fotos en galería
   - Información del propietario

2. **Acciones de aprobación**
   - Botón Aprobar
   - Botón Rechazar con motivo
   - Solicitar más información

3. **Historial de cambios**
   - Ver versiones anteriores
   - Comentarios del admin

#### Archivos a Crear

```
src/
├── app/
│   └── (admin)/
│       ├── admin/
│       │   └── page.tsx
│       └── aprobaciones/
│           ├── page.tsx
│           └── [id]/
│               └── page.tsx
└── components/
    └── admin/
        ├── AdminDashboard.tsx
        ├── PendientesTable.tsx
        ├── RevisionForm.tsx
        └── DocumentViewer.tsx
```

### 4.3 Sistema KYC

#### Tareas

1. **Formulario KYC (Propietario)**
   - Persona física
   - Persona jurídica
   - Upload de documentos

2. **Revisión KYC (Admin)**
   - Ver documentos
   - Aprobar/Rechazar
   - Solicitar correcciones

### 4.4 Criterios de Completitud

- ✅ Dashboard admin funcional
- ✅ Lista de pendientes completa
- ✅ Página de revisión operativa
- ✅ Aprobación actualiza estado
- ✅ Rechazo envía notificación
- ✅ KYC implementado
- ✅ Documentos se visualizan
- ✅ Audit log registra acciones

**Duración:** 7-9 días

---

## FASE 5: GESTIÓN DE RESERVAS (Semana 8-9)

### 5.1 Lista de Reservas (Propietario)

#### Tareas

1. **Tabla de reservas**
   - Filtros por estado
   - Búsqueda
   - Ordenamiento
   - Paginación

2. **Detalle de reserva**
   - Información completa
   - Datos del usuario
   - Estado de pago
   - Código QR

3. **Acciones sobre reservas**
   - Confirmar llegada (check-in)
   - Marcar salida (checkout)
   - Cancelar
   - Marcar no-show

### 5.2 Calendario de Reservas

#### Tareas

1. **Vista de calendario**
   - Mensual
   - Semanal
   - Diaria

2. **Eventos en calendario**
   - Reservas confirmadas
   - Reservas pendientes
   - Bloques ocupados

### 5.3 Gestión de Disponibilidad

#### Tareas

1. **Actualización manual**
   - Input de espacios disponibles
   - Por piso (si aplica)
   - Histórico de cambios

2. **Bloqueo de fechas**
   - Marcar días no disponibles
   - Rango de fechas
   - Motivo del bloqueo

### 5.4 Criterios de Completitud

- ✅ Lista de reservas funciona
- ✅ Filtros operativos
- ✅ Detalle completo
- ✅ Check-in/out funcionan
- ✅ Calendario renderiza
- ✅ Actualización de disponibilidad
- ✅ Notificaciones se envían
- ✅ Tests pasan

**Duración:** 10-12 días

---

## FASE 6: DASHBOARD Y MÉTRICAS (Semana 10)

### 6.1 Dashboard Propietario Avanzado

#### Tareas

1. **Gráficos de ingresos**
   - Por mes
   - Por estacionamiento
   - Tendencias

2. **Métricas de ocupación**
   - Tasa de ocupación
   - Horas pico
   - Días más ocupados

3. **Análisis de reseñas**
   - Rating promedio
   - Distribución de calificaciones
   - Comentarios recientes

### 6.2 Dashboard Admin Avanzado

#### Tareas

1. **Métricas globales**
   - Crecimiento de plataforma
   - Ingresos totales
   - Comisiones

2. **Reportes**
   - Exportar a CSV/PDF
   - Reportes personalizados
   - Programar envíos

### 6.3 Criterios de Completitud

- ✅ Gráficos se renderizan
- ✅ Datos son precisos
- ✅ Filtros de fecha funcionan
- ✅ Exportación operativa
- ✅ Performance optimizada
- ✅ Responsive

**Duración:** 7-9 días

---

## FASE 7: INTEGRACIÓN MERCADO PAGO (Semana 11)

### 7.1 OAuth y Vinculación

#### Tareas

1. **Flujo OAuth completo**
2. **Almacenamiento de tokens**
3. **Refresh automático**
4. **Desvinculación**

### 7.2 Procesamiento de Pagos

#### Tareas

1. **Crear preferencias**
2. **Webhook handler**
3. **Actualizar estados**
4. **Notificaciones**

### 7.3 Dashboard de Finanzas

#### Tareas

1. **Vista de ingresos**
2. **Historial de transacciones**
3. **Estado de cuenta MP**
4. **Comisiones**

### 7.4 Criterios de Completitud

- ✅ OAuth funciona
- ✅ Tokens se almacenan
- ✅ Pagos se procesan
- ✅ Webhooks operativos
- ✅ Dashboard finanzas completo
- ✅ Tests de integración pasan

**Duración:** 7-9 días

---

## FASE 8: NOTIFICACIONES Y PULIDO (Semana 12)

### 8.1 Sistema de Notificaciones

#### Tareas

1. **Notificaciones in-app**
   - Bell icon con contador
   - Lista de notificaciones
   - Marcar como leída

2. **Emails**
   - Templates HTML
   - Envío automático
   - Configuración SMTP

3. **Push notifications (opcional)**
   - Service worker
   - Suscripción
   - Envío desde backend

### 8.2 Pulido Final

#### Tareas

1. **UI/UX Review**
   - Consistencia de diseño
   - Accesibilidad
   - Responsive

2. **Performance**
   - Optimización de queries
   - Lazy loading
   - Caching

3. **SEO**
   - Meta tags
   - Sitemap
   - Robots.txt

### 8.3 Criterios de Completitud

- ✅ Notificaciones funcionan
- ✅ Emails se envían
- ✅ UI consistente
- ✅ Performance óptima
- ✅ Accesibilidad A/AA
- ✅ SEO configurado

**Duración:** 7-9 días

---

## FASE 9: TESTING Y QA (Semana 13-14)

### 9.1 Testing Integral

#### Tareas

1. **Unit Tests**
   - Funciones utilitarias
   - Hooks
   - Validaciones

2. **Integration Tests**
   - Flujos completos
   - API calls
   - Database operations

3. **E2E Tests**
   - User journeys
   - Critical paths
   - Edge cases

4. **Performance Tests**
   - Load testing
   - Stress testing
   - Lighthouse audits

### 9.2 Bug Fixing

#### Tareas

1. **Priorizar bugs**
2. **Fix críticos**
3. **Fix mayores**
4. **Fix menores**

### 9.3 Criterios de Completitud

- ✅ 80%+ code coverage
- ✅ Todos los tests pasan
- ✅ Bugs críticos resueltos
- ✅ Performance score > 90
- ✅ Accessibility score > 90

**Duración:** 10-14 días

---

## FASE 10: DEPLOYMENT Y LANZAMIENTO (Semana 15-16)

### 10.1 Preparación para Producción

#### Tareas

1. **Configuración de entornos**
   - Staging
   - Production

2. **Variables de entorno**
   - Secrets management
   - Configuración de servicios

3. **Monitoring**
   - Sentry para errores
   - Vercel Analytics
   - Supabase logs

### 10.2 Deployment

#### Tareas

1. **Deploy a Staging**
   - Testing final
   - UAT con stakeholders

2. **Deploy a Production**
   - Smoke tests
   - Monitoring activo

3. **Rollback plan**
   - Procedimiento documentado
   - Backup de BD

### 10.3 Post-Launch

#### Tareas

1. **Monitoring 24/7**
2. **Hotfix si necesario**
3. **Recolección de feedback**
4. **Planificación de mejoras**

### 10.4 Criterios de Completitud

- ✅ Deploy exitoso
- ✅ Todos los servicios operativos
- ✅ Monitoring configurado
- ✅ Documentación completa
- ✅ Equipo capacitado

**Duración:** 10-14 días

---

## RESUMEN DE TIMELINE

| Fase | Descripción | Duración | Semanas |
|------|-------------|----------|---------|
| 0 | Preparación y Setup | 3-5 días | 1 |
| 1 | Autenticación y Roles | 5-7 días | 2 |
| 2 | Dashboard Propietario | 10-12 días | 3-4 |
| 3 | Gestión de Estacionamientos | 12-14 días | 5-6 |
| 4 | Módulo de Aprobación (Admin) | 7-9 días | 7 |
| 5 | Gestión de Reservas | 10-12 días | 8-9 |
| 6 | Dashboard y Métricas | 7-9 días | 10 |
| 7 | Integración Mercado Pago | 7-9 días | 11 |
| 8 | Notificaciones y Pulido | 7-9 días | 12 |
| 9 | Testing y QA | 10-14 días | 13-14 |
| 10 | Deployment y Lanzamiento | 10-14 días | 15-16 |

**TOTAL: 12-16 semanas (3-4 meses)**

---

## METODOLOGÍA DE TRABAJO

### Daily Standup
- 15 minutos diarios
- ¿Qué hice ayer?
- ¿Qué haré hoy?
- ¿Tengo bloqueos?

### Sprint Planning
- Cada 2 semanas
- Definir objetivos del sprint
- Asignar tareas
- Estimar esfuerzo

### Sprint Review
- Fin de cada sprint
- Demo de funcionalidades
- Feedback de stakeholders

### Sprint Retrospective
- Después de review
- ¿Qué funcionó bien?
- ¿Qué mejorar?
- Action items

---

## DEFINICIÓN DE DONE

Una tarea está "Done" cuando:

1. ✅ Código implementado
2. ✅ Tests escritos y pasando
3. ✅ Code review aprobado
4. ✅ Documentación actualizada
5. ✅ Deployed a staging
6. ✅ QA aprobado
7. ✅ Sin bugs críticos
8. ✅ Performance aceptable

---

## RIESGOS Y MITIGACIÓN

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Delays en integración MP | Media | Alto | Empezar temprano, tener plan B |
| Cambios en requisitos | Alta | Medio | Sprints cortos, feedback continuo |
| Bugs críticos en producción | Media | Alto | Testing exhaustivo, staging environment |
| Performance issues | Media | Medio | Load testing, optimización continua |
| Problemas de seguridad | Baja | Crítico | Security audit, best practices |

---

**FIN DEL PLAN DE DESARROLLO POR FASES**

