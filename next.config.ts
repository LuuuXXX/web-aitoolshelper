import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    const headers = [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
    if (process.env.NODE_ENV === 'production') {
      headers[0].headers.push(
        { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        // NOTE: script-src retains 'unsafe-inline' because Next.js injects inline
        // runtime scripts that are not nonce-gated in this version. Removing it
        // breaks the app. Nonce-based CSP is a documented follow-up. This is the
        // accepted compromise for now (style-src also needs 'unsafe-inline').
        { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none'; base-uri 'self'" },
      )
    }
    return headers
  },
};

export default nextConfig;
