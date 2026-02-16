'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
  ToggleButtonGroup,
  ToggleButton,
  Avatar,
  Rating,
  Chip,
} from '@mui/material';
import {
  LocalParkingOutlined,
  CalendarMonthOutlined,
  AttachMoneyOutlined,
  StarOutlined,
} from '@mui/icons-material';
import { supabase } from '@/lib/supabaseClient';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';

interface DashboardStats {
  totalEstacionamientos: number;
  reservasActivas: number;
  ingresosMes: number;
  calificacionPromedio: number;
}

interface UserProfile {
  nombre: string | null;
  email: string | null;
}

interface IngresosDiarios {
  fecha: string;
  ingresos: number;
}

interface Resena {
  id: string;
  usuario_nombre: string;
  calificacion: number;
  comentario: string;
  created_at: string;
  estacionamiento_nombre: string;
  respondida: boolean;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile>({ nombre: null, email: null });
  const [stats, setStats] = useState<DashboardStats>({
    totalEstacionamientos: 0,
    reservasActivas: 0,
    ingresosMes: 0,
    calificacionPromedio: 0,
  });
  const [periodo, setPeriodo] = useState<'7' | '15' | '30' | '90'>('30');
  const [ingresosDiarios, setIngresosDiarios] = useState<IngresosDiarios[]>([]);
  const [resenas, setResenas] = useState<Resena[]>([]);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (user && stats.totalEstacionamientos > 0) {
      loadIngresosDiarios();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, periodo, stats.totalEstacionamientos]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      // Get user profile with nombre from public.users
      const { data: userData } = await supabase
        .from('users')
        .select('nombre')
        .eq('id', user.id)
        .single();

      // Fallback: Si no hay nombre en public.users, buscar en auth metadata
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let nombreUsuario = (userData as any)?.nombre;
      
      if (!nombreUsuario) {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        nombreUsuario = authUser?.user_metadata?.nombre || null;
      }

      // Extraer solo el primer nombre
      const primerNombre = nombreUsuario 
        ? nombreUsuario.split(' ')[0] 
        : null;

      setUserProfile({
        nombre: primerNombre,
        email: user.email || null,
      });

      // Get total estacionamientos
      const { count: totalEstacionamientos } = await supabase
        .from('estacionamientos')
        .select('*', { count: 'exact', head: true })
        .eq('propietario_id', user.id);

      // Get reservas activas (confirmadas)
      const { count: reservasActivas } = await supabase
        .from('reservas')
        .select('*, estacionamientos!inner(*)', { count: 'exact', head: true })
        .eq('estacionamientos.propietario_id', user.id)
        .eq('estado', 'confirmada');

      // Get ingresos del mes (reservas completadas este mes)
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: ingresoData } = await supabase
        .from('reservas')
        .select('monto_estacionamiento, estacionamientos!inner(propietario_id)')
        .eq('estacionamientos.propietario_id', user.id)
        .eq('estado', 'completada')
        .gte('completada_en', startOfMonth.toISOString());

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ingresosMes = ingresoData?.reduce((sum, r: any) => sum + (parseFloat(r.monto_estacionamiento?.toString() || '0')), 0) || 0;

      // Get calificacion promedio
      const { data: estacionamientosData } = await supabase
        .from('estacionamientos')
        .select('calificacion_promedio')
        .eq('propietario_id', user.id);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const calificaciones = estacionamientosData?.map((e: any) => parseFloat(e.calificacion_promedio?.toString() || '0')).filter(c => c > 0) || [];
      const calificacionPromedio = calificaciones.length > 0
        ? calificaciones.reduce((sum, c) => sum + c, 0) / calificaciones.length
        : 0;

      setStats({
        totalEstacionamientos: totalEstacionamientos || 0,
        reservasActivas: reservasActivas || 0,
        ingresosMes: Math.round(ingresosMes),
        calificacionPromedio,
      });

      // Load reseñas si hay estacionamientos
      if (totalEstacionamientos && totalEstacionamientos > 0) {
        await loadResenas();
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadIngresosDiarios = async () => {
    if (!user) return;

    try {
      const dias = parseInt(periodo);
      const fechaInicio = startOfDay(subDays(new Date(), dias - 1));

      const { data: reservasData } = await supabase
        .from('reservas')
        .select('monto_estacionamiento, completada_en, estacionamientos!inner(propietario_id)')
        .eq('estacionamientos.propietario_id', user.id)
        .eq('estado', 'completada')
        .gte('completada_en', fechaInicio.toISOString())
        .order('completada_en', { ascending: true });

      // Agrupar por día
      const ingresosPorDia: { [key: string]: number } = {};
      
      // Inicializar todos los días con 0
      for (let i = 0; i < dias; i++) {
        const fecha = format(subDays(new Date(), dias - 1 - i), 'yyyy-MM-dd');
        ingresosPorDia[fecha] = 0;
      }

      // Sumar ingresos
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      reservasData?.forEach((reserva: any) => {
        const fecha = format(new Date(reserva.completada_en), 'yyyy-MM-dd');
        const monto = parseFloat(reserva.monto_estacionamiento?.toString() || '0');
        if (ingresosPorDia[fecha] !== undefined) {
          ingresosPorDia[fecha] += monto;
        }
      });

      // Convertir a array
      const ingresosDiariosArray: IngresosDiarios[] = Object.entries(ingresosPorDia).map(([fecha, ingresos]) => ({
        fecha: format(new Date(fecha), dias <= 15 ? 'dd MMM' : 'dd/MM', { locale: es }),
        ingresos: Math.round(ingresos),
      }));

      setIngresosDiarios(ingresosDiariosArray);
    } catch (error) {
      console.error('Error loading ingresos diarios:', error);
    }
  };

  const loadResenas = async () => {
    if (!user) return;

    try {
      const { data: resenasData } = await supabase
        .from('resenas')
        .select(`
          id,
          calificacion,
          comentario,
          created_at,
          respondida,
          usuario:users!resenas_usuario_id_fkey(nombre),
          estacionamiento:estacionamientos!resenas_estacionamiento_id_fkey(nombre, propietario_id)
        `)
        .eq('estacionamiento.propietario_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const resenasFormateadas: Resena[] = (resenasData || []).map((r: any) => ({
        id: r.id,
        usuario_nombre: r.usuario?.nombre || 'Usuario anónimo',
        calificacion: r.calificacion,
        comentario: r.comentario,
        created_at: r.created_at,
        estacionamiento_nombre: r.estacionamiento?.nombre || '',
        respondida: r.respondida || false,
      }));

      setResenas(resenasFormateadas);
    } catch (error) {
      console.error('Error loading reseñas:', error);
    }
  };

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
          ¡Bienvenido, {userProfile.nombre || userProfile.email || 'Usuario'}! 👋
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
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 16px rgba(0,180,216,0.3)',
              },
            }}
            onClick={() => router.push('/dashboard/estacionamientos')}
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
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 16px rgba(56,161,105,0.3)',
              },
            }}
            onClick={() => router.push('/dashboard/reservas')}
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
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 16px rgba(246,173,85,0.3)',
              },
            }}
            onClick={() => router.push('/dashboard/ingresos')}
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
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 16px rgba(66,153,225,0.3)',
              },
            }}
            onClick={() => router.push('/dashboard/resenas')}
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

      {/* Contenido Condicional */}
      {stats.totalEstacionamientos === 0 ? (
        /* Mensaje de Bienvenida para nuevos usuarios */
        <Paper sx={{ p: 4, textAlign: 'center' }}>
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
      ) : (
        /* Gráficos y Reseñas para usuarios con estacionamientos */
        <Grid container spacing={3}>
          {/* Gráfico de Ingresos */}
          <Grid item xs={12} lg={8}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Ingresos Diarios
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
                  <ToggleButton value="15">15 días</ToggleButton>
                  <ToggleButton value="30">1 mes</ToggleButton>
                  <ToggleButton value="90">3 meses</ToggleButton>
                </ToggleButtonGroup>
              </Box>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={ingresosDiarios}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="fecha" 
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    style={{ fontSize: '12px' }}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`$${value}`, 'Ingresos']}
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #ccc',
                      borderRadius: '8px',
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="ingresos" 
                    stroke="#00B4D8" 
                    strokeWidth={3}
                    dot={{ fill: '#00B4D8', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Últimas Reseñas */}
          <Grid item xs={12} lg={4}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Últimas Reseñas
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {resenas.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                    Aún no tienes reseñas
                  </Typography>
                ) : (
                  resenas.map((resena) => (
                    <Card key={resena.id} variant="outlined" sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 1 }}>
                        <Avatar sx={{ bgcolor: '#00B4D8', width: 32, height: 32, fontSize: '0.875rem' }}>
                          {resena.usuario_nombre.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {resena.usuario_nombre}
                            </Typography>
                            {!resena.respondida && (
                              <Chip label="Sin responder" size="small" color="warning" sx={{ height: 20 }} />
                            )}
                          </Box>
                          <Rating value={resena.calificacion} size="small" readOnly sx={{ mb: 0.5 }} />
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                            {resena.estacionamiento_nombre}
                          </Typography>
                          <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                            {resena.comentario}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {format(new Date(resena.created_at), 'dd MMM yyyy', { locale: es })}
                          </Typography>
                        </Box>
                      </Box>
                    </Card>
                  ))
                )}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Container>
  );
}
