# 🔴 URGENTE: Arreglar Variables de Entorno

## Problema

Next.js requiere que las variables de entorno expuestas al cliente tengan el prefijo `NEXT_PUBLIC_`.

Tu archivo `.env` actual tiene:
```bash
SUPABASE_URL="..."
SUPABASE_ANON_KEY="..."
```

Pero Next.js necesita:
```bash
NEXT_PUBLIC_SUPABASE_URL="..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
```

---

## ✅ SOLUCIÓN RÁPIDA

### Opción 1: Editar tu archivo `.env` actual

Abre tu archivo `.env` y **cambia el nombre** de las variables:

**ANTES:**
```bash
# Supabase
SUPABASE_URL="https://hldpjshvcwlyjmqmugrf.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**DESPUÉS:**
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://hldpjshvcwlyjmqmugrf.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_SERVICE_ROLE_KEY="tu_service_role_key_aqui"
```

### Opción 2: Crear `.env.local` (Recomendado)

Crea un archivo `.env.local` (en lugar de `.env`) con:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="https://hldpjshvcwlyjmqmugrf.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhsZHBqc2h2Y3dseWptcW11Z3JmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg0ODgxMjAsImV4cCI6MjA2NDA2NDEyMH0.i6WLLryDeweBqCgi3xTYQYqnrGZoR1NSQjvn3H4ZOPM"
SUPABASE_SERVICE_ROLE_KEY="tu_service_role_key_de_supabase"

# Mercado Pago (opcional por ahora, lo configuraremos después)
NEXT_PUBLIC_MERCADO_PAGO_CLIENT_ID=""
MERCADO_PAGO_CLIENT_SECRET=""
MERCADO_PAGO_REDIRECT_URI="http://localhost:3000/api/mercadopago/callback"

# App Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## 📝 Dónde conseguir el Service Role Key

1. Ve a https://app.supabase.com/
2. Selecciona tu proyecto
3. Ve a **Settings > API**
4. Copia el **service_role key** (¡NO la compartas públicamente!)

---

## 🧹 Limpiar caché de Next.js

Después de cambiar las variables de entorno:

```bash
cd /Users/juanfcpiccolo/Documents/Personal/PMS
rm -rf .next
npm run dev
```

---

## ℹ️ Sobre Mercado Pago

**No te preocupes por Mercado Pago ahora**. Podemos dejarlo vacío o con valores temporales. La integración de Mercado Pago la haremos en una fase posterior.

Para localhost, puedes usar:
```bash
MERCADO_PAGO_REDIRECT_URI="http://localhost:3000/api/mercadopago/callback"
```

Cuando subas a producción, ahí sí necesitarás configurar el webhook con tu dominio real.

---

## ✅ CHECKLIST

- [ ] Cambié `SUPABASE_URL` por `NEXT_PUBLIC_SUPABASE_URL`
- [ ] Cambié `SUPABASE_ANON_KEY` por `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Agregué `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Eliminé la carpeta `.next` con `rm -rf .next`
- [ ] Ejecuté `npm run dev`
- [ ] ✨ La app arrancó sin errores

---

**¡Después de hacer estos cambios, la app debería funcionar!** 🚀

