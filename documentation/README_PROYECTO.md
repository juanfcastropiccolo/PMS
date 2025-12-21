# 🅿️ Parkit PMS - Parking Management System

> Sistema de gestión web para propietarios de estacionamientos y administradores de la plataforma Parkit

---

## 📖 Descripción

**Parkit PMS** es una aplicación web administrativa que complementa la app móvil de Parkit, permitiendo:

- **A propietarios de estacionamientos**: Gestionar sus espacios privados/comerciales en el marketplace
- **Al equipo interno de Parkit**: Supervisar, aprobar y moderar contenidos de la plataforma

---

## 🚀 Stack Tecnológico

### Frontend
- **Next.js 14+** (App Router)
- **TypeScript 5.x**
- **Material-UI (MUI) v5**
- **React Hook Form + Zod** (validaciones)
- **Recharts** (gráficos)

### Backend
- **Supabase** (PostgreSQL + Auth + Storage + Realtime)
- **Edge Functions** (Deno runtime)

### Integraciones
- **Mercado Pago** (OAuth + Pagos)
- **Google Places API** (Autocompletado de direcciones)

### DevOps
- **Vercel** (Hosting)
- **GitHub** (Control de versiones)
- **Sentry** (Monitoreo de errores - opcional)

---

## 📁 Estructura del Proyecto

```
PMS/
├── src/
│   ├── app/                    # App Router de Next.js
│   │   ├── (auth)/            # Grupo de rutas de autenticación
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── reset-password/
│   │   ├── (dashboard)/       # Grupo de rutas del dashboard propietario
│   │   │   ├── dashboard/
│   │   │   ├── estacionamientos/
│   │   │   ├── reservas/
│   │   │   ├── finanzas/
│   │   │   └── perfil/
│   │   ├── (admin)/           # Grupo de rutas del admin
│   │   │   ├── admin/
│   │   │   ├── aprobaciones/
│   │   │   ├── usuarios/
│   │   │   └── transacciones/
│   │   ├── api/               # API Routes
│   │   │   ├── mercadopago/
│   │   │   └── webhooks/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/            # Componentes reutilizables
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── admin/
│   │   ├── estacionamientos/
│   │   ├── reservas/
│   │   ├── layout/
│   │   └── common/
│   ├── contexts/              # React Contexts
│   │   └── AuthContext.tsx
│   ├── lib/                   # Librerías y utilidades
│   │   ├── supabase.ts
│   │   ├── theme.ts
│   │   ├── auth/
│   │   ├── mercadopago/
│   │   └── utils/
│   ├── hooks/                 # Custom Hooks
│   │   ├── useAuth.ts
│   │   ├── useEstacionamientos.ts
│   │   └── useReservas.ts
│   ├── types/                 # Tipos de TypeScript
│   │   ├── database.ts
│   │   ├── estacionamiento.ts
│   │   └── reserva.ts
│   └── styles/
│       └── globals.css
├── public/                    # Archivos estáticos
├── supabase/                  # Migraciones de Supabase
│   └── migrations/
├── .env.example               # Template de variables de entorno
├── .env.local                 # Variables de entorno (NO COMMITEAR)
├── package.json
├── tsconfig.json
├── next.config.js
└── README.md
```

---

## 🛠️ Instalación y Configuración

### Prerrequisitos

- Node.js 18+ y npm
- Cuenta de Supabase
- Cuenta de Mercado Pago (para pagos)
- Cuenta de Google Cloud (para Places API)

### 1. Clonar el Repositorio

```bash
git clone https://github.com/tu-usuario/parkit-pms.git
cd parkit-pms
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar Variables de Entorno

```bash
cp env.example .env.local
```

Edita `.env.local` y completa todas las variables. Ver `TAREAS_MANUALES_USUARIO.md` para obtener las credenciales.

### 4. Configurar Supabase

1. Crea un proyecto en https://supabase.com
2. Ejecuta los scripts SQL en orden (ver `10_SCRIPTS_SQL_COMPLETOS.md`)
3. Verifica que todas las tablas se crearon correctamente

### 5. Ejecutar en Desarrollo

```bash
npm run dev
```

Abre http://localhost:3000 en tu navegador.

---

## 📚 Documentación Completa

### Documentos Principales

1. **`TAREAS_MANUALES_USUARIO.md`** ⭐ **EMPIEZA AQUÍ**
   - Guía paso a paso de configuración
   - Checklist completo
   - Troubleshooting

2. **`RESUMEN_IMPLEMENTACION.md`**
   - Estado actual del proyecto
   - Archivos creados vs pendientes
   - Próximos pasos

3. **`PLAN_IMPLEMENTACION_PMS_COMPLETO.md`**
   - Plan técnico detallado
   - Arquitectura del sistema
   - Código de ejemplo

4. **`00_RESUMEN_EJECUTIVO_Y_CHECKLIST.md`**
   - Resumen ejecutivo
   - Checklist por fases
   - Paleta de colores

5. **`09_PLAN_DESARROLLO_FASES.md`**
   - Plan de desarrollo por fases
   - Timeline de 12-16 semanas
   - Metodología de trabajo

6. **`10_SCRIPTS_SQL_COMPLETOS.md`**
   - 17 scripts SQL listos para copiar/pegar
   - Orden de ejecución
   - Verificación y rollback

7. **`08_INTEGRACIONES_MERCADOPAGO.md`**
   - Integración completa con Mercado Pago
   - OAuth, pagos, webhooks
   - Código completo

8. **`INDICE_DOCUMENTACION.md`**
   - Índice de toda la documentación
   - Guías de lectura por rol
   - Búsqueda rápida

---

## 🎨 Paleta de Colores Parkit

```css
/* Colores Principales */
--primary-celeste: #00B4D8;
--primary-azul: #0077B6;
--secondary-azul: #023E8A;
--accent-celeste: #90E0EF;

/* Colores de Estado */
--success: #38A169;
--error: #E53E3E;
--warning: #FF9500;
--info: #3182CE;

/* Texto */
--text-primary: #2D3748;
--text-secondary: #718096;
```

---

## 🔐 Roles de Usuario

| Rol | Descripción | Acceso |
|-----|-------------|--------|
| **Propietario** | Dueño de estacionamiento | `/dashboard/*` |
| **Admin** | Staff interno de Parkit | `/admin/*` |
| **Super Admin** | Administrador con permisos totales | `/admin/*` + gestión de usuarios |

---

## 📊 Funcionalidades Principales

### Para Propietarios

- ✅ Dashboard con estadísticas
- ✅ Gestión de estacionamientos (CRUD)
- ✅ Gestión de reservas
- ✅ Dashboard de finanzas
- ✅ Vinculación con Mercado Pago
- ✅ Gestión de disponibilidad
- ✅ Calendario de reservas
- ✅ Métricas y analytics

### Para Administradores

- ✅ Dashboard global de la plataforma
- ✅ Sistema de aprobación de estacionamientos
- ✅ Verificación KYC
- ✅ Gestión de usuarios
- ✅ Monitoreo de transacciones
- ✅ Reportes y exportaciones
- ✅ Audit log completo

---

## 🗄️ Base de Datos

### Tablas Principales

- `estacionamientos` - Estacionamientos registrados
- `fotos_estacionamiento` - Fotos de los estacionamientos
- `reservas_estacionamiento` - Reservas realizadas
- `kyc_submissions` - Verificaciones KYC
- `user_roles` - Roles de usuarios
- `resenas_estacionamiento` - Reseñas y calificaciones
- `notificaciones` - Notificaciones del sistema
- `audit_log` - Registro de auditoría
- `mp_accounts_propietarios` - Cuentas de Mercado Pago vinculadas

### Vistas

- `v_estacionamientos_con_propietario` - Estacionamientos con info del propietario
- `v_dashboard_propietario` - Estadísticas del propietario
- `v_dashboard_admin` - Estadísticas globales

---

## 🚀 Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Iniciar servidor de desarrollo

# Producción
npm run build            # Compilar para producción
npm run start            # Iniciar servidor de producción

# Calidad de Código
npm run lint             # Ejecutar ESLint
npm run type-check       # Verificar tipos de TypeScript

# Testing
npm run test             # Ejecutar tests
npm run test:watch       # Ejecutar tests en modo watch
npm run test:coverage    # Generar reporte de cobertura
```

---

## 🔒 Seguridad

### Row Level Security (RLS)

Todas las tablas tienen RLS habilitado para garantizar que:
- Los propietarios solo ven sus propios datos
- Los admins pueden ver todos los datos
- Los usuarios públicos solo ven datos aprobados

### Variables de Entorno

**NUNCA** commitees el archivo `.env.local` al repositorio.

### Service Role Key

La `SUPABASE_SERVICE_ROLE_KEY` **NUNCA** debe exponerse en el frontend. Solo úsala en:
- API Routes de Next.js
- Edge Functions de Supabase

---

## 📈 Roadmap

### Fase 0-1: ✅ Completadas
- Configuración del proyecto
- Sistema de autenticación

### Fase 2: ⚠️ En Progreso
- Dashboard propietario
- Layout y navegación

### Fase 3-8: ⏳ Pendientes
- Gestión de estacionamientos
- Módulo admin
- Gestión de reservas
- Métricas avanzadas
- Integración Mercado Pago
- Notificaciones y pulido

### Futuro
- App móvil para propietarios
- Integración con IZI Park
- Dashboard de analytics avanzado
- Sistema de reportes automáticos

---

## 🤝 Contribución

### Flujo de Trabajo

1. Crea una branch desde `main`: `git checkout -b feature/nueva-funcionalidad`
2. Haz tus cambios y commits
3. Push a tu branch: `git push origin feature/nueva-funcionalidad`
4. Crea un Pull Request
5. Espera revisión y aprobación
6. Merge a `main`

### Convenciones de Código

- **TypeScript**: Usa tipos estrictos
- **Componentes**: Usa componentes funcionales con hooks
- **Estilos**: Usa Material-UI y el theme de Parkit
- **Commits**: Usa commits descriptivos (ej: "feat: agregar formulario de estacionamiento")

---

## 🐛 Troubleshooting

### Error: "Missing Supabase environment variables"
**Solución:** Verifica que `.env.local` existe y tiene las variables correctas.

### Error: "relation does not exist"
**Solución:** Ejecuta los scripts SQL en el orden correcto.

### Error: "RLS policy violation"
**Solución:** Verifica que las RLS policies se crearon correctamente.

### Error en OAuth de Mercado Pago
**Solución:** Verifica que el Redirect URI esté configurado correctamente en MP.

Ver `TAREAS_MANUALES_USUARIO.md` para más soluciones.

---

## 📞 Soporte

- **Documentación:** Ver archivos `.md` en la raíz del proyecto
- **Issues:** https://github.com/tu-usuario/parkit-pms/issues
- **Email:** soporte@parkit.com

---

## 📄 Licencia

Propietario: Parkit  
Todos los derechos reservados.

---

## 👥 Equipo

- **Desarrollo:** Tu nombre
- **Diseño:** Parkit Design Team
- **Product Owner:** Parkit Management

---

## 🎉 Agradecimientos

- Next.js team por el excelente framework
- Supabase por la plataforma backend
- Material-UI por los componentes
- Mercado Pago por la integración de pagos

---

**Última actualización:** Diciembre 2025  
**Versión:** 1.0.0  
**Estado:** En desarrollo activo

