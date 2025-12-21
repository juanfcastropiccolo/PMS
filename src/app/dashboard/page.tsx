'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CircularProgress,
} from '@mui/material';
import {
  LocalParkingOutlined,
  CalendarMonthOutlined,
  AttachMoneyOutlined,
  StarOutlined,
} from '@mui/icons-material';

interface DashboardStats {
  totalEstacionamientos: number;
  reservasActivas: number;
  ingresosMes: number;
  calificacionPromedio: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalEstacionamientos: 0,
    reservasActivas: 0,
    ingresosMes: 0,
    calificacionPromedio: 0,
  });

  useEffect(() => {
    // Simular carga de datos
    setTimeout(() => {
      setStats({
        totalEstacionamientos: 0,
        reservasActivas: 0,
        ingresosMes: 0,
        calificacionPromedio: 0,
      });
      setLoading(false);
    }, 500);
  }, []);

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '80vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, color: '#2D3748', mb: 1 }}>
          ¡Bienvenido, {user?.email}! 👋
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Este es tu panel de control. Aquí podrás gestionar tus estacionamientos.
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Total Estacionamientos */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #00B4D8 0%, #0077B6 100%)',
              color: 'white',
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <LocalParkingOutlined sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {stats.totalEstacionamientos}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Estacionamientos
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Reservas Activas */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #38A169 0%, #2F855A 100%)',
              color: 'white',
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CalendarMonthOutlined sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {stats.reservasActivas}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Reservas Activas
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Ingresos del Mes */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #F6AD55 0%, #ED8936 100%)',
              color: 'white',
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AttachMoneyOutlined sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    ${stats.ingresosMes}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Ingresos del Mes
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Calificación Promedio */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #4299E1 0%, #3182CE 100%)',
              color: 'white',
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <StarOutlined sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {stats.calificacionPromedio.toFixed(1)}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Calificación
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Mensaje de Bienvenida */}
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
          🎉 ¡Sistema de Gestión Operativo!
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Tu cuenta está configurada correctamente. Ahora puedes comenzar a gestionar tus
          estacionamientos.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          <strong>Próximos pasos:</strong>
          <br />
          1. Agregar tu primer estacionamiento
          <br />
          2. Configurar horarios y tarifas
          <br />
          3. Vincular tu cuenta de Mercado Pago
        </Typography>
      </Paper>
    </Container>
  );
}
