import type { Decorator, Preview } from '@storybook/react-vite';
import { DirectionProvider } from '../src/providers/DirectionProvider';
import '../src/styles/storybook.css';

/**
 * Locale and theme are Storybook globals so every story can be reviewed in
 * Arabic/RTL and in dark mode without a code change.
 */
const LOCALES = [
  { value: 'en', title: 'English (LTR)' },
  { value: 'ar-EG', title: 'العربية (RTL)' },
  { value: 'he-IL', title: 'עברית (RTL)' },
  { value: 'ur-PK', title: 'اردو (RTL)' },
];

const withTheme: Decorator = (Story, context) => {
  const theme = context.globals.theme === 'dark' ? 'dark' : 'light';
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.theme = theme;
  }
  return <Story />;
};

const withToolbarLocale: Decorator = (Story, context) => {
  const locale = (context.globals.locale as string | undefined) ?? 'en';

  return (
    <DirectionProvider locale={locale} className="min-h-screen bg-canvas p-6 text-text">
      <Story />
    </DirectionProvider>
  );
};

const preview: Preview = {
  tags: ['autodocs'],
  decorators: [withTheme, withToolbarLocale],
  initialGlobals: { locale: 'en', theme: 'light' },
  globalTypes: {
    locale: {
      description: 'Locale and writing direction',
      toolbar: {
        title: 'Locale',
        icon: 'globe',
        items: LOCALES,
        dynamicTitle: true,
      },
    },
    theme: {
      description: 'Color scheme',
      toolbar: {
        title: 'Theme',
        icon: 'contrast',
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
        ],
        dynamicTitle: true,
      },
    },
  },
  parameters: {
    layout: 'fullscreen',
    controls: {
      matchers: { color: /(background|color)$/i, date: /Date$/i },
      expanded: true,
    },
    // Violations reported by the a11y panel are failures, not suggestions.
    a11y: {
      test: 'error',
    },
    docs: {
      codePanel: true,
    },
  },
};

export default preview;
