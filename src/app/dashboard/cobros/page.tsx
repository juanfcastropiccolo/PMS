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
  TrendingUpOutlined,
  InfoOutlined,
  CheckCircleOutlined,
  LinkOutlined,
  LinkOffOutlined,
  EditOutlined,
  WarningAmberOutlined,
} from '@mui/icons-material';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Image from 'next/image';

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
  mp_account_id?: string;
  banco?: string;
  cbu?: string;
  alias?: string;
  titular?: string;
  verificada: boolean;
  activa: boolean;
  es_principal: boolean;
}

interface MPAccount {
  id: string;
  propietario_id: string;
  mp_user_id: string;
  mp_email: string;
  is_active: boolean;
  token_expires_at: string;
  created_at: string;
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
  const [mpAccount, setMpAccount] = useState<MPAccount | null>(null);

  // Dialogs
  const [openConnectMPDialog, setOpenConnectMPDialog] = useState(false);
  const [openEditMPDialog, setOpenEditMPDialog] = useState(false);
  const [openWithdrawalDialog, setOpenWithdrawalDialog] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  // Withdrawal form
  const [montoRetiro, setMontoRetiro] = useState('');
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState('');
  const [esRetiroAdelantado, setEsRetiroAdelantado] = useState(false);

  // Constantes
  const MONTO_MINIMO_RETIRO = 20000;
  const PORCENTAJE_CARGO_ADELANTADO = 5.0;

  // Handle OAuth success/error from redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mp_linked') === 'success') {
      toast.success('Cuenta de Mercado Pago conectada exitosamente');
      window.history.replaceState({}, '', '/dashboard/cobros');
    } else if (params.get('mp_linked') === 'error') {
      toast.error('Error al conectar con Mercado Pago. Intentá de nuevo.');
      window.history.replaceState({}, '', '/dashboard/cobros');
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadBilletera(),
        loadCuentas(),
        loadWithdrawals(),
        loadMovimientos(),
        loadMPAccount(),
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
      setBilletera(
        data || {
          saldo_disponible: 0,
          saldo_pendiente: 0,
          saldo_retenido: 0,
          total_ganado: 0,
          total_retirado: 0,
        }
      );
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

  const loadMPAccount = async () => {
    if (!user) return;
    try {
      const response = await fetch('/api/mercadopago/account');
      if (!response.ok) throw new Error('Failed to fetch MP account');
      const { account } = await response.json();
      setMpAccount(account || null);
    } catch (error) {
      console.error('Error loading MP account:', error);
    }
  };

  const handleConnectMP = () => {
    window.location.href = '/api/mercadopago/auth';
  };

  const handleDisconnectMP = async () => {
    if (!user) return;
    setDisconnecting(true);
    try {
      const response = await fetch('/api/mercadopago/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.pendingCount) {
          toast.error(
            `No podés desconectar: tenés ${data.pendingCount} retiro(s) pendiente(s)`
          );
        } else {
          toast.error(data.error || 'Error al desconectar');
        }
        return;
      }

      toast.success('Cuenta de Mercado Pago desconectada');
      setOpenEditMPDialog(false);
      setMpAccount(null);
      loadCuentas();
    } catch (error) {
      console.error('Error disconnecting MP:', error);
      toast.error('Error al desconectar la cuenta');
    } finally {
      setDisconnecting(false);
    }
  };

  const handleSolicitarRetiro = async () => {
    if (!user || !billetera) return;

    const monto = parseFloat(montoRetiro);

    if (!cuentaSeleccionada) {
      toast.error('Por favor seleccioná una cuenta de cobro');
      return;
    }

    if (isNaN(monto) || monto <= 0) {
      toast.error('Por favor ingresá un monto válido');
      return;
    }

    if (monto > billetera.saldo_disponible) {
      toast.error('No tenés saldo suficiente');
      return;
    }

    if (monto < MONTO_MINIMO_RETIRO) {
      toast.error(`El monto mínimo es $${MONTO_MINIMO_RETIRO.toLocaleString()}`);
      return;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from('withdrawals').insert({
        propietario_id: user.id,
        cuenta_cobro_id: cuentaSeleccionada,
        monto: monto,
        es_adelantado: true,
        estado: 'pendiente',
      });

      if (error) throw error;

      toast.success(
        `Solicitud de retiro anticipado enviada. Se procesará en 1-2 días hábiles con un cargo del ${PORCENTAJE_CARGO_ADELANTADO}%.`
      );
      setOpenWithdrawalDialog(false);
      setMontoRetiro('');
      setCuentaSeleccionada('');
      setEsRetiroAdelantado(false);
      loadWithdrawals();
      loadBilletera();
    } catch (error) {
      console.error('Error solicitando retiro:', error);
      toast.error('Error al solicitar el retiro');
    }
  };

  const getEstadoChip = (estado: string) => {
    const config: Record<
      string,
      { label: string; color: 'warning' | 'info' | 'success' | 'error' | 'default' }
    > = {
      pendiente: { label: 'Pendiente', color: 'warning' },
      procesando: { label: 'Procesando', color: 'info' },
      completado: { label: 'Completado', color: 'success' },
      rechazado: { label: 'Rechazado', color: 'error' },
      cancelado: { label: 'Cancelado', color: 'default' },
    };

    const { label, color } = config[estado] || config.pendiente;
    return <Chip label={label} color={color} size="small" />;
  };

  const isTokenExpired = mpAccount
    ? new Date(mpAccount.token_expires_at) < new Date()
    : false;

  if (loading) {
    return (
      <Box
        sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}
      >
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
          <Card
            sx={{
              background: 'linear-gradient(135deg, #38A169 0%, #2F855A 100%)',
              color: 'white',
            }}
          >
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
                Solicitar Retiro Anticipado
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
            <CardContent sx={{ position: 'relative' }}>
              {mpAccount && (
                <Box sx={{ position: 'absolute', top: 12, right: 12 }}>
                  <Image
                    src="/mercadopago-logo.svg"
                    alt="Mercado Pago"
                    width={32}
                    height={32}
                  />
                </Box>
              )}
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AccountBalanceOutlined sx={{ fontSize: 32, mr: 1, color: '#4299E1' }} />
                <Typography variant="body2" color="text.secondary">
                  Total Retirado
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                ${billetera?.total_retirado.toLocaleString() || 0}
              </Typography>
              {mpAccount ? (
                <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    icon={<CheckCircleOutlined />}
                    label={mpAccount.mp_email}
                    size="small"
                    color="success"
                    variant="outlined"
                  />
                  <Button
                    size="small"
                    startIcon={<EditOutlined />}
                    onClick={() => setOpenEditMPDialog(true)}
                    sx={{ minWidth: 'auto', fontSize: '0.75rem' }}
                  >
                    Editar
                  </Button>
                </Box>
              ) : (
                <Chip
                  icon={<WarningAmberOutlined />}
                  label="Conectá tu Mercado Pago"
                  size="small"
                  color="warning"
                  variant="outlined"
                  onClick={() => setOpenConnectMPDialog(true)}
                  sx={{ mt: 1, cursor: 'pointer' }}
                />
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Token expired alert */}
      {mpAccount && isTokenExpired && (
        <Alert
          severity="warning"
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={handleConnectMP}>
              Reconectar
            </Button>
          }
        >
          Tu conexión con Mercado Pago expiró. Reconectá para seguir recibiendo pagos automáticos.
        </Alert>
      )}

      {/* Info sobre Cobros */}
      <Alert severity="info" sx={{ mb: 4 }} icon={<InfoOutlined />}>
        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
          ¿Cómo funcionan los cobros?
        </Typography>
        <Typography variant="body2">
          Tus ganancias se depositan <strong>automáticamente cada semana</strong> en tu cuenta de
          Mercado Pago. El ciclo va de lunes a domingo y el pago se procesa entre el{' '}
          <strong>martes y miércoles</strong> siguiente. Si necesitás el dinero antes, podés
          solicitar un <strong>retiro anticipado</strong> con un cargo del <strong>5%</strong>{' '}
          (monto mínimo: <strong>$20.000</strong>).
        </Typography>
      </Alert>

      {/* Tabs */}
      <Paper sx={{ mb: 4 }}>
        <Tabs value={tabValue} onChange={(_e, newValue) => setTabValue(newValue)}>
          <Tab label="Cuentas de Cobro" />
          <Tab label="Historial de Retiros" />
          <Tab label="Movimientos" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {/* Tab 0: Cuentas de Cobro */}
          {tabValue === 0 && (
            <Box>
              {/* Sección 1: Mercado Pago */}
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Mercado Pago
              </Typography>

              {mpAccount ? (
                <Card variant="outlined" sx={{ mb: 4 }}>
                  <CardContent>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'start',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'start' }}>
                        <Image
                          src="/mercadopago-logo.svg"
                          alt="Mercado Pago"
                          width={40}
                          height={40}
                          style={{ marginRight: 16 }}
                        />
                        <Box>
                          <Typography variant="h6" sx={{ mb: 0.5 }}>
                            Mercado Pago
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {mpAccount.mp_email}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip
                              icon={<CheckCircleOutlined />}
                              label="Conectada"
                              size="small"
                              color="success"
                            />
                            {isTokenExpired && (
                              <Chip
                                icon={<WarningAmberOutlined />}
                                label="Token expirado"
                                size="small"
                                color="warning"
                              />
                            )}
                          </Box>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: 'block', mt: 1 }}
                          >
                            Vinculada el{' '}
                            {format(new Date(mpAccount.created_at), "dd 'de' MMMM yyyy", {
                              locale: es,
                            })}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<EditOutlined />}
                          onClick={() => setOpenEditMPDialog(true)}
                        >
                          Editar
                        </Button>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ) : (
                <Card
                  variant="outlined"
                  sx={{
                    mb: 4,
                    textAlign: 'center',
                    py: 4,
                    borderStyle: 'dashed',
                  }}
                >
                  <CardContent>
                    <Image
                      src="/mercadopago-logo.svg"
                      alt="Mercado Pago"
                      width={48}
                      height={48}
                      style={{ marginBottom: 16 }}
                    />
                    <Typography variant="h6" sx={{ mb: 1 }}>
                      Conectá tu cuenta de Mercado Pago
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      Vinculá tu cuenta para recibir tus pagos semanales automáticos de forma segura
                    </Typography>
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={<LinkOutlined />}
                      onClick={() => setOpenConnectMPDialog(true)}
                      sx={{
                        bgcolor: '#00B3E3',
                        '&:hover': { bgcolor: '#009BC5' },
                        px: 4,
                      }}
                    >
                      Conectar Mercado Pago
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Legacy MP accounts (email-based, no OAuth) */}
              {cuentas
                .filter((c) => c.tipo === 'mercado_pago' && !c.mp_account_id && c.activa)
                .map((cuenta) => (
                  <Alert key={cuenta.id} severity="info" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      Tenés una cuenta de MP configurada por email ({cuenta.mp_email}). Te
                      recomendamos conectar tu cuenta via Mercado Pago para mayor seguridad y pagos
                      automáticos.
                    </Typography>
                  </Alert>
                ))}

              <Divider sx={{ my: 3 }} />

              {/* Sección 2: Transferencia Bancaria (Próximamente) */}
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Transferencia Bancaria
              </Typography>

              <Card
                variant="outlined"
                sx={{
                  borderStyle: 'dashed',
                  bgcolor: '#FAFAFA',
                  textAlign: 'center',
                  py: 4,
                }}
              >
                <CardContent>
                  <AccountBalanceOutlined
                    sx={{ fontSize: 48, color: '#CBD5E0', mb: 2 }}
                  />
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    Cuenta Bancaria
                  </Typography>
                  <Chip
                    label="PRÓXIMAMENTE"
                    size="small"
                    sx={{
                      bgcolor: '#FFF3E0',
                      color: '#E65100',
                      fontWeight: 600,
                      mb: 2,
                    }}
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Pronto podrás agregar tu CBU para recibir transferencias bancarias directas.
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Por ahora, utilizá Mercado Pago para recibir tus pagos.
                  </Typography>
                </CardContent>
              </Card>
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
                        <TableCell>
                          <strong>Fecha</strong>
                        </TableCell>
                        <TableCell>
                          <strong>Tipo</strong>
                        </TableCell>
                        <TableCell>
                          <strong>Monto Solicitado</strong>
                        </TableCell>
                        <TableCell>
                          <strong>Cargo</strong>
                        </TableCell>
                        <TableCell>
                          <strong>Monto Neto</strong>
                        </TableCell>
                        <TableCell>
                          <strong>Estado</strong>
                        </TableCell>
                        <TableCell>
                          <strong>Completado</strong>
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {withdrawals.map((withdrawal) => (
                        <TableRow key={withdrawal.id}>
                          <TableCell>
                            {format(new Date(withdrawal.fecha_solicitada), 'dd/MM/yyyy', {
                              locale: es,
                            })}
                          </TableCell>
                          <TableCell>
                            {withdrawal.es_adelantado ? (
                              <Chip label="Anticipado" size="small" color="warning" />
                            ) : (
                              <Chip label="Semanal" size="small" color="success" />
                            )}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>
                            ${withdrawal.monto.toLocaleString()}
                          </TableCell>
                          <TableCell
                            sx={{
                              color: withdrawal.es_adelantado ? '#D97706' : '#38A169',
                            }}
                          >
                            {withdrawal.es_adelantado
                              ? `-$${withdrawal.monto_cargo_adicional?.toLocaleString() || 0} (${withdrawal.porcentaje_cargo_adicional}%)`
                              : 'Sin cargo'}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 700, color: '#38A169' }}>
                            $
                            {withdrawal.monto_neto?.toLocaleString() ||
                              withdrawal.monto.toLocaleString()}
                          </TableCell>
                          <TableCell>{getEstadoChip(withdrawal.estado)}</TableCell>
                          <TableCell>
                            {withdrawal.fecha_completado
                              ? format(new Date(withdrawal.fecha_completado), 'dd/MM/yyyy', {
                                  locale: es,
                                })
                              : withdrawal.fecha_programada_pago
                                ? `Prog: ${format(new Date(withdrawal.fecha_programada_pago), 'dd/MM', { locale: es })}`
                                : '-'}
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
                        <TableCell>
                          <strong>Fecha</strong>
                        </TableCell>
                        <TableCell>
                          <strong>Descripción</strong>
                        </TableCell>
                        <TableCell>
                          <strong>Tipo</strong>
                        </TableCell>
                        <TableCell align="right">
                          <strong>Monto</strong>
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {movimientos.map((mov) => (
                        <TableRow key={mov.id}>
                          <TableCell>
                            {format(new Date(mov.created_at), 'dd/MM/yyyy HH:mm', {
                              locale: es,
                            })}
                          </TableCell>
                          <TableCell>{mov.descripcion}</TableCell>
                          <TableCell>
                            <Chip
                              label={mov.tipo.replace('_', ' ')}
                              size="small"
                              color={mov.monto > 0 ? 'success' : 'default'}
                            />
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{
                              color: mov.monto > 0 ? '#38A169' : '#718096',
                              fontWeight: 600,
                            }}
                          >
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

      {/* Dialog: Conectar Mercado Pago */}
      <Dialog
        open={openConnectMPDialog}
        onClose={() => setOpenConnectMPDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Conectar Mercado Pago</DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Image
              src="/mercadopago-logo.svg"
              alt="Mercado Pago"
              width={64}
              height={64}
              style={{ marginBottom: 16 }}
            />
            <Typography variant="body1" sx={{ mb: 2 }}>
              Conectá tu cuenta de Mercado Pago de forma segura para recibir tus pagos semanales
              automáticos.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Serás redirigido a Mercado Pago para autorizar la conexión. No almacenamos tu
              contraseña.
            </Typography>
            <Button
              variant="contained"
              size="large"
              fullWidth
              startIcon={<LinkOutlined />}
              onClick={handleConnectMP}
              sx={{
                bgcolor: '#00B3E3',
                '&:hover': { bgcolor: '#009BC5' },
                py: 1.5,
                fontSize: '1rem',
              }}
            >
              Conectar con Mercado Pago
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConnectMPDialog(false)}>Cancelar</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Editar cuenta MP */}
      <Dialog
        open={openEditMPDialog}
        onClose={() => setOpenEditMPDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Cuenta de Mercado Pago</DialogTitle>
        <DialogContent>
          {mpAccount && (
            <Box sx={{ py: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Image
                  src="/mercadopago-logo.svg"
                  alt="Mercado Pago"
                  width={40}
                  height={40}
                  style={{ marginRight: 16 }}
                />
                <Box>
                  <Typography variant="h6">{mpAccount.mp_email}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    ID: {mpAccount.mp_user_id}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ mb: 2 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Estado
                </Typography>
                <Chip
                  icon={<CheckCircleOutlined />}
                  label={isTokenExpired ? 'Token expirado' : 'Conectada'}
                  size="small"
                  color={isTokenExpired ? 'warning' : 'success'}
                />
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Vinculada
                </Typography>
                <Typography variant="body2">
                  {format(new Date(mpAccount.created_at), "dd 'de' MMMM yyyy", {
                    locale: es,
                  })}
                </Typography>
              </Box>

              {isTokenExpired && (
                <Alert severity="warning" sx={{ mt: 2, mb: 2 }}>
                  <Typography variant="body2">
                    Tu token expiró. Reconectá para seguir recibiendo pagos.
                  </Typography>
                  <Button
                    size="small"
                    color="inherit"
                    onClick={handleConnectMP}
                    sx={{ mt: 1 }}
                  >
                    Reconectar
                  </Button>
                </Alert>
              )}

              <Divider sx={{ my: 2 }} />

              <Button
                variant="outlined"
                color="error"
                fullWidth
                startIcon={<LinkOffOutlined />}
                onClick={handleDisconnectMP}
                disabled={disconnecting}
              >
                {disconnecting ? 'Desconectando...' : 'Desconectar cuenta'}
              </Button>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                No podrás desconectar si tenés retiros pendientes.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditMPDialog(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Solicitar Retiro Anticipado */}
      <Dialog
        open={openWithdrawalDialog}
        onClose={() => setOpenWithdrawalDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Solicitar Retiro Anticipado</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mt: 1, mb: 3 }}>
            <Typography variant="body2">
              Los pagos semanales son automáticos (martes-miércoles). Este formulario es para{' '}
              <strong>retiros anticipados</strong> con un cargo del {PORCENTAJE_CARGO_ADELANTADO}%.
            </Typography>
          </Alert>

          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Cuenta de Destino</InputLabel>
            <Select
              value={cuentaSeleccionada}
              label="Cuenta de Destino"
              onChange={(e) => setCuentaSeleccionada(e.target.value)}
            >
              {cuentas
                .filter((c) => c.activa)
                .map((cuenta) => (
                  <MenuItem key={cuenta.id} value={cuenta.id}>
                    {cuenta.tipo === 'mercado_pago'
                      ? `Mercado Pago - ${cuenta.mp_email}`
                      : `${cuenta.banco} - ${cuenta.cbu}`}
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
            helperText={`Disponible: $${billetera?.saldo_disponible.toLocaleString() || 0} | Mínimo: $${MONTO_MINIMO_RETIRO.toLocaleString()}`}
            sx={{ mb: 3 }}
          />

          <FormControl component="fieldset" fullWidth>
            <FormLabel component="legend" sx={{ mb: 2, fontWeight: 600, color: '#2D3748' }}>
              Tipo de Retiro
            </FormLabel>
            <RadioGroup
              value={esRetiroAdelantado ? 'adelantado' : 'semanal'}
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
                  value="semanal"
                  control={<Radio sx={{ '&.Mui-checked': { color: '#38A169' } }} />}
                  label={
                    <Box sx={{ ml: 1 }}>
                      <Typography variant="body1" sx={{ fontWeight: 600, color: '#2D3748' }}>
                        Retiro Semanal - Sin cargo
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Se incluye en el próximo ciclo semanal automático (martes-miércoles)
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
                        Retiro Anticipado - Cargo del {PORCENTAJE_CARGO_ADELANTADO}%
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
          {esRetiroAdelantado &&
            montoRetiro &&
            parseFloat(montoRetiro) >= MONTO_MINIMO_RETIRO && (
              <Alert severity="warning" sx={{ mt: 3 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                  Resumen del retiro anticipado:
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2">Monto solicitado:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    ${parseFloat(montoRetiro).toLocaleString()}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2">
                    Cargo por adelanto ({PORCENTAJE_CARGO_ADELANTADO}%):
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#D97706' }}>
                    -$
                    {(
                      parseFloat(montoRetiro) *
                      (PORCENTAJE_CARGO_ADELANTADO / 100)
                    ).toLocaleString()}
                  </Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Recibirás:
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 700, color: '#38A169', fontSize: '1.1rem' }}
                  >
                    $
                    {(
                      parseFloat(montoRetiro) -
                      parseFloat(montoRetiro) * (PORCENTAJE_CARGO_ADELANTADO / 100)
                    ).toLocaleString()}
                  </Typography>
                </Box>
                <Typography
                  variant="caption"
                  sx={{ display: 'block', mt: 1, color: '#718096' }}
                >
                  Ahorro si esperás al ciclo semanal: $
                  {(
                    parseFloat(montoRetiro) *
                    (PORCENTAJE_CARGO_ADELANTADO / 100)
                  ).toLocaleString()}
                </Typography>
              </Alert>
            )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpenWithdrawalDialog(false);
              setMontoRetiro('');
              setCuentaSeleccionada('');
              setEsRetiroAdelantado(false);
            }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSolicitarRetiro}
            disabled={
              !montoRetiro ||
              parseFloat(montoRetiro) < MONTO_MINIMO_RETIRO ||
              !cuentaSeleccionada
            }
          >
            Solicitar Retiro Anticipado
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
