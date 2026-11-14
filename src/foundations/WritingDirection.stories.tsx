import type { Meta, StoryObj } from '@storybook/react-vite';
import { DirectionProvider } from '../providers/DirectionProvider';

const meta = {
  title: 'Foundations/Writing direction',
  parameters: {
    docs: {
      description: {
        component:
          'Layout is written with CSS logical properties — `margin-inline-start`, `inset-inline-end`, ' +
          '`border-inline-start` — never with left/right. Switch the Locale toolbar to العربية to see ' +
          'the same markup mirror itself; no component re-renders with different classes.',
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function ArrowIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      // The one legitimate use of a direction variant: directional icons mirror
      // automatically only in some scripts, so we mirror them explicitly.
      className="size-5 rtl:rotate-180"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function ReceiptCard() {
  return (
    <div
      data-testid="receipt-card"
      className="relative overflow-hidden rounded-lg border border-border bg-surface shadow-sm"
    >
      {/* Marker used by the Playwright suite to prove inset-inline-start flips. */}
      <span
        data-testid="start-marker"
        aria-hidden="true"
        className="absolute inset-y-0 start-0 w-1.5 bg-accent"
      />

      <div className="flex items-center gap-3 py-4 ps-6 pe-4">
        <span
          aria-hidden="true"
          className="grid size-11 shrink-0 place-items-center rounded-full bg-accent-subtle font-semibold text-accent"
        >
          ن
        </span>
        <div className="min-w-0">
          <p className="truncate font-semibold">Nour Yahyaoui</p>
          <p className="truncate text-sm text-muted">Invoice #AUI-2041</p>
        </div>
        <span className="ms-auto inline-flex items-center gap-1 rounded-full bg-success-subtle px-3 py-1 text-sm font-medium text-success">
          Paid
        </span>
      </div>

      <dl className="divide-y divide-border border-t border-border text-sm">
        {[
          { label: 'Design system audit', value: '1,200.00 TND' },
          { label: 'RTL implementation', value: '850.00 TND' },
          { label: 'Accessibility review', value: '400.00 TND' },
        ].map((row) => (
          <div key={row.label} className="flex items-baseline justify-between gap-4 py-3 ps-6 pe-4">
            <dt className="text-muted">{row.label}</dt>
            <dd className="font-medium tabular-nums">{row.value}</dd>
          </div>
        ))}
      </dl>

      <div className="flex items-center justify-between gap-4 border-t border-border bg-surface-sunken py-3 ps-6 pe-4">
        <span className="text-sm font-medium">Total</span>
        <span className="flex items-center gap-2 font-semibold tabular-nums">
          2,450.00 TND
          <ArrowIcon />
        </span>
      </div>
    </div>
  );
}

export function LogicalPropertiesDemo() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Logical properties in practice</h1>
        <p className="max-w-2xl text-muted">
          The accent bar, avatar, labels and totals are all positioned with{' '}
          <code className="rounded-sm bg-surface-sunken px-1.5 py-0.5 text-sm">start / end</code>{' '}
          utilities. Switch the Locale toolbar between English and العربية: nothing re-renders, the
          browser flips the geometry.
        </p>
      </header>

      <ReceiptCard />

      <section aria-labelledby="timeline-heading" className="space-y-3">
        <h2 id="timeline-heading" className="text-xl font-semibold">
          Border on the inline-start edge
        </h2>
        <ol className="space-y-4 border-s-2 border-accent ps-5">
          <li>
            <p className="font-medium">Design tokens</p>
            <p className="text-sm text-muted">
              Contrast-checked colors and Arabic-aware typography.
            </p>
          </li>
          <li>
            <p className="font-medium">Direction provider</p>
            <p className="text-sm text-muted">
              Locale resolves to a direction once, at the top of the tree.
            </p>
          </li>
          <li>
            <p className="font-medium">Components</p>
            <p className="text-sm text-muted">
              Keyboard paths and ARIA contracts tested in both directions.
            </p>
          </li>
        </ol>
      </section>
    </div>
  );
}

export const LogicalProperties: Story = {
  render: () => <LogicalPropertiesDemo />,
};

export function BidiIsolationDemo() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Bidirectional text</h1>
        <p className="max-w-2xl text-muted">
          Latin identifiers, phone numbers and file names embedded in Arabic sentences need
          isolation. Untreated, the punctuation jumps to the wrong side of the line.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <section
          aria-labelledby="bidi-broken"
          className="space-y-3 rounded-lg border border-danger bg-surface p-4"
        >
          <h2 id="bidi-broken" className="font-semibold text-danger">
            Without isolation
          </h2>
          <p lang="ar" dir="rtl" className="text-lg">
            رقم الفاتورة AUI-2041) واتساب +216 55 123 456.
          </p>
          <p className="text-sm text-muted">
            The closing parenthesis and the trailing period land on the wrong side because they
            inherit the paragraph direction.
          </p>
        </section>

        <section
          aria-labelledby="bidi-fixed"
          className="space-y-3 rounded-lg border border-success bg-surface p-4"
        >
          <h2 id="bidi-fixed" className="font-semibold text-success">
            With <code className="text-sm">bdi</code>
          </h2>
          <p lang="ar" dir="rtl" className="text-lg">
            رقم الفاتورة <bdi>AUI-2041</bdi> واتساب <bdi>+216 55 123 456</bdi>.
          </p>
          <p className="text-sm text-muted">
            Each identifier is isolated, so surrounding punctuation stays where the reader expects
            it.
          </p>
        </section>
      </div>

      <section aria-labelledby="nested-ltr" className="space-y-3">
        <h2 id="nested-ltr" className="text-xl font-semibold">
          Nested direction override
        </h2>
        <p className="text-muted">
          A code block inside an Arabic page must stay LTR, including its caret position and
          selection:
        </p>
        <DirectionProvider dir="ltr" locale="en" className="rounded-md border border-border">
          <pre className="overflow-x-auto bg-surface-sunken p-4 text-sm" dir="ltr">
            <code>{`<DirectionProvider locale="ar-EG">
  <Dialog title="تأكيد الحذف" />
</DirectionProvider>`}</code>
          </pre>
        </DirectionProvider>
      </section>
    </div>
  );
}

export const BidiIsolation: Story = {
  render: () => <BidiIsolationDemo />,
};
