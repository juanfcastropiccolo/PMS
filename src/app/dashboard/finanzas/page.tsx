'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Button,
  Alert,
} from '@mui/material';
import {
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingIcon,
  AccountBalance as BankIcon,
  Link as LinkIcon,
} from '@mui/icons-material';
import { supabase } from '@/lib/supabaseClient';

interface FinanzasStats {
  ingresos_totales: number;
  ingresos_mes_actual: number;
  ingresos_mes_anterior: number;
  reservas_completadas: number;
  mp_vinculado: boolean;
}

export default function FinanzasPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<FinanzasStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFinanzas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadFinanzas = async () => {
    if (!user) return;

    try {
      // Verificar si tiene MP vinculado
      const { data: mpAccount } = await supabase
        .from('mp_accounts_propietarios')
        .select('*')
        .eq('propietario_id', user.id)
        .eq('is_active', true)
        .single();

      // Obtener estacionamientos
      const { data: estacionamientos } = await supabase
        .from('estacionamientos')
        .select('id')
        .eq('propietario_id', user.id);

      const estacionamientoIds = estacionamientos?.map(e => e.id) || [];

      // Calcular ingresos
      const { data: reservas } = await supabase
        .from('reservas_estacionamiento')
        .select('monto_propietario, created_at')
        .in('estacionamiento_id', estacionamientoIds)
        .eq('estado', 'completada');

      const now = new Date();
      const mesActual = now.getMonth();
      const añoActual = now.getFullYear();
      const mesAnterior = mesActual === 0 ? 11 : mesActual - 1;
      const añoMesAnterior = mesActual === 0 ? añoActual - 1 : añoActual;

      const ingresosTotales = reservas?.reduce((sum, r) => sum + r.monto_propietario, 0) || 0;
      const ingresosMesActual = reservas?.filter(r => {
        const fecha = new Date(r.created_at);
        return fecha.getMonth() === mesActual && fecha.getFullYear() === añoActual;
      }).reduce((sum, r) => sum + r.monto_propietario, 0) || 0;

      const ingresosMesAnterior = reservas?.filter(r => {
        const fecha = new Date(r.created_at);
        return fecha.getMonth() === mesAnterior && fecha.getFullYear() === añoMesAnterior;
      }).reduce((sum, r) => sum + r.monto_propietario, 0) || 0;

      setStats({
        ingresos_totales: ingresosTotales,
        ingresos_mes_actual: ingresosMesActual,
        ingresos_mes_anterior: ingresosMesAnterior,
        reservas_completadas: reservas?.length || 0,
        mp_vinculado: !!mpAccount,
      });
    } catch (error) {
      console.error('Error loading finanzas:', error);
    } finally {
      setLoading(false);
    }
  };

  const calcularCrecimiento = () => {
    if (!stats || stats.ingresos_mes_anterior === 0) return 0;
    return ((stats.ingresos_mes_actual - stats.ingresos_mes_anterior) / stats.ingresos_mes_anterior) * 100;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 4 }}>
        Finanzas
      </Typography>

      {/* Alerta si no tiene MP vinculado */}
      {!stats?.mp_vinculado && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Vincula tu cuenta de Mercado Pago</strong> para recibir pagos directamente.
          </Typography>
          <Button
            variant="contained"
            size="small"
            startIcon={<LinkIcon />}
            href="/dashboard/mercadopago/vincular"
          >
            Vincular Mercado Pago
          </Button>
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box sx={{ p: 1, borderRadius: 2, bgcolor: '#E8F5E9', color: '#38A169', mr: 2 }}>
                  <MoneyIcon />
                </Box>
                <Typography variant="h6" color="text.secondary">
                  Ingresos Totales
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700 }}>
                ${(stats?.ingresos_totales || 0).toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box sx={{ p: 1, borderRadius: 2, bgcolor: '#E8F7FA', color: '#00B4D8', mr: 2 }}>
                  <TrendingIcon />
                </Box>
                <Typography variant="h6" color="text.secondary">
                  Este Mes
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700 }}>
                ${(stats?.ingresos_mes_actual || 0).toLocaleString()}
              </Typography>
              <Typography variant="body2" color={calcularCrecimiento() >= 0 ? 'success.main' : 'error.main'}>
                {calcularCrecimiento() >= 0 ? '+' : ''}{calcularCrecimiento().toFixed(1)}% vs mes anterior
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box sx={{ p: 1, borderRadius: 2, bgcolor: '#FFF4E5', color: '#FFB800', mr: 2 }}>
                  <BankIcon />
                </Box>
                <Typography variant="h6" color="text.secondary">
                  Mes Anterior
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700 }}>
                ${(stats?.ingresos_mes_anterior || 0).toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box sx={{ p: 1, borderRadius: 2, bgcolor: '#E8F7FA', color: '#00B4D8', mr: 2 }}>
                  <MoneyIcon />
                </Box>
                <Typography variant="h6" color="text.secondary">
                  Reservas Pagadas
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700 }}>
                {stats?.reservas_completadas || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Historial de transacciones */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Historial de Transacciones
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Próximamente: Historial detallado de todas tus transacciones
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}

