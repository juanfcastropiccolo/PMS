# 🚀 INSTRUCCIONES DE SETUP - PMS

## ⚠️ PASO CRÍTICO: Crear archivo `.env.local`

**DEBES hacer esto AHORA antes de ejecutar la aplicación:**

### 1. Crear el archivo `.env.local`

En la raíz del proyecto (`/Users/juanfcpiccolo/Documents/Personal/PMS/`), crea un archivo llamado `.env.local` con el siguiente contenido:

```bash
# Supabase Configuration
# Obtener desde: https://app.supabase.com/project/_/settings/api
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=tu_supabase_service_role_key_aqui

# Mercado Pago Configuration (opcional por ahora)
NEXT_PUBLIC_MERCADO_PAGO_CLIENT_ID=tu_mp_client_id_aqui
MERCADO_PAGO_CLIENT_SECRET=tu_mp_client_secret_aqui
MERCADO_PAGO_REDIRECT_URI=http://localhost:3000/api/mercadopago/callback

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Obtener las credenciales de Supabase

1. Ve a https://app.supabase.com/
2. Selecciona tu proyecto de Parkit
3. Ve a **Settings > API**
4. Copia:
   - **Project URL** → pégala en `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → pégala en `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → pégala en `SUPABASE_SERVICE_ROLE_KEY`

### 3. Verificar que el archivo existe

```bash
ls -la /Users/juanfcpiccolo/Documents/Personal/PMS/.env.local
```

Si el comando anterior NO muestra el archivo, créalo con:

```bash
cd /Users/juanfcpiccolo/Documents/Personal/PMS
touch .env.local
open .env.local  # Esto abrirá el archivo en tu editor
```

Luego copia y pega el contenido del paso 1, reemplazando los valores.

---

## 🎯 Después de crear `.env.local`

### 4. Ejecutar la aplicación

```bash
cd /Users/juanfcpiccolo/Documents/Personal/PMS
npm run dev
```

### 5. Abrir el navegador

Ve a http://localhost:3000

---

## ✅ CHECKLIST

- [ ] Archivo `.env.local` creado en `/Users/juanfcpiccolo/Documents/Personal/PMS/`
- [ ] Variables de Supabase configuradas
- [ ] `npm run dev` ejecutándose sin errores
- [ ] Navegador abierto en http://localhost:3000
- [ ] Puedes ver la página de login

---

## 🆘 Si hay errores

### Error: "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY env variables required"

**Causa:** El archivo `.env.local` no existe o no tiene las variables correctas.

**Solución:** Vuelve al paso 1 y asegúrate de crear el archivo con el contenido correcto.

### Error: "Module not found"

**Causa:** Falta alguna dependencia.

**Solución:**
```bash
cd /Users/juanfcpiccolo/Documents/Personal/PMS
npm install --legacy-peer-deps
```

---

## 📝 NOTA IMPORTANTE

El archivo `.env.local` NO se sube a Git (está en `.gitignore`) por seguridad. Por eso debes crearlo manualmente cada vez que clones el proyecto en una nueva máquina.

---

**¡Listo!** Si seguiste todos los pasos, la aplicación debería estar funcionando. 🎉

