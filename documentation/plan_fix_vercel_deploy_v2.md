# Plan de Corrección v2 — Deploy en Vercel (PMS)

**Fecha**: 16 de febrero de 2026  
**Error report analizado**: `documentation/error_report.txt`  
**Branch Vercel**: `main` (Commit: 7596946)  
**Estado actual del build**: Falla con exit code 1  

---

## Diagnóstico

### Lo que FUNCIONA

```
12:57:55.105  ✓ Compiled successfully
12:57:55.105    Linting and checking validity of types ...
```

**TypeScript compila exitosamente.** No hay errores de tipos. Los fixes anteriores (`.returns<>()`, tablas `Record<string, any>`, etc.) resolvieron todos los problemas de tipado.

### Lo que FALLA

```
12:58:00.046 Failed to compile.
12:58:00.052 ./src/app/api/auth/check-role/route.ts
12:58:00.052 1:1  Error: Definition for rule '@typescript-eslint/no-explicit-any' was not found.
12:58:00.053 1:1  Error: Definition for rule '@typescript-eslint/no-unused-vars' was not found.
```

**ESLint falla** porque NO ENCUENTRA las definiciones de las reglas `@typescript-eslint/no-explicit-any` y `@typescript-eslint/no-unused-vars`. Este error aparece en **TODOS los archivos .ts/.tsx** del proyecto (26 archivos), y al ser tratado como Error (no Warning), **bloquea el build completamente**.

---

## Análisis de Causa Raíz

### El problema: Configuración ESLint incompatible

**`.eslintrc.json` actual**:
```json
{
  "extends": ["next/core-web-vitals", "prettier"],
  "plugins": ["@typescript-eslint"],
  "rules": {
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

**`package.json` (devDependencies)**:
```json
"@typescript-eslint/eslint-plugin": "^7.2.0",  // ← Declarado
// "@typescript-eslint/parser": ???               // ← NO declarado
"eslint": "^8.56.0",
"eslint-config-next": "14.2.0",
```

**El problema es que**:

1. El plugin `@typescript-eslint/eslint-plugin@^7.2.0` requiere `@typescript-eslint/parser@^7.0.0` como peer dependency
2. `@typescript-eslint/parser` **NO está en devDependencies** del `package.json`
3. Localmente funciona porque `eslint-config-next@14.2.0` instala `@typescript-eslint/parser` como dependencia transitiva y npm lo "hoistea" al nivel raíz
4. **En Vercel** (fresh install, sin cache previo), npm puede resolver las dependencias de forma diferente, resultando en que el plugin no encuentra el parser y no puede registrar sus reglas
5. El error `"Definition for rule was not found"` es tratado como **ERROR** (no warning), bloqueando el build

### Por qué no falló antes

En el deploy anterior, el build fallaba ANTES de llegar a ESLint (por errores de TypeScript). Ahora que TypeScript compila, el build avanza a la etapa de linting donde se descubre este problema de configuración.

---

## Soluciones Propuestas (3 opciones, elegir UNA)

### Opción A: Arreglar la configuración de ESLint (RECOMENDADA)

**Esfuerzo**: ~5 minutos  
**Riesgo**: Bajo  
**Ventaja**: Mantiene el linting activo y las reglas que ya existían

#### Paso A.1: Agregar `@typescript-eslint/parser` a devDependencies

```bash
npm install --save-dev @typescript-eslint/parser@^7.2.0
```

Esto asegura que el parser esté como dependencia directa y siempre se instale en Vercel.

#### Paso A.2: Actualizar `.eslintrc.json` con parser explícito

```json
{
  "extends": [
    "next/core-web-vitals",
    "prettier"
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "project": false
  },
  "plugins": ["@typescript-eslint"],
  "rules": {
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

**Nota**: Se agrega `"parser"` explícitamente y `"parserOptions": { "project": false }` para evitar que busque un `tsconfig.json` específico (las reglas que usamos no requieren type-aware linting).

#### Paso A.3: Verificar localmente

```bash
npm run lint    # Debería mostrar solo warnings, no errors
npm run build   # Debería compilar exitosamente
```

---

### Opción B: Desactivar ESLint en el build de Vercel (MÁS RÁPIDA)

**Esfuerzo**: ~2 minutos  
**Riesgo**: Muy bajo  
**Ventaja**: Deploy inmediato, se puede correr lint por separado
**Desventaja**: No se ejecuta ESLint durante el build (es práctica común en proyectos que corren lint en CI/CD separado)

#### Paso B.1: Modificar `next.config.js`

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,  // ← Agregar esto
  },
  env: {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SUPABASE_URL: process.env.SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  },
};

module.exports = nextConfig;
```

**Nota**: Muchos proyectos Next.js en producción usan esta opción. El linting se ejecuta como paso separado en CI/CD, no durante el build.

---

### Opción C: Eliminar las reglas de @typescript-eslint (ALTERNATIVA)

**Esfuerzo**: ~3 minutos  
**Riesgo**: Bajo  
**Ventaja**: Simplifica la configuración
**Desventaja**: Se pierden los warnings de `no-explicit-any` y `no-unused-vars` de TypeScript

#### Paso C.1: Simplificar `.eslintrc.json`

```json
{
  "extends": [
    "next/core-web-vitals",
    "prettier"
  ],
  "rules": {
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

#### Paso C.2: Eliminar el plugin de devDependencies

```bash
npm uninstall @typescript-eslint/eslint-plugin
```

**Nota**: `eslint-config-next` ya incluye reglas básicas de TypeScript a través de sus propias dependencias. Las reglas `no-explicit-any` y `no-unused-vars` eran solo warnings y no son críticas.

---

## Recomendación

**Usar Opción A + Opción B combinadas**:

1. Aplicar la **Opción A** para que ESLint funcione correctamente (útil para desarrollo local con `npm run lint`)
2. Aplicar la **Opción B** (`ignoreDuringBuilds: true`) como red de seguridad para que el build en Vercel nunca falle por warnings de ESLint

Esto da la mejor experiencia: linting funcional en local + deploy robusto en Vercel.

---

## Warnings Adicionales (NO bloquean, contexto informativo)

### Warnings de `react-hooks/exhaustive-deps`

Aparecen en 10 archivos. Son **solo warnings** y NO bloquean el build una vez que se corrija el problema de ESLint. No requieren acción inmediata.

| Archivo | Dependencia faltante |
|---------|---------------------|
| `dashboard/cobros/page.tsx` | `loadData` |
| `dashboard/estacionamientos/[id]/editar/page.tsx` | `loadEstacionamiento` |
| `dashboard/estacionamientos/[id]/page.tsx` | `loadEstacionamiento` |
| `dashboard/estacionamientos/page.tsx` | `loadEstacionamientos` |
| `dashboard/finanzas/page.tsx` | `loadFinanzas` |
| `dashboard/ingresos/page.tsx` | `loadData` |
| `dashboard/page.tsx` | `loadDashboardData`, `loadIngresosDiarios` |
| `dashboard/perfil/page.tsx` | `loadUserProfile` |
| `dashboard/resenas/page.tsx` | `loadData` |
| `dashboard/reservas/page.tsx` | `loadReservas` |

**Para resolver a futuro**: Envolver las funciones en `useCallback` o agregar `// eslint-disable-next-line react-hooks/exhaustive-deps`.

### Warnings de Edge Runtime

```
A Node.js API is used (process.versions) which is not supported in the Edge Runtime.
```

Causado por `@supabase/auth-helpers-nextjs` (deprecado). Se resuelve migrando a `@supabase/ssr` (tarea para después del deploy).

### Warnings de npm (paquetes deprecados)

Paquetes deprecados en dependencias transitivas (`rimraf`, `inflight`, `glob`, `eslint@8`). No bloquean y se resuelven al actualizar dependencias mayores.

---

## Checklist Pre-Deploy

- [ ] Aplicar Opción A (agregar parser + actualizar `.eslintrc.json`)
- [ ] Aplicar Opción B (agregar `eslint.ignoreDuringBuilds: true` a `next.config.js`)
- [ ] Ejecutar `npm run lint` localmente → solo warnings, no errors
- [ ] Ejecutar `npm run build` localmente → build exitoso
- [ ] Verificar que los cambios estén en el branch que Vercel deploya (`main`)
- [ ] Verificar variables de entorno en Vercel Dashboard:
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`

---

## Resumen

| Categoría | Cantidad | Bloquea Build? | Acción |
|-----------|----------|----------------|--------|
| ESLint: reglas no encontradas | 26 archivos × 2 reglas | **SÍ** | Opción A + B |
| Warnings `exhaustive-deps` | 10 | No | Post-deploy |
| Warnings Edge Runtime | 2 | No | Migrar a `@supabase/ssr` |
| Paquetes deprecados | ~8 | No | Actualizar deps |

**Acción mínima para deployar**: 
- **1 archivo** a modificar: `.eslintrc.json` (Opción A) ó `next.config.js` (Opción B)
- **1 dependencia** a instalar: `@typescript-eslint/parser` (solo si Opción A)
