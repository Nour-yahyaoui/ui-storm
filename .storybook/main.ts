import type { StorybookConfig } from '@storybook/react-vite';

/**
 * Stories live next to the code they document. `.mdx` pages hold the long-form
 * guidance (keyboard tables, ARIA contract, RTL notes) for each component.
 */
const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(ts|tsx)'],
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
