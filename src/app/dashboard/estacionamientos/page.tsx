'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Chip,
  CircularProgress,
} from '@mui/material';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

interface Estacionamiento {
  id: string;
  nombre: string;
  direccion_completa: string;
  tipo: string;
  capacidad_total: number;
  precio_por_hora: number;
  activo: boolean;
  verificado: boolean;
  estado_verificacion: string;
  calificacion_promedio: number | null;
  total_reservas: number;
  fotos: Array<{ url: string; es_principal: boolean }> | null;
}

export default function EstacionamientosPage() {
  const { user } = useAuth();
  const [estacionamientos, setEstacionamientos] = useState<Estacionamiento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEstacionamientos();
  }, [user]);

  const loadEstacionamientos = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('v_estacionamientos_con_propietario')
        .select('*')
        .eq('propietario_id', user.id)
        .order('created_at', { ascending: false });

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
            const fotos = estacionamiento.fotos as Array<{ url: string; es_principal: boolean }> | null;
            const fotoPrincipal = fotos?.find(f => f.es_principal) || fotos?.[0];

            return (
              <Grid item xs={12} sm={6} md={4} key={estacionamiento.id}>
                <Card>
                  {/* Imagen */}
                  <CardMedia
                    component="img"
                    height="200"
                    image={fotoPrincipal?.url || '/placeholder-parking.jpg'}
                    alt={estacionamiento.nombre}
                  />

                  <CardContent>
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
                      {estacionamiento.direccion_completa}
                    </Typography>

                    {/* Stats */}
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Capacidad
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {estacionamiento.capacidad_total} espacios
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Precio/hora
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          ${estacionamiento.precio_por_hora}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Reservas
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {estacionamiento.total_reservas}
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

