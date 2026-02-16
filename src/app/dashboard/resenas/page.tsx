'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  Grid,
  Rating,
  Chip,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Avatar,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Star as StarIcon,
  Reply as ReplyIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';

interface Resena {
  id: string;
  estacionamiento_id: string;
  user_id: string;
  calificacion: number;
  comentario: string | null;
  created_at: string;
  usuario_nombre: string | null;
  aprobado: boolean;
  reportado: boolean;
  limpieza: number | null;
  seguridad: number | null;
  accesibilidad: number | null;
  relacion_precio_calidad: number | null;
  es_verificada: boolean;
  respuesta_propietario: string | null;
  respondida_at: string | null;
  estado_moderacion: string;
  votos_utiles: number;
  estacionamiento: {
    nombre: string;
  };
}

export default function ResenasPage() {
  const { user } = useAuth();
  const [resenas, setResenas] = useState<Resena[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstacionamiento, setFiltroEstacionamiento] = useState<string>('todos');
  const [estacionamientos, setEstacionamientos] = useState<{ id: string; nombre: string }[]>([]);
  const [dialogAbierto, setDialogAbierto] = useState(false);
  const [resenaSeleccionada, setResenaSeleccionada] = useState<Resena | null>(null);
  const [respuesta, setRespuesta] = useState('');
  const [enviandoRespuesta, setEnviandoRespuesta] = useState(false);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      // Cargar estacionamientos del propietario (cast por inferencia de tipos)
      const { data: rawEst } = await supabase
        .from('estacionamientos')
        .select('id, nombre')
        .eq('propietario_id', user.id)
        .eq('es_marketplace', true);
      const estacionamientosData = rawEst as { id: string; nombre: string }[] | null;

      setEstacionamientos(estacionamientosData || []);

      // Cargar reseñas de todos los estacionamientos del propietario
      const estacionamientoIds = estacionamientosData?.map((e) => e.id) || [];
      
      if (estacionamientoIds.length > 0) {
        const { data: resenasData, error } = await supabase
          .from('resenas')
          .select(`
            *,
            estacionamiento:estacionamientos(nombre)
          `)
          .in('estacionamiento_id', estacionamientoIds)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setResenas(resenasData || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar las reseñas');
    } finally {
      setLoading(false);
    }
  };

  const handleResponder = (resena: Resena) => {
    setResenaSeleccionada(resena);
    setRespuesta(resena.respuesta_propietario || '');
    setDialogAbierto(true);
  };

  const handleEnviarRespuesta = async () => {
    if (!resenaSeleccionada || !respuesta.trim()) return;

    setEnviandoRespuesta(true);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('resenas')
        .update({
          respuesta_propietario: respuesta.trim(),
          respondida_at: new Date().toISOString(),
        })
        .eq('id', resenaSeleccionada.id);

      if (error) throw error;

      toast.success('Respuesta enviada exitosamente');
      setDialogAbierto(false);
      loadData(); // Recargar datos
    } catch (error) {
      console.error('Error sending response:', error);
      toast.error('Error al enviar la respuesta');
    } finally {
      setEnviandoRespuesta(false);
    }
  };

  const resenasFiltradas = filtroEstacionamiento === 'todos'
    ? resenas
    : resenas.filter(r => r.estacionamiento_id === filtroEstacionamiento);

  // Calcular estadísticas
  const totalResenas = resenasFiltradas.length;
  const promedioGeneral = totalResenas > 0
    ? resenasFiltradas.reduce((sum, r) => sum + r.calificacion, 0) / totalResenas
    : 0;
  const resenasConRespuesta = resenasFiltradas.filter(r => r.respuesta_propietario).length;
  const resenasVerificadas = resenasFiltradas.filter(r => r.es_verificada).length;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      {/* Header con Estadísticas */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
          Reseñas
        </Typography>

        {/* Cards de Estadísticas */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  Total Reseñas
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {totalResenas}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  Calificación Promedio
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {promedioGeneral.toFixed(1)}
                  </Typography>
                  <StarIcon sx={{ color: '#FFB400', fontSize: 32 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  Con Respuesta
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {resenasConRespuesta}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  Verificadas
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {resenasVerificadas}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filtro */}
        <FormControl sx={{ minWidth: 250 }}>
          <InputLabel>Filtrar por Estacionamiento</InputLabel>
          <Select
            value={filtroEstacionamiento}
            label="Filtrar por Estacionamiento"
            onChange={(e) => setFiltroEstacionamiento(e.target.value)}
          >
            <MenuItem value="todos">Todos los estacionamientos</MenuItem>
            {estacionamientos.map((est) => (
              <MenuItem key={est.id} value={est.id}>
                {est.nombre}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Lista de Reseñas */}
      {resenasFiltradas.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary">
              No hay reseñas todavía
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Las reseñas aparecerán aquí cuando los clientes las publiquen
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {resenasFiltradas.map((resena) => (
            <Card key={resena.id}>
              <CardContent>
                <Grid container spacing={2}>
                  {/* Información del Usuario */}
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <Avatar sx={{ bgcolor: '#00B4D8' }}>
                          {resena.usuario_nombre?.charAt(0) || 'U'}
                        </Avatar>
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                              {resena.usuario_nombre || 'Usuario Anónimo'}
                            </Typography>
                            {resena.es_verificada && (
                              <Chip
                                icon={<CheckCircleIcon />}
                                label="Verificada"
                                size="small"
                                color="success"
                                sx={{ height: 20 }}
                              />
                            )}
                            {resena.reportado && (
                              <Chip
                                icon={<WarningIcon />}
                                label="Reportada"
                                size="small"
                                color="error"
                                sx={{ height: 20 }}
                              />
                            )}
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            {resena.estacionamiento?.nombre} • {new Date(resena.created_at).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Rating value={resena.calificacion} readOnly />
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          {resena.calificacion.toFixed(1)}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  {/* Calificaciones Detalladas */}
                  {(resena.limpieza || resena.seguridad || resena.accesibilidad || resena.relacion_precio_calidad) && (
                    <Grid item xs={12}>
                      <Grid container spacing={2}>
                        {resena.limpieza && (
                          <Grid item xs={6} sm={3}>
                            <Typography variant="caption" color="text.secondary">
                              Limpieza
                            </Typography>
                            <Rating value={resena.limpieza} size="small" readOnly />
                          </Grid>
                        )}
                        {resena.seguridad && (
                          <Grid item xs={6} sm={3}>
                            <Typography variant="caption" color="text.secondary">
                              Seguridad
                            </Typography>
                            <Rating value={resena.seguridad} size="small" readOnly />
                          </Grid>
                        )}
                        {resena.accesibilidad && (
                          <Grid item xs={6} sm={3}>
                            <Typography variant="caption" color="text.secondary">
                              Accesibilidad
                            </Typography>
                            <Rating value={resena.accesibilidad} size="small" readOnly />
                          </Grid>
                        )}
                        {resena.relacion_precio_calidad && (
                          <Grid item xs={6} sm={3}>
                            <Typography variant="caption" color="text.secondary">
                              Precio/Calidad
                            </Typography>
                            <Rating value={resena.relacion_precio_calidad} size="small" readOnly />
                          </Grid>
                        )}
                      </Grid>
                    </Grid>
                  )}

                  {/* Comentario */}
                  {resena.comentario && (
                    <Grid item xs={12}>
                      <Typography variant="body1">
                        {resena.comentario}
                      </Typography>
                    </Grid>
                  )}

                  {/* Respuesta del Propietario */}
                  {resena.respuesta_propietario && (
                    <Grid item xs={12}>
                      <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: 1, ml: 4 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                          Respuesta del propietario
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {resena.respuesta_propietario}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                          {new Date(resena.respondida_at!).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Grid>
                  )}

                  {/* Botón Responder */}
                  <Grid item xs={12}>
                    <Button
                      startIcon={<ReplyIcon />}
                      variant={resena.respuesta_propietario ? 'outlined' : 'contained'}
                      size="small"
                      onClick={() => handleResponder(resena)}
                    >
                      {resena.respuesta_propietario ? 'Editar Respuesta' : 'Responder'}
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* Dialog para Responder */}
      <Dialog open={dialogAbierto} onClose={() => setDialogAbierto(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {resenaSeleccionada?.respuesta_propietario ? 'Editar Respuesta' : 'Responder Reseña'}
        </DialogTitle>
        <DialogContent>
          {resenaSeleccionada && (
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Rating value={resenaSeleccionada.calificacion} readOnly size="small" />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {resenaSeleccionada.usuario_nombre}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {resenaSeleccionada.comentario}
              </Typography>
            </Box>
          )}
          <Divider sx={{ my: 2 }} />
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Tu Respuesta"
            value={respuesta}
            onChange={(e) => setRespuesta(e.target.value)}
            placeholder="Escribe tu respuesta..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogAbierto(false)}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleEnviarRespuesta}
            disabled={!respuesta.trim() || enviandoRespuesta}
          >
            {enviandoRespuesta ? 'Enviando...' : 'Enviar Respuesta'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}



