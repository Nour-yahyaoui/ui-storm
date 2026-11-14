import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'Foundations/Tokens',
  parameters: {
    docs: {
      description: {
        component:
          'Every visual decision in the library resolves through a CSS custom property. ' +
          'Components never hard-code a color, so dark mode, high contrast and host-app ' +
          'overrides work without recompiling.',
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

interface Swatch {
  token: string;
  className: string;
  note: string;
}

const colorGroups: Array<{ title: string; description: string; swatches: Swatch[] }> = [
  {
    title: 'Surfaces',
    description: 'Backgrounds, from the page canvas to raised panels.',
    swatches: [
      { token: '--aui-color-canvas', className: 'bg-canvas', note: 'Page background' },
      { token: '--aui-color-surface', className: 'bg-surface', note: 'Cards, inputs' },
      {
        token: '--aui-color-surface-raised',
        className: 'bg-surface-raised',
        note: 'Popovers, menus',
      },
      {
        token: '--aui-color-surface-sunken',
        className: 'bg-surface-sunken',
        note: 'Wells, code blocks',
      },
    ],
  },
  {
    title: 'Text',
    description: 'Body text is at least 7:1 on surface; muted text stays above 4.5:1.',
    swatches: [
      { token: '--aui-color-text', className: 'bg-text', note: 'Primary text' },
      { token: '--aui-color-text-muted', className: 'bg-muted', note: 'Secondary text' },
      {
        token: '--aui-color-text-on-accent',
        className: 'bg-on-accent',
        note: 'Text on accent fill',
      },
    ],
  },
  {
    title: 'Interaction and status',
    description: 'Accent for actions, semantic colors for feedback. Never the only signal.',
    swatches: [
      { token: '--aui-color-accent', className: 'bg-accent', note: 'Primary action' },
      { token: '--aui-color-danger', className: 'bg-danger', note: 'Error' },
      { token: '--aui-color-success', className: 'bg-success', note: 'Success' },
      { token: '--aui-color-warning', className: 'bg-warning', note: 'Warning' },
      { token: '--aui-color-info', className: 'bg-info', note: 'Information' },
      { token: '--aui-color-focus-ring', className: 'bg-focus-ring', note: 'Focus indicator' },
    ],
  },
  {
    title: 'Lines',
    description:
      'Decorative borders carry no contrast requirement. Control boundaries must use the strong border, which is at least 3:1 against the surface (WCAG 1.4.11).',
    swatches: [
      { token: '--aui-color-border', className: 'bg-border', note: 'Dividers only' },
      {
        token: '--aui-color-border-strong',
        className: 'bg-border-strong',
        note: 'Input and button edges',
      },
    ],
  },
];

const motionTokens = [
  { token: '--aui-duration-fast', value: '120ms', usage: 'Hover, focus feedback' },
  { token: '--aui-duration-base', value: '180ms', usage: 'Menus, tooltips' },
  { token: '--aui-duration-slow', value: '320ms', usage: 'Dialogs, drawers' },
];

export function ColorTokensDemo() {
  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Color tokens</h1>
        <p className="max-w-2xl text-muted">
          Flip the Theme toolbar to dark, or open this story with{' '}
          <code className="rounded-sm bg-surface-sunken px-1.5 py-0.5 text-sm">
            prefers-contrast: more
          </code>{' '}
          to see the same tokens re-map. No component changes.
        </p>
      </header>

      {colorGroups.map((group) => (
        <section key={group.title} aria-labelledby={`group-${group.title}`} className="space-y-4">
          <div className="space-y-1">
            <h2 id={`group-${group.title}`} className="text-xl font-semibold">
              {group.title}
            </h2>
            <p className="text-sm text-muted">{group.description}</p>
          </div>

          <ul className="grid gap-3 sm:grid-cols-2">
            {group.swatches.map((swatch) => (
              <li
                key={swatch.token}
                className="flex items-center gap-3 rounded-md border border-border bg-surface p-3"
              >
                <span
                  aria-hidden="true"
                  className={`size-10 shrink-0 rounded-md border border-border ${swatch.className}`}
                />
                <span className="min-w-0">
                  <code className="block truncate text-sm font-medium" dir="ltr">
                    {swatch.token}
                  </code>
                  <span className="block text-xs text-muted">{swatch.note}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

export const Color: Story = {
  render: () => <ColorTokensDemo />,
};

export function ShapeAndMotionDemo() {
  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Radius, depth and motion</h1>
        <p className="max-w-2xl text-muted">
          Motion tokens are durations only. Components must also collapse their transitions under{' '}
          <code className="rounded-sm bg-surface-sunken px-1.5 py-0.5 text-sm">
            prefers-reduced-motion: reduce
          </code>
          .
        </p>
      </header>

      <section aria-labelledby="radius-heading" className="space-y-4">
        <h2 id="radius-heading" className="text-xl font-semibold">
          Radius
        </h2>
        <ul className="flex flex-wrap gap-4">
          {[
            { token: '--aui-radius-sm', className: 'rounded-sm' },
            { token: '--aui-radius-md', className: 'rounded-md' },
            { token: '--aui-radius-lg', className: 'rounded-lg' },
            { token: '--aui-radius-full', className: 'rounded-full' },
          ].map((radius) => (
            <li key={radius.token} className="space-y-2">
              <div aria-hidden="true" className={`size-16 bg-accent-subtle ${radius.className}`} />
              <code className="block text-xs" dir="ltr">
                {radius.token}
              </code>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="motion-heading" className="space-y-4">
        <h2 id="motion-heading" className="text-xl font-semibold">
          Motion
        </h2>
        <dl className="divide-y divide-border rounded-md border border-border bg-surface">
          {motionTokens.map((motion) => (
            <div key={motion.token} className="flex items-baseline justify-between gap-4 p-3">
              <dt>
                <code className="text-sm" dir="ltr">
                  {motion.token}
                </code>
              </dt>
              <dd className="text-sm text-muted">
                {motion.value} · {motion.usage}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}

export const ShapeAndMotion: Story = {
  render: () => <ShapeAndMotionDemo />,
};

export function FocusIndicatorDemo() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Focus indicator</h1>
        <p className="max-w-2xl text-muted">
          Tab through these reference controls: the ring is 3px, offset by 2px, and is drawn outside
          the element so it survives <code className="text-sm">overflow: hidden</code>. In
          forced-colors mode it becomes a 3px <code className="text-sm">Highlight</code> outline.
        </p>
      </header>

      {/* Reference markup: these are plain elements showing the token contract,
          not the library's Button. */}
      <div className="flex flex-wrap gap-3">
        <button type="button" className="rounded-md bg-accent px-4 py-2 font-medium text-on-accent">
          Primary action
        </button>
        <button
          type="button"
          className="rounded-md border border-border-strong bg-surface px-4 py-2 font-medium"
        >
          Secondary action
        </button>
        <a
          href="#focus-indicator"
          className="rounded-md px-4 py-2 font-medium text-accent underline underline-offset-4"
        >
          A link
        </a>
        <input
          type="text"
          aria-label="Example text input"
          placeholder="Input"
          className="min-h-11 rounded-md border border-border-strong bg-surface px-3"
        />
      </div>
    </div>
  );
}

export const FocusIndicator: Story = {
  render: () => <FocusIndicatorDemo />,
};
