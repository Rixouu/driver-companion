import type { StorybookConfig } from "@storybook/nextjs-vite";

const config: StorybookConfig = {
  "stories": [
    "../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)",
    "../components/ui/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [
    "@chromatic-com/storybook",
    "@storybook/addon-docs",
    "@storybook/addon-onboarding",
    "@storybook/addon-a11y",
    "@storybook/addon-vitest"
  ],
  "framework": {
    "name": "@storybook/nextjs-vite",
    "options": {}
  },
  "staticDirs": [
    "../public"
  ],
  "viteFinal": async (config) => {
    // Add Node.js polyfills for browser environment
    config.define = {
      ...config.define,
      global: 'globalThis',
      __dirname: '""',
      __filename: '""',
      'process.env': '{}',
    };

    // Ensure React is available globally
    config.resolve = {
      ...config.resolve,
      alias: {
        ...config.resolve?.alias,
        'react': 'react',
        'react-dom': 'react-dom',
        '@': '/Users/cto/Documents/Repositories/02-Pro/vehicle-inspection',
      },
    };

    // Add fallbacks for Node.js modules
    config.resolve.fallback = {
      ...config.resolve?.fallback,
      fs: false,
      path: false,
      os: false,
      crypto: false,
      stream: false,
      util: false,
      buffer: false,
      process: false,
    };
    
    return config;
  }
};
export default config;