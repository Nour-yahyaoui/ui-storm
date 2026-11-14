import type { StorybookConfig } from '@storybook/react-vite';

// Stories live next to the code they document.
// MDX docs pages are added by the documentation milestone; when the first one
// lands, extend the stories glob with a `src/**/*.mdx` pattern. Until then the
// pattern would match nothing and Storybook logs a warning on every start.
const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  core: {
    disableTelemetry: true,
  },
  docs: {
    defaultName: 'Documentation',
  },
  typescript: {
    reactDocgen: 'react-docgen-typescript',
  },
};

export default config;
