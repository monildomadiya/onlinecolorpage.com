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

  /**
   * Server Actions arrive through the Cloudflare Worker, which rewrites Host
   * to the azurewebsites.net origin - App Service on the Free tier accepts no
   * custom hostname. That leaves x-forwarded-host as the Azure name while the
   * browser's Origin is still the public domain, and Next rejects the
   * mismatch as cross-origin before the action runs. Every sign-in died
   * there with "Invalid Server Actions request".
   *
   * Listing the hosts the site is legitimately served on is the supported fix;
   * the CSRF check stays on for everything else.
   */
  experimental: {
    serverActions: {
      allowedOrigins: [
        'onlinecolorpage.com',
        'www.onlinecolorpage.com',
        'onlinecolorpage-a5exfehkcqdqehdh.centralindia-01.azurewebsites.net',
      ],
    },
  },

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
