import type { NextConfig } from 'next'

const rawVariant = process.env.NEXT_PUBLIC_DASHBOARD_VARIANT ?? 'v1'
const safeVariant = rawVariant.replace(/[^a-z0-9_-]/gi, '').toLowerCase() || 'v1'

const nextConfig: NextConfig = {
  // Keep variant artifacts under .next/* so Tailwind's scanner ignores cache binaries.
  distDir: `.next/${safeVariant}`,
}

export default nextConfig
