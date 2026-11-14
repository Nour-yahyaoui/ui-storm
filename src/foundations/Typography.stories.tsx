import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'Foundations/Typography',
  parameters: {
    docs: {
      description: {
        component:
          'Arabic is a cursive script with contextual letterforms and marks above and below the ' +
          'baseline. It needs more line height, no letter spacing, and numerals that are chosen ' +
          'deliberately rather than inherited by accident.',
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export function ScriptPairingDemo() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Script pairing</h1>
        <p className="max-w-2xl text-muted">
          The Arabic stack is applied through <code className="text-sm">:lang(ar*)</code>, which
          raises line height to 1.85 and removes letter spacing. Latin text keeps the tighter
          default.
        </p>
      </header>

      <section aria-labelledby="latin-heading" className="space-y-3">
        <h2 id="latin-heading" className="text-xl font-semibold">
          Latin baseline
        </h2>
        <p className="max-w-prose text-lg">
          Accessibility is not a checklist applied at the end. It is the constraint that decides the
          markup, the keyboard contract, and what the component refuses to render.
        </p>
      </section>

      <section aria-labelledby="arabic-heading" className="space-y-3">
        <h2 id="arabic-heading" className="text-xl font-semibold">
          Arabic baseline
        </h2>
        <p lang="ar" dir="rtl" className="max-w-prose text-lg">
          إمكانية الوصول ليست قائمة تُطبَّق في النهاية، بل هي القيد الذي يحدد البنية الدلالية وعقد لوحة
          المفاتيح وما يرفض المكوّن عرضه.
        </p>
        <p lang="ar" dir="rtl" className="max-w-prose text-lg">
          نصٌّ مع تشكيل: الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ — لاحظ ارتفاع السطر الكافي للحركات.
        </p>
      </section>

      <section aria-labelledby="numerals-heading" className="space-y-3">
        <h2 id="numerals-heading" className="text-xl font-semibold">
          Numerals are a product decision
        </h2>
        <p className="max-w-prose text-sm text-muted">
          Arabic-Indic digits (٠١٢٣٤٥٦٧٨٩) are conventional in Egypt and parts of the Gulf, while
          Western digits are standard in the Maghreb. Both must survive copying, searching and
          screen readers; pick one per locale instead of letting the font decide.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-md border border-border bg-surface p-4">
            <h3 id="numerals-western" className="mb-2 text-sm font-semibold">
              Western digits (ar-MA, ar-TN)
            </h3>
            <p className="text-2xl tabular-nums" dir="rtl" lang="ar">
              1,234.56 د.ت
            </p>
          </div>
          <div className="rounded-md border border-border bg-surface p-4">
            <h3 id="numerals-arabic" className="mb-2 text-sm font-semibold">
              Arabic-Indic digits (ar-EG)
            </h3>
            <p className="text-2xl tabular-nums" dir="rtl" lang="ar">
              ١٬٢٣٤٫٥٦ ج.م
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="avoid-heading" className="space-y-3">
        <h2 id="avoid-heading" className="text-xl font-semibold">
          What this library will not do
        </h2>
        <ul className="list-inside list-disc space-y-2 text-muted">
          <li>
            Apply <code className="text-sm">letter-spacing</code> or uppercase transforms to Arabic
            text.
          </li>
          <li>Force a single font stack on text whose language the component cannot see.</li>
          <li>
            Use text alignment as a proxy for direction: <code className="text-sm">text-start</code>{' '}
            is direction-aware, <code className="text-sm">text-left</code> is not.
          </li>
        </ul>
      </section>
    </div>
  );
}

export const ScriptPairing: Story = {
  render: () => <ScriptPairingDemo />,
};
