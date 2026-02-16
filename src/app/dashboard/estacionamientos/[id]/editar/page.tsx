'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  FormControlLabel,
  Switch,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';

const tiposEstacionamiento = [
  { value: 'cochera_particular', label: 'Cochera Particular' },
  { value: 'privado', label: 'Privado' },
  { value: 'comercial', label: 'Comercial' },
  { value: 'supermercado', label: 'Supermercado' },
  { value: 'shopping', label: 'Shopping' },
];

const caracteristicasDisponibles = [
  'Cubierto',
  'Seguridad 24h',
  'Cámaras de seguridad',
  'Cargador eléctrico',
  'Vigilancia',
  'Techado',
  'Portón automático',
  'Iluminación',
  'Altura libre > 2.5m',
  'Acceso discapacitados',
];

const steps = ['Información Básica', 'Ubicación', 'Precios y Horarios', 'Características'];

export default function EditarEstacionamientoPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const id = params.id as string;

  // Form data
  const [formData, setFormData] = useState({
    // Información básica
    nombre: '',
    tipo: 'cochera_particular',
    detalles: '',
    capacidad_total: 1,
    cantidad_pisos: 1,

    // Ubicación
    direccion: '',
    lat: -34.6037,
    lng: -58.3816,

    // Precios
    precio_hora: 0,
    precio_por_dia: 0,
    precio_por_mes: 0,
    moneda: 'ARS',

    // Horarios
    abierto_24h: false,
    horario: {
      lunes: { abre: '08:00', cierra: '20:00', cerrado: false },
      martes: { abre: '08:00', cierra: '20:00', cerrado: false },
      miercoles: { abre: '08:00', cierra: '20:00', cerrado: false },
      jueves: { abre: '08:00', cierra: '20:00', cerrado: false },
      viernes: { abre: '08:00', cierra: '20:00', cerrado: false },
      sabado: { abre: '09:00', cierra: '18:00', cerrado: false },
      domingo: { abre: '00:00', cierra: '00:00', cerrado: true },
    },

    // Características
    caracteristicas: [] as string[],
    altura_maxima: 2.5,
    capacidad: 1,
  });

  useEffect(() => {
    if (id && user) {
      loadEstacionamiento();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user]);

  const loadEstacionamiento = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('estacionamientos')
        .select('*')
        .eq('id', id)
        .eq('propietario_id', user!.id)
        .single();

      if (fetchError) throw fetchError;

      if (data) {
        setFormData({
          nombre: data.nombre || '',
          tipo: data.tipo || 'cochera_particular',
          detalles: data.detalles || '',
          capacidad_total: data.capacidad || 1,
          cantidad_pisos: data.cantidad_pisos || 1,
          direccion: data.direccion || '',
          lat: data.lat || -34.6037,
          lng: data.lng || -58.3816,
          precio_hora: parseFloat(data.precio_hora?.toString() || '0'),
          precio_por_dia: parseFloat(data.precio_por_dia?.toString() || '0'),
          precio_por_mes: parseFloat(data.precio_por_mes?.toString() || '0'),
          moneda: data.moneda || 'ARS',
          abierto_24h: data.abierto_24h || false,
          horario: data.horario || {
            lunes: { abre: '08:00', cierra: '20:00', cerrado: false },
            martes: { abre: '08:00', cierra: '20:00', cerrado: false },
            miercoles: { abre: '08:00', cierra: '20:00', cerrado: false },
            jueves: { abre: '08:00', cierra: '20:00', cerrado: false },
            viernes: { abre: '08:00', cierra: '20:00', cerrado: false },
            sabado: { abre: '09:00', cierra: '18:00', cerrado: false },
            domingo: { abre: '00:00', cierra: '00:00', cerrado: true },
          },
          caracteristicas: (data.caracteristicas as string[]) || [],
          altura_maxima: parseFloat(data.altura_maxima?.toString() || '2.5'),
          capacidad: data.capacidad || 1,
        });
      }
    } catch (err: unknown) {
      console.error('Error loading estacionamiento:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar el estacionamiento');
    } finally {
      setLoadingData(false);
    }
  };

  const handleChange = (field: string, value: string | number | boolean | string[]) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleHorarioChange = (dia: string, field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      horario: {
        ...prev.horario,
        [dia]: {
          ...prev.horario[dia as keyof typeof prev.horario],
          [field]: value,
        },
      },
    }));
  };

  const toggleCaracteristica = (caracteristica: string) => {
    setFormData((prev) => ({
      ...prev,
      caracteristicas: prev.caracteristicas.includes(caracteristica)
        ? prev.caracteristicas.filter((c) => c !== caracteristica)
        : [...prev.caracteristicas, caracteristica],
    }));
  };

  const handleNext = () => {
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    if (!user) {
      setError('Debes estar autenticado para actualizar el estacionamiento');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Validar precios según constraint
      const precioPorDia = formData.precio_por_dia > 0 
        ? Math.max(formData.precio_por_dia, formData.precio_hora * 8)
        : null;
      
      const precioPorMes = formData.precio_por_mes > 0
        ? Math.max(formData.precio_por_mes, (precioPorDia || 0) * 20)
        : null;

      // Update estacionamiento
      const { error: updateError } = await supabase
        .from('estacionamientos')
        .update({
          nombre: formData.nombre,
          tipo: formData.tipo,
          detalles: formData.detalles,
          direccion: formData.direccion,
          lat: formData.lat,
          lng: formData.lng,
          capacidad: formData.capacidad,
          cantidad_pisos: formData.cantidad_pisos,
          precio_hora: formData.precio_hora,
          precio_por_dia: precioPorDia,
          precio_por_mes: precioPorMes,
          moneda: formData.moneda,
          horario: formData.horario,
          abierto_24h: formData.abierto_24h,
          caracteristicas: formData.caracteristicas,
          altura_maxima: formData.altura_maxima,
        })
        .eq('id', id)
        .eq('propietario_id', user.id);

      if (updateError) throw updateError;

      setSuccess(true);
      toast.success('Estacionamiento actualizado exitosamente');
      
      setTimeout(() => {
        router.push(`/dashboard/estacionamientos/${id}`);
      }, 2000);
    } catch (err: unknown) {
      console.error('Error updating estacionamiento:', err);
      setError(err instanceof Error ? err.message : 'Error al actualizar el estacionamiento');
      toast.error('Error al actualizar el estacionamiento');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nombre del Estacionamiento"
                value={formData.nombre}
                onChange={(e) => handleChange('nombre', e.target.value)}
                required
                placeholder="Ej: Estacionamiento Centro"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Tipo de Estacionamiento</InputLabel>
                <Select
                  value={formData.tipo}
                  onChange={(e) => handleChange('tipo', e.target.value)}
                  label="Tipo de Estacionamiento"
                >
                  {tiposEstacionamiento.map((tipo) => (
                    <MenuItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Capacidad Total"
                value={formData.capacidad}
                onChange={(e) => handleChange('capacidad', parseInt(e.target.value))}
                required
                inputProps={{ min: 1 }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Cantidad de Pisos"
                value={formData.cantidad_pisos}
                onChange={(e) => handleChange('cantidad_pisos', parseInt(e.target.value))}
                inputProps={{ min: 1 }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Descripción"
                value={formData.detalles}
                onChange={(e) => handleChange('detalles', e.target.value)}
                placeholder="Describe tu estacionamiento..."
              />
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Dirección"
                value={formData.direccion}
                onChange={(e) => handleChange('direccion', e.target.value)}
                required
                placeholder="Ej: Av. Corrientes 1234, CABA"
                helperText="Dirección completa del estacionamiento"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Latitud"
                value={formData.lat}
                onChange={(e) => handleChange('lat', parseFloat(e.target.value))}
                inputProps={{ step: 0.0001 }}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Longitud"
                value={formData.lng}
                onChange={(e) => handleChange('lng', parseFloat(e.target.value))}
                inputProps={{ step: 0.0001 }}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <Alert severity="info">
                Puedes usar Google Maps para obtener las coordenadas exactas de tu estacionamiento
              </Alert>
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Precios
              </Typography>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Precio por Hora (ARS)"
                value={formData.precio_hora}
                onChange={(e) => handleChange('precio_hora', parseFloat(e.target.value))}
                required
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Precio por Día (ARS)"
                value={formData.precio_por_dia}
                onChange={(e) => handleChange('precio_por_dia', parseFloat(e.target.value))}
                inputProps={{ min: 0, step: 0.01 }}
                helperText={
                  formData.precio_hora > 0
                    ? `Mínimo recomendado: $${(formData.precio_hora * 8).toFixed(2)} (8 horas)`
                    : 'Opcional - déjalo en 0 si no aplica'
                }
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Precio por Mes (ARS)"
                value={formData.precio_por_mes}
                onChange={(e) => handleChange('precio_por_mes', parseFloat(e.target.value))}
                inputProps={{ min: 0, step: 0.01 }}
                helperText={
                  formData.precio_por_dia > 0
                    ? `Mínimo recomendado: $${(formData.precio_por_dia * 20).toFixed(2)} (20 días)`
                    : 'Opcional - déjalo en 0 si no aplica'
                }
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
                Horarios
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.abierto_24h}
                    onChange={(e) => handleChange('abierto_24h', e.target.checked)}
                  />
                }
                label="Abierto 24 horas"
              />
            </Grid>

            {!formData.abierto_24h && (
              <>
                {Object.keys(formData.horario).map((dia) => (
                  <Grid item xs={12} key={dia}>
                    <Card variant="outlined">
                      <CardContent>
                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs={3}>
                            <Typography sx={{ textTransform: 'capitalize', fontWeight: 600 }}>
                              {dia}
                            </Typography>
                          </Grid>

                          <Grid item xs={3}>
                            <TextField
                              fullWidth
                              type="time"
                              label="Apertura"
                              value={formData.horario[dia as keyof typeof formData.horario].abre}
                              onChange={(e) => handleHorarioChange(dia, 'abre', e.target.value)}
                              disabled={formData.horario[dia as keyof typeof formData.horario].cerrado}
                            />
                          </Grid>

                          <Grid item xs={3}>
                            <TextField
                              fullWidth
                              type="time"
                              label="Cierre"
                              value={formData.horario[dia as keyof typeof formData.horario].cierra}
                              onChange={(e) => handleHorarioChange(dia, 'cierra', e.target.value)}
                              disabled={formData.horario[dia as keyof typeof formData.horario].cerrado}
                            />
                          </Grid>

                          <Grid item xs={3}>
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={formData.horario[dia as keyof typeof formData.horario].cerrado}
                                  onChange={(e) => handleHorarioChange(dia, 'cerrado', e.target.checked)}
                                />
                              }
                              label="Cerrado"
                            />
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </>
            )}
          </Grid>
        );

      case 3:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Características del Estacionamiento
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {caracteristicasDisponibles.map((caracteristica) => (
                  <Chip
                    key={caracteristica}
                    label={caracteristica}
                    onClick={() => toggleCaracteristica(caracteristica)}
                    color={formData.caracteristicas.includes(caracteristica) ? 'primary' : 'default'}
                    variant={formData.caracteristicas.includes(caracteristica) ? 'filled' : 'outlined'}
                  />
                ))}
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Altura Máxima (metros)"
                value={formData.altura_maxima}
                onChange={(e) => handleChange('altura_maxima', parseFloat(e.target.value))}
                inputProps={{ min: 1.8, max: 5, step: 0.1 }}
                helperText="Altura libre para vehículos"
              />
            </Grid>
          </Grid>
        );

      default:
        return null;
    }
  };

  if (loadingData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push(`/dashboard/estacionamientos/${id}`)}
          sx={{ mb: 2 }}
        >
          Volver
        </Button>

        <Typography variant="h4" sx={{ fontWeight: 700, color: '#2D3748', mb: 1 }}>
          Editar Estacionamiento
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Actualiza la información de tu estacionamiento
        </Typography>
      </Box>

      <Card>
        <CardContent sx={{ p: 4 }}>
          {/* Stepper */}
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* Error/Success Messages */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              ¡Estacionamiento actualizado exitosamente! Redirigiendo...
            </Alert>
          )}

          {/* Step Content */}
          <Box sx={{ mb: 4 }}>{renderStepContent()}</Box>

          {/* Navigation Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button disabled={activeStep === 0} onClick={handleBack}>
              Anterior
            </Button>

            <Box>
              {activeStep === steps.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={loading}
                  sx={{
                    bgcolor: '#00B4D8',
                    '&:hover': { bgcolor: '#0077B6' },
                  }}
                >
                  {loading ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  sx={{
                    bgcolor: '#00B4D8',
                    '&:hover': { bgcolor: '#0077B6' },
                  }}
                >
                  Siguiente
                </Button>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
}

