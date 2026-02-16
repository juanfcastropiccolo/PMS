'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Tabs,
  Tab,
} from '@mui/material';
import { supabase } from '@/lib/supabaseClient';

interface Reserva {
  id: string;
  codigo_reserva: string;
  fecha_inicio: string;
  fecha_fin: string;
  estado: string;
  monto_total: number;
  estacionamiento: {
    nombre: string;
  };
  usuario: {
    email: string;
  };
}

export default function ReservasPage() {
  const { user } = useAuth();
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    loadReservas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, tabValue]);

  const loadReservas = async () => {
    if (!user) return;

    try {
      // Obtener estacionamientos del propietario (cast por inferencia de tipos)
      const { data: rawEst, error: estError } = await supabase
        .from('estacionamientos')
        .select('id')
        .eq('propietario_id', user.id);
      const estacionamientos = rawEst as { id: string }[] | null;

      if (estError) throw estError;

      const estacionamientoIds = estacionamientos?.map((e) => e.id) || [];

      if (estacionamientoIds.length === 0) {
        setReservas([]);
        setLoading(false);
        return;
      }

      // Filtrar por estado según el tab
      let query = supabase
        .from('reservas_estacionamiento')
        .select(`
          *,
          estacionamiento:estacionamientos(nombre),
          usuario:auth.users(email)
        `)
        .in('estacionamiento_id', estacionamientoIds)
        .order('created_at', { ascending: false });

      if (tabValue === 1) {
        query = query.in('estado', ['confirmada', 'en_curso']);
      } else if (tabValue === 2) {
        query = query.eq('estado', 'completada');
      }

      const { data, error } = await query;

      if (error) throw error;
      setReservas(data || []);
    } catch (error) {
      console.error('Error loading reservas:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEstadoChip = (estado: string) => {
    const config = {
      pendiente: { label: 'Pendiente', color: 'warning' as const },
      confirmada: { label: 'Confirmada', color: 'success' as const },
      en_curso: { label: 'En Curso', color: 'info' as const },
      completada: { label: 'Completada', color: 'default' as const },
      cancelada: { label: 'Cancelada', color: 'error' as const },
      no_show: { label: 'No Show', color: 'error' as const },
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
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 4 }}>
        Reservas
      </Typography>

      <Card>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Todas" />
          <Tab label="Activas" />
          <Tab label="Completadas" />
        </Tabs>

        <CardContent>
          {reservas.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                No hay reservas para mostrar
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Código</TableCell>
                    <TableCell>Estacionamiento</TableCell>
                    <TableCell>Cliente</TableCell>
                    <TableCell>Fecha Inicio</TableCell>
                    <TableCell>Fecha Fin</TableCell>
                    <TableCell>Monto</TableCell>
                    <TableCell>Estado</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reservas.map((reserva) => (
                    <TableRow key={reserva.id}>
                      <TableCell>{reserva.codigo_reserva}</TableCell>
                      <TableCell>{reserva.estacionamiento?.nombre}</TableCell>
                      <TableCell>{reserva.usuario?.email}</TableCell>
                      <TableCell>{new Date(reserva.fecha_inicio).toLocaleString()}</TableCell>
                      <TableCell>{new Date(reserva.fecha_fin).toLocaleString()}</TableCell>
                      <TableCell>${reserva.monto_total}</TableCell>
                      <TableCell>{getEstadoChip(reserva.estado)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

