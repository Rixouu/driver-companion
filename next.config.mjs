import {withSentryConfig} from '@sentry/nextjs';
import withBundleAnalyzerInitializer from '@next/bundle-analyzer';
import withPWAInitializer from 'next-pwa';

const withBundleAnalyzer = withBundleAnalyzerInitializer({
  enabled: process.env.ANALYZE === 'true',
});

// Initialize next-pwa
const withPWA = withPWAInitializer({
  dest: 'public',
  register: true,       // Register the SW automatically
  skipWaiting: true,      // Install new SW immediately
  disable: process.env.NODE_ENV === 'development', // Disable PWA in development
});

let userConfig = undefined
try {
  userConfig = await import('./v0-user-next.config')
} catch (e) {
  // ignore error
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: process.cwd(),
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('@sparticuz/chromium');
    }
    
    // Optimize webpack cache to reduce large string serialization warnings
    config.cache = {
      ...config.cache,
      compression: 'gzip',
      maxMemoryGenerations: 1,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    };
    
    return config;
  },
  images: {
    domains: ['staging.japandriver.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.weatherapi.com',
      },
      {
        protocol: 'https', // Placeholder for customer avatars
        hostname: '*.example.com', // TODO: Replace with actual avatar domain
      },
      {
        protocol: 'https',
        hostname: 'maps.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'oxahlhhddnatkiymemgz.supabase.co',
      },
    ],
  },
  typedRoutes: true,
  experimental: {
    webpackBuildWorker: true,
    parallelServerBuildTraces: true,
    parallelServerCompiles: true,
    serverActions: {
      allowedOrigins: ['localhost:3000', '*.vercel.app'],
    },
  },
  async headers() {
    const mjsHeaders = [
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
    ];
    const jsHeaders = [
      {
        source: '/api/bookings/sync',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
    ];
    return [...mjsHeaders, ...jsHeaders];
  },
  async rewrites() {
    return [
      {
        source: '/sync-bookings',
        destination: '/api/bookings/sync'
      }
    ]
  }
}

mergeConfig(nextConfig, userConfig)

function mergeConfig(nextConfig, userConfig) {
  if (!userConfig) {
    return
  }

  for (const key in userConfig) {
    if (
      typeof nextConfig[key] === 'object' &&
      !Array.isArray(nextConfig[key]) &&
      nextConfig[key] !== null &&
      typeof userConfig[key] === 'object' &&
      !Array.isArray(userConfig[key]) &&
      userConfig[key] !== null
    ) {
      if (key === 'experimental' || key === 'images' || key === 'serverActions') {
        nextConfig[key] = {
          ...nextConfig[key],
          ...userConfig[key],
        };
      } else if (typeof nextConfig[key] === 'function' && typeof userConfig[key] === 'function') {
        nextConfig[key] = userConfig[key];
      } else {
         nextConfig[key] = {
          ...nextConfig[key],
          ...userConfig[key],
        }
      }
    } else {
      nextConfig[key] = userConfig[key]
    }
  }
}

// Apply PWA wrapper to nextConfig first
const pwaConfig = withPWA(nextConfig);

// Disable Sentry for CI builds to prevent auth token warnings
const sentryConfig = process.env.CI ? {} : {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "rycx",
  project: "javascript-nextjs",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Uncomment to route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  // tunnelRoute: "/monitoring",

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
  // See the following for more information:
  // https://docs.sentry.io/product/crons/
  // https://vercel.com/docs/cron-jobs
  automaticVercelMonitors: true,
};

export default process.env.CI ? withBundleAnalyzer(pwaConfig) : withSentryConfig(withBundleAnalyzer(pwaConfig), sentryConfig);