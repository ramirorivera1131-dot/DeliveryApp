import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'kwjtnswifypypxdiaupv.supabase.co' },
    ],
  },
  experimental: { typedRoutes: false },
}

export default nextConfig
