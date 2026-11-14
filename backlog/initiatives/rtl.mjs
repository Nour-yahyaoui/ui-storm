import { toIssue } from '../initiative.mjs';

export const RTL = [
  {
    key: 'rtl-arabic-font-strategy',
    title: 'Ship a self-hosted Arabic font strategy with no layout shift',
    type: 'type: i18n',
    size: 'l',
    priority: 'p1',
    summary:
      'The token stack currently relies on system fonts. A bundled, subsetted Arabic face gives consistent rendering, but must not cause FOIT or a metrics jump.',
    criteria: [
      'Choose the face (IBM Plex Sans Arabic or Noto Naskh Arabic) with a licensing review committed',
      'Subset to Arabic + Latin + punctuation; report the byte size and load it as font-display: swap',
      'size-adjust / ascent-override fallback metrics prevent layout shift (measured with CLS in a story)',
      'Docs state how consumers opt out and use their own face',
      'Storybook renders the same font as production',
    ],
    dependsOn: ['rtl-typography-audit'],
  },
  {
    key: 'rtl-typography-audit',
    title: 'Audit Arabic typography across every text size and token',
    type: 'type: design',
    size: 'm',
    priority: 'p1',
    summary:
      'Arabic glyphs are taller and deeper than Latin. Sizes copied from a Latin scale clip diacritics in buttons, badges and dense tables.',
    criteria: [
      'A specimen page renders every size token with Arabic text including tashkeel and stacked marks',
      'Line heights are adjusted per language, not multiplied by a global 1.85',
      'No component sets letter-spacing or uppercase on Arabic text (verified by grep and test)',
      'Truncation and line-clamp behaviour verified for Arabic in buttons, badges, table cells and cards',
      'Findings applied to tokens.css and recorded in docs/rtl-and-arabic.md',
    ],
  },
  {
    key: 'rtl-icon-mirroring-audit',
    title: 'Audit every icon for RTL mirroring and publish the registry',
    type: 'type: i18n',
    size: 'm',
    priority: 'p1',
    summary:
      'Mirroring the wrong icon is worse than not mirroring: a mirrored clock or refresh glyph looks like a bug, while a non-mirrored back arrow points the wrong way.',
    criteria: [
      'Every icon in the set is classified as mirrors or never-mirrors with a one-line reason',
      'Registry is machine-readable and used by the Icon component',
      'A test fails when an icon is added without a classification',
      'Docs page renders each icon in both directions for review',
      'Decisions follow the general rule: meaning, not decoration, decides',
    ],
  },
  {
    key: 'rtl-logical-property-lint',
    title: 'Enforce logical properties with a lint rule and CI check',
    type: 'type: chore',
    size: 's',
    priority: 'p1',
    summary:
      'One `ml-4` in a component is enough to break RTL silently. The rule must fail the build, not appear in review.',
    criteria: [
      'Script or ESLint rule flags physical margin, padding, inset, border-side and text-alignment utilities',
      'Allowed exceptions (for example physical transforms on pointer-anchored surfaces) are documented and annotated',
      'Runs in CI on every PR and in npm run verify',
      'The current src tree passes with zero violations',
    ],
    flags: ['good first issue'],
  },
  {
    key: 'rtl-bidi-component',
    title: 'Add a Bidi component for embedded Latin content',
    type: 'type: i18n',
    size: 's',
    priority: 'p2',
    summary:
      'Identifiers, phone numbers and file names inside Arabic sentences need isolation. A tiny component makes the correct approach the easy one.',
    criteria: [
      'Renders bdi by default with an option to force dir="ltr" for values such as URLs',
      'Documented with before/after examples showing punctuation placement',
      'Used by every component that renders user-supplied identifiers',
      'Test asserts the computed direction of the isolated element',
    ],
  },
  {
    key: 'rtl-number-formatting',
    title: 'Format numerals per locale instead of relying on the font',
    type: 'type: i18n',
    size: 'm',
    priority: 'p1',
    summary:
      'Arabic-Indic digits (٠١٢) are standard in Egypt and much of the Gulf, Western digits in the Maghreb. Formatting must be an explicit locale decision that round-trips.',
    criteria: [
      'Shared formatNumber helper wrapping Intl.NumberFormat with a numberingSystem option',
      'Digits render correctly in Badge, Progress, Slider, Table and Pagination',
      'Parsing user input accepts both numeral systems when the locale allows it',
      'Copied and screen-reader-read values match the displayed value',
      'Policy documented per locale (ar-EG vs ar-MA vs ar-TN)',
    ],
  },
  {
    key: 'rtl-date-formatting',
    title: 'Add locale-aware date formatting and a calendar abstraction',
    type: 'type: i18n',
    size: 'l',
    priority: 'p2',
    summary:
      'A date picker that only knows Gregorian with Sunday-first weeks is unusable for much of the Arabic-speaking world. The calendar system must be an explicit input.',
    criteria: [
      'Date helpers wrap Intl.DateTimeFormat with calendar and timeZone options',
      'Islamic Umm al-Qura calendar supported through Intl, with a documented fallback when the runtime lacks it',
      'Week start is derived from the locale, not hard-coded to Sunday or Monday',
      'Hijri month names render in Arabic and the correct numbering',
      'Tests cover ar-EG, ar-SA (Hijri), ar-MA and en-GB',
    ],
    dependsOn: ['rtl-number-formatting'],
  },
  {
    key: 'rtl-pluralization',
    title: 'Implement Arabic plural rules for counts and messages',
    type: 'type: i18n',
    size: 'm',
    priority: 'p2',
    summary:
      'Arabic has six plural categories (zero, one, two, few, many, other). Naive `count === 1 ? … : …` strings read as broken Arabic.',
    criteria: [
      'Message helper uses Intl.PluralRules with the active locale',
      'Zero, one, two, few, many and other forms covered by unit tests with real Arabic strings',
      'Used by result counts, toast summaries and pagination ("عرض ١–٢٠ من ٢١٤")',
      'Documented for consumers who bring their own i18n library',
    ],
  },
  {
    key: 'rtl-keyboard-mapping',
    title: 'Centralise direction-aware horizontal key mapping',
    type: 'type: a11y',
    size: 's',
    priority: 'p1',
    summary:
      'Tabs, Menu, TreeView and Slider each map left/right arrows to logical previous/next. One utility, one test, no drift.',
    criteria: [
      'Utility maps ArrowLeft/ArrowRight to previous/next given the direction',
      'Vertical keys are never affected',
      'Unit tests cover both directions and both key names',
      'Adopted by Tabs, Menu, TreeView and Slider with the mapping documented in each keyboard table',
    ],
    flags: ['good first issue'],
  },
  {
    key: 'rtl-nav-direction-resolution',
    title: 'Resolve document direction on the server without a client flash',
    type: 'type: i18n',
    size: 'm',
    priority: 'p1',
    summary:
      'Direction must be correct in the first HTML byte. A client-side effect that flips dir after hydration causes a visible layout jump for RTL users.',
    criteria: [
      'Documented recipe derived from the request Accept-Language or a route segment',
      'Next.js example sets dir and lang on html server-side',
      'No use of useLayoutEffect to set direction after paint',
      'Hydration test asserts no dir change between server markup and client render',
      'Works with the DirectionProvider wrapper and without it',
    ],
  },
  {
    key: 'rtl-scroll-utils',
    title: 'Handle RTL scroll offsets consistently across browsers',
    type: 'type: i18n',
    size: 's',
    priority: 'p2',
    summary:
      'scrollLeft is negative, inverted or zero-at-right depending on browser. Carousels, tabs and virtualized tables break without an abstraction.',
    criteria: [
      'Helpers convert between visual and logical scroll positions',
      'Covered by browser tests in Chromium, Firefox and WebKit',
      'Used by the tab indicator, DataTable horizontal scroll and any scroll-into-view logic',
      'Documented with a short explanation of the three browser behaviours',
    ],
  },
  {
    key: 'rtl-ime-composition',
    title: 'Support IME composition for Arabic and other input methods',
    type: 'type: i18n',
    size: 'm',
    priority: 'p1',
    summary:
      'Updating a controlled value on every composition event corrupts Arabic diacritics and breaks candidate selection. Composition must be respected.',
    criteria: [
      'Input, Textarea and Combobox ignore value changes during composition and commit on compositionend',
      'Filtering in Combobox does not run on intermediate composition text',
      'Tests simulate compositionstart/update/end with Arabic text',
      'Behaviour documented for consumers who control the value themselves',
    ],
  },
  {
    key: 'rtl-accessible-name-terms',
    title: 'Define the Arabic accessibility terminology glossary',
    type: 'type: docs',
    size: 's',
    priority: 'p2',
    summary:
      'Translated strings for "close", "required" and "opens in a new tab" are the accessible names screen reader users hear. Inconsistent terminology is a comprehension problem.',
    criteria: [
      'Glossary of UI and accessibility terms with approved Arabic equivalents and sources',
      'All built-in strings use the glossary, with a single default message catalogue',
      'Reviewed by a native Arabic speaker with screen reader experience',
      'Consumers can override every string through the provider',
    ],
  },
  {
    key: 'rtl-screen-reader-matrix',
    title: 'Run an Arabic screen reader matrix and record the results',
    type: 'type: a11y',
    size: 'l',
    priority: 'p1',
    summary:
      'English NVDA behaviour does not prove Arabic behaviour: voice, punctuation handling and bidi reading order all change with the screen reader language.',
    criteria: [
      'Matrix covers NVDA + Firefox (ar), VoiceOver + Safari/iOS (ar), TalkBack + Chrome (ar)',
      'Scripts and recordings stored under docs/testing/screen-readers',
      'At least the 10 shipped components are covered in RTL',
      'Findings filed as issues, with severity and reproduction steps',
      'Results linked from the accessibility statement',
    ],
    dependsOn: ['a11y-sr-matrix'],
  },
  {
    key: 'rtl-visual-matrix',
    title: 'Generate RTL visual baselines for every story automatically',
    type: 'type: test',
    size: 'm',
    priority: 'p1',
    summary:
      'Direction regressions are visual. A Playwright project that screenshots every story in ar-EG makes them impossible to merge unnoticed.',
    criteria: [
      'Playwright project chromium-rtl-ar iterates all stories from the built index.json',
      'Screenshots committed for at least the foundation and shipped component stories',
      'Diff threshold documented; failures upload the actual, expected and diff images',
      'Runs in CI on pull requests, with an update command for intentional changes',
    ],
    dependsOn: ['qa-visual-regression'],
  },
  {
    key: 'rtl-mixed-content-audit',
    title: 'Audit mixed Arabic/Latin content in every component',
    type: 'type: i18n',
    size: 'm',
    priority: 'p2',
    summary:
      'Real Arabic interfaces mix scripts constantly: emails, IDs, code, URLs. Each component must be checked with realistic mixed strings, not pure Arabic.',
    criteria: [
      'Each shipped component has a story with mixed content: Arabic sentence + Latin identifier + phone number + URL',
      'Punctuation, brackets and separators stay in the expected place',
      'Screen reader reading order verified for at least three components',
      'Any component needing bdi documents why, and the fix is applied',
    ],
    dependsOn: ['rtl-bidi-component'],
  },
  {
    key: 'rtl-hijri-calendar-guidance',
    title: 'Document Hijri calendar support and its edge cases',
    type: 'type: docs',
    size: 's',
    priority: 'p3',
    summary:
      'Hijri dates are not a formatting preference: month lengths vary by convention, and Umm al-Qura differs from calculated calendars. Consumers need to know what the library does and does not promise.',
    criteria: [
      'Docs page states which calendar implementations are supported and via which API',
      'Umm al-Qura is the default for ar-SA, with the runtime reliance documented',
      'Known limitations (month boundary conventions, time zones, conversion libraries) are listed',
      'DatePicker links to the guidance from its calendar prop',
    ],
    dependsOn: ['rtl-date-formatting'],
  },
  {
    key: 'rtl-mirroring-policy',
    title: 'Publish the mirroring policy: what flips and what never does',
    type: 'type: docs',
    size: 's',
    priority: 'p2',
    summary:
      'Teams routinely over-mirror. A short, opinionated policy prevents spinning logos, backwards play buttons and mirrored charts.',
    criteria: [
      'Policy covers layout, icons, imagery, charts, progress, media controls and numbers',
      'Examples of correct and incorrect mirroring rendered side by side',
      'Linked from every component docs page through the RTL section',
      'Reviewed against the icon registry for consistency',
    ],
    dependsOn: ['rtl-icon-mirroring-audit'],
  },
  {
    key: 'rtl-logical-property-browser-check',
    title: 'Verify logical properties and inert against the browser baseline',
    type: 'type: test',
    size: 's',
    priority: 'p2',
    summary:
      'The whole strategy depends on logical properties and inert behaving consistently. That assumption deserves an explicit browser test, not a memory.',
    criteria: [
      'Playwright test asserts inset-inline-start, margin-inline-end, padding-inline and border-inline behave in RTL',
      'Test runs in Chromium, Firefox and WebKit',
      'inert behaviour tested for background content in a dialog',
      'Any divergence documented in the browser policy',
    ],
    dependsOn: ['fnd-browser-policy'],
  },
  {
    key: 'rtl-test-fixture-app',
    title: 'Build an RTL fixture app for manual and exploratory testing',
    type: 'type: test',
    size: 'm',
    priority: 'p3',
    summary:
      'Storybook isolates components; real breakage appears in composed screens. A small Arabic dashboard exercises layout, forms, tables and overlays together.',
    criteria: [
      'Fixture app renders an Arabic dashboard with navigation, a form, a data table, a dialog and toasts',
      'Runs locally with one command and deploys to Vercel for review',
      'Used in the final RTL audit and linked from the accessibility statement',
      'Includes a locale switcher to compare LTR and RTL side by side',
    ],
    dependsOn: ['rtl-visual-matrix'],
  },
  {
    key: 'rtl-docs-translation',
    title: 'Translate the core documentation into Arabic',
    type: 'type: docs',
    size: 'l',
    priority: 'p3',
    summary:
      'Arabic-speaking developers should not have to learn the library in English, especially the accessibility guidance they are being asked to trust.',
    criteria: [
      'Foundation pages and the five starter component pages translated',
      'Technical terms follow the approved glossary',
      'Language switcher preserves the current page and docs build validates both trees',
      'Translation reviewed by a native speaker and correctness-checked by a second reviewer',
    ],
    dependsOn: ['rtl-accessible-name-terms', 'docs-site-scaffold'],
  },
].map((initiative) => toIssue({ ...initiative, milestone: 'rtl' }));
