# 🧪 CREAR USUARIO Y ASIGNAR ROL PARA ACCEDER AL PMS

## ⚠️ IMPORTANTE: SEGURIDAD DEL PMS

**El PMS NO permite acceso a usuarios comunes de Parkit.**

Solo pueden acceder usuarios con rol en `user_roles`:
- ✅ **Propietarios** de estacionamientos
- ✅ **Admins** del sistema
- ✅ **Super Admins** de Parkit

---

## 🚀 SOLUCIÓN RÁPIDA: Asignar rol a tu usuario existente

Si ya tienes una cuenta de Parkit (Parker o Spotter), simplemente necesitas asignarle un rol de **propietario** para acceder al PMS.

### Ejecuta este SQL en Supabase:

```sql
-- Asignar rol de propietario a juanfcastropiccolo@gmail.com
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

**Una vez ejecutado, podrás hacer login con tu cuenta de Gmail.**

---

## Opción 1: Registro desde la aplicación + Asignación manual de rol

### Paso 1: Ir a la página de registro
1. En la página de login, haz clic en **"Regístrate aquí"** (abajo del todo)
2. Completa el formulario:
   - Email: `test@parkit.com` (o el que quieras)
   - Contraseña: mínimo 6 caracteres

### Paso 2: Verificar email
Supabase enviará un email de confirmación. Tienes dos opciones:

**A) Desactivar confirmación de email (para desarrollo)**
```sql
-- Ejecutar en Supabase SQL Editor
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email = 'test@parkit.com';
```

**B) Buscar el email en Supabase**
1. Ve a Supabase Dashboard
2. **Authentication > Users**
3. Encuentra tu usuario
4. Click en "..." > "Confirm Email"

### Paso 3: Asignar rol de propietario
**⚠️ PASO OBLIGATORIO: Sin este paso NO podrás hacer login**

```sql
-- 1. Obtener el user_id del usuario que acabas de crear
SELECT id, email FROM auth.users WHERE email = 'test@parkit.com';

-- 2. Asignar rol de propietario (reemplaza USER_ID_AQUI con el ID obtenido)
INSERT INTO public.user_roles (user_id, role, permissions, asignado_at)
VALUES (
  'USER_ID_AQUI',
  'propietario',
  '[]'::jsonb,
  NOW()
);
```

---

## Opción 2: Crear directamente en SQL (Más rápido)

### Script completo para crear usuario de prueba:

```sql
-- 1. Crear usuario en auth.users (Supabase Auth)
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'test@parkit.com',
  crypt('test123456', gen_salt('bf')),  -- Contraseña: test123456
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"nombre":"Usuario Prueba"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- 2. Asignar rol de propietario
INSERT INTO public.user_roles (user_id, role, permissions, asignado_at)
SELECT id, 'propietario', '[]'::jsonb, NOW()
FROM auth.users 
WHERE email = 'test@parkit.com';
```

**Credenciales:**
- Email: `test@parkit.com`
- Contraseña: `test123456`

---

## Opción 3: Crear Super Admin (para probar panel admin)

```sql
-- Crear super admin
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@parkit.com',
  crypt('admin123456', gen_salt('bf')),  -- Contraseña: admin123456
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"nombre":"Admin Parkit"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- Asignar rol de super_admin
INSERT INTO public.user_roles (user_id, role, permissions, asignado_at)
SELECT id, 'super_admin', '[]'::jsonb, NOW()
FROM auth.users 
WHERE email = 'admin@parkit.com';
```

**Credenciales Admin:**
- Email: `admin@parkit.com`
- Contraseña: `admin123456`

---

## 🚀 PASOS PARA CREAR EL USUARIO

### Método Rápido (SQL):

1. Ve a **Supabase Dashboard**
2. Click en **SQL Editor**
3. Copia y pega el script de la **Opción 2**
4. Click en **Run**
5. ¡Listo! Ahora puedes hacer login con:
   - Email: `test@parkit.com`
   - Contraseña: `test123456`

---

## ✅ VERIFICAR QUE FUNCIONA

Después de crear el usuario:

1. Ve a http://localhost:3000/auth/login
2. Ingresa las credenciales:
   - Email: `test@parkit.com`
   - Contraseña: `test123456`
3. Click en "Iniciar Sesión"
4. Deberías ser redirigido al dashboard 🎉

---

## 🔧 TROUBLESHOOTING

### Error: "Invalid login credentials"
- Verifica que el usuario existe en `auth.users`
- Verifica que `email_confirmed_at` no sea NULL

### Error: No me redirige al dashboard
- Verifica que el usuario tiene un rol en `user_roles`
- Mira la consola del navegador para errores

---

## 📝 NOTA

Para desarrollo, es más fácil usar el **Método Rápido (SQL)** porque:
- No necesitas confirmar email
- Creas el usuario y el rol en un solo paso
- Puedes crear múltiples usuarios de prueba rápidamente

¡Disfruta probando el PMS! 🎉

