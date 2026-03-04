import type { NextConfig } from 'next'

const rawVariant = process.env.NEXT_PUBLIC_DASHBOARD_VARIANT ?? 'v1'
const safeVariant = rawVariant.replace(/[^a-z0-9_-]/gi, '').toLowerCase() || 'v1'

const nextConfig: NextConfig = {
  // Keep variant artifacts under .next/* for local variant dev servers.
  // Production/Vercel builds must output to plain ".next".
  distDir:
    process.env.NODE_ENV === 'development'
      ? `.next/${safeVariant}`
      : '.next',
}

export default nextConfig
