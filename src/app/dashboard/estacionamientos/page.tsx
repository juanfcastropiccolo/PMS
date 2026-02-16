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
} from '@mui/material';
import { LocalParking } from '@mui/icons-material';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

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
}

export default function EstacionamientosPage() {
  const { user } = useAuth();
  const [estacionamientos, setEstacionamientos] = useState<Estacionamiento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEstacionamientos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadEstacionamientos = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('estacionamientos')
        .select('id, nombre, direccion, tipo, capacidad, precio_hora, activo, verificado, estado_verificacion, calificacion_promedio, total_reservas, timestamp, foto_portada_url, foto_perfil_url')
        .eq('propietario_id', user.id)
        .eq('es_marketplace', true)
        .order('timestamp', { ascending: false });

      if (error) throw error;
      setEstacionamientos(data || []);
    } catch (error) {
      console.error('Error loading estacionamientos:', error);
    } finally {
      setLoading(false);
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
            return (
              <Grid item xs={12} sm={6} md={4} key={estacionamiento.id}>
                <Card sx={{ overflow: 'hidden', transition: 'transform 0.2s, box-shadow 0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 } }}>
                  {/* Imagen de Portada con Foto de Perfil */}
                  <Box sx={{ position: 'relative', height: 240 }}>
                    {/* Portada */}
                    <Box
                      sx={{
                        width: '100%',
                        height: '100%',
                        background: estacionamiento.foto_portada_url
                          ? `url(${estacionamiento.foto_portada_url})`
                          : 'linear-gradient(135deg, #00B4D8 0%, #0077B6 100%)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center 35%', // Posición estratégica para no cortar mucho
                        backgroundRepeat: 'no-repeat',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {/* Ícono placeholder si no hay foto */}
                      {!estacionamiento.foto_portada_url && (
                        <LocalParking 
                          sx={{ 
                            fontSize: 80, 
                            color: 'rgba(255, 255, 255, 0.3)' 
                          }} 
                        />
                      )}
                    </Box>
                    
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

