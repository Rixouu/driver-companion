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
    "@storybook/addon-vitest",
    "@storybook/addon-essentials"
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
    };

    // Ensure React is available globally
    config.resolve = {
      ...config.resolve,
      alias: {
        ...config.resolve?.alias,
        'react': 'react',
        'react-dom': 'react-dom',
      },
    };
    
    return config;
  }
};
export default config;