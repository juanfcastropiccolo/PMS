# 🔒 SEGURIDAD DEL PMS - CONTROL DE ACCESO

## ✅ PROBLEMA RESUELTO

El PMS ahora tiene un **sistema de seguridad robusto** que impide que usuarios comunes de Parkit accedan al sistema.

---

## 🚫 QUIÉN NO PUEDE ACCEDER

- **Usuarios Parker** (conductores con vehículo de la app móvil)
- **Usuarios Spotter** (reportan lugares libres de la app móvil)
- **Cualquier usuario sin rol asignado en `user_roles`**

---

## ✅ QUIÉN SÍ PUEDE ACCEDER

Solo usuarios con rol en la tabla `user_roles`:

1. **Propietarios** (`role = 'propietario'`)
   - Dueños de estacionamientos
   - Administran sus propios lugares
   - Ven reservas y estadísticas

2. **Admins** (`role = 'admin'`)
   - Administradores de propietarios específicos
   - Pueden gestionar múltiples estacionamientos

3. **Super Admins** (`role = 'super_admin'`)
   - Administradores de Parkit
   - Acceso total al panel de administración
   - Aprueban/rechazan solicitudes de KYC

---

## 🛡️ CAPAS DE SEGURIDAD IMPLEMENTADAS

### 1️⃣ AuthService (`src/lib/auth/authService.ts`)
- ✅ `getUserRoles()` retorna array vacío `[]` si el usuario no tiene roles
- ✅ **NO** asigna roles por defecto
- ✅ Usuarios sin rol = sin acceso

### 2️⃣ AuthContext (`src/contexts/AuthContext.tsx`)
- ✅ Verifica roles después del login
- ✅ Si `roles.length === 0`, **cierra sesión automáticamente**
- ✅ Muestra mensaje de error claro al usuario

### 3️⃣ Middleware (`src/middleware.ts`)
- ✅ Verifica roles en **cada request**
- ✅ Consulta `user_roles` en cada navegación protegida
- ✅ Si el usuario no tiene rol, **lo redirige al login** y cierra sesión
- ✅ Agrega parámetro `?error=no_access` a la URL

### 4️⃣ Login Page (`src/app/auth/login/page.tsx`)
- ✅ Detecta `?error=no_access` en la URL
- ✅ Muestra mensaje específico de "sin permisos"
- ✅ Maneja errores de autenticación con mensajes claros

---

## 📋 CÓMO ASIGNAR ROLES

### 🔹 Opción 1: Ejecutar SQL en Supabase

```sql
-- Asignar rol de propietario
INSERT INTO public.user_roles (user_id, role, permissions, asignado_at)
VALUES (
  'USER_ID_AQUI',
  'propietario',
  '[]'::jsonb,
  NOW()
);

-- Asignar rol de super admin
INSERT INTO public.user_roles (user_id, role, permissions, asignado_at)
VALUES (
  'USER_ID_AQUI',
  'super_admin',
  '[]'::jsonb,
  NOW()
);
```

### 🔹 Opción 2: Usar el script incluido

```bash
# Editar ASIGNAR_ROL_USUARIO.sql con el user_id correcto
# Luego ejecutarlo en Supabase SQL Editor
```

---

## 🔍 VERIFICAR ACCESO

### 1️⃣ Verificar si un usuario tiene rol:

```sql
SELECT 
  ur.id, 
  ur.user_id, 
  ur.role, 
  au.email,
  ur.asignado_at
FROM public.user_roles ur
JOIN auth.users au ON au.id = ur.user_id
WHERE au.email = 'usuario@ejemplo.com';
```

### 2️⃣ Ver todos los usuarios con acceso:

```sql
SELECT 
  au.email,
  ur.role,
  ur.asignado_at
FROM public.user_roles ur
JOIN auth.users au ON au.id = ur.user_id
ORDER BY ur.asignado_at DESC;
```

### 3️⃣ Ver usuarios sin acceso (usuarios de Parkit):

```sql
SELECT 
  au.email,
  au.created_at
FROM auth.users au
LEFT JOIN public.user_roles ur ON ur.user_id = au.id
WHERE ur.id IS NULL
ORDER BY au.created_at DESC;
```

---

## 🎯 FLUJO DE AUTENTICACIÓN

```
┌─────────────────────┐
│  Usuario hace login │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────┐
│ AuthService.signIn()    │
│ - Autentica con Supabase│
│ - Obtiene roles         │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ ¿Tiene roles?           │
└──────────┬──────────────┘
           │
    ┌──────┴───────┐
    │              │
    ▼              ▼
┌────────┐    ┌────────────┐
│  SÍ    │    │   NO       │
│        │    │            │
│ Accede │    │ 1. Cierra  │
│ al PMS │    │    sesión  │
│        │    │ 2. Muestra │
│        │    │    error   │
└────────┘    └────────────┘
```

---

## 🔔 MENSAJES DE ERROR

### Error en Login:
```
No tienes permisos para acceder al PMS. Este sistema es exclusivo 
para propietarios de estacionamientos registrados. Por favor, 
contacta al administrador para solicitar acceso.
```

### Error en Middleware:
```
Redirige a /auth/login?error=no_access
```

---

## ⚙️ CONFIGURACIÓN ADICIONAL (OPCIONAL)

### Desactivar registro público

Si quieres que **solo admins** puedan crear usuarios:

1. Ir a **Supabase Dashboard > Authentication > Providers > Email**
2. Desactivar **"Enable sign ups"**
3. Crear usuarios manualmente desde el panel

### Activar confirmación de email

Si quieres que los usuarios confirmen su email:

1. Ir a **Supabase Dashboard > Authentication > Email Templates**
2. Activar **"Confirm signup"**
3. Personalizar el template si lo deseas

---

## 📊 MEJORAS FUTURAS (OPCIONAL)

### 1️⃣ Sistema de Solicitud de Acceso

Crear una tabla `solicitudes_acceso`:

```sql
CREATE TABLE solicitudes_acceso (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  telefono VARCHAR(50),
  mensaje TEXT,
  estado VARCHAR(50) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobada', 'rechazada')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  revisada_por UUID REFERENCES auth.users(id),
  revisada_at TIMESTAMPTZ
);
```

### 2️⃣ Página de "Solicitar Acceso"

Crear `/solicitar-acceso` para que propietarios interesados puedan registrarse.

### 3️⃣ Panel Admin para Aprobar Solicitudes

Agregar sección en `/admin/solicitudes` para revisar y aprobar/rechazar.

---

## ✅ RESUMEN

| **Característica**                  | **Estado** |
|-------------------------------------|------------|
| Bloquear usuarios sin rol           | ✅          |
| Verificación en login               | ✅          |
| Verificación en middleware          | ✅          |
| Mensaje de error claro              | ✅          |
| Script para asignar roles           | ✅          |
| Documentación completa              | ✅          |
| Sistema de solicitud de acceso      | ⏳ Futuro   |

---

¡El PMS ahora es seguro y solo accesible para propietarios autorizados! 🎉

