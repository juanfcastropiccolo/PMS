'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
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
} from '@mui/material';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { signIn } = useAuth();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Verificar si hay error de acceso denegado desde el middleware
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam === 'no_access') {
      setError(
        'No tienes permisos para acceder al PMS. Este sistema es exclusivo para propietarios de estacionamientos registrados. Contacta al administrador para solicitar acceso.'
      );
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      toast.success('¡Bienvenido a Parkit PMS!');
    } catch (err: any) {
      const errorMessage = err.message || 'Error al iniciar sesión';
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
      <Card sx={{ maxWidth: 450, width: '100%' }}>
        <CardContent sx={{ p: 4 }}>
          {/* Logo */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h4" sx={{ color: '#00B4D8', fontWeight: 700, mb: 1 }}>
              Parkit
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Parking Management System
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
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              sx={{ mb: 3 }}
            />

            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                mb: 2,
                bgcolor: '#00B4D8',
                '&:hover': { bgcolor: '#0077B6' },
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Iniciar Sesión'}
            </Button>
          </form>

          {/* Links */}
          <Box sx={{ textAlign: 'center' }}>
            <Link href="/auth/reset-password" passHref legacyBehavior>
              <MuiLink variant="body2" sx={{ color: '#00B4D8', display: 'block', mb: 2 }}>
                ¿Olvidaste tu contraseña?
              </MuiLink>
            </Link>

            <Typography variant="body2">
              ¿No tienes cuenta?{' '}
              <Link href="/auth/register" passHref legacyBehavior>
                <MuiLink sx={{ color: '#00B4D8', fontWeight: 600 }}>Regístrate aquí</MuiLink>
              </Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

