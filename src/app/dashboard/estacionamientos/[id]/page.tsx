'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  Avatar,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  LocationOn as LocationIcon,
  AttachMoney as MoneyIcon,
  EventAvailable as CalendarIcon,
} from '@mui/icons-material';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import ImageUpload from '@/components/ImageUpload';

interface Estacionamiento {
  id: string;
  nombre: string;
  tipo: string;
  direccion: string;
  lat: number;
  lng: number;
  capacidad: number;
  cantidad_pisos: number;
  precio_hora: number;
  precio_por_dia: number | null;
  precio_por_mes: number | null;
  moneda: string;
  horario: any;
  abierto_24h: boolean;
  caracteristicas: string[];
  altura_maxima: number;
  activo: boolean;
  verificado: boolean;
  estado_verificacion: string;
  calificacion_promedio: number | null;
  total_reservas: number;
  espacios_disponibles: number;
  timestamp: string;
  foto_perfil_url: string | null;
  foto_portada_url: string | null;
}

export default function EstacionamientoDetallePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [estacionamiento, setEstacionamiento] = useState<Estacionamiento | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const id = params.id as string;

  useEffect(() => {
    if (id && user) {
      loadEstacionamiento();
    }
  }, [id, user]);

  const loadEstacionamiento = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('estacionamientos')
        .select('*')
        .eq('id', id)
        .eq('propietario_id', user?.id)
        .single();

      if (fetchError) throw fetchError;
      setEstacionamiento(data);
    } catch (err: any) {
      console.error('Error loading estacionamiento:', err);
      setError(err.message || 'Error al cargar el estacionamiento');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUploaded = (url: string, tipo: 'perfil' | 'portada') => {
    if (estacionamiento) {
      setEstacionamiento({
        ...estacionamiento,
        [tipo === 'perfil' ? 'foto_perfil_url' : 'foto_portada_url']: url,
      });
    }
  };

  const getEstadoChip = (estado: string) => {
    const config = {
      pendiente: { label: 'Pendiente', color: 'warning' as const },
      aprobado: { label: 'Aprobado', color: 'success' as const },
      rechazado: { label: 'Rechazado', color: 'error' as const },
      suspendido: { label: 'Suspendido', color: 'default' as const },
    };

    const { label, color } = config[estado as keyof typeof config] || config.pendiente;

    return <Chip label={label} color={color} />;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !estacionamiento) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error" sx={{ mt: 4 }}>
          {error || 'Estacionamiento no encontrado'}
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push('/dashboard/estacionamientos')}
          sx={{ mt: 2 }}
        >
          Volver a Estacionamientos
        </Button>
      </Container>
    );
  }

  return (
    <Box>
      {/* Header con Portada y Foto de Perfil - Estilo Facebook */}
      <Box sx={{ position: 'relative', bgcolor: 'white', borderBottom: '1px solid #e4e6eb' }}>
        {/* Foto de Portada */}
        <Box sx={{ position: 'relative', height: 400, bgcolor: '#f0f2f5' }}>
          <ImageUpload
            currentImageUrl={estacionamiento.foto_portada_url}
            onImageUploaded={(url) => handleImageUploaded(url, 'portada')}
            userId={user?.id || ''}
            estacionamientoId={estacionamiento.id}
            tipo="portada"
            height={400}
          />

          {/* Botón Volver (sobre la portada) */}
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => router.push('/dashboard/estacionamientos')}
            sx={{
              position: 'absolute',
              top: 16,
              left: 16,
              bgcolor: 'rgba(255, 255, 255, 0.9)',
              '&:hover': { bgcolor: 'white' },
            }}
          >
            Volver
          </Button>
        </Box>

        {/* Container para Foto de Perfil y Info */}
        <Container maxWidth="lg">
          <Box sx={{ position: 'relative', pb: 2 }}>
            {/* Foto de Perfil Circular (superpuesta) */}
            <Box
              sx={{
                position: 'absolute',
                bottom: 16,
                left: 24,
                width: 168,
                height: 168,
                border: '4px solid white',
                borderRadius: '50%',
                bgcolor: 'white',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
              }}
            >
              <ImageUpload
                currentImageUrl={estacionamiento.foto_perfil_url}
                onImageUploaded={(url) => handleImageUploaded(url, 'perfil')}
                userId={user?.id || ''}
                estacionamientoId={estacionamiento.id}
                tipo="perfil"
                width={160}
                height={160}
                borderRadius="50%"
              />
            </Box>

            {/* Nombre y Botón Editar */}
            <Box
              sx={{
                ml: '208px', // Espacio para la foto de perfil
                pt: 2,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
              }}
            >
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#050505', mb: 0.5 }}>
                  {estacionamiento.nombre}
                </Typography>
                {getEstadoChip(estacionamiento.estado_verificacion)}
              </Box>

              <Link href={`/dashboard/estacionamientos/${id}/editar`} passHref legacyBehavior>
                <Button variant="contained" startIcon={<EditIcon />}>
                  Editar
                </Button>
              </Link>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Contenido Principal */}
      <Container maxWidth="lg" sx={{ mt: 3, mb: 4 }}>
        <Grid container spacing={3}>
          {/* Información Básica */}
          <Grid item xs={12} md={8}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Información Básica
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Tipo
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {estacionamiento.tipo.replace('_', ' ')}
                    </Typography>
                  </Grid>

                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Capacidad
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {estacionamiento.capacidad} espacios
                    </Typography>
                  </Grid>

                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Pisos
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {estacionamiento.cantidad_pisos}
                    </Typography>
                  </Grid>

                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Altura Máxima
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {estacionamiento.altura_maxima}m
                    </Typography>
                  </Grid>

                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Disponibles
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {estacionamiento.espacios_disponibles} espacios
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Ubicación */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  <LocationIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Ubicación
                </Typography>

                <Typography variant="body1" sx={{ mb: 2 }}>
                  {estacionamiento.direccion}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  Coordenadas: {estacionamiento.lat}, {estacionamiento.lng}
                </Typography>
              </CardContent>
            </Card>

            {/* Precios */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  <MoneyIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Precios
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">
                      Por Hora
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      ${estacionamiento.precio_hora}
                    </Typography>
                  </Grid>

                  {estacionamiento.precio_por_dia && (
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">
                        Por Día
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        ${estacionamiento.precio_por_dia}
                      </Typography>
                    </Grid>
                  )}

                  {estacionamiento.precio_por_mes && (
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">
                        Por Mes
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        ${estacionamiento.precio_por_mes}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>

            {/* Características */}
            {estacionamiento.caracteristicas && estacionamiento.caracteristicas.length > 0 && (
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Características
                  </Typography>

                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {estacionamiento.caracteristicas.map((car: string, index: number) => (
                      <Chip key={index} label={car} />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            )}
          </Grid>

          {/* Sidebar */}
          <Grid item xs={12} md={4}>
            {/* Estadísticas */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Estadísticas
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Total Reservas
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {estacionamiento.total_reservas || 0}
                  </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Calificación
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {estacionamiento.calificacion_promedio?.toFixed(1) || 'N/A'}
                  </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Estado
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Chip
                      label={estacionamiento.activo ? 'Activo' : 'Inactivo'}
                      color={estacionamiento.activo ? 'success' : 'default'}
                      size="small"
                    />
                    {estacionamiento.verificado && (
                      <Chip label="Verificado" color="info" size="small" sx={{ ml: 1 }} />
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Horarios */}
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  <CalendarIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Horarios
                </Typography>

                {estacionamiento.abierto_24h ? (
                  <Typography variant="body1" sx={{ color: 'success.main', fontWeight: 600 }}>
                    Abierto 24 horas
                  </Typography>
                ) : (
                  <Box>
                    {Object.entries(estacionamiento.horario || {}).map(([dia, horario]: [string, any]) => (
                      <Box key={dia} sx={{ mb: 1 }}>
                        <Typography
                          variant="body2"
                          sx={{ textTransform: 'capitalize', fontWeight: 600 }}
                        >
                          {dia}:
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {horario.cerrado
                            ? 'Cerrado'
                            : `${horario.abre} - ${horario.cierra}`}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
