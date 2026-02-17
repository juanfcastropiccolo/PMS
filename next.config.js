/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Reducir uso de file watchers en dev (evita EMFILE en macOS)
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ignored: ['**/node_modules', '**/.git', '**/.next'],
        aggregateTimeout: 300,
      };
    }
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'hldpjshvcwlyjmqmugrf.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
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
