'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Link as MuiLink,
  CircularProgress,
  Grid,
} from '@mui/material';
import Link from 'next/link';
import { authService } from '@/lib/auth/authService';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validaciones
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      await authService.signUp(formData.email, formData.password, {
        nombre: formData.nombre,
        telefono: formData.telefono,
      });

      toast.success('¡Cuenta creada exitosamente! Por favor verifica tu email.');
      router.push('/auth/login');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al crear la cuenta';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #00B4D8 0%, #0077B6 100%)',
        padding: 2,
      }}
    >
      <Card sx={{ maxWidth: 550, width: '100%' }}>
        <CardContent sx={{ p: 4 }}>
          {/* Logo */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                mb: 2,
                height: { xs: 96, sm: 130 },
              }}
            >
              <Box
                component="img"
                src="/PMS_logo.png?v=2"
                alt="PMS Logo"
                sx={{
                  height: { xs: 96, sm: 130 },
                  width: 'auto',
                  maxWidth: '100%',
                  objectFit: 'contain',
                }}
              />
            </Box>
            <Typography variant="h5" sx={{ color: '#00B4D8', fontWeight: 600, mb: 1 }}>
              Crear Cuenta
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Regístrate como propietario de estacionamiento
            </Typography>
          </Box>

          {/* Error */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Nombre Completo"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                  autoComplete="name"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Teléfono"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  required
                  autoComplete="tel"
                  placeholder="+54 11 1234-5678"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Contraseña"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  autoComplete="new-password"
                  helperText="Mínimo 6 caracteres"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Confirmar Contraseña"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  autoComplete="new-password"
                />
              </Grid>
            </Grid>

            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                mt: 3,
                mb: 2,
                bgcolor: '#00B4D8',
                '&:hover': { bgcolor: '#0077B6' },
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Crear Cuenta'}
            </Button>
          </form>

          {/* Links */}
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2">
              ¿Ya tienes cuenta?{' '}
              <Link href="/auth/login" passHref legacyBehavior>
                <MuiLink sx={{ color: '#00B4D8', fontWeight: 600 }}>Inicia sesión aquí</MuiLink>
              </Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

