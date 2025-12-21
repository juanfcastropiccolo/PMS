/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Exponer variables personalizadas al cliente (sin NEXT_PUBLIC_)
  // Esto permite que las variables sin prefijo funcionen en el cliente
  env: {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    // También exponerlas como NEXT_PUBLIC_ para el middleware
    NEXT_PUBLIC_SUPABASE_URL: process.env.SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  },
};

module.exports = nextConfig;
