/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // output: 'standalone',
  trailingSlash: false,
  reactStrictMode: false,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self' https:",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' blob: va.vercel-scripts.com vercel.com *.vercel.com vercel.live *.vercel.app *.vercel.sh unpkg.com cdnjs.cloudflare.com",
              "style-src 'self' 'unsafe-inline' va.vercel-scripts.com vercel.com *.vercel.com unpkg.com cdnjs.cloudflare.com fonts.googleapis.com",
              "img-src 'self' blob: data: https:",
              "font-src 'self' data: fonts.gstatic.com fonts.googleapis.com",
              "connect-src 'self' blob: data: https: wss: ws: *.supabase.co supabase.co",
              "worker-src 'self' blob:",
              "frame-src 'self' https:",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "manifest-src 'self'",
              "media-src 'self' data: blob: https:",
            ].join('; '),
          },
        ],
      },
    ]
  },
}

export default nextConfig
