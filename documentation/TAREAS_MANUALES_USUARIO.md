# ⚠️ TAREAS MANUALES - CONFIGURACIONES FUERA DE CURSOR

> **IMPORTANTE**: Estas tareas DEBES hacerlas TÚ manualmente, no se pueden automatizar desde Cursor.

---

## 📋 CHECKLIST DE TAREAS MANUALES

### ✅ FASE 0: CONFIGURACIÓN INICIAL

#### 1. Instalar Dependencias del Proyecto

**⚠️ Si tienes error de permisos en la caché de npm, ejecuta primero:**

```bash
sudo chown -R $(whoami) ~/.npm
npm cache clean --force
```

**Luego instala las dependencias:**

```bash
cd /Users/juanfcpiccolo/Documents/Personal/PMS
npm install
```

**Tiempo estimado:** 5-10 minutos

---

#### 2. Configurar Variables de Entorno

1. **Copiar el archivo de ejemplo:**
   ```bash
   cp env.example .env.local
   ```

2. **Editar `.env.local`** y completar con tus credenciales reales:

**⚠️ NO COMPARTAS ESTE ARCHIVO EN GIT**

---

### ✅ SUPABASE - CONFIGURACIÓN COMPLETA

#### 3. Crear Proyecto en Supabase

1. Ve a https://supabase.com
2. Clic en "New Project"
3. Completa:
   - **Name:** parkit-pms
   - **Database Password:** [GUARDA ESTA CONTRASEÑA]
   - **Region:** South America (São Paulo) - más cercano a Argentina
   - **Pricing Plan:** Free (para desarrollo)
4. Espera 2-3 minutos a que se cree el proyecto

**Tiempo estimado:** 5 minutos

---

#### 4. Obtener Credenciales de Supabase

1. En tu proyecto de Supabase, ve a **Settings** > **API**
2. Copia las siguientes credenciales:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key (⚠️ SECRETO) → `SUPABASE_SERVICE_ROLE_KEY`

3. Pégalas en tu archivo `.env.local`

**Tiempo estimado:** 2 minutos

---

#### 5. Ejecutar Scripts SQL en Supabase

**⚠️ CRÍTICO: Debes ejecutar los scripts EN ORDEN**

1. Ve a tu proyecto de Supabase
2. Abre el **SQL Editor** (icono de base de datos en el menú lateral)
3. Crea una nueva query
4. Abre el archivo `10_SCRIPTS_SQL_COMPLETOS.md` de la documentación
5. **Copia y pega cada script UNO POR UNO** en el SQL Editor
6. Ejecuta cada script presionando **RUN** o `Ctrl+Enter`
7. Verifica que no haya errores antes de continuar con el siguiente

**Orden de ejecución:**

```
✅ Script 1:  Función update_updated_at_column()
✅ Script 2:  Enums y tipos
✅ Script 3:  Tabla estacionamientos
✅ Script 4:  Tabla fotos_estacionamiento
✅ Script 5:  Tabla reservas_estacionamiento
✅ Script 6:  Tabla kyc_submissions
✅ Script 7:  Tabla user_roles
✅ Script 8:  Tabla resenas_estacionamiento
✅ Script 9:  Tabla notificaciones
✅ Script 10: Tabla audit_log
✅ Script 11: Tabla mp_accounts_propietarios
✅ Script 12: Funciones de negocio
✅ Script 13: Triggers
✅ Script 14: Vistas
✅ Script 15: RLS Policies
✅ Script 16: Storage Buckets
✅ Script 17: Datos iniciales (opcional)
```

**Tiempo estimado:** 30-40 minutos

**⚠️ SI ALGO FALLA:**
- Lee el mensaje de error
- Verifica que ejecutaste los scripts anteriores
- Consulta la sección "Rollback" en `10_SCRIPTS_SQL_COMPLETOS.md`

---

#### 6. Verificar Creación de Tablas

En el SQL Editor de Supabase, ejecuta:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

**Deberías ver:**
- audit_log
- estacionamientos
- fotos_estacionamiento
- kyc_submissions
- mp_accounts_propietarios
- notificaciones
- resenas_estacionamiento
- reservas_estacionamiento
- user_roles

**Si falta alguna tabla:** Revisa los errores en la ejecución de scripts.

**Tiempo estimado:** 2 minutos

---

#### 7. Verificar RLS (Row Level Security)

En el SQL Editor, ejecuta:

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

**Todas las tablas deben tener `rowsecurity = true`**

**Tiempo estimado:** 1 minuto

---

#### 8. Configurar Storage Buckets

1. Ve a **Storage** en el menú lateral de Supabase
2. Verifica que existan los buckets:
   - `estacionamientos` (público)
   - `kyc-documents` (privado)

**Si no existen:** Ejecuta nuevamente el Script 16 (Storage Buckets)

**Tiempo estimado:** 2 minutos

---

### ✅ MERCADO PAGO - CONFIGURACIÓN

#### 9. Crear Aplicación en Mercado Pago

1. Ve a https://www.mercadopago.com.ar/developers/panel/app
2. Inicia sesión con tu cuenta de Mercado Pago
3. Clic en **"Crear aplicación"**
4. Completa:
   - **Nombre de la aplicación:** Parkit PMS
   - **Descripción:** Sistema de gestión de estacionamientos
   - **Modelo de integración:** Marketplace
5. Guarda la aplicación

**Tiempo estimado:** 5 minutos

---

#### 10. Obtener Credenciales de Mercado Pago

**Para DESARROLLO (Sandbox):**

1. En tu aplicación, ve a **Credenciales**
2. Selecciona **Credenciales de prueba**
3. Copia:
   - **Public Key** → `NEXT_PUBLIC_MP_PUBLIC_KEY` (debe empezar con `TEST-`)
   - **Access Token** → `MP_ACCESS_TOKEN` (debe empezar con `TEST-`)
   - **Client ID** → `MP_CLIENT_ID`
   - **Client Secret** → `MP_CLIENT_SECRET`

4. Pégalas en tu archivo `.env.local`

**Para PRODUCCIÓN (cuando estés listo):**
- Usa las **Credenciales de producción** en lugar de las de prueba

**Tiempo estimado:** 3 minutos

---

#### 11. Configurar OAuth Redirect URI

1. En tu aplicación de Mercado Pago, ve a **Configuración**
2. Busca **Redirect URI**
3. Agrega:
   - **Desarrollo:** `http://localhost:3000/api/mercadopago/callback`
   - **Producción:** `https://tu-dominio.com/api/mercadopago/callback`

4. Guarda los cambios

**Tiempo estimado:** 2 minutos

---

#### 12. Configurar Webhooks de Mercado Pago

1. En tu aplicación de Mercado Pago, ve a **Webhooks**
2. Clic en **Configurar webhooks**
3. Agrega:
   - **URL de producción:** `https://tu-dominio.com/api/webhooks/mercadopago`
   - **Eventos:** Selecciona `payment` y `merchant_order`

**⚠️ IMPORTANTE:**
- Para desarrollo local, necesitarás usar **ngrok** o **localtunnel** para exponer tu localhost
- Comando ngrok: `ngrok http 3000`
- Luego usa la URL de ngrok en la configuración del webhook

4. Copia el **Webhook Secret** y pégalo en `MP_WEBHOOK_SECRET` en tu `.env.local`

**Tiempo estimado:** 5 minutos

---

### ✅ GOOGLE PLACES API

#### 13. Crear Proyecto en Google Cloud Console

1. Ve a https://console.cloud.google.com
2. Crea un nuevo proyecto: **Parkit PMS**
3. Habilita la API:
   - Ve a **APIs & Services** > **Library**
   - Busca "Places API"
   - Clic en **Enable**

**Tiempo estimado:** 5 minutos

---

#### 14. Crear API Key para Google Places

1. Ve a **APIs & Services** > **Credentials**
2. Clic en **Create Credentials** > **API Key**
3. Copia la API Key
4. **IMPORTANTE:** Restringe la API Key:
   - Clic en la API Key creada
   - En **Application restrictions**, selecciona **HTTP referrers**
   - Agrega:
     - `http://localhost:3000/*`
     - `https://tu-dominio.com/*`
   - En **API restrictions**, selecciona **Restrict key**
   - Selecciona solo **Places API**
   - Guarda

5. Pega la API Key en `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY` en tu `.env.local`

**Tiempo estimado:** 5 minutos

---

### ✅ CONFIGURACIÓN DE EMAIL (OPCIONAL)

#### 15. Configurar SMTP (Gmail recomendado)

**Si quieres enviar emails desde el PMS:**

1. **Opción A: Gmail**
   - Ve a https://myaccount.google.com/security
   - Habilita **2-Step Verification**
   - Ve a **App passwords**
   - Genera una contraseña para "Mail"
   - Usa esa contraseña en `SMTP_PASSWORD`

2. **Opción B: SendGrid (recomendado para producción)**
   - Crea cuenta en https://sendgrid.com
   - Genera API Key
   - Usa las credenciales de SendGrid

**Tiempo estimado:** 10 minutos

---

### ✅ CREAR USUARIO ADMIN INICIAL

#### 16. Crear Tu Usuario Admin en Supabase

**Método 1: Desde Supabase Dashboard**

1. Ve a **Authentication** > **Users** en Supabase
2. Clic en **Add user**
3. Completa:
   - **Email:** tu-email@ejemplo.com
   - **Password:** [contraseña segura]
   - **Auto Confirm User:** ✅ Activado
4. Clic en **Create user**
5. Copia el **User ID** (UUID)

**Método 2: Desde SQL Editor**

```sql
-- Crear usuario admin
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
  crypt('TuContraseñaSegura123', gen_salt('bf')),
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
```

**Tiempo estimado:** 3 minutos

---

#### 17. Asignar Rol de Admin

En el SQL Editor de Supabase:

```sql
-- Reemplaza 'TU-USER-ID' con el UUID del usuario creado
INSERT INTO user_roles (user_id, role, permissions, asignado_at)
VALUES (
  'TU-USER-ID',
  'super_admin',
  '[]'::jsonb,
  NOW()
);
```

**Tiempo estimado:** 1 minuto

---

### ✅ EJECUTAR EL PROYECTO

#### 18. Iniciar el Servidor de Desarrollo

```bash
cd /Users/juanfcpiccolo/Documents/Personal/PMS
npm run dev
```

Abre http://localhost:3000 en tu navegador.

**Deberías ver:** La página de login de Parkit PMS

**Tiempo estimado:** 2 minutos

---

#### 19. Verificar que Todo Funciona

**Checklist de verificación:**

- [ ] Puedes acceder a http://localhost:3000
- [ ] La página de login se muestra correctamente
- [ ] Puedes iniciar sesión con tu usuario admin
- [ ] Te redirige al dashboard correcto (admin o propietario)
- [ ] No hay errores en la consola del navegador
- [ ] No hay errores en la terminal donde corre `npm run dev`

**Si algo falla:**
- Revisa la consola del navegador (F12)
- Revisa la terminal donde corre el servidor
- Verifica que todas las variables de entorno estén correctas
- Verifica que todos los scripts SQL se ejecutaron correctamente

---

### ✅ DEPLOYMENT A PRODUCCIÓN (CUANDO ESTÉS LISTO)

#### 20. Configurar Vercel

1. Ve a https://vercel.com
2. Conecta tu repositorio de GitHub
3. Importa el proyecto
4. Configura las variables de entorno (las mismas de `.env.local`)
5. Deploy

**Tiempo estimado:** 10 minutos

---

#### 21. Configurar Dominio Personalizado (Opcional)

1. En Vercel, ve a **Settings** > **Domains**
2. Agrega tu dominio
3. Configura los DNS según las instrucciones de Vercel

**Tiempo estimado:** 15 minutos (+ tiempo de propagación DNS)

---

## 📊 RESUMEN DE TIEMPO TOTAL

| Tarea | Tiempo Estimado |
|-------|-----------------|
| Instalación de dependencias | 10 min |
| Configuración de Supabase | 45 min |
| Ejecución de scripts SQL | 40 min |
| Configuración de Mercado Pago | 15 min |
| Configuración de Google Places | 10 min |
| Configuración de Email (opcional) | 10 min |
| Creación de usuario admin | 5 min |
| Verificación y testing | 10 min |
| **TOTAL** | **2-3 horas** |

---

## 🆘 SOPORTE Y TROUBLESHOOTING

### Problemas Comunes

#### Error: "Missing Supabase environment variables"
**Solución:** Verifica que `.env.local` existe y tiene las variables correctas.

#### Error: "relation does not exist"
**Solución:** Ejecuta los scripts SQL en el orden correcto.

#### Error: "RLS policy violation"
**Solución:** Verifica que las RLS policies se crearon correctamente (Script 15).

#### Error en OAuth de Mercado Pago
**Solución:** Verifica que el Redirect URI esté configurado correctamente en MP.

#### Error en webhooks de Mercado Pago
**Solución:** Para desarrollo local, usa ngrok para exponer tu localhost.

---

## 📞 CONTACTOS ÚTILES

- **Documentación Supabase:** https://supabase.com/docs
- **Documentación Mercado Pago:** https://www.mercadopago.com.ar/developers
- **Documentación Google Places:** https://developers.google.com/maps/documentation/places
- **Soporte Next.js:** https://nextjs.org/docs

---

## ✅ CHECKLIST FINAL

Marca cada item cuando lo completes:

### Configuración Base
- [ ] Dependencias instaladas (`npm install`)
- [ ] Archivo `.env.local` creado y completado
- [ ] Proyecto de Supabase creado
- [ ] Credenciales de Supabase obtenidas

### Base de Datos
- [ ] Script 1 ejecutado (función update_updated_at)
- [ ] Script 2 ejecutado (enums y tipos)
- [ ] Script 3 ejecutado (tabla estacionamientos)
- [ ] Script 4 ejecutado (tabla fotos_estacionamiento)
- [ ] Script 5 ejecutado (tabla reservas_estacionamiento)
- [ ] Script 6 ejecutado (tabla kyc_submissions)
- [ ] Script 7 ejecutado (tabla user_roles)
- [ ] Script 8 ejecutado (tabla resenas_estacionamiento)
- [ ] Script 9 ejecutado (tabla notificaciones)
- [ ] Script 10 ejecutado (tabla audit_log)
- [ ] Script 11 ejecutado (tabla mp_accounts_propietarios)
- [ ] Script 12 ejecutado (funciones de negocio)
- [ ] Script 13 ejecutado (triggers)
- [ ] Script 14 ejecutado (vistas)
- [ ] Script 15 ejecutado (RLS policies)
- [ ] Script 16 ejecutado (storage buckets)
- [ ] Tablas verificadas
- [ ] RLS verificado
- [ ] Storage buckets verificados

### Integraciones
- [ ] Aplicación de Mercado Pago creada
- [ ] Credenciales de MP obtenidas (sandbox)
- [ ] OAuth Redirect URI configurado
- [ ] Webhooks configurados
- [ ] Proyecto de Google Cloud creado
- [ ] Places API habilitada
- [ ] API Key de Google Places obtenida y restringida
- [ ] SMTP configurado (opcional)

### Usuarios
- [ ] Usuario admin creado
- [ ] Rol de admin asignado

### Testing
- [ ] Servidor de desarrollo iniciado (`npm run dev`)
- [ ] Login funciona
- [ ] Dashboard se muestra
- [ ] Sin errores en consola

### Producción (cuando estés listo)
- [ ] Repositorio en GitHub
- [ ] Proyecto en Vercel
- [ ] Variables de entorno configuradas en Vercel
- [ ] Deploy exitoso
- [ ] Dominio configurado (opcional)
- [ ] Credenciales de producción de MP configuradas
- [ ] Webhooks de producción configurados

---

## 🎉 ¡FELICITACIONES!

Si completaste todos los items del checklist, tu PMS está listo para usar.

**Próximos pasos:**
1. Familiarízate con el dashboard
2. Crea tu primer estacionamiento de prueba
3. Prueba el flujo completo de aprobación
4. Configura tu cuenta de Mercado Pago
5. Invita a propietarios reales

---

**Última actualización:** Diciembre 2025  
**Versión:** 1.0

