import { toIssue } from '../initiative.mjs';

export const DX = [
  {
    key: 'dx-theming',
    title: 'Document the theming API and token override contract',
    type: 'type: docs',
    size: 'm',
    priority: 'p1',
    summary:
      'Every adopter wants their brand colors. Overriding tokens must be supported, contrast-checked and impossible to do in a way that breaks accessibility silently.',
    criteria: [
      'Theming guide shows brand color overrides, dark mode, and the contrast check to run afterwards',
      'Overrides documented through the token layer so components need no changes',
      'A script validates consumer token files against the contrast thresholds',
      'Example theme committed and rendered in Storybook',
    ],
  },
  {
    key: 'dx-dark-mode',
    title: 'Ship a dark mode recipe with no first-paint flash',
    type: 'type: feature',
    size: 'm',
    priority: 'p1',
    summary:
      'Theme switching is easy; doing it without a white flash or a hydration mismatch is the part that needs a documented pattern.',
    criteria: [
      'Recipe covers system preference, explicit override and persistence in localStorage',
      'Inline blocking script documented for SSR frameworks, with a CSP nonce example',
      'Toggle component announced correctly (pressed state and label)',
      'Test asserts no theme flicker between server markup and hydration',
    ],
  },
  {
    key: 'dx-high-contrast-theme',
    title: 'Provide a high-contrast theme beyond forced-colors support',
    type: 'type: design',
    size: 'm',
    priority: 'p2',
    summary:
      'Forced-colors mode covers Windows users, but low-vision users on macOS and mobile also need a stronger palette. A high-contrast token set is the answer.',
    criteria: [
      'High-contrast token set meets AAA (7:1) for body text and 4.5:1 for large text',
      'Borders and focus rings strengthen without changing layout',
      'Contrast script extended with a high-contrast profile and passing',
      'Storybook theme toolbar exposes the mode for review',
    ],
    dependsOn: ['dx-theming'],
  },
  {
    key: 'dx-nextjs-guide',
    title: 'Write the Next.js App Router integration guide',
    type: 'type: docs',
    size: 'm',
    priority: 'p1',
    summary:
      'Server Components change where providers live, which components must be client components, and how locale/direction are resolved. Adopters need the exact pattern.',
    criteria: [
      'Guide shows layout.tsx setting lang/dir from the request locale',
      'Client boundary documented per component (which need "use client")',
      'Example repository builds and deploys with RTL and dark mode',
      'Common hydration errors listed with their fixes',
    ],
    dependsOn: ['rtl-nav-direction-resolution'],
  },
  {
    key: 'dx-framework-guides',
    title: 'Add Vite, Remix and plain React integration guides',
    type: 'type: docs',
    size: 'm',
    priority: 'p2',
    summary:
      'Most teams are not on Next.js. The stylesheet import, provider setup and SSR notes differ enough to need their own pages.',
    criteria: [
      'Vite guide covers stylesheet import and provider placement',
      'Remix guide covers SSR direction resolution and hydration',
      'Each guide has a working minimal example and a screenshot',
      'Guides are tested by the tarball fixture where practical',
    ],
  },
  {
    key: 'dx-tailwind-usage',
    title: 'Document using the library alongside a consumer Tailwind build',
    type: 'type: docs',
    size: 's',
    priority: 'p2',
    summary:
      'Consumers with their own Tailwind setup need to know how the library stylesheet coexists, how to opt out of preflight, and how tokens are exposed.',
    criteria: [
      'Guide explains the compiled stylesheet vs token-only consumption',
      'Preflight opt-out documented with its consequences',
      'Token utilities shown in a consumer Tailwind v4 config',
      'A fixture app verifies the documented setup',
    ],
  },
  {
    key: 'dx-figma-sync',
    title: 'Sync design tokens from Figma and detect drift',
    type: 'type: chore',
    size: 'l',
    priority: 'p3',
    summary:
      'Tokens that live in two places diverge. A generated bridge from Figma variables to CSS custom properties keeps design and code honest.',
    criteria: [
      'Token export format agreed with design and committed',
      'Script generates a diff report between Figma variables and tokens.css',
      'Drift fails CI or opens a scheduled issue, depending on severity',
      'Naming conventions documented so new tokens map predictably',
    ],
    dependsOn: ['dx-theming'],
  },
  {
    key: 'dx-icons-integration',
    title: 'Document integrating third-party icon sets',
    type: 'type: docs',
    size: 's',
    priority: 'p3',
    summary:
      'Consumers bring Lucide, Heroicons or Phosphor. The mirroring rules and aria-hidden defaults must apply to those too.',
    criteria: [
      'Guide shows wrapping an external icon in the Icon primitive',
      'Mirroring registry extended for consumer icons through a helper',
      'Accessible name guidance for icon-only usage repeated in the guide',
      'Example with at least two icon libraries',
    ],
    dependsOn: ['fnd-icons'],
  },
  {
    key: 'dx-playground',
    title: 'Build an interactive props playground on the docs site',
    type: 'type: feature',
    size: 'm',
    priority: 'p3',
    summary:
      'A live props editor shortens evaluation from hours to minutes, especially for RTL questions where reviewers want to see the switch immediately.',
    criteria: [
      'Playground renders the component with editable props and an RTL toggle',
      'Generated code block matches the current props and is copyable',
      'Playground is keyboard accessible and announces changes',
      'Built on the same stories, so it cannot drift from Storybook',
    ],
    dependsOn: ['docs-site-scaffold'],
  },
  {
    key: 'dx-starter-template',
    title: 'Publish a starter template with RTL and dark mode preconfigured',
    type: 'type: chore',
    size: 'm',
    priority: 'p2',
    summary:
      'A template that already sets dir, lang, theme and providers removes the most common integration mistakes.',
    criteria: [
      'Template repository uses Vite or Next.js with the library installed from npm',
      'Direction resolution, dark mode and providers configured',
      'Deployed demo linked from the docs homepage',
      'Template dependencies updated automatically and build-checked weekly',
    ],
    dependsOn: ['dx-nextjs-guide'],
  },
  {
    key: 'dx-codemods',
    title: 'Set up a codemod pipeline for breaking changes',
    type: 'type: chore',
    size: 'm',
    priority: 'p3',
    summary:
      'Renamed props are cheap to fix mechanically. Shipping a codemod with each breaking change keeps upgrade friction low and makes breaking changes less scary.',
    criteria: [
      'jscodeshift (or equivalent) infrastructure with a test harness',
      'First codemod written for a real rename and documented in the migration guide',
      'Codemods are published with the package and runnable with one command',
      'Each codemod has before/after fixtures in its test',
    ],
  },
  {
    key: 'dx-contributor-guide',
    title: 'Write a contributor guide specific to accessibility work',
    type: 'type: docs',
    size: 'm',
    priority: 'p1',
    summary:
      'Contributors need to know that a component PR includes tests, stories, docs, a changeset and a manual screen reader pass, and how to run all of it.',
    criteria: [
      'Guide covers setup, scripts, component lifecycle and the definition of done',
      'Explains how to test with a screen reader, including free options per OS',
      'Explains the RTL checks and how to run the Arabic stories',
      'Linked from the README, PR template and issue template',
    ],
  },
  {
    key: 'dx-translation-workflow',
    title: 'Document the Arabic translation and review workflow',
    type: 'type: docs',
    size: 's',
    priority: 'p2',
    summary:
      'Translated UI strings need a native reviewer and a glossary, otherwise the accessible names drift into machine-translated Arabic.',
    criteria: [
      'Workflow covers string extraction, translation, review and release',
      'Review requirements state that a native speaker with a screen reader must approve accessible names',
      'Glossary referenced by the workflow',
      'Contribution instructions in both English and Arabic',
    ],
  },
  {
    key: 'dx-triage-sla',
    title: 'Set an accessibility bug triage policy and response target',
    type: 'type: docs',
    size: 's',
    priority: 'p2',
    summary:
      'Accessibility bugs reported by users deserve a stated response time, severity scale and fix commitment — the same as security issues get.',
    criteria: [
      'Severity scale defined with examples (blocker for screen reader users, cosmetic, etc.)',
      'Response and fix targets per severity documented in the issue template',
      'Labels and a pinned issue explain the process',
      'Metrics reviewed monthly and reported in the changelog',
    ],
    dependsOn: ['dx-contributor-guide'],
  },
  {
    key: 'dx-user-research',
    title: 'Run usability sessions with Arabic screen reader users',
    type: 'type: a11y',
    size: 'l',
    priority: 'p2',
    summary:
      'Automated checks and expert review miss how real Arabic-speaking screen reader users actually move through a form or dialog. A small study changes priorities.',
    criteria: [
      'Session plan with tasks covering a form, a dialog and a tabbed page in Arabic',
      'At least three participants using their own assistive technology',
      'Findings documented with severity and prioritized into the backlog',
      'Follow-up session after fixes to confirm improvement',
    ],
    dependsOn: ['rtl-screen-reader-matrix'],
  },
  {
    key: 'dx-hydration-guide',
    title: 'Write the hydration troubleshooting guide',
    type: 'type: docs',
    size: 's',
    priority: 'p2',
    summary:
      'Direction, theme and portals are the three sources of hydration mismatches in this library. A guide that names them saves hours of debugging.',
    criteria: [
      'Guide lists the symptoms, cause and fix for each known mismatch',
      'Includes the exact warning text React prints',
      'Shows the correct server-side setup for direction and theme',
      'Links to the SSR test suite that prevents regressions',
    ],
    dependsOn: ['fnd-ssr-harness'],
  },
].map((initiative) => toIssue({ ...initiative, milestone: 'dx' }));
