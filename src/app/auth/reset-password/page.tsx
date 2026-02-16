'use client';

import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  Link,
  Card,
  CardContent,
  CircularProgress,
} from '@mui/material';
import { authService } from '@/lib/auth/authService';
import NextLink from 'next/link';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      await authService.resetPassword(email);
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al enviar el correo de recuperación.');
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
              Restablecer Contraseña
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Ingresa tu correo electrónico y te enviaremos un enlace
            </Typography>
          </Box>

          {success ? (
            <Box sx={{ textAlign: 'center' }}>
              <Alert severity="success" sx={{ mb: 3 }}>
                ¡Correo enviado! Revisa tu bandeja de entrada para restablecer tu contraseña.
              </Alert>
              <NextLink href="/auth/login" passHref legacyBehavior>
                <Link sx={{ color: '#00B4D8', fontWeight: 600 }}>
                  Volver al inicio de sesión
                </Link>
              </NextLink>
            </Box>
          ) : (
            <>
              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}

              <form onSubmit={handleSubmit}>
                <TextField
                  fullWidth
                  label="Correo Electrónico"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  autoFocus
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
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Enviar Enlace'}
                </Button>
              </form>

              <Box sx={{ textAlign: 'center' }}>
                <NextLink href="/auth/login" passHref legacyBehavior>
                  <Link variant="body2" sx={{ color: '#00B4D8', fontWeight: 600 }}>
                    Volver al inicio de sesión
                  </Link>
                </NextLink>
              </Box>
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

