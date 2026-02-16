# Plan de Corrección — Deploy en Vercel (PMS)

**Fecha**: 16 de febrero de 2026  
**Estado actual**: Build falla con exit code 1  
**Causa raíz del fallo**: Error de tipos en `src/app/api/auth/check-role/route.ts:30`

---

## Resumen Ejecutivo

El build de Next.js falla por **1 error crítico de TypeScript** (type error). Además, existen **~50 warnings de ESLint** que no bloquean el build pero indican deuda técnica, y **2 paquetes deprecados** que generan warnings de Edge Runtime.

---

## 1. ERROR CRÍTICO (Bloquea el Build) 🔴

### 1.1 Type Error: `Property 'role' does not exist on type 'never'`

**Archivo**: `src/app/api/auth/check-role/route.ts`, línea 30  
**Error exacto**:
```
Type error: Property 'role' does not exist on type 'never'.
```

**Causa raíz**:  
El cliente Supabase admin se crea con `createClient<Database>(...)`. Cuando se hace `.from('user_roles').select('role').eq('user_id', userId)`, la versión actual de `@supabase/supabase-js` (^2.39.0) no infiere correctamente el tipo de retorno para el `.select('role')` con columna específica, resultando en que `roles` se tipea como `never[]`.

**Código actual (líneas 20-30)**:
```typescript
const { data: roles, error } = await admin
  .from('user_roles')
  .select('role')
  .eq('user_id', userId);

// ...
const rolesList = roles?.map((r) => r.role) || [];  // ← ERROR AQUÍ: r es 'never'
```

**Solución propuesta**:  
Agregar `.returns<>()` para indicar explícitamente el tipo de retorno:

```typescript
const { data: roles, error } = await admin
  .from('user_roles')
  .select('role')
  .eq('user_id', userId)
  .returns<{ role: string }[]>();

// ...
const rolesList = roles?.map((r) => r.role) || [];
```

**Alternativa** (si `.returns<>()` no funciona con esta versión):  
Cambiar a `.select('*')` que tiene mejor inferencia de tipos:

```typescript
const { data: roles, error } = await admin
  .from('user_roles')
  .select('*')
  .eq('user_id', userId);

// ...
const rolesList = roles?.map((r) => r.role) || [];
```

---

## 2. WARNINGS DE EDGE RUNTIME (No bloquean, pero importantes) 🟡

### 2.1 Paquetes deprecados: `@supabase/auth-helpers-nextjs`

**Warnings del build**:
```
npm warn deprecated @supabase/auth-helpers-shared@0.7.0: use @supabase/ssr instead
npm warn deprecated @supabase/auth-helpers-nextjs@0.10.0: use @supabase/ssr instead
```

**Y warnings de Edge Runtime**:
```
A Node.js API is used (process.versions) which is not supported in the Edge Runtime.
```

Estos warnings aparecen porque:
- `src/middleware.ts` usa `createMiddlewareClient` de `@supabase/auth-helpers-nextjs`
- `src/lib/supabaseClient.ts` usa `createClientComponentClient` de `@supabase/auth-helpers-nextjs`

**Acción recomendada** (NO urgente, se puede hacer post-deploy):  
Migrar de `@supabase/auth-helpers-nextjs` a `@supabase/ssr`. Esto implica:

1. Instalar: `npm install @supabase/ssr`
2. Desinstalar: `npm uninstall @supabase/auth-helpers-nextjs`
3. Actualizar `src/lib/supabaseClient.ts`:
   ```typescript
   import { createBrowserClient } from '@supabase/ssr';
   export const supabase = createBrowserClient<Database>(
     process.env.NEXT_PUBLIC_SUPABASE_URL!,
     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
   );
   ```
4. Actualizar `src/middleware.ts`:
   ```typescript
   import { createServerClient } from '@supabase/ssr';
   // Usar createServerClient con cookies del request
   ```
5. Actualizar `next.config.js` para usar `NEXT_PUBLIC_` prefix correctamente.

**Nota**: Esta migración es más compleja y se recomienda hacerla en un branch separado después del deploy inicial. No bloquea el build.

---

## 3. WARNINGS DE ESLINT (No bloquean el build) 🟠

Los warnings están configurados como `"warn"` en `.eslintrc.json`, por lo que **no bloquean el build**. Sin embargo, conviene limpiarlos por calidad de código.

### 3.1 `@typescript-eslint/no-explicit-any` (~25 warnings)

**Archivos afectados**:
| Archivo | Líneas |
|---------|--------|
| `src/app/auth/login/page.tsx` | 47, 160 |
| `src/app/auth/register/page.tsx` | 65 |
| `src/app/auth/reset-password/page.tsx` | 33 |
| `src/app/auth/update-password/page.tsx` | 36 |
| `src/app/dashboard/cobros/page.tsx` | 239, 274, 329, 365, 704 |
| `src/app/dashboard/estacionamientos/[id]/editar/page.tsx` | 153, 161, 168, 249 |
| `src/app/dashboard/estacionamientos/[id]/page.tsx` | 44, 86, 430 |
| `src/app/dashboard/estacionamientos/nuevo/page.tsx` | 141, 148, 241 |
| `src/app/dashboard/ingresos/page.tsx` | 154, 157, 160, 163, 166, 209, 255, 295, 494 |
| `src/app/dashboard/page.tsx` | 98, 140, 148, 196, 235 |
| `src/app/dashboard/perfil/page.tsx` | 159, 199 |
| `src/app/dashboard/resenas/page.tsx` | 67, 139 |
| `src/components/AvatarUpload.tsx` | 83 |
| `src/components/ImageUpload.tsx` | 91 |
| `src/lib/auth/authService.ts` | 11, 100, 172 |
| `src/lib/auth/roleService.ts` | 9 |
| `src/types/database.ts` | 248 |

**Solución**: Reemplazar `any` por tipos apropiados (ej: `unknown`, `Error`, tipos específicos de Supabase, etc.). La mayoría son en bloques `catch` donde se puede usar `unknown` o `Error`.

### 3.2 `@typescript-eslint/no-unused-vars` (~10 warnings)

| Archivo | Variable no usada | Línea |
|---------|-------------------|-------|
| `src/app/dashboard/cobros/page.tsx` | `Tooltip` | 34 |
| `src/app/dashboard/cobros/page.tsx` | `EditOutlined` | 47 |
| `src/app/dashboard/estacionamientos/[id]/page.tsx` | `Avatar` | 18 |
| `src/app/dashboard/estacionamientos/nuevo/page.tsx` | `IconButton` | 26 |
| `src/app/dashboard/estacionamientos/nuevo/page.tsx` | `AddIcon` | 30 |
| `src/app/dashboard/estacionamientos/nuevo/page.tsx` | `DeleteIcon` | 31 |
| `src/app/dashboard/estacionamientos/nuevo/page.tsx` | `data` (asignada pero no usada) | 214 |
| `src/app/dashboard/ingresos/page.tsx` | `Divider` | 24 |
| `src/app/dashboard/ingresos/page.tsx` | `BarChart`, `Bar` | 35 |
| `src/app/dashboard/ingresos/page.tsx` | `COMISION_PARKIT` | 76 |
| `src/app/dashboard/layout.tsx` | `PaymentOutlined` | 29 |
| `src/app/dashboard/resenas/page.tsx` | `Alert` | 27 |
| `src/contexts/AuthContext.tsx` | `SupabaseUser` | 4 |

**Solución**: Eliminar los imports y variables no utilizados.

### 3.3 `react-hooks/exhaustive-deps` (~8 warnings)

| Archivo | Dependencia faltante | Línea |
|---------|---------------------|-------|
| `src/app/dashboard/cobros/page.tsx` | `loadData` | 141 |
| `src/app/dashboard/estacionamientos/[id]/editar/page.tsx` | `loadEstacionamiento` | 111 |
| `src/app/dashboard/estacionamientos/[id]/page.tsx` | `loadEstacionamiento` | 73 |
| `src/app/dashboard/estacionamientos/page.tsx` | `loadEstacionamientos` | 42 |
| `src/app/dashboard/finanzas/page.tsx` | `loadFinanzas` | 38 |
| `src/app/dashboard/ingresos/page.tsx` | `loadData` | 100 |
| `src/app/dashboard/page.tsx` | `loadDashboardData`, `loadIngresosDiarios` | 78, 84 |
| `src/app/dashboard/perfil/page.tsx` | `loadUserProfile` | 76 |
| `src/app/dashboard/resenas/page.tsx` | `loadData` | 75 |
| `src/app/dashboard/reservas/page.tsx` | `loadReservas` | 46 |

**Solución**: Envolver las funciones de carga en `useCallback` y agregarlas como dependencias, o deshabilitar la regla selectivamente con `// eslint-disable-next-line react-hooks/exhaustive-deps` si la carga solo debe ocurrir una vez al montar.

---

## 4. OBSERVACIONES ADICIONALES ⚪

### 4.1 Tabla `users` no definida en types

En `src/lib/auth/authService.ts` línea 114:
```typescript
const { error: userError } = await supabase.from('users').insert({...});
```

La tabla `users` no está definida en `src/types/database.ts`. Esto no bloquea el build actual pero puede causar problemas de tipado. Se debería agregar la definición de esta tabla al type `Database`.

### 4.2 Variables de entorno en Vercel

Verificar que las siguientes variables de entorno estén configuradas en el panel de Vercel (Settings > Environment Variables):

- `SUPABASE_URL` ✅ (requerida)
- `SUPABASE_ANON_KEY` ✅ (requerida)
- `SUPABASE_SERVICE_ROLE_KEY` ✅ (requerida para API routes)
- `NEXT_PUBLIC_APP_URL` (recomendada)
- `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY` (si se usa Google Places)

**Importante**: `SUPABASE_URL` y `SUPABASE_ANON_KEY` se exponen al cliente via `next.config.js` sin el prefijo `NEXT_PUBLIC_`. Esto funciona pero no es la práctica recomendada por Next.js. Considerar renombrar a `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` en el futuro.

### 4.3 Paquetes npm deprecados (no bloquean)

Los siguientes paquetes tienen warnings de deprecación:
- `rimraf@3.0.2` → Actualizar a v4+
- `inflight@1.0.6` → Dependencia transitiva, se resuelve actualizando paquetes padre
- `glob@7.2.3` → Actualizar a v9+
- `eslint@8.57.1` → Actualizar a ESLint 9 (requiere cambios de config)

Estos se resolverán automáticamente al actualizar dependencias. No urgente.

---

## 5. PLAN DE EJECUCIÓN (Orden recomendado)

### Fase 1: Fix del Build (URGENTE) — ~5 minutos

| # | Acción | Archivo | Prioridad |
|---|--------|---------|-----------|
| 1 | Agregar `.returns<{ role: string }[]>()` al query de `user_roles` | `src/app/api/auth/check-role/route.ts` | 🔴 CRÍTICO |

**Solo con este cambio, el build debería pasar.**

### Fase 2: Limpieza de Warnings (RECOMENDADO) — ~30 minutos

| # | Acción | Archivos | Prioridad |
|---|--------|----------|-----------|
| 2 | Eliminar imports no usados | 7 archivos (ver 3.2) | 🟠 |
| 3 | Eliminar variable `SupabaseUser` no usada en AuthContext | `src/contexts/AuthContext.tsx` | 🟠 |
| 4 | Envolver funciones de carga en `useCallback` o agregar `eslint-disable` | 10 archivos (ver 3.3) | 🟠 |
| 5 | Reemplazar `any` por tipos específicos donde sea práctico | 16+ archivos (ver 3.1) | 🟠 |

### Fase 3: Mejoras Estructurales (POST-DEPLOY) — ~2 horas

| # | Acción | Archivos | Prioridad |
|---|--------|----------|-----------|
| 6 | Migrar de `@supabase/auth-helpers-nextjs` a `@supabase/ssr` | `middleware.ts`, `supabaseClient.ts`, `package.json` | 🟡 |
| 7 | Agregar tabla `users` a `database.ts` | `src/types/database.ts` | 🟡 |
| 8 | Normalizar variables de entorno con `NEXT_PUBLIC_` prefix | `next.config.js`, `.env`, archivos que las usan | 🟡 |

---

## 6. VERIFICACIÓN PRE-DEPLOY

Después de aplicar los cambios, ejecutar localmente:

```bash
# 1. Verificar que compila sin errores de tipos
npm run type-check

# 2. Verificar el build completo
npm run build

# 3. (Opcional) Verificar warnings de lint
npm run lint
```

Si `npm run build` pasa exitosamente, el deploy en Vercel debería funcionar.

---

## 7. RESUMEN

| Categoría | Cantidad | Bloquea Build? |
|-----------|----------|----------------|
| Errores de tipos (crítico) | 1 | ✅ SÍ |
| Warnings Edge Runtime | 2 | ❌ No |
| Warnings `no-explicit-any` | ~25 | ❌ No |
| Warnings `no-unused-vars` | ~10 | ❌ No |
| Warnings `exhaustive-deps` | ~8 | ❌ No |
| Paquetes deprecados | 4 | ❌ No |

**Acción mínima para deployar**: Corregir **1 solo archivo** (`check-role/route.ts`, línea 20-30).
