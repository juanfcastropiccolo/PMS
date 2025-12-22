'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Tab,
  Tabs,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel,
} from '@mui/material';
import {
  AccountBalanceWalletOutlined,
  AccountBalanceOutlined,
  PaymentOutlined,
  AddOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  InfoOutlined,
  TrendingUpOutlined,
} from '@mui/icons-material';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Billetera {
  saldo_disponible: number;
  saldo_pendiente: number;
  saldo_retenido: number;
  total_ganado: number;
  total_retirado: number;
}

interface CuentaCobro {
  id: string;
  tipo: 'mercado_pago' | 'cuenta_bancaria';
  mp_email?: string;
  banco?: string;
  cbu?: string;
  alias?: string;
  titular?: string;
  verificada: boolean;
  activa: boolean;
  es_principal: boolean;
}

interface Withdrawal {
  id: string;
  monto: number;
  es_adelantado: boolean;
  porcentaje_cargo_adicional: number;
  monto_cargo_adicional: number;
  monto_neto: number;
  estado: string;
  fecha_solicitada: string;
  fecha_programada_pago?: string;
  fecha_completado?: string;
  motivo_rechazo?: string;
  cuenta_cobro_id: string;
}

interface Movimiento {
  id: string;
  tipo: string;
  monto: number;
  descripcion: string;
  created_at: string;
}

export default function CobrosPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [billetera, setBilletera] = useState<Billetera | null>(null);
  const [cuentas, setCuentas] = useState<CuentaCobro[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  
  // Dialogs
  const [openCuentaDialog, setOpenCuentaDialog] = useState(false);
  const [openWithdrawalDialog, setOpenWithdrawalDialog] = useState(false);
  const [tipoCuenta, setTipoCuenta] = useState<'mercado_pago' | 'cuenta_bancaria'>('mercado_pago');
  
  // Form data
  const [formData, setFormData] = useState({
    // Mercado Pago
    mp_email: '',
    // Cuenta Bancaria
    banco: '',
    tipo_cuenta: 'caja_ahorro',
    cbu: '',
    alias: '',
    titular: '',
    cuit_cuil: '',
  });
  
  const [montoRetiro, setMontoRetiro] = useState('');
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState('');
  const [esRetiroAdelantado, setEsRetiroAdelantado] = useState(false);
  
  // Constantes
  const MONTO_MINIMO_RETIRO = 20000;
  const PORCENTAJE_CARGO_ADELANTADO = 5.0;

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadBilletera(),
        loadCuentas(),
        loadWithdrawals(),
        loadMovimientos(),
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBilletera = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('billetera_propietarios')
        .select('*')
        .eq('propietario_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setBilletera(data || {
        saldo_disponible: 0,
        saldo_pendiente: 0,
        saldo_retenido: 0,
        total_ganado: 0,
        total_retirado: 0,
      });
    } catch (error) {
      console.error('Error loading billetera:', error);
    }
  };

  const loadCuentas = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('cuentas_cobro')
        .select('*')
        .eq('propietario_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCuentas(data || []);
    } catch (error) {
      console.error('Error loading cuentas:', error);
    }
  };

  const loadWithdrawals = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('propietario_id', user.id)
        .order('fecha_solicitada', { ascending: false })
        .limit(10);

      if (error) throw error;
      setWithdrawals(data || []);
    } catch (error) {
      console.error('Error loading withdrawals:', error);
    }
  };

  const loadMovimientos = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('movimientos_billetera')
        .select('*')
        .eq('propietario_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setMovimientos(data || []);
    } catch (error) {
      console.error('Error loading movimientos:', error);
    }
  };

  const handleGuardarCuenta = async () => {
    if (!user) return;

    try {
      const dataToInsert: any = {
        propietario_id: user.id,
        tipo: tipoCuenta,
        activa: true,
      };

      if (tipoCuenta === 'mercado_pago') {
        if (!formData.mp_email) {
          toast.error('Por favor ingresa tu email de Mercado Pago');
          return;
        }
        dataToInsert.mp_email = formData.mp_email;
      } else {
        if (!formData.cbu || !formData.titular) {
          toast.error('Por favor completa todos los campos obligatorios');
          return;
        }
        dataToInsert.banco = formData.banco;
        dataToInsert.tipo_cuenta = formData.tipo_cuenta;
        dataToInsert.cbu = formData.cbu;
        dataToInsert.alias = formData.alias;
        dataToInsert.titular = formData.titular;
        dataToInsert.cuit_cuil = formData.cuit_cuil;
      }

      const { error } = await supabase
        .from('cuentas_cobro')
        .insert(dataToInsert);

      if (error) throw error;

      toast.success('Cuenta guardada exitosamente');
      setOpenCuentaDialog(false);
      loadCuentas();
      resetForm();
    } catch (error: any) {
      console.error('Error guardando cuenta:', error);
      toast.error('Error al guardar la cuenta');
    }
  };

  const handleSolicitarRetiro = async () => {
    if (!user || !billetera) return;

    const monto = parseFloat(montoRetiro);
    
    if (!cuentaSeleccionada) {
      toast.error('Por favor selecciona una cuenta de cobro');
      return;
    }

    if (isNaN(monto) || monto <= 0) {
      toast.error('Por favor ingresa un monto válido');
      return;
    }

    if (monto > billetera.saldo_disponible) {
      toast.error('No tienes saldo suficiente');
      return;
    }

    if (monto < MONTO_MINIMO_RETIRO) {
      toast.error(`El monto mínimo de retiro es $${MONTO_MINIMO_RETIRO.toLocaleString()}`);
      return;
    }

    try {
      const { error } = await supabase
        .from('withdrawals')
        .insert({
          propietario_id: user.id,
          cuenta_cobro_id: cuentaSeleccionada,
          monto: monto,
          es_adelantado: esRetiroAdelantado,
          estado: 'pendiente',
        });

      if (error) throw error;

      const mensaje = esRetiroAdelantado
        ? `Solicitud de retiro adelantado enviada. Se procesará en 1-2 días hábiles con un cargo del ${PORCENTAJE_CARGO_ADELANTADO}%.`
        : 'Solicitud de retiro enviada. Se procesará el primer día hábil del próximo mes sin cargo adicional.';

      toast.success(mensaje);
      setOpenWithdrawalDialog(false);
      setMontoRetiro('');
      setCuentaSeleccionada('');
      setEsRetiroAdelantado(false);
      loadWithdrawals();
      loadBilletera();
    } catch (error: any) {
      console.error('Error solicitando retiro:', error);
      toast.error('Error al solicitar el retiro');
    }
  };

  const handleEliminarCuenta = async (id: string) => {
    try {
      const { error } = await supabase
        .from('cuentas_cobro')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Cuenta eliminada');
      loadCuentas();
    } catch (error) {
      console.error('Error eliminando cuenta:', error);
      toast.error('Error al eliminar la cuenta');
    }
  };

  const resetForm = () => {
    setFormData({
      mp_email: '',
      banco: '',
      tipo_cuenta: 'caja_ahorro',
      cbu: '',
      alias: '',
      titular: '',
      cuit_cuil: '',
    });
  };

  const getEstadoChip = (estado: string) => {
    const config: any = {
      pendiente: { label: 'Pendiente', color: 'warning' },
      procesando: { label: 'Procesando', color: 'info' },
      completado: { label: 'Completado', color: 'success' },
      rechazado: { label: 'Rechazado', color: 'error' },
      cancelado: { label: 'Cancelado', color: 'default' },
    };

    const { label, color } = config[estado] || config.pendiente;
    return <Chip label={label} color={color} size="small" />;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, color: '#2D3748', mb: 1 }}>
          Configurá tus Cobros
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Gestiona tu billetera, cuentas de cobro y retiros
        </Typography>
      </Box>

      {/* Saldo Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Saldo Disponible */}
        <Grid item xs={12} md={4}>
          <Card sx={{ background: 'linear-gradient(135deg, #38A169 0%, #2F855A 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AccountBalanceWalletOutlined sx={{ fontSize: 32, mr: 1 }} />
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Saldo Disponible
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                ${billetera?.saldo_disponible.toLocaleString() || 0}
              </Typography>
              <Button
                variant="contained"
                size="small"
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                }}
                onClick={() => setOpenWithdrawalDialog(true)}
                disabled={!billetera || billetera.saldo_disponible < MONTO_MINIMO_RETIRO}
              >
                Solicitar Retiro
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Total Ganado */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingUpOutlined sx={{ fontSize: 32, mr: 1, color: '#00B4D8' }} />
                <Typography variant="body2" color="text.secondary">
                  Total Ganado
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                ${billetera?.total_ganado.toLocaleString() || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Histórico
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Total Retirado */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AccountBalanceOutlined sx={{ fontSize: 32, mr: 1, color: '#4299E1' }} />
                <Typography variant="body2" color="text.secondary">
                  Total Retirado
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                ${billetera?.total_retirado.toLocaleString() || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Histórico
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Info sobre Retiros */}
      <Alert severity="info" sx={{ mb: 4 }} icon={<InfoOutlined />}>
        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
          ¿Cómo funcionan los retiros?
        </Typography>
        <Typography variant="body2">
          Los retiros se procesan el <strong>primer día hábil de cada mes</strong>. Podés solicitar un retiro
          en cualquier momento y se cobrará un <strong>porcentaje mayor de descuento</strong> por retiro adelantado. 
          El monto mínimo es de <strong>$20.000</strong>.
        </Typography>
      </Alert>

      {/* Tabs */}
      <Paper sx={{ mb: 4 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Cuentas de Cobro" />
          <Tab label="Historial de Retiros" />
          <Tab label="Movimientos" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {/* Tab 0: Cuentas de Cobro */}
          {tabValue === 0 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Tus Cuentas de Cobro
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddOutlined />}
                  onClick={() => setOpenCuentaDialog(true)}
                  sx={{ bgcolor: '#00B4D8', '&:hover': { bgcolor: '#0077B6' } }}
                >
                  Agregar Cuenta
                </Button>
              </Box>

              {cuentas.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <AccountBalanceOutlined sx={{ fontSize: 60, color: '#CBD5E0', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                    No tienes cuentas configuradas
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Agrega una cuenta de Mercado Pago o bancaria para recibir tus pagos
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={() => setOpenCuentaDialog(true)}
                  >
                    Agregar Mi Primera Cuenta
                  </Button>
                </Box>
              ) : (
                <Grid container spacing={2}>
                  {cuentas.map((cuenta) => (
                    <Grid item xs={12} md={6} key={cuenta.id}>
                      <Card variant="outlined">
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <Box sx={{ display: 'flex', alignItems: 'start' }}>
                              {cuenta.tipo === 'mercado_pago' ? (
                                <PaymentOutlined sx={{ fontSize: 32, mr: 2, color: '#00B4D8' }} />
                              ) : (
                                <AccountBalanceOutlined sx={{ fontSize: 32, mr: 2, color: '#4299E1' }} />
                              )}
                              <Box>
                                <Typography variant="h6" sx={{ mb: 0.5 }}>
                                  {cuenta.tipo === 'mercado_pago' ? 'Mercado Pago' : cuenta.banco || 'Cuenta Bancaria'}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {cuenta.tipo === 'mercado_pago' 
                                    ? cuenta.mp_email 
                                    : `CBU: ${cuenta.cbu} • ${cuenta.titular}`
                                  }
                                </Typography>
                                <Box sx={{ mt: 1 }}>
                                  {cuenta.verificada && (
                                    <Chip label="Verificada" size="small" color="success" icon={<CheckCircleOutlined />} sx={{ mr: 1 }} />
                                  )}
                                  {cuenta.es_principal && (
                                    <Chip label="Principal" size="small" color="primary" />
                                  )}
                                </Box>
                              </Box>
                            </Box>
                            <IconButton
                              size="small"
                              onClick={() => handleEliminarCuenta(cuenta.id)}
                            >
                              <DeleteOutlined />
                            </IconButton>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          )}

          {/* Tab 1: Historial de Retiros */}
          {tabValue === 1 && (
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Historial de Retiros
              </Typography>

              {withdrawals.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <Typography variant="body1" color="text.secondary">
                    No has realizado retiros aún
                  </Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Fecha</strong></TableCell>
                        <TableCell><strong>Tipo</strong></TableCell>
                        <TableCell><strong>Monto Solicitado</strong></TableCell>
                        <TableCell><strong>Cargo</strong></TableCell>
                        <TableCell><strong>Monto Neto</strong></TableCell>
                        <TableCell><strong>Estado</strong></TableCell>
                        <TableCell><strong>Completado</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {withdrawals.map((withdrawal) => (
                        <TableRow key={withdrawal.id}>
                          <TableCell>
                            {format(new Date(withdrawal.fecha_solicitada), 'dd/MM/yyyy', { locale: es })}
                          </TableCell>
                          <TableCell>
                            {withdrawal.es_adelantado ? (
                              <Chip label="Adelantado" size="small" color="warning" />
                            ) : (
                              <Chip label="Normal" size="small" color="success" />
                            )}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>
                            ${withdrawal.monto.toLocaleString()}
                          </TableCell>
                          <TableCell sx={{ color: withdrawal.es_adelantado ? '#D97706' : '#38A169' }}>
                            {withdrawal.es_adelantado 
                              ? `-$${withdrawal.monto_cargo_adicional?.toLocaleString() || 0} (${withdrawal.porcentaje_cargo_adicional}%)`
                              : 'Sin cargo'
                            }
                          </TableCell>
                          <TableCell sx={{ fontWeight: 700, color: '#38A169' }}>
                            ${withdrawal.monto_neto?.toLocaleString() || withdrawal.monto.toLocaleString()}
                          </TableCell>
                          <TableCell>{getEstadoChip(withdrawal.estado)}</TableCell>
                          <TableCell>
                            {withdrawal.fecha_completado 
                              ? format(new Date(withdrawal.fecha_completado), 'dd/MM/yyyy', { locale: es })
                              : withdrawal.fecha_programada_pago
                                ? `Prog: ${format(new Date(withdrawal.fecha_programada_pago), 'dd/MM', { locale: es })}`
                                : '-'
                            }
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}

          {/* Tab 2: Movimientos */}
          {tabValue === 2 && (
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Movimientos de Saldo
              </Typography>

              {movimientos.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <Typography variant="body1" color="text.secondary">
                    No hay movimientos registrados
                  </Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Fecha</strong></TableCell>
                        <TableCell><strong>Descripción</strong></TableCell>
                        <TableCell><strong>Tipo</strong></TableCell>
                        <TableCell align="right"><strong>Monto</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {movimientos.map((mov) => (
                        <TableRow key={mov.id}>
                          <TableCell>
                            {format(new Date(mov.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                          </TableCell>
                          <TableCell>{mov.descripcion}</TableCell>
                          <TableCell>
                            <Chip 
                              label={mov.tipo.replace('_', ' ')}
                              size="small"
                              color={mov.monto > 0 ? 'success' : 'default'}
                            />
                          </TableCell>
                          <TableCell align="right" sx={{ color: mov.monto > 0 ? '#38A169' : '#718096', fontWeight: 600 }}>
                            {mov.monto > 0 ? '+' : ''}${Math.abs(mov.monto).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}
        </Box>
      </Paper>

      {/* Dialog Agregar Cuenta */}
      <Dialog open={openCuentaDialog} onClose={() => setOpenCuentaDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Agregar Cuenta de Cobro</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2, mb: 3 }}>
            <InputLabel>Tipo de Cuenta</InputLabel>
            <Select
              value={tipoCuenta}
              label="Tipo de Cuenta"
              onChange={(e) => setTipoCuenta(e.target.value as any)}
            >
              <MenuItem value="mercado_pago">Mercado Pago</MenuItem>
              <MenuItem value="cuenta_bancaria">Cuenta Bancaria</MenuItem>
            </Select>
          </FormControl>

          {tipoCuenta === 'mercado_pago' ? (
            <TextField
              fullWidth
              label="Email de Mercado Pago"
              type="email"
              value={formData.mp_email}
              onChange={(e) => setFormData({ ...formData, mp_email: e.target.value })}
              helperText="Ingresa el email asociado a tu cuenta de Mercado Pago"
            />
          ) : (
            <>
              <TextField
                fullWidth
                label="Banco"
                value={formData.banco}
                onChange={(e) => setFormData({ ...formData, banco: e.target.value })}
                sx={{ mb: 2 }}
              />
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Tipo de Cuenta</InputLabel>
                <Select
                  value={formData.tipo_cuenta}
                  label="Tipo de Cuenta"
                  onChange={(e) => setFormData({ ...formData, tipo_cuenta: e.target.value })}
                >
                  <MenuItem value="caja_ahorro">Caja de Ahorro</MenuItem>
                  <MenuItem value="cuenta_corriente">Cuenta Corriente</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="CBU"
                value={formData.cbu}
                onChange={(e) => setFormData({ ...formData, cbu: e.target.value })}
                inputProps={{ maxLength: 22 }}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Alias (opcional)"
                value={formData.alias}
                onChange={(e) => setFormData({ ...formData, alias: e.target.value })}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Titular"
                value={formData.titular}
                onChange={(e) => setFormData({ ...formData, titular: e.target.value })}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="CUIT/CUIL"
                value={formData.cuit_cuil}
                onChange={(e) => setFormData({ ...formData, cuit_cuil: e.target.value })}
                inputProps={{ maxLength: 13 }}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenCuentaDialog(false);
            resetForm();
          }}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={handleGuardarCuenta}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Solicitar Retiro */}
      <Dialog open={openWithdrawalDialog} onClose={() => setOpenWithdrawalDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Solicitar Retiro</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2, mb: 3 }}>
            <InputLabel>Cuenta de Destino</InputLabel>
            <Select
              value={cuentaSeleccionada}
              label="Cuenta de Destino"
              onChange={(e) => setCuentaSeleccionada(e.target.value)}
            >
              {cuentas.filter(c => c.activa).map((cuenta) => (
                <MenuItem key={cuenta.id} value={cuenta.id}>
                  {cuenta.tipo === 'mercado_pago' 
                    ? `Mercado Pago - ${cuenta.mp_email}`
                    : `${cuenta.banco} - ${cuenta.cbu}`
                  }
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Monto a Retirar"
            type="number"
            value={montoRetiro}
            onChange={(e) => setMontoRetiro(e.target.value)}
            InputProps={{
              startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
            }}
            helperText={`Disponible: $${billetera?.saldo_disponible.toLocaleString() || 0} • Mínimo: $${MONTO_MINIMO_RETIRO.toLocaleString()}`}
            sx={{ mb: 3 }}
          />

          <FormControl component="fieldset" fullWidth>
            <FormLabel component="legend" sx={{ mb: 2, fontWeight: 600, color: '#2D3748' }}>
              Tipo de Retiro
            </FormLabel>
            <RadioGroup
              value={esRetiroAdelantado ? 'adelantado' : 'normal'}
              onChange={(e) => setEsRetiroAdelantado(e.target.value === 'adelantado')}
            >
              <Paper 
                variant="outlined" 
                sx={{ 
                  p: 2, 
                  mb: 2, 
                  cursor: 'pointer',
                  border: !esRetiroAdelantado ? '2px solid #38A169' : '1px solid #E2E8F0',
                  bgcolor: !esRetiroAdelantado ? '#F0FFF4' : 'white',
                }}
                onClick={() => setEsRetiroAdelantado(false)}
              >
                <FormControlLabel
                  value="normal"
                  control={<Radio sx={{ '&.Mui-checked': { color: '#38A169' } }} />}
                  label={
                    <Box sx={{ ml: 1 }}>
                      <Typography variant="body1" sx={{ fontWeight: 600, color: '#2D3748' }}>
                        Retiro Normal - Sin cargo
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Se procesa el primer día hábil del próximo mes
                      </Typography>
                      <Chip label="RECOMENDADO" size="small" color="success" sx={{ mt: 1 }} />
                    </Box>
                  }
                  sx={{ margin: 0, width: '100%' }}
                />
              </Paper>

              <Paper 
                variant="outlined" 
                sx={{ 
                  p: 2,
                  cursor: 'pointer',
                  border: esRetiroAdelantado ? '2px solid #00B4D8' : '1px solid #E2E8F0',
                  bgcolor: esRetiroAdelantado ? '#E8F7FA' : 'white',
                }}
                onClick={() => setEsRetiroAdelantado(true)}
              >
                <FormControlLabel
                  value="adelantado"
                  control={<Radio sx={{ '&.Mui-checked': { color: '#00B4D8' } }} />}
                  label={
                    <Box sx={{ ml: 1 }}>
                      <Typography variant="body1" sx={{ fontWeight: 600, color: '#2D3748' }}>
                        Retiro Adelantado - Cargo del {PORCENTAJE_CARGO_ADELANTADO}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Se procesa en 1-2 días hábiles
                      </Typography>
                    </Box>
                  }
                  sx={{ margin: 0, width: '100%' }}
                />
              </Paper>
            </RadioGroup>
          </FormControl>

          {/* Cálculo de cargo adelantado */}
          {esRetiroAdelantado && montoRetiro && parseFloat(montoRetiro) >= MONTO_MINIMO_RETIRO && (
            <Alert severity="warning" sx={{ mt: 3 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                Resumen del retiro adelantado:
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2">Monto solicitado:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  ${parseFloat(montoRetiro).toLocaleString()}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2">Cargo por adelanto ({PORCENTAJE_CARGO_ADELANTADO}%):</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#D97706' }}>
                  -${(parseFloat(montoRetiro) * (PORCENTAJE_CARGO_ADELANTADO / 100)).toLocaleString()}
                </Typography>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>Recibirás:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#38A169', fontSize: '1.1rem' }}>
                  ${(parseFloat(montoRetiro) - (parseFloat(montoRetiro) * (PORCENTAJE_CARGO_ADELANTADO / 100))).toLocaleString()}
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#718096' }}>
                Ahorro si esperas al ciclo mensual: ${(parseFloat(montoRetiro) * (PORCENTAJE_CARGO_ADELANTADO / 100)).toLocaleString()}
              </Typography>
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenWithdrawalDialog(false);
            setMontoRetiro('');
            setCuentaSeleccionada('');
            setEsRetiroAdelantado(false);
          }}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={handleSolicitarRetiro}>
            Solicitar Retiro
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

