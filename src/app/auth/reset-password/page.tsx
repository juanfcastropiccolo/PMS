'use client';

import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Container, Alert, Link } from '@mui/material';
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
    } catch (err: any) {
      setError(err.message || 'Error al enviar el correo de recuperación.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography component="h1" variant="h5">
          Restablecer Contraseña
        </Typography>
        
        {success ? (
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Alert severity="success" sx={{ mb: 2 }}>
              ¡Correo enviado! Revisa tu bandeja de entrada para restablecer tu contraseña.
            </Alert>
            <NextLink href="/auth/login" passHref legacyBehavior>
              <Link sx={{ color: '#00B4D8' }}>
                Volver al inicio de sesión
              </Link>
            </NextLink>
          </Box>
        ) : (
          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
            </Typography>
            
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Correo Electrónico"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? 'Enviando...' : 'Enviar Enlace'}
            </Button>
            
            <Box sx={{ textAlign: 'center' }}>
              <NextLink href="/auth/login" passHref legacyBehavior>
                <Link variant="body2" sx={{ color: '#00B4D8' }}>
                  Volver al inicio de sesión
                </Link>
              </NextLink>
            </Box>
          </Box>
        )}
      </Box>
    </Container>
  );
}

