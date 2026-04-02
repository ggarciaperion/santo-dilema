import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async redirects() {
    return [
      {
        source: '/tacos',
        destination: '/',
        permanent: false,
      },
    ];
  },
  // Deshabilitar caché para forzar rebuild completo
  generateBuildId: async () => {
    return `build-${Date.now()}`;
  },
};

export default nextConfig;
