/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    domains: ['staging.japandriver.com'],
  },
  experimental: {
    webpackBuildWorker: true,
  },
}

module.exports = nextConfig 