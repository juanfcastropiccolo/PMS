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
  Chip,
  CircularProgress,
  IconButton,
} from '@mui/material';
import {
  LocalParking,
  ChevronLeft,
  ChevronRight,
} from '@mui/icons-material';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

interface FotoEstacionamiento {
  id: string;
  url: string;
  orden: number;
  es_principal: boolean;
}

interface Estacionamiento {
  id: string;
  nombre: string;
  direccion: string;
  tipo: string;
  capacidad: number;
  precio_hora: number;
  activo: boolean;
  verificado: boolean;
  estado_verificacion: string;
  calificacion_promedio: number | null;
  total_reservas: number;
  foto_portada_url: string | null;
  foto_perfil_url: string | null;
  fotos_estacionamiento: FotoEstacionamiento[];
}

export default function EstacionamientosPage() {
  const { user } = useAuth();
  const [estacionamientos, setEstacionamientos] = useState<Estacionamiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState<Record<string, number>>({});

  useEffect(() => {
    loadEstacionamientos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadEstacionamientos = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('estacionamientos')
        .select('id, nombre, direccion, tipo, capacidad, precio_hora, activo, verificado, estado_verificacion, calificacion_promedio, total_reservas, timestamp, foto_portada_url, foto_perfil_url, fotos_estacionamiento(id, url, orden, es_principal)')
        .eq('propietario_id', user.id)
        .eq('es_marketplace', true)
        .order('timestamp', { ascending: false });

      if (error) throw error;

      // Sort photos by orden for each estacionamiento
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sorted = (data || []).map((est: any) => ({
        ...est,
        fotos_estacionamiento: (est.fotos_estacionamiento || []).sort(
          (a: FotoEstacionamiento, b: FotoEstacionamiento) => a.orden - b.orden
        ),
      }));

      setEstacionamientos(sorted as Estacionamiento[]);
    } catch (error) {
      console.error('Error loading estacionamientos:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPhotos = (est: Estacionamiento): string[] => {
    return est.fotos_estacionamiento.map((f) => f.url).filter(Boolean);
  };

  const handlePrevPhoto = (estId: string, totalPhotos: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentPhotoIndex((prev) => ({
      ...prev,
      [estId]: ((prev[estId] || 0) - 1 + totalPhotos) % totalPhotos,
    }));
  };

  const handleNextPhoto = (estId: string, totalPhotos: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentPhotoIndex((prev) => ({
      ...prev,
      [estId]: ((prev[estId] || 0) + 1) % totalPhotos,
    }));
  };

  const getEstadoChip = (estado: string) => {
    const config = {
      pendiente: { label: 'Pendiente', color: 'warning' as const },
      aprobado: { label: 'Aprobado', color: 'success' as const },
      rechazado: { label: 'Rechazado', color: 'error' as const },
      suspendido: { label: 'Suspendido', color: 'default' as const },
    };

    const { label, color } = config[estado as keyof typeof config] || config.pendiente;

    return <Chip label={label} color={color} size="small" />;
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
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Mis Estacionamientos
        </Typography>

        <Link href="/dashboard/estacionamientos/nuevo" passHref legacyBehavior>
          <Button
            variant="contained"
            sx={{
              bgcolor: '#00B4D8',
              '&:hover': { bgcolor: '#0077B6' },
            }}
          >
            + Nuevo Estacionamiento
          </Button>
        </Link>
      </Box>

      {/* Lista */}
      {estacionamientos.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
              No tienes estacionamientos registrados
            </Typography>
            <Link href="/dashboard/estacionamientos/nuevo" passHref legacyBehavior>
              <Button variant="contained">
                Crear Mi Primer Estacionamiento
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {estacionamientos.map((estacionamiento) => {
            const photos = getPhotos(estacionamiento);
            const currentIndex = currentPhotoIndex[estacionamiento.id] || 0;
            const currentPhoto = photos[currentIndex];
            const hasPhotos = photos.length > 0;
            const hasMultiplePhotos = photos.length > 1;

            return (
              <Grid item xs={12} sm={6} md={4} key={estacionamiento.id}>
                <Card sx={{ overflow: 'hidden', transition: 'transform 0.2s, box-shadow 0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 } }}>
                  {/* Imagen con Carousel */}
                  <Box sx={{ position: 'relative', height: 240 }}>
                    <Box
                      sx={{
                        width: '100%',
                        height: '100%',
                        background: currentPhoto
                          ? `url(${currentPhoto})`
                          : estacionamiento.foto_portada_url
                            ? `url(${estacionamiento.foto_portada_url})`
                            : 'linear-gradient(135deg, #00B4D8 0%, #0077B6 100%)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center 35%',
                        backgroundRepeat: 'no-repeat',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {!hasPhotos && !estacionamiento.foto_portada_url && (
                        <LocalParking
                          sx={{
                            fontSize: 80,
                            color: 'rgba(255, 255, 255, 0.3)',
                          }}
                        />
                      )}
                    </Box>

                    {/* Flechas del carousel */}
                    {hasMultiplePhotos && (
                      <>
                        <IconButton
                          onClick={(e) => handlePrevPhoto(estacionamiento.id, photos.length, e)}
                          sx={{
                            position: 'absolute',
                            left: 4,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            bgcolor: 'rgba(255, 255, 255, 0.85)',
                            width: 32,
                            height: 32,
                            '&:hover': { bgcolor: 'white' },
                            boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                          }}
                        >
                          <ChevronLeft fontSize="small" />
                        </IconButton>
                        <IconButton
                          onClick={(e) => handleNextPhoto(estacionamiento.id, photos.length, e)}
                          sx={{
                            position: 'absolute',
                            right: 4,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            bgcolor: 'rgba(255, 255, 255, 0.85)',
                            width: 32,
                            height: 32,
                            '&:hover': { bgcolor: 'white' },
                            boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                          }}
                        >
                          <ChevronRight fontSize="small" />
                        </IconButton>

                        {/* Indicador de posición */}
                        <Box
                          sx={{
                            position: 'absolute',
                            bottom: 8,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            display: 'flex',
                            gap: 0.5,
                          }}
                        >
                          {photos.map((_, idx) => (
                            <Box
                              key={idx}
                              sx={{
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                bgcolor: idx === currentIndex ? 'white' : 'rgba(255,255,255,0.5)',
                                transition: 'background-color 0.2s',
                              }}
                            />
                          ))}
                        </Box>
                      </>
                    )}

                    {/* Foto de Perfil (pequeña, esquina inferior izquierda) */}
                    {estacionamiento.foto_perfil_url && (
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: -20,
                          left: 16,
                          width: 64,
                          height: 64,
                          borderRadius: '50%',
                          border: '3px solid white',
                          backgroundImage: `url(${estacionamiento.foto_perfil_url})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                          bgcolor: 'white',
                        }}
                      />
                    )}
                  </Box>

                  <CardContent sx={{ pt: estacionamiento.foto_perfil_url ? 3 : 2 }}>
                    {/* Header con estado */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                          {estacionamiento.nombre}
                        </Typography>
                        {getEstadoChip(estacionamiento.estado_verificacion)}
                      </Box>
                    </Box>

                    {/* Dirección */}
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {estacionamiento.direccion}
                    </Typography>

                    {/* Stats */}
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Capacidad
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {estacionamiento.capacidad} espacios
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Precio/hora
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          ${estacionamiento.precio_hora}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Reservas
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {estacionamiento.total_reservas || 0}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Acciones */}
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Link href={`/dashboard/estacionamientos/${estacionamiento.id}`} passHref legacyBehavior style={{ flex: 1 }}>
                        <Button fullWidth variant="outlined" size="small">
                          Ver Detalles
                        </Button>
                      </Link>

                      <Link href={`/dashboard/estacionamientos/${estacionamiento.id}/editar`} passHref legacyBehavior style={{ flex: 1 }}>
                        <Button fullWidth variant="contained" size="small">
                          Editar
                        </Button>
                      </Link>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
}
