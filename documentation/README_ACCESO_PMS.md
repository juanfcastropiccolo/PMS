# 🚀 CÓMO ACCEDER AL PMS

## 🔐 IMPORTANTE: Control de Acceso

El **Parkit PMS** tiene un **sistema de seguridad robusto** que impide que usuarios comunes de la app móvil accedan al sistema.

---

## ✅ PASO 1: Asignar Rol a Tu Usuario

Ya tienes una cuenta de Parkit con el email: **juanfcastropiccolo@gmail.com**

Para acceder al PMS, necesitas asignarle un rol de **propietario**:

### Ejecuta este SQL en Supabase:

1. Ve a **Supabase Dashboard**: https://app.supabase.com/
2. Selecciona el proyecto **parkit**
3. Abre **SQL Editor** (icono de código en el menú lateral)
4. Copia y pega este script:

```sql
-- Asignar rol de propietario a tu usuario
INSERT INTO public.user_roles (user_id, role, permissions, asignado_at)
VALUES (
  '3c429b7f-4ff6-4251-8f69-a6b7b0182070',  -- Tu user_id
  'propietario',
  '[]'::jsonb,
  NOW()
)
ON CONFLICT DO NOTHING;

-- Verificar que se creó correctamente
SELECT 
  ur.id, 
  ur.role, 
  au.email,
  ur.asignado_at
FROM public.user_roles ur
JOIN auth.users au ON au.id = ur.user_id
WHERE ur.user_id = '3c429b7f-4ff6-4251-8f69-a6b7b0182070';
```

5. Click en **"Run"**
6. Deberías ver un resultado confirmando que se creó el rol

---

## ✅ PASO 2: Hacer Login

1. Ve a: http://localhost:3000/auth/login
2. Ingresa tus credenciales:
   - **Email**: `juanfcastropiccolo@gmail.com`
   - **Contraseña**: Tu contraseña de Parkit
3. Click en **"Iniciar Sesión"**
4. **¡Deberías entrar al dashboard!** 🎉

---

## 🔒 ¿Qué Pasaría Si NO Tuvieras Rol?

Si intentaras hacer login sin tener un rol asignado:

1. ✅ La autenticación sería exitosa (Supabase Auth)
2. ❌ El sistema verificaría roles y NO encontraría ninguno
3. ❌ Se cerraría la sesión automáticamente
4. ❌ Verías este mensaje:

```
No tienes permisos para acceder al PMS. Este sistema es exclusivo 
para propietarios de estacionamientos registrados. Por favor, 
contacta al administrador para solicitar acceso.
```

---

## 🛡️ Capas de Seguridad Implementadas

### 1️⃣ AuthService
- Verifica roles en `user_roles` después del login
- **NO** asigna roles por defecto
- Usuarios sin rol = array vacío `[]`

### 2️⃣ AuthContext
- Detecta si `roles.length === 0`
- Cierra sesión automáticamente
- Muestra mensaje de error claro

### 3️⃣ Middleware
- Verifica roles en **cada request**
- Consulta `user_roles` en cada navegación protegida
- Redirige a login con `?error=no_access` si no tiene rol

### 4️⃣ Login Page
- Detecta parámetro `?error=no_access`
- Muestra mensaje específico de "sin permisos"

---

## 📊 Tipos de Usuarios

| Usuario                      | Rol            | Acceso al PMS |
|------------------------------|----------------|---------------|
| Parker (app móvil)           | Sin rol        | ❌            |
| Spotter (app móvil)          | Sin rol        | ❌            |
| Propietario de estacionamiento| `propietario` | ✅            |
| Admin de propietario         | `admin`        | ✅            |
| Super Admin de Parkit        | `super_admin`  | ✅            |

---

## 🎯 Siguiente Paso: Explorar el Dashboard

Una vez que hagas login, verás:

1. **Dashboard Principal** (`/dashboard`):
   - Resumen de tus estacionamientos
   - Estadísticas de reservas
   - Ingresos del mes
   - Gráficos de ocupación

2. **Menú de Navegación**:
   - 📊 Dashboard
   - 🅿️ Mis Estacionamientos
   - 📅 Reservas
   - ⭐ Reseñas
   - 💰 Mercado Pago
   - 👤 Perfil

---

## 🆘 Problemas Comunes

### ❌ "No tienes permisos para acceder"
**Solución**: Ejecuta el script SQL del **PASO 1** para asignar el rol.

### ❌ "Invalid login credentials"
**Solución**: Verifica que estés usando la contraseña correcta de tu cuenta de Parkit.

### ❌ El server no levanta
**Solución**: 
```bash
cd /Users/juanfcpiccolo/Documents/Personal/PMS
npm run dev
```

---

## 📁 Archivos Relacionados

- `ASIGNAR_ROL_USUARIO.sql` - Script para asignar roles
- `SEGURIDAD_PMS.md` - Documentación completa de seguridad
- `CREAR_USUARIO_PRUEBA.md` - Crear usuarios de prueba

---

¡Ya estás listo para usar el PMS! 🎉

