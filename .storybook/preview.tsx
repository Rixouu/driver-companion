import type { Preview } from '@storybook/nextjs-vite'
import '../app/globals.css'
import { withProviders } from './decorators'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo',
      config: {
        rules: [
          {
            id: 'color-contrast',
            enabled: true,
          },
          {
            id: 'keyboard-navigation',
            enabled: true,
          },
        ],
      },
    },

    backgrounds: {
      default: 'light',
      values: [
        {
          name: 'light',
          value: '#ffffff',
        },
        {
          name: 'dark',
          value: '#0a0a0a',
        },
        {
          name: 'gray',
          value: '#f5f5f5',
        },
        {
          name: 'blue',
          value: '#f0f9ff',
        },
      ],
    },

    // Chromatic visual testing parameters
    chromatic: {
      // Disable animations for consistent visual testing
      disableSnapshot: false,
      // Delay before capturing screenshots
      delay: 1000,
      // Pause animations during capture
      pauseAnimationAtEnd: true,
    },

    docs: {
      toc: true,
      source: {
        type: 'dynamic',
      },
    },

    layout: 'centered',
  },
  decorators: [withProviders],
};

export default preview;