import type { NextConfig } from 'next';

const r2Host = (() => {
  try {
    return process.env.R2_PUBLIC_BASE_URL
      ? new URL(process.env.R2_PUBLIC_BASE_URL).hostname
      : null;
  } catch {
    return null;
  }
})();

const nextConfig: NextConfig = {
  // Required for the Docker image we deploy to Azure App Service / Container Apps.
  output: 'standalone',
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,

  // sharp + pdf-lib must stay as real node modules in the server bundle.
  serverExternalPackages: ['sharp', 'pdf-lib'],

  images: {
    formats: ['image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: '**.r2.dev' },
      { protocol: 'https', hostname: '**.r2.cloudflarestorage.com' },
      ...(r2Host ? [{ protocol: 'https' as const, hostname: r2Host }] : []),
    ],
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      {
        source: '/api/file/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ];
  },
};

export default nextConfig;
