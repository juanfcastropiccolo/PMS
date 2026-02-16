'use client';

import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Container, Alert, Link } from '@mui/material';
import { authService } from '@/lib/auth/authService';
import { useRouter } from 'next/navigation';
import NextLink from 'next/link';

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      setLoading(false);
      return;
    }

    try {
      await authService.updatePassword(password);
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al actualizar la contraseña.');
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
          Nueva Contraseña
        </Typography>
        
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Ingresa tu nueva contraseña.
          </Typography>
          
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Nueva Contraseña"
            type="password"
            id="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          
          <TextField
            margin="normal"
            required
            fullWidth
            name="confirmPassword"
            label="Confirmar Contraseña"
            type="password"
            id="confirmPassword"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
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
            {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
          </Button>
          
          <Box sx={{ textAlign: 'center' }}>
            <NextLink href="/auth/login" passHref legacyBehavior>
              <Link variant="body2" sx={{ color: '#00B4D8' }}>
                Volver al inicio de sesión
              </Link>
            </NextLink>
          </Box>
        </Box>
      </Box>
    </Container>
  );
}

