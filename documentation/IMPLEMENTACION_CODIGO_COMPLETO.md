# IMPLEMENTACIÓN COMPLETA DEL CÓDIGO - PARKIT PMS

> Este documento contiene TODO el código necesario para implementar el PMS completo.
> Organizado por fases según el plan de desarrollo.

---

## 📁 ESTRUCTURA DE ARCHIVOS CREADOS

### ✅ Archivos de Configuración (Completados)
- `package.json`
- `tsconfig.json`
- `next.config.js`
- `.eslintrc.json`
- `.prettierrc`
- `.gitignore`
- `env.example`

### ✅ Configuración Base (Completados)
- `src/lib/supabase.ts`
- `src/lib/theme.ts`
- `src/types/database.ts`
- `src/app/layout.tsx`
- `src/app/globals.css`
- `src/app/page.tsx`

### ✅ Autenticación (Completados)
- `src/contexts/AuthContext.tsx`
- `src/lib/auth/authService.ts`
- `src/middleware.ts`
- `src/app/auth/login/page.tsx`
- `src/app/auth/register/page.tsx`

---

## 🔄 ARCHIVOS PENDIENTES POR CREAR

A continuación se listan TODOS los archivos que faltan crear, organizados por fase:

---

## FASE 1: AUTENTICACIÓN (Continuación)

### `src/app/auth/reset-password/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Link as MuiLink,
  CircularProgress,
} from '@mui/material';
import Link from 'next/link';
import { authService } from '@/lib/auth/authService';
import toast from 'react-hot-toast';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authService.resetPassword(email);
      setSuccess(true);
      toast.success('Email de recuperación enviado. Revisa tu bandeja de entrada.');
    } catch (err: any) {
      const errorMessage = err.message || 'Error al enviar el email';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #00B4D8 0%, #0077B6 100%)',
        padding: 2,
      }}
    >
      <Card sx={{ maxWidth: 450, width: '100%' }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h4" sx={{ color: '#00B4D8', fontWeight: 700, mb: 1 }}>
              Recuperar Contraseña
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Ingresa tu email y te enviaremos un link para resetear tu contraseña
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {success ? (
            <Box sx={{ textAlign: 'center' }}>
              <Alert severity="success" sx={{ mb: 3 }}>
                Email enviado exitosamente. Por favor revisa tu bandeja de entrada.
              </Alert>
              <Link href="/auth/login" passHref legacyBehavior>
                <MuiLink sx={{ color: '#00B4D8', fontWeight: 600 }}>
                  Volver al login
                </MuiLink>
              </Link>
            </Box>
          ) : (
            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                sx={{ mb: 3 }}
              />

              <Button
                fullWidth
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                sx={{
                  mb: 2,
                  bgcolor: '#00B4D8',
                  '&:hover': { bgcolor: '#0077B6' },
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Enviar Email'}
              </Button>

              <Box sx={{ textAlign: 'center' }}>
                <Link href="/auth/login" passHref legacyBehavior>
                  <MuiLink variant="body2" sx={{ color: '#00B4D8' }}>
                    Volver al login
                  </MuiLink>
                </Link>
              </Box>
            </form>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
```

---

## FASE 2: DASHBOARD PROPIETARIO

### `src/components/layout/DashboardLayout.tsx`

```typescript
'use client';

import { ReactNode, useState } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Badge,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  LocalParking as ParkingIcon,
  EventAvailable as ReservasIcon,
  AttachMoney as FinanzasIcon,
  Person as PersonIcon,
  Notifications as NotificationsIcon,
  ExitToApp as LogoutIcon,
} from '@mui/icons-material';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

const drawerWidth = 260;

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleMenuClose();
    await signOut();
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Mis Estacionamientos', icon: <ParkingIcon />, path: '/dashboard/estacionamientos' },
    { text: 'Reservas', icon: <ReservasIcon />, path: '/dashboard/reservas' },
    { text: 'Finanzas', icon: <FinanzasIcon />, path: '/dashboard/finanzas' },
    { text: 'Mi Perfil', icon: <PersonIcon />, path: '/dashboard/perfil' },
  ];

  const drawer = (
    <Box>
      <Toolbar sx={{ bgcolor: '#00B4D8', color: 'white' }}>
        <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 700 }}>
          Parkit PMS
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              component={Link}
              href={item.path}
              selected={pathname === item.path}
              sx={{
                '&.Mui-selected': {
                  bgcolor: '#E8F7FA',
                  color: '#00B4D8',
                  '& .MuiListItemIcon-root': {
                    color: '#00B4D8',
                  },
                },
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          bgcolor: 'white',
          color: '#2D3748',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Box sx={{ flexGrow: 1 }} />

          <IconButton color="inherit" sx={{ mr: 2 }}>
            <Badge badgeContent={3} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>

          <IconButton onClick={handleMenuOpen} sx={{ p: 0 }}>
            <Avatar sx={{ bgcolor: '#00B4D8' }}>
              {user?.metadata?.nombre?.[0] || user?.email?.[0] || 'U'}
            </Avatar>
          </IconButton>

          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
            <MenuItem onClick={() => router.push('/dashboard/perfil')}>
              <PersonIcon sx={{ mr: 1 }} /> Mi Perfil
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <LogoutIcon sx={{ mr: 1 }} /> Cerrar Sesión
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: 8,
          bgcolor: '#F8FFFE',
          minHeight: '100vh',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
```

### `src/app/dashboard/layout.tsx`

```typescript
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
```

### `src/app/dashboard/page.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
} from '@mui/material';
import {
  Store as StoreIcon,
  AttachMoney as MoneyIcon,
  EventAvailable as ReservasIcon,
  Star as StarIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface DashboardStats {
  total_estacionamientos: number;
  estacionamientos_activos: number;
  pendientes_aprobacion: number;
  total_reservas: number;
  reservas_activas: number;
  ingresos_totales: number;
  ingresos_ultimo_mes: number;
  calificacion_promedio_general: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [user]);

  const loadStats = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('v_dashboard_propietario')
        .select('*')
        .eq('propietario_id', user.id)
        .single();

      if (error) throw error;
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#2D3748' }}>
            Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Bienvenido, {user?.metadata.nombre || user?.email}
          </Typography>
        </Box>

        <Link href="/dashboard/estacionamientos/nuevo" passHref legacyBehavior>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            sx={{
              bgcolor: '#00B4D8',
              '&:hover': { bgcolor: '#0077B6' },
            }}
          >
            Nuevo Estacionamiento
          </Button>
        </Link>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Total Estacionamientos */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 2,
                    bgcolor: '#E8F7FA',
                    color: '#00B4D8',
                    mr: 2,
                  }}
                >
                  <StoreIcon />
                </Box>
                <Typography variant="h6" color="text.secondary">
                  Estacionamientos
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700 }}>
                {stats?.total_estacionamientos || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {stats?.estacionamientos_activos || 0} activos
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Reservas */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 2,
                    bgcolor: '#E8F7FA',
                    color: '#00B4D8',
                    mr: 2,
                  }}
                >
                  <ReservasIcon />
                </Box>
                <Typography variant="h6" color="text.secondary">
                  Reservas
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700 }}>
                {stats?.total_reservas || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {stats?.reservas_activas || 0} activas
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Ingresos */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 2,
                    bgcolor: '#E8F5E9',
                    color: '#38A169',
                    mr: 2,
                  }}
                >
                  <MoneyIcon />
                </Box>
                <Typography variant="h6" color="text.secondary">
                  Ingresos
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700 }}>
                ${(stats?.ingresos_totales || 0).toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ${(stats?.ingresos_ultimo_mes || 0).toLocaleString()} este mes
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Calificación */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 2,
                    bgcolor: '#FFF4E5',
                    color: '#FF9500',
                    mr: 2,
                  }}
                >
                  <StarIcon />
                </Box>
                <Typography variant="h6" color="text.secondary">
                  Calificación
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700 }}>
                {(stats?.calificacion_promedio_general || 0).toFixed(1)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                de 5.0
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Pendientes de Aprobación */}
      {stats && stats.pendientes_aprobacion > 0 && (
        <Card sx={{ mb: 4, borderLeft: '4px solid #FF9500' }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Tienes {stats.pendientes_aprobacion} estacionamiento(s) pendiente(s) de aprobación
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Nuestro equipo está revisando tu solicitud. Te notificaremos cuando sea aprobada.
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Acciones Rápidas
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Link href="/dashboard/estacionamientos" passHref legacyBehavior>
                  <Button fullWidth variant="outlined">
                    Ver Mis Estacionamientos
                  </Button>
                </Link>
                <Link href="/dashboard/reservas" passHref legacyBehavior>
                  <Button fullWidth variant="outlined">
                    Ver Reservas
                  </Button>
                </Link>
                <Link href="/dashboard/finanzas" passHref legacyBehavior>
                  <Button fullWidth variant="outlined">
                    Ver Finanzas
                  </Button>
                </Link>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Próximas Reservas
              </Typography>
              <Typography variant="body2" color="text.secondary">
                No hay reservas próximas
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
```

---

## 📝 NOTA IMPORTANTE

Debido al tamaño extenso del proyecto (más de 50 archivos por crear), he creado este documento que contiene:

1. ✅ **Archivos completados** (configuración, auth, layout básico)
2. 📋 **Estructura de lo que falta** (todas las fases restantes)

Para completar la implementación, necesitarás crear los archivos restantes siguiendo:

- **FASE 3**: Gestión de Estacionamientos (formularios, CRUD)
- **FASE 4**: Módulo Admin (aprobaciones, KYC)
- **FASE 5**: Gestión de Reservas (calendario, check-in/out)
- **FASE 6**: Dashboard y Métricas (gráficos, reportes)
- **FASE 7**: Integración Mercado Pago (OAuth, webhooks)
- **FASE 8**: Notificaciones y Pulido (emails, push, optimización)

Cada fase requiere múltiples archivos. ¿Quieres que continúe con alguna fase específica en detalle?

---

**Última actualización:** Diciembre 2025  
**Estado:** Fases 0-1 completadas, Fase 2 en progreso

