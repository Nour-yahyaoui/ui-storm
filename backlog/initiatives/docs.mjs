import { toIssue } from '../initiative.mjs';

export const DOCS = [
  {
    key: 'docs-site-scaffold',
    title: 'Scaffold the documentation site and choose its framework',
    type: 'type: docs',
    size: 'l',
    priority: 'p1',
    summary:
      'Storybook documents props; a docs site documents decisions. The framework choice affects search, versioning, MDX authoring and how examples are embedded.',
    scope: [
      'Evaluate Astro Starlight, Nextra and a custom Next.js app',
      'Requirements: MDX, full-text search, versioned docs, Arabic i18n, static export',
    ],
    criteria: [
      'ADR records the chosen framework and why the others were rejected',
      'Site builds statically with MDX pages, sidebar navigation and a working search',
      'Deployed to Vercel with a preview per pull request',
      'Storybook is embedded or linked from each component page',
      'Build fails on broken internal links',
    ],
    flags: ['needs: decision'],
  },
  {
    key: 'docs-component-template',
    title: 'Create the component documentation template',
    type: 'type: docs',
    size: 'm',
    priority: 'p1',
    summary:
      'Fifty-three docs pages must answer the same questions in the same order, or nobody will trust them.',
    criteria: [
      'Template sections: when to use, anatomy, keyboard table, ARIA contract, RTL notes, examples, common mistakes, accessibility evidence',
      'Template is an MDX file the scaffolding CLI copies',
      'A CI check verifies every component page contains the required sections',
      'Two pages written from the template as reference examples',
    ],
    dependsOn: ['fnd-scaffold'],
  },
  {
    key: 'docs-foundations-pages',
    title: 'Write the foundations docs: tokens, direction, typography and focus',
    type: 'type: docs',
    size: 'm',
    priority: 'p1',
    summary:
      'The Storybook foundation stories explain visually; the docs pages must explain the rules and how to extend them without breaking contrast or RTL.',
    criteria: [
      'Pages cover token layering, theming overrides, direction resolution and Arabic typography rules',
      'Every claim links to the test or script that enforces it',
      'Code samples are copy-pasteable and use the public API',
      'Arabic examples render in an RTL block on an otherwise English page',
    ],
  },
  {
    key: 'docs-keyboard-tables',
    title: 'Generate keyboard tables from a single source of truth',
    type: 'type: docs',
    size: 'm',
    priority: 'p2',
    summary:
      'The keyboard table in the docs, the Playwright spec and the implementation drift apart when written twice. Generate the table from the key map used by the code.',
    criteria: [
      'Key maps are declared once and exported for docs and tests',
      'A script renders the docs table from the declaration',
      'A test fails when an implemented key is missing from the map',
      'Arabic key tables render correctly in RTL',
    ],
  },
  {
    key: 'docs-a11y-statement',
    title: 'Publish an accessibility statement for the library and docs site',
    type: 'type: docs',
    size: 'm',
    priority: 'p1',
    summary:
      'A statement sets expectations: what is verified, how, with which tools, and how to report a barrier. It is also where known limitations are declared.',
    criteria: [
      'Statement covers conformance target (WCAG 2.2 AA), verification methods and dates',
      'Known limitations listed with workarounds and issue links',
      'Feedback channel with a response commitment',
      'Page itself follows the landmark, heading and contrast rules it claims',
    ],
    dependsOn: ['a11y-manual-plan'],
  },
  {
    key: 'docs-examples-sandbox',
    title: 'Make every docs example runnable in a sandbox',
    type: 'type: docs',
    size: 'm',
    priority: 'p2',
    summary:
      'Examples that cannot be run are examples that are wrong. A sandbox link per example removes the first integration failure.',
    criteria: [
      'StackBlitz (or equivalent) links generated from example sources at build time',
      'Sandbox projects install the published package version, not the local source',
      'Examples include an RTL toggle where relevant',
      'Link checker verifies sandbox URLs respond',
    ],
    dependsOn: ['docs-site-scaffold'],
  },
  {
    key: 'docs-search',
    title: 'Add full-text search with Arabic support',
    type: 'type: docs',
    size: 'm',
    priority: 'p2',
    summary:
      'Search that cannot find Arabic content, or that fails on diacritics, is worse than no search for the audience this library targets.',
    criteria: [
      'Search index includes Arabic pages and normalises diacritics and alef variants',
      'Keyboard accessible: open with a shortcut, arrow navigation, Escape to close',
      'Results announce the count politely',
      'Search UI meets the same a11y bar as the components (it is built with them)',
    ],
    dependsOn: ['docs-site-scaffold'],
  },
  {
    key: 'docs-link-checker',
    title: 'Add link and anchor checking to the docs build',
    type: 'type: chore',
    size: 's',
    priority: 'p1',
    summary:
      'Documentation rots from the outside in: broken links, dead anchors and stale issue references. Check them mechanically.',
    criteria: [
      'Internal links and anchors verified on every build',
      'External links checked on a schedule with an allowlist for known bot-blocking hosts',
      'Failures annotate the pull request with the file and the broken target',
      'No network calls in the critical path of a pull request build',
    ],
    flags: ['good first issue'],
  },
  {
    key: 'docs-llms-txt',
    title: 'Publish llms.txt and machine-readable API summaries',
    type: 'type: docs',
    size: 's',
    priority: 'p3',
    summary:
      'Developers increasingly ask an assistant to integrate a library. Machine-readable docs reduce hallucinated props and fake ARIA attributes.',
    criteria: [
      'llms.txt lists canonical docs pages with one-line summaries',
      'Generated API summary includes prop types, defaults and the accessibility contract per component',
      'Files are generated at build time so they cannot go stale',
      'A note asks assistants to prefer the generated contract over guessing',
    ],
  },
  {
    key: 'docs-api-tables',
    title: 'Generate API tables from TypeScript types',
    type: 'type: docs',
    size: 'm',
    priority: 'p2',
    summary:
      'Hand-written prop tables drift within a week. Types are the source of truth and should produce the table.',
    criteria: [
      'Props tables generated from the exported types during docs build',
      'Deprecated props show a migration hint',
      'Descriptions come from TSDoc comments on the props',
      'Build fails when a public prop has no documentation comment',
    ],
    dependsOn: ['docs-site-scaffold'],
  },
  {
    key: 'docs-arabic-translation',
    title: 'Add the Arabic docs locale with an RTL-aware layout',
    type: 'type: docs',
    size: 'l',
    priority: 'p3',
    summary:
      'An Arabic docs tree proves the library in its own medium: the documentation site becomes a real RTL application with code samples that must stay LTR.',
    criteria: [
      'Docs site supports /ar routes with dir="rtl" set server-side',
      'Code blocks, tables and screenshots stay LTR and correctly isolated',
      'Language switcher preserves the current page',
      'Translation workflow documented with review requirements',
    ],
    dependsOn: ['docs-site-scaffold', 'rtl-docs-translation'],
  },
  {
    key: 'docs-versioning',
    title: 'Version the documentation and keep old versions buildable',
    type: 'type: docs',
    size: 'm',
    priority: 'p2',
    summary:
      'Once 1.0 ships, users on older versions need matching docs. Retrofitting versioning later means broken permalinks.',
    criteria: [
      'Docs build supports a version selector with at least current and previous minor',
      'Versioned URLs are stable and redirect from the unversioned path',
      'Deployment builds all supported versions from tags',
      'A deprecation banner links to the upgrade guide',
    ],
    dependsOn: ['docs-site-scaffold'],
  },
  {
    key: 'docs-migration-guides',
    title: 'Write migration guides from MUI, Chakra UI and shadcn/ui',
    type: 'type: docs',
    size: 'm',
    priority: 'p2',
    summary:
      'Most adopters arrive with an existing component library. A concrete mapping of props and accessibility differences shortens evaluation.',
    criteria: [
      'Side-by-side translation tables for Button, Input, Checkbox, Dialog and Tabs',
      'Explicit list of behaviours that differ (focus management, RTL, disabled semantics)',
      'Automated codemod where the mapping is mechanical',
      'Example migration shown for one real screen',
    ],
    dependsOn: ['button-api', 'input-api', 'checkbox-api', 'dialog-api', 'tabs-api'],
  },
  {
    key: 'docs-changelog',
    title: 'Publish a human-readable changelog from changesets',
    type: 'type: docs',
    size: 's',
    priority: 'p2',
    summary:
      'Generated release notes are accurate but unreadable. A curated summary per release is what users actually scan for breaking changes.',
    criteria: [
      'Changelog page groups changes by Added, Changed, Fixed and Breaking',
      'Each entry links to the pull request and the docs page',
      'Breaking changes include the migration snippet inline',
      'Generated automatically on release, with an editable summary block',
    ],
    dependsOn: ['rel-changesets'],
  },
  {
    key: 'docs-storybook-embed',
    title: 'Embed live stories in the docs pages',
    type: 'type: docs',
    size: 'm',
    priority: 'p2',
    summary:
      'Static screenshots go stale. Embedded stories keep the documented state and the shipped state identical.',
    criteria: [
      'Docs pages render the Storybook story in an iframe with the correct theme and locale',
      'Embedded stories are keyboard reachable and do not trap focus inside the docs page',
      'Loading is lazy to keep the docs fast on slow connections',
      'A fallback link opens the story in Storybook when the embed fails',
    ],
    dependsOn: ['docs-site-scaffold'],
  },
  {
    key: 'docs-contribution-guide',
    title: 'Document how to write docs (voice, structure, examples)',
    type: 'type: docs',
    size: 's',
    priority: 'p3',
    summary:
      'Contributors need to know that an example must be accessible, that Arabic examples are required, and that claims need evidence.',
    criteria: [
      'Guide covers voice, structure, code sample rules and evidence links',
      'Rules state that every accessibility claim links to a test or an audit',
      'Review checklist included for docs pull requests',
      'Linked from CONTRIBUTING and the PR template',
    ],
  },
].map((initiative) => toIssue({ ...initiative, milestone: 'docs' }));
