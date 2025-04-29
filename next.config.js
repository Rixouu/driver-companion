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
  swcMinify: true
}

module.exports = nextConfig 