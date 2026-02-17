'use client';

import { useState, useEffect, Suspense } from 'react';
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
  Divider,
} from '@mui/material';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';

function LoginContent() {
  const { signIn, signInWithGoogle } = useAuth();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Verificar si hay error desde URL (middleware o callback OAuth)
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam === 'no_access') {
      setError(
        'No tienes permisos para acceder al PMS. Este sistema es exclusivo para propietarios de estacionamientos registrados. Contacta al administrador para solicitar acceso.'
      );
    } else if (errorParam === 'oauth_failed') {
      setError(
        'No se pudo completar el inicio de sesión con Google. Verificá que el proveedor Google esté bien configurado en Supabase y en Google Cloud Console (redirect URI y Client Secret).'
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
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al iniciar sesión';
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
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                mb: 3,
                height: { xs: 128, sm: 165 },
                overflow: 'hidden',
                px: { xs: 1, sm: 2 },
                py: { xs: 1, sm: 1 },
              }}
            >
              <Box
                component="img"
                src="/PMS_logo.png?v=2"
                alt="PMS Logo"
                sx={{
                  height: '100%',
                  width: '100%',
                  objectFit: 'contain',
                  // El PNG tiene bastante padding interno; este "zoom" mejora la proporción visual sin cambiar el asset.
                  transform: {
                    xs: 'translateY(6px) scale(1.35)',
                    sm: 'translateY(8px) scale(1.45)',
                  },
                  transformOrigin: 'center',
                }}
              />
            </Box>
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

          {/* Divider */}
          <Divider sx={{ my: 2 }}>o</Divider>

          {/* Google Login */}
          <Button
            fullWidth
            variant="outlined"
            size="large"
            onClick={async () => {
              try {
                await signInWithGoogle();
              } catch (err: unknown) {
                setError(err instanceof Error ? err.message : 'Error al iniciar sesión con Google');
              }
            }}
            sx={{
              mb: 2,
              borderColor: '#dadce0',
              color: '#3c4043',
              textTransform: 'none',
              fontWeight: 500,
              '&:hover': {
                borderColor: '#d2e3fc',
                bgcolor: '#f8faff',
              },
            }}
            startIcon={
              <Box
                component="img"
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                alt="Google"
                sx={{ width: 20, height: 20 }}
              />
            }
          >
            Iniciar sesión con Google
          </Button>

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

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #00B4D8 0%, #0077B6 100%)' }}>
          <CircularProgress sx={{ color: 'white' }} />
        </Box>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
