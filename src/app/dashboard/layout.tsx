'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
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
} from '@mui/material';
import {
  MenuOutlined,
  DashboardOutlined,
  LocalParkingOutlined,
  CalendarMonthOutlined,
  StarOutlined,
  PaymentOutlined,
  PersonOutlined,
  LogoutOutlined,
  AdminPanelSettingsOutlined,
  AttachMoneyOutlined,
  AccountBalanceOutlined,
} from '@mui/icons-material';

const drawerWidth = 260;

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, signOut, isAdmin } = useAuth();
  const router = useRouter();
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
    await signOut();
    router.push('/auth/login');
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardOutlined />, path: '/dashboard' },
    { text: 'Estacionamientos', icon: <LocalParkingOutlined />, path: '/dashboard/estacionamientos' },
    { text: 'Reservas', icon: <CalendarMonthOutlined />, path: '/dashboard/reservas' },
    { text: 'Ingresos', icon: <AttachMoneyOutlined />, path: '/dashboard/ingresos' },
    { text: 'Reseñas', icon: <StarOutlined />, path: '/dashboard/resenas' },
    { text: 'Configurá tus cobros', icon: <AccountBalanceOutlined />, path: '/dashboard/cobros' },
  ];

  const drawer = (
    <Box>
      {/* Logo */}
      <Box sx={{ 
        p: 0,
        py: 1.5,
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        height: 120,
        width: '100%',
      }}>
        <Box
          component="img"
          src="/PMS_logo.png"
          alt="Parkit PMS"
          sx={{
            width: '100%',
            maxWidth: 240,
            height: 'auto',
            minHeight: 160,
            objectFit: 'cover',
            objectPosition: 'center 42%',
          }}
        />
      </Box>

      <Divider />

      {/* Menu Items */}
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              onClick={() => router.push(item.path)}
              sx={{
                '&:hover': {
                  backgroundColor: 'rgba(0, 180, 216, 0.08)',
                },
              }}
            >
              <ListItemIcon sx={{ color: '#00B4D8' }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider />

      {/* Admin Section */}
      {isAdmin && (
        <>
          <List>
            <ListItem disablePadding>
              <ListItemButton onClick={() => router.push('/admin')}>
                <ListItemIcon sx={{ color: '#E53E3E' }}>
                  <AdminPanelSettingsOutlined />
                </ListItemIcon>
                <ListItemText primary="Panel Admin" />
              </ListItemButton>
            </ListItem>
          </List>
          <Divider />
        </>
      )}

      {/* User Section */}
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={() => router.push('/dashboard/perfil')}>
            <ListItemIcon>
              <PersonOutlined />
            </ListItemIcon>
            <ListItemText primary="Mi Perfil" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout}>
            <ListItemIcon sx={{ color: '#E53E3E' }}>
              <LogoutOutlined />
            </ListItemIcon>
            <ListItemText primary="Cerrar Sesión" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      {/* AppBar */}
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          backgroundColor: 'white',
          color: '#2D3748',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuOutlined />
          </IconButton>

          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Panel de Control
          </Typography>

          {/* User Avatar */}
          <IconButton onClick={handleMenuOpen} sx={{ p: 0 }}>
            <Avatar sx={{ bgcolor: '#00B4D8' }}>
              {user?.email?.charAt(0).toUpperCase()}
            </Avatar>
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <MenuItem disabled>
              <Typography variant="body2" color="text.secondary">
                {user?.email}
              </Typography>
            </MenuItem>
            <Divider />
            <MenuItem
              onClick={() => {
                handleMenuClose();
                router.push('/dashboard/perfil');
              }}
            >
              <ListItemIcon>
                <PersonOutlined fontSize="small" />
              </ListItemIcon>
              Mi Perfil
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutOutlined fontSize="small" sx={{ color: '#E53E3E' }} />
              </ListItemIcon>
              Cerrar Sesión
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>

        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: 8,
          backgroundColor: '#F7FAFC',
          minHeight: '100vh',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
