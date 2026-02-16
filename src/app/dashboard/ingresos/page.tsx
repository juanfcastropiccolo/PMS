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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  ToggleButtonGroup,
  ToggleButton,
  CircularProgress,
  Button,
} from '@mui/material';
import {
  AttachMoneyOutlined,
  TrendingUpOutlined,
  AccountBalanceWalletOutlined,
  ReceiptOutlined,
  DownloadOutlined,
  LocalParkingOutlined,
} from '@mui/icons-material';
import { supabase } from '@/lib/supabaseClient';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { format, subDays, startOfDay, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';

interface IngresosPorPeriodo {
  fecha: string;
  ingresos: number;
  comision: number;
  neto: number;
}

interface IngresosPorEstacionamiento {
  nombre: string;
  ingresos: number;
  reservas: number;
  promedio: number;
}

interface Resumen {
  ingresos_totales: number;
  ingresos_mes_actual: number;
  ingresos_mes_anterior: number;
  comisiones_totales: number;
  comisiones_mes_actual: number;
  neto_mes_actual: number;
  total_reservas_completadas: number;
  ticket_promedio: number;
}

interface Transaccion {
  id: string;
  fecha: string;
  codigo_reserva: string;
  estacionamiento: string;
  monto_total: number;
  comision: number;
  neto: number;
  estado: string;
}

const COLORES_GRAFICO = ['#00B4D8', '#0077B6', '#90E0EF', '#0096C7', '#48CAE4'];

export default function IngresosPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState<'7' | '30' | '90' | '365'>('30');
  const [resumen, setResumen] = useState<Resumen>({
    ingresos_totales: 0,
    ingresos_mes_actual: 0,
    ingresos_mes_anterior: 0,
    comisiones_totales: 0,
    comisiones_mes_actual: 0,
    neto_mes_actual: 0,
    total_reservas_completadas: 0,
    ticket_promedio: 0,
  });
  const [ingresosPorPeriodo, setIngresosPorPeriodo] = useState<IngresosPorPeriodo[]>([]);
  const [ingresosPorEstacionamiento, setIngresosPorEstacionamiento] = useState<IngresosPorEstacionamiento[]>([]);
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);

  useEffect(() => {
    if (user) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, periodo]);

  const loadData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      await Promise.all([
        loadResumen(),
        loadIngresosPorPeriodo(),
        loadIngresosPorEstacionamiento(),
        loadTransacciones(),
      ]);
    } catch (error) {
      console.error('Error loading ingresos data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadResumen = async () => {
    if (!user) return;

    try {
      const inicioMesActual = startOfMonth(new Date());
      const finMesActual = endOfMonth(new Date());
      const inicioMesAnterior = startOfMonth(subDays(new Date(), 30));
      const finMesAnterior = endOfMonth(subDays(new Date(), 30));

      // Ingresos totales y del mes actual
      const { data: reservasMesActual } = await supabase
        .from('reservas')
        .select('monto_estacionamiento, comision_parkit, estacionamientos!inner(propietario_id)')
        .eq('estacionamientos.propietario_id', user.id)
        .eq('estado', 'completada')
        .gte('completada_en', inicioMesActual.toISOString())
        .lte('completada_en', finMesActual.toISOString());

      // Ingresos mes anterior
      const { data: reservasMesAnterior } = await supabase
        .from('reservas')
        .select('monto_estacionamiento, comision_parkit, estacionamientos!inner(propietario_id)')
        .eq('estacionamientos.propietario_id', user.id)
        .eq('estado', 'completada')
        .gte('completada_en', inicioMesAnterior.toISOString())
        .lte('completada_en', finMesAnterior.toISOString());

      // Ingresos totales
      const { data: reservasTotales, count: totalReservas } = await supabase
        .from('reservas')
        .select('monto_estacionamiento, comision_parkit, estacionamientos!inner(propietario_id)', { count: 'exact' })
        .eq('estacionamientos.propietario_id', user.id)
        .eq('estado', 'completada');

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const parseMontoEst = (r: any) => parseFloat(r.monto_estacionamiento?.toString() || '0');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const parseComision = (r: any) => parseFloat(r.comision_parkit?.toString() || '0');

      const ingresosMesActual = reservasMesActual?.reduce((sum, r) => sum + parseMontoEst(r), 0) || 0;
      const comisionesMesActual = reservasMesActual?.reduce((sum, r) => sum + parseComision(r), 0) || 0;
      const ingresosMesAnterior = reservasMesAnterior?.reduce((sum, r) => sum + parseMontoEst(r), 0) || 0;
      const ingresosTotales = reservasTotales?.reduce((sum, r) => sum + parseMontoEst(r), 0) || 0;
      const comisionesTotales = reservasTotales?.reduce((sum, r) => sum + parseComision(r), 0) || 0;

      setResumen({
        ingresos_totales: Math.round(ingresosTotales),
        ingresos_mes_actual: Math.round(ingresosMesActual),
        ingresos_mes_anterior: Math.round(ingresosMesAnterior),
        comisiones_totales: Math.round(comisionesTotales),
        comisiones_mes_actual: Math.round(comisionesMesActual),
        neto_mes_actual: Math.round(ingresosMesActual - comisionesMesActual),
        total_reservas_completadas: totalReservas || 0,
        ticket_promedio: totalReservas ? Math.round(ingresosTotales / totalReservas) : 0,
      });
    } catch (error) {
      console.error('Error loading resumen:', error);
    }
  };

  const loadIngresosPorPeriodo = async () => {
    if (!user) return;

    try {
      const dias = parseInt(periodo);
      const fechaInicio = startOfDay(subDays(new Date(), dias - 1));

      const { data: reservasData } = await supabase
        .from('reservas')
        .select('monto_estacionamiento, comision_parkit, completada_en, estacionamientos!inner(propietario_id)')
        .eq('estacionamientos.propietario_id', user.id)
        .eq('estado', 'completada')
        .gte('completada_en', fechaInicio.toISOString())
        .order('completada_en', { ascending: true });

      // Agrupar por día
      const ingresosPorDia: { [key: string]: { ingresos: number; comision: number } } = {};
      
      // Inicializar todos los días
      for (let i = 0; i < dias; i++) {
        const fecha = format(subDays(new Date(), dias - 1 - i), 'yyyy-MM-dd');
        ingresosPorDia[fecha] = { ingresos: 0, comision: 0 };
      }

      // Sumar ingresos y comisiones
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      reservasData?.forEach((reserva: any) => {
        const fecha = format(new Date(reserva.completada_en), 'yyyy-MM-dd');
        const monto = parseFloat(reserva.monto_estacionamiento?.toString() || '0');
        const comision = parseFloat(reserva.comision_parkit?.toString() || '0');
        
        if (ingresosPorDia[fecha]) {
          ingresosPorDia[fecha].ingresos += monto;
          ingresosPorDia[fecha].comision += comision;
        }
      });

      // Convertir a array
      const formatoFecha = dias <= 30 ? 'dd MMM' : 'dd/MM';
      const ingresosDiariosArray: IngresosPorPeriodo[] = Object.entries(ingresosPorDia).map(([fecha, datos]) => ({
        fecha: format(new Date(fecha), formatoFecha, { locale: es }),
        ingresos: Math.round(datos.ingresos),
        comision: Math.round(datos.comision),
        neto: Math.round(datos.ingresos - datos.comision),
      }));

      setIngresosPorPeriodo(ingresosDiariosArray);
    } catch (error) {
      console.error('Error loading ingresos por periodo:', error);
    }
  };

  const loadIngresosPorEstacionamiento = async () => {
    if (!user) return;

    try {
      const { data: rawEst } = await supabase
        .from('estacionamientos')
        .select('id, nombre')
        .eq('propietario_id', user.id);
      const estacionamientos = rawEst as { id: string; nombre: string }[] | null;

      if (!estacionamientos) return;

      const ingresosPorEst: IngresosPorEstacionamiento[] = [];

      for (const est of estacionamientos) {
        const { data: reservas, count } = await supabase
          .from('reservas')
          .select('monto_estacionamiento', { count: 'exact' })
          .eq('estacionamiento_id', est.id)
          .eq('estado', 'completada');

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const totalIngresos = reservas?.reduce((sum, r: any) => sum + parseFloat(r.monto_estacionamiento?.toString() || '0'), 0) || 0;

        ingresosPorEst.push({
          nombre: est.nombre,
          ingresos: Math.round(totalIngresos),
          reservas: count || 0,
          promedio: count ? Math.round(totalIngresos / count) : 0,
        });
      }

      // Ordenar por ingresos descendente
      ingresosPorEst.sort((a, b) => b.ingresos - a.ingresos);

      setIngresosPorEstacionamiento(ingresosPorEst);
    } catch (error) {
      console.error('Error loading ingresos por estacionamiento:', error);
    }
  };

  const loadTransacciones = async () => {
    if (!user) return;

    try {
      const { data: reservasData } = await supabase
        .from('reservas')
        .select(`
          id,
          codigo,
          monto_estacionamiento,
          comision_parkit,
          completada_en,
          estado,
          estacionamientos!inner(nombre, propietario_id)
        `)
        .eq('estacionamientos.propietario_id', user.id)
        .eq('estado', 'completada')
        .order('completada_en', { ascending: false })
        .limit(20);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const transaccionesFormateadas: Transaccion[] = (reservasData || []).map((r: any) => {
        const monto = parseFloat(r.monto_estacionamiento?.toString() || '0');
        const comision = parseFloat(r.comision_parkit?.toString() || '0');
        
        return {
          id: r.id,
          fecha: r.completada_en,
          codigo_reserva: r.codigo || 'N/A',
          estacionamiento: r.estacionamientos?.nombre || 'N/A',
          monto_total: Math.round(monto),
          comision: Math.round(comision),
          neto: Math.round(monto - comision),
          estado: r.estado,
        };
      });

      setTransacciones(transaccionesFormateadas);
    } catch (error) {
      console.error('Error loading transacciones:', error);
    }
  };

  const calcularCrecimiento = () => {
    if (resumen.ingresos_mes_anterior === 0) return 0;
    return ((resumen.ingresos_mes_actual - resumen.ingresos_mes_anterior) / resumen.ingresos_mes_anterior) * 100;
  };

  const handleExportarReporte = () => {
    // Aquí iría la lógica para exportar a CSV/PDF
    console.log('Exportando reporte...');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const crecimiento = calcularCrecimiento();

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600, color: '#2D3748', mb: 1 }}>
            Ingresos y Finanzas
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gestiona y analiza tus ingresos por estacionamiento
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<DownloadOutlined />}
          onClick={handleExportarReporte}
          sx={{ borderColor: '#00B4D8', color: '#00B4D8' }}
        >
          Exportar Reporte
        </Button>
      </Box>

      {/* Cards de Resumen */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Ingresos del Mes */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #00B4D8 0%, #0077B6 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AttachMoneyOutlined sx={{ fontSize: 32, mr: 1 }} />
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Ingresos del Mes
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                ${resumen.ingresos_mes_actual.toLocaleString()}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TrendingUpOutlined sx={{ fontSize: 16, mr: 0.5 }} />
                <Typography variant="caption">
                  {crecimiento >= 0 ? '+' : ''}{crecimiento.toFixed(1)}% vs mes anterior
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Neto del Mes */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #38A169 0%, #2F855A 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AccountBalanceWalletOutlined sx={{ fontSize: 32, mr: 1 }} />
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Neto del Mes
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                ${resumen.neto_mes_actual.toLocaleString()}
              </Typography>
              <Typography variant="caption">
                Después de comisiones
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Comisiones */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #F6AD55 0%, #ED8936 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <ReceiptOutlined sx={{ fontSize: 32, mr: 1 }} />
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Comisiones Parkit
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                ${resumen.comisiones_mes_actual.toLocaleString()}
              </Typography>
              <Typography variant="caption">
                15% del mes actual
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Ticket Promedio */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #4299E1 0%, #3182CE 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <ReceiptOutlined sx={{ fontSize: 32, mr: 1 }} />
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Ticket Promedio
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                ${resumen.ticket_promedio.toLocaleString()}
              </Typography>
              <Typography variant="caption">
                Por reserva completada
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Gráficos */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Gráfico de Ingresos en el Tiempo */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Evolución de Ingresos
              </Typography>
              <ToggleButtonGroup
                value={periodo}
                exclusive
                onChange={(e, newPeriodo) => {
                  if (newPeriodo !== null) {
                    setPeriodo(newPeriodo);
                  }
                }}
                size="small"
                sx={{
                  '& .MuiToggleButton-root': {
                    color: '#718096',
                    borderColor: '#E2E8F0',
                    '&:hover': {
                      backgroundColor: '#E8F7FA',
                    },
                    '&.Mui-selected': {
                      backgroundColor: '#00B4D8',
                      color: 'white',
                      fontWeight: 600,
                      '&:hover': {
                        backgroundColor: '#0096C7',
                      },
                    },
                  },
                }}
              >
                <ToggleButton value="7">7 días</ToggleButton>
                <ToggleButton value="30">30 días</ToggleButton>
                <ToggleButton value="90">90 días</ToggleButton>
                <ToggleButton value="365">1 año</ToggleButton>
              </ToggleButtonGroup>
            </Box>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={ingresosPorPeriodo}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="fecha" style={{ fontSize: '12px' }} />
                <YAxis style={{ fontSize: '12px' }} tickFormatter={(value) => `$${value}`} />
                <Tooltip
                  formatter={(value: number, name: string) => {
                    const labels: Record<string, string> = {
                      ingresos: 'Ingresos Brutos',
                      comision: 'Comisión Parkit',
                      neto: 'Neto',
                    };
                    return [`$${value}`, labels[name] || name];
                  }}
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '8px' }}
                />
                <Legend />
                <Line type="monotone" dataKey="ingresos" stroke="#00B4D8" strokeWidth={3} name="Ingresos Brutos" />
                <Line type="monotone" dataKey="neto" stroke="#38A169" strokeWidth={3} name="Neto" />
                <Line type="monotone" dataKey="comision" stroke="#F6AD55" strokeWidth={2} strokeDasharray="5 5" name="Comisión" />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Gráfico de Ingresos por Estacionamiento */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Ingresos por Estacionamiento
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={ingresosPorEstacionamiento}
                  dataKey="ingresos"
                  nameKey="nombre"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={(entry) => `$${entry.ingresos}`}
                >
                  {ingresosPorEstacionamiento.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORES_GRAFICO[index % COLORES_GRAFICO.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `$${value}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Desglose por Estacionamiento */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Rendimiento por Estacionamiento
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Estacionamiento</strong></TableCell>
                    <TableCell align="right"><strong>Ingresos Totales</strong></TableCell>
                    <TableCell align="right"><strong>Reservas</strong></TableCell>
                    <TableCell align="right"><strong>Promedio por Reserva</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ingresosPorEstacionamiento.map((est) => (
                    <TableRow key={est.nombre} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <LocalParkingOutlined sx={{ mr: 1, color: '#00B4D8' }} />
                          {est.nombre}
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Typography sx={{ fontWeight: 600, color: '#38A169' }}>
                          ${est.ingresos.toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">{est.reservas}</TableCell>
                      <TableCell align="right">${est.promedio.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Historial de Transacciones */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
          Últimas Transacciones
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Fecha</strong></TableCell>
                <TableCell><strong>Código</strong></TableCell>
                <TableCell><strong>Estacionamiento</strong></TableCell>
                <TableCell align="right"><strong>Monto Total</strong></TableCell>
                <TableCell align="right"><strong>Comisión</strong></TableCell>
                <TableCell align="right"><strong>Neto</strong></TableCell>
                <TableCell align="center"><strong>Estado</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transacciones.map((trans) => (
                <TableRow key={trans.id} hover>
                  <TableCell>
                    {format(new Date(trans.fecha), 'dd/MM/yyyy HH:mm', { locale: es })}
                  </TableCell>
                  <TableCell>{trans.codigo_reserva}</TableCell>
                  <TableCell>{trans.estacionamiento}</TableCell>
                  <TableCell align="right">${trans.monto_total.toLocaleString()}</TableCell>
                  <TableCell align="right" sx={{ color: '#F6AD55' }}>
                    -${trans.comision.toLocaleString()}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, color: '#38A169' }}>
                    ${trans.neto.toLocaleString()}
                  </TableCell>
                  <TableCell align="center">
                    <Chip label="Completada" color="success" size="small" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Info sobre Comisiones */}
      <Paper sx={{ p: 3, mt: 3, bgcolor: '#E8F7FA', border: '1px solid #00B4D8' }}>
        <Box sx={{ display: 'flex', alignItems: 'start' }}>
          <ReceiptOutlined sx={{ color: '#00B4D8', mr: 2, mt: 0.5 }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#0077B6' }}>
              Acerca de las Comisiones
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Parkit cobra una comisión del 15% sobre cada reserva completada para mantener la plataforma,
              gestionar pagos, brindar soporte y mejorar continuamente el servicio.
              Esta comisión se descuenta automáticamente y el monto neto se transfiere a tu cuenta
              vinculada de Mercado Pago.
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}

