'use client';

import { useState, useEffect } from 'react';
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
  Divider,
  Alert,
  Tab,
  Tabs,
} from '@mui/material';
import {
  Person as PersonIcon,
  Lock as LockIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { supabase } from '@/lib/supabaseClient';
import AvatarUpload from '@/components/AvatarUpload';
import toast from 'react-hot-toast';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function PerfilPage() {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Profile data
  const [profileData, setProfileData] = useState({
    nombre: '',
    telefono: '',
    email: '',
    foto_perfil_url: null as string | null,
  });

  // Password data
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (user) {
      loadUserProfile();
    }
  }, [user]);

  const loadUserProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('nombre, foto_perfil_url, telefono')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      setProfileData({
        nombre: data?.nombre || user.metadata?.nombre || '',
        telefono: data?.telefono || user.metadata?.telefono || '',
        email: user.email || '',
        foto_perfil_url: data?.foto_perfil_url || null,
      });
    } catch (error) {
      console.error('Error loading profile:', error);
      // Fallback to metadata
      setProfileData({
        nombre: user.metadata?.nombre || '',
        telefono: user.metadata?.telefono || '',
        email: user.email || '',
        foto_perfil_url: null,
      });
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setError('');
    setSuccess('');
  };

  const handleProfileChange = (field: string, value: string) => {
    setProfileData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Actualizar metadata de Supabase Auth
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          nombre: profileData.nombre,
          telefono: profileData.telefono,
        },
      });

      if (authError) throw authError;

      // Actualizar tabla public.users
      const { error: dbError } = await supabase
        .from('users')
        .update({
          nombre: profileData.nombre,
          telefono: profileData.telefono,
        })
        .eq('id', user.id);

      if (dbError) throw dbError;

      setSuccess('Perfil actualizado exitosamente');
      toast.success('Perfil actualizado exitosamente');
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Error al actualizar el perfil');
      toast.error('Error al actualizar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    // Validaciones
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      setLoading(false);
      return;
    }

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });

      if (updateError) throw updateError;

      setSuccess('Contraseña actualizada exitosamente');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err: any) {
      console.error('Error updating password:', err);
      setError(err.message || 'Error al actualizar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#2D3748', mb: 1 }}>
          Mi Perfil
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Gestiona tu información personal y configuración de cuenta
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Sidebar con Avatar */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <AvatarUpload
                  currentAvatarUrl={profileData.foto_perfil_url}
                  userId={user?.id || ''}
                  userName={profileData.nombre || user?.email || 'U'}
                  size={150}
                  onAvatarUploaded={(url) => {
                    setProfileData(prev => ({ ...prev, foto_perfil_url: url }));
                  }}
                />
              </Box>

              <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                {profileData.nombre || 'Usuario'}
              </Typography>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {user?.email}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ textAlign: 'left' }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  Rol
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 2 }}>
                  Propietario
                </Typography>

                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  Miembro desde
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {new Date().toLocaleDateString('es-AR', {
                    year: 'numeric',
                    month: 'long',
                  })}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Main Content */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
              >
                <Tab
                  icon={<PersonIcon />}
                  iconPosition="start"
                  label="Información Personal"
                />
                <Tab
                  icon={<LockIcon />}
                  iconPosition="start"
                  label="Seguridad"
                />
              </Tabs>

              {/* Error/Success Messages */}
              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}

              {success && (
                <Alert severity="success" sx={{ mb: 3 }}>
                  {success}
                </Alert>
              )}

              {/* Tab 1: Información Personal */}
              <TabPanel value={tabValue} index={0}>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Nombre Completo"
                      value={profileData.nombre}
                      onChange={(e) => handleProfileChange('nombre', e.target.value)}
                      placeholder="Ingresa tu nombre completo"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Email"
                      value={profileData.email}
                      disabled
                      helperText="El email no puede ser modificado"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Teléfono"
                      value={profileData.telefono}
                      onChange={(e) => handleProfileChange('telefono', e.target.value)}
                      placeholder="+54 9 11 1234-5678"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      startIcon={<SaveIcon />}
                      onClick={handleSaveProfile}
                      disabled={loading}
                      sx={{
                        bgcolor: '#00B4D8',
                        '&:hover': { bgcolor: '#0077B6' },
                      }}
                    >
                      {loading ? 'Guardando...' : 'Guardar Cambios'}
                    </Button>
                  </Grid>
                </Grid>
              </TabPanel>

              {/* Tab 2: Seguridad */}
              <TabPanel value={tabValue} index={1}>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Cambiar Contraseña
                    </Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      type="password"
                      label="Nueva Contraseña"
                      value={passwordData.newPassword}
                      onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                      helperText="Mínimo 6 caracteres"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      type="password"
                      label="Confirmar Contraseña"
                      value={passwordData.confirmPassword}
                      onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      startIcon={<LockIcon />}
                      onClick={handleUpdatePassword}
                      disabled={loading || !passwordData.newPassword || !passwordData.confirmPassword}
                      sx={{
                        bgcolor: '#00B4D8',
                        '&:hover': { bgcolor: '#0077B6' },
                      }}
                    >
                      {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
                    </Button>
                  </Grid>
                </Grid>
              </TabPanel>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}

