# 8. INTEGRACIONES EXTERNAS - MERCADO PAGO

## 8.1 Arquitectura de Integración

### Flujo OAuth Mercado Pago

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│              │         │              │         │              │
│  PMS Web     │────────▶│   Mercado    │────────▶│   Callback   │
│  (Frontend)  │         │   Pago OAuth │         │   (Backend)  │
│              │         │              │         │              │
└──────────────┘         └──────────────┘         └──────────────┘
       │                                                   │
       │                                                   │
       │                                                   ▼
       │                                          ┌──────────────┐
       │                                          │   Supabase   │
       └──────────────────────────────────────────│  (Tokens)    │
                                                  └──────────────┘
```

## 8.2 Configuración de Mercado Pago

### Variables de Entorno

```env
# .env.local

# Mercado Pago Credentials
NEXT_PUBLIC_MP_PUBLIC_KEY=APP_USR-xxxxxxxx-xxxxxxxx
MP_ACCESS_TOKEN=APP_USR-xxxxxxxx-xxxxxxxx
MP_CLIENT_ID=xxxxxxxx
MP_CLIENT_SECRET=xxxxxxxxxxxxxxxx

# OAuth Redirect
NEXT_PUBLIC_MP_REDIRECT_URI=https://pms.parkit.com/api/mercadopago/callback

# Webhook
MP_WEBHOOK_SECRET=xxxxxxxxxxxxxxxx
NEXT_PUBLIC_MP_WEBHOOK_URL=https://pms.parkit.com/api/webhooks/mercadopago
```

### Configuración en Mercado Pago

1. **Crear Aplicación en Mercado Pago:**
   - Ir a https://www.mercadopago.com.ar/developers/panel/app
   - Crear nueva aplicación
   - Configurar Redirect URI: `https://pms.parkit.com/api/mercadopago/callback`
   - Obtener Client ID y Client Secret

2. **Configurar Webhooks:**
   - URL: `https://pms.parkit.com/api/webhooks/mercadopago`
   - Eventos a suscribir:
     - `payment`
     - `merchant_order`

3. **Permisos OAuth:**
   - `read` - Leer información de la cuenta
   - `write` - Procesar pagos
   - `offline_access` - Refresh token

## 8.3 Flujo OAuth - Vinculación de Cuenta

### Paso 1: Iniciar OAuth

```typescript
// app/dashboard/finanzas/vincular-mercadopago/page.tsx

'use client';

import { useEffect } from 'react';
import { Box, Card, CardContent, Typography, Button, CircularProgress } from '@mui/material';
import { useAuth } from '@/contexts/AuthContext';

export default function VincularMercadoPagoPage() {
  const { user } = useAuth();
  
  const handleVincular = () => {
    const clientId = process.env.NEXT_PUBLIC_MP_CLIENT_ID;
    const redirectUri = process.env.NEXT_PUBLIC_MP_REDIRECT_URI;
    const state = btoa(JSON.stringify({ userId: user?.id, timestamp: Date.now() }));
    
    const authUrl = `https://auth.mercadopago.com.ar/authorization?client_id=${clientId}&response_type=code&platform_id=mp&state=${state}&redirect_uri=${redirectUri}`;
    
    window.location.href = authUrl;
  };
  
  return (
    <Box>
      <Card sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
        <CardContent sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
            Vincular Cuenta de Mercado Pago
          </Typography>
          
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Para recibir pagos de tus reservas, necesitas vincular tu cuenta de Mercado Pago.
            Serás redirigido a Mercado Pago para autorizar la conexión.
          </Typography>
          
          <Box sx={{ bgcolor: '#F8FFFE', p: 3, borderRadius: 2, mb: 4 }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
              ¿Qué permisos solicitamos?
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'left' }}>
              • Procesar pagos de reservas<br />
              • Ver información de transacciones<br />
              • Recibir notificaciones de pagos
            </Typography>
          </Box>
          
          <Button
            variant="contained"
            size="large"
            onClick={handleVincular}
            sx={{
              bgcolor: '#00B4D8',
              '&:hover': { bgcolor: '#0077B6' },
              px: 4,
            }}
          >
            Vincular con Mercado Pago
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}
```

### Paso 2: Callback y Almacenamiento de Tokens

```typescript
// app/api/mercadopago/callback/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Service role para bypass RLS
);

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  
  // Verificar si hubo error
  if (error) {
    return NextResponse.redirect(
      new URL(`/dashboard/finanzas?error=${error}`, request.url)
    );
  }
  
  if (!code || !state) {
    return NextResponse.redirect(
      new URL('/dashboard/finanzas?error=invalid_request', request.url)
    );
  }
  
  try {
    // Decodificar state
    const stateData = JSON.parse(atob(state));
    const userId = stateData.userId;
    
    // Intercambiar code por tokens
    const tokenResponse = await fetch('https://api.mercadopago.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.MP_CLIENT_ID,
        client_secret: process.env.MP_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: process.env.NEXT_PUBLIC_MP_REDIRECT_URI,
      }),
    });
    
    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for tokens');
    }
    
    const tokens = await tokenResponse.json();
    
    // Obtener información del usuario de MP
    const userInfoResponse = await fetch('https://api.mercadopago.com/users/me', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
      },
    });
    
    const mpUserInfo = await userInfoResponse.json();
    
    // Guardar tokens en Supabase
    const { error: dbError } = await supabase
      .from('mp_accounts_propietarios')
      .upsert({
        propietario_id: userId,
        mp_user_id: mpUserInfo.id.toString(),
        mp_email: mpUserInfo.email,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        is_active: true,
        linked_at: new Date().toISOString(),
      }, {
        onConflict: 'propietario_id',
      });
    
    if (dbError) throw dbError;
    
    // Actualizar flag en estacionamientos
    await supabase
      .from('estacionamientos')
      .update({ mp_account_vinculada: true })
      .eq('propietario_id', userId);
    
    // Crear notificación
    await supabase.from('notificaciones').insert({
      usuario_id: userId,
      tipo: 'sistema',
      titulo: 'Cuenta de Mercado Pago vinculada',
      mensaje: 'Tu cuenta de Mercado Pago ha sido vinculada exitosamente. Ya puedes recibir pagos.',
    });
    
    // Registrar en audit log
    await supabase.from('audit_log').insert({
      usuario_id: userId,
      accion: 'crear',
      entidad_tipo: 'mp_account',
      entidad_id: userId,
      descripcion: 'Cuenta de Mercado Pago vinculada',
    });
    
    return NextResponse.redirect(
      new URL('/dashboard/finanzas?success=true', request.url)
    );
  } catch (error) {
    console.error('Error in MP OAuth callback:', error);
    return NextResponse.redirect(
      new URL('/dashboard/finanzas?error=server_error', request.url)
    );
  }
}
```

### Paso 3: Tabla para Almacenar Tokens

```sql
-- Migration: 20251220000014_create_mp_accounts_propietarios.sql

CREATE TABLE mp_accounts_propietarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  propietario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  
  -- Información de MP
  mp_user_id VARCHAR(255) NOT NULL,
  mp_email VARCHAR(255),
  
  -- Tokens OAuth
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Estado
  is_active BOOLEAN DEFAULT true,
  linked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_mp_accounts_propietario ON mp_accounts_propietarios(propietario_id);
CREATE INDEX idx_mp_accounts_mp_user ON mp_accounts_propietarios(mp_user_id);

-- Trigger
CREATE TRIGGER update_mp_accounts_propietarios_updated_at
  BEFORE UPDATE ON mp_accounts_propietarios
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE mp_accounts_propietarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Propietarios pueden ver su cuenta MP"
  ON mp_accounts_propietarios FOR SELECT
  USING (auth.uid() = propietario_id);

CREATE POLICY "Admins pueden ver todas las cuentas MP"
  ON mp_accounts_propietarios FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );
```

## 8.4 Refresh de Tokens

```typescript
// lib/mercadopago/refreshToken.ts

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function refreshMPToken(propietarioId: string): Promise<string> {
  // Obtener cuenta actual
  const { data: account, error } = await supabase
    .from('mp_accounts_propietarios')
    .select('*')
    .eq('propietario_id', propietarioId)
    .single();
  
  if (error || !account) {
    throw new Error('MP account not found');
  }
  
  // Verificar si el token está por expirar (menos de 1 hora)
  const expiresAt = new Date(account.token_expires_at);
  const now = new Date();
  const oneHour = 60 * 60 * 1000;
  
  if (expiresAt.getTime() - now.getTime() > oneHour) {
    // Token aún válido
    return account.access_token;
  }
  
  // Refresh token
  const response = await fetch('https://api.mercadopago.com/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: process.env.MP_CLIENT_ID,
      client_secret: process.env.MP_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: account.refresh_token,
    }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to refresh token');
  }
  
  const tokens = await response.json();
  
  // Actualizar en BD
  await supabase
    .from('mp_accounts_propietarios')
    .update({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
    })
    .eq('propietario_id', propietarioId);
  
  return tokens.access_token;
}
```

## 8.5 Procesamiento de Pagos

### Crear Preferencia de Pago

```typescript
// lib/mercadopago/createPreference.ts

import { refreshMPToken } from './refreshToken';

export interface CreatePreferenceParams {
  estacionamientoId: string;
  propietarioId: string;
  reservaId: string;
  monto: number;
  titulo: string;
  descripcion: string;
}

export async function createPaymentPreference(params: CreatePreferenceParams) {
  // Obtener access token actualizado
  const accessToken = await refreshMPToken(params.propietarioId);
  
  // Calcular comisión de Parkit (ej: 10%)
  const comisionParkit = params.monto * 0.10;
  const montoPropietario = params.monto - comisionParkit;
  
  // Crear preferencia
  const preference = {
    items: [
      {
        id: params.estacionamientoId,
        title: params.titulo,
        description: params.descripcion,
        quantity: 1,
        currency_id: 'ARS',
        unit_price: params.monto,
      },
    ],
    payer: {
      email: '', // Se completará en el checkout
    },
    back_urls: {
      success: `${process.env.NEXT_PUBLIC_APP_URL}/reservas/${params.reservaId}/success`,
      failure: `${process.env.NEXT_PUBLIC_APP_URL}/reservas/${params.reservaId}/failure`,
      pending: `${process.env.NEXT_PUBLIC_APP_URL}/reservas/${params.reservaId}/pending`,
    },
    auto_return: 'approved',
    external_reference: params.reservaId,
    notification_url: process.env.NEXT_PUBLIC_MP_WEBHOOK_URL,
    statement_descriptor: 'PARKIT',
    marketplace: 'PARKIT',
    marketplace_fee: comisionParkit,
  };
  
  const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(preference),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to create preference: ${JSON.stringify(error)}`);
  }
  
  const data = await response.json();
  
  return {
    preferenceId: data.id,
    initPoint: data.init_point,
    sandboxInitPoint: data.sandbox_init_point,
  };
}
```

### Webhook Handler

```typescript
// app/api/webhooks/mercadopago/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Verificar firma del webhook
function verifyWebhookSignature(request: NextRequest, body: string): boolean {
  const signature = request.headers.get('x-signature');
  const requestId = request.headers.get('x-request-id');
  
  if (!signature || !requestId) return false;
  
  const parts = signature.split(',');
  const ts = parts.find(p => p.startsWith('ts='))?.split('=')[1];
  const hash = parts.find(p => p.startsWith('v1='))?.split('=')[1];
  
  if (!ts || !hash) return false;
  
  const manifest = `id:${requestId};request-id:${requestId};ts:${ts};`;
  const hmac = crypto
    .createHmac('sha256', process.env.MP_WEBHOOK_SECRET!)
    .update(manifest + body)
    .digest('hex');
  
  return hmac === hash;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    
    // Verificar firma
    if (!verifyWebhookSignature(request, body)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
    
    const data = JSON.parse(body);
    
    // Procesar según tipo de notificación
    if (data.type === 'payment') {
      await handlePaymentNotification(data);
    } else if (data.type === 'merchant_order') {
      await handleMerchantOrderNotification(data);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

async function handlePaymentNotification(data: any) {
  const paymentId = data.data.id;
  
  // Obtener información del pago
  const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: {
      'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
    },
  });
  
  const payment = await response.json();
  
  // Obtener reserva por external_reference
  const reservaId = payment.external_reference;
  
  // Actualizar estado de la reserva
  const { error } = await supabase
    .from('reservas_estacionamiento')
    .update({
      payment_status: payment.status,
      payment_method: payment.payment_method_id,
      payment_authorized_at: payment.status === 'approved' ? new Date().toISOString() : null,
      payment_captured_at: payment.status === 'approved' ? new Date().toISOString() : null,
      estado: payment.status === 'approved' ? 'confirmada' : 'pendiente',
    })
    .eq('id', reservaId);
  
  if (error) {
    console.error('Error updating reserva:', error);
    return;
  }
  
  // Si el pago fue aprobado, crear notificaciones
  if (payment.status === 'approved') {
    const { data: reserva } = await supabase
      .from('reservas_estacionamiento')
      .select('*, estacionamientos(*)')
      .eq('id', reservaId)
      .single();
    
    if (reserva) {
      // Notificar al propietario
      await supabase.from('notificaciones').insert({
        usuario_id: reserva.estacionamientos.propietario_id,
        tipo: 'nueva_reserva',
        titulo: 'Nueva reserva confirmada',
        mensaje: `Tienes una nueva reserva en ${reserva.estacionamientos.nombre}`,
        referencia_tipo: 'reserva',
        referencia_id: reservaId,
      });
      
      // Notificar al usuario
      await supabase.from('notificaciones').insert({
        usuario_id: reserva.usuario_id,
        tipo: 'pago_recibido',
        titulo: 'Pago confirmado',
        mensaje: 'Tu reserva ha sido confirmada. ¡Nos vemos pronto!',
        referencia_tipo: 'reserva',
        referencia_id: reservaId,
      });
    }
  }
}

async function handleMerchantOrderNotification(data: any) {
  // Implementar si es necesario
  console.log('Merchant order notification:', data);
}
```

## 8.6 Dashboard de Finanzas para Propietarios

```typescript
// app/dashboard/finanzas/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  Alert,
} from '@mui/material';
import {
  AccountBalance as BankIcon,
  TrendingUp as TrendingIcon,
  Receipt as ReceiptIcon,
} from '@mui/icons-material';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface FinanzasData {
  mp_vinculada: boolean;
  mp_email: string | null;
  ingresos_totales: number;
  ingresos_mes_actual: number;
  ingresos_mes_anterior: number;
  reservas_pagadas: number;
  proximos_pagos: any[];
}

export default function FinanzasPage() {
  const { user } = useAuth();
  const [data, setData] = useState<FinanzasData | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadFinanzas();
  }, [user]);
  
  const loadFinanzas = async () => {
    if (!user) return;
    
    try {
      // Verificar si tiene MP vinculada
      const { data: mpAccount } = await supabase
        .from('mp_accounts_propietarios')
        .select('mp_email, is_active')
        .eq('propietario_id', user.id)
        .single();
      
      // Calcular ingresos
      const { data: reservas } = await supabase
        .from('reservas_estacionamiento')
        .select('monto_propietario, created_at, estado')
        .eq('estacionamiento_id.propietario_id', user.id)
        .eq('payment_status', 'captured');
      
      const now = new Date();
      const mesActual = now.getMonth();
      const mesAnterior = mesActual === 0 ? 11 : mesActual - 1;
      
      const ingresosTotal = reservas?.reduce((sum, r) => sum + Number(r.monto_propietario), 0) || 0;
      const ingresosMesActual = reservas?.filter(r => 
        new Date(r.created_at).getMonth() === mesActual
      ).reduce((sum, r) => sum + Number(r.monto_propietario), 0) || 0;
      const ingresosMesAnterior = reservas?.filter(r => 
        new Date(r.created_at).getMonth() === mesAnterior
      ).reduce((sum, r) => sum + Number(r.monto_propietario), 0) || 0;
      
      setData({
        mp_vinculada: !!mpAccount?.is_active,
        mp_email: mpAccount?.mp_email || null,
        ingresos_totales: ingresosTotal,
        ingresos_mes_actual: ingresosMesActual,
        ingresos_mes_anterior: ingresosMesAnterior,
        reservas_pagadas: reservas?.length || 0,
        proximos_pagos: [], // TODO: implementar
      });
    } catch (error) {
      console.error('Error loading finanzas:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return <Box>Cargando...</Box>;
  }
  
  const crecimiento = data && data.ingresos_mes_anterior > 0
    ? ((data.ingresos_mes_actual - data.ingresos_mes_anterior) / data.ingresos_mes_anterior) * 100
    : 0;
  
  return (
    <Box>
      {/* Header */}
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 4 }}>
        Finanzas
      </Typography>
      
      {/* Alerta si no tiene MP vinculada */}
      {!data?.mp_vinculada && (
        <Alert severity="warning" sx={{ mb: 4 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            No tienes una cuenta de Mercado Pago vinculada
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Para recibir pagos de tus reservas, necesitas vincular tu cuenta de Mercado Pago.
          </Typography>
          <Link href="/dashboard/finanzas/vincular-mercadopago" passHref>
            <Button variant="contained" size="small">
              Vincular Ahora
            </Button>
          </Link>
        </Alert>
      )}
      
      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box sx={{ p: 1, borderRadius: 2, bgcolor: '#E8F5E9', color: '#38A169', mr: 2 }}>
                  <BankIcon />
                </Box>
                <Typography variant="h6" color="text.secondary">
                  Ingresos Totales
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700 }}>
                ${data?.ingresos_totales.toLocaleString() || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {data?.reservas_pagadas || 0} reservas pagadas
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box sx={{ p: 1, borderRadius: 2, bgcolor: '#E8F7FA', color: '#00B4D8', mr: 2 }}>
                  <ReceiptIcon />
                </Box>
                <Typography variant="h6" color="text.secondary">
                  Este Mes
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700 }}>
                ${data?.ingresos_mes_actual.toLocaleString() || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Mes actual
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box sx={{ p: 1, borderRadius: 2, bgcolor: '#FFF4E5', color: '#FF9500', mr: 2 }}>
                  <TrendingIcon />
                </Box>
                <Typography variant="h6" color="text.secondary">
                  Crecimiento
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700 }}>
                {crecimiento >= 0 ? '+' : ''}{crecimiento.toFixed(1)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                vs. mes anterior
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Cuenta MP */}
      {data?.mp_vinculada && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Cuenta de Mercado Pago
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="body1">
                  Cuenta vinculada: <strong>{data.mp_email}</strong>
                </Typography>
                <Chip label="Activa" color="success" size="small" sx={{ mt: 1 }} />
              </Box>
              <Button variant="outlined" color="error">
                Desvincular
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}
      
      {/* Historial de Transacciones */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 3 }}>
            Historial de Transacciones
          </Typography>
          {/* Tabla de transacciones */}
          <Typography variant="body2" color="text.secondary">
            No hay transacciones recientes
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
```

## 8.7 Testing de Integración

### Credenciales de Prueba

```typescript
// tests/mercadopago.test.ts

describe('Mercado Pago Integration', () => {
  const testUser = {
    email: 'test_user_123456@testuser.com',
    password: 'qatest123',
  };
  
  it('should create payment preference', async () => {
    const preference = await createPaymentPreference({
      estacionamientoId: 'test-id',
      propietarioId: 'test-propietario',
      reservaId: 'test-reserva',
      monto: 1000,
      titulo: 'Test Parking',
      descripcion: 'Test reservation',
    });
    
    expect(preference).toHaveProperty('preferenceId');
    expect(preference).toHaveProperty('initPoint');
  });
  
  it('should handle webhook notification', async () => {
    const webhookData = {
      type: 'payment',
      data: { id: '123456789' },
    };
    
    const response = await fetch('/api/webhooks/mercadopago', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-signature': 'test-signature',
        'x-request-id': 'test-request-id',
      },
      body: JSON.stringify(webhookData),
    });
    
    expect(response.status).toBe(200);
  });
});
```

---

## 8.8 Monitoreo y Logs

### Dashboard de Transacciones (Admin)

```typescript
// app/admin/transacciones/page.tsx

'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  TextField,
  MenuItem,
} from '@mui/material';
import { supabase } from '@/lib/supabase';

export default function TransaccionesAdminPage() {
  const [transacciones, setTransacciones] = useState([]);
  const [filtro, setFiltro] = useState('todas');
  
  useEffect(() => {
    loadTransacciones();
  }, [filtro]);
  
  const loadTransacciones = async () => {
    let query = supabase
      .from('reservas_estacionamiento')
      .select(`
        *,
        estacionamientos(nombre, propietario_id),
        usuarios:usuario_id(email)
      `)
      .order('created_at', { ascending: false })
      .limit(100);
    
    if (filtro !== 'todas') {
      query = query.eq('payment_status', filtro);
    }
    
    const { data, error } = await query;
    
    if (!error) {
      setTransacciones(data || []);
    }
  };
  
  const getStatusChip = (status: string) => {
    const config: Record<string, { label: string; color: any }> = {
      pending: { label: 'Pendiente', color: 'warning' },
      authorized: { label: 'Autorizado', color: 'info' },
      captured: { label: 'Capturado', color: 'success' },
      failed: { label: 'Fallido', color: 'error' },
      refunded: { label: 'Reembolsado', color: 'default' },
      cancelled: { label: 'Cancelado', color: 'default' },
    };
    
    const { label, color } = config[status] || config.pending;
    return <Chip label={label} color={color} size="small" />;
  };
  
  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 4 }}>
        Transacciones
      </Typography>
      
      <Card>
        <CardContent>
          {/* Filtros */}
          <Box sx={{ mb: 3 }}>
            <TextField
              select
              label="Estado"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              sx={{ minWidth: 200 }}
            >
              <MenuItem value="todas">Todas</MenuItem>
              <MenuItem value="pending">Pendientes</MenuItem>
              <MenuItem value="authorized">Autorizadas</MenuItem>
              <MenuItem value="captured">Capturadas</MenuItem>
              <MenuItem value="failed">Fallidas</MenuItem>
              <MenuItem value="refunded">Reembolsadas</MenuItem>
            </TextField>
          </Box>
          
          {/* Tabla */}
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Fecha</TableCell>
                <TableCell>Estacionamiento</TableCell>
                <TableCell>Usuario</TableCell>
                <TableCell>Monto</TableCell>
                <TableCell>Comisión</TableCell>
                <TableCell>Estado</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transacciones.map((tx: any) => (
                <TableRow key={tx.id}>
                  <TableCell>{tx.codigo_reserva}</TableCell>
                  <TableCell>{new Date(tx.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>{tx.estacionamientos?.nombre}</TableCell>
                  <TableCell>{tx.usuarios?.email}</TableCell>
                  <TableCell>${tx.monto_total}</TableCell>
                  <TableCell>${tx.comision_parkit}</TableCell>
                  <TableCell>{getStatusChip(tx.payment_status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Box>
  );
}
```

---

## 8.9 Manejo de Errores y Reintentos

```typescript
// lib/mercadopago/errorHandling.ts

export class MPError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number,
    public details?: any
  ) {
    super(message);
    this.name = 'MPError';
  }
}

export async function retryMPRequest<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // No reintentar en ciertos errores
      if (error.status === 401 || error.status === 403) {
        throw error;
      }
      
      // Esperar antes de reintentar
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }
  
  throw lastError!;
}
```

---

## 8.10 Documentación de Referencia

### Links Útiles

- **Documentación OAuth MP:** https://www.mercadopago.com.ar/developers/es/docs/security/oauth/introduction
- **API Reference:** https://www.mercadopago.com.ar/developers/es/reference
- **Webhooks:** https://www.mercadopago.com.ar/developers/es/docs/your-integrations/notifications/webhooks
- **Testing:** https://www.mercadopago.com.ar/developers/es/docs/testing

### Códigos de Estado de Pago

| Estado | Descripción |
|--------|-------------|
| `pending` | Pago pendiente de procesamiento |
| `approved` | Pago aprobado |
| `authorized` | Pago autorizado (requiere captura) |
| `in_process` | Pago en proceso de revisión |
| `in_mediation` | Pago en mediación |
| `rejected` | Pago rechazado |
| `cancelled` | Pago cancelado |
| `refunded` | Pago reembolsado |
| `charged_back` | Contracargo |

### Comisiones

- **Comisión Parkit:** 10% del monto total
- **Comisión Mercado Pago:** Variable según método de pago (aprox. 3-5%)
- **Total propietario:** Monto - Comisión Parkit - Comisión MP

---

**FIN DEL MÓDULO DE INTEGRACIONES MERCADO PAGO**

