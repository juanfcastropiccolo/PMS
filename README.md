# 🅿️ Parkit - Parking Management System (PMS)

Sistema de gestión para propietarios de estacionamientos de Parkit.

---

## 🚀 INICIO RÁPIDO

### 1️⃣ **Primer Paso**: Lee esto
📖 **[START_HERE.md](START_HERE.md)** ← Empieza aquí

### 2️⃣ **Asignar rol** (1 minuto)
```sql
-- Ejecutar en Supabase SQL Editor
INSERT INTO public.user_roles (user_id, role, permissions, asignado_at)
VALUES (
  '3c429b7f-4ff6-4251-8f69-a6b7b0182070',
  'propietario',
  '[]'::jsonb,
  NOW()
);
```

### 3️⃣ **Login** (30 segundos)
```
http://localhost:3000/auth/login
Email: juanfcastropiccolo@gmail.com
```

---

## 📚 DOCUMENTACIÓN

| Documento                         | Descripción                                  |
|-----------------------------------|----------------------------------------------|
| **START_HERE.md**                 | 🔥 **Empieza aquí**                          |
| **PASOS_SIGUIENTES.md**           | Guía paso a paso                             |
| **README_ACCESO_PMS.md**          | Cómo acceder al sistema                      |
| **SEGURIDAD_PMS.md**              | Sistema de seguridad y roles                 |
| **RESUMEN_MEJORAS_SEGURIDAD.md**  | Cambios técnicos implementados               |
| **ASIGNAR_ROL_USUARIO.sql**       | Script para asignar roles                    |
| **CREAR_USUARIO_PRUEBA.md**       | Crear usuarios de prueba                     |

---

## 🛠️ STACK TECNOLÓGICO

- ⚛️ **Next.js 14** - Framework React con App Router
- 🎨 **Material-UI v5** - Componentes UI con tema Parkit
- 🔐 **Supabase** - Backend, Auth, Database (PostgreSQL)
- 📊 **TypeScript** - Type-safe development
- 🎯 **Zustand** - State management
- 📈 **Recharts** - Gráficos y estadísticas
- 📅 **React Big Calendar** - Calendario de reservas
- 🎨 **Emotion** - CSS-in-JS styling
- 🔥 **React Hot Toast** - Notificaciones

---

## 🏗️ ESTRUCTURA DEL PROYECTO

```
PMS/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── auth/              # Páginas de autenticación
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── reset-password/
│   │   ├── dashboard/         # Dashboard propietario
│   │   ├── admin/             # Panel de administración
│   │   ├── layout.tsx         # Layout principal
│   │   └── page.tsx           # Página raíz (redirect)
│   │
│   ├── components/            # Componentes React
│   │   ├── dashboard/         # Componentes del dashboard
│   │   ├── common/            # Componentes reutilizables
│   │   └── forms/             # Formularios
│   │
│   ├── contexts/              # React Contexts
│   │   └── AuthContext.tsx    # Context de autenticación
│   │
│   ├── lib/                   # Librerías y utilidades
│   │   ├── auth/              # Servicios de autenticación
│   │   ├── supabase.ts        # Cliente de Supabase
│   │   ├── theme.ts           # Tema MUI (colores Parkit)
│   │   └── env.ts             # Variables de entorno
│   │
│   ├── types/                 # Tipos TypeScript
│   │   └── database.ts        # Tipos de la DB (generados)
│   │
│   └── middleware.ts          # Middleware de Next.js
│
├── public/                    # Archivos estáticos
├── documentation/             # Documentación del proyecto
├── *.sql                      # Scripts SQL
├── *.md                       # Documentación
├── package.json              # Dependencias
├── tsconfig.json             # Config TypeScript
├── next.config.js            # Config Next.js
└── .env                      # Variables de entorno
```

---

## 🔐 SISTEMA DE SEGURIDAD

### **4 Capas de Protección**:

1. **AuthService**: Verifica roles en login
2. **AuthContext**: Bloquea usuarios sin rol
3. **Middleware**: Verifica en cada request
4. **Login Page**: Mensajes claros de error

### **Control de Acceso**:

| Usuario                    | Acceso al PMS |
|----------------------------|---------------|
| Parker (app móvil)         | ❌            |
| Spotter (app móvil)        | ❌            |
| Propietario registrado     | ✅            |
| Admin del sistema          | ✅            |
| Super Admin de Parkit      | ✅            |

---

## 🗄️ BASE DE DATOS

### **Estrategia de Simbiosis**:
El PMS comparte la base de datos con la app móvil de Parkit, extendiendo tablas existentes en lugar de duplicarlas.

### **Tablas Principales**:

- `estacionamientos` - Lugares de estacionamiento (extendida para PMS)
- `reservas` - Reservas de usuarios (extendida para PMS)
- `resenas` - Reseñas de estacionamientos (extendida para PMS)
- `kyc_submissions` - Verificación KYC (extendida para PMS)
- `mp_accounts_propietarios` - Cuentas MP vinculadas (renombrada de `vendedores`)
- `user_roles` - Roles del PMS (nueva)
- `notificaciones` - Notificaciones del sistema (nueva)
- `audit_log` - Registro de auditoría (nueva)
- `fotos_estacionamiento` - Fotos de lugares (nueva)

### **Migraciones**:

1. `MIGRACION_SIMBIOSIS.sql` - Extensión de tablas existentes
2. `COMPLETAR_CONFIGURACION.sql` - Vistas, RLS, Storage

---

## 📋 ESTADO DEL PROYECTO

### ✅ **Completado**:

- [x] Setup base del proyecto
- [x] Autenticación y roles
- [x] **Sistema de seguridad multicapa**
- [x] Dashboard básico
- [x] Tema MUI con colores Parkit
- [x] Migraciones SQL (simbiosis con app móvil)

### ⏳ **Pendiente**:

- [ ] FASE 3: CRUD de Estacionamientos
- [ ] FASE 4: Panel de Administración (KYC)
- [ ] FASE 5: Integración Mercado Pago

---

## 🎨 PALETA DE COLORES PARKIT

```typescript
primary: '#00B4D8',    // Azul principal
secondary: '#0077B6',  // Azul oscuro
success: '#38A169',    // Verde éxito
error: '#E53E3E',      // Rojo error
warning: '#F6AD55',    // Naranja warning
info: '#4299E1',       // Azul info
```

---

## 🚀 COMANDOS

```bash
# Desarrollo
npm run dev

# Build
npm run build

# Producción
npm start

# Linting
npm run lint

# Type check
npm run type-check

# Tests (cuando estén implementados)
npm test
```

---

## 🔧 VARIABLES DE ENTORNO

Archivo `.env`:

```bash
# Supabase
SUPABASE_URL=https://hldpjshvcwlyjmqmugrf.supabase.co
SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Mercado Pago
MP_PUBLIC_KEY=tu_public_key
MP_ACCESS_TOKEN=tu_access_token
NEXT_PUBLIC_MP_REDIRECT_URI=http://localhost:3000/api/mercadopago/callback
MP_WEBHOOK_SECRET=tu_webhook_secret
NEXT_PUBLIC_MP_WEBHOOK_URL=http://localhost:3000/api/webhooks/mercadopago

# Google Places API
NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=tu_api_key
```

---

## 📞 SOPORTE

¿Problemas para acceder? Lee:
1. **START_HERE.md** - Guía de inicio
2. **README_ACCESO_PMS.md** - Solución de problemas
3. **SEGURIDAD_PMS.md** - Detalles de seguridad

---

## 📄 LICENCIA

Propiedad de **Parkit** - Todos los derechos reservados.

---

## 🎉 ¡LISTO!

**Lee [START_HERE.md](START_HERE.md) para comenzar** 🚀
