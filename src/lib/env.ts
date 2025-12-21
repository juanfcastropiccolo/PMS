// Configuración centralizada de variables de entorno
// Adaptado para usar tus nombres personalizados

export const env = {
  supabase: {
    url: process.env.SUPABASE_URL || '',
    anonKey: process.env.SUPABASE_ANON_KEY || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },
  app: {
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },
  mercadoPago: {
    publicKey: process.env.MP_PUBLIC_KEY || '',
    accessToken: process.env.MP_ACCESS_TOKEN || '',
    redirectUri: process.env.NEXT_PUBLIC_MP_REDIRECT_URI || '',
    webhookSecret: process.env.MP_WEBHOOK_SECRET || '',
    webhookUrl: process.env.NEXT_PUBLIC_MP_WEBHOOK_URL || '',
  },
  google: {
    placesApiKey: process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY || '',
  },
};
