/** @type {import('next').NextConfig} */
const nextConfig = {
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
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self), payment=(self)',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self' https:",
              "script-src 'self' 'unsafe-inline' blob: va.vercel-scripts.com vercel.com *.vercel.com vercel.live *.vercel.app *.vercel.sh unpkg.com cdnjs.cloudflare.com",
              "style-src 'self' 'unsafe-inline' va.vercel-scripts.com vercel.com *.vercel.com unpkg.com cdnjs.cloudflare.com fonts.googleapis.com",
              "img-src 'self' blob: data: https: *.googleusercontent.com *.ggpht.com",
              "font-src 'self' data: fonts.gstatic.com fonts.googleapis.com",
              "connect-src 'self' blob: data: https: wss: ws: *.supabase.co supabase.co accounts.google.com securetoken.googleapis.com www.googleapis.com oauth2.googleapis.com *.googleapis.com",
              "worker-src 'self' blob:",
              "frame-src 'self' https: accounts.google.com",
              "form-action 'self' accounts.google.com",
              "object-src 'none'",
              "base-uri 'self'",
              "frame-ancestors 'self'",
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
