/** @type {import('next').NextConfig} */

// ── Security headers — applied to every response ──────────────────────────
// Grade this at https://securityheaders.com after deployment.
const securityHeaders = [
  // Prevent DNS prefetch leaking browsing behaviour
  { key: 'X-DNS-Prefetch-Control',  value: 'on' },
  // Force HTTPS for 2 years, include subdomains, preload-ready
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  // Block clickjacking — only same origin can frame this site
  { key: 'X-Frame-Options',          value: 'SAMEORIGIN' },
  // Stop browsers sniffing MIME types
  { key: 'X-Content-Type-Options',   value: 'nosniff' },
  // Don't leak full URL in referer header to third parties
  { key: 'Referrer-Policy',          value: 'strict-origin-when-cross-origin' },
  // Disable unnecessary browser features
  { key: 'Permissions-Policy',       value: 'camera=(), microphone=(), geolocation=()' },
  // Content Security Policy
  // - default-src: only same origin
  // - script-src: allow inline (needed by Next.js) and Google APIs
  // - style-src: allow inline (Tailwind) and Google Fonts
  // - font-src: Google Fonts CDN
  // - img-src: self, data URIs, and any HTTPS (for avatars/OG images)
  // - connect-src: self + Supabase + Vercel Analytics
  // - frame-ancestors: only same origin (stronger than X-Frame-Options in modern browsers)
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://va.vercel-scripts.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.resend.com https://va.vercel-scripts.com",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
]

const nextConfig = {
  async headers() {
    return [
      {
        // Apply to all routes
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },

  // Prevent source maps from being served in production
  // (reduces information disclosure)
  productionBrowserSourceMaps: false,
}

export default nextConfig
